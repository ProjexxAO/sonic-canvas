/**
 * Atlas Orchestrator - UI Preferences Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse } from "../utils.ts";

export async function getUIPreferences(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { data, error } = await ctx.supabase
    .from('user_ui_preferences')
    .select('*')
    .eq('user_id', req.userId)
    .maybeSingle();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ preferences: data });
}

export async function updateUIPreferences(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { data, error } = await ctx.supabase
    .from('user_ui_preferences')
    .upsert({
      user_id: req.userId,
      ...req.preferences,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    preferences: data,
    message: 'UI preferences updated successfully'
  });
}
