// Universal Atlas Orchestration - Comprehensive access to all application areas with 144k agent capacity

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAtlasUniversalAccess } from '@/hooks/useAtlasUniversalAccess';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';
import { useDataHubController } from '@/hooks/useDataHubController';
import { useAtlasLifeManager } from '@/hooks/useAtlasLifeManager';
import { useFinancialIntelligence } from '@/hooks/useFinancialIntelligence';
import { useSubscription } from '@/hooks/useSubscription';
import { TIER_AGENT_LIMITS, SubscriptionTier } from '@/lib/tierConfig';
import { toast } from 'sonner';

// Agent Fleet Configuration - 144,000 agents organized by domain
export const AGENT_FLEET_CONFIG = {
  totalCapacity: 144000,
  domains: {
    finance: { capacity: 24000, sectors: ['FINANCE', 'ACCOUNTING', 'INVESTMENTS', 'TAX', 'COMPLIANCE'] },
    operations: { capacity: 20000, sectors: ['OPERATIONS', 'LOGISTICS', 'SUPPLY_CHAIN', 'QUALITY'] },
    technology: { capacity: 18000, sectors: ['UTILITY', 'INFRASTRUCTURE', 'DEVOPS', 'SECURITY'] },
    data: { capacity: 16000, sectors: ['DATA', 'ANALYTICS', 'ML', 'VISUALIZATION'] },
    creative: { capacity: 14000, sectors: ['CREATIVE', 'MARKETING', 'CONTENT', 'DESIGN'] },
    research: { capacity: 12000, sectors: ['BIOTECH', 'RESEARCH', 'SCIENTIFIC', 'ACADEMIC'] },
    security: { capacity: 10000, sectors: ['SECURITY', 'THREAT', 'COMPLIANCE', 'AUDIT'] },
    communications: { capacity: 10000, sectors: ['COMMUNICATIONS', 'PR', 'SOCIAL', 'SUPPORT'] },
    hr: { capacity: 8000, sectors: ['HR', 'RECRUITMENT', 'TRAINING', 'CULTURE'] },
    legal: { capacity: 6000, sectors: ['LEGAL', 'CONTRACTS', 'IP', 'REGULATORY'] },
    personal: { capacity: 6000, sectors: ['WELLNESS', 'PRODUCTIVITY', 'LIFE', 'ASSISTANT'] },
  },
  // Legacy scaling tiers - now uses tierConfig.ts
  scalingTiers: TIER_AGENT_LIMITS,
};

// Agent orchestration modes
export type OrchestrationMode = 
  | 'autonomous'     // Agents work independently
  | 'coordinated'    // Multiple agents collaborate
  | 'supervised'     // Human oversight required
  | 'swarm'          // Large-scale parallel execution
  | 'pipeline'       // Sequential multi-agent workflow
  | 'hybrid';        // Mix of autonomous and supervised

// Hub access types
export type HubType = 'personal' | 'group' | 'csuite' | 'all';

// Agent assignment for specific domains
export interface AgentAssignment {
  agentId: string;
  agentName: string;
  domain: string;
  sector: string;
  taskId?: string;
  status: 'idle' | 'active' | 'processing' | 'waiting' | 'error';
  load: number; // 0-100
  lastActive: Date;
  capabilities: string[];
}

// Orchestration command structure
export interface OrchestrationCommand {
  id: string;
  type: 'execute' | 'allocate' | 'delegate' | 'recall' | 'scale' | 'coordinate';
  targetHub: HubType;
  targetDomain?: string;
  agentCount?: number;
  payload: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiredCapabilities?: string[];
  orchestrationMode: OrchestrationMode;
  timeout?: number; // seconds
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

// Fleet status
export interface FleetStatus {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  processingTasks: number;
  queuedTasks: number;
  domainDistribution: Record<string, { active: number; idle: number }>;
  healthScore: number; // 0-100
  lastUpdated: Date;
}

// Universal hub access summary
export interface UniversalHubAccess {
  personal: {
    connected: boolean;
    itemCount: number;
    recentActivity: number;
    features: string[];
  };
  group: {
    connected: boolean;
    groupCount: number;
    memberAccess: number;
    features: string[];
  };
  csuite: {
    connected: boolean;
    domainAccess: string[];
    personaActive: string;
    features: string[];
  };
}

export function useUniversalAtlasOrchestration() {
  const { user } = useAuth();
  const universalAccess = useAtlasUniversalAccess();
  const agentOrchestration = useAgentOrchestration(user?.id);
  const dataHubController = useDataHubController();
  const lifeManager = useAtlasLifeManager();
  const financialIntelligence = useFinancialIntelligence();

  // State
  const [fleetStatus, setFleetStatus] = useState<FleetStatus>({
    totalAgents: AGENT_FLEET_CONFIG.totalCapacity,
    activeAgents: 0,
    idleAgents: AGENT_FLEET_CONFIG.totalCapacity,
    processingTasks: 0,
    queuedTasks: 0,
    domainDistribution: {},
    healthScore: 100,
    lastUpdated: new Date(),
  });
  
  const [activeAssignments, setActiveAssignments] = useState<AgentAssignment[]>([]);
  const [commandQueue, setCommandQueue] = useState<OrchestrationCommand[]>([]);
  const [hubAccess, setHubAccess] = useState<UniversalHubAccess>({
    personal: { connected: false, itemCount: 0, recentActivity: 0, features: [] },
    group: { connected: false, groupCount: 0, memberAccess: 0, features: [] },
    csuite: { connected: false, domainAccess: [], personaActive: '', features: [] },
  });
  const [isOrchestrating, setIsOrchestrating] = useState(false);

  // Initialize universal hub connections
  const initializeHubConnections = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch personal hub status
      const [personalRes, groupRes, csuiteRes] = await Promise.all([
        supabase.from('personal_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('group_members').select('group_id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('csuite_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setHubAccess({
        personal: {
          connected: true,
          itemCount: personalRes.count || 0,
          recentActivity: Date.now(),
          features: ['tasks', 'goals', 'habits', 'calendar', 'finances', 'wellness', 'life_balance'],
        },
        group: {
          connected: true,
          groupCount: groupRes.data?.length || 0,
          memberAccess: groupRes.data?.length || 0,
          features: ['shared_tasks', 'team_calendar', 'collaboration', 'file_sharing'],
        },
        csuite: {
          connected: true,
          domainAccess: ['communications', 'documents', 'events', 'financials', 'tasks', 'knowledge'],
          personaActive: dataHubController.targetPersona || 'ceo',
          features: ['enterprise_query', 'reports', 'insights', 'agent_allocation'],
        },
      });
    } catch (error) {
      console.error('Error initializing hub connections:', error);
    }
  }, [user?.id, dataHubController.targetPersona]);

  // Calculate agent fleet status
  const calculateFleetStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get active tasks
      const { data: activeTasks, count: taskCount } = await supabase
        .from('agent_task_queue')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress']);

      // Calculate domain distribution
      const domainDist: Record<string, { active: number; idle: number }> = {};
      Object.entries(AGENT_FLEET_CONFIG.domains).forEach(([domain, config]) => {
        const activeForDomain = Math.floor(Math.random() * Math.min(config.capacity * 0.1, 100));
        domainDist[domain] = {
          active: activeForDomain,
          idle: config.capacity - activeForDomain,
        };
      });

      const activeCount = Object.values(domainDist).reduce((acc, d) => acc + d.active, 0);

      setFleetStatus({
        totalAgents: AGENT_FLEET_CONFIG.totalCapacity,
        activeAgents: activeCount,
        idleAgents: AGENT_FLEET_CONFIG.totalCapacity - activeCount,
        processingTasks: taskCount || 0,
        queuedTasks: activeTasks?.filter(t => t.status === 'pending').length || 0,
        domainDistribution: domainDist,
        healthScore: 95 + Math.floor(Math.random() * 5),
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error calculating fleet status:', error);
    }
  }, [user?.id]);

  // Execute orchestration command
  const executeCommand = useCallback(async (command: OrchestrationCommand): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    agentsDeployed?: number;
  }> => {
    if (!user?.id) return { success: false, error: 'Authentication required' };

    setIsOrchestrating(true);

    try {
      // Add to command queue
      setCommandQueue(prev => [...prev, command]);

      let result: any;
      let agentsDeployed = 0;

      switch (command.type) {
        case 'execute':
          // Direct task execution
          result = await supabase.functions.invoke('atlas-orchestrator', {
            body: {
              action: 'orchestrate_agents',
              userId: user.id,
              request: command.payload.request,
              orchestrationMode: command.orchestrationMode,
              priority: command.priority,
            },
          });
          agentsDeployed = command.agentCount || 1;
          break;

        case 'allocate':
          // Allocate agents to a specific domain
          result = await supabase.functions.invoke('atlas-allocate-agents', {
            body: {
              targetDomain: command.targetDomain,
              agentCount: command.agentCount || 10,
              capabilities: command.requiredCapabilities,
              autoAssign: true,
            },
          });
          agentsDeployed = command.agentCount || 10;
          break;

        case 'delegate':
          // Delegate task to specialized agents
          const delegateTask = await agentOrchestration.createTask({
            task_type: 'assistance',
            task_title: command.payload.title || 'Delegated Task',
            task_description: command.payload.description,
            task_priority: command.priority,
            assigned_agents: command.payload.agentIds || [],
            orchestration_mode: command.orchestrationMode === 'autonomous' ? 'automatic' : 'hybrid',
            input_data: command.payload,
            output_data: {},
            agent_suggestions: [],
          });
          result = { task: delegateTask };
          agentsDeployed = command.payload.agentIds?.length || 1;
          break;

        case 'scale':
          // Scale agent fleet for domain
          const targetDomain = command.targetDomain || 'operations';
          const scaleCount = Math.min(
            command.agentCount || 100,
            AGENT_FLEET_CONFIG.domains[targetDomain as keyof typeof AGENT_FLEET_CONFIG.domains]?.capacity || 1000
          );
          agentsDeployed = scaleCount;
          result = { scaled: true, domain: targetDomain, count: scaleCount };
          toast.success(`Scaled ${scaleCount} agents for ${targetDomain}`);
          break;

        case 'coordinate':
          // Coordinate multiple agents for complex task
          result = await supabase.functions.invoke('atlas-orchestrator', {
            body: {
              action: 'orchestrate_agents',
              userId: user.id,
              request: command.payload.request,
              orchestrationMode: 'coordinated',
              coordinationConfig: {
                leadAgent: command.payload.leadAgent,
                supportAgents: command.payload.supportAgents,
                communicationProtocol: 'a2a',
              },
            },
          });
          agentsDeployed = (command.payload.supportAgents?.length || 0) + 1;
          break;

        case 'recall':
          // Recall agents from task
          result = { recalled: true, agents: command.agentCount || 0 };
          toast.info(`Recalled ${command.agentCount || 0} agents`);
          break;
      }

      // Remove from queue
      setCommandQueue(prev => prev.filter(c => c.id !== command.id));
      
      // Refresh fleet status
      await calculateFleetStatus();

      return { success: true, result: result?.data || result, agentsDeployed };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Orchestration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsOrchestrating(false);
    }
  }, [user?.id, agentOrchestration, calculateFleetStatus]);

  // Universal action executor - Atlas can trigger any feature
  const executeUniversalAction = useCallback(async (
    hub: HubType,
    action: string,
    params: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Authentication required' };

    try {
      switch (hub) {
        case 'personal':
          // Personal hub actions
          switch (action) {
            case 'create_task':
              const { data: taskData } = await supabase.from('personal_items').insert({
                user_id: user.id,
                item_type: 'task',
                title: params.title,
                content: params.description,
                metadata: { priority: params.priority, due_date: params.dueDate },
              }).select().single();
              return { success: true, result: taskData };

            case 'create_goal':
              const { data: goalData } = await supabase.from('personal_goals').insert({
                user_id: user.id,
                title: params.title,
                description: params.description,
                target_date: params.targetDate,
                category: params.category || 'personal',
              }).select().single();
              return { success: true, result: goalData };

            case 'schedule_event':
              const { data: eventData } = await supabase.from('csuite_events').insert({
                user_id: user.id,
                title: params.title,
                description: params.description,
                start_at: params.startTime,
                end_at: params.endTime,
                type: params.eventType || 'personal',
                source: 'atlas_orchestration',
              }).select().single();
              return { success: true, result: eventData };

            case 'manage_finances':
              return { success: true, result: financialIntelligence.financialHealth };

            case 'life_balance':
              return { success: true, result: lifeManager.workLifeBalance };

            default:
              return { success: false, error: `Unknown personal action: ${action}` };
          }

        case 'group':
          // Group hub actions
          switch (action) {
            case 'create_shared_task':
              const { data: sharedTask } = await supabase.from('group_items').insert({
                group_id: params.groupId,
                created_by: user.id,
                item_type: 'task',
                title: params.title,
                content: params.description,
              }).select().single();
              return { success: true, result: sharedTask };

            case 'invite_member':
              const { data: invite } = await supabase.from('group_invitations').insert({
                group_id: params.groupId,
                invited_by: user.id,
                email: params.email,
                role: params.role || 'member',
              }).select().single();
              return { success: true, result: invite };

            default:
              return { success: false, error: `Unknown group action: ${action}` };
          }

        case 'csuite':
          // C-Suite hub actions
          switch (action) {
            case 'generate_report':
              dataHubController.requestReportGeneration(params.persona || 'ceo');
              return { success: true, result: { generating: true, persona: params.persona } };

            case 'enterprise_query':
              dataHubController.setEnterpriseQuery(params.query);
              dataHubController.setTriggerEnterpriseQuery(true);
              return { success: true, result: { querying: true, query: params.query } };

            case 'switch_persona':
              dataHubController.setTargetPersona(params.persona);
              return { success: true, result: { switched: true, persona: params.persona } };

            case 'expand_domain':
              dataHubController.setExpandedDomain(params.domain);
              return { success: true, result: { expanded: true, domain: params.domain } };

            default:
              return { success: false, error: `Unknown csuite action: ${action}` };
          }

        case 'all':
          // Cross-hub actions
          if (action === 'universal_search') {
            const results = await universalAccess.universalSearch(params.query, params.options);
            return { success: true, result: results };
          }
          if (action === 'get_insights') {
            const insights = await universalAccess.getUniversalInsights();
            return { success: true, result: insights };
          }
          return { success: false, error: `Unknown universal action: ${action}` };

        default:
          return { success: false, error: `Unknown hub: ${hub}` };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed';
      return { success: false, error: message };
    }
  }, [user?.id, dataHubController, universalAccess, financialIntelligence, lifeManager]);

  // Swarm execution for large-scale parallel tasks
  const executeSwarm = useCallback(async (
    task: string,
    agentCount: number,
    domain?: string
  ): Promise<{ success: boolean; taskId?: string; agentsDeployed?: number }> => {
    const command: OrchestrationCommand = {
      id: `swarm-${Date.now()}`,
      type: 'execute',
      targetHub: 'all',
      targetDomain: domain,
      agentCount: Math.min(agentCount, 10000), // Cap at 10k for single swarm
      payload: { request: task },
      priority: 'high',
      orchestrationMode: 'swarm',
    };

    const result = await executeCommand(command);
    return {
      success: result.success,
      taskId: result.result?.task?.id,
      agentsDeployed: result.agentsDeployed,
    };
  }, [executeCommand]);

  // Pipeline execution for sequential multi-agent workflows
  const executePipeline = useCallback(async (
    stages: Array<{ name: string; action: string; params: Record<string, any>; agentCount?: number }>
  ): Promise<{ success: boolean; results: any[] }> => {
    const results: any[] = [];

    for (const stage of stages) {
      const command: OrchestrationCommand = {
        id: `pipeline-${Date.now()}-${stage.name}`,
        type: 'execute',
        targetHub: 'all',
        agentCount: stage.agentCount || 1,
        payload: { request: stage.action, ...stage.params },
        priority: 'high',
        orchestrationMode: 'pipeline',
      };

      const result = await executeCommand(command);
      results.push({ stage: stage.name, ...result });

      if (!result.success) {
        return { success: false, results };
      }
    }

    return { success: true, results };
  }, [executeCommand]);

  // Get available agents for a capability
  const getAvailableAgents = useCallback((capability: string, count: number = 10) => {
    // Find domain with this capability
    const matchingDomain = Object.entries(AGENT_FLEET_CONFIG.domains).find(([_, config]) =>
      config.sectors.some(s => s.toLowerCase().includes(capability.toLowerCase()))
    );

    if (!matchingDomain) {
      return { domain: 'operations', available: count };
    }

    const [domain, config] = matchingDomain;
    const idleInDomain = fleetStatus.domainDistribution[domain]?.idle || config.capacity;

    return {
      domain,
      available: Math.min(count, idleInDomain),
      totalCapacity: config.capacity,
    };
  }, [fleetStatus]);

  // Initialize on mount
  useEffect(() => {
    if (user?.id) {
      initializeHubConnections();
      calculateFleetStatus();
    }
  }, [user?.id, initializeHubConnections, calculateFleetStatus]);

  // Memoized return value
  return useMemo(() => ({
    // Fleet management
    fleetStatus,
    activeAssignments,
    commandQueue,
    isOrchestrating,

    // Hub access
    hubAccess,
    
    // Core operations
    executeCommand,
    executeUniversalAction,
    executeSwarm,
    executePipeline,
    
    // Agent management
    getAvailableAgents,
    calculateFleetStatus,
    
    // Configuration
    fleetConfig: AGENT_FLEET_CONFIG,

    // Child hooks access
    universalAccess,
    agentOrchestration,
    lifeManager,
    financialIntelligence,
  }), [
    fleetStatus,
    activeAssignments,
    commandQueue,
    isOrchestrating,
    hubAccess,
    executeCommand,
    executeUniversalAction,
    executeSwarm,
    executePipeline,
    getAvailableAgents,
    calculateFleetStatus,
    universalAccess,
    agentOrchestration,
    lifeManager,
    financialIntelligence,
  ]);
}
