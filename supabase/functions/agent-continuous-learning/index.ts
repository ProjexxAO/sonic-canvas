// Agent Continuous Learning - Background learning cycles for idle agents
// Enables agents to evolve and improve even when not actively being used

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Learning activity types
const LEARNING_MODES = {
  KNOWLEDGE_SYNTHESIS: 'knowledge_synthesis',      // Consolidate and connect existing knowledge
  SKILL_PRACTICE: 'skill_practice',                // Practice and refine existing skills
  RELATIONSHIP_DISCOVERY: 'relationship_discovery', // Find synergies with other agents
  DOMAIN_EXPLORATION: 'domain_exploration',        // Explore related domain knowledge
  MEMORY_CONSOLIDATION: 'memory_consolidation',    // Organize and prioritize memories
  PATTERN_RECOGNITION: 'pattern_recognition',      // Identify patterns from past tasks
};

// Learning intensity based on agent status
const LEARNING_INTENSITY = {
  IDLE: 0.3,      // Low intensity for actively idle agents
  DORMANT: 0.5,   // Medium intensity for dormant agents
  STANDBY: 0.2,   // Light learning for standby agents
};

interface LearningResult {
  agentId: string;
  agentName: string;
  learningMode: string;
  knowledgeGained: number;
  specializationBoost: number;
  relationshipsDiscovered: number;
  memoryConsolidated: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      batchSize = 50,
      learningMode = 'auto',
      targetSector = null,
      intensityMultiplier = 1.0,
      userId = null
    } = await req.json().catch(() => ({}));

    console.log(`[Continuous Learning] Starting learning cycle - batch: ${batchSize}, mode: ${learningMode}`);

    // Select agents for learning (prioritize those that haven't learned recently)
    let query = supabase
      .from('sonic_agents')
      .select('id, name, sector, status, learning_velocity, task_specializations, last_performance_update, user_id')
      .in('status', ['IDLE', 'ACTIVE', 'DORMANT'])
      .order('last_performance_update', { ascending: true, nullsFirst: true })
      .limit(batchSize);

    if (targetSector) {
      query = query.eq('sector', targetSector);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: agents, error: agentsError } = await query;

    if (agentsError) {
      console.error('[Continuous Learning] Error fetching agents:', agentsError);
      throw agentsError;
    }

    if (!agents || agents.length === 0) {
      console.log('[Continuous Learning] No agents available for learning');
      return new Response(JSON.stringify({
        success: true,
        message: 'No agents available for learning cycle',
        agentsProcessed: 0,
        results: []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[Continuous Learning] Processing ${agents.length} agents`);

    const learningResults: LearningResult[] = [];
    const learningEvents: any[] = [];
    const memoryInserts: any[] = [];
    const relationshipUpdates: any[] = [];
    const agentUpdates: any[] = [];

    for (const agent of agents) {
      // Determine learning mode
      const selectedMode = learningMode === 'auto' 
        ? selectLearningMode(agent)
        : learningMode;

      // Calculate learning intensity
      const baseIntensity = LEARNING_INTENSITY[agent.status as keyof typeof LEARNING_INTENSITY] || 0.2;
      const velocity = agent.learning_velocity || 0.5;
      const intensity = baseIntensity * velocity * intensityMultiplier;

      // Execute learning based on mode
      const result = await executeLearning(agent, selectedMode, intensity, supabase);
      learningResults.push(result);

      // Create learning event
      learningEvents.push({
        agent_id: agent.id,
        event_type: 'continuous_learning',
        event_data: {
          learning_mode: selectedMode,
          intensity,
          knowledge_gained: result.knowledgeGained,
          specialization_boost: result.specializationBoost,
          relationships_discovered: result.relationshipsDiscovered,
          timestamp: new Date().toISOString()
        },
        impact_score: result.knowledgeGained * 0.5 + result.specializationBoost * 0.3 + (result.relationshipsDiscovered * 0.1)
      });

      // Create memory from learning
      if (result.knowledgeGained > 0.3) {
        memoryInserts.push({
          agent_id: agent.id,
          user_id: agent.user_id,
          memory_type: 'learning',
          content: generateLearningMemory(agent, selectedMode, result),
          importance_score: result.knowledgeGained,
          context: {
            learning_mode: selectedMode,
            intensity,
            autonomous: true
          }
        });
      }

      // Update agent's learning velocity (small boost for continuous learning)
      const newVelocity = Math.min(1.0, velocity + (intensity * 0.02));
      agentUpdates.push({
        id: agent.id,
        learning_velocity: newVelocity,
        last_performance_update: new Date().toISOString()
      });
    }

    // Batch insert learning events
    if (learningEvents.length > 0) {
      const { error: eventsError } = await supabase
        .from('agent_learning_events')
        .insert(learningEvents);
      
      if (eventsError) {
        console.error('[Continuous Learning] Error inserting events:', eventsError);
      }
    }

    // Batch insert memories
    if (memoryInserts.length > 0) {
      const { error: memoryError } = await supabase
        .from('agent_memory')
        .insert(memoryInserts);
      
      if (memoryError) {
        console.error('[Continuous Learning] Error inserting memories:', memoryError);
      }
    }

    // Batch update agents
    for (const update of agentUpdates) {
      await supabase
        .from('sonic_agents')
        .update({ 
          learning_velocity: update.learning_velocity,
          last_performance_update: update.last_performance_update
        })
        .eq('id', update.id);
    }

    // Discover and update relationships
    await discoverRelationships(agents, supabase);

    const summary = {
      totalAgentsProcessed: agents.length,
      totalKnowledgeGained: learningResults.reduce((sum, r) => sum + r.knowledgeGained, 0),
      totalSpecializationBoost: learningResults.reduce((sum, r) => sum + r.specializationBoost, 0),
      totalRelationshipsDiscovered: learningResults.reduce((sum, r) => sum + r.relationshipsDiscovered, 0),
      learningModes: Object.values(LEARNING_MODES).map(mode => ({
        mode,
        count: learningResults.filter(r => r.learningMode === mode).length
      }))
    };

    console.log(`[Continuous Learning] Cycle complete:`, summary);

    return new Response(JSON.stringify({
      success: true,
      message: `Continuous learning cycle completed for ${agents.length} agents`,
      summary,
      results: learningResults
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[Continuous Learning] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

function selectLearningMode(agent: any): string {
  const specializations = agent.task_specializations || {};
  const specializationCount = Object.keys(specializations).length;
  
  // Random weighted selection based on agent state
  const random = Math.random();
  
  if (specializationCount === 0) {
    // New agents focus on domain exploration
    return LEARNING_MODES.DOMAIN_EXPLORATION;
  } else if (specializationCount < 3) {
    // Developing agents practice skills
    if (random < 0.4) return LEARNING_MODES.SKILL_PRACTICE;
    if (random < 0.7) return LEARNING_MODES.DOMAIN_EXPLORATION;
    return LEARNING_MODES.KNOWLEDGE_SYNTHESIS;
  } else {
    // Experienced agents do deeper learning
    if (random < 0.25) return LEARNING_MODES.PATTERN_RECOGNITION;
    if (random < 0.45) return LEARNING_MODES.KNOWLEDGE_SYNTHESIS;
    if (random < 0.65) return LEARNING_MODES.RELATIONSHIP_DISCOVERY;
    if (random < 0.85) return LEARNING_MODES.MEMORY_CONSOLIDATION;
    return LEARNING_MODES.SKILL_PRACTICE;
  }
}

async function executeLearning(
  agent: any, 
  mode: string, 
  intensity: number,
  supabase: any
): Promise<LearningResult> {
  // Simulate learning outcomes based on mode and intensity
  let knowledgeGained = 0;
  let specializationBoost = 0;
  let relationshipsDiscovered = 0;
  let memoryConsolidated = false;

  switch (mode) {
    case LEARNING_MODES.KNOWLEDGE_SYNTHESIS:
      // Consolidate existing knowledge
      knowledgeGained = intensity * (0.3 + Math.random() * 0.4);
      specializationBoost = intensity * 0.1;
      memoryConsolidated = true;
      break;

    case LEARNING_MODES.SKILL_PRACTICE:
      // Practice improves specialization
      specializationBoost = intensity * (0.2 + Math.random() * 0.3);
      knowledgeGained = intensity * 0.15;
      
      // Update existing task scores slightly
      const specializations = agent.task_specializations || {};
      for (const taskType of Object.keys(specializations)) {
        const currentScore = specializations[taskType] || 0;
        if (currentScore < 1.0) {
          const { error } = await supabase
            .from('agent_task_scores')
            .update({ 
              specialization_score: Math.min(1.0, currentScore + specializationBoost * 0.1)
            })
            .eq('agent_id', agent.id)
            .eq('task_type', taskType);
        }
      }
      break;

    case LEARNING_MODES.RELATIONSHIP_DISCOVERY:
      // Discover synergies with other agents
      knowledgeGained = intensity * 0.2;
      relationshipsDiscovered = Math.floor(intensity * 3 * Math.random());
      break;

    case LEARNING_MODES.DOMAIN_EXPLORATION:
      // Explore new areas of knowledge
      knowledgeGained = intensity * (0.4 + Math.random() * 0.4);
      specializationBoost = intensity * 0.05;
      break;

    case LEARNING_MODES.MEMORY_CONSOLIDATION:
      // Organize memories, improve retrieval
      memoryConsolidated = true;
      knowledgeGained = intensity * 0.25;
      
      // Boost importance of high-value memories
      await supabase
        .from('agent_memory')
        .update({ importance_score: 0.9 })
        .eq('agent_id', agent.id)
        .gt('importance_score', 0.7)
        .lt('importance_score', 0.9);
      break;

    case LEARNING_MODES.PATTERN_RECOGNITION:
      // Identify patterns from historical data
      knowledgeGained = intensity * (0.35 + Math.random() * 0.35);
      specializationBoost = intensity * 0.15;
      break;
  }

  return {
    agentId: agent.id,
    agentName: agent.name,
    learningMode: mode,
    knowledgeGained: Math.round(knowledgeGained * 100) / 100,
    specializationBoost: Math.round(specializationBoost * 100) / 100,
    relationshipsDiscovered,
    memoryConsolidated
  };
}

function generateLearningMemory(agent: any, mode: string, result: LearningResult): string {
  const templates = {
    [LEARNING_MODES.KNOWLEDGE_SYNTHESIS]: 
      `Synthesized cross-domain knowledge patterns, strengthening understanding of ${agent.sector} operations.`,
    [LEARNING_MODES.SKILL_PRACTICE]: 
      `Practiced ${agent.sector} skills through simulation, improving task execution confidence by ${(result.specializationBoost * 100).toFixed(0)}%.`,
    [LEARNING_MODES.RELATIONSHIP_DISCOVERY]: 
      `Discovered ${result.relationshipsDiscovered} potential collaboration opportunities with complementary agents.`,
    [LEARNING_MODES.DOMAIN_EXPLORATION]: 
      `Explored adjacent domain knowledge, expanding capabilities in ${agent.sector} sector.`,
    [LEARNING_MODES.MEMORY_CONSOLIDATION]: 
      `Consolidated and organized accumulated experiences, improving knowledge retrieval efficiency.`,
    [LEARNING_MODES.PATTERN_RECOGNITION]: 
      `Identified recurring patterns in historical task data, enhancing predictive capabilities.`,
  };

  return templates[mode] || `Completed ${mode} learning cycle with ${(result.knowledgeGained * 100).toFixed(0)}% knowledge gain.`;
}

async function discoverRelationships(agents: any[], supabase: any) {
  // Find agents with complementary skills and create/update relationships
  const sectorGroups: Record<string, any[]> = {};
  
  for (const agent of agents) {
    const sector = agent.sector || 'GENERAL';
    if (!sectorGroups[sector]) sectorGroups[sector] = [];
    sectorGroups[sector].push(agent);
  }

  // Create relationships between agents in same sector
  for (const [sector, sectorAgents] of Object.entries(sectorGroups)) {
    if (sectorAgents.length < 2) continue;

    for (let i = 0; i < sectorAgents.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 3, sectorAgents.length); j++) {
        const agentA = sectorAgents[i];
        const agentB = sectorAgents[j];

        // Calculate synergy based on complementary skills
        const synergyScore = calculateSynergy(agentA, agentB);

        if (synergyScore > 0.3) {
          // Upsert relationship
          await supabase
            .from('agent_relationships')
            .upsert({
              agent_a_id: agentA.id,
              agent_b_id: agentB.id,
              relationship_type: 'collaborative',
              synergy_score: synergyScore,
              metadata: {
                discovered_via: 'continuous_learning',
                sector,
                timestamp: new Date().toISOString()
              }
            }, {
              onConflict: 'agent_a_id,agent_b_id'
            });
        }
      }
    }
  }
}

function calculateSynergy(agentA: any, agentB: any): number {
  const specsA = Object.keys(agentA.task_specializations || {});
  const specsB = Object.keys(agentB.task_specializations || {});
  
  // Complementary skills boost synergy
  const overlap = specsA.filter(s => specsB.includes(s)).length;
  const unique = specsA.length + specsB.length - overlap * 2;
  
  if (specsA.length === 0 || specsB.length === 0) {
    return 0.3 + Math.random() * 0.2; // Base synergy for new agents
  }

  // Balance of shared and unique skills is ideal
  const overlapRatio = overlap / Math.max(specsA.length, specsB.length);
  const uniqueRatio = unique / (specsA.length + specsB.length);
  
  return Math.min(1.0, (overlapRatio * 0.4) + (uniqueRatio * 0.4) + (Math.random() * 0.2));
}
