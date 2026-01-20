// Atlas Sonic OS - Agent Communication Protocols
// Implements MCP (Model Context Protocol) and A2A (Agent-to-Agent) Protocol standards

export type AutonomyLevel = 'full_auto' | 'supervised' | 'human_led';
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';
export type HandoffReason = 'capability_mismatch' | 'escalation' | 'specialization' | 'load_balancing' | 'completion';

// MCP Tool Definition for exposing Atlas agents as MCP-compatible tools
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      required?: boolean;
    }>;
    required: string[];
  };
}

// A2A Protocol Message Structure
export interface A2AMessage {
  id: string;
  timestamp: Date;
  sourceAgentId: string;
  targetAgentId: string;
  messageType: 'request' | 'response' | 'handoff' | 'status' | 'broadcast';
  priority: MessagePriority;
  payload: {
    action?: string;
    data?: Record<string, any>;
    context?: Record<string, any>;
    handoffReason?: HandoffReason;
    responseToId?: string;
  };
  metadata: {
    sessionId: string;
    userId: string;
    autonomyLevel: AutonomyLevel;
    requiresApproval: boolean;
    ttlMs?: number;
  };
}

// Agent Handoff Record
export interface AgentHandoff {
  id: string;
  timestamp: Date;
  fromAgentId: string;
  fromAgentName: string;
  toAgentId: string;
  toAgentName: string;
  reason: HandoffReason;
  taskContext: {
    taskId: string;
    taskTitle: string;
    progress: number;
    partialResults?: Record<string, any>;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  metadata?: Record<string, any>;
}

// Autonomy Tier Configuration
export interface AutonomyTierConfig {
  level: AutonomyLevel;
  label: string;
  description: string;
  color: string;
  icon: string;
  permissions: {
    canExecuteWithoutApproval: boolean;
    canAccessExternalAPIs: boolean;
    canModifyData: boolean;
    canInitiateHandoffs: boolean;
    maxActionsPerSession: number;
    requiresAuditLog: boolean;
  };
  riskThreshold: 'low' | 'medium' | 'high';
  examples: string[];
}

// Predefined Autonomy Tiers
export const AUTONOMY_TIERS: Record<AutonomyLevel, AutonomyTierConfig> = {
  full_auto: {
    level: 'full_auto',
    label: 'Full Automation',
    description: 'Agent operates autonomously for low-stakes, repetitive tasks',
    color: '#00ffd5',
    icon: 'zap',
    permissions: {
      canExecuteWithoutApproval: true,
      canAccessExternalAPIs: true,
      canModifyData: true,
      canInitiateHandoffs: true,
      maxActionsPerSession: -1, // Unlimited
      requiresAuditLog: true,
    },
    riskThreshold: 'low',
    examples: [
      'Data synchronization',
      'Report generation',
      'Routine notifications',
      'Log analysis',
      'Cache management',
    ],
  },
  supervised: {
    level: 'supervised',
    label: 'Supervised Autonomy',
    description: 'Agent requires periodic check-ins for moderate-risk decisions',
    color: '#ffaa00',
    icon: 'eye',
    permissions: {
      canExecuteWithoutApproval: false,
      canAccessExternalAPIs: true,
      canModifyData: true,
      canInitiateHandoffs: true,
      maxActionsPerSession: 10,
      requiresAuditLog: true,
    },
    riskThreshold: 'medium',
    examples: [
      'Financial transactions under threshold',
      'Customer communication drafts',
      'Data transformations',
      'System configuration changes',
      'Resource allocation',
    ],
  },
  human_led: {
    level: 'human_led',
    label: 'Human-Led',
    description: 'Agent assists but human makes all final decisions',
    color: '#4488ff',
    icon: 'user',
    permissions: {
      canExecuteWithoutApproval: false,
      canAccessExternalAPIs: false,
      canModifyData: false,
      canInitiateHandoffs: false,
      maxActionsPerSession: 3,
      requiresAuditLog: true,
    },
    riskThreshold: 'high',
    examples: [
      'Strategic decisions',
      'Large financial approvals',
      'Legal document review',
      'Security incident response',
      'Personnel changes',
    ],
  },
};

// MCP Tool Catalog - Atlas Agents as MCP-compatible tools
export const MCP_TOOL_CATALOG: MCPToolDefinition[] = [
  {
    name: 'atlas_finance_agent',
    description: 'Financial intelligence agent for analysis, forecasting, and compliance',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The financial analysis query or request',
        },
        dataScope: {
          type: 'string',
          description: 'Scope of data to analyze',
          enum: ['current_quarter', 'ytd', 'historical', 'forecast'],
        },
        outputFormat: {
          type: 'string',
          description: 'Desired output format',
          enum: ['summary', 'detailed', 'chart_data', 'report'],
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'atlas_security_agent',
    description: 'Security intelligence agent for threat assessment and compliance',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Security action to perform',
          enum: ['threat_scan', 'compliance_check', 'access_audit', 'vulnerability_assess'],
        },
        target: {
          type: 'string',
          description: 'Target system or scope for security action',
        },
        severity: {
          type: 'string',
          description: 'Minimum severity level to report',
          enum: ['info', 'low', 'medium', 'high', 'critical'],
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'atlas_data_agent',
    description: 'Data intelligence agent for analysis, visualization, and insights',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language data query',
        },
        sources: {
          type: 'string',
          description: 'Data sources to query',
          enum: ['all', 'internal', 'external', 'realtime'],
        },
        visualization: {
          type: 'string',
          description: 'Visualization type if applicable',
          enum: ['table', 'chart', 'graph', 'dashboard'],
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'atlas_creative_agent',
    description: 'Creative intelligence agent for content generation and optimization',
    inputSchema: {
      type: 'object',
      properties: {
        brief: {
          type: 'string',
          description: 'Creative brief or content request',
        },
        contentType: {
          type: 'string',
          description: 'Type of content to generate',
          enum: ['copy', 'campaign', 'social', 'email', 'presentation'],
        },
        audience: {
          type: 'string',
          description: 'Target audience description',
        },
        tone: {
          type: 'string',
          description: 'Desired tone of content',
          enum: ['professional', 'casual', 'formal', 'playful', 'urgent'],
        },
      },
      required: ['brief', 'contentType'],
    },
  },
  {
    name: 'atlas_biotech_agent',
    description: 'Biotech intelligence agent for research synthesis and analysis',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Research query or topic',
        },
        sources: {
          type: 'string',
          description: 'Research sources to include',
          enum: ['literature', 'clinical_trials', 'patents', 'all'],
        },
        dateRange: {
          type: 'string',
          description: 'Date range for research',
          enum: ['recent', 'last_year', 'last_5_years', 'all_time'],
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'atlas_utility_agent',
    description: 'Utility agent for infrastructure management and system operations',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          description: 'Infrastructure operation to perform',
          enum: ['health_check', 'optimize', 'scale', 'backup', 'restore'],
        },
        target: {
          type: 'string',
          description: 'Target system or resource',
        },
        priority: {
          type: 'string',
          description: 'Operation priority',
          enum: ['low', 'normal', 'high', 'emergency'],
        },
      },
      required: ['operation'],
    },
  },
];

// Generate A2A message ID
export const generateA2AMessageId = (): string => {
  return `a2a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generate handoff ID
export const generateHandoffId = (): string => {
  return `hof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create A2A message
export const createA2AMessage = (
  sourceAgentId: string,
  targetAgentId: string,
  messageType: A2AMessage['messageType'],
  payload: A2AMessage['payload'],
  metadata: Omit<A2AMessage['metadata'], 'sessionId'> & { sessionId?: string }
): A2AMessage => {
  return {
    id: generateA2AMessageId(),
    timestamp: new Date(),
    sourceAgentId,
    targetAgentId,
    messageType,
    priority: 'normal',
    payload,
    metadata: {
      sessionId: metadata.sessionId || crypto.randomUUID(),
      userId: metadata.userId,
      autonomyLevel: metadata.autonomyLevel,
      requiresApproval: metadata.requiresApproval,
      ttlMs: metadata.ttlMs,
    },
  };
};

// Create agent handoff
export const createAgentHandoff = (
  fromAgentId: string,
  fromAgentName: string,
  toAgentId: string,
  toAgentName: string,
  reason: HandoffReason,
  taskContext: AgentHandoff['taskContext']
): AgentHandoff => {
  return {
    id: generateHandoffId(),
    timestamp: new Date(),
    fromAgentId,
    fromAgentName,
    toAgentId,
    toAgentName,
    reason,
    taskContext,
    status: 'pending',
  };
};

// Determine autonomy level based on task characteristics
export const determineAutonomyLevel = (
  taskType: string,
  riskLevel: 'low' | 'medium' | 'high',
  dataAccessRequired: boolean,
  externalApiAccess: boolean
): AutonomyLevel => {
  // High risk always requires human-led
  if (riskLevel === 'high') {
    return 'human_led';
  }
  
  // Medium risk with external API access requires supervision
  if (riskLevel === 'medium' || externalApiAccess) {
    return 'supervised';
  }
  
  // Low risk, internal operations can be fully automated
  return 'full_auto';
};

// Check if action is allowed for given autonomy level
export const isActionAllowed = (
  autonomyLevel: AutonomyLevel,
  action: 'execute' | 'api_access' | 'modify_data' | 'handoff'
): boolean => {
  const tier = AUTONOMY_TIERS[autonomyLevel];
  
  switch (action) {
    case 'execute':
      return tier.permissions.canExecuteWithoutApproval;
    case 'api_access':
      return tier.permissions.canAccessExternalAPIs;
    case 'modify_data':
      return tier.permissions.canModifyData;
    case 'handoff':
      return tier.permissions.canInitiateHandoffs;
    default:
      return false;
  }
};
