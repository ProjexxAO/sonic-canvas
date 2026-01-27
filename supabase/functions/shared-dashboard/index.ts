/**
 * Shared Dashboard Service
 * Multi-user collaborative workspace with real-time sync
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ServiceLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Type Definitions
// ============================================================================

interface Dashboard {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  org_id?: string;
  team_id?: string;
  visibility: 'private' | 'team' | 'org' | 'public';
  layout: DashboardLayout;
  widgets: Widget[];
  collaborators: Collaborator[];
  created_at: string;
  updated_at: string;
}

interface DashboardLayout {
  columns: number;
  rows: number;
  positions: Record<string, { x: number; y: number; w: number; h: number }>;
}

interface Widget {
  id: string;
  type: 'agent_status' | 'task_progress' | 'metrics_chart' | 'activity_feed' | 'leaderboard' | 'custom';
  title: string;
  config: Record<string, unknown>;
  data_source: string;
  refresh_interval: number;
}

interface Collaborator {
  user_id: string;
  role: 'viewer' | 'editor' | 'admin';
  added_at: string;
  added_by: string;
}

interface DashboardRequest {
  action: 'create' | 'get' | 'update' | 'delete' | 'list' | 'share' | 'add_widget' | 'remove_widget' | 'get_data';
  user_id: string;
  dashboard_id?: string;
  dashboard?: Partial<Dashboard>;
  widget?: Widget;
  widget_id?: string;
  share_settings?: { user_id: string; role: Collaborator['role'] };
  org_id?: string;
  team_id?: string;
}

interface AggregatedMetrics {
  total_agents: number;
  active_agents: number;
  total_tasks: number;
  completed_tasks: number;
  success_rate: number;
  avg_response_time: number;
  top_performers: { agent_id: string; name: string; score: number }[];
}

// ============================================================================
// Dashboard Operations
// ============================================================================

async function createDashboard(
  supabase: SupabaseClient,
  userId: string,
  dashboardData: Partial<Dashboard>,
  logger: ServiceLogger
): Promise<Dashboard> {
  await logger.info('Creating shared dashboard', { user_id: userId });

  const defaultLayout: DashboardLayout = {
    columns: 12,
    rows: 8,
    positions: {},
  };

  const defaultWidgets: Widget[] = [
    {
      id: crypto.randomUUID(),
      type: 'agent_status',
      title: 'Agent Status Overview',
      config: {},
      data_source: 'sonic_agents',
      refresh_interval: 30,
    },
    {
      id: crypto.randomUUID(),
      type: 'task_progress',
      title: 'Task Progress',
      config: {},
      data_source: 'agent_task_queue',
      refresh_interval: 60,
    },
  ];

  const dashboardId = crypto.randomUUID();

  const { data, error } = await supabase
    .from('shared_dashboards')
    .insert({
      id: dashboardId,
      name: dashboardData.name ?? 'Untitled Dashboard',
      description: dashboardData.description ?? '',
      created_by: userId,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create dashboard: ${error.message}`);
  }

  // Add owner as member
  await supabase.from('shared_dashboard_members').insert({
    dashboard_id: dashboardId,
    user_id: userId,
    role: 'owner',
    can_comment: true,
    can_share: true,
    can_upload: true,
  });

  // Return enriched dashboard
  return {
    ...data,
    owner_id: userId,
    visibility: dashboardData.visibility ?? 'private',
    layout: dashboardData.layout ?? defaultLayout,
    widgets: dashboardData.widgets ?? defaultWidgets,
    collaborators: [{ user_id: userId, role: 'admin', added_at: new Date().toISOString(), added_by: userId }],
  };
}

async function getDashboard(
  supabase: SupabaseClient,
  dashboardId: string,
  userId: string,
  logger: ServiceLogger
): Promise<Dashboard | null> {
  await logger.info('Fetching dashboard', { dashboard_id: dashboardId });

  const { data, error } = await supabase
    .from('shared_dashboards')
    .select('*')
    .eq('id', dashboardId)
    .single();

  if (error || !data) {
    return null;
  }

  // Check access permissions via members table
  const { data: membership } = await supabase
    .from('shared_dashboard_members')
    .select('role')
    .eq('dashboard_id', dashboardId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership && data.created_by !== userId) {
    throw new Error('Access denied to this dashboard');
  }

  // Get all members as collaborators
  const { data: members } = await supabase
    .from('shared_dashboard_members')
    .select('user_id, role, joined_at')
    .eq('dashboard_id', dashboardId);

  return {
    ...data,
    owner_id: data.created_by,
    visibility: 'private',
    layout: { columns: 12, rows: 8, positions: {} },
    widgets: [],
    collaborators: (members ?? []).map(m => ({
      user_id: m.user_id,
      role: m.role === 'owner' ? 'admin' : m.role,
      added_at: m.joined_at,
      added_by: data.created_by,
    })),
  };
}

async function updateDashboard(
  supabase: SupabaseClient,
  dashboardId: string,
  userId: string,
  updates: Partial<Dashboard>,
  logger: ServiceLogger
): Promise<Dashboard> {
  await logger.info('Updating dashboard', { dashboard_id: dashboardId });

  // Verify edit permissions
  const { data: membership } = await supabase
    .from('shared_dashboard_members')
    .select('role')
    .eq('dashboard_id', dashboardId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership || !['owner', 'admin', 'editor'].includes(membership.role)) {
    throw new Error('You do not have permission to edit this dashboard');
  }

  const { data, error } = await supabase
    .from('shared_dashboards')
    .update({
      name: updates.name,
      description: updates.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dashboardId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update dashboard: ${error.message}`);
  }

  const dashboard = await getDashboard(supabase, dashboardId, userId, logger);
  return dashboard!;
}

async function listDashboards(
  supabase: SupabaseClient,
  userId: string,
  _orgId?: string,
  _teamId?: string,
  logger?: ServiceLogger
): Promise<Dashboard[]> {
  await logger?.info('Listing dashboards', { user_id: userId });

  // Get dashboards user is a member of
  const { data: memberships } = await supabase
    .from('shared_dashboard_members')
    .select('dashboard_id')
    .eq('user_id', userId);

  const dashboardIds = memberships?.map(m => m.dashboard_id) ?? [];

  if (dashboardIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('shared_dashboards')
    .select('*')
    .in('id', dashboardIds)
    .eq('is_active', true)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list dashboards: ${error.message}`);
  }

  return (data ?? []).map(d => ({
    ...d,
    owner_id: d.created_by,
    visibility: 'private' as const,
    layout: { columns: 12, rows: 8, positions: {} },
    widgets: [],
    collaborators: [],
  }));
}

async function shareDashboard(
  supabase: SupabaseClient,
  dashboardId: string,
  userId: string,
  shareUserId: string,
  role: Collaborator['role'],
  logger: ServiceLogger
): Promise<{ success: boolean }> {
  await logger.info('Sharing dashboard', { dashboard_id: dashboardId, share_with: shareUserId });

  // Check if user is admin/owner
  const { data: membership } = await supabase
    .from('shared_dashboard_members')
    .select('role')
    .eq('dashboard_id', dashboardId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Only admins can share this dashboard');
  }

  // Add or update member
  const { error } = await supabase
    .from('shared_dashboard_members')
    .upsert({
      dashboard_id: dashboardId,
      user_id: shareUserId,
      role: role,
      can_comment: true,
      can_share: role === 'admin',
      can_upload: role !== 'viewer',
    });

  if (error) {
    throw new Error(`Failed to share dashboard: ${error.message}`);
  }

  return { success: true };
}

async function addWidget(
  supabase: SupabaseClient,
  dashboardId: string,
  userId: string,
  widget: Widget,
  logger: ServiceLogger
): Promise<Dashboard> {
  await logger.info('Adding widget', { dashboard_id: dashboardId, widget_type: widget.type });

  // For now, just return the dashboard - widget storage would need a separate table
  const dashboard = await getDashboard(supabase, dashboardId, userId, logger);
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }

  // TODO: Store widget in dedicated widgets table
  return dashboard;
}

async function removeWidget(
  supabase: SupabaseClient,
  dashboardId: string,
  userId: string,
  widgetId: string,
  logger: ServiceLogger
): Promise<Dashboard> {
  await logger.info('Removing widget', { dashboard_id: dashboardId, widget_id: widgetId });

  const dashboard = await getDashboard(supabase, dashboardId, userId, logger);
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }

  // TODO: Remove widget from dedicated widgets table
  return dashboard;
}

async function getDashboardData(
  supabase: SupabaseClient,
  dashboardId: string,
  userId: string,
  logger: ServiceLogger
): Promise<{ metrics: AggregatedMetrics; widget_data: Record<string, any> }> {
  await logger.info('Fetching dashboard data', { dashboard_id: dashboardId });

  const dashboard = await getDashboard(supabase, dashboardId, userId, logger);
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }

  // Aggregate metrics from sonic_agents and agent_task_queue
  const { data: agents } = await supabase
    .from('sonic_agents')
    .select('id, name, status, success_rate')
    .eq('user_id', userId)
    .limit(100);

  const { data: tasks } = await supabase
    .from('agent_task_queue')
    .select('id, status')
    .eq('user_id', userId)
    .limit(100);

  const activeAgents = agents?.filter(a => a.status === 'ACTIVE') ?? [];
  const completedTasks = tasks?.filter(t => t.status === 'completed') ?? [];

  const metrics: AggregatedMetrics = {
    total_agents: agents?.length ?? 0,
    active_agents: activeAgents.length,
    total_tasks: tasks?.length ?? 0,
    completed_tasks: completedTasks.length,
    success_rate: tasks?.length ? (completedTasks.length / tasks.length) * 100 : 0,
    avg_response_time: 250,
    top_performers: (agents ?? [])
      .sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
      .slice(0, 5)
      .map(a => ({ agent_id: a.id, name: a.name, score: a.success_rate ?? 0 })),
  };

  // Widget data placeholders
  const widget_data: Record<string, any> = {};

  for (const widget of dashboard.widgets ?? []) {
    switch (widget.type) {
      case 'agent_status':
        widget_data[widget.id] = agents;
        break;
      case 'task_progress':
        widget_data[widget.id] = tasks;
        break;
      case 'leaderboard':
        widget_data[widget.id] = metrics.top_performers;
        break;
      default:
        widget_data[widget.id] = null;
    }
  }

  return { metrics, widget_data };
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const request: DashboardRequest = await req.json();

    if (!request.user_id) {
      throw new Error('user_id is required');
    }

    const logger = new ServiceLogger(
      supabase,
      requestId,
      request.user_id,
      request.org_id ?? null,
      'shared-dashboard'
    );

    await logger.info(`Processing ${request.action} request`);

    let result: any;

    switch (request.action) {
      case 'create':
        result = { success: true, dashboard: await createDashboard(supabase, request.user_id, request.dashboard ?? {}, logger) };
        break;

      case 'get':
        if (!request.dashboard_id) throw new Error('dashboard_id required');
        result = { success: true, dashboard: await getDashboard(supabase, request.dashboard_id, request.user_id, logger) };
        break;

      case 'update':
        if (!request.dashboard_id || !request.dashboard) throw new Error('dashboard_id and dashboard required');
        result = { success: true, dashboard: await updateDashboard(supabase, request.dashboard_id, request.user_id, request.dashboard, logger) };
        break;

      case 'delete':
        if (!request.dashboard_id) throw new Error('dashboard_id required');
        // Soft delete by setting is_active to false
        await supabase.from('shared_dashboards').update({ is_active: false }).eq('id', request.dashboard_id);
        result = { success: true };
        break;

      case 'list':
        result = { success: true, dashboards: await listDashboards(supabase, request.user_id, request.org_id, request.team_id, logger) };
        break;

      case 'share':
        if (!request.dashboard_id || !request.share_settings) throw new Error('dashboard_id and share_settings required');
        result = await shareDashboard(supabase, request.dashboard_id, request.user_id, request.share_settings.user_id, request.share_settings.role, logger);
        break;

      case 'add_widget':
        if (!request.dashboard_id || !request.widget) throw new Error('dashboard_id and widget required');
        result = { success: true, dashboard: await addWidget(supabase, request.dashboard_id, request.user_id, request.widget, logger) };
        break;

      case 'remove_widget':
        if (!request.dashboard_id || !request.widget_id) throw new Error('dashboard_id and widget_id required');
        result = { success: true, dashboard: await removeWidget(supabase, request.dashboard_id, request.user_id, request.widget_id, logger) };
        break;

      case 'get_data':
        if (!request.dashboard_id) throw new Error('dashboard_id required');
        result = { success: true, ...(await getDashboardData(supabase, request.dashboard_id, request.user_id, logger)) };
        break;

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    const duration = Date.now() - startTime;
    await logger.info('Operation completed', { action: request.action, duration_ms: duration });

    return new Response(JSON.stringify({
      ...result,
      metadata: {
        request_id: requestId,
        service: 'shared-dashboard',
        action: request.action,
        processing_time_ms: duration,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Shared Dashboard] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'SHARED_DASHBOARD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: requestId,
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
