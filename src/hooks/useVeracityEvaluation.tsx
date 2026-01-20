import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlausibilityFactor {
  factor: string;
  score: number;
  explanation: string;
}

export interface Evidence {
  source: string;
  content: string;
  relevance: number;
  type: 'supporting' | 'contradicting' | 'neutral';
}

export interface VeracityEvaluation {
  id?: string;
  statement: string;
  context?: string;
  veracity_score: number;
  confidence_level: 'low' | 'medium' | 'high' | 'very_high';
  plausibility_factors: PlausibilityFactor[];
  supporting_evidence: Evidence[];
  contradicting_evidence: Evidence[];
  knowledge_alignment_score: number;
  contextual_fit_score: number;
  source_reliability_score: number;
  citations: string[];
  evaluation_summary: string;
  related_discovery_id?: string;
  created_at?: string;
}

export interface VeracityStats {
  total: number;
  avg_score: number;
  high_confidence: number;
  distribution: {
    low: number;
    medium: number;
    high: number;
    very_high: number;
  };
}

export function useVeracityEvaluation() {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState<VeracityEvaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<VeracityEvaluation | null>(null);
  const [stats, setStats] = useState<VeracityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const evaluateStatement = useCallback(async (
    statement: string,
    context?: string,
    discoveryId?: string
  ): Promise<VeracityEvaluation | null> => {
    if (!statement.trim()) {
      toast.error('Statement is required');
      return null;
    }

    setIsEvaluating(true);
    setCurrentEvaluation(null);

    try {
      const { data, error } = await supabase.functions.invoke('veracity-evaluator', {
        body: {
          action: 'evaluate',
          statement,
          context,
          discovery_id: discoveryId
        }
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else {
          toast.error(data.error);
        }
        return null;
      }

      const evaluation = data.evaluation;
      setCurrentEvaluation(evaluation);
      setEvaluations(prev => [evaluation, ...prev]);
      
      toast.success(`Veracity evaluated: ${Math.round(evaluation.veracity_score * 100)}% plausible`);
      return evaluation;
    } catch (err) {
      console.error('Veracity evaluation error:', err);
      toast.error('Failed to evaluate veracity');
      return null;
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  const fetchRecentEvaluations = useCallback(async (limit = 10) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('veracity-evaluator', {
        body: { action: 'get_recent', limit }
      });

      if (error) throw error;

      setEvaluations(data.evaluations || []);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      toast.error('Failed to fetch evaluations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchEvaluationsByDiscovery = useCallback(async (discoveryId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('veracity-evaluator', {
        body: { action: 'get_by_discovery', discovery_id: discoveryId }
      });

      if (error) throw error;

      return data.evaluations || [];
    } catch (err) {
      console.error('Error fetching evaluations by discovery:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('veracity-evaluator', {
        body: { action: 'get_stats' }
      });

      if (error) throw error;

      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'text-green-500';
      case 'high': return 'text-emerald-400';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-emerald-400';
    if (score >= 0.4) return 'text-yellow-500';
    if (score >= 0.2) return 'text-orange-400';
    return 'text-red-400';
  };

  return {
    isEvaluating,
    isLoading,
    evaluations,
    currentEvaluation,
    stats,
    evaluateStatement,
    fetchRecentEvaluations,
    fetchEvaluationsByDiscovery,
    fetchStats,
    getConfidenceColor,
    getScoreColor,
  };
}
