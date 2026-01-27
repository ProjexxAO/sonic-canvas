/**
 * Agent Orchestration Service
 * Multi-agent coordination, task routing, and swarm intelligence
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

interface Agent {
  id: string;
  name: string;
  sector: string;
  status: string;
  success_rate: number;
  learning_velocity: number;
  task_specializations: Record<string, number>;
  current_load: number;
}

interface Task {
  id: string;
  task_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  required_skills: string[];
  deadline?: string;
}

interface Assignment {
  task_id: string;
  agent_id: string;
  confidence: number;
  estimated_duration: number;
  backup_agents: string[];
}

interface SwarmConfig {
  min_agents: number;
  max_agents: number;
  consensus_threshold: number;
  parallel_execution: boolean;
  result_aggregation: 'voting' | 'weighted_average' | 'best_result' | 'merge';
}

interface OrchestrationRequest {
  action: 'assign_task' | 'form_swarm' | 'coordinate' | 'balance_load' | 'get_status' | 'optimize';
  user_id: string;
  task?: Task;
  tasks?: Task[];
  swarm_config?: SwarmConfig;
  agent_ids?: string[];
  optimization_target?: 'speed' | 'quality' | 'cost' | 'balanced';
}

// ============================================================================
// Orchestration Operations
// ============================================================================

async function assignTask(
  supabase: SupabaseClient,
  task: Task,
  userId: string,
  logger: ServiceLogger
): Promise<Assignment> {
  await logger.info('Assigning task to optimal agent', { task_id: task.id, task_type: task.task_type });

  // Get available agents with limited columns for performance
  const { data: agents } = await supabase
    .from('sonic_agents')
    .select('id, name, sector, status, success_rate, learning_velocity, task_specializations, total_tasks_completed')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .limit(100);

  if (!agents || agents.length === 0) {
    throw new Error('No available agents for task assignment');
  }

  // Score agents for this task
  const scoredAgents = agents.map(agent => {
    let score = 0;

    // Skill match (40% weight)
    const specs = (agent.task_specializations as Record<string, number>) ?? {};
    const skillMatch = task.required_skills.reduce((sum, skill) => {
      return sum + (specs[skill] ?? 0);
    }, 0) / Math.max(task.required_skills.length, 1);
    score += skillMatch * 0.4;

    // Success rate (25% weight)
    score += (agent.success_rate ?? 0) * 0.25;

    // Learning velocity (15% weight)
    score += (agent.learning_velocity ?? 0.5) * 0.15;

    // Current load inverse (20% weight) - use total_tasks as proxy
    const loadFactor = 1 - Math.min((agent.total_tasks_completed ?? 0) / 100, 0.5);
    score += loadFactor * 0.2;

    // Priority boost for matching sector
    if (agent.sector?.toLowerCase().includes(task.task_type.toLowerCase())) {
      score += 0.1;
    }

    return { agent, score };
  });

  // Sort by score
  scoredAgents.sort((a, b) => b.score - a.score);

  const bestAgent = scoredAgents[0];
  const backupAgents = scoredAgents.slice(1, 4).map(sa => sa.agent.id);

  // Estimate duration based on complexity and agent capability
  const baseDuration = task.complexity * 10; // minutes
  const speedFactor = 1 + (1 - bestAgent.score);
  const estimatedDuration = Math.round(baseDuration * speedFactor);

  // Create task in agent_task_queue
  const { data: taskRecord, error: taskError } = await supabase
    .from('agent_task_queue')
    .insert({
      user_id: userId,
      task_title: task.description.substring(0, 100),
      task_description: task.description,
      task_type: task.task_type,
      task_priority: task.priority,
      status: 'pending',
      assigned_agents: [bestAgent.agent.id],
      agent_suggestions: { backup_agents: backupAgents, confidence: bestAgent.score },
    })
    .select('id')
    .single();

  if (taskError) {
    await logger.error('Failed to create task', { error: taskError.message });
    throw new Error(`Failed to create task: ${taskError.message}`);
  }

  const assignment: Assignment = {
    task_id: taskRecord?.id ?? task.id,
    agent_id: bestAgent.agent.id,
    confidence: bestAgent.score,
    estimated_duration: estimatedDuration,
    backup_agents: backupAgents,
  };

  await logger.info('Task assigned', {
    agent_id: bestAgent.agent.id,
    agent_name: bestAgent.agent.name,
    confidence: bestAgent.score.toFixed(2),
  });

  return assignment;
}

async function formSwarm(
  supabase: SupabaseClient,
  task: Task,
  config: SwarmConfig,
  userId: string,
  logger: ServiceLogger
): Promise<{
  swarm_id: string;
  agents: any[];
  coordinator_id: string;
  execution_plan: any;
}> {
  await logger.info('Forming agent swarm', { task_type: task.task_type, config });

  // Get all available agents with limited selection
  const { data: allAgents } = await supabase
    .from('sonic_agents')
    .select('id, name, sector, status, success_rate, learning_velocity, task_specializations, hierarchy_tier')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .limit(200);

  if (!allAgents || allAgents.length < config.min_agents) {
    throw new Error(`Insufficient agents. Need ${config.min_agents}, have ${allAgents?.length ?? 0}`);
  }

  // Score and select agents
  const scoredAgents = allAgents.map(agent => {
    const specs = (agent.task_specializations as Record<string, number>) ?? {};
    const relevance = task.required_skills.reduce((sum, skill) => {
      return sum + (specs[skill] ?? 0);
    }, 0) / Math.max(task.required_skills.length, 1);

    // Prefer Seraphim as coordinators
    const tierBoost = agent.hierarchy_tier === 'seraphim' ? 0.2 : 0;

    return {
      agent,
      score: relevance * 0.5 + (agent.success_rate ?? 0) * 0.3 + (agent.learning_velocity ?? 0.5) * 0.2 + tierBoost,
    };
  });

  scoredAgents.sort((a, b) => b.score - a.score);

  // Select swarm members
  const swarmSize = Math.min(config.max_agents, Math.max(config.min_agents, Math.ceil(task.complexity / 2)));
  const swarmMembers = scoredAgents.slice(0, swarmSize).map(sa => sa.agent);

  // Select coordinator (prefer Seraphim, otherwise highest scoring)
  const coordinator = swarmMembers.find(a => a.hierarchy_tier === 'seraphim') ?? swarmMembers[0];

  // Generate execution plan
  const executionPlan = {
    phases: [
      {
        name: 'analysis',
        agents: swarmMembers.slice(0, Math.ceil(swarmSize / 2)).map(a => a.id),
        action: 'Analyze task requirements and context',
      },
      {
        name: 'execution',
        agents: swarmMembers.map(a => a.id),
        action: config.parallel_execution ? 'Parallel execution' : 'Sequential execution',
      },
      {
        name: 'synthesis',
        agents: [coordinator.id],
        action: `Aggregate results using ${config.result_aggregation} strategy`,
      },
    ],
    consensus_required: config.consensus_threshold,
    aggregation_method: config.result_aggregation,
  };

  const swarmId = crypto.randomUUID();

  await logger.info('Swarm formed', {
    swarm_id: swarmId,
    size: swarmMembers.length,
    coordinator: coordinator.name,
  });

  return {
    swarm_id: swarmId,
    agents: swarmMembers,
    coordinator_id: coordinator.id,
    execution_plan: executionPlan,
  };
}

async function coordinateAgents(
  supabase: SupabaseClient,
  agentIds: string[],
  tasks: Task[],
  logger: ServiceLogger
): Promise<{
  assignments: Assignment[];
  parallel_groups: string[][];
  estimated_completion: string;
}> {
  await logger.info('Coordinating multi-agent task execution', { agents: agentIds.length, tasks: tasks.length });

  // Get agent details
  const { data: agents } = await supabase
    .from('sonic_agents')
    .select('id, name, sector, success_rate, task_specializations, total_tasks_completed')
    .in('id', agentIds)
    .limit(100);

  if (!agents) {
    throw new Error('Failed to fetch agents');
  }

  const assignments: Assignment[] = [];
  const agentLoads: Record<string, number> = {};

  // Initialize loads
  for (const agent of agents) {
    agentLoads[agent.id] = 0;
  }

  // Sort tasks by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedTasks = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Assign tasks using greedy algorithm
  for (const task of sortedTasks) {
    let bestAgent: typeof agents[0] | null = null;
    let bestScore = -1;

    for (const agent of agents) {
      const specs = (agent.task_specializations as Record<string, number>) ?? {};
      const skillMatch = task.required_skills.reduce((sum, skill) => {
        return sum + (specs[skill] ?? 0);
      }, 0) / Math.max(task.required_skills.length, 1);

      const loadPenalty = agentLoads[agent.id] * 0.1;
      const score = skillMatch * 0.6 + (agent.success_rate ?? 0) * 0.4 - loadPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    if (bestAgent) {
      assignments.push({
        task_id: task.id,
        agent_id: bestAgent.id,
        confidence: bestScore,
        estimated_duration: Math.round(task.complexity * 10 * (1.5 - Math.min(bestScore, 1))),
        backup_agents: [],
      });

      agentLoads[bestAgent.id]++;
    }
  }

  // Group tasks that can run in parallel
  const parallelGroups: string[][] = [];
  const assignedAgents = new Set<string>();
  let currentGroup: string[] = [];

  for (const assignment of assignments) {
    if (assignedAgents.has(assignment.agent_id)) {
      if (currentGroup.length > 0) {
        parallelGroups.push(currentGroup);
      }
      currentGroup = [assignment.task_id];
      assignedAgents.clear();
      assignedAgents.add(assignment.agent_id);
    } else {
      currentGroup.push(assignment.task_id);
      assignedAgents.add(assignment.agent_id);
    }
  }

  if (currentGroup.length > 0) {
    parallelGroups.push(currentGroup);
  }

  // Estimate completion time
  const totalDuration = assignments.reduce((sum, a) => sum + a.estimated_duration, 0);
  const parallelFactor = parallelGroups.length > 0 ? assignments.length / parallelGroups.length : 1;
  const estimatedMinutes = Math.round(totalDuration / parallelFactor);
  const estimatedCompletion = new Date(Date.now() + estimatedMinutes * 60000).toISOString();

  return {
    assignments,
    parallel_groups: parallelGroups,
    estimated_completion: estimatedCompletion,
  };
}

async function balanceLoad(
  supabase: SupabaseClient,
  userId: string,
  logger: ServiceLogger
): Promise<{
  rebalanced_count: number;
  agent_loads: Record<string, number>;
}> {
  await logger.info('Balancing agent workload');

  // Get agents with task counts
  const { data: agents } = await supabase
    .from('sonic_agents')
    .select('id, name, status, total_tasks_completed')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .limit(100);

  if (!agents || agents.length < 2) {
    return { rebalanced_count: 0, agent_loads: {} };
  }

  // Use total_tasks_completed as load proxy
  const agentLoads: Record<string, number> = {};
  for (const agent of agents) {
    agentLoads[agent.id] = agent.total_tasks_completed ?? 0;
  }

  await logger.info('Load balancing complete', { agent_count: agents.length });

  return { rebalanced_count: 0, agent_loads: agentLoads };
}

async function getOrchestrationStatus(
  supabase: SupabaseClient,
  userId: string,
  logger: ServiceLogger
): Promise<{
  total_agents: number;
  active_agents: number;
  pending_tasks: number;
  load_distribution: Record<string, number>;
  performance_metrics: any;
}> {
  await logger.info('Getting orchestration status');

  // Get agent counts with simple queries
  const { count: totalAgents } = await supabase
    .from('sonic_agents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: activeAgents } = await supabase
    .from('sonic_agents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'ACTIVE');

  const { count: pendingTasks } = await supabase
    .from('agent_task_queue')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');

  // Get top agents for load distribution
  const { data: topAgents } = await supabase
    .from('sonic_agents')
    .select('name, total_tasks_completed, success_rate')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .order('total_tasks_completed', { ascending: false })
    .limit(10);

  const loadDistribution: Record<string, number> = {};
  let totalSuccessRate = 0;

  for (const agent of topAgents ?? []) {
    loadDistribution[agent.name] = agent.total_tasks_completed ?? 0;
    totalSuccessRate += agent.success_rate ?? 0;
  }

  return {
    total_agents: totalAgents ?? 0,
    active_agents: activeAgents ?? 0,
    pending_tasks: pendingTasks ?? 0,
    load_distribution: loadDistribution,
    performance_metrics: {
      avg_success_rate: topAgents?.length ? totalSuccessRate / topAgents.length : 0,
      total_capacity: (activeAgents ?? 0) * 10,
      utilization_rate: pendingTasks && activeAgents ? (pendingTasks / (activeAgents * 10)) : 0,
    },
  };
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
    const request: OrchestrationRequest = await req.json();

    if (!request.user_id) {
      throw new Error('user_id is required');
    }

    const logger = new ServiceLogger(
      supabase,
      requestId,
      request.user_id,
      null,
      'agent-orchestration'
    );

    await logger.info(`Processing ${request.action} request`);

    let result: any;

    switch (request.action) {
      case 'assign_task':
        if (!request.task) throw new Error('task is required');
        const assignment = await assignTask(supabase, request.task, request.user_id, logger);
        result = { success: true, assignment };
        break;

      case 'form_swarm':
        if (!request.task) throw new Error('task is required');
        const defaultSwarmConfig: SwarmConfig = {
          min_agents: 3,
          max_agents: 10,
          consensus_threshold: 0.7,
          parallel_execution: true,
          result_aggregation: 'weighted_average',
        };
        const swarm = await formSwarm(supabase, request.task, request.swarm_config ?? defaultSwarmConfig, request.user_id, logger);
        result = { success: true, ...swarm };
        break;

      case 'coordinate':
        if (!request.agent_ids || !request.tasks) throw new Error('agent_ids and tasks are required');
        const coordination = await coordinateAgents(supabase, request.agent_ids, request.tasks, logger);
        result = { success: true, ...coordination };
        break;

      case 'balance_load':
        const balance = await balanceLoad(supabase, request.user_id, logger);
        result = { success: true, ...balance };
        break;

      case 'get_status':
        const status = await getOrchestrationStatus(supabase, request.user_id, logger);
        result = { success: true, ...status };
        break;

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    const duration = Date.now() - startTime;
    await logger.info('orchestration_operation completed', { duration_ms: duration });

    return new Response(JSON.stringify({
      ...result,
      metadata: {
        request_id: requestId,
        service: 'agent-orchestration',
        action: request.action,
        processing_time_ms: duration,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Agent Orchestration] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'ORCHESTRATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: requestId,
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
