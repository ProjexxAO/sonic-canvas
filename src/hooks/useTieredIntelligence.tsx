// Tiered Intelligence Hook - Unified routing system that minimizes LLM dependency
// Tier 1: Instant deterministic routing (0ms) - uses pre-computed agent scores
// Tier 2: Fast local processing (50-200ms) - pattern matching, cached responses
// Tier 3: LLM fallback (1-5s) - only when Tier 1+2 insufficient

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type IntelligenceTier = 'tier1' | 'tier2' | 'tier3';

export interface TieredRoutingResult {
  tier: IntelligenceTier;
  agents: AgentRouteResult[];
  taskType: string;
  domain: string | null;
  confidence: number;
  routingTimeMs: number;
  llmRequired: boolean;
  reason: string;
}

export interface AgentRouteResult {
  agentId: string;
  agentName: string;
  sector: string;
  hierarchyTier: string;
  seraphimId: string | null;
  specializationScore: number;
  successRate: number;
  confidence: number;
  routingReason: string;
}

export interface IntentParseResult {
  taskType: string;
  domain: string | null;
  confidence: number;
  matchedPattern: string | null;
  requiresLlm: boolean;
}

export interface TierStats {
  taskType: string;
  totalSpecialists: number;
  avgSpecialization: number;
  canTier1Route: boolean;
  recommendedTier: string;
}

export interface TieredIntelligenceState {
  isRouting: boolean;
  lastRoutingTier: IntelligenceTier | null;
  tier1Hits: number;
  tier2Hits: number;
  tier3Hits: number;
  avgRoutingTimeMs: number;
  llmCallsSaved: number;
}

export function useTieredIntelligence() {
  const { user } = useAuth();
  
  const [state, setState] = useState<TieredIntelligenceState>({
    isRouting: false,
    lastRoutingTier: null,
    tier1Hits: 0,
    tier2Hits: 0,
    tier3Hits: 0,
    avgRoutingTimeMs: 0,
    llmCallsSaved: 0,
  });

  // Tier 1: Parse intent deterministically (no LLM)
  const parseIntent = useCallback(async (query: string): Promise<IntentParseResult> => {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase
        .rpc('tier1_parse_intent', { p_query: query });
      
      if (error) throw error;
      
      const result = data?.[0];
      
      return {
        taskType: result?.task_type || 'unknown',
        domain: result?.domain || null,
        confidence: Number(result?.confidence) || 0,
        matchedPattern: result?.matched_pattern || null,
        requiresLlm: result?.requires_llm ?? true,
      };
    } catch (error) {
      console.error('[TieredIntelligence] Intent parsing error:', error);
      return {
        taskType: 'unknown',
        domain: null,
        confidence: 0,
        matchedPattern: null,
        requiresLlm: true,
      };
    }
  }, []);

  // Tier 1: Route to agents deterministically (no LLM)
  const routeToAgents = useCallback(async (
    taskType: string,
    options: { confidenceThreshold?: number; limit?: number } = {}
  ): Promise<TieredRoutingResult> => {
    const startTime = performance.now();
    setState(prev => ({ ...prev, isRouting: true }));

    try {
      const { data, error } = await supabase
        .rpc('tier1_deterministic_route', {
          p_task_type: taskType,
          p_confidence_threshold: options.confidenceThreshold ?? 0.7,
          p_limit: options.limit ?? 5,
        });

      if (error) throw error;

      const routingTimeMs = performance.now() - startTime;
      const agents: AgentRouteResult[] = (data || []).map((row: any) => ({
        agentId: row.agent_id,
        agentName: row.agent_name,
        sector: row.sector,
        hierarchyTier: row.hierarchy_tier,
        seraphimId: row.seraphim_id,
        specializationScore: Number(row.specialization_score),
        successRate: Number(row.success_rate),
        confidence: Number(row.confidence),
        routingReason: row.routing_reason,
      }));

      const requiresLlm = agents.length === 0 || agents[0]?.routingReason?.includes('LLM');
      const tier: IntelligenceTier = requiresLlm 
        ? (agents.some(a => a.specializationScore > 0) ? 'tier2' : 'tier3')
        : 'tier1';

      // Update stats
      setState(prev => {
        const newHits = {
          tier1Hits: prev.tier1Hits + (tier === 'tier1' ? 1 : 0),
          tier2Hits: prev.tier2Hits + (tier === 'tier2' ? 1 : 0),
          tier3Hits: prev.tier3Hits + (tier === 'tier3' ? 1 : 0),
        };
        const totalRoutes = newHits.tier1Hits + newHits.tier2Hits + newHits.tier3Hits;
        
        return {
          ...prev,
          isRouting: false,
          lastRoutingTier: tier,
          ...newHits,
          avgRoutingTimeMs: (prev.avgRoutingTimeMs * (totalRoutes - 1) + routingTimeMs) / totalRoutes,
          llmCallsSaved: prev.llmCallsSaved + (tier === 'tier1' ? 1 : 0),
        };
      });

      return {
        tier,
        agents,
        taskType,
        domain: null,
        confidence: agents[0]?.confidence || 0,
        routingTimeMs,
        llmRequired: requiresLlm,
        reason: agents[0]?.routingReason || 'No specialists found',
      };
    } catch (error) {
      console.error('[TieredIntelligence] Routing error:', error);
      setState(prev => ({ ...prev, isRouting: false }));
      
      return {
        tier: 'tier3',
        agents: [],
        taskType,
        domain: null,
        confidence: 0,
        routingTimeMs: performance.now() - startTime,
        llmRequired: true,
        reason: 'Routing error - LLM fallback required',
      };
    }
  }, []);

  // Combined: Parse intent + route to agents in one call
  const intelligentRoute = useCallback(async (
    query: string,
    options: { confidenceThreshold?: number; limit?: number } = {}
  ): Promise<TieredRoutingResult> => {
    // Step 1: Parse intent (Tier 1)
    const intent = await parseIntent(query);
    
    // Step 2: Route to agents based on parsed intent
    const routing = await routeToAgents(intent.taskType, options);
    
    return {
      ...routing,
      domain: intent.domain,
      // Upgrade to tier3 if intent parsing required LLM
      tier: intent.requiresLlm && routing.tier === 'tier1' ? 'tier2' : routing.tier,
      llmRequired: intent.requiresLlm || routing.llmRequired,
    };
  }, [parseIntent, routeToAgents]);

  // Get routing tier statistics for all known task types
  const getTierStats = useCallback(async (): Promise<TierStats[]> => {
    try {
      const { data, error } = await supabase.rpc('get_routing_tier_stats');
      
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        taskType: row.task_type,
        totalSpecialists: row.total_specialists,
        avgSpecialization: Number(row.avg_specialization),
        canTier1Route: row.can_tier1_route,
        recommendedTier: row.recommended_tier,
      }));
    } catch (error) {
      console.error('[TieredIntelligence] Error fetching tier stats:', error);
      return [];
    }
  }, []);

  // Get efficiency report
  const getEfficiencyReport = useCallback(() => {
    const total = state.tier1Hits + state.tier2Hits + state.tier3Hits;
    if (total === 0) return null;
    
    return {
      totalRoutes: total,
      tier1Percentage: (state.tier1Hits / total) * 100,
      tier2Percentage: (state.tier2Hits / total) * 100,
      tier3Percentage: (state.tier3Hits / total) * 100,
      llmCallsSaved: state.llmCallsSaved,
      estimatedTimeSavedMs: state.llmCallsSaved * 2000, // Assume 2s per LLM call saved
      estimatedCostSaved: state.llmCallsSaved * 0.002, // Rough estimate per LLM call
      avgRoutingTimeMs: state.avgRoutingTimeMs,
    };
  }, [state]);

  return {
    // State
    ...state,
    
    // Core routing functions
    parseIntent,
    routeToAgents,
    intelligentRoute,
    
    // Analytics
    getTierStats,
    getEfficiencyReport,
  };
}
