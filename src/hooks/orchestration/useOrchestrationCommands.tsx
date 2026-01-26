// Orchestration Commands - Handles command execution and routing
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';
import { AGENT_FLEET_CONFIG } from './useFleetManagement';
import { toast } from 'sonner';

export type OrchestrationMode = 
  | 'autonomous'
  | 'coordinated'
  | 'supervised'
  | 'swarm'
  | 'pipeline'
  | 'hybrid';

export type HubType = 'personal' | 'group' | 'csuite' | 'all';

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
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}

export function useOrchestrationCommands(
  userId: string | undefined,
  onFleetRefresh: () => Promise<void>
) {
  const [commandQueue, setCommandQueue] = useState<OrchestrationCommand[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const agentOrchestration = useAgentOrchestration(userId);

  const executeCommand = useCallback(async (command: OrchestrationCommand): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    agentsDeployed?: number;
  }> => {
    if (!userId) return { success: false, error: 'Authentication required' };

    setIsOrchestrating(true);
    setCommandQueue(prev => [...prev, command]);

    try {
      let result: any;
      let agentsDeployed = 0;

      switch (command.type) {
        case 'execute':
          result = await supabase.functions.invoke('atlas-orchestrator', {
            body: {
              action: 'orchestrate_agents',
              userId,
              request: command.payload.request,
              orchestrationMode: command.orchestrationMode,
              priority: command.priority,
            },
          });
          agentsDeployed = command.agentCount || 1;
          break;

        case 'allocate':
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
          result = await supabase.functions.invoke('atlas-orchestrator', {
            body: {
              action: 'orchestrate_agents',
              userId,
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
          result = { recalled: true, agents: command.agentCount || 0 };
          toast.info(`Recalled ${command.agentCount || 0} agents`);
          break;
      }

      setCommandQueue(prev => prev.filter(c => c.id !== command.id));
      await onFleetRefresh();

      return { success: true, result: result?.data || result, agentsDeployed };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Orchestration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsOrchestrating(false);
    }
  }, [userId, agentOrchestration, onFleetRefresh]);

  const executeSwarm = useCallback(async (
    task: string,
    agentCount: number,
    domain?: string
  ) => {
    const command: OrchestrationCommand = {
      id: `swarm-${Date.now()}`,
      type: 'execute',
      targetHub: 'all',
      targetDomain: domain,
      agentCount: Math.min(agentCount, 10000),
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

  const executePipeline = useCallback(async (
    stages: Array<{ name: string; action: string; params: Record<string, any>; agentCount?: number }>
  ) => {
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

  return {
    commandQueue,
    isOrchestrating,
    executeCommand,
    executeSwarm,
    executePipeline,
    agentOrchestration,
  };
}
