import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWorkspaces } from './useWorkspaces';
import { toast } from 'sonner';

export interface AllocatedAgent {
  id: string;
  name: string;
  sector: string;
  class: string;
  designation: string;
  description: string | null;
  capabilities: string[] | null;
  relevanceScore: number;
  relevanceReason: string;
}

export interface AllocationContext {
  tier: string;
  allowedClasses: string[];
  persona: string;
  industry: string;
  primarySectors: string[];
}

export interface AllocationResult {
  recommendations: AllocatedAgent[];
  context: AllocationContext;
  autoAssigned: number;
}

export function useAgentAllocation() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaces();
  const [recommendations, setRecommendations] = useState<AllocatedAgent[]>([]);
  const [context, setContext] = useState<AllocationContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (options?: {
    persona?: string;
    autoAssign?: boolean;
    limit?: number;
  }) => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('atlas-allocate-agents', {
        body: {
          userId: user.id,
          workspaceId: currentWorkspace?.id,
          persona: options?.persona,
          autoAssign: options?.autoAssign || false,
          limit: options?.limit || 5,
        },
      });

      if (fnError) throw fnError;

      const result = data as AllocationResult;
      setRecommendations(result.recommendations);
      setContext(result.context);

      if (options?.autoAssign && result.autoAssigned > 0) {
        toast.success(`${result.autoAssigned} agents allocated to your profile`);
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch recommendations';
      setError(message);
      toast.error('Failed to get agent recommendations');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentWorkspace?.id]);

  const allocateAgents = useCallback(async (agentIds: string[]) => {
    if (!user?.id) return false;

    try {
      const assignments = agentIds.map(agentId => ({
        user_id: user.id,
        agent_id: agentId,
        assigned_by: null,
      }));

      const { error } = await supabase
        .from('user_agents')
        .upsert(assignments, { onConflict: 'user_id,agent_id' });

      if (error) throw error;

      toast.success(`${agentIds.length} agent(s) allocated successfully`);
      
      // Remove allocated agents from recommendations
      setRecommendations(prev => prev.filter(a => !agentIds.includes(a.id)));
      
      return true;
    } catch (err) {
      toast.error('Failed to allocate agents');
      return false;
    }
  }, [user?.id]);

  const getTierLabel = (tier: string): string => {
    const labels: Record<string, string> = {
      'free': 'Free',
      'personal': 'Personal',
      'pro': 'Pro',
      'team': 'Team',
      'enterprise': 'Enterprise',
    };
    return labels[tier] || tier;
  };

  const getClassColor = (agentClass: string): string => {
    const colors: Record<string, string> = {
      'BASIC': 'text-muted-foreground',
      'ADVANCED': 'text-primary',
      'ELITE': 'text-secondary',
      'SINGULARITY': 'text-accent',
    };
    return colors[agentClass] || 'text-muted-foreground';
  };

  return {
    recommendations,
    context,
    loading,
    error,
    fetchRecommendations,
    allocateAgents,
    getTierLabel,
    getClassColor,
  };
}
