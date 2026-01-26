// Fleet Management - Handles agent fleet status and domain distribution
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
};

export interface FleetStatus {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  processingTasks: number;
  queuedTasks: number;
  domainDistribution: Record<string, { active: number; idle: number }>;
  healthScore: number;
  lastUpdated: Date;
}

export function useFleetManagement(userId: string | undefined) {
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

  const calculateFleetStatus = useCallback(async () => {
    if (!userId) return;

    try {
      const { data: activeTasks, count: taskCount } = await supabase
        .from('agent_task_queue')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress']);

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
  }, [userId]);

  const getAvailableAgents = useCallback((capability: string, count: number = 10) => {
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

  return {
    fleetStatus,
    calculateFleetStatus,
    getAvailableAgents,
    fleetConfig: AGENT_FLEET_CONFIG,
  };
}
