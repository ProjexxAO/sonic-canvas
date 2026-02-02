// Agent Training System - Enhanced feedback loops, knowledge transfer, and task pattern discovery
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// ============================================================================
// Types
// ============================================================================

export interface TrainingFeedback {
  taskId: string;
  agentId: string;
  agentName: string;
  taskType: string;
  success: boolean;
  confidenceScore: number;
  userSatisfaction?: number;
  executionTimeMs?: number;
  errorType?: string;
  learningInsight?: string;
  feedbackAt: Date;
}

export interface KnowledgeTransfer {
  id: string;
  sourceAgentId: string;
  sourceAgentName: string;
  targetAgentId: string;
  targetAgentName: string;
  knowledgeType: 'skill' | 'memory' | 'strategy' | 'crystallized';
  content: string;
  importanceScore: number;
  transferredAt: Date;
  absorbed: boolean;
}

export interface DiscoveredPattern {
  id: string;
  taskType: string;
  patternName: string;
  description: string;
  frequency: number;
  complexity: number;
  sector: string;
  discoveredAt: Date;
  appliedCount: number;
}

export interface TrainingStats {
  totalFeedbackRecorded: number;
  totalKnowledgeTransfers: number;
  totalPatternsDiscovered: number;
  avgSuccessRate: number;
  avgConfidence: number;
  topPerformers: Array<{ agentId: string; agentName: string; successRate: number }>;
  recentLearningEvents: number;
}

export interface TrainingSession {
  sessionId: string;
  startedAt: Date;
  completedAt?: Date;
  mode: 'feedback' | 'transfer' | 'discovery' | 'full';
  agentsProcessed: number;
  feedbackRecorded: number;
  transfersCompleted: number;
  patternsDiscovered: number;
  status: 'running' | 'completed' | 'failed';
}

// ============================================================================
// Hook
// ============================================================================

export function useAgentTraining() {
  const { user } = useAuth();
  const sessionRef = useRef<string | null>(null);

  const [isTraining, setIsTraining] = useState(false);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<TrainingFeedback[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<KnowledgeTransfer[]>([]);
  const [discoveredPatterns, setDiscoveredPatterns] = useState<DiscoveredPattern[]>([]);
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);

  // Record performance feedback for an agent
  const recordFeedback = useCallback(async (feedback: {
    agentId: string;
    taskId?: string;
    taskType: string;
    success: boolean;
    confidenceScore?: number;
    userSatisfaction?: number;
    executionTimeMs?: number;
    errorType?: string;
    context?: Record<string, unknown>;
  }): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Insert performance record
      const { data, error } = await supabase.from('agent_performance').insert([{
        agent_id: feedback.agentId,
        user_id: user.id,
        task_type: feedback.taskType,
        task_description: feedback.taskId ? `Task ${feedback.taskId}` : undefined,
        success: feedback.success,
        confidence_score: feedback.confidenceScore ?? 0.5,
        user_satisfaction: feedback.userSatisfaction,
        execution_time_ms: feedback.executionTimeMs,
        error_type: feedback.errorType,
        context: (feedback.context ?? {}) as Json,
      }]).select('id, agent_id, task_type, success, confidence_score, created_at').single();

      if (error) throw error;

      // Get agent name for UI
      const { data: agent } = await supabase
        .from('sonic_agents')
        .select('name')
        .eq('id', feedback.agentId)
        .single();

      const newFeedback: TrainingFeedback = {
        taskId: feedback.taskId ?? data.id,
        agentId: feedback.agentId,
        agentName: agent?.name ?? 'Unknown Agent',
        taskType: feedback.taskType,
        success: feedback.success,
        confidenceScore: feedback.confidenceScore ?? 0.5,
        userSatisfaction: feedback.userSatisfaction,
        executionTimeMs: feedback.executionTimeMs,
        errorType: feedback.errorType,
        feedbackAt: new Date(data.created_at),
      };

      setRecentFeedback(prev => [newFeedback, ...prev].slice(0, 50));

      // Trigger specialization score update (handled by DB trigger)
      toast.success(`Feedback recorded for ${agent?.name ?? 'agent'}`, {
        description: feedback.success ? 'Success recorded' : 'Failure tracked for learning',
      });

      return true;
    } catch (error) {
      console.error('Error recording feedback:', error);
      toast.error('Failed to record feedback');
      return false;
    }
  }, [user?.id]);

  // Transfer knowledge between agents
  const transferKnowledge = useCallback(async (params: {
    sourceAgentId: string;
    targetAgentIds: string[];
    knowledgeType?: 'skill' | 'memory' | 'strategy';
    minImportance?: number;
  }): Promise<number> => {
    if (!user?.id) return 0;

    try {
      // Use the crystallize_knowledge database function
      const { data, error } = await supabase.rpc('crystallize_knowledge', {
        p_source_agent_id: params.sourceAgentId,
        p_target_agent_ids: params.targetAgentIds,
        p_min_importance: params.minImportance ?? 0.5,
      });

      if (error) throw error;

      const crystalsShared = (data as { crystals_shared: number })?.crystals_shared ?? 0;

      // Get agent names for display
      const { data: agents } = await supabase
        .from('sonic_agents')
        .select('id, name')
        .in('id', [params.sourceAgentId, ...params.targetAgentIds]);

      const agentMap = new Map(agents?.map(a => [a.id, a.name]) ?? []);
      const sourceAgentName = agentMap.get(params.sourceAgentId) ?? 'Unknown';

      // Create transfer records for UI
      const transfers: KnowledgeTransfer[] = params.targetAgentIds.map(targetId => ({
        id: crypto.randomUUID(),
        sourceAgentId: params.sourceAgentId,
        sourceAgentName,
        targetAgentId: targetId,
        targetAgentName: agentMap.get(targetId) ?? 'Unknown',
        knowledgeType: params.knowledgeType ?? 'crystallized',
        content: `Knowledge transfer from ${sourceAgentName}`,
        importanceScore: params.minImportance ?? 0.5,
        transferredAt: new Date(),
        absorbed: true,
      }));

      setRecentTransfers(prev => [...transfers, ...prev].slice(0, 50));

      if (crystalsShared > 0) {
        toast.success(`Knowledge transferred: ${crystalsShared} crystals shared`, {
          description: `From ${sourceAgentName} to ${params.targetAgentIds.length} agents`,
        });
      }

      return crystalsShared;
    } catch (error) {
      console.error('Error transferring knowledge:', error);
      toast.error('Knowledge transfer failed');
      return 0;
    }
  }, [user?.id]);

  // Auto-transfer from top performers to underperformers
  const autoTransferFromTopPerformers = useCallback(async (
    topCount: number = 5,
    targetCount: number = 20
  ): Promise<number> => {
    if (!user?.id) return 0;

    try {
      // Get top performers
      const { data: topPerformers } = await supabase
        .from('sonic_agents')
        .select('id, name, success_rate')
        .order('success_rate', { ascending: false })
        .limit(topCount);

      // Get underperformers
      const { data: underperformers } = await supabase
        .from('sonic_agents')
        .select('id')
        .order('success_rate', { ascending: true })
        .limit(targetCount);

      if (!topPerformers?.length || !underperformers?.length) {
        toast.info('Not enough agents for knowledge transfer');
        return 0;
      }

      const targetIds = underperformers.map(a => a.id);
      let totalTransferred = 0;

      // Transfer from each top performer
      for (const source of topPerformers) {
        const count = await transferKnowledge({
          sourceAgentId: source.id,
          targetAgentIds: targetIds,
          minImportance: 0.6,
        });
        totalTransferred += count;
      }

      return totalTransferred;
    } catch (error) {
      console.error('Error in auto-transfer:', error);
      return 0;
    }
  }, [user?.id, transferKnowledge]);

  // Run agent reflection cycle
  const runReflectionCycle = useCallback(async (agentId: string): Promise<{
    success: boolean;
    insight?: string;
    patterns?: { successPatterns: unknown[]; failurePatterns: unknown[] };
  }> => {
    if (!user?.id) return { success: false };

    try {
      const { data, error } = await supabase.rpc('agent_reflection_cycle', {
        p_agent_id: agentId,
      });

      if (error) throw error;

      const result = data as {
        success_patterns: unknown[];
        failure_patterns: unknown[];
        specializations: unknown[];
        insight: string;
      };

      toast.success('Reflection cycle complete', {
        description: result.insight,
      });

      return {
        success: true,
        insight: result.insight,
        patterns: {
          successPatterns: result.success_patterns ?? [],
          failurePatterns: result.failure_patterns ?? [],
        },
      };
    } catch (error) {
      console.error('Error running reflection:', error);
      toast.error('Reflection cycle failed');
      return { success: false };
    }
  }, [user?.id]);

  // Consolidate agent memories
  const consolidateMemories = useCallback(async (agentId: string): Promise<{
    consolidated: number;
    summariesCreated: number;
  }> => {
    if (!user?.id) return { consolidated: 0, summariesCreated: 0 };

    try {
      const { data, error } = await supabase.rpc('consolidate_agent_memories', {
        p_agent_id: agentId,
        p_threshold: 0.3,
        p_min_memories: 5,
      });

      if (error) throw error;

      const result = data as { consolidated: number; summaries_created: number };

      if (result.consolidated > 0) {
        toast.success(`Consolidated ${result.consolidated} memories`);
      }

      return {
        consolidated: result.consolidated ?? 0,
        summariesCreated: result.summaries_created ?? 0,
      };
    } catch (error) {
      console.error('Error consolidating memories:', error);
      return { consolidated: 0, summariesCreated: 0 };
    }
  }, [user?.id]);

  // Fetch training statistics
  const fetchTrainingStats = useCallback(async (): Promise<TrainingStats | null> => {
    if (!user?.id) return null;

    try {
      // Get recent performance metrics
      const { data: performance } = await supabase
        .from('agent_performance')
        .select('success, confidence_score, user_satisfaction')
        .order('created_at', { ascending: false })
        .limit(500);

      // Get recent learning events
      const { data: learningEvents } = await supabase
        .from('agent_learning_events')
        .select('event_type, impact_score')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(200);

      // Get top performers
      const { data: topAgents } = await supabase
        .from('sonic_agents')
        .select('id, name, success_rate')
        .order('success_rate', { ascending: false })
        .limit(5);

      // Get knowledge transfer count
      const { count: transferCount } = await supabase
        .from('agent_memory')
        .select('id', { count: 'exact', head: true })
        .eq('memory_type', 'received_crystal');

      // Calculate stats
      const successCount = performance?.filter(p => p.success).length ?? 0;
      const totalPerf = performance?.length ?? 1;
      const avgConfidence = performance?.reduce((sum, p) => sum + (p.confidence_score ?? 0), 0) / totalPerf;

      const stats: TrainingStats = {
        totalFeedbackRecorded: totalPerf,
        totalKnowledgeTransfers: transferCount ?? 0,
        totalPatternsDiscovered: learningEvents?.filter(e => e.event_type === 'task_pattern_discovery').length ?? 0,
        avgSuccessRate: successCount / totalPerf,
        avgConfidence,
        topPerformers: (topAgents ?? []).map(a => ({
          agentId: a.id,
          agentName: a.name,
          successRate: a.success_rate ?? 0,
        })),
        recentLearningEvents: learningEvents?.length ?? 0,
      };

      setTrainingStats(stats);
      return stats;
    } catch (error) {
      console.error('Error fetching training stats:', error);
      return null;
    }
  }, [user?.id]);

  // Run a full training session
  const runTrainingSession = useCallback(async (options: {
    mode?: 'feedback' | 'transfer' | 'discovery' | 'full';
    batchSize?: number;
    intensity?: number;
  } = {}): Promise<TrainingSession> => {
    if (!user?.id) {
      throw new Error('Authentication required');
    }

    const sessionId = crypto.randomUUID();
    sessionRef.current = sessionId;

    const session: TrainingSession = {
      sessionId,
      startedAt: new Date(),
      mode: options.mode ?? 'full',
      agentsProcessed: 0,
      feedbackRecorded: 0,
      transfersCompleted: 0,
      patternsDiscovered: 0,
      status: 'running',
    };

    setCurrentSession(session);
    setIsTraining(true);

    try {
      // Use hyper-evolution for full training
      const { data, error } = await supabase.functions.invoke('agent-hyper-evolution', {
        body: {
          mode: options.mode === 'transfer' ? 'crystallization' :
                options.mode === 'discovery' ? 'task_discovery' : 'full_acceleration',
          batchSize: options.batchSize ?? 100,
          intensityMultiplier: options.intensity ?? 2.0,
          evolutionCycles: 3,
          userId: user.id,
        },
      });

      if (error) throw error;

      const summary = data?.summary ?? {};

      const completedSession: TrainingSession = {
        ...session,
        completedAt: new Date(),
        agentsProcessed: summary.totalAgentsEvolved ?? 0,
        feedbackRecorded: summary.totalKnowledgeGained ?? 0,
        transfersCompleted: summary.totalCrystallizations ?? 0,
        patternsDiscovered: summary.totalTasksDiscovered ?? 0,
        status: 'completed',
      };

      setCurrentSession(completedSession);

      toast.success('Training session complete', {
        description: `${completedSession.agentsProcessed} agents evolved, ${completedSession.patternsDiscovered} patterns discovered`,
      });

      // Refresh stats
      await fetchTrainingStats();

      return completedSession;
    } catch (error) {
      const failedSession: TrainingSession = {
        ...session,
        completedAt: new Date(),
        status: 'failed',
      };
      setCurrentSession(failedSession);
      toast.error('Training session failed');
      throw error;
    } finally {
      setIsTraining(false);
      sessionRef.current = null;
    }
  }, [user?.id, fetchTrainingStats]);

  // Find best agents for a task (for Atlas orchestration)
  const findBestAgentsForTask = useCallback(async (
    taskType: string,
    sector?: string,
    limit: number = 5
  ) => {
    try {
      const { data, error } = await supabase.rpc('find_best_agents_for_task', {
        p_task_type: taskType,
        p_sector: sector ?? null,
        p_limit: limit,
      });

      if (error) throw error;

      return (data ?? []).map((a: {
        agent_id: string;
        agent_name: string;
        sector: string;
        specialization_score: number;
        success_rate: number;
        total_tasks: number;
        avg_confidence: number;
      }) => ({
        agentId: a.agent_id,
        agentName: a.agent_name,
        sector: a.sector,
        specializationScore: a.specialization_score,
        successRate: a.success_rate,
        totalTasks: a.total_tasks,
        avgConfidence: a.avg_confidence,
      }));
    } catch (error) {
      console.error('Error finding agents:', error);
      return [];
    }
  }, []);

  return {
    // State
    isTraining,
    currentSession,
    recentFeedback,
    recentTransfers,
    discoveredPatterns,
    trainingStats,

    // Feedback actions
    recordFeedback,

    // Knowledge transfer
    transferKnowledge,
    autoTransferFromTopPerformers,

    // Learning actions
    runReflectionCycle,
    consolidateMemories,

    // Training sessions
    runTrainingSession,
    fetchTrainingStats,

    // Orchestration support
    findBestAgentsForTask,
  };
}
