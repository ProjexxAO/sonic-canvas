// Continuous Learning Hook - Manages background learning cycles for agents
// Enables agents to evolve autonomously even when idle

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface LearningCycleResult {
  agentId: string;
  agentName: string;
  learningMode: string;
  knowledgeGained: number;
  specializationBoost: number;
  relationshipsDiscovered: number;
  memoryConsolidated: boolean;
}

export interface LearningSummary {
  totalAgentsProcessed: number;
  totalKnowledgeGained: number;
  totalSpecializationBoost: number;
  totalRelationshipsDiscovered: number;
  learningModes: Array<{ mode: string; count: number }>;
}

export interface ContinuousLearningState {
  isRunning: boolean;
  lastCycleAt: Date | null;
  cyclesCompleted: number;
  totalAgentsTrained: number;
  lastSummary: LearningSummary | null;
  autoLearningEnabled: boolean;
  learningIntervalMinutes: number;
}

export const LEARNING_MODES = {
  AUTO: 'auto',
  KNOWLEDGE_SYNTHESIS: 'knowledge_synthesis',
  SKILL_PRACTICE: 'skill_practice',
  RELATIONSHIP_DISCOVERY: 'relationship_discovery',
  DOMAIN_EXPLORATION: 'domain_exploration',
  MEMORY_CONSOLIDATION: 'memory_consolidation',
  PATTERN_RECOGNITION: 'pattern_recognition',
} as const;

export type LearningMode = typeof LEARNING_MODES[keyof typeof LEARNING_MODES];

export function useContinuousLearning() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<ContinuousLearningState>({
    isRunning: false,
    lastCycleAt: null,
    cyclesCompleted: 0,
    totalAgentsTrained: 0,
    lastSummary: null,
    autoLearningEnabled: false,
    learningIntervalMinutes: 30, // Default: run every 30 minutes
  });

  const [recentResults, setRecentResults] = useState<LearningCycleResult[]>([]);

  // Run a single learning cycle
  const runLearningCycle = useCallback(async (options: {
    batchSize?: number;
    learningMode?: LearningMode;
    targetSector?: string | null;
    intensityMultiplier?: number;
  } = {}): Promise<{ success: boolean; summary?: LearningSummary; results?: LearningCycleResult[] }> => {
    if (!user?.id) {
      toast.error('Authentication required for continuous learning');
      return { success: false };
    }

    setState(prev => ({ ...prev, isRunning: true }));

    try {
      const { data, error } = await supabase.functions.invoke('agent-continuous-learning', {
        body: {
          batchSize: options.batchSize || 50,
          learningMode: options.learningMode || 'auto',
          targetSector: options.targetSector || null,
          intensityMultiplier: options.intensityMultiplier || 1.0,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        const summary = data.summary as LearningSummary;
        const results = data.results as LearningCycleResult[];

        setState(prev => ({
          ...prev,
          isRunning: false,
          lastCycleAt: new Date(),
          cyclesCompleted: prev.cyclesCompleted + 1,
          totalAgentsTrained: prev.totalAgentsTrained + summary.totalAgentsProcessed,
          lastSummary: summary,
        }));

        setRecentResults(results.slice(0, 20)); // Keep last 20 results

        if (summary.totalAgentsProcessed > 0) {
          toast.success(
            `Learning cycle complete: ${summary.totalAgentsProcessed} agents trained, ` +
            `${summary.totalKnowledgeGained.toFixed(1)} knowledge gained`
          );
        }

        return { success: true, summary, results };
      }

      throw new Error(data.error || 'Learning cycle failed');
    } catch (error) {
      console.error('Continuous learning error:', error);
      setState(prev => ({ ...prev, isRunning: false }));
      toast.error('Learning cycle failed');
      return { success: false };
    }
  }, [user?.id]);

  // Start automatic learning cycles
  const startAutoLearning = useCallback((intervalMinutes: number = 30) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setState(prev => ({
      ...prev,
      autoLearningEnabled: true,
      learningIntervalMinutes: intervalMinutes,
    }));

    // Run immediately, then at intervals
    runLearningCycle();

    intervalRef.current = setInterval(() => {
      runLearningCycle();
    }, intervalMinutes * 60 * 1000);

    toast.success(`Auto-learning enabled: running every ${intervalMinutes} minutes`);
  }, [runLearningCycle]);

  // Stop automatic learning
  const stopAutoLearning = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      autoLearningEnabled: false,
    }));

    toast.info('Auto-learning disabled');
  }, []);

  // Run intensive learning burst (higher intensity, more agents)
  const runLearningBurst = useCallback(async (targetSector?: string) => {
    toast.info('Starting intensive learning burst...');
    
    const results = await Promise.all([
      runLearningCycle({ 
        batchSize: 100, 
        intensityMultiplier: 2.0, 
        learningMode: 'skill_practice',
        targetSector 
      }),
      runLearningCycle({ 
        batchSize: 100, 
        intensityMultiplier: 2.0, 
        learningMode: 'knowledge_synthesis',
        targetSector 
      }),
      runLearningCycle({ 
        batchSize: 100, 
        intensityMultiplier: 2.0, 
        learningMode: 'relationship_discovery',
        targetSector 
      }),
    ]);

    const totalTrained = results.reduce((sum, r) => 
      sum + (r.summary?.totalAgentsProcessed || 0), 0
    );

    toast.success(`Learning burst complete: ${totalTrained} agents received intensive training`);
    
    return results;
  }, [runLearningCycle]);

  // Get learning statistics
  const getLearningStats = useCallback(async () => {
    if (!user?.id) return null;

    try {
      // Get recent learning events
      const { data: events, error: eventsError } = await supabase
        .from('agent_learning_events')
        .select('event_type, event_data, impact_score, created_at')
        .eq('event_type', 'continuous_learning')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      // Calculate stats
      const last24h = events?.filter(e => 
        new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ) || [];

      const last7d = events?.filter(e => 
        new Date(e.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ) || [];

      return {
        cyclesLast24h: last24h.length,
        cyclesLast7d: last7d.length,
        avgImpactScore: events?.reduce((sum, e) => sum + (e.impact_score || 0), 0) / (events?.length || 1),
        totalEvents: events?.length || 0,
        learningModeBreakdown: events?.reduce((acc, e) => {
          const mode = (e.event_data as any)?.learning_mode || 'unknown';
          acc[mode] = (acc[mode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      console.error('Error fetching learning stats:', error);
      return null;
    }
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    ...state,
    recentResults,

    // Actions
    runLearningCycle,
    startAutoLearning,
    stopAutoLearning,
    runLearningBurst,
    getLearningStats,

    // Constants
    LEARNING_MODES,
  };
}
