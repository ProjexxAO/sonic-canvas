// Centralized Tier Configuration System
// Controls all subscription-based access, limits, and pricing

export type SubscriptionTier = 'free' | 'pro' | 'business' | 'enterprise';
export type HubType = 'personal' | 'group' | 'csuite';
export type AgentClass = 'BASIC' | 'ADVANCED' | 'ELITE' | 'SINGULARITY';
export type FeatureKey = 
  | 'voice_commands'
  | 'report_generation'
  | 'universal_search'
  | 'swarm_orchestration'
  | 'custom_widgets'
  | 'automation_workflows'
  | 'data_connectors'
  | 'ai_chat'
  | 'document_upload'
  | 'email_sync'
  | 'calendar_sync';

// Recommended pricing structure
export const TIER_PRICING: Record<SubscriptionTier, {
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  tagline: string;
}> = {
  free: {
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Get started with Atlas basics',
    tagline: 'Perfect for exploring',
  },
  pro: {
    monthlyPrice: 29,
    annualPrice: 290,
    description: 'Full personal productivity suite',
    tagline: 'Most popular',
  },
  business: {
    monthlyPrice: 79,
    annualPrice: 790,
    description: 'Team collaboration & advanced AI',
    tagline: 'For growing teams',
  },
  enterprise: {
    monthlyPrice: 199,
    annualPrice: 1990,
    description: 'Unlimited power for organizations',
    tagline: 'Full platform access',
  },
};

// Hub access by tier
export const TIER_HUB_ACCESS: Record<SubscriptionTier, {
  personal: boolean;
  group: boolean | 'limited';
  csuite: boolean | 'limited';
  maxGroups: number;
}> = {
  free: {
    personal: true,
    group: false,
    csuite: false,
    maxGroups: 0,
  },
  pro: {
    personal: true,
    group: 'limited', // Can join but not create
    csuite: false,
    maxGroups: 1,
  },
  business: {
    personal: true,
    group: true,
    csuite: 'limited', // View-only access
    maxGroups: 5,
  },
  enterprise: {
    personal: true,
    group: true,
    csuite: true,
    maxGroups: -1, // Unlimited
  },
};

// Agent allocation limits by tier
export const TIER_AGENT_LIMITS: Record<SubscriptionTier, {
  maxAgents: number;
  concurrentTasks: number;
  allowedClasses: AgentClass[];
  canOrchestrate: boolean;
  canSwarm: boolean;
  swarmLimit: number;
}> = {
  free: {
    maxAgents: 5,
    concurrentTasks: 2,
    allowedClasses: ['BASIC'],
    canOrchestrate: false,
    canSwarm: false,
    swarmLimit: 0,
  },
  pro: {
    maxAgents: 50,
    concurrentTasks: 10,
    allowedClasses: ['BASIC', 'ADVANCED'],
    canOrchestrate: true,
    canSwarm: false,
    swarmLimit: 0,
  },
  business: {
    maxAgents: 500,
    concurrentTasks: 50,
    allowedClasses: ['BASIC', 'ADVANCED', 'ELITE'],
    canOrchestrate: true,
    canSwarm: true,
    swarmLimit: 100,
  },
  enterprise: {
    maxAgents: 144000,
    concurrentTasks: 1000,
    allowedClasses: ['BASIC', 'ADVANCED', 'ELITE', 'SINGULARITY'],
    canOrchestrate: true,
    canSwarm: true,
    swarmLimit: 10000,
  },
};

// Feature availability by tier
export const TIER_FEATURES: Record<SubscriptionTier, Record<FeatureKey, boolean | 'limited'>> = {
  free: {
    voice_commands: false,
    report_generation: false,
    universal_search: false,
    swarm_orchestration: false,
    custom_widgets: false,
    automation_workflows: false,
    data_connectors: 'limited', // 1 connector
    ai_chat: 'limited', // 10 messages/day
    document_upload: 'limited', // 5 documents
    email_sync: false,
    calendar_sync: false,
  },
  pro: {
    voice_commands: true,
    report_generation: 'limited', // 5 reports/month
    universal_search: 'limited', // Personal hub only
    swarm_orchestration: false,
    custom_widgets: 'limited', // 3 widgets
    automation_workflows: 'limited', // 5 workflows
    data_connectors: 'limited', // 3 connectors
    ai_chat: true,
    document_upload: true,
    email_sync: true,
    calendar_sync: true,
  },
  business: {
    voice_commands: true,
    report_generation: true,
    universal_search: true,
    swarm_orchestration: 'limited', // Up to 100 agents
    custom_widgets: true,
    automation_workflows: true,
    data_connectors: true,
    ai_chat: true,
    document_upload: true,
    email_sync: true,
    calendar_sync: true,
  },
  enterprise: {
    voice_commands: true,
    report_generation: true,
    universal_search: true,
    swarm_orchestration: true,
    custom_widgets: true,
    automation_workflows: true,
    data_connectors: true,
    ai_chat: true,
    document_upload: true,
    email_sync: true,
    calendar_sync: true,
  },
};

// Usage limits by tier
export const TIER_USAGE_LIMITS: Record<SubscriptionTier, {
  aiCreditsMonthly: number;
  storageGB: number;
  documentsLimit: number;
  reportsMonthly: number;
  widgetsLimit: number;
  workflowsLimit: number;
  connectorsLimit: number;
}> = {
  free: {
    aiCreditsMonthly: 50,
    storageGB: 0.5,
    documentsLimit: 10,
    reportsMonthly: 0,
    widgetsLimit: 0,
    workflowsLimit: 0,
    connectorsLimit: 1,
  },
  pro: {
    aiCreditsMonthly: 500,
    storageGB: 10,
    documentsLimit: 500,
    reportsMonthly: 10,
    widgetsLimit: 5,
    workflowsLimit: 10,
    connectorsLimit: 5,
  },
  business: {
    aiCreditsMonthly: 2000,
    storageGB: 100,
    documentsLimit: 5000,
    reportsMonthly: 50,
    widgetsLimit: 25,
    workflowsLimit: 50,
    connectorsLimit: 20,
  },
  enterprise: {
    aiCreditsMonthly: 999999,
    storageGB: 1000,
    documentsLimit: 999999,
    reportsMonthly: 999999,
    widgetsLimit: 999999,
    workflowsLimit: 999999,
    connectorsLimit: 999999,
  },
};

// Helper functions
export function canAccessHub(tier: SubscriptionTier, hubType: HubType): boolean {
  const access = TIER_HUB_ACCESS[tier][hubType];
  return access === true || access === 'limited';
}

export function hasFullHubAccess(tier: SubscriptionTier, hubType: HubType): boolean {
  return TIER_HUB_ACCESS[tier][hubType] === true;
}

export function canUseFeature(tier: SubscriptionTier, feature: FeatureKey): boolean {
  const access = TIER_FEATURES[tier][feature];
  return access === true || access === 'limited';
}

export function hasFullFeatureAccess(tier: SubscriptionTier, feature: FeatureKey): boolean {
  return TIER_FEATURES[tier][feature] === true;
}

export function canAllocateAgentClass(tier: SubscriptionTier, agentClass: AgentClass): boolean {
  return TIER_AGENT_LIMITS[tier].allowedClasses.includes(agentClass);
}

export function getUpgradeTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const tierOrder: SubscriptionTier[] = ['free', 'pro', 'business', 'enterprise'];
  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex < tierOrder.length - 1) {
    return tierOrder[currentIndex + 1];
  }
  return null;
}

export function getTierLabel(tier: SubscriptionTier): string {
  const labels: Record<SubscriptionTier, string> = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
    enterprise: 'Enterprise',
  };
  return labels[tier];
}

export function getTierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    free: 'text-muted-foreground',
    pro: 'text-primary',
    business: 'text-secondary',
    enterprise: 'text-accent',
  };
  return colors[tier];
}

export function getAgentClassColor(agentClass: AgentClass): string {
  const colors: Record<AgentClass, string> = {
    BASIC: 'text-muted-foreground',
    ADVANCED: 'text-primary',
    ELITE: 'text-secondary',
    SINGULARITY: 'text-accent',
  };
  return colors[agentClass];
}

// Feature descriptions for UI
export const FEATURE_DESCRIPTIONS: Record<FeatureKey, {
  name: string;
  description: string;
  icon: string;
}> = {
  voice_commands: {
    name: 'Voice Commands',
    description: 'Control Atlas with natural voice interactions',
    icon: 'Mic',
  },
  report_generation: {
    name: 'AI Reports',
    description: 'Generate executive briefings and insights',
    icon: 'FileText',
  },
  universal_search: {
    name: 'Universal Search',
    description: 'Search across all your connected data',
    icon: 'Search',
  },
  swarm_orchestration: {
    name: 'Swarm Orchestration',
    description: 'Deploy thousands of agents in parallel',
    icon: 'Zap',
  },
  custom_widgets: {
    name: 'Custom Widgets',
    description: 'Create AI-powered dashboard widgets',
    icon: 'LayoutGrid',
  },
  automation_workflows: {
    name: 'Automation Workflows',
    description: 'Build automated task pipelines',
    icon: 'Workflow',
  },
  data_connectors: {
    name: 'Data Connectors',
    description: 'Connect external data sources',
    icon: 'Plug',
  },
  ai_chat: {
    name: 'AI Chat',
    description: 'Conversational AI assistant',
    icon: 'MessageSquare',
  },
  document_upload: {
    name: 'Document Upload',
    description: 'Upload and analyze documents',
    icon: 'Upload',
  },
  email_sync: {
    name: 'Email Sync',
    description: 'Connect and manage email accounts',
    icon: 'Mail',
  },
  calendar_sync: {
    name: 'Calendar Sync',
    description: 'Sync calendars and events',
    icon: 'Calendar',
  },
};
