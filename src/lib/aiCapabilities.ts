// AI Advancements Knowledge Base - Informs Atlas capabilities and agent descriptions
// Source: Industry research on RAG, Agentic AI, and domain-specific AI applications

export interface AICapability {
  id: string;
  name: string;
  description: string;
  sectors: string[];
  features: string[];
  ragEnabled: boolean;
  apiIntegration: boolean;
  useCases: string[];
}

export interface SectorCapabilities {
  sector: string;
  capabilities: AICapability[];
  agentPromptEnhancement: string;
}

// Core AI Capabilities mapped to agent sectors
export const AI_CAPABILITIES: AICapability[] = [
  // Finance & Analytics
  {
    id: 'financial-forecasting',
    name: 'Financial Forecasting & Analysis',
    description: 'Analyzes live market feeds and historical data for investment decisions and trend predictions',
    sectors: ['FINANCE', 'ANALYTICS'],
    features: ['Real-time market analysis', 'Trend prediction', 'Risk assessment', 'Portfolio optimization'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Investment analysis', 'Cash flow forecasting', 'Market intelligence', 'Fraud detection']
  },
  {
    id: 'compliance-monitoring',
    name: 'Compliance & Risk Monitoring',
    description: 'Ensures AI outputs remain compliant by retrieving specific policy clauses and legal definitions',
    sectors: ['FINANCE', 'SECURITY', 'OPERATIONS'],
    features: ['Policy retrieval', 'Regulatory compliance', 'Audit trail', 'Risk scoring'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Regulatory reporting', 'Risk assessment', 'Compliance audits', 'Policy enforcement']
  },
  {
    id: 'revenue-cycle',
    name: 'Revenue Cycle Management',
    description: 'Intelligent automation for financial workflows, claim processing, and denial pattern analysis',
    sectors: ['FINANCE', 'OPERATIONS'],
    features: ['Claim automation', 'Denial prediction', 'Payment optimization', 'Workflow automation'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Invoice processing', 'Payment reconciliation', 'Revenue optimization']
  },

  // Operations & Supply Chain
  {
    id: 'supply-chain-optimization',
    name: 'Supply Chain & Logistics Planning',
    description: 'Optimizes logistics and delivery routes using real-time data and predictive analytics',
    sectors: ['OPERATIONS', 'ANALYTICS'],
    features: ['Route optimization', 'Demand sensing', 'Inventory forecasting', 'Disruption prediction'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Delivery optimization', 'Inventory management', 'Supplier risk assessment']
  },
  {
    id: 'predictive-maintenance',
    name: 'Predictive Maintenance & Digital Twins',
    description: 'AI-driven modeling to predict disruptions and optimize equipment maintenance',
    sectors: ['OPERATIONS', 'INFRASTRUCTURE'],
    features: ['Equipment monitoring', 'Failure prediction', 'Maintenance scheduling', 'Asset optimization'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Downtime prevention', 'Asset lifecycle management', 'Quality control']
  },
  {
    id: 'agentic-workflow',
    name: 'Agentic Workflow Automation',
    description: 'Autonomous AI that automates complex, high-value workflows with minimal supervision',
    sectors: ['OPERATIONS', 'ANALYTICS', 'STRATEGY'],
    features: ['Task automation', 'Decision making', 'Process orchestration', 'Anomaly detection'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Invoice processing', 'Purchase order matching', 'Reconciliation', 'Report generation']
  },

  // Research & Knowledge
  {
    id: 'knowledge-management',
    name: 'Knowledge Management & Internal Search',
    description: 'Enables natural language queries across internal wikis, repositories, and CRMs',
    sectors: ['RESEARCH', 'ANALYTICS'],
    features: ['Semantic search', 'Document retrieval', 'Knowledge synthesis', 'Cross-reference analysis'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Research assistance', 'Document discovery', 'Expertise location', 'Best practice retrieval']
  },
  {
    id: 'legal-analysis',
    name: 'Legal Document Review & Analysis',
    description: 'Retrieves legal cases, precedents, and assists in contract drafting and compliance reviews',
    sectors: ['RESEARCH', 'ANALYTICS'],
    features: ['Case retrieval', 'Contract analysis', 'Precedent matching', 'Compliance checking'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Contract review', 'Legal research', 'Due diligence', 'Risk assessment']
  },
  {
    id: 'graph-rag',
    name: 'GraphRAG Knowledge Systems',
    description: 'Uses entity-relationship graphs for multi-hop reasoning across disparate data sources',
    sectors: ['RESEARCH', 'ANALYTICS', 'STRATEGY'],
    features: ['Entity extraction', 'Relationship mapping', 'Multi-hop queries', 'Theme-level analysis'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Complex research', 'Due diligence', 'Competitive intelligence', 'Strategic analysis']
  },

  // Security & Compliance
  {
    id: 'predictive-security',
    name: 'Predictive Cybersecurity',
    description: 'Predictive AI for threat identification and proactive security monitoring',
    sectors: ['SECURITY', 'INFRASTRUCTURE'],
    features: ['Threat prediction', 'Anomaly detection', 'Incident response', 'Vulnerability assessment'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Threat hunting', 'Security monitoring', 'Incident analysis', 'Risk mitigation']
  },
  {
    id: 'access-control',
    name: 'Retrieval-Native Access Control',
    description: 'Security and permissions embedded directly into data retrieval with multi-tenancy isolation',
    sectors: ['SECURITY', 'INFRASTRUCTURE'],
    features: ['Permission management', 'Data isolation', 'Audit logging', 'Compliance enforcement'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Data governance', 'Access management', 'Compliance reporting']
  },

  // Communications & Creative
  {
    id: 'customer-intelligence',
    name: 'Customer Service & Intelligence',
    description: 'Context-aware responses using RAG for smarter ticket resolution and customer insights',
    sectors: ['COMMUNICATIONS', 'ANALYTICS'],
    features: ['Contextual responses', 'Ticket analysis', 'Sentiment detection', 'Customer profiling'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Support automation', 'Customer insights', 'Sentiment analysis', 'Personalization']
  },
  {
    id: 'content-optimization',
    name: 'Content Creation & Optimization',
    description: 'Streamlines research and optimizes content for engagement using updated information',
    sectors: ['CREATIVE', 'COMMUNICATIONS'],
    features: ['Content generation', 'SEO optimization', 'Personalization', 'A/B testing insights'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Marketing content', 'Documentation', 'Report generation', 'Proposal drafting']
  },
  {
    id: 'sales-enablement',
    name: 'Sales & Marketing Enablement',
    description: 'Automatically drafts personalized proposals using live CRM and marketing data',
    sectors: ['COMMUNICATIONS', 'ANALYTICS', 'STRATEGY'],
    features: ['Lead scoring', 'Proposal automation', 'Campaign optimization', 'Pipeline analysis'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Lead prioritization', 'Proposal drafting', 'Campaign personalization']
  },

  // Strategy & Executive
  {
    id: 'executive-intelligence',
    name: 'Executive Decision Intelligence',
    description: 'Multi-agent systems for research, verification, synthesis, and governance',
    sectors: ['STRATEGY', 'ANALYTICS'],
    features: ['Strategic analysis', 'Scenario modeling', 'Risk assessment', 'Competitive intelligence'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Board briefings', 'Strategic planning', 'M&A analysis', 'Market intelligence']
  },
  {
    id: 'self-reflective',
    name: 'Self-Reflective AI Systems',
    description: 'Models that evaluate relevance and critique outputs before responding—critical for compliance',
    sectors: ['STRATEGY', 'SECURITY', 'ANALYTICS'],
    features: ['Output validation', 'Relevance scoring', 'Self-correction', 'Confidence assessment'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Regulated industries', 'High-stakes decisions', 'Audit-ready outputs']
  },

  // Infrastructure & Development
  {
    id: 'code-intelligence',
    name: 'Code Generation & Intelligence',
    description: 'Automates code generation by retrieving updated libraries, snippets, and error fixes',
    sectors: ['INFRASTRUCTURE', 'RESEARCH'],
    features: ['Code completion', 'Error detection', 'Documentation generation', 'Refactoring suggestions'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Development acceleration', 'Code review', 'Documentation', 'Debugging']
  },
  {
    id: 'adaptive-rag',
    name: 'Adaptive Retrieval Systems',
    description: 'Dynamically adjusts retrieval depth based on query complexity',
    sectors: ['INFRASTRUCTURE', 'RESEARCH', 'ANALYTICS'],
    features: ['Query analysis', 'Retrieval optimization', 'Context adaptation', 'Multi-stage reasoning'],
    ragEnabled: true,
    apiIntegration: true,
    useCases: ['Complex queries', 'Research assistance', 'Knowledge synthesis']
  }
];

// Sector-specific capability mappings for agent enhancement
export const SECTOR_CAPABILITIES: Record<string, SectorCapabilities> = {
  FINANCE: {
    sector: 'FINANCE',
    capabilities: AI_CAPABILITIES.filter(c => c.sectors.includes('FINANCE')),
    agentPromptEnhancement: `Enhanced with financial forecasting, compliance monitoring, and revenue cycle automation. Capable of real-time market analysis, fraud detection, and regulatory reporting using RAG-powered retrieval from financial data sources.`
  },
  OPERATIONS: {
    sector: 'OPERATIONS',
    capabilities: AI_CAPABILITIES.filter(c => c.sectors.includes('OPERATIONS')),
    agentPromptEnhancement: `Equipped with supply chain optimization, predictive maintenance, and agentic workflow automation. Performs demand sensing, route optimization, and autonomous task execution with minimal supervision.`
  },
  ANALYTICS: {
    sector: 'ANALYTICS',
    capabilities: AI_CAPABILITIES.filter(c => c.sectors.includes('ANALYTICS')),
    agentPromptEnhancement: `Powered by GraphRAG knowledge systems and adaptive retrieval. Performs multi-hop reasoning, entity-relationship analysis, and theme-level queries across disparate data sources.`
  },
  SECURITY: {
    sector: 'SECURITY',
    capabilities: AI_CAPABILITIES.filter(c => c.sectors.includes('SECURITY')),
    agentPromptEnhancement: `Implements predictive cybersecurity and retrieval-native access control. Provides threat prediction, anomaly detection, and compliance enforcement with full audit trails.`
  },
  CREATIVE: {
    sector: 'CREATIVE',
    capabilities: AI_CAPABILITIES.filter(c => c.sectors.includes('CREATIVE')),
    agentPromptEnhancement: `Specializes in content creation, optimization, and personalization. Generates marketing content, proposals, and documentation using RAG-powered research and SEO optimization.`
  },
  RESEARCH: {
    sector: 'RESEARCH',
    capabilities: AI_CAPABILITIES.filter(c => c.sectors.includes('RESEARCH')),
    agentPromptEnhancement: `Advanced knowledge management with legal analysis and code intelligence. Performs semantic search, document discovery, and multi-hop research across internal and external sources.`
  },
  INFRASTRUCTURE: {
    sector: 'INFRASTRUCTURE',
    capabilities: AI_CAPABILITIES.filter(c => c.sectors.includes('INFRASTRUCTURE')),
    agentPromptEnhancement: `Features predictive maintenance, code intelligence, and adaptive retrieval systems. Monitors infrastructure health, automates development workflows, and optimizes system performance.`
  },
  COMMUNICATIONS: {
    sector: 'COMMUNICATIONS',
    capabilities: AI_CAPABILITIES.filter(c => c.sectors.includes('COMMUNICATIONS')),
    agentPromptEnhancement: `Customer intelligence and sales enablement with context-aware automation. Analyzes sentiment, personalizes responses, and drafts proposals using live CRM data.`
  },
  STRATEGY: {
    sector: 'STRATEGY',
    capabilities: AI_CAPABILITIES.filter(c => c.sectors.includes('STRATEGY')),
    agentPromptEnhancement: `Executive decision intelligence with self-reflective AI systems. Provides strategic analysis, scenario modeling, and board-ready briefings with validated, audit-ready outputs.`
  }
};

// Get capabilities for a specific sector
export function getCapabilitiesForSector(sector: string): AICapability[] {
  return AI_CAPABILITIES.filter(c => c.sectors.includes(sector));
}

// Get agent enhancement prompt for a sector
export function getAgentEnhancement(sector: string): string {
  return SECTOR_CAPABILITIES[sector]?.agentPromptEnhancement || '';
}

// Get all RAG-enabled capabilities
export function getRagCapabilities(): AICapability[] {
  return AI_CAPABILITIES.filter(c => c.ragEnabled);
}

// Get capabilities by use case keyword
export function findCapabilitiesByUseCase(keyword: string): AICapability[] {
  const lowerKeyword = keyword.toLowerCase();
  return AI_CAPABILITIES.filter(c => 
    c.useCases.some(uc => uc.toLowerCase().includes(lowerKeyword)) ||
    c.features.some(f => f.toLowerCase().includes(lowerKeyword)) ||
    c.description.toLowerCase().includes(lowerKeyword)
  );
}

// Atlas system prompt enhancement based on available capabilities
export const ATLAS_CAPABILITY_CONTEXT = `
You have access to advanced AI capabilities including:

**Retrieval-Augmented Generation (RAG)**
- GraphRAG for entity-relationship analysis and multi-hop reasoning
- Adaptive retrieval that adjusts depth based on query complexity
- Self-reflective systems that validate outputs before responding

**Agentic Automation**
- Autonomous workflow execution with minimal supervision
- Multi-agent coordination for research, verification, and synthesis
- Intelligent task orchestration across domains

**Domain-Specific Intelligence**
- Financial forecasting and compliance monitoring
- Supply chain optimization and predictive maintenance
- Customer intelligence and sales enablement
- Legal document analysis and knowledge management
- Predictive cybersecurity and access control

**Integration Capabilities**
- Real-time data retrieval from connected systems
- API-based integration with enterprise platforms
- Semantic search across internal knowledge bases

Use these capabilities to provide intelligent, contextual assistance tailored to the user's role and domain.
`;
