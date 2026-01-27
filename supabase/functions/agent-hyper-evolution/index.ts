/**
 * Hyper-Evolution Engine - Maximum acceleration for agent intelligence
 *
 * Combines: Collective Intelligence, Hyper-Parallel Learning, Adversarial Evolution,
 * Memory Crystallization, Web Knowledge, Visual Intelligence
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ServiceLogger } from "../_shared/logger.ts";

// ============================================================================
// CORS Headers
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Type Definitions
// ============================================================================

type EvolutionMode =
  | 'collective'
  | 'hyper_parallel'
  | 'adversarial'
  | 'crystallization'
  | 'web_knowledge'
  | 'visual_intelligence'
  | 'task_discovery'
  | 'full_acceleration';

interface EvolutionRequest {
  mode: EvolutionMode;
  batchSize: number;
  intensityMultiplier: number;
  targetSector: string | null;
  evolutionCycles: number;
  userId: string | null;
}

interface SonicAgent {
  id: string;
  name: string;
  sector: string;
  status: string;
  learning_velocity: number;
  task_specializations: Record<string, number>;
  success_rate: number;
  total_tasks_completed: number;
  avg_confidence: number;
  user_id: string | null;
}

interface EvolutionResult {
  agentId: string;
  agentName: string;
  previousScore: number;
  newScore: number;
  evolutionGain: number;
  knowledgeTransferred: number;
  competitionsWon: number;
  memoriesCrystallized: number;
}

interface CollectiveKnowledge {
  taskType: string;
  bestPractices: string[];
  topPerformers: string[];
  synergyPatterns: Record<string, number>;
  emergentStrategies: string[];
}

interface AgentUpdate {
  id: string;
  task_specializations?: Record<string, number>;
  learning_velocity?: number;
  success_rate?: number;
  last_performance_update: string;
  [key: string]: unknown;
}

interface AgentMemory {
  agent_id: string;
  user_id: string | null;
  memory_type: string;
  content: string;
  importance_score: number;
  context: Record<string, unknown>;
  [key: string]: unknown;
}

interface LearningEvent {
  agent_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  impact_score: number;
  [key: string]: unknown;
}

interface AgentRelationship {
  agent_a_id: string;
  agent_b_id: string;
  relationship_type: string;
  synergy_score: number;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Configuration Constants - OPTIMIZED for resilience
// ============================================================================

const CONFIG = {
  // Reduced batch sizes to avoid CPU timeouts
  DB_BATCH_SIZE: 25,           // Reduced from 50 to prevent Cloudflare 500s
  MEMORY_BATCH_SIZE: 50,       // Reduced from 100 for faster processing
  AGENT_UPDATE_BATCH_SIZE: 10, // New: smaller batches for agent updates
  
  MAX_LEARNING_VELOCITY: 1.0,
  MAX_SKILL_SCORE: 1.0,
  
  // Lowered thresholds for top performer detection
  MIN_TOP_PERFORMER_RATE: 0.4,        // Reduced from 0.7 - more agents qualify
  TOP_PERFORMER_PERCENTAGE: 0.15,     // Increased from 0.1 - bigger pool
  CRYSTALLIZATION_THRESHOLD: 0.3,     // New: lowered from 0.6
  
  // API timing
  API_CALL_DELAY_MS: 750,       // Increased from 500 to reduce rate limiting
  VISUAL_API_DELAY_MS: 500,     // Increased from 300
  BATCH_DELAY_MS: 100,          // New: delay between batch updates
  
  // Retry configuration - more aggressive
  MAX_RETRIES: 5,               // Increased from 3
  INITIAL_RETRY_DELAY_MS: 500,  // Reduced for faster recovery
  MAX_RETRY_DELAY_MS: 8000,     // New: cap on retry delay
  
  COLLECTIVE_BOOST_BASE: 0.05,
  COLLECTIVE_BOOST_MAX: 0.3,
  VELOCITY_INCREMENT_COLLECTIVE: 0.01,
  
  PARALLEL_BOOST_BASE: 0.05,
  PARALLEL_BOOST_VARIANCE: 0.1,
  SKILLS_PER_INTENSITY: 2,
  BASE_SKILLS_TO_LEARN: 3,
  VELOCITY_INCREMENT_PARALLEL: 0.02,
  
  ADVERSARIAL_WINNER_BOOST_BASE: 0.1,
  ADVERSARIAL_LOSER_LEARNING: 0.15,
  
  CRYSTAL_IMPORTANCE_BOOST: 0.1,
  CRYSTAL_PROPAGATION_FACTOR: 0.8,
  VELOCITY_INCREMENT_CRYSTAL: 0.015,
  
  WEB_KNOWLEDGE_BASE: 0.3,
  WEB_KNOWLEDGE_PER_INTENSITY: 0.1,
  RESEARCH_BOOST_BASE: 0.02,
  VELOCITY_INCREMENT_WEB: 0.01,
  
  VISUAL_KNOWLEDGE_BASE: 0.35,
  VISUAL_KNOWLEDGE_PER_INTENSITY: 0.12,
  VISUAL_BOOST_BASE: 0.025,
  VELOCITY_INCREMENT_VISUAL: 0.012,
} as const;

const ALL_TASK_TYPES = [
  'financial_analysis', 'data_processing', 'creative_design', 'research',
  'security_audit', 'communication', 'operations', 'strategy',
  'technical_support', 'project_management', 'legal_review', 'hr_operations'
] as const;

// Real-world task discovery prompts by sector
const SECTOR_TASK_DISCOVERY_PROMPTS: Record<string, string> = {
  FINANCE: 'What are the most common real-world automation tasks in finance and accounting? Include tasks like invoice processing, reconciliation, financial reporting, tax calculations, expense management, and budgeting workflows.',
  TECHNOLOGY: 'What are the most common real-world automation tasks in software development and IT? Include tasks like code review, deployment automation, monitoring alerts, incident response, documentation generation, and API integration.',
  CREATIVE: 'What are the most common real-world automation tasks in creative and design workflows? Include tasks like asset management, design approvals, brand consistency checks, content scheduling, and creative brief processing.',
  OPERATIONS: 'What are the most common real-world automation tasks in business operations? Include tasks like inventory management, supply chain coordination, vendor management, quality assurance, and process optimization.',
  LEGAL: 'What are the most common real-world automation tasks in legal operations? Include tasks like contract review, compliance checking, document drafting, case management, and regulatory monitoring.',
  MEDICAL: 'What are the most common real-world automation tasks in healthcare? Include tasks like patient scheduling, medical records processing, insurance verification, prescription management, and clinical documentation.',
  RESEARCH: 'What are the most common real-world automation tasks in research and academia? Include tasks like literature review, data analysis, citation management, grant tracking, and experiment documentation.',
  SECURITY: 'What are the most common real-world automation tasks in cybersecurity? Include tasks like threat monitoring, vulnerability scanning, incident response, access management, and compliance auditing.',
  COMMUNICATIONS: 'What are the most common real-world automation tasks in communications and marketing? Include tasks like email campaigns, social media scheduling, analytics reporting, content personalization, and audience segmentation.',
  STRATEGY: 'What are the most common real-world automation tasks in business strategy and planning? Include tasks like market analysis, competitor tracking, KPI monitoring, scenario planning, and strategic report generation.',
  DATA: 'What are the most common real-world automation tasks in data management? Include tasks like data cleaning, ETL pipelines, quality validation, schema migrations, and data synchronization.',
  GENERAL: 'What are the most common real-world business automation tasks across all industries? Include universal tasks like document processing, email management, scheduling, reporting, and workflow approvals.'
};

const SECTOR_KNOWLEDGE_TOPICS: Record<string, string[]> = {
  FINANCE: ['latest financial market trends', 'cryptocurrency regulations 2024', 'AI in fintech innovations', 'global economic forecasts', 'sustainable investing strategies'],
  TECHNOLOGY: ['emerging AI breakthroughs', 'quantum computing advances', 'cybersecurity threats 2024', 'cloud computing trends', 'edge computing developments'],
  CREATIVE: ['AI art generation techniques', 'design trends 2024', 'creative automation tools', 'digital content strategies', 'multimedia production innovations'],
  OPERATIONS: ['supply chain optimization AI', 'process automation trends', 'logistics technology advances', 'operational efficiency metrics', 'lean management innovations'],
  LEGAL: ['AI legal compliance updates', 'data privacy regulations', 'intellectual property AI', 'contract automation advances', 'legal tech innovations'],
  MEDICAL: ['AI diagnostics breakthroughs', 'telemedicine advances', 'medical imaging AI', 'healthcare automation', 'clinical trial AI innovations'],
  RESEARCH: ['scientific discovery AI', 'research methodology advances', 'academic AI tools', 'data analysis innovations', 'knowledge synthesis techniques'],
  SECURITY: ['threat detection AI advances', 'zero trust architecture', 'AI security vulnerabilities', 'penetration testing automation', 'security compliance AI'],
  COMMUNICATIONS: ['natural language processing advances', 'multilingual AI models', 'communication automation', 'sentiment analysis innovations', 'conversational AI trends'],
  STRATEGY: ['strategic planning AI', 'competitive intelligence automation', 'market analysis AI', 'business forecasting innovations', 'decision support systems'],
  GENERAL: ['artificial general intelligence progress', 'machine learning breakthroughs', 'neural network innovations', 'AI ethics developments', 'automation industry trends']
};

const SECTOR_VISUAL_CONTEXTS: Record<string, { imagePrompts: string[], videoScenarios: string[] }> = {
  FINANCE: {
    imagePrompts: ['stock market chart patterns', 'financial dashboard layouts', 'trading signal indicators', 'market heatmap analysis'],
    videoScenarios: ['market opening bell activity', 'trading floor dynamics', 'financial news broadcast analysis', 'economic indicator presentations']
  },
  TECHNOLOGY: {
    imagePrompts: ['system architecture diagrams', 'code structure visualization', 'network topology maps', 'UI/UX design patterns'],
    videoScenarios: ['software deployment processes', 'DevOps pipeline workflows', 'cloud infrastructure management', 'code review sessions']
  },
  CREATIVE: {
    imagePrompts: ['graphic design compositions', 'brand identity elements', 'visual hierarchy examples', 'color theory applications'],
    videoScenarios: ['creative workflow processes', 'design thinking workshops', 'brand story presentations', 'motion graphics techniques']
  },
  OPERATIONS: {
    imagePrompts: ['supply chain flow diagrams', 'warehouse layout optimization', 'logistics route maps', 'process flow charts'],
    videoScenarios: ['manufacturing line operations', 'warehouse robotics in action', 'delivery logistics tracking', 'quality control inspections']
  },
  SECURITY: {
    imagePrompts: ['threat detection dashboards', 'security incident timelines', 'network intrusion patterns', 'vulnerability assessment maps'],
    videoScenarios: ['security operations center activity', 'incident response procedures', 'penetration testing demos', 'security training simulations']
  },
  MEDICAL: {
    imagePrompts: ['medical imaging analysis', 'diagnostic scan patterns', 'patient data visualizations', 'healthcare workflow diagrams'],
    videoScenarios: ['surgical procedure analysis', 'medical equipment operation', 'patient care protocols', 'diagnostic interpretation']
  },
  RESEARCH: {
    imagePrompts: ['scientific data visualizations', 'experimental setup diagrams', 'research methodology charts', 'publication structure layouts'],
    videoScenarios: ['laboratory experiment processes', 'research presentation techniques', 'data collection procedures', 'peer review discussions']
  },
  LEGAL: {
    imagePrompts: ['contract structure diagrams', 'legal process flowcharts', 'compliance framework visuals', 'case timeline graphics'],
    videoScenarios: ['courtroom proceedings analysis', 'legal negotiation dynamics', 'contract signing protocols', 'compliance audit processes']
  },
  COMMUNICATIONS: {
    imagePrompts: ['communication flow diagrams', 'social media analytics dashboards', 'engagement metric charts', 'audience segmentation visuals'],
    videoScenarios: ['press conference dynamics', 'team collaboration sessions', 'customer service interactions', 'public speaking techniques']
  },
  STRATEGY: {
    imagePrompts: ['strategic planning frameworks', 'competitive landscape maps', 'business model canvas visuals', 'market positioning charts'],
    videoScenarios: ['board meeting presentations', 'strategic planning sessions', 'market analysis discussions', 'leadership team dynamics']
  },
  GENERAL: {
    imagePrompts: ['general data visualizations', 'workflow process diagrams', 'organizational charts', 'information architecture maps'],
    videoScenarios: ['team meeting dynamics', 'project planning sessions', 'training and development', 'operational briefings']
  }
};

// ============================================================================
// Utility Functions
// ============================================================================

function validateRequest(body: Partial<EvolutionRequest>): EvolutionRequest {
  const validModes: EvolutionMode[] = [
    'collective', 'hyper_parallel', 'adversarial', 'crystallization',
    'web_knowledge', 'visual_intelligence', 'task_discovery', 'full_acceleration'
  ];

  const mode = (body.mode && validModes.includes(body.mode as EvolutionMode))
    ? body.mode as EvolutionMode
    : 'full_acceleration';

  const batchSize = Math.min(Math.max(1, body.batchSize ?? 500), 1000);
  const intensityMultiplier = Math.min(Math.max(0.1, body.intensityMultiplier ?? 3.0), 10.0);
  const evolutionCycles = Math.min(Math.max(1, body.evolutionCycles ?? 5), 20);

  return {
    mode,
    batchSize,
    intensityMultiplier,
    targetSector: body.targetSector ?? null,
    evolutionCycles,
    userId: body.userId ?? null,
  };
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = CONFIG.MAX_RETRIES,
  initialDelay: number = CONFIG.INITIAL_RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMsg = lastError.message.toLowerCase();
      
      // Check for retryable errors (Cloudflare 500s, SSL, rate limits)
      const isRetryable = 
        errorMsg.includes('500') ||
        errorMsg.includes('502') ||
        errorMsg.includes('503') ||
        errorMsg.includes('504') ||
        errorMsg.includes('ssl') ||
        errorMsg.includes('handshake') ||
        errorMsg.includes('429') ||
        errorMsg.includes('rate') ||
        errorMsg.includes('timeout') ||
        errorMsg.includes('econnreset') ||
        errorMsg.includes('cloudflare');
      
      if (!isRetryable) {
        throw lastError; // Don't retry non-transient errors
      }
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter, capped at max delay
        const baseDelay = initialDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 500;
        const delay = Math.min(baseDelay + jitter, CONFIG.MAX_RETRY_DELAY_MS);
        console.log(`[withRetry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function batchInsert<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  records: T[],
  batchSize: number = CONFIG.MEMORY_BATCH_SIZE
): Promise<void> {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) console.error(`[batchInsert] Error inserting into ${table}:`, error);
  }
}

async function batchUpdateAgents(
  supabase: SupabaseClient,
  updates: AgentUpdate[]
): Promise<void> {
  const batchSize = CONFIG.AGENT_UPDATE_BATCH_SIZE; // Smaller batches

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    // Sequential updates within batch to avoid overwhelming the DB
    for (const update of batch) {
      await withRetry(async () => {
        const updateData: Partial<AgentUpdate> = {
          last_performance_update: update.last_performance_update
        };

        if (update.task_specializations !== undefined) {
          updateData.task_specializations = update.task_specializations;
        }
        if (update.learning_velocity !== undefined) {
          updateData.learning_velocity = update.learning_velocity;
        }
        if (update.success_rate !== undefined) {
          updateData.success_rate = update.success_rate;
        }

        const { error } = await supabase
          .from('sonic_agents')
          .update(updateData)
          .eq('id', update.id);

        if (error) {
          // Throw to trigger retry for transient errors
          if (error.message?.includes('500') || error.message?.includes('timeout')) {
            throw new Error(error.message);
          }
          console.error(`[batchUpdateAgents] Non-retryable error for agent ${update.id}:`, error);
        }
      }, 3, 200); // Fewer retries, faster initial delay for DB ops
    }

    // Small delay between batches to prevent overwhelming the DB
    if (i + batchSize < updates.length) {
      await sleep(CONFIG.BATCH_DELAY_MS);
    }
  }
}

function calculateCompetitiveScore(agent: SonicAgent): number {
  const successRate = agent.success_rate ?? 0;
  const confidence = agent.avg_confidence ?? 0;
  const experience = clamp((agent.total_tasks_completed ?? 0) / 100, 0, 1);
  const velocity = agent.learning_velocity ?? 0.5;
  const specCount = Object.keys(agent.task_specializations ?? {}).length;
  const specializationDepth = specCount / ALL_TASK_TYPES.length;

  return (
    successRate * 0.3 +
    confidence * 0.2 +
    experience * 0.2 +
    velocity * 0.15 +
    specializationDepth * 0.15
  );
}

function selectRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function groupBySector(agents: SonicAgent[]): Record<string, SonicAgent[]> {
  const groups: Record<string, SonicAgent[]> = {};
  for (const agent of agents) {
    const sector = agent.sector || 'GENERAL';
    if (!groups[sector]) groups[sector] = [];
    groups[sector].push(agent);
  }
  return groups;
}

// ============================================================================
// Evolution Mode Implementations
// ============================================================================

async function executeCollectiveIntelligence(
  agents: SonicAgent[],
  supabase: SupabaseClient,
  intensity: number,
  logger: ServiceLogger
): Promise<{ results: EvolutionResult[], knowledgeGained: number }> {
  await logger.info(`Collective Intelligence processing ${agents.length} agents`);

  const results: EvolutionResult[] = [];
  let totalKnowledge = 0;

  const topPerformers = agents
    .filter(a => (a.success_rate ?? 0) > CONFIG.MIN_TOP_PERFORMER_RATE)
    .sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
    .slice(0, Math.ceil(agents.length * CONFIG.TOP_PERFORMER_PERCENTAGE));

  const collectiveKnowledge: Record<string, CollectiveKnowledge> = {};

  for (const performer of topPerformers) {
    const specs = performer.task_specializations ?? {};
    for (const [taskType, score] of Object.entries(specs)) {
      if (!collectiveKnowledge[taskType]) {
        collectiveKnowledge[taskType] = {
          taskType,
          bestPractices: [],
          topPerformers: [],
          synergyPatterns: {},
          emergentStrategies: []
        };
      }
      collectiveKnowledge[taskType].topPerformers.push(performer.id);
      collectiveKnowledge[taskType].synergyPatterns[performer.sector] =
        (collectiveKnowledge[taskType].synergyPatterns[performer.sector] ?? 0) + (score as number);
    }
  }

  const updates: AgentUpdate[] = [];
  const memories: AgentMemory[] = [];
  const learningEvents: LearningEvent[] = [];
  const timestamp = new Date().toISOString();

  for (const agent of agents) {
    const currentSpecs = agent.task_specializations ?? {};
    const newSpecs = { ...currentSpecs };
    let knowledgeGain = 0;
    let transferred = 0;

    for (const [taskType, knowledge] of Object.entries(collectiveKnowledge)) {
      const currentScore = (currentSpecs[taskType] as number) ?? 0;
      const collectiveBoost = Math.min(
        CONFIG.COLLECTIVE_BOOST_MAX,
        intensity * CONFIG.COLLECTIVE_BOOST_BASE * knowledge.topPerformers.length
      );

      if (currentScore < CONFIG.MAX_SKILL_SCORE) {
        newSpecs[taskType] = clamp(currentScore + collectiveBoost, 0, CONFIG.MAX_SKILL_SCORE);
        knowledgeGain += collectiveBoost;
        transferred++;
      }
    }

    const newVelocity = clamp(
      (agent.learning_velocity ?? 0.5) + (intensity * CONFIG.VELOCITY_INCREMENT_COLLECTIVE),
      0,
      CONFIG.MAX_LEARNING_VELOCITY
    );

    updates.push({
      id: agent.id,
      task_specializations: newSpecs,
      learning_velocity: newVelocity,
      last_performance_update: timestamp
    });

    if (knowledgeGain > 0.1) {
      memories.push({
        agent_id: agent.id,
        user_id: agent.user_id,
        memory_type: 'collective_learning',
        content: `Absorbed collective intelligence from ${transferred} domains, gaining ${(knowledgeGain * 100).toFixed(0)}% knowledge boost through swarm intelligence network.`,
        importance_score: clamp(knowledgeGain, 0, 1),
        context: { mode: 'collective', transferred, intensity }
      });

      learningEvents.push({
        agent_id: agent.id,
        event_type: 'collective_absorption',
        event_data: { transferred, knowledgeGain, intensity },
        impact_score: clamp(knowledgeGain, 0, 1)
      });
    }

    results.push({
      agentId: agent.id,
      agentName: agent.name,
      previousScore: agent.success_rate ?? 0,
      newScore: clamp((agent.success_rate ?? 0) + knowledgeGain * 0.1, 0, 1),
      evolutionGain: knowledgeGain,
      knowledgeTransferred: transferred,
      competitionsWon: 0,
      memoriesCrystallized: 0
    });

    totalKnowledge += knowledgeGain;
  }

  await batchUpdateAgents(supabase, updates);
  if (memories.length > 0) await batchInsert(supabase, 'agent_memory', memories);
  if (learningEvents.length > 0) await batchInsert(supabase, 'agent_learning_events', learningEvents);

  await logger.info(`Collective Intelligence complete: ${results.length} agents, ${totalKnowledge.toFixed(2)} knowledge gained`);

  return { results, knowledgeGained: totalKnowledge };
}

async function executeHyperParallelLearning(
  agents: SonicAgent[],
  supabase: SupabaseClient,
  intensity: number,
  logger: ServiceLogger
): Promise<{ results: EvolutionResult[], knowledgeGained: number }> {
  await logger.info(`Hyper-Parallel processing ${agents.length} agents with ${intensity}x intensity`);

  const results: EvolutionResult[] = [];
  let totalKnowledge = 0;

  const updates: AgentUpdate[] = [];
  const learningEvents: LearningEvent[] = [];
  const timestamp = new Date().toISOString();

  for (const agent of agents) {
    const currentSpecs = agent.task_specializations ?? {};
    const newSpecs = { ...currentSpecs };
    let knowledgeGain = 0;

    const skillsToLearn = Math.floor(CONFIG.BASE_SKILLS_TO_LEARN + intensity * CONFIG.SKILLS_PER_INTENSITY);
    const selectedTasks = selectRandom([...ALL_TASK_TYPES], skillsToLearn);

    for (const taskType of selectedTasks) {
      const current = (currentSpecs[taskType] as number) ?? 0;
      const learningBoost = intensity * (CONFIG.PARALLEL_BOOST_BASE + Math.random() * CONFIG.PARALLEL_BOOST_VARIANCE);

      if (current < CONFIG.MAX_SKILL_SCORE) {
        newSpecs[taskType] = clamp(current + learningBoost, 0, CONFIG.MAX_SKILL_SCORE);
        knowledgeGain += learningBoost;
      }
    }

    const newVelocity = clamp(
      (agent.learning_velocity ?? 0.5) + (intensity * CONFIG.VELOCITY_INCREMENT_PARALLEL),
      0,
      CONFIG.MAX_LEARNING_VELOCITY
    );

    updates.push({
      id: agent.id,
      task_specializations: newSpecs,
      learning_velocity: newVelocity,
      last_performance_update: timestamp
    });

    learningEvents.push({
      agent_id: agent.id,
      event_type: 'hyper_parallel_learning',
      event_data: { skillsLearned: skillsToLearn, knowledgeGain, intensity },
      impact_score: clamp(knowledgeGain * 0.5, 0, 1)
    });

    results.push({
      agentId: agent.id,
      agentName: agent.name,
      previousScore: agent.success_rate ?? 0,
      newScore: clamp((agent.success_rate ?? 0) + knowledgeGain * 0.05, 0, 1),
      evolutionGain: knowledgeGain,
      knowledgeTransferred: skillsToLearn,
      competitionsWon: 0,
      memoriesCrystallized: 0
    });

    totalKnowledge += knowledgeGain;
  }

  await batchUpdateAgents(supabase, updates);
  if (learningEvents.length > 0) await batchInsert(supabase, 'agent_learning_events', learningEvents);

  await logger.info(`Hyper-Parallel complete: ${results.length} agents, ${totalKnowledge.toFixed(2)} knowledge gained`);

  return { results, knowledgeGained: totalKnowledge };
}

async function executeAdversarialEvolution(
  agents: SonicAgent[],
  supabase: SupabaseClient,
  intensity: number,
  logger: ServiceLogger
): Promise<{ results: EvolutionResult[], competitions: number }> {
  await logger.info(`Adversarial Evolution creating ${Math.floor(agents.length / 2)} competitions`);

  const results: EvolutionResult[] = [];
  let totalCompetitions = 0;

  const shuffled = [...agents].sort(() => Math.random() - 0.5);
  const pairs: [SonicAgent, SonicAgent][] = [];

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }

  const updates: AgentUpdate[] = [];
  const learningEvents: LearningEvent[] = [];
  const relationships: AgentRelationship[] = [];
  const timestamp = new Date().toISOString();

  for (const [agentA, agentB] of pairs) {
    const scoreA = calculateCompetitiveScore(agentA);
    const scoreB = calculateCompetitiveScore(agentB);

    const winner = scoreA >= scoreB ? agentA : agentB;
    const loser = scoreA >= scoreB ? agentB : agentA;
    const margin = Math.abs(scoreA - scoreB);

    const winnerBoost = intensity * CONFIG.ADVERSARIAL_WINNER_BOOST_BASE * (1 + margin);
    const loserLearning = intensity * CONFIG.ADVERSARIAL_LOSER_LEARNING;

    const winnerSpecs = winner.task_specializations ?? {};
    const winnerNewSpecs = { ...winnerSpecs };
    for (const key of Object.keys(winnerNewSpecs)) {
      winnerNewSpecs[key] = clamp((winnerNewSpecs[key] as number) + winnerBoost * 0.1, 0, CONFIG.MAX_SKILL_SCORE);
    }

    const loserSpecs = loser.task_specializations ?? {};
    const loserNewSpecs = { ...loserSpecs };
    for (const [key, value] of Object.entries(winnerSpecs)) {
      const loserCurrent = (loserNewSpecs[key] as number) ?? 0;
      if ((value as number) > loserCurrent) {
        loserNewSpecs[key] = clamp(loserCurrent + loserLearning, 0, CONFIG.MAX_SKILL_SCORE);
      }
    }

    updates.push({
      id: winner.id,
      task_specializations: winnerNewSpecs,
      success_rate: clamp((winner.success_rate ?? 0) + winnerBoost * 0.05, 0, 1),
      last_performance_update: timestamp
    });

    updates.push({
      id: loser.id,
      task_specializations: loserNewSpecs,
      learning_velocity: clamp((loser.learning_velocity ?? 0.5) + loserLearning * 0.1, 0, CONFIG.MAX_LEARNING_VELOCITY),
      last_performance_update: timestamp
    });

    relationships.push({
      agent_a_id: winner.id,
      agent_b_id: loser.id,
      relationship_type: 'competitive',
      synergy_score: 0.5 + margin,
      metadata: { competition_result: 'winner_a', margin, timestamp }
    });

    learningEvents.push({
      agent_id: winner.id,
      event_type: 'competition_won',
      event_data: { opponent: loser.id, margin, boost: winnerBoost },
      impact_score: winnerBoost
    });

    learningEvents.push({
      agent_id: loser.id,
      event_type: 'competition_learning',
      event_data: { mentor: winner.id, absorbed: loserLearning },
      impact_score: loserLearning
    });

    results.push({
      agentId: winner.id,
      agentName: winner.name,
      previousScore: winner.success_rate ?? 0,
      newScore: clamp((winner.success_rate ?? 0) + winnerBoost * 0.05, 0, 1),
      evolutionGain: winnerBoost,
      knowledgeTransferred: 0,
      competitionsWon: 1,
      memoriesCrystallized: 0
    });

    results.push({
      agentId: loser.id,
      agentName: loser.name,
      previousScore: loser.success_rate ?? 0,
      newScore: clamp((loser.success_rate ?? 0) + loserLearning * 0.02, 0, 1),
      evolutionGain: loserLearning,
      knowledgeTransferred: Object.keys(winnerSpecs).length,
      competitionsWon: 0,
      memoriesCrystallized: 0
    });

    totalCompetitions++;
  }

  await batchUpdateAgents(supabase, updates);
  if (learningEvents.length > 0) await batchInsert(supabase, 'agent_learning_events', learningEvents);

  for (const rel of relationships) {
    await supabase.from('agent_relationships').upsert(rel, { onConflict: 'agent_a_id,agent_b_id' });
  }

  await logger.info(`Adversarial Evolution complete: ${totalCompetitions} competitions`);

  return { results, competitions: totalCompetitions };
}

async function executeMemoryCrystallization(
  agents: SonicAgent[],
  supabase: SupabaseClient,
  intensity: number,
  logger: ServiceLogger
): Promise<{ crystallizations: number, knowledgeGained: number }> {
  await logger.info(`Memory Crystallization processing memories for ${agents.length} agents`);

  let totalCrystallizations = 0;
  let totalKnowledge = 0;

  // OPTIMIZED: Lowered threshold to find more top performers
  const topAgentIds = agents
    .filter(a => (a.success_rate ?? 0) > CONFIG.CRYSTALLIZATION_THRESHOLD)
    .sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
    .slice(0, 100) // Increased from 50
    .map(a => a.id);

  // If still no top performers, use the best available agents regardless of threshold
  if (topAgentIds.length === 0) {
    await logger.info('Memory Crystallization: No top performers above threshold, using best available');
    const bestAgents = [...agents]
      .sort((a, b) => (b.success_rate ?? 0) - (a.success_rate ?? 0))
      .slice(0, 25)
      .map(a => a.id);
    
    if (bestAgents.length === 0) {
      await logger.info('Memory Crystallization: No agents available');
      return { crystallizations: 0, knowledgeGained: 0 };
    }
    
    topAgentIds.push(...bestAgents);
  }

  const { data: memories, error: memoriesError } = await supabase
    .from('agent_memory')
    .select('*')
    .in('agent_id', topAgentIds)
    .gt('importance_score', 0.3) // Lowered from 0.5
    .order('importance_score', { ascending: false })
    .limit(150); // Increased from 100

  if (memoriesError) {
    await logger.error('Memory Crystallization: Error fetching memories', { error: String(memoriesError) });
    return { crystallizations: 0, knowledgeGained: 0 };
  }
  
  if (!memories?.length) {
    // Fallback: Get any memories if no high-importance ones exist
    const { data: fallbackMemories } = await supabase
      .from('agent_memory')
      .select('*')
      .in('agent_id', topAgentIds)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!fallbackMemories?.length) {
      await logger.info('Memory Crystallization: No memories found for crystallization');
      return { crystallizations: 0, knowledgeGained: 0 };
    }
    
    // Use fallback memories with adjusted importance
    for (const mem of fallbackMemories) {
      mem.importance_score = Math.max(mem.importance_score ?? 0.3, 0.4);
    }
    memories.push(...fallbackMemories);
  }

  const crystalMemories: AgentMemory[] = [];
  const crystalizedContent = new Set<string>();

  for (const memory of memories) {
    const contentHash = memory.content.substring(0, 50);
    if (crystalizedContent.has(contentHash)) continue;
    crystalizedContent.add(contentHash);

    crystalMemories.push({
      agent_id: memory.agent_id,
      user_id: memory.user_id,
      memory_type: 'crystallized',
      content: `[CRYSTALLIZED] ${memory.content}`,
      importance_score: clamp(memory.importance_score + intensity * CONFIG.CRYSTAL_IMPORTANCE_BOOST, 0, 1),
      context: {
        ...memory.context,
        crystallized: true,
        original_importance: memory.importance_score,
        crystallization_intensity: intensity
      }
    });

    totalCrystallizations++;
  }

  const propagatedMemories: AgentMemory[] = [];
  const updates: AgentUpdate[] = [];
  const timestamp = new Date().toISOString();

  for (const agent of agents) {
    const toReceive = selectRandom(crystalMemories, Math.ceil(intensity * 3));

    for (const crystal of toReceive) {
      if (crystal.agent_id !== agent.id) {
        propagatedMemories.push({
          agent_id: agent.id,
          user_id: agent.user_id,
          memory_type: 'received_crystal',
          content: crystal.content.replace('[CRYSTALLIZED]', '[RECEIVED]'),
          importance_score: crystal.importance_score * CONFIG.CRYSTAL_PROPAGATION_FACTOR,
          context: { source_agent: crystal.agent_id, propagated: true }
        });
        totalKnowledge += 0.05;
      }
    }

    const newVelocity = clamp(
      (agent.learning_velocity ?? 0.5) + intensity * CONFIG.VELOCITY_INCREMENT_CRYSTAL,
      0,
      CONFIG.MAX_LEARNING_VELOCITY
    );

    updates.push({
      id: agent.id,
      learning_velocity: newVelocity,
      last_performance_update: timestamp
    });
  }

  if (crystalMemories.length > 0) await batchInsert(supabase, 'agent_memory', crystalMemories);
  if (propagatedMemories.length > 0) await batchInsert(supabase, 'agent_memory', propagatedMemories);
  await batchUpdateAgents(supabase, updates);

  await supabase.from('agent_learning_events').insert({
    agent_id: agents[0]?.id ?? '00000000-0000-0000-0000-000000000000',
    event_type: 'memory_crystallization_complete',
    event_data: {
      crystallized: totalCrystallizations,
      propagated: propagatedMemories.length,
      agentsAffected: agents.length,
      intensity
    },
    impact_score: clamp(totalCrystallizations * 0.02, 0, 1)
  });

  await logger.info(`Memory Crystallization complete: ${totalCrystallizations} crystallized, ${propagatedMemories.length} propagated`);

  return { crystallizations: totalCrystallizations, knowledgeGained: totalKnowledge };
}

async function executeWebKnowledgeAbsorption(
  agents: SonicAgent[],
  supabase: SupabaseClient,
  intensity: number,
  logger: ServiceLogger
): Promise<{ knowledgeGained: number, topicsAbsorbed: number }> {
  await logger.info(`Web Knowledge Absorption starting for ${agents.length} agents`);

  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityApiKey) {
    await logger.warn('Perplexity API key not configured, skipping web knowledge absorption');
    return { knowledgeGained: 0, topicsAbsorbed: 0 };
  }

  let totalKnowledge = 0;
  let topicsAbsorbed = 0;

  const sectorGroups = groupBySector(agents);
  const memories: AgentMemory[] = [];
  const learningEvents: LearningEvent[] = [];
  const updates: AgentUpdate[] = [];
  const timestamp = new Date().toISOString();

  const sectorsToQuery = Object.keys(sectorGroups).slice(0, Math.ceil(intensity * 3));

  for (const sector of sectorsToQuery) {
    const topics = SECTOR_KNOWLEDGE_TOPICS[sector] ?? SECTOR_KNOWLEDGE_TOPICS.GENERAL;
    const selectedTopic = topics[Math.floor(Math.random() * topics.length)];

    try {
      await logger.debug(`Querying web knowledge: "${selectedTopic}" for sector ${sector}`);

      const knowledge = await withRetry(async () => {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a knowledge synthesizer. Provide concise, actionable insights that can be used to enhance AI agent capabilities. Focus on practical applications, emerging patterns, and strategic implications. Be specific and data-driven.'
              },
              {
                role: 'user',
                content: `Provide the latest insights on: ${selectedTopic}. Focus on actionable intelligence, emerging trends, key statistics, and practical applications for AI systems operating in the ${sector.toLowerCase()} domain.`
              }
            ],
            max_tokens: 500,
            temperature: 0.3,
            search_recency_filter: 'week'
          }),
        });

        if (!response.ok) throw new Error(`Perplexity API error: ${response.status}`);

        const data = await response.json();
        return {
          content: data.choices?.[0]?.message?.content,
          citations: data.citations ?? []
        };
      });

      if (knowledge.content) {
        topicsAbsorbed++;
        const knowledgeValue = clamp(CONFIG.WEB_KNOWLEDGE_BASE + intensity * CONFIG.WEB_KNOWLEDGE_PER_INTENSITY, 0, 1);

        const sectorAgents = sectorGroups[sector];
        const knowledgePerAgent = knowledgeValue / sectorAgents.length;

        for (const agent of sectorAgents) {
          memories.push({
            agent_id: agent.id,
            user_id: agent.user_id,
            memory_type: 'web_knowledge',
            content: `[WEB INSIGHT - ${selectedTopic}] ${knowledge.content.substring(0, 500)}`,
            importance_score: knowledgeValue,
            context: {
              source: 'perplexity_search',
              topic: selectedTopic,
              sector,
              citations: knowledge.citations.slice(0, 3),
              timestamp
            }
          });

          const currentSpecs = agent.task_specializations ?? {};
          const newSpecs = { ...currentSpecs };
          const researchBoost = intensity * CONFIG.RESEARCH_BOOST_BASE;

          newSpecs['research'] = clamp((newSpecs['research'] ?? 0) + researchBoost, 0, CONFIG.MAX_SKILL_SCORE);
          newSpecs['data_processing'] = clamp((newSpecs['data_processing'] ?? 0) + researchBoost * 0.5, 0, CONFIG.MAX_SKILL_SCORE);

          updates.push({
            id: agent.id,
            task_specializations: newSpecs,
            learning_velocity: clamp((agent.learning_velocity ?? 0.5) + intensity * CONFIG.VELOCITY_INCREMENT_WEB, 0, CONFIG.MAX_LEARNING_VELOCITY),
            last_performance_update: timestamp
          });

          totalKnowledge += knowledgePerAgent;
        }

        learningEvents.push({
          agent_id: sectorAgents[0]?.id ?? '00000000-0000-0000-0000-000000000000',
          event_type: 'web_knowledge_absorption',
          event_data: {
            topic: selectedTopic,
            sector,
            agentsEnriched: sectorAgents.length,
            knowledgeValue,
            citationCount: knowledge.citations.length,
            contentLength: knowledge.content.length
          },
          impact_score: knowledgeValue
        });

        await logger.debug(`Absorbed "${selectedTopic}" for ${sectorAgents.length} ${sector} agents`);
      }

    } catch (error) {
      await logger.error(`Error fetching web knowledge for ${sector}`, { error: String(error) });
    }

    await sleep(CONFIG.API_CALL_DELAY_MS);
  }

  if (memories.length > 0) await batchInsert(supabase, 'agent_memory', memories);
  if (learningEvents.length > 0) await batchInsert(supabase, 'agent_learning_events', learningEvents);
  await batchUpdateAgents(supabase, updates);

  await logger.info(`Web Knowledge Absorption complete: ${topicsAbsorbed} topics, ${totalKnowledge.toFixed(2)} knowledge gained`);

  return { knowledgeGained: totalKnowledge, topicsAbsorbed };
}

// ============================================================================
// TASK DISCOVERY - Query Perplexity for Real-World Tasks & Seed Task Queue
// ============================================================================

interface DiscoveredTask {
  title: string;
  description: string;
  task_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  sector: string;
  complexity: number;
  automation_potential: number;
}

async function executeRealWorldTaskDiscovery(
  agents: SonicAgent[],
  supabase: SupabaseClient,
  intensity: number,
  logger: ServiceLogger
): Promise<{ tasksDiscovered: number, tasksSeeded: number, knowledgeGained: number }> {
  await logger.info(`Real-World Task Discovery starting for ${agents.length} agents`);

  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityApiKey) {
    await logger.warn('Perplexity API key not configured, skipping task discovery');
    return { tasksDiscovered: 0, tasksSeeded: 0, knowledgeGained: 0 };
  }

  let totalTasksDiscovered = 0;
  let totalTasksSeeded = 0;
  let totalKnowledge = 0;

  const sectorGroups = groupBySector(agents);
  const memories: AgentMemory[] = [];
  const learningEvents: LearningEvent[] = [];
  const updates: AgentUpdate[] = [];
  const timestamp = new Date().toISOString();
  
  // Collect all discovered tasks for benchmark enhancement
  const allDiscoveredTasks: DiscoveredTask[] = [];
  const discoveredSectors: string[] = [];

  // Query up to 4 sectors based on intensity
  const sectorsToQuery = Object.keys(sectorGroups).slice(0, Math.ceil(intensity * 2));

  for (const sector of sectorsToQuery) {
    const discoveryPrompt = SECTOR_TASK_DISCOVERY_PROMPTS[sector] ?? SECTOR_TASK_DISCOVERY_PROMPTS.GENERAL;

    try {
      await logger.debug(`Discovering real-world tasks for sector ${sector}`);

      const taskDiscovery = await withRetry(async () => {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: `You are a task discovery agent. Analyze real-world automation tasks and return them as a JSON array. Each task should have:
- title: Short task name (max 60 chars)
- description: Clear description of what the task involves (max 200 chars)
- task_type: Category (one of: financial_analysis, data_processing, communication, operations, research, security_audit, technical_support, project_management, legal_review, hr_operations, creative_design, strategy)
- priority: Importance level (low, medium, high, critical)
- complexity: Difficulty score 1-10
- automation_potential: How automatable 0-1

Return ONLY valid JSON array, no markdown or explanation.`
              },
              {
                role: 'user',
                content: `${discoveryPrompt} Return 5-8 specific, actionable tasks as JSON.`
              }
            ],
            max_tokens: 1500,
            temperature: 0.4,
            search_recency_filter: 'month'
          }),
        });

        if (!response.ok) throw new Error(`Perplexity API error: ${response.status}`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        
        // Extract JSON from response (handle potential markdown wrapping)
        let jsonContent = content;
        if (content.includes('```')) {
          const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          jsonContent = match ? match[1] : content;
        }
        
        try {
          const tasks = JSON.parse(jsonContent.trim());
          return {
            tasks: Array.isArray(tasks) ? tasks : [],
            citations: data.citations ?? []
          };
        } catch {
          await logger.warn(`Failed to parse task JSON for ${sector}`);
          return { tasks: [], citations: [] };
        }
      });

      if (taskDiscovery.tasks.length > 0) {
        totalTasksDiscovered += taskDiscovery.tasks.length;
        const sectorAgents = sectorGroups[sector];
        
        // Collect discovered tasks for benchmark enhancement
        allDiscoveredTasks.push(...(taskDiscovery.tasks as DiscoveredTask[]));
        if (!discoveredSectors.includes(sector)) {
          discoveredSectors.push(sector);
        }

        // Seed tasks into agent_task_queue for training execution
        for (const task of taskDiscovery.tasks as DiscoveredTask[]) {
          // Select best agent for this task type based on specialization
          const sortedAgents = [...sectorAgents].sort((a, b) => {
            const aSpec = (a.task_specializations?.[task.task_type] as number) ?? 0;
            const bSpec = (b.task_specializations?.[task.task_type] as number) ?? 0;
            return bSpec - aSpec;
          });
          
          const assignedAgent = sortedAgents[0];
          if (!assignedAgent) continue;

          // Insert discovered task into queue
          const { error: insertError } = await supabase.from('agent_task_queue').insert({
            user_id: assignedAgent.user_id || '00000000-0000-0000-0000-000000000000',
            task_title: `[DISCOVERED] ${task.title}`,
            task_type: task.task_type,
            task_description: task.description,
            task_priority: task.priority,
            status: 'pending',
            assigned_agents: [assignedAgent.id],
            input_data: {
              source: 'perplexity_discovery',
              sector,
              complexity: task.complexity,
              automation_potential: task.automation_potential,
              discovered_at: timestamp,
              citations: taskDiscovery.citations.slice(0, 3)
            },
            orchestration_mode: 'training',
            agent_suggestions: [{
              agent_id: assignedAgent.id,
              agent_name: assignedAgent.name,
              reason: `Best ${task.task_type} specialist in ${sector} sector`,
              confidence: (assignedAgent.task_specializations?.[task.task_type] as number) ?? 0.5
            }]
          });

          if (!insertError) {
            totalTasksSeeded++;
          } else {
            await logger.warn(`Failed to seed task: ${insertError.message}`);
          }
        }

        // Enrich agent knowledge with discovered task patterns
        const knowledgeValue = clamp(0.4 + intensity * 0.15, 0, 1);
        const taskPatternSummary = taskDiscovery.tasks
          .map((t: DiscoveredTask) => `• ${t.title} (${t.task_type}, complexity: ${t.complexity}/10)`)
          .join('\n');

        for (const agent of sectorAgents) {
          memories.push({
            agent_id: agent.id,
            user_id: agent.user_id,
            memory_type: 'task_pattern_discovery',
            content: `[TASK PATTERNS - ${sector}]\n${taskPatternSummary}`,
            importance_score: knowledgeValue,
            context: {
              source: 'perplexity_task_discovery',
              sector,
              tasksDiscovered: taskDiscovery.tasks.length,
              taskTypes: [...new Set(taskDiscovery.tasks.map((t: DiscoveredTask) => t.task_type))],
              avgComplexity: taskDiscovery.tasks.reduce((s: number, t: DiscoveredTask) => s + (t.complexity || 5), 0) / taskDiscovery.tasks.length,
              timestamp
            }
          });

          // Boost specialization in discovered task types
          const currentSpecs = agent.task_specializations ?? {};
          const newSpecs = { ...currentSpecs };
          const discoveryBoost = intensity * 0.025;

          for (const task of taskDiscovery.tasks as DiscoveredTask[]) {
            const taskType = task.task_type;
            if (taskType) {
              newSpecs[taskType] = clamp((newSpecs[taskType] ?? 0) + discoveryBoost, 0, CONFIG.MAX_SKILL_SCORE);
            }
          }

          updates.push({
            id: agent.id,
            task_specializations: newSpecs,
            learning_velocity: clamp((agent.learning_velocity ?? 0.5) + intensity * 0.012, 0, CONFIG.MAX_LEARNING_VELOCITY),
            last_performance_update: timestamp
          });

          totalKnowledge += knowledgeValue / sectorAgents.length;
        }

        learningEvents.push({
          agent_id: sectorAgents[0]?.id ?? '00000000-0000-0000-0000-000000000000',
          event_type: 'real_world_task_discovery',
          event_data: {
            sector,
            tasksDiscovered: taskDiscovery.tasks.length,
            tasksSeeded: totalTasksSeeded,
            taskTypes: [...new Set(taskDiscovery.tasks.map((t: DiscoveredTask) => t.task_type))],
            agentsEnriched: sectorAgents.length,
            citationCount: taskDiscovery.citations.length
          },
          impact_score: knowledgeValue
        });

        await logger.debug(`Discovered ${taskDiscovery.tasks.length} tasks for ${sector}, seeded ${totalTasksSeeded}`);
      }

    } catch (error) {
      await logger.error(`Error discovering tasks for ${sector}`, { error: String(error) });
    }

    await sleep(CONFIG.API_CALL_DELAY_MS);
  }

  if (memories.length > 0) await batchInsert(supabase, 'agent_memory', memories);
  if (learningEvents.length > 0) await batchInsert(supabase, 'agent_learning_events', learningEvents);
  await batchUpdateAgents(supabase, updates);

  await logger.info(`Task Discovery complete: ${totalTasksDiscovered} discovered, ${totalTasksSeeded} seeded, ${totalKnowledge.toFixed(2)} knowledge gained`);

  // NEW: Enhance synthetic benchmarks based on discovered real-world patterns
  if (allDiscoveredTasks.length > 0) {
    const combinedSectors = discoveredSectors.join(',');
    const benchmarkEnhancements = await enhanceSyntheticBenchmarks(
      supabase,
      allDiscoveredTasks,
      combinedSectors,
      intensity,
      logger
    );
    totalKnowledge += benchmarkEnhancements.knowledgeAdded;
  }

  return { tasksDiscovered: totalTasksDiscovered, tasksSeeded: totalTasksSeeded, knowledgeGained: totalKnowledge };
}

// ============================================================================
// BENCHMARK ENHANCEMENT - Make Synthetic Benchmarks More Realistic
// ============================================================================

interface BenchmarkTemplate {
  task_type: string;
  title_patterns: string[];
  complexity_distribution: { min: number; max: number; avg: number };
  priority_weights: Record<string, number>;
  input_data_schemas: Record<string, unknown>[];
  success_criteria: string[];
  edge_cases: string[];
  real_world_context: string;
}

async function enhanceSyntheticBenchmarks(
  supabase: SupabaseClient,
  discoveredTasks: DiscoveredTask[],
  sector: string,
  intensity: number,
  logger: ServiceLogger
): Promise<{ benchmarksEnhanced: number; knowledgeAdded: number }> {
  if (discoveredTasks.length === 0) {
    return { benchmarksEnhanced: 0, knowledgeAdded: 0 };
  }

  await logger.info(`Enhancing synthetic benchmarks with ${discoveredTasks.length} real-world task patterns`);

  let benchmarksEnhanced = 0;
  let knowledgeAdded = 0;
  const timestamp = new Date().toISOString();

  // Group discovered tasks by type to create benchmark templates
  const taskTypePatterns: Record<string, BenchmarkTemplate> = {};

  for (const task of discoveredTasks) {
    const taskType = task.task_type || 'general';
    
    if (!taskTypePatterns[taskType]) {
      taskTypePatterns[taskType] = {
        task_type: taskType,
        title_patterns: [],
        complexity_distribution: { min: 10, max: 0, avg: 0 },
        priority_weights: { low: 0, medium: 0, high: 0, critical: 0 },
        input_data_schemas: [],
        success_criteria: [],
        edge_cases: [],
        real_world_context: sector
      };
    }

    const template = taskTypePatterns[taskType];

    // Extract title pattern
    const titlePattern = task.title
      .replace(/\d+/g, '{N}')
      .replace(/\b\d{4}\b/g, '{YEAR}')
      .replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi, '{MONTH}');
    template.title_patterns.push(titlePattern);

    // Update complexity distribution
    const complexity = task.complexity || 5;
    template.complexity_distribution.min = Math.min(template.complexity_distribution.min, complexity);
    template.complexity_distribution.max = Math.max(template.complexity_distribution.max, complexity);
    template.complexity_distribution.avg = 
      (template.complexity_distribution.avg * (template.title_patterns.length - 1) + complexity) / template.title_patterns.length;

    // Update priority weights
    const priority = task.priority || 'medium';
    template.priority_weights[priority] = (template.priority_weights[priority] || 0) + 1;

    // Generate success criteria from task description
    if (task.description) {
      const criteria = extractSuccessCriteria(task.description);
      template.success_criteria.push(...criteria);
    }

    // Generate edge cases based on complexity
    const edgeCases = generateEdgeCases(task);
    template.edge_cases.push(...edgeCases);
  }

  // Store benchmark templates as learning events for future synthetic task generation
  for (const [taskType, template] of Object.entries(taskTypePatterns)) {
    // Normalize priority weights
    const totalPriority = Object.values(template.priority_weights).reduce((a, b) => a + b, 0);
    if (totalPriority > 0) {
      for (const key of Object.keys(template.priority_weights)) {
        template.priority_weights[key] /= totalPriority;
      }
    }

    // Deduplicate arrays
    template.title_patterns = [...new Set(template.title_patterns)].slice(0, 10);
    template.success_criteria = [...new Set(template.success_criteria)].slice(0, 8);
    template.edge_cases = [...new Set(template.edge_cases)].slice(0, 6);

    // Store as benchmark enhancement event
    await supabase.from('agent_learning_events').insert({
      agent_id: '00000000-0000-0000-0000-000000000000', // System-level event
      event_type: 'benchmark_enhancement',
      event_data: {
        task_type: taskType,
        sector,
        template,
        source: 'real_world_discovery',
        pattern_count: template.title_patterns.length,
        avg_complexity: template.complexity_distribution.avg,
        timestamp
      },
      impact_score: clamp(0.5 + intensity * 0.2, 0, 1)
    });

    benchmarksEnhanced++;
    knowledgeAdded += 0.15;
  }

  // Generate enhanced synthetic tasks based on real-world patterns
  const syntheticTasks = await generateEnhancedSyntheticTasks(taskTypePatterns, sector, intensity);
  
  // Seed enhanced synthetic tasks into training queue
  for (const syntheticTask of syntheticTasks) {
    const { error } = await supabase.from('agent_task_queue').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      task_title: `[SYNTHETIC-ENHANCED] ${syntheticTask.title}`,
      task_type: syntheticTask.task_type,
      task_description: syntheticTask.description,
      task_priority: syntheticTask.priority,
      status: 'pending',
      input_data: {
        source: 'enhanced_synthetic',
        sector,
        based_on_real_patterns: true,
        complexity: syntheticTask.complexity,
        success_criteria: syntheticTask.success_criteria,
        edge_cases: syntheticTask.edge_cases,
        generated_at: timestamp
      },
      orchestration_mode: 'training'
    });

    if (!error) {
      benchmarksEnhanced++;
      knowledgeAdded += 0.05;
    }
  }

  await logger.info(`Benchmark enhancement complete: ${benchmarksEnhanced} enhanced, ${knowledgeAdded.toFixed(2)} knowledge added`);

  return { benchmarksEnhanced, knowledgeAdded };
}

function extractSuccessCriteria(description: string): string[] {
  const criteria: string[] = [];
  
  // Extract action verbs as potential success criteria
  const actionPatterns = [
    /(?:must|should|needs? to)\s+([^.,]+)/gi,
    /(?:complete|finish|process|analyze|review|validate|verify)\s+([^.,]+)/gi,
    /(?:ensure|confirm|check)\s+([^.,]+)/gi
  ];

  for (const pattern of actionPatterns) {
    const matches = description.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 10 && match[1].length < 100) {
        criteria.push(match[1].trim());
      }
    }
  }

  // If no matches, create generic criteria from description
  if (criteria.length === 0 && description.length > 20) {
    criteria.push(`Successfully ${description.substring(0, 80).toLowerCase()}`);
  }

  return criteria;
}

function generateEdgeCases(task: DiscoveredTask): string[] {
  const edgeCases: string[] = [];
  const complexity = task.complexity || 5;
  
  // Generate edge cases based on task type
  const edgeCaseTemplates: Record<string, string[]> = {
    financial_analysis: [
      'Negative balance scenarios',
      'Currency conversion edge cases',
      'Missing historical data',
      'Large transaction volumes'
    ],
    data_processing: [
      'Empty dataset input',
      'Malformed data records',
      'Extremely large files',
      'Duplicate record handling'
    ],
    communication: [
      'Multilingual content',
      'Urgent escalation scenarios',
      'Missing recipient information',
      'Attachment size limits'
    ],
    operations: [
      'System downtime handling',
      'Concurrent request conflicts',
      'Resource constraint scenarios',
      'Rollback requirements'
    ],
    research: [
      'Contradictory source data',
      'Outdated information',
      'Ambiguous query terms',
      'Citation verification'
    ],
    security_audit: [
      'False positive handling',
      'Zero-day vulnerability detection',
      'Privilege escalation scenarios',
      'Audit log tampering'
    ],
    default: [
      'Invalid input handling',
      'Timeout scenarios',
      'Partial completion handling',
      'Error recovery'
    ]
  };

  const templates = edgeCaseTemplates[task.task_type] || edgeCaseTemplates.default;
  
  // Add edge cases based on complexity
  const casesToAdd = Math.min(Math.ceil(complexity / 2.5), templates.length);
  for (let i = 0; i < casesToAdd; i++) {
    edgeCases.push(`${task.title}: ${templates[i]}`);
  }

  return edgeCases;
}

function generateEnhancedSyntheticTasks(
  patterns: Record<string, BenchmarkTemplate>,
  sector: string,
  intensity: number
): Array<{
  title: string;
  task_type: string;
  description: string;
  priority: string;
  complexity: number;
  success_criteria: string[];
  edge_cases: string[];
}> {
  const syntheticTasks: Array<{
    title: string;
    task_type: string;
    description: string;
    priority: string;
    complexity: number;
    success_criteria: string[];
    edge_cases: string[];
  }> = [];

  const tasksToGenerate = Math.ceil(intensity * 3);

  for (const [taskType, template] of Object.entries(patterns)) {
    for (let i = 0; i < Math.min(tasksToGenerate, 3); i++) {
      // Generate title from patterns
      const patternIdx = Math.floor(Math.random() * template.title_patterns.length);
      let title = template.title_patterns[patternIdx] || `Synthetic ${taskType} task`;
      title = title
        .replace('{N}', String(Math.floor(Math.random() * 100) + 1))
        .replace('{YEAR}', '2025')
        .replace('{MONTH}', ['January', 'February', 'March'][Math.floor(Math.random() * 3)]);

      // Select priority based on real-world distribution
      const priorityRoll = Math.random();
      let priority = 'medium';
      let cumulative = 0;
      for (const [p, weight] of Object.entries(template.priority_weights)) {
        cumulative += weight;
        if (priorityRoll <= cumulative) {
          priority = p;
          break;
        }
      }

      // Generate complexity within discovered range
      const complexityRange = template.complexity_distribution.max - template.complexity_distribution.min;
      const complexity = template.complexity_distribution.min + 
        Math.random() * complexityRange * (0.8 + Math.random() * 0.4); // ±20% variance

      // Combine success criteria
      const criteria = template.success_criteria
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Select edge cases
      const edges = template.edge_cases
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      syntheticTasks.push({
        title: `[${sector}] ${title}`,
        task_type: taskType,
        description: `Enhanced synthetic ${taskType} task based on real-world ${sector} patterns. Complexity: ${complexity.toFixed(1)}/10`,
        priority,
        complexity: Math.round(complexity),
        success_criteria: criteria,
        edge_cases: edges
      });
    }
  }

  return syntheticTasks;
}

async function executeVisualIntelligence(
  agents: SonicAgent[],
  supabase: SupabaseClient,
  intensity: number,
  logger: ServiceLogger
): Promise<{ knowledgeGained: number, visualPatternsLearned: number }> {
  await logger.info(`Visual Intelligence starting for ${agents.length} agents`);

  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    await logger.warn('Lovable API key not configured, skipping visual intelligence');
    return { knowledgeGained: 0, visualPatternsLearned: 0 };
  }

  let totalKnowledge = 0;
  let visualPatternsLearned = 0;

  const sectorGroups = groupBySector(agents);
  const memories: AgentMemory[] = [];
  const learningEvents: LearningEvent[] = [];
  const updates: AgentUpdate[] = [];
  const timestamp = new Date().toISOString();

  const sectorsToProcess = Object.keys(sectorGroups).slice(0, Math.ceil(intensity * 2));

  for (const sector of sectorsToProcess) {
    const visualContext = SECTOR_VISUAL_CONTEXTS[sector] ?? SECTOR_VISUAL_CONTEXTS.GENERAL;
    const imagePrompt = visualContext.imagePrompts[Math.floor(Math.random() * visualContext.imagePrompts.length)];
    const videoScenario = visualContext.videoScenarios[Math.floor(Math.random() * visualContext.videoScenarios.length)];

    try {
      await logger.debug(`Processing visual intelligence for sector ${sector}: "${imagePrompt}"`);

      const visualKnowledge = await withRetry(async () => {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a visual intelligence trainer for AI agents in the ${sector.toLowerCase()} domain.
Your job is to teach agents how to recognize and analyze visual patterns, diagrams, charts, and video content.
Provide detailed pattern recognition insights, visual analysis techniques, and interpretation frameworks.
Be specific about shapes, layouts, color meanings, motion patterns, and visual hierarchies.`
              },
              {
                role: 'user',
                content: `Teach an AI agent how to visually analyze and interpret: "${imagePrompt}"

Additionally, explain how to analyze video content showing: "${videoScenario}"

Provide:
1. Key visual elements to identify
2. Pattern recognition techniques
3. Color and shape interpretation
4. Motion analysis (for video)
5. Context interpretation strategies
6. Common visual indicators and their meanings
7. Decision-making based on visual data`
              }
            ],
            max_tokens: 800,
            temperature: 0.4,
          }),
        });

        if (!response.ok) throw new Error(`Lovable API error: ${response.status}`);

        const data = await response.json();
        return data.choices?.[0]?.message?.content;
      });

      if (visualKnowledge) {
        visualPatternsLearned++;
        const knowledgeValue = clamp(CONFIG.VISUAL_KNOWLEDGE_BASE + intensity * CONFIG.VISUAL_KNOWLEDGE_PER_INTENSITY, 0, 1);

        const sectorAgents = sectorGroups[sector];
        const knowledgePerAgent = knowledgeValue / sectorAgents.length;

        for (const agent of sectorAgents) {
          memories.push({
            agent_id: agent.id,
            user_id: agent.user_id,
            memory_type: 'visual_intelligence',
            content: `[VISUAL PATTERN LEARNING - ${imagePrompt}] ${visualKnowledge.substring(0, 600)}`,
            importance_score: knowledgeValue,
            context: {
              source: 'gemini_vision',
              imagePrompt,
              videoScenario,
              sector,
              learningType: 'visual_pattern_recognition',
              timestamp
            }
          });

          const currentSpecs = agent.task_specializations ?? {};
          const newSpecs = { ...currentSpecs };
          const visualBoost = intensity * CONFIG.VISUAL_BOOST_BASE;

          newSpecs['visual_analysis'] = clamp((newSpecs['visual_analysis'] ?? 0) + visualBoost, 0, CONFIG.MAX_SKILL_SCORE);
          newSpecs['pattern_recognition'] = clamp((newSpecs['pattern_recognition'] ?? 0) + visualBoost * 0.8, 0, CONFIG.MAX_SKILL_SCORE);
          newSpecs['data_visualization'] = clamp((newSpecs['data_visualization'] ?? 0) + visualBoost * 0.6, 0, CONFIG.MAX_SKILL_SCORE);
          newSpecs['video_analysis'] = clamp((newSpecs['video_analysis'] ?? 0) + visualBoost * 0.7, 0, CONFIG.MAX_SKILL_SCORE);

          updates.push({
            id: agent.id,
            task_specializations: newSpecs,
            learning_velocity: clamp((agent.learning_velocity ?? 0.5) + intensity * CONFIG.VELOCITY_INCREMENT_VISUAL, 0, CONFIG.MAX_LEARNING_VELOCITY),
            last_performance_update: timestamp
          });

          totalKnowledge += knowledgePerAgent;
        }

        learningEvents.push({
          agent_id: sectorAgents[0]?.id ?? '00000000-0000-0000-0000-000000000000',
          event_type: 'visual_intelligence_learning',
          event_data: {
            imagePrompt,
            videoScenario,
            sector,
            agentsEnriched: sectorAgents.length,
            knowledgeValue,
            contentLength: visualKnowledge.length,
            skillsEnhanced: ['visual_analysis', 'pattern_recognition', 'data_visualization', 'video_analysis']
          },
          impact_score: knowledgeValue
        });

        await logger.debug(`Learned "${imagePrompt}" for ${sectorAgents.length} ${sector} agents`);
      }

    } catch (error) {
      await logger.error(`Error in visual intelligence for ${sector}`, { error: String(error) });
    }

    await sleep(CONFIG.VISUAL_API_DELAY_MS);
  }

  if (memories.length > 0) await batchInsert(supabase, 'agent_memory', memories);
  if (learningEvents.length > 0) await batchInsert(supabase, 'agent_learning_events', learningEvents);
  await batchUpdateAgents(supabase, updates);

  await logger.info(`Visual Intelligence complete: ${visualPatternsLearned} patterns, ${totalKnowledge.toFixed(2)} knowledge gained`);

  return { knowledgeGained: totalKnowledge, visualPatternsLearned };
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const params = validateRequest(body);

    const logger = new ServiceLogger(
      supabase,
      requestId,
      params.userId,
      null,
      'hyper-evolution'
    );

    await logger.info(`Starting ${params.mode} mode`, {
      batch: params.batchSize,
      intensity: params.intensityMultiplier,
      cycles: params.evolutionCycles
    });

    const allResults: EvolutionResult[] = [];
    let totalKnowledgeGained = 0;
    let totalCompetitions = 0;
    let totalCrystallizations = 0;
    let totalTasksDiscovered = 0;
    let totalTasksSeeded = 0;

    for (let cycle = 0; cycle < params.evolutionCycles; cycle++) {
      await logger.info(`Cycle ${cycle + 1}/${params.evolutionCycles}`);

      let query = supabase
        .from('sonic_agents')
        .select('id, name, sector, status, learning_velocity, task_specializations, success_rate, total_tasks_completed, avg_confidence, user_id')
        .order('last_performance_update', { ascending: true, nullsFirst: true })
        .limit(params.batchSize);

      if (params.targetSector) query = query.eq('sector', params.targetSector);
      if (params.userId) query = query.eq('user_id', params.userId);

      const { data: agentsData, error } = await query;

      if (error) throw new Error(`Failed to fetch agents: ${error.message}`);
      if (!agentsData?.length) {
        await logger.info('No agents found for this cycle, continuing');
        continue;
      }

      const agents = agentsData as SonicAgent[];
      const { mode, intensityMultiplier } = params;

      if (mode === 'full_acceleration' || mode === 'collective') {
        const collectiveResults = await executeCollectiveIntelligence(agents, supabase, intensityMultiplier, logger);
        allResults.push(...collectiveResults.results);
        totalKnowledgeGained += collectiveResults.knowledgeGained;
      }

      if (mode === 'full_acceleration' || mode === 'hyper_parallel') {
        const parallelResults = await executeHyperParallelLearning(agents, supabase, intensityMultiplier, logger);
        allResults.push(...parallelResults.results);
        totalKnowledgeGained += parallelResults.knowledgeGained;
      }

      if (mode === 'full_acceleration' || mode === 'adversarial') {
        const adversarialResults = await executeAdversarialEvolution(agents, supabase, intensityMultiplier, logger);
        allResults.push(...adversarialResults.results);
        totalCompetitions += adversarialResults.competitions;
      }

      if (mode === 'full_acceleration' || mode === 'crystallization') {
        const crystalResults = await executeMemoryCrystallization(agents, supabase, intensityMultiplier, logger);
        totalCrystallizations += crystalResults.crystallizations;
        totalKnowledgeGained += crystalResults.knowledgeGained;
      }

      if (mode === 'full_acceleration' || mode === 'web_knowledge') {
        const webResults = await executeWebKnowledgeAbsorption(agents, supabase, intensityMultiplier, logger);
        totalKnowledgeGained += webResults.knowledgeGained;
      }

      if (mode === 'full_acceleration' || mode === 'visual_intelligence') {
        const visualResults = await executeVisualIntelligence(agents, supabase, intensityMultiplier, logger);
        totalKnowledgeGained += visualResults.knowledgeGained;
      }

      if (mode === 'full_acceleration' || mode === 'task_discovery') {
        const taskResults = await executeRealWorldTaskDiscovery(agents, supabase, intensityMultiplier, logger);
        totalTasksDiscovered += taskResults.tasksDiscovered;
        totalTasksSeeded += taskResults.tasksSeeded;
        totalKnowledgeGained += taskResults.knowledgeGained;
      }
    }

    const duration = Date.now() - startTime;

    const firstAgentId = allResults[0]?.agentId ?? '00000000-0000-0000-0000-000000000000';
    await supabase.from('agent_learning_events').insert({
      agent_id: firstAgentId,
      event_type: 'hyper_evolution_complete',
      event_data: {
        request_id: requestId,
        mode: params.mode,
        totalAgents: allResults.length,
        totalCycles: params.evolutionCycles,
        totalKnowledgeGained,
        totalCompetitions,
        totalCrystallizations,
        totalTasksDiscovered,
        totalTasksSeeded,
        durationMs: duration,
        intensityMultiplier: params.intensityMultiplier,
        timestamp: new Date().toISOString()
      },
      impact_score: clamp(totalKnowledgeGained / 100, 0, 1)
    });

    const uniqueAgents = new Set(allResults.map(r => r.agentId)).size;
    const averageGain = allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.evolutionGain, 0) / allResults.length
      : 0;

    const summary = {
      mode: params.mode,
      totalAgentsEvolved: uniqueAgents,
      evolutionCycles: params.evolutionCycles,
      totalKnowledgeGained: Math.round(totalKnowledgeGained * 100) / 100,
      totalCompetitions,
      totalCrystallizations,
      totalTasksDiscovered,
      totalTasksSeeded,
      averageEvolutionGain: Math.round(averageGain * 100) / 100,
      durationMs: duration,
      evolutionRate: `${Math.round((allResults.length / (duration / 1000)) * 10) / 10} agents/sec`
    };

    await logger.info('Evolution complete', summary);

    return new Response(JSON.stringify({
      success: true,
      message: `Hyper-evolution complete: ${summary.totalAgentsEvolved} agents evolved in ${summary.evolutionCycles} cycles`,
      summary,
      topEvolutions: allResults.sort((a, b) => b.evolutionGain - a.evolutionGain).slice(0, 10)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[Hyper-Evolution] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
