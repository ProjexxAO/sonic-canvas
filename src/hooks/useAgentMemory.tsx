import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface AgentMemoryEntry {
  id: string;
  agent_id: string;
  user_id: string;
  memory_type: 'interaction' | 'preference' | 'outcome' | 'feedback' | 'learning';
  content: string;
  context: Record<string, unknown>;
  importance_score: number;
  created_at: string;
  expires_at?: string;
}

export interface AgentPerformanceRecord {
  id: string;
  agent_id: string;
  user_id: string;
  task_type: string;
  task_description?: string;
  success: boolean;
  execution_time_ms?: number;
  confidence_score?: number;
  user_satisfaction?: number;
  error_type?: string;
  context: Record<string, unknown>;
  created_at: string;
}

export interface SonicDNAEmbedding {
  id: string;
  agent_id: string;
  sonic_signature: Record<string, unknown>;
  personality_traits: {
    precision?: number;
    energy?: number;
    adaptability?: number;
    depth?: number;
    creativity?: number;
    stability?: number;
  };
  specialization_score: Record<string, number>;
  affinity_matrix: Record<string, number>;
  calibration_count: number;
  last_calibrated_at: string;
}

export interface AgentRelationship {
  id: string;
  agent_a_id: string;
  agent_b_id: string;
  relationship_type: string;
  synergy_score: number;
  interaction_count: number;
  success_rate?: number;
  metadata: Record<string, unknown>;
}

// Phase 2: Task specialization score interface
export interface AgentTaskScore {
  id: string;
  agent_id: string;
  task_type: string;
  success_count: number;
  failure_count: number;
  total_execution_time_ms: number;
  avg_confidence: number;
  avg_user_satisfaction: number;
  specialization_score: number;
  last_performed_at: string;
}

// Phase 2: Learning event interface
export interface AgentLearningEvent {
  id: string;
  agent_id: string;
  event_type: 'skill_gained' | 'specialization_up' | 'relationship_formed' | 'memory_consolidated';
  event_data: Record<string, unknown>;
  impact_score: number;
  created_at: string;
}

// Phase 2: Semantic search result
export interface SemanticMemoryResult {
  id: string;
  memory_type: string;
  content: string;
  importance_score: number;
  created_at: string;
  relevance_rank: number;
}

// Phase 2: Best agent for task result
export interface BestAgentForTask {
  agent_id: string;
  agent_name: string;
  sector: string;
  specialization_score: number;
  success_rate: number;
  total_tasks: number;
  avg_confidence: number;
}

export function useAgentMemory() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Store a memory for an agent
  const storeMemory = useCallback(async (
    agentId: string,
    memoryType: AgentMemoryEntry['memory_type'],
    content: string,
    context: Record<string, unknown> = {},
    importanceScore = 0.5
  ): Promise<AgentMemoryEntry | null> => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('agent_memory')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          memory_type: memoryType,
          content,
          context: context as Json,
          importance_score: importanceScore
        })
        .select()
        .single();

      if (error) throw error;
      return data as AgentMemoryEntry;
    } catch (error) {
      console.error('Failed to store agent memory:', error);
      return null;
    }
  }, [user?.id]);

  // Retrieve memories for an agent
  const getMemories = useCallback(async (
    agentId: string,
    memoryType?: AgentMemoryEntry['memory_type'],
    limit = 50
  ): Promise<AgentMemoryEntry[]> => {
    if (!user?.id) return [];
    
    try {
      let query = supabase
        .from('agent_memory')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (memoryType) {
        query = query.eq('memory_type', memoryType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AgentMemoryEntry[];
    } catch (error) {
      console.error('Failed to get agent memories:', error);
      return [];
    }
  }, [user?.id]);

  // Record performance for an agent
  const recordPerformance = useCallback(async (
    agentId: string,
    taskType: string,
    success: boolean,
    options: {
      taskDescription?: string;
      executionTimeMs?: number;
      confidenceScore?: number;
      userSatisfaction?: number;
      errorType?: string;
      context?: Record<string, unknown>;
    } = {}
  ): Promise<AgentPerformanceRecord | null> => {
    if (!user?.id) return null;
    
    try {
      const { data, error } = await supabase
        .from('agent_performance')
        .insert({
          agent_id: agentId,
          user_id: user.id,
          task_type: taskType,
          task_description: options.taskDescription,
          success,
          execution_time_ms: options.executionTimeMs,
          confidence_score: options.confidenceScore,
          user_satisfaction: options.userSatisfaction,
          error_type: options.errorType,
          context: (options.context || {}) as Json
        })
        .select()
        .single();

      if (error) throw error;
      
      // Also store as a learning memory
      await storeMemory(
        agentId,
        success ? 'outcome' : 'learning',
        `Task "${taskType}": ${success ? 'Success' : 'Failed'}${options.errorType ? ` - ${options.errorType}` : ''}`,
        { taskType, success, ...options.context },
        success ? 0.6 : 0.8 // Failures are more important to remember
      );
      
      return data as AgentPerformanceRecord;
    } catch (error) {
      console.error('Failed to record agent performance:', error);
      return null;
    }
  }, [user?.id, storeMemory]);

  // Get performance history for an agent
  const getPerformanceHistory = useCallback(async (
    agentId: string,
    taskType?: string,
    limit = 100
  ): Promise<AgentPerformanceRecord[]> => {
    if (!user?.id) return [];
    
    try {
      let query = supabase
        .from('agent_performance')
        .select('*')
        .eq('agent_id', agentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (taskType) {
        query = query.eq('task_type', taskType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AgentPerformanceRecord[];
    } catch (error) {
      console.error('Failed to get performance history:', error);
      return [];
    }
  }, [user?.id]);

  // Get or create Sonic DNA embedding for an agent
  const getSonicDNA = useCallback(async (
    agentId: string,
    sonicSignature: Record<string, unknown>
  ): Promise<SonicDNAEmbedding | null> => {
    if (!user?.id) return null;
    
    try {
      // Try to get existing
      const { data: existing, error: fetchError } = await supabase
        .from('sonic_dna_embeddings')
        .select('*')
        .eq('agent_id', agentId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (existing) {
        return existing as SonicDNAEmbedding;
      }

      // Calculate personality traits from sonic signature using the database function
      const { data: traits, error: traitsError } = await supabase
        .rpc('calculate_sonic_dna_traits', { p_sonic_signature: sonicSignature as Json });

      if (traitsError) {
        console.warn('Could not calculate traits:', traitsError);
      }

      // Create new embedding
      const { data: created, error: createError } = await supabase
        .from('sonic_dna_embeddings')
        .insert({
          agent_id: agentId,
          sonic_signature: sonicSignature as Json,
          personality_traits: (traits || {}) as Json,
          specialization_score: {} as Json,
          affinity_matrix: {} as Json
        })
        .select()
        .single();

      if (createError) throw createError;
      return created as SonicDNAEmbedding;
    } catch (error) {
      console.error('Failed to get/create Sonic DNA:', error);
      return null;
    }
  }, [user?.id]);

  // Update agent relationship after collaboration
  const updateRelationship = useCallback(async (
    agentAId: string,
    agentBId: string,
    success: boolean
  ): Promise<AgentRelationship | null> => {
    if (!user?.id) return null;
    
    // Ensure consistent ordering (smaller UUID first)
    const [firstId, secondId] = agentAId < agentBId 
      ? [agentAId, agentBId] 
      : [agentBId, agentAId];
    
    try {
      // Try to get existing relationship
      const { data: existing, error: fetchError } = await supabase
        .from('agent_relationships')
        .select('*')
        .eq('agent_a_id', firstId)
        .eq('agent_b_id', secondId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Update existing
        const newInteractionCount = (existing.interaction_count || 0) + 1;
        const currentSuccessRate = existing.success_rate || 0.5;
        const newSuccessRate = (currentSuccessRate * existing.interaction_count + (success ? 1 : 0)) / newInteractionCount;
        
        const { data, error } = await supabase
          .from('agent_relationships')
          .update({
            interaction_count: newInteractionCount,
            success_rate: newSuccessRate,
            synergy_score: Math.min(1, (existing.synergy_score || 0.5) + (success ? 0.02 : -0.01))
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as AgentRelationship;
      } else {
        // Create new relationship
        const { data, error } = await supabase
          .from('agent_relationships')
          .insert({
            agent_a_id: firstId,
            agent_b_id: secondId,
            relationship_type: 'collaboration',
            synergy_score: success ? 0.55 : 0.45,
            interaction_count: 1,
            success_rate: success ? 1.0 : 0.0
          })
          .select()
          .single();

        if (error) throw error;
        return data as AgentRelationship;
      }
    } catch (error) {
      console.error('Failed to update agent relationship:', error);
      return null;
    }
  }, [user?.id]);

  // Get agent's best collaborators
  const getBestCollaborators = useCallback(async (
    agentId: string,
    limit = 5
  ): Promise<AgentRelationship[]> => {
    if (!user?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('agent_relationships')
        .select('*')
        .or(`agent_a_id.eq.${agentId},agent_b_id.eq.${agentId}`)
        .order('synergy_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as AgentRelationship[];
    } catch (error) {
      console.error('Failed to get best collaborators:', error);
      return [];
    }
  }, [user?.id]);

  // Build context string from agent memories for AI prompts
  const buildMemoryContext = useCallback(async (
    agentId: string,
    maxTokens = 500
  ): Promise<string> => {
    const memories = await getMemories(agentId, undefined, 20);
    
    if (memories.length === 0) {
      return '';
    }

    // Sort by importance and recency
    const sorted = memories.sort((a, b) => {
      const scoreA = a.importance_score * 2 + (1 - (Date.now() - new Date(a.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000));
      const scoreB = b.importance_score * 2 + (1 - (Date.now() - new Date(b.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000));
      return scoreB - scoreA;
    });

    let context = '\n[Agent Memory Context]\n';
    let currentLength = context.length;
    
    for (const memory of sorted) {
      const entry = `- [${memory.memory_type}] ${memory.content}\n`;
      if (currentLength + entry.length > maxTokens * 4) break; // ~4 chars per token
      context += entry;
      currentLength += entry.length;
    }

    return context;
  }, [getMemories]);

  // PHASE 2: Semantic memory search
  const searchMemories = useCallback(async (
    agentId: string,
    searchQuery: string,
    memoryType?: string,
    limit = 10
  ): Promise<SemanticMemoryResult[]> => {
    try {
      const { data, error } = await supabase
        .rpc('search_agent_memories', {
          p_agent_id: agentId,
          p_search_query: searchQuery,
          p_memory_type: memoryType || null,
          p_limit: limit
        });

      if (error) throw error;
      return (data || []) as SemanticMemoryResult[];
    } catch (error) {
      console.error('Failed to search agent memories:', error);
      return [];
    }
  }, []);

  // PHASE 2: Find best agents for a specific task type
  const findBestAgentsForTask = useCallback(async (
    taskType: string,
    sector?: string,
    limit = 5
  ): Promise<BestAgentForTask[]> => {
    try {
      const { data, error } = await supabase
        .rpc('find_best_agents_for_task', {
          p_task_type: taskType,
          p_sector: sector || null,
          p_limit: limit
        });

      if (error) throw error;
      return (data || []) as BestAgentForTask[];
    } catch (error) {
      console.error('Failed to find best agents for task:', error);
      return [];
    }
  }, []);

  // PHASE 2: Get task specialization scores for an agent
  const getTaskScores = useCallback(async (
    agentId: string,
    limit = 10
  ): Promise<AgentTaskScore[]> => {
    try {
      const { data, error } = await supabase
        .from('agent_task_scores')
        .select('*')
        .eq('agent_id', agentId)
        .order('specialization_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as AgentTaskScore[];
    } catch (error) {
      console.error('Failed to get task scores:', error);
      return [];
    }
  }, []);

  // PHASE 2: Get learning events for an agent
  const getLearningEvents = useCallback(async (
    agentId: string,
    eventType?: string,
    limit = 20
  ): Promise<AgentLearningEvent[]> => {
    try {
      let query = supabase
        .from('agent_learning_events')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as AgentLearningEvent[];
    } catch (error) {
      console.error('Failed to get learning events:', error);
      return [];
    }
  }, []);

  // PHASE 2: Log a learning event manually
  const logLearningEvent = useCallback(async (
    agentId: string,
    eventType: AgentLearningEvent['event_type'],
    eventData: Record<string, unknown> = {},
    impactScore = 0.5
  ): Promise<AgentLearningEvent | null> => {
    try {
      const { data, error } = await supabase
        .from('agent_learning_events')
        .insert({
          agent_id: agentId,
          event_type: eventType,
          event_data: eventData as Json,
          impact_score: impactScore
        })
        .select()
        .single();

      if (error) throw error;
      return data as AgentLearningEvent;
    } catch (error) {
      console.error('Failed to log learning event:', error);
      return null;
    }
  }, []);

  // PHASE 2: Get agent's top specializations
  const getAgentSpecializations = useCallback(async (
    agentId: string
  ): Promise<{ taskType: string; score: number }[]> => {
    try {
      const { data, error } = await supabase
        .from('agent_task_scores')
        .select('task_type, specialization_score')
        .eq('agent_id', agentId)
        .gte('specialization_score', 0.5)
        .order('specialization_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []).map(d => ({ taskType: d.task_type, score: d.specialization_score }));
    } catch (error) {
      console.error('Failed to get agent specializations:', error);
      return [];
    }
  }, []);

  return {
    isLoading,
    // Phase 1
    storeMemory,
    getMemories,
    recordPerformance,
    getPerformanceHistory,
    getSonicDNA,
    updateRelationship,
    getBestCollaborators,
    buildMemoryContext,
    // Phase 2
    searchMemories,
    findBestAgentsForTask,
    getTaskScores,
    getLearningEvents,
    logLearningEvent,
    getAgentSpecializations
  };
}
