import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface SonicSignature {
  complexity_score: number;
  dependency_depth: number;
  evolution_generation: number;
  semantic_hash: string;
  capability_vector: number[];
  waveform_encoding: string;
  frequency_fingerprint: number;
}

interface CodeEvolution {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string;
  sonic_signature: SonicSignature;
  evolution_type: string;
  evolution_status: string;
  source_code: string | null;
  evolved_code: string | null;
  improvement_analysis: Record<string, any>;
  compatibility_score: number;
  performance_impact: Record<string, any>;
  risk_assessment: Record<string, any>;
  integration_plan: Record<string, any>;
  applied_at: string | null;
  applied_by: string | null;
  rollback_available: boolean;
  rollback_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export function useCodeEvolution() {
  const [evolutions, setEvolutions] = useState<CodeEvolution[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const fetchEvolutions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('code_evolutions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformed = (data || []).map(item => ({
        ...item,
        sonic_signature: (item.sonic_signature as unknown as SonicSignature) || {} as SonicSignature,
        improvement_analysis: (item.improvement_analysis as Record<string, any>) || {},
        performance_impact: (item.performance_impact as Record<string, any>) || {},
        risk_assessment: (item.risk_assessment as Record<string, any>) || {},
        integration_plan: (item.integration_plan as Record<string, any>) || {},
        rollback_data: (item.rollback_data as Record<string, any>) || null,
      }));
      
      setEvolutions(transformed);
    } catch (error: any) {
      console.error('Failed to fetch evolutions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeCode = useCallback(async (
    entityName: string,
    entityType: 'agent' | 'workflow' | 'capability' | 'function',
    sourceCode: string,
    entityId?: string
  ) => {
    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('code-evolution-engine', {
        body: {
          action: 'analyze',
          entityType,
          entityId,
          entityName,
          sourceCode,
          userId: user.id
        }
      });

      if (response.error) throw response.error;

      toast({
        title: 'Analysis Complete',
        description: `Found ${response.data.improvement_analysis?.suggestions?.length || 0} potential improvements`,
      });

      return response.data;
    } catch (error: any) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setAnalyzing(false);
    }
  }, [toast]);

  const evolveCode = useCallback(async (
    entityName: string,
    entityType: 'agent' | 'workflow' | 'capability' | 'function',
    sourceCode: string,
    evolutionType: 'improvement' | 'new_feature' | 'refactor' | 'optimization' = 'improvement',
    entityId?: string
  ) => {
    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('code-evolution-engine', {
        body: {
          action: 'evolve',
          entityType,
          entityId,
          entityName,
          sourceCode,
          evolutionType,
          userId: user.id
        }
      });

      if (response.error) throw response.error;

      // Save to database
      const { error: insertError } = await supabase
        .from('code_evolutions')
        .insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          sonic_signature: response.data.sonic_signature as unknown as Json,
          evolution_type: evolutionType,
          evolution_status: 'proposed',
          source_code: sourceCode,
          evolved_code: response.data.evolved_code,
          improvement_analysis: response.data.improvement_analysis as unknown as Json,
          compatibility_score: response.data.compatibility_score,
          performance_impact: response.data.performance_impact as unknown as Json,
          risk_assessment: response.data.risk_assessment as unknown as Json,
          integration_plan: response.data.integration_plan as unknown as Json,
          rollback_data: response.data.rollback_data as unknown as Json
        });

      if (insertError) throw insertError;

      toast({
        title: 'Evolution Generated',
        description: 'Code evolution proposal created successfully',
      });

      await fetchEvolutions();
      return response.data;
    } catch (error: any) {
      toast({
        title: 'Evolution Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setAnalyzing(false);
    }
  }, [toast, fetchEvolutions]);

  const approveEvolution = useCallback(async (evolutionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('code_evolutions')
        .update({
          evolution_status: 'approved',
          applied_at: new Date().toISOString(),
          applied_by: user.id
        })
        .eq('id', evolutionId);

      if (error) throw error;

      toast({
        title: 'Evolution Approved',
        description: 'Ready for integration',
      });

      await fetchEvolutions();
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchEvolutions]);

  const rejectEvolution = useCallback(async (evolutionId: string) => {
    try {
      const { error } = await supabase
        .from('code_evolutions')
        .update({ evolution_status: 'rejected' })
        .eq('id', evolutionId);

      if (error) throw error;

      toast({
        title: 'Evolution Rejected',
        description: 'Proposal has been rejected',
      });

      await fetchEvolutions();
    } catch (error: any) {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchEvolutions]);

  const rollbackEvolution = useCallback(async (evolutionId: string) => {
    try {
      const { error } = await supabase
        .from('code_evolutions')
        .update({ evolution_status: 'rolled_back' })
        .eq('id', evolutionId);

      if (error) throw error;

      toast({
        title: 'Rollback Complete',
        description: 'Evolution has been rolled back',
      });

      await fetchEvolutions();
    } catch (error: any) {
      toast({
        title: 'Rollback Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchEvolutions]);

  useEffect(() => {
    fetchEvolutions();
  }, [fetchEvolutions]);

  return {
    evolutions,
    loading,
    analyzing,
    fetchEvolutions,
    analyzeCode,
    evolveCode,
    approveEvolution,
    rejectEvolution,
    rollbackEvolution
  };
}
