/**
 * Personal Hub Service
 * Unified personal workspace for user-centric agent interactions
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

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notification_settings: {
    email: boolean;
    push: boolean;
    in_app: boolean;
    digest_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  };
  dashboard_layout: string[];
  favorite_agents: string[];
  pinned_tasks: string[];
}

interface PersonalStats {
  total_tasks_completed: number;
  active_agents: number;
  total_interactions: number;
  productivity_score: number;
  streak_days: number;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  earned_at: string;
  icon: string;
}

interface ActivityFeedItem {
  id: string;
  type: 'task_completed' | 'agent_update' | 'achievement' | 'insight' | 'recommendation';
  title: string;
  description: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface HubRequest {
  action: 'get_dashboard' | 'update_preferences' | 'get_activity' | 'get_stats' | 'get_recommendations' | 'quick_action';
  user_id: string;
  preferences?: Partial<UserPreferences>;
  limit?: number;
  quick_action_type?: string;
  quick_action_params?: Record<string, unknown>;
}

// ============================================================================
// Hub Operations
// ============================================================================

async function getDashboard(
  supabase: SupabaseClient,
  userId: string,
  logger: ServiceLogger
): Promise<{
  preferences: UserPreferences;
  stats: PersonalStats;
  recent_activity: ActivityFeedItem[];
  active_tasks: any[];
  favorite_agents: any[];
}> {
  await logger.info('Loading personal dashboard', { user_id: userId });

  // Fetch user preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('user_id', userId)
    .maybeSingle();

  const defaultPreferences: UserPreferences = {
    theme: 'auto',
    language: 'en',
    timezone: 'UTC',
    notification_settings: {
      email: true,
      push: true,
      in_app: true,
      digest_frequency: 'daily',
    },
    dashboard_layout: ['stats', 'activity', 'agents', 'tasks'],
    favorite_agents: [],
    pinned_tasks: [],
  };

  const preferences = { ...defaultPreferences, ...profile?.preferences };

  // Fetch stats from agent_task_queue instead of sonic_tasks
  const { data: taskStats } = await supabase
    .from('agent_task_queue')
    .select('id, status')
    .eq('user_id', userId);

  const completedTasks = taskStats?.filter(t => t.status === 'completed').length ?? 0;

  const { data: agents } = await supabase
    .from('sonic_agents')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');

  // User achievements would need a dedicated table - for now return empty
  const achievements: Achievement[] = [];

  const stats: PersonalStats = {
    total_tasks_completed: completedTasks,
    active_agents: agents?.length ?? 0,
    total_interactions: completedTasks * 3, // Approximation
    productivity_score: Math.min(100, Math.round(completedTasks * 2.5)),
    streak_days: 1, // Would calculate from actual data
    achievements,
  };

  // Fetch recent activity
  const { data: events } = await supabase
    .from('agent_learning_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const recent_activity: ActivityFeedItem[] = (events ?? []).map(e => ({
    id: e.id,
    type: 'agent_update' as const,
    title: e.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    description: JSON.stringify(e.event_data).substring(0, 100),
    timestamp: e.created_at,
    metadata: e.event_data ?? {},
  }));

  // Fetch active tasks from agent_task_queue
  const { data: activeTasks } = await supabase
    .from('agent_task_queue')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch favorite agents
  const favoriteAgentIds = preferences.favorite_agents;
  let favoriteAgents: any[] = [];
  
  if (favoriteAgentIds.length > 0) {
    const { data } = await supabase
      .from('sonic_agents')
      .select('*')
      .in('id', favoriteAgentIds);
    favoriteAgents = data ?? [];
  }

  return {
    preferences,
    stats,
    recent_activity,
    active_tasks: activeTasks ?? [],
    favorite_agents: favoriteAgents,
  };
}

async function updatePreferences(
  supabase: SupabaseClient,
  userId: string,
  newPreferences: Partial<UserPreferences>,
  logger: ServiceLogger
): Promise<{ success: boolean; preferences: UserPreferences }> {
  await logger.info('Updating user preferences', { user_id: userId });

  const { data: existing } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('user_id', userId)
    .maybeSingle();

  const mergedPreferences = {
    ...existing?.preferences,
    ...newPreferences,
    notification_settings: {
      ...existing?.preferences?.notification_settings,
      ...newPreferences.notification_settings,
    },
  };

  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      preferences: mergedPreferences,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`);
  }

  return { success: true, preferences: mergedPreferences as UserPreferences };
}

async function getActivityFeed(
  supabase: SupabaseClient,
  userId: string,
  limit: number,
  logger: ServiceLogger
): Promise<ActivityFeedItem[]> {
  await logger.info('Fetching activity feed', { user_id: userId, limit });

  const activities: ActivityFeedItem[] = [];

  // Get task completions from agent_task_queue
  const { data: tasks } = await supabase
    .from('agent_task_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(Math.floor(limit / 2));

  for (const task of tasks ?? []) {
    activities.push({
      id: task.id,
      type: 'task_completed',
      title: 'Task Completed',
      description: task.task_description?.substring(0, 100) ?? 'Task finished successfully',
      timestamp: task.updated_at,
      metadata: { task_id: task.id, task_type: task.task_type },
    });
  }

  // Get agent updates
  const { data: agentUpdates } = await supabase
    .from('agent_learning_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.floor(limit / 2));

  for (const update of agentUpdates ?? []) {
    activities.push({
      id: update.id,
      type: 'agent_update',
      title: 'Agent Evolution',
      description: `${update.event_type.replace(/_/g, ' ')}`,
      timestamp: update.created_at,
      metadata: update.event_data ?? {},
    });
  }

  // Sort by timestamp and limit
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

async function getRecommendations(
  supabase: SupabaseClient,
  userId: string,
  logger: ServiceLogger
): Promise<{
  suggested_tasks: any[];
  agent_recommendations: any[];
  productivity_tips: string[];
}> {
  await logger.info('Generating recommendations', { user_id: userId });

  // Get user's task history from agent_task_queue
  const { data: recentTasks } = await supabase
    .from('agent_task_queue')
    .select('task_type, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Analyze patterns
  const taskTypes = recentTasks?.map(t => t.task_type) ?? [];
  const typeFrequency: Record<string, number> = {};
  for (const type of taskTypes) {
    typeFrequency[type] = (typeFrequency[type] || 0) + 1;
  }

  // Get underutilized agents
  const { data: agents } = await supabase
    .from('sonic_agents')
    .select('*')
    .eq('user_id', userId)
    .order('total_tasks_completed', { ascending: true })
    .limit(3);

  const productivity_tips = [
    'Schedule complex tasks for your peak productivity hours',
    'Break large tasks into smaller, manageable pieces',
    'Use batch processing for similar task types',
    'Review agent performance weekly for optimization',
    'Leverage multi-agent collaboration for complex projects',
  ];

  return {
    suggested_tasks: [
      { type: 'data_analysis', reason: 'High success rate with your agents' },
      { type: 'content_creation', reason: 'Trending task type this week' },
    ],
    agent_recommendations: agents ?? [],
    productivity_tips: productivity_tips.slice(0, 3),
  };
}

async function executeQuickAction(
  supabase: SupabaseClient,
  userId: string,
  actionType: string,
  params: Record<string, unknown>,
  logger: ServiceLogger
): Promise<{ success: boolean; result: any }> {
  await logger.info('Executing quick action', { user_id: userId, action: actionType });

  switch (actionType) {
    case 'create_task':
      const { data: task, error: taskError } = await supabase
        .from('agent_task_queue')
        .insert({
          user_id: userId,
          task_type: (params.task_type as string) ?? 'general',
          task_title: (params.title as string) ?? 'Quick task',
          task_description: (params.description as string) ?? 'Quick task',
          task_priority: (params.priority as string) ?? 'medium',
          status: 'pending',
        })
        .select()
        .single();

      if (taskError) throw new Error(taskError.message);
      return { success: true, result: { task } };

    case 'pause_agents':
      const { error: pauseError } = await supabase
        .from('sonic_agents')
        .update({ status: 'DORMANT' })
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      if (pauseError) throw new Error(pauseError.message);
      return { success: true, result: { message: 'All agents paused' } };

    case 'resume_agents':
      const { error: resumeError } = await supabase
        .from('sonic_agents')
        .update({ status: 'ACTIVE' })
        .eq('user_id', userId)
        .eq('status', 'DORMANT');

      if (resumeError) throw new Error(resumeError.message);
      return { success: true, result: { message: 'All agents resumed' } };

    default:
      throw new Error(`Unknown quick action: ${actionType}`);
  }
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
    const request: HubRequest = await req.json();

    if (!request.user_id) {
      throw new Error('user_id is required');
    }

    const logger = new ServiceLogger(
      supabase,
      requestId,
      request.user_id,
      null,
      'personal-hub'
    );

    await logger.info(`Processing ${request.action} request`);

    let result: any;

    switch (request.action) {
      case 'get_dashboard':
        result = await getDashboard(supabase, request.user_id, logger);
        break;

      case 'update_preferences':
        if (!request.preferences) throw new Error('preferences required');
        result = await updatePreferences(supabase, request.user_id, request.preferences, logger);
        break;

      case 'get_activity':
        const activities = await getActivityFeed(supabase, request.user_id, request.limit ?? 20, logger);
        result = { success: true, activities };
        break;

      case 'get_stats':
        const dashboard = await getDashboard(supabase, request.user_id, logger);
        result = { success: true, stats: dashboard.stats };
        break;

      case 'get_recommendations':
        result = await getRecommendations(supabase, request.user_id, logger);
        break;

      case 'quick_action':
        if (!request.quick_action_type) throw new Error('quick_action_type required');
        result = await executeQuickAction(
          supabase,
          request.user_id,
          request.quick_action_type,
          request.quick_action_params ?? {},
          logger
        );
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
        service: 'personal-hub',
        action: request.action,
        processing_time_ms: duration,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Personal Hub] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'PERSONAL_HUB_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: requestId,
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
