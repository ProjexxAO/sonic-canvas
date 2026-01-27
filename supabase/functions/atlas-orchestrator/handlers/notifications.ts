/**
 * Atlas Orchestrator - Notification Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse } from "../utils.ts";

export async function sendNotification(ctx: HandlerContext, req: OrchestratorRequest): Promise<HandlerResult> {
  const { notification } = req as OrchestratorRequest & { notification: Record<string, unknown> };

  if (!notification) return errorResponse('notification object is required');

  const { data, error } = await ctx.supabase
    .from('agent_notifications')
    .insert({ user_id: ctx.userId, ...notification })
    .select()
    .single();

  if (error) throw error;

  return successResponse({ success: true, notification: data });
}

export async function getNotifications(ctx: HandlerContext, _req: OrchestratorRequest): Promise<HandlerResult> {
  const { data, error } = await ctx.supabase
    .from('agent_notifications')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return successResponse({ notifications: data || [] });
}

export async function dismissNotification(ctx: HandlerContext, req: OrchestratorRequest): Promise<HandlerResult> {
  const { notificationId } = req;

  if (!notificationId) return errorResponse('notificationId is required');

  const { error } = await ctx.supabase
    .from('agent_notifications')
    .update({ is_dismissed: true })
    .eq('id', notificationId)
    .eq('user_id', ctx.userId);

  if (error) throw error;

  return successResponse({ success: true });
}
