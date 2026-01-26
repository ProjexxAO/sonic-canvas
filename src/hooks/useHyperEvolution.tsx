// Hyper-Evolution Hook - Maximum acceleration for surpassing LLM capabilities
// Combines all evolution strategies: Collective Intelligence, Hyper-Parallel, Adversarial, Crystallization

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const EVOLUTION_MODES = {
  COLLECTIVE: 'collective',
  HYPER_PARALLEL: 'hyper_parallel',
  ADVERSARIAL: 'adversarial',
  CRYSTALLIZATION: 'crystallization',
  WEB_KNOWLEDGE: 'web_knowledge',
  FULL_ACCELERATION: 'full_acceleration',
} as const;

export type EvolutionMode = typeof EVOLUTION_MODES[keyof typeof EVOLUTION_MODES];

export interface EvolutionSummary {
  mode: EvolutionMode;
  totalAgentsEvolved: number;
  evolutionCycles: number;
  totalKnowledgeGained: number;
  totalCompetitions: number;
  totalCrystallizations: number;
  averageEvolutionGain: number;
  durationMs: number;
  evolutionRate: string;
}

export interface EvolutionResult {
  agentId: string;
  agentName: string;
  previousScore: number;
  newScore: number;
  evolutionGain: number;
  knowledgeTransferred: number;
  competitionsWon: number;
  memoriesCrystallized: number;
}

export interface HyperEvolutionState {
  isEvolving: boolean;
  currentMode: EvolutionMode | null;
  currentCycle: number;
  totalCycles: number;
  lastEvolution: Date | null;
  sessionsCompleted: number;
  totalAgentsEvolved: number;
  totalKnowledgeGained: number;
  autoEvolutionEnabled: boolean;
  evolutionIntervalMinutes: number;
}

export function useHyperEvolution() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionRef = useRef(0);

  const [state, setState] = useState<HyperEvolutionState>({
    isEvolving: false,
    currentMode: null,
    currentCycle: 0,
    totalCycles: 0,
    lastEvolution: null,
    sessionsCompleted: 0,
    totalAgentsEvolved: 0,
    totalKnowledgeGained: 0,
    autoEvolutionEnabled: false,
    evolutionIntervalMinutes: 5, // Aggressive: every 5 minutes
  });

  const [recentResults, setRecentResults] = useState<EvolutionResult[]>([]);
  const [evolutionHistory, setEvolutionHistory] = useState<EvolutionSummary[]>([]);

  // Execute a single evolution burst
  const evolve = useCallback(async (options: {
    mode?: EvolutionMode;
    batchSize?: number;
    intensityMultiplier?: number;
    evolutionCycles?: number;
    targetSector?: string | null;
  } = {}): Promise<{ success: boolean; summary?: EvolutionSummary }> => {
    if (!user?.id) {
      toast.error('Authentication required for hyper-evolution');
      return { success: false };
    }

    const mode = options.mode || EVOLUTION_MODES.FULL_ACCELERATION;
    const cycles = options.evolutionCycles || 5;

    setState(prev => ({
      ...prev,
      isEvolving: true,
      currentMode: mode,
      currentCycle: 0,
      totalCycles: cycles,
    }));

    sessionRef.current++;
    const sessionId = sessionRef.current;

    try {
      const { data, error } = await supabase.functions.invoke('agent-hyper-evolution', {
        body: {
          mode,
          batchSize: options.batchSize || 500,
          intensityMultiplier: options.intensityMultiplier || 3.0,
          evolutionCycles: cycles,
          targetSector: options.targetSector || null,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        const summary = data.summary as EvolutionSummary;
        const results = data.topEvolutions as EvolutionResult[];

        setState(prev => ({
          ...prev,
          isEvolving: false,
          currentMode: null,
          currentCycle: cycles,
          lastEvolution: new Date(),
          sessionsCompleted: prev.sessionsCompleted + 1,
          totalAgentsEvolved: prev.totalAgentsEvolved + summary.totalAgentsEvolved,
          totalKnowledgeGained: prev.totalKnowledgeGained + summary.totalKnowledgeGained,
        }));

        setRecentResults(results);
        setEvolutionHistory(prev => [summary, ...prev].slice(0, 20));

        toast.success(
          `🚀 Hyper-Evolution: ${summary.totalAgentsEvolved} agents evolved ` +
          `(+${summary.totalKnowledgeGained.toFixed(1)} knowledge, ` +
          `${summary.totalCompetitions} competitions, ` +
          `${summary.evolutionRate})`
        );

        return { success: true, summary };
      }

      throw new Error(data.error || 'Evolution failed');
    } catch (error) {
      console.error('Hyper-evolution error:', error);
      setState(prev => ({ ...prev, isEvolving: false, currentMode: null }));
      toast.error('Evolution cycle failed');
      return { success: false };
    }
  }, [user?.id]);

  // Start aggressive auto-evolution (for 24-48 hour sprint)
  const startAggressiveEvolution = useCallback((intervalMinutes: number = 5) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setState(prev => ({
      ...prev,
      autoEvolutionEnabled: true,
      evolutionIntervalMinutes: intervalMinutes,
    }));

    // Run immediately
    evolve({ mode: 'full_acceleration', intensityMultiplier: 3.0 });

    // Then run at intervals
    intervalRef.current = setInterval(() => {
      evolve({ mode: 'full_acceleration', intensityMultiplier: 3.0, evolutionCycles: 5 });
    }, intervalMinutes * 60 * 1000);

    toast.success(`⚡ Aggressive evolution started: running every ${intervalMinutes} minutes`);
  }, [evolve]);

  // Stop auto-evolution
  const stopAutoEvolution = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState(prev => ({
      ...prev,
      autoEvolutionEnabled: false,
    }));

    toast.info('Auto-evolution stopped');
  }, []);

  // Run maximum intensity burst (10x normal)
  const runEvolutionSprint = useCallback(async (durationMinutes: number = 60) => {
    const cycles = Math.ceil(durationMinutes / 2); // Run every 2 minutes
    
    toast.info(`🔥 Starting ${durationMinutes}-minute evolution sprint (${cycles} cycles)`);

    for (let i = 0; i < cycles; i++) {
      setState(prev => ({ ...prev, currentCycle: i + 1, totalCycles: cycles }));
      
      await evolve({
        mode: 'full_acceleration',
        batchSize: 1000,
        intensityMultiplier: 5.0, // Maximum intensity
        evolutionCycles: 10,
      });

      // Brief pause between cycles
      if (i < cycles - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    toast.success(`🏆 Evolution sprint complete: ${cycles} cycles finished`);
  }, [evolve]);

  // Run sector-specific evolution
  const evolveSector = useCallback(async (sector: string) => {
    return evolve({
      mode: 'full_acceleration',
      targetSector: sector,
      intensityMultiplier: 4.0,
      evolutionCycles: 10,
    });
  }, [evolve]);

  // Get evolution statistics
  const getEvolutionStats = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data: events } = await supabase
        .from('agent_learning_events')
        .select('event_type, event_data, impact_score, created_at')
        .in('event_type', [
          'hyper_evolution_complete',
          'collective_absorption',
          'hyper_parallel_learning',
          'competition_won',
          'competition_learning',
          'memory_crystallization_complete'
        ])
        .order('created_at', { ascending: false })
        .limit(500);

      if (!events) return null;

      const last24h = events.filter(e => 
        new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      const last48h = events.filter(e => 
        new Date(e.created_at) > new Date(Date.now() - 48 * 60 * 60 * 1000)
      );

      return {
        eventsLast24h: last24h.length,
        eventsLast48h: last48h.length,
        avgImpactScore: events.reduce((sum, e) => sum + (e.impact_score || 0), 0) / (events.length || 1),
        eventTypeBreakdown: events.reduce((acc, e) => {
          acc[e.event_type] = (acc[e.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalKnowledge: events.reduce((sum, e) => {
          const data = e.event_data as any;
          return sum + (data?.totalKnowledgeGained || data?.knowledgeGain || 0);
        }, 0),
        totalCompetitions: events.filter(e => e.event_type === 'competition_won').length,
      };
    } catch (error) {
      console.error('Error fetching evolution stats:', error);
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
    evolutionHistory,

    // Core actions
    evolve,
    startAggressiveEvolution,
    stopAutoEvolution,
    runEvolutionSprint,
    evolveSector,
    getEvolutionStats,

    // Constants
    EVOLUTION_MODES,
  };
}
