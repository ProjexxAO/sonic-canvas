import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnterpriseQueryOptions {
  depth?: 'brief' | 'standard' | 'detailed';
  includeAgents?: boolean;
  timeRange?: 'day' | 'week' | 'month' | 'all';
}

interface DomainSummary {
  domain: string;
  count: number;
}

interface QueryResult {
  answer: string;
  dataContext: {
    domains: DomainSummary[];
    agentCount: number;
    timeRange: string;
  };
  agents: any[];
}

interface Correlation {
  type: 'pattern' | 'timeline' | 'entity' | 'causal';
  domains: string[];
  description: string;
  confidence: 'high' | 'medium' | 'low';
  items: string[];
}

interface CorrelationResult {
  correlations: Correlation[];
  insights: string[];
  recommendations: string[];
  analyzedDomains: string[];
  totalItems: number;
}

interface Finding {
  domain: string;
  finding: string;
  severity: 'high' | 'medium' | 'low';
  evidence: string;
}

interface Risk {
  risk: string;
  probability: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

interface Opportunity {
  opportunity: string;
  potential: 'high' | 'medium' | 'low';
  requiredAction: string;
}

interface AgentRecommendation {
  agentName: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
}

interface ActionItem {
  action: string;
  owner: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
}

interface AnalysisResult {
  executiveSummary: string;
  findings: Finding[];
  risks: Risk[];
  opportunities: Opportunity[];
  agentRecommendations: AgentRecommendation[];
  actionItems: ActionItem[];
  metadata: {
    analyzedAt: string;
    domainsAnalyzed: string[];
    totalDataPoints: number;
    agentsAvailable: number;
  };
}

interface RecommendationAction {
  action: string;
  rationale?: string;
  impact?: string;
  timeline?: string;
  resources?: string;
}

interface StrategicInitiative {
  initiative: string;
  goal: string;
  kpis: string[];
}

interface OptimizationSuggestion {
  area: string;
  suggestion: string;
  benefit: string;
}

interface RecommendationResult {
  immediate: RecommendationAction[];
  shortTerm: RecommendationAction[];
  strategic: StrategicInitiative[];
  optimization: OptimizationSuggestion[];
  generatedAt: string;
  basedOn: DomainSummary[];
}

interface WorkflowTriggerResult {
  workflowId: string;
  runId: string;
  status: string;
  result: any;
}

export function useAtlasEnterprise(userId: string | undefined, personaId?: string | null) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState<QueryResult | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [lastCorrelation, setLastCorrelation] = useState<CorrelationResult | null>(null);
  const [lastRecommendations, setLastRecommendations] = useState<RecommendationResult | null>(null);

  const executeEnterpriseQuery = useCallback(async (
    action: 'query' | 'correlate' | 'analyze' | 'recommend' | 'workflow_trigger',
    params: {
      query?: string;
      domains?: string[];
      agentContext?: { agentIds?: string[]; sector?: string; capabilities?: string[] };
      workflowId?: string;
      options?: EnterpriseQueryOptions;
    }
  ) => {
    if (!userId) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to use enterprise features.',
        variant: 'destructive'
      });
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('atlas-enterprise-query', {
        body: {
          action,
          userId,
          personaId, // Include persona for permission filtering
          ...params
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[Atlas Enterprise] Error:', error);
      toast({
        title: 'Enterprise Query Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, personaId, toast]);

  const queryEnterprise = useCallback(async (
    query: string,
    options?: EnterpriseQueryOptions
  ): Promise<QueryResult | null> => {
    const result = await executeEnterpriseQuery('query', { 
      query, 
      options: { ...options, includeAgents: true } 
    });
    if (result) setLastQuery(result);
    return result;
  }, [executeEnterpriseQuery]);

  const findCorrelations = useCallback(async (
    domains?: string[],
    options?: EnterpriseQueryOptions
  ): Promise<CorrelationResult | null> => {
    const result = await executeEnterpriseQuery('correlate', { domains, options });
    if (result) setLastCorrelation(result);
    return result;
  }, [executeEnterpriseQuery]);

  const analyzeEnterprise = useCallback(async (
    query?: string,
    domains?: string[],
    options?: EnterpriseQueryOptions
  ): Promise<AnalysisResult | null> => {
    const result = await executeEnterpriseQuery('analyze', { 
      query, 
      domains, 
      options: { ...options, includeAgents: true, depth: 'detailed' } 
    });
    if (result) setLastAnalysis(result);
    return result;
  }, [executeEnterpriseQuery]);

  const getRecommendations = useCallback(async (
    focus?: string,
    options?: EnterpriseQueryOptions
  ): Promise<RecommendationResult | null> => {
    const result = await executeEnterpriseQuery('recommend', { query: focus, options });
    if (result) setLastRecommendations(result);
    return result;
  }, [executeEnterpriseQuery]);

  const triggerWorkflow = useCallback(async (
    workflowId: string,
    query?: string
  ): Promise<WorkflowTriggerResult | null> => {
    return await executeEnterpriseQuery('workflow_trigger', { workflowId, query });
  }, [executeEnterpriseQuery]);

  return {
    // State
    isLoading,
    lastQuery,
    lastAnalysis,
    lastCorrelation,
    lastRecommendations,
    
    // Actions
    queryEnterprise,
    findCorrelations,
    analyzeEnterprise,
    getRecommendations,
    triggerWorkflow
  };
}
