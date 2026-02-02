// Atlas Task Assignment - Orchestrator assigns specialized tasks to agents
// This is used INTERNALLY by Atlas - users interact via voice/chat, not directly
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface TaskAssignment {
  taskId: string;
  taskTitle: string;
  taskType: string;
  agentId: string;
  agentName: string;
  confidence: number;
  specializationMatch: 'high' | 'medium' | 'low' | 'none';
  reasoning: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedAt: Date;
}

export interface SpecializedAgent {
  id: string;
  name: string;
  sector: string;
  specializationScore: number;
  successRate: number;
  totalTasks: number;
  preferredTaskTypes: string[];
  learningVelocity: number;
}

export interface AssignmentResult {
  success: boolean;
  assignments: TaskAssignment[];
  message: string;
  feedbackRecorded?: boolean;
}

export function useAtlasTaskAssignment(userId: string | undefined) {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [specializedAgents, setSpecializedAgents] = useState<SpecializedAgent[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch specialized agents for a given task type
  const fetchSpecializedAgents = useCallback(async (taskType: string): Promise<SpecializedAgent[]> => {
    if (!userId) return [];

    try {
      const { data, error } = await supabase.rpc('find_best_agents_for_task', {
        p_task_type: taskType,
        p_sector: null,
        p_limit: 10,
      });

      if (error) throw error;

      const agents: SpecializedAgent[] = (data || []).map((a: any) => ({
        id: a.agent_id,
        name: a.agent_name,
        sector: a.sector,
        specializationScore: a.specialization_score || 0,
        successRate: a.success_rate || 0,
        totalTasks: a.total_tasks || 0,
        preferredTaskTypes: [],
        learningVelocity: 0.5,
      }));

      setSpecializedAgents(agents);
      return agents;
    } catch (error) {
      console.error('Error fetching specialized agents:', error);
      return [];
    }
  }, [userId]);

  // Have Atlas automatically assign a task to the best agent
  const autoAssignTask = useCallback(async (
    taskTitle: string,
    taskDescription: string,
    taskType: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<AssignmentResult> => {
    if (!userId) {
      return { success: false, assignments: [], message: 'User not authenticated' };
    }

    setIsAssigning(true);

    try {
      // Use the orchestrator to find and assign the best agents
      const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
        body: {
          action: 'orchestrate_agents',
          userId,
          query: `${taskTitle}: ${taskDescription}`,
          taskType,
        },
      });

      if (error) throw error;

      const orchestration = data?.orchestration;
      if (!orchestration?.recommended_agents?.length) {
        return { success: false, assignments: [], message: 'No suitable agents found' };
      }

      // Create task in the queue with assigned agents
      const assignedAgentIds = orchestration.recommended_agents
        .slice(0, 3)
        .map((a: any) => a.agent_id);

      const { data: taskData, error: taskError } = await (supabase as any)
        .from('agent_task_queue')
        .insert({
          user_id: userId,
          task_type: taskType || 'assistance',
          task_title: taskTitle,
          task_description: taskDescription,
          task_priority: priority,
          assigned_agents: assignedAgentIds,
          orchestration_mode: 'automatic',
          status: 'pending',
          progress: 0,
          input_data: { auto_assigned: true, orchestration_plan: orchestration.orchestration_plan },
          output_data: {},
          agent_suggestions: orchestration.recommended_agents,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Create assignment records
      const newAssignments: TaskAssignment[] = orchestration.recommended_agents
        .slice(0, 3)
        .map((agent: any) => ({
          taskId: taskData.id,
          taskTitle,
          taskType,
          agentId: agent.agent_id,
          agentName: agent.agent_name,
          confidence: agent.confidence,
          specializationMatch: agent.specialization_match || 'medium',
          reasoning: agent.reasoning,
          status: 'assigned' as const,
          assignedAt: new Date(),
        }));

      setAssignments(prev => [...newAssignments, ...prev]);

      toast.success(`Task assigned to ${newAssignments.length} specialized agent(s)`, {
        description: orchestration.orchestration_plan,
      });

      return {
        success: true,
        assignments: newAssignments,
        message: orchestration.orchestration_plan,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assignment failed';
      toast.error('Failed to assign task', { description: message });
      return { success: false, assignments: [], message };
    } finally {
      setIsAssigning(false);
    }
  }, [userId]);

  // Manually assign a task to specific agent(s)
  const assignTaskToAgents = useCallback(async (
    taskId: string,
    agentIds: string[],
    taskType?: string
  ): Promise<boolean> => {
    if (!userId || !agentIds.length) return false;

    setIsAssigning(true);

    try {
      const { error } = await (supabase as any)
        .from('agent_task_queue')
        .update({
          assigned_agents: agentIds,
          orchestration_mode: 'user_directed',
          status: 'pending',
        })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      // Record performance expectations
      for (const agentId of agentIds) {
        await supabase.from('agent_memory').insert({
          agent_id: agentId,
          user_id: userId,
          memory_type: 'task_assignment',
          content: `Manually assigned to task ${taskId}${taskType ? ` (${taskType})` : ''}`,
          importance_score: 0.6,
          context: { task_id: taskId, task_type: taskType, manual_assignment: true },
        });
      }

      toast.success(`Task assigned to ${agentIds.length} agent(s)`);
      return true;
    } catch (error) {
      toast.error('Failed to assign task');
      return false;
    } finally {
      setIsAssigning(false);
    }
  }, [userId]);

  // Get recent task assignments
  const fetchRecentAssignments = useCallback(async (): Promise<TaskAssignment[]> => {
    if (!userId) return [];

    setLoading(true);

    try {
      const { data, error } = await (supabase as any)
        .from('agent_task_queue')
        .select('*')
        .eq('user_id', userId)
        .not('assigned_agents', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const taskAssignments: TaskAssignment[] = [];

      for (const task of data || []) {
        const suggestions = task.agent_suggestions || [];
        for (const suggestion of suggestions) {
          if (task.assigned_agents?.includes(suggestion.agent_id)) {
            taskAssignments.push({
              taskId: task.id,
              taskTitle: task.task_title,
              taskType: task.task_type,
              agentId: suggestion.agent_id,
              agentName: suggestion.agent_name,
              confidence: suggestion.confidence,
              specializationMatch: suggestion.specialization_match || 'medium',
              reasoning: suggestion.reasoning || suggestion.reason,
              status: task.status,
              assignedAt: new Date(task.created_at),
            });
          }
        }
      }

      setAssignments(taskAssignments);
      return taskAssignments;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Route a task through Seraphim hierarchy
  const routeTaskThroughHierarchy = useCallback(async (
    taskType: string,
    domain?: string
  ): Promise<{ seraphimId: string | null; workerIds: string[] }> => {
    if (!userId) return { seraphimId: null, workerIds: [] };

    try {
      // Find the Seraphim for this domain/task
      const { data: seraphimId, error: seraphimError } = await supabase.rpc('route_task_to_seraphim', {
        p_task_type: taskType,
        p_domain: domain,
      });

      if (seraphimError || !seraphimId) {
        console.warn('No Seraphim found for task routing');
        return { seraphimId: null, workerIds: [] };
      }

      // Get workers under this Seraphim specialized in the task
      const { data: workers, error: workersError } = await supabase
        .from('sonic_agents')
        .select('id')
        .eq('seraphim_id', seraphimId)
        .eq('hierarchy_tier', 'worker')
        .limit(5);

      if (workersError) throw workersError;

      return {
        seraphimId,
        workerIds: (workers || []).map(w => w.id),
      };
    } catch (error) {
      console.error('Error routing through hierarchy:', error);
      return { seraphimId: null, workerIds: [] };
    }
  }, [userId]);

  // Record task completion feedback (called by Atlas after task execution)
  const recordTaskCompletion = useCallback(async (params: {
    taskId: string;
    agentId: string;
    taskType: string;
    success: boolean;
    confidenceScore?: number;
    executionTimeMs?: number;
    userSatisfaction?: number;
    errorType?: string;
  }): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Record in agent_performance
      const { error } = await supabase.from('agent_performance').insert([{
        agent_id: params.agentId,
        user_id: userId,
        task_type: params.taskType,
        task_description: `Task ${params.taskId}`,
        success: params.success,
        confidence_score: params.confidenceScore ?? 0.5,
        execution_time_ms: params.executionTimeMs,
        user_satisfaction: params.userSatisfaction,
        error_type: params.errorType,
        context: { task_id: params.taskId, auto_recorded: true } as Json,
      }]);

      if (error) throw error;

      // Update task status
      await supabase
        .from('agent_task_queue')
        .update({
          status: params.success ? 'completed' : 'failed',
          completed_at: new Date().toISOString(),
          output_data: {
            success: params.success,
            confidence: params.confidenceScore,
            execution_time_ms: params.executionTimeMs,
          } as Json,
        })
        .eq('id', params.taskId);

      // Update assignment status in local state
      setAssignments(prev =>
        prev.map(a =>
          a.taskId === params.taskId && a.agentId === params.agentId
            ? { ...a, status: params.success ? 'completed' : 'failed' }
            : a
        )
      );

      return true;
    } catch (error) {
      console.error('Error recording task completion:', error);
      return false;
    }
  }, [userId]);

  // Transfer knowledge from successful agents to struggling ones
  const transferKnowledgeFromTask = useCallback(async (
    taskId: string,
    successfulAgentId: string,
    targetAgentIds: string[]
  ): Promise<number> => {
    if (!userId || !targetAgentIds.length) return 0;

    try {
      const { data, error } = await supabase.rpc('crystallize_knowledge', {
        p_source_agent_id: successfulAgentId,
        p_target_agent_ids: targetAgentIds,
        p_min_importance: 0.5,
      });

      if (error) throw error;

      const crystalsShared = (data as { crystals_shared: number })?.crystals_shared ?? 0;
      
      if (crystalsShared > 0) {
        toast.success(`Knowledge transferred: ${crystalsShared} insights shared`);
      }

      return crystalsShared;
    } catch (error) {
      console.error('Error transferring knowledge:', error);
      return 0;
    }
  }, [userId]);

  return {
    assignments,
    specializedAgents,
    isAssigning,
    loading,
    fetchSpecializedAgents,
    autoAssignTask,
    assignTaskToAgents,
    fetchRecentAssignments,
    routeTaskThroughHierarchy,
    recordTaskCompletion,
    transferKnowledgeFromTask,
  };
}
