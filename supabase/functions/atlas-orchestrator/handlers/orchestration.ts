/**
 * Atlas Orchestrator - Agent Orchestration Handler
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest, OrchestrationPlan } from "../types.ts";
import { successResponse, errorResponse, getConversationContext, callAIGateway } from "../utils.ts";

export async function orchestrateAgents(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const routingStartTime = Date.now();
  let usedTier: 'tier1' | 'tier2' | 'tier3' = 'tier3';
  let tier1Agents: any[] = [];
  let skipLLM = false;

  // TIER 1: Try deterministic intent parsing first (no LLM)
  let detectedTaskType = (req as any).taskType;
  let detectedDomain: string | null = null;

  if (!detectedTaskType && req.query) {
    console.log('[Tiered Intelligence] Tier 1: Attempting deterministic intent parsing...');
    const { data: intentResult, error: intentError } = await ctx.supabase
      .rpc('tier1_parse_intent', { p_query: req.query });

    if (!intentError && intentResult?.[0]) {
      const intent = intentResult[0];
      if (!intent.requires_llm && intent.confidence >= 0.7) {
        detectedTaskType = intent.task_type;
        detectedDomain = intent.domain;
        console.log(`[Tiered Intelligence] Tier 1: Intent parsed - ${detectedTaskType} (${Math.round(intent.confidence * 100)}% confidence)`);
      }
    }
  }

  // TIER 1: Try deterministic agent routing (no LLM)
  if (detectedTaskType) {
    console.log(`[Tiered Intelligence] Tier 1: Attempting deterministic routing for "${detectedTaskType}"...`);
    const { data: tier1Result, error: tier1Error } = await ctx.supabase
      .rpc('tier1_deterministic_route', {
        p_task_type: detectedTaskType,
        p_confidence_threshold: 0.7,
        p_limit: 5
      });

    if (!tier1Error && tier1Result && tier1Result.length > 0) {
      tier1Agents = tier1Result;
      const topAgent = tier1Result[0];

      if (!topAgent.requires_llm_fallback && topAgent.confidence >= 0.7) {
        usedTier = 'tier1';
        skipLLM = true;
        console.log(`[Tiered Intelligence] Tier 1 SUCCESS: ${tier1Agents.length} specialists found, skipping LLM (${Date.now() - routingStartTime}ms)`);
      } else if (topAgent.specialization_score > 0) {
        usedTier = 'tier2';
        console.log(`[Tiered Intelligence] Tier 2: Partial match found, will use LLM for refinement`);
      }
    }
  }

  // If Tier 1 succeeded completely, return immediately without LLM
  if (skipLLM && tier1Agents.length > 0) {
    const orchestrationPlan: OrchestrationPlan = {
      recommended_agents: tier1Agents.map((a: any) => ({
        agent_id: a.agent_id,
        agent_name: a.agent_name,
        role: `${a.sector} specialist for ${detectedTaskType}`,
        confidence: a.confidence,
        requires_approval: a.confidence < 0.9,
        reasoning: a.routing_reason,
        specialization_match: a.specialization_score >= 0.8 ? 'high' : a.specialization_score >= 0.5 ? 'medium' : 'low',
      })),
      orchestration_plan: `Tier 1 deterministic routing: ${tier1Agents.length} pre-qualified specialists assigned based on proven track record`,
      task_type: detectedTaskType,
      estimated_duration: 'instant',
      learning_opportunity: `Reinforce ${detectedTaskType} specialization`,
      routing_tier: 'tier1',
      routing_time_ms: Date.now() - routingStartTime,
      llm_bypassed: true,
    };

    console.log(`[Tiered Intelligence] Tier 1 complete: Returning ${tier1Agents.length} agents in ${Date.now() - routingStartTime}ms (LLM bypassed)`);

    return successResponse({
      success: true,
      orchestration: orchestrationPlan,
      agents: tier1Agents,
      routingTier: 'tier1',
      routingTimeMs: Date.now() - routingStartTime,
    });
  }

  // TIER 3: Fall back to LLM-based orchestration
  console.log(`[Tiered Intelligence] Tier 3: Using LLM for orchestration...`);

  const conversationContext = await getConversationContext(ctx.supabase, ctx.userId!, ctx.sessionId, 15);

  let specializedAgents: any[] = tier1Agents.length > 0 ? tier1Agents.map((a: any) => ({
    agent_id: a.agent_id,
    agent_name: a.agent_name,
    sector: a.sector,
    specialization_score: a.specialization_score,
    success_rate: a.success_rate,
    total_tasks: 0,
  })) : [];

  if (specializedAgents.length === 0 && detectedTaskType) {
    const { data: bestAgents, error: bestAgentsError } = await ctx.supabase
      .rpc('find_best_agents_for_task', {
        p_task_type: detectedTaskType,
        p_sector: null,
        p_limit: 10
      });

    if (!bestAgentsError && bestAgents) {
      specializedAgents = bestAgents;
      console.log(`Found ${bestAgents.length} specialized agents for task type: ${detectedTaskType}`);
    }
  }

  // Fallback: fetch all agents with enhanced metrics
  const { data: agents, error: agentsError } = await ctx.supabase
    .from('sonic_agents')
    .select('id, name, sector, description, capabilities, status, total_tasks_completed, success_rate, specialization_level, task_specializations, preferred_task_types, learning_velocity')
    .limit(50);

  if (agentsError) {
    return errorResponse(agentsError.message, 500);
  }

  const agentMemoryContexts: string[] = [];
  const agentSpecializationInfo: string[] = [];

  if (agents && agents.length > 0) {
    const priorityAgents = specializedAgents.length > 0
      ? agents.filter(a => specializedAgents.some(sa => sa.agent_id === a.id))
      : [...agents].sort((a: any, b: any) => (b.success_rate || 0) - (a.success_rate || 0)).slice(0, 5);

    for (const agent of priorityAgents.slice(0, 5)) {
      try {
        const { data: executionContext } = await ctx.supabase
          .rpc('get_agent_execution_context', {
            p_agent_id: agent.id,
            p_query: req.query || '',
            p_task_type: detectedTaskType
          });

        if (executionContext) {
          const memories = executionContext.memories || [];
          if (memories.length > 0) {
            agentMemoryContexts.push(
              `[${agent.name} Contextual Memory]\n${memories.slice(0, 3).map((m: any) =>
                `- [${m.type}] ${m.content} (relevance: ${Math.round((m.relevance || 0) * 100)}%)`
              ).join('\n')}`
            );
          }

          const specs = executionContext.specializations || [];
          if (specs.length > 0) {
            const specInfo = specs.slice(0, 3).map((s: any) =>
              `${s.task_type}: ${Math.round((s.score || 0) * 100)}% (${s.successes || 0} successes)`
            ).join(', ');
            agentSpecializationInfo.push(`[${agent.name}] Specializations: ${specInfo}`);
          }
        }
      } catch (ctxErr) {
        console.warn(`Failed to get execution context for ${agent.name}:`, ctxErr);

        const { data: taskScores } = await ctx.supabase
          .from('agent_task_scores')
          .select('task_type, specialization_score, success_count, avg_confidence')
          .eq('agent_id', agent.id)
          .order('specialization_score', { ascending: false })
          .limit(3);

        if (taskScores && taskScores.length > 0) {
          const specInfo = taskScores.map(ts =>
            `${ts.task_type}: ${Math.round(ts.specialization_score * 100)}% specialized (${ts.success_count} successes)`
          ).join(', ');
          agentSpecializationInfo.push(`[${agent.name}] Specializations: ${specInfo}`);
        }
      }
    }
  }

  const memorySection = agentMemoryContexts.length > 0
    ? `\n\n=== Agent Learning History (Semantically Matched) ===\n${agentMemoryContexts.join('\n\n')}\n=== End Agent Memory ===\n`
    : '';

  const specializationSection = agentSpecializationInfo.length > 0
    ? `\n\n=== Agent Task Specializations ===\n${agentSpecializationInfo.join('\n')}\n=== End Specializations ===\n`
    : '';

  const specializedContext = specializedAgents.length > 0
    ? `\n\nPRE-RANKED SPECIALISTS for "${detectedTaskType}":\n${specializedAgents.map((sa, i) =>
        `${i + 1}. ${sa.agent_name} - Specialization: ${Math.round(sa.specialization_score * 100)}%, Success: ${Math.round(sa.success_rate * 100)}%, Tasks: ${sa.total_tasks}`
      ).join('\n')}\n`
    : '';

  const orchestrationPrompt = `You are Atlas, an AI orchestrator with PHASE 2 advanced learning capabilities. Analyze the following user request and determine which agents should be engaged.

${conversationContext ? `Use this conversation history for context:${conversationContext}` : ''}
${memorySection}
${specializationSection}
${specializedContext}

Current User Request: ${req.query}
${detectedTaskType ? `Detected Task Type: ${detectedTaskType}` : ''}

Available Agents (with performance metrics):
${agents?.map((a: any) => {
  const specializations = a.task_specializations && Object.keys(a.task_specializations).length > 0
    ? Object.entries(a.task_specializations).slice(0, 3).map(([k, v]) => `${k}:${Math.round((v as number) * 100)}%`).join(', ')
    : 'None yet';
  const preferred = a.preferred_task_types?.slice(0, 3).join(', ') || 'None';
  return `- ${a.name} (${a.sector}): ${a.description || 'No description'}
  Capabilities: ${a.capabilities?.join(', ') || 'None listed'}
  Level: ${a.specialization_level || 'novice'} | Tasks: ${a.total_tasks_completed || 0} | Success: ${Math.round((a.success_rate || 0) * 100)}%
  Specializations: ${specializations} | Preferred Tasks: ${preferred} | Learning Velocity: ${a.learning_velocity || 0.5}`;
}).join('\n')}

CRITICAL SELECTION CRITERIA (in order):
1. Use PRE-RANKED SPECIALISTS if provided - they have proven track records for this task type
2. Factor in SPECIALIZATION SCORES - agents with higher scores for the detected task type should be prioritized
3. Consider SEMANTIC MEMORY MATCHES - agents with relevant past experience should be preferred
4. Prefer agents with higher LEARNING VELOCITY for novel tasks (they adapt faster)
5. Success rate and total experience as baseline qualifiers

Respond with a JSON object:
{
  "recommended_agents": [
    {
      "agent_id": "uuid",
      "agent_name": "name",
      "role": "what this agent will do",
      "confidence": 0.0-1.0,
      "requires_approval": true/false,
      "reasoning": "why this agent was selected based on specialization/memory",
      "specialization_match": "high|medium|low|none"
    }
  ],
  "orchestration_plan": "brief description of how agents will work together",
  "task_type": "specific task type for specialization tracking",
  "estimated_duration": "time estimate",
  "learning_opportunity": "what agents will learn from this task"
}`;

  const aiResult = await callAIGateway(ctx.lovableApiKey, [
    { role: 'system', content: 'You are Atlas, an expert AI orchestrator with Phase 2 advanced learning. Prioritize specialized agents and semantic memory matches. Always respond with valid JSON.' },
    { role: 'user', content: orchestrationPrompt },
  ]);

  if (aiResult.status !== 200) {
    return { status: aiResult.status, body: aiResult.body };
  }

  const orchestrationContent = aiResult.body.response || '';

  let orchestrationPlan;
  try {
    const jsonMatch = orchestrationContent.match(/\{[\s\S]*\}/);
    orchestrationPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    console.error('Failed to parse orchestration plan:', e);
    orchestrationPlan = null;
  }

  // Store interaction memory for recommended agents
  if (orchestrationPlan?.recommended_agents && ctx.userId) {
    const taskTypeForMemory = orchestrationPlan.task_type || detectedTaskType || 'general';

    for (const rec of orchestrationPlan.recommended_agents.slice(0, 3)) {
      if (rec.agent_id && rec.agent_id.match(/^[0-9a-f-]{36}$/i)) {
        try {
          await ctx.supabase
            .from('agent_memory')
            .insert({
              agent_id: rec.agent_id,
              user_id: ctx.userId,
              memory_type: 'interaction',
              content: `Assigned to "${taskTypeForMemory}" task: ${req.query?.substring(0, 100) || 'orchestration'}. Role: ${rec.role}. Match: ${rec.specialization_match || 'unrated'}`,
              context: {
                task_type: taskTypeForMemory,
                confidence: rec.confidence,
                specialization_match: rec.specialization_match,
                learning_opportunity: orchestrationPlan.learning_opportunity
              },
              importance_score: rec.confidence || 0.5
            });

          if (rec.confidence >= 0.8) {
            await ctx.supabase
              .from('agent_learning_events')
              .insert({
                agent_id: rec.agent_id,
                event_type: 'skill_gained',
                event_data: {
                  task_type: taskTypeForMemory,
                  confidence: rec.confidence,
                  role: rec.role
                },
                impact_score: rec.confidence
              });
          }
        } catch (memErr) {
          console.warn('Failed to store agent memory/learning event:', memErr);
        }
      }
    }
  }

  return successResponse({
    orchestration: orchestrationPlan,
    availableAgents: agents?.length || 0,
    specializedAgents,
    memoryEnabled: agentMemoryContexts.length > 0,
    phase: 2
  });
}
