/**
 * Atlas Orchestrator - Dashboard Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, callAIGateway, resolveDashboardId, enrichWithProfiles, formatFileSize } from "../utils.ts";

export async function dashboardList(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { data: memberData, error: memberError } = await ctx.supabase
    .from('shared_dashboard_members')
    .select('dashboard_id, role')
    .eq('user_id', req.userId);

  if (memberError) {
    return errorResponse(memberError.message, 500);
  }

  const dashboardIds = memberData?.map(m => m.dashboard_id) || [];

  if (dashboardIds.length === 0) {
    return successResponse({ dashboards: [] });
  }

  const { data: dashboards, error: dashError } = await ctx.supabase
    .from('shared_dashboards')
    .select('id, name, description, created_at, updated_at')
    .in('id', dashboardIds)
    .eq('is_active', true);

  if (dashError) {
    return errorResponse(dashError.message, 500);
  }

  const enrichedDashboards = await Promise.all(
    (dashboards || []).map(async (d) => {
      const { count } = await ctx.supabase
        .from('shared_dashboard_members')
        .select('*', { count: 'exact', head: true })
        .eq('dashboard_id', d.id);

      const myMembership = memberData?.find(m => m.dashboard_id === d.id);

      return {
        ...d,
        member_count: count || 0,
        role: myMembership?.role || 'viewer',
      };
    })
  );

  return successResponse({ dashboards: enrichedDashboards });
}

export async function dashboardSelect(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { dashboardName } = req as any;

  const { data: dashboards, error } = await ctx.supabase
    .from('shared_dashboards')
    .select('id, name, description')
    .ilike('name', `%${dashboardName}%`)
    .eq('is_active', true)
    .limit(1);

  if (error) {
    return errorResponse(error.message, 500);
  }

  const dashboard = dashboards?.[0];
  if (!dashboard) {
    return notFoundResponse('Dashboard not found');
  }

  const { data: membership } = await ctx.supabase
    .from('shared_dashboard_members')
    .select('role')
    .eq('dashboard_id', dashboard.id)
    .eq('user_id', req.userId)
    .single();

  if (!membership) {
    return forbiddenResponse('You are not a member of this dashboard');
  }

  const { count } = await ctx.supabase
    .from('shared_dashboard_members')
    .select('*', { count: 'exact', head: true })
    .eq('dashboard_id', dashboard.id);

  return successResponse({
    dashboard: {
      ...dashboard,
      role: membership.role,
      member_count: count || 0,
    }
  });
}

export async function dashboardMessages(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { dashboardName, limit = 20 } = req as any;

  const dashboardId = await resolveDashboardId(ctx.supabase, ctx.userId!, dashboardName);

  if (!dashboardId) {
    return successResponse({ messages: [], error: 'No dashboard found' });
  }

  const { data: messages, error } = await ctx.supabase
    .from('dashboard_messages')
    .select('id, content, user_id, created_at, is_edited, mentions')
    .eq('dashboard_id', dashboardId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return errorResponse(error.message, 500);
  }

  const userIds = [...new Set((messages || []).map(m => m.user_id))];
  const { data: profiles } = await ctx.supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

  const enrichedMessages = (messages || []).map(m => ({
    ...m,
    sender_name: profileMap.get(m.user_id) || 'Unknown User',
  }));

  return successResponse({ messages: enrichedMessages });
}

export async function dashboardSendMessage(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { dashboardName, message } = req as any;

  const dashboardId = await resolveDashboardId(ctx.supabase, ctx.userId!, dashboardName);

  if (!dashboardId) {
    return notFoundResponse('No dashboard found');
  }

  const { data: membership } = await ctx.supabase
    .from('shared_dashboard_members')
    .select('can_comment')
    .eq('dashboard_id', dashboardId)
    .eq('user_id', req.userId)
    .single();

  if (!membership?.can_comment) {
    return forbiddenResponse('You do not have permission to send messages');
  }

  const { data: newMessage, error } = await ctx.supabase
    .from('dashboard_messages')
    .insert({
      dashboard_id: dashboardId,
      user_id: req.userId,
      content: message,
    })
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ success: true, message: newMessage });
}

export async function dashboardFiles(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { dashboardName } = req as any;

  const dashboardId = await resolveDashboardId(ctx.supabase, ctx.userId!, dashboardName);

  if (!dashboardId) {
    return successResponse({ files: [] });
  }

  const { data: files, error } = await ctx.supabase
    .from('dashboard_files')
    .select('id, file_name, file_size, mime_type, uploaded_by, created_at')
    .eq('dashboard_id', dashboardId)
    .order('created_at', { ascending: false });

  if (error) {
    return errorResponse(error.message, 500);
  }

  const uploaderIds = [...new Set((files || []).map(f => f.uploaded_by))];
  const { data: profiles } = await ctx.supabase
    .from('profiles')
    .select('user_id, display_name')
    .in('user_id', uploaderIds);

  const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

  const enrichedFiles = (files || []).map(f => ({
    ...f,
    uploader_name: profileMap.get(f.uploaded_by) || 'Unknown',
    size_formatted: formatFileSize(f.file_size),
  }));

  return successResponse({ files: enrichedFiles });
}

export async function dashboardNotifications(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { data: notifications, error } = await ctx.supabase
    .from('dashboard_notifications')
    .select('id, title, message, notification_type, is_read, created_at, dashboard_id, actor_id')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ notifications: notifications || [] });
}

export async function dashboardMembers(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { dashboardName } = req as any;

  const dashboardId = await resolveDashboardId(ctx.supabase, ctx.userId!, dashboardName);

  if (!dashboardId) {
    return successResponse({ members: [] });
  }

  const { data: members, error } = await ctx.supabase
    .from('shared_dashboard_members')
    .select('user_id, role, can_comment, can_share, can_upload, joined_at')
    .eq('dashboard_id', dashboardId);

  if (error) {
    return errorResponse(error.message, 500);
  }

  const userIds = (members || []).map(m => m.user_id);
  const { data: profiles } = await ctx.supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

  const enrichedMembers = (members || []).map(m => ({
    ...m,
    display_name: profileMap.get(m.user_id)?.display_name || 'Unknown User',
    avatar_url: profileMap.get(m.user_id)?.avatar_url,
  }));

  return successResponse({ members: enrichedMembers });
}

export async function dashboardSummary(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { dashboardName } = req as any;

  let dashboardId: string | null = null;
  let dashboardNameResolved = dashboardName;

  if (dashboardName) {
    const { data } = await ctx.supabase
      .from('shared_dashboards')
      .select('id, name')
      .ilike('name', `%${dashboardName}%`)
      .limit(1);
    dashboardId = data?.[0]?.id || null;
    dashboardNameResolved = data?.[0]?.name || dashboardName;
  } else {
    const { data: memberData } = await ctx.supabase
      .from('shared_dashboard_members')
      .select('dashboard_id')
      .eq('user_id', req.userId)
      .limit(1);
    dashboardId = memberData?.[0]?.dashboard_id || null;

    if (dashboardId) {
      const { data } = await ctx.supabase
        .from('shared_dashboards')
        .select('name')
        .eq('id', dashboardId)
        .single();
      dashboardNameResolved = data?.name || 'Dashboard';
    }
  }

  if (!dashboardId) {
    return successResponse({ summary: 'No dashboard found to summarize.' });
  }

  const [messagesRes, filesRes, membersRes, activitiesRes] = await Promise.all([
    ctx.supabase.from('dashboard_messages').select('content, created_at').eq('dashboard_id', dashboardId).order('created_at', { ascending: false }).limit(20),
    ctx.supabase.from('dashboard_files').select('file_name, created_at').eq('dashboard_id', dashboardId).limit(10),
    ctx.supabase.from('shared_dashboard_members').select('role').eq('dashboard_id', dashboardId),
    ctx.supabase.from('dashboard_activity').select('action, item_type, created_at').eq('dashboard_id', dashboardId).order('created_at', { ascending: false }).limit(20),
  ]);

  const context = {
    name: dashboardNameResolved,
    messageCount: messagesRes.data?.length || 0,
    recentMessages: messagesRes.data?.slice(0, 5).map((m: any) => m.content.slice(0, 100)) || [],
    fileCount: filesRes.data?.length || 0,
    recentFiles: filesRes.data?.map((f: any) => f.file_name) || [],
    memberCount: membersRes.data?.length || 0,
    roles: membersRes.data?.map((m: any) => m.role) || [],
    recentActivity: activitiesRes.data?.slice(0, 5).map((a: any) => a.action) || [],
  };

  const aiResult = await callAIGateway(ctx.lovableApiKey, [
    { role: 'system', content: 'You are Atlas, a helpful AI assistant. Generate a concise but informative summary of a shared dashboard based on the provided context. Focus on recent activity, key discussions, and team composition.' },
    { role: 'user', content: `Summarize this dashboard:\n${JSON.stringify(context, null, 2)}` },
  ]);

  if (aiResult.status !== 200) {
    return successResponse({ summary: 'Unable to generate summary at this time.' });
  }

  return successResponse({ summary: aiResult.body.response || 'No summary available.' });
}
