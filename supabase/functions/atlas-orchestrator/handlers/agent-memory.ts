/**
 * Atlas Orchestrator - Agent Memory & Performance Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse, isValidUUID } from "../utils.ts";

export async function recordAgentPerformance(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { agentId, taskType, success, taskDescription, executionTimeMs, confidenceScore, errorType, context: perfContext } = req as any;

  if (!agentId || !taskType || success === undefined) {
    return errorResponse('agentId, taskType, and success are required');
  }

  const { data: perfData, error: perfError } = await ctx.supabase
    .from('agent_performance')
    .insert({
      agent_id: agentId,
      user_id: req.userId,
      task_type: taskType,
      task_description: taskDescription,
      success,
      execution_time_ms: executionTimeMs,
      confidence_score: confidenceScore,
      error_type: errorType,
      context: perfContext || {}
    })
    .select()
    .single();

  if (perfError) {
    return errorResponse(perfError.message, 500);
  }

  // Store learning memory for this interaction
  const memoryContent = success
    ? `Successfully completed ${taskType} task: ${taskDescription || 'task'}. Confidence: ${confidenceScore || 'N/A'}`
    : `Failed ${taskType} task: ${taskDescription || 'task'}. Error: ${errorType || 'unknown'}`;

  await ctx.supabase
    .from('agent_memory')
    .insert({
      agent_id: agentId,
      user_id: req.userId,
      memory_type: success ? 'success' : 'error',
      content: memoryContent,
      context: { task_type: taskType, confidence: confidenceScore },
      importance_score: success ? 0.6 : 0.8 // Failures are more important to remember
    });

  return successResponse({
    success: true,
    performance: perfData,
    message: `Performance recorded for agent ${agentId}`
  });
}

export async function getAgentMemory(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { agentId, memoryType, limit = 20 } = req as any;

  if (!agentId) {
    return errorResponse('agentId is required');
  }

  let query = ctx.supabase
    .from('agent_memory')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (memoryType) {
    query = query.eq('memory_type', memoryType);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ memories: data || [] });
}

export async function getSonicDNA(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { agentId } = req as any;

  if (!agentId) {
    return errorResponse('agentId is required');
  }

  // Get agent with all metrics
  const { data: agent, error: agentError } = await ctx.supabase
    .from('sonic_agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (agentError) {
    return errorResponse(agentError.message, 500);
  }

  // Get task specializations
  const { data: taskScores } = await ctx.supabase
    .from('agent_task_scores')
    .select('*')
    .eq('agent_id', agentId)
    .order('specialization_score', { ascending: false })
    .limit(10);

  // Get recent performance
  const { data: recentPerf } = await ctx.supabase
    .from('agent_performance')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get relationships
  const { data: relationships } = await ctx.supabase
    .from('agent_relationships')
    .select('*')
    .or(`agent_a_id.eq.${agentId},agent_b_id.eq.${agentId}`)
    .order('synergy_score', { ascending: false })
    .limit(10);

  return successResponse({
    agent,
    taskSpecializations: taskScores || [],
    recentPerformance: recentPerf || [],
    relationships: relationships || [],
    dnaProfile: {
      learningVelocity: agent?.learning_velocity || 0.5,
      specializationLevel: agent?.specialization_level || 'novice',
      successRate: agent?.success_rate || 0,
      totalExperience: agent?.total_tasks_completed || 0,
    }
  });
}

export async function updateAgentRelationship(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { agentAId, agentBId, success: relSuccess } = req as any;

  if (!agentAId || !agentBId) {
    return errorResponse('agentAId and agentBId are required');
  }

  // Ensure consistent ordering
  const [firstId, secondId] = agentAId < agentBId ? [agentAId, agentBId] : [agentBId, agentAId];

  const { data: existing, error: fetchRelError } = await ctx.supabase
    .from('agent_relationships')
    .select('*')
    .eq('agent_a_id', firstId)
    .eq('agent_b_id', secondId)
    .maybeSingle();

  if (fetchRelError) {
    return errorResponse(fetchRelError.message, 500);
  }

  if (existing) {
    const newCount = (existing.interaction_count || 0) + 1;
    const currentRate = existing.success_rate || 0.5;
    const newRate = (currentRate * existing.interaction_count + (relSuccess ? 1 : 0)) / newCount;

    const { data: updated, error: updateRelError } = await ctx.supabase
      .from('agent_relationships')
      .update({
        interaction_count: newCount,
        success_rate: newRate,
        synergy_score: Math.min(1, (existing.synergy_score || 0.5) + (relSuccess ? 0.02 : -0.01))
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateRelError) {
      return errorResponse(updateRelError.message, 500);
    }

    return successResponse({ relationship: updated });
  }

  const { data: created, error: createRelError } = await ctx.supabase
    .from('agent_relationships')
    .insert({
      agent_a_id: firstId,
      agent_b_id: secondId,
      relationship_type: 'collaboration',
      synergy_score: relSuccess ? 0.55 : 0.45,
      interaction_count: 1,
      success_rate: relSuccess ? 1.0 : 0.0
    })
    .select()
    .single();

  if (createRelError) {
    return errorResponse(createRelError.message, 500);
  }

  return successResponse({ relationship: created, created: true });
}
