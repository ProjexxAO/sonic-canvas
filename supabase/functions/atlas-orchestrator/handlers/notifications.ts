/**
 * Atlas Orchestrator - Notification Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse } from "../utils.ts";

export async function sendNotification(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { notification } = req as any;

  const { data, error } = await ctx.supabase
    .from('agent_notifications')
    .insert({
      user_id: req.userId,
      ...notification,
    })
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    notification: data
  });
}

export async function getNotifications(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { data, error } = await ctx.supabase
    .from('agent_notifications')
    .select('*')
    .eq('user_id', req.userId)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ notifications: data || [] });
}

export async function dismissNotification(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { error } = await ctx.supabase
    .from('agent_notifications')
    .update({ is_dismissed: true })
    .eq('id', req.notificationId)
    .eq('user_id', req.userId);

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ success: true });
}
