// Universal Atlas Orchestration - Refactored with modular architecture
// Comprehensive access to all application areas with 144k agent capacity

import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  useFleetManagement, 
  useOrchestrationCommands, 
  useHubConnections,
  AGENT_FLEET_CONFIG 
} from './orchestration';
import type { 
  FleetStatus, 
  OrchestrationCommand, 
  OrchestrationMode, 
  HubType,
  UniversalHubAccess 
} from './orchestration';

// Re-export types for backwards compatibility
export { AGENT_FLEET_CONFIG };
export type { FleetStatus, OrchestrationCommand, OrchestrationMode, HubType, UniversalHubAccess };

// Agent assignment interface
export interface AgentAssignment {
  agentId: string;
  agentName: string;
  domain: string;
  sector: string;
  taskId?: string;
  status: 'idle' | 'active' | 'processing' | 'waiting' | 'error';
  load: number;
  lastActive: Date;
  capabilities: string[];
}

export function useUniversalAtlasOrchestration() {
  const { user } = useAuth();
  const userId = user?.id;

  // Fleet management
  const { 
    fleetStatus, 
    calculateFleetStatus, 
    getAvailableAgents, 
    fleetConfig 
  } = useFleetManagement(userId);

  // Hub connections
  const {
    hubAccess,
    initializeHubConnections,
    executeUniversalAction,
    universalAccess,
    lifeManager,
    financialIntelligence,
  } = useHubConnections(userId);

  // Orchestration commands
  const {
    commandQueue,
    isOrchestrating,
    executeCommand,
    executeSwarm,
    executePipeline,
    agentOrchestration,
  } = useOrchestrationCommands(userId, calculateFleetStatus);

  // Initialize on mount
  useEffect(() => {
    if (userId) {
      initializeHubConnections();
      calculateFleetStatus();
    }
  }, [userId, initializeHubConnections, calculateFleetStatus]);

  // Memoized return value for performance
  return useMemo(() => ({
    // Fleet management
    fleetStatus,
    activeAssignments: [] as AgentAssignment[], // Placeholder for future implementation
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
    fleetConfig,

    // Child hooks access
    universalAccess,
    agentOrchestration,
    lifeManager,
    financialIntelligence,
  }), [
    fleetStatus,
    commandQueue,
    isOrchestrating,
    hubAccess,
    executeCommand,
    executeUniversalAction,
    executeSwarm,
    executePipeline,
    getAvailableAgents,
    calculateFleetStatus,
    fleetConfig,
    universalAccess,
    agentOrchestration,
    lifeManager,
    financialIntelligence,
  ]);
}
