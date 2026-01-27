/**
 * Atlas Orchestrator - Task Queue Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse } from "../utils.ts";

export async function createTask(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { taskData } = req;
  
  if (!taskData?.task_title) {
    return errorResponse('task_title is required');
  }

  const { data, error } = await ctx.supabase
    .from('agent_task_queue')
    .insert({
      user_id: req.userId,
      ...taskData,
      status: 'pending',
      progress: 0,
    })
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    task: data,
    message: `Task "${taskData.task_title}" created`
  });
}

export async function updateTask(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { taskId, updates } = req as OrchestratorRequest & { taskId: string; updates: Record<string, unknown> };

  if (!taskId) {
    return errorResponse('taskId is required');
  }

  const { data, error } = await ctx.supabase
    .from('agent_task_queue')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    task: data,
    message: 'Task updated'
  });
}

export async function deleteTask(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { taskId } = req as OrchestratorRequest & { taskId: string };

  if (!taskId) {
    return errorResponse('taskId is required');
  }

  // Check if it's a csuite task
  if (taskId.startsWith('csuite:')) {
    const actualId = taskId.replace('csuite:', '');
    const { error } = await ctx.supabase
      .from('csuite_tasks')
      .delete()
      .eq('id', actualId)
      .eq('user_id', req.userId);

    if (error) {
      return errorResponse(error.message, 500);
    }
  } else {
    const { error } = await ctx.supabase
      .from('agent_task_queue')
      .delete()
      .eq('id', taskId)
      .eq('user_id', req.userId);

    if (error) {
      return errorResponse(error.message, 500);
    }
  }

  return successResponse({
    success: true,
    message: 'Task deleted'
  });
}

export async function getTasks(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { data, error } = await ctx.supabase
    .from('agent_task_queue')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ tasks: data || [] });
}
