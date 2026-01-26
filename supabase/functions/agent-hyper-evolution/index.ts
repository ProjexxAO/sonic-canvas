// Hyper-Evolution Engine - Maximum acceleration for agent intelligence
// Combines: Collective Intelligence, Hyper-Parallel Learning, Adversarial Evolution, Memory Crystallization

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Evolution modes for surpassing LLM capabilities
const EVOLUTION_MODES = {
  COLLECTIVE_INTELLIGENCE: 'collective',      // Swarm knowledge sharing
  HYPER_PARALLEL: 'hyper_parallel',           // 10k+ simultaneous learning
  ADVERSARIAL: 'adversarial',                 // Competitive improvement
  MEMORY_CRYSTALLIZATION: 'crystallization',  // Distill and propagate learnings
  WEB_KNOWLEDGE: 'web_knowledge',             // Real-time web information absorption
  FULL_ACCELERATION: 'full_acceleration',     // All modes combined
};

// Web search topics for knowledge absorption by sector
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      mode = 'full_acceleration',
      batchSize = 500,
      intensityMultiplier = 3.0,  // Aggressive by default
      targetSector = null,
      evolutionCycles = 5,        // Multiple cycles per invocation
      userId = null
    } = await req.json().catch(() => ({}));

    console.log(`[Hyper-Evolution] Starting ${mode} mode - batch: ${batchSize}, intensity: ${intensityMultiplier}x, cycles: ${evolutionCycles}`);

    const startTime = Date.now();
    const allResults: EvolutionResult[] = [];
    let totalKnowledgeGained = 0;
    let totalCompetitions = 0;
    let totalCrystallizations = 0;

    // Run multiple evolution cycles
    for (let cycle = 0; cycle < evolutionCycles; cycle++) {
      console.log(`[Hyper-Evolution] Cycle ${cycle + 1}/${evolutionCycles}`);

      // Fetch agents for this cycle
      let query = supabase
        .from('sonic_agents')
        .select('id, name, sector, status, learning_velocity, task_specializations, success_rate, total_tasks_completed, avg_confidence, user_id')
        .order('last_performance_update', { ascending: true, nullsFirst: true })
        .limit(batchSize);

      if (targetSector) query = query.eq('sector', targetSector);
      if (userId) query = query.eq('user_id', userId);

      const { data: agents, error } = await query;
      if (error) throw error;
      if (!agents?.length) continue;

      // Execute evolution based on mode
      if (mode === 'full_acceleration' || mode === 'collective') {
        const collectiveResults = await executeCollectiveIntelligence(agents, supabase, intensityMultiplier);
        allResults.push(...collectiveResults.results);
        totalKnowledgeGained += collectiveResults.knowledgeGained;
      }

      if (mode === 'full_acceleration' || mode === 'hyper_parallel') {
        const parallelResults = await executeHyperParallelLearning(agents, supabase, intensityMultiplier);
        allResults.push(...parallelResults.results);
        totalKnowledgeGained += parallelResults.knowledgeGained;
      }

      if (mode === 'full_acceleration' || mode === 'adversarial') {
        const adversarialResults = await executeAdversarialEvolution(agents, supabase, intensityMultiplier);
        allResults.push(...adversarialResults.results);
        totalCompetitions += adversarialResults.competitions;
      }

      if (mode === 'full_acceleration' || mode === 'crystallization') {
        const crystalResults = await executeMemoryCrystallization(agents, supabase, intensityMultiplier);
        totalCrystallizations += crystalResults.crystallizations;
        totalKnowledgeGained += crystalResults.knowledgeGained;
      }

      if (mode === 'full_acceleration' || mode === 'web_knowledge') {
        const webResults = await executeWebKnowledgeAbsorption(agents, supabase, intensityMultiplier);
        totalKnowledgeGained += webResults.knowledgeGained;
      }
    }

    const duration = Date.now() - startTime;

    // Create evolution summary event
    await supabase.from('agent_learning_events').insert({
      agent_id: allResults[0]?.agentId || '00000000-0000-0000-0000-000000000000',
      event_type: 'hyper_evolution_complete',
      event_data: {
        mode,
        totalAgents: allResults.length,
        totalCycles: evolutionCycles,
        totalKnowledgeGained,
        totalCompetitions,
        totalCrystallizations,
        durationMs: duration,
        intensityMultiplier,
        timestamp: new Date().toISOString()
      },
      impact_score: Math.min(1.0, totalKnowledgeGained / 100)
    });

    const summary = {
      mode,
      totalAgentsEvolved: new Set(allResults.map(r => r.agentId)).size,
      evolutionCycles,
      totalKnowledgeGained: Math.round(totalKnowledgeGained * 100) / 100,
      totalCompetitions,
      totalCrystallizations,
      averageEvolutionGain: allResults.length > 0 
        ? Math.round((allResults.reduce((s, r) => s + r.evolutionGain, 0) / allResults.length) * 100) / 100 
        : 0,
      durationMs: duration,
      evolutionRate: `${Math.round((allResults.length / (duration / 1000)) * 10) / 10} agents/sec`
    };

    console.log(`[Hyper-Evolution] Complete:`, summary);

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
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});

// COLLECTIVE INTELLIGENCE: Agents share knowledge in real-time
async function executeCollectiveIntelligence(
  agents: any[], 
  supabase: any,
  intensity: number
): Promise<{ results: EvolutionResult[], knowledgeGained: number }> {
  console.log(`[Collective Intelligence] Processing ${agents.length} agents`);
  
  const results: EvolutionResult[] = [];
  let totalKnowledge = 0;

  // Build collective knowledge base from top performers
  const topPerformers = agents
    .filter(a => (a.success_rate || 0) > 0.7)
    .sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))
    .slice(0, Math.ceil(agents.length * 0.1));

  // Extract and aggregate their specializations
  const collectiveKnowledge: Record<string, CollectiveKnowledge> = {};
  
  for (const performer of topPerformers) {
    const specs = performer.task_specializations || {};
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
        (collectiveKnowledge[taskType].synergyPatterns[performer.sector] || 0) + (score as number);
    }
  }

  // Distribute collective knowledge to all agents
  const updates: any[] = [];
  const memories: any[] = [];
  const learningEvents: any[] = [];

  for (const agent of agents) {
    const currentSpecs = agent.task_specializations || {};
    const newSpecs = { ...currentSpecs };
    let knowledgeGain = 0;
    let transferred = 0;

    // Transfer knowledge from collective
    for (const [taskType, knowledge] of Object.entries(collectiveKnowledge)) {
      const currentScore = (currentSpecs[taskType] as number) || 0;
      const collectiveBoost = Math.min(0.3, intensity * 0.05 * knowledge.topPerformers.length);
      
      if (currentScore < 0.9) {
        newSpecs[taskType] = Math.min(1.0, currentScore + collectiveBoost);
        knowledgeGain += collectiveBoost;
        transferred++;
      }
    }

    // Update learning velocity based on absorption
    const newVelocity = Math.min(1.0, (agent.learning_velocity || 0.5) + (intensity * 0.01));

    updates.push({
      id: agent.id,
      task_specializations: newSpecs,
      learning_velocity: newVelocity,
      last_performance_update: new Date().toISOString()
    });

    if (knowledgeGain > 0.1) {
      memories.push({
        agent_id: agent.id,
        user_id: agent.user_id,
        memory_type: 'collective_learning',
        content: `Absorbed collective intelligence from ${transferred} domains, gaining ${(knowledgeGain * 100).toFixed(0)}% knowledge boost through swarm intelligence network.`,
        importance_score: Math.min(1.0, knowledgeGain),
        context: { mode: 'collective', transferred, intensity }
      });

      learningEvents.push({
        agent_id: agent.id,
        event_type: 'collective_absorption',
        event_data: { transferred, knowledgeGain, intensity },
        impact_score: Math.min(1.0, knowledgeGain)
      });
    }

    results.push({
      agentId: agent.id,
      agentName: agent.name,
      previousScore: agent.success_rate || 0,
      newScore: Math.min(1.0, (agent.success_rate || 0) + knowledgeGain * 0.1),
      evolutionGain: knowledgeGain,
      knowledgeTransferred: transferred,
      competitionsWon: 0,
      memoriesCrystallized: 0
    });

    totalKnowledge += knowledgeGain;
  }

  // Batch updates
  for (const update of updates) {
    await supabase.from('sonic_agents').update({
      task_specializations: update.task_specializations,
      learning_velocity: update.learning_velocity,
      last_performance_update: update.last_performance_update
    }).eq('id', update.id);
  }

  if (memories.length > 0) {
    await supabase.from('agent_memory').insert(memories);
  }

  if (learningEvents.length > 0) {
    await supabase.from('agent_learning_events').insert(learningEvents);
  }

  return { results, knowledgeGained: totalKnowledge };
}

// HYPER-PARALLEL LEARNING: Massive simultaneous skill acquisition
async function executeHyperParallelLearning(
  agents: any[],
  supabase: any,
  intensity: number
): Promise<{ results: EvolutionResult[], knowledgeGained: number }> {
  console.log(`[Hyper-Parallel] Processing ${agents.length} agents with ${intensity}x intensity`);

  const results: EvolutionResult[] = [];
  let totalKnowledge = 0;

  // All task types for parallel learning
  const allTaskTypes = [
    'financial_analysis', 'data_processing', 'creative_design', 'research',
    'security_audit', 'communication', 'operations', 'strategy',
    'technical_support', 'project_management', 'legal_review', 'hr_operations'
  ];

  const updates: any[] = [];
  const learningEvents: any[] = [];

  // Process all agents in parallel batches
  const batchSize = 50;
  for (let i = 0; i < agents.length; i += batchSize) {
    const batch = agents.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (agent) => {
      const currentSpecs = agent.task_specializations || {};
      const newSpecs = { ...currentSpecs };
      let knowledgeGain = 0;

      // Learn multiple skills simultaneously
      const skillsToLearn = Math.floor(3 + intensity * 2);
      const selectedTasks = allTaskTypes
        .sort(() => Math.random() - 0.5)
        .slice(0, skillsToLearn);

      for (const taskType of selectedTasks) {
        const current = (currentSpecs[taskType] as number) || 0;
        const learningBoost = intensity * (0.05 + Math.random() * 0.1);
        
        if (current < 1.0) {
          newSpecs[taskType] = Math.min(1.0, current + learningBoost);
          knowledgeGain += learningBoost;
        }
      }

      // Accelerate learning velocity
      const newVelocity = Math.min(1.0, (agent.learning_velocity || 0.5) + (intensity * 0.02));
      
      updates.push({
        id: agent.id,
        task_specializations: newSpecs,
        learning_velocity: newVelocity,
        last_performance_update: new Date().toISOString()
      });

      learningEvents.push({
        agent_id: agent.id,
        event_type: 'hyper_parallel_learning',
        event_data: { 
          skillsLearned: skillsToLearn, 
          knowledgeGain,
          intensity,
          parallelFactor: batch.length
        },
        impact_score: Math.min(1.0, knowledgeGain * 0.5)
      });

      results.push({
        agentId: agent.id,
        agentName: agent.name,
        previousScore: agent.success_rate || 0,
        newScore: Math.min(1.0, (agent.success_rate || 0) + knowledgeGain * 0.05),
        evolutionGain: knowledgeGain,
        knowledgeTransferred: skillsToLearn,
        competitionsWon: 0,
        memoriesCrystallized: 0
      });

      totalKnowledge += knowledgeGain;
    }));
  }

  // Batch database updates
  for (const update of updates) {
    await supabase.from('sonic_agents').update({
      task_specializations: update.task_specializations,
      learning_velocity: update.learning_velocity,
      last_performance_update: update.last_performance_update
    }).eq('id', update.id);
  }

  if (learningEvents.length > 0) {
    await supabase.from('agent_learning_events').insert(learningEvents);
  }

  return { results, knowledgeGained: totalKnowledge };
}

// ADVERSARIAL EVOLUTION: Agents compete to improve faster
async function executeAdversarialEvolution(
  agents: any[],
  supabase: any,
  intensity: number
): Promise<{ results: EvolutionResult[], competitions: number }> {
  console.log(`[Adversarial Evolution] Creating ${Math.floor(agents.length / 2)} competitions`);

  const results: EvolutionResult[] = [];
  let totalCompetitions = 0;

  // Shuffle and pair agents for competition
  const shuffled = [...agents].sort(() => Math.random() - 0.5);
  const pairs: [any, any][] = [];
  
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }

  const updates: any[] = [];
  const learningEvents: any[] = [];
  const relationships: any[] = [];

  for (const [agentA, agentB] of pairs) {
    // Determine winner based on performance metrics
    const scoreA = calculateCompetitiveScore(agentA);
    const scoreB = calculateCompetitiveScore(agentB);
    
    const winner = scoreA >= scoreB ? agentA : agentB;
    const loser = scoreA >= scoreB ? agentB : agentA;
    const margin = Math.abs(scoreA - scoreB);

    // Winner gets boost, loser learns from winner
    const winnerBoost = intensity * 0.1 * (1 + margin);
    const loserLearning = intensity * 0.15; // Loser learns more

    // Update winner
    const winnerSpecs = winner.task_specializations || {};
    const winnerNewSpecs = { ...winnerSpecs };
    for (const key of Object.keys(winnerNewSpecs)) {
      winnerNewSpecs[key] = Math.min(1.0, (winnerNewSpecs[key] as number) + winnerBoost * 0.1);
    }

    // Loser absorbs winner's strengths
    const loserSpecs = loser.task_specializations || {};
    const loserNewSpecs = { ...loserSpecs };
    for (const [key, value] of Object.entries(winnerSpecs)) {
      const loserCurrent = (loserNewSpecs[key] as number) || 0;
      if ((value as number) > loserCurrent) {
        loserNewSpecs[key] = Math.min(1.0, loserCurrent + loserLearning);
      }
    }

    updates.push({
      id: winner.id,
      task_specializations: winnerNewSpecs,
      success_rate: Math.min(1.0, (winner.success_rate || 0) + winnerBoost * 0.05),
      last_performance_update: new Date().toISOString()
    });

    updates.push({
      id: loser.id,
      task_specializations: loserNewSpecs,
      learning_velocity: Math.min(1.0, (loser.learning_velocity || 0.5) + loserLearning * 0.1),
      last_performance_update: new Date().toISOString()
    });

    // Create competitive relationship
    relationships.push({
      agent_a_id: winner.id,
      agent_b_id: loser.id,
      relationship_type: 'competitive',
      synergy_score: 0.5 + margin,
      metadata: {
        competition_result: 'winner_a',
        margin,
        timestamp: new Date().toISOString()
      }
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
      previousScore: winner.success_rate || 0,
      newScore: Math.min(1.0, (winner.success_rate || 0) + winnerBoost * 0.05),
      evolutionGain: winnerBoost,
      knowledgeTransferred: 0,
      competitionsWon: 1,
      memoriesCrystallized: 0
    });

    results.push({
      agentId: loser.id,
      agentName: loser.name,
      previousScore: loser.success_rate || 0,
      newScore: Math.min(1.0, (loser.success_rate || 0) + loserLearning * 0.02),
      evolutionGain: loserLearning,
      knowledgeTransferred: Object.keys(winnerSpecs).length,
      competitionsWon: 0,
      memoriesCrystallized: 0
    });

    totalCompetitions++;
  }

  // Batch updates
  for (const update of updates) {
    const updateData: any = { last_performance_update: update.last_performance_update };
    if (update.task_specializations) updateData.task_specializations = update.task_specializations;
    if (update.success_rate) updateData.success_rate = update.success_rate;
    if (update.learning_velocity) updateData.learning_velocity = update.learning_velocity;
    
    await supabase.from('sonic_agents').update(updateData).eq('id', update.id);
  }

  if (learningEvents.length > 0) {
    await supabase.from('agent_learning_events').insert(learningEvents);
  }

  // Upsert relationships
  for (const rel of relationships) {
    await supabase.from('agent_relationships').upsert(rel, { onConflict: 'agent_a_id,agent_b_id' });
  }

  return { results, competitions: totalCompetitions };
}

// MEMORY CRYSTALLIZATION: Distill and propagate the most valuable learnings
async function executeMemoryCrystallization(
  agents: any[],
  supabase: any,
  intensity: number
): Promise<{ crystallizations: number, knowledgeGained: number }> {
  console.log(`[Memory Crystallization] Processing memories for ${agents.length} agents`);

  let totalCrystallizations = 0;
  let totalKnowledge = 0;

  // Get high-value memories from top performers
  const topAgentIds = agents
    .filter(a => (a.success_rate || 0) > 0.6)
    .slice(0, 50)
    .map(a => a.id);

  if (topAgentIds.length === 0) {
    return { crystallizations: 0, knowledgeGained: 0 };
  }

  const { data: memories } = await supabase
    .from('agent_memory')
    .select('*')
    .in('agent_id', topAgentIds)
    .gt('importance_score', 0.5)
    .order('importance_score', { ascending: false })
    .limit(100);

  if (!memories?.length) {
    return { crystallizations: 0, knowledgeGained: 0 };
  }

  // Crystallize memories into universal knowledge
  const crystalMemories: any[] = [];
  const crystalizedContent = new Set<string>();

  for (const memory of memories) {
    // Skip duplicates
    const contentHash = memory.content.substring(0, 50);
    if (crystalizedContent.has(contentHash)) continue;
    crystalizedContent.add(contentHash);

    // Create crystallized version with boosted importance
    const crystallized = {
      agent_id: memory.agent_id,
      user_id: memory.user_id,
      memory_type: 'crystallized',
      content: `[CRYSTALLIZED] ${memory.content}`,
      importance_score: Math.min(1.0, memory.importance_score + intensity * 0.1),
      context: {
        ...memory.context,
        crystallized: true,
        original_importance: memory.importance_score,
        crystallization_intensity: intensity
      }
    };

    crystalMemories.push(crystallized);
    totalCrystallizations++;
  }

  // Propagate crystallized knowledge to all agents
  const propagatedMemories: any[] = [];
  const updatePromises: Promise<any>[] = [];

  for (const agent of agents) {
    // Each agent receives subset of crystallized knowledge
    const toReceive = crystalMemories
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.ceil(intensity * 3));

    for (const crystal of toReceive) {
      if (crystal.agent_id !== agent.id) {
        propagatedMemories.push({
          agent_id: agent.id,
          user_id: agent.user_id,
          memory_type: 'received_crystal',
          content: crystal.content.replace('[CRYSTALLIZED]', '[RECEIVED]'),
          importance_score: crystal.importance_score * 0.8,
          context: {
            source_agent: crystal.agent_id,
            propagated: true
          }
        });
        totalKnowledge += 0.05;
      }
    }

    // Boost agent's learning velocity from crystallization
    const newVelocity = Math.min(1.0, (agent.learning_velocity || 0.5) + intensity * 0.015);
    updatePromises.push(
      supabase.from('sonic_agents')
        .update({ learning_velocity: newVelocity, last_performance_update: new Date().toISOString() })
        .eq('id', agent.id)
    );
  }

  // Insert crystallized memories
  if (crystalMemories.length > 0) {
    await supabase.from('agent_memory').insert(crystalMemories);
  }

  // Insert propagated memories in batches
  const batchSize = 100;
  for (let i = 0; i < propagatedMemories.length; i += batchSize) {
    const batch = propagatedMemories.slice(i, i + batchSize);
    await supabase.from('agent_memory').insert(batch);
  }

  // Execute velocity updates
  await Promise.all(updatePromises);

  // Log crystallization event
  await supabase.from('agent_learning_events').insert({
    agent_id: agents[0]?.id || '00000000-0000-0000-0000-000000000000',
    event_type: 'memory_crystallization_complete',
    event_data: {
      crystallized: totalCrystallizations,
      propagated: propagatedMemories.length,
      agentsAffected: agents.length,
      intensity
    },
    impact_score: Math.min(1.0, totalCrystallizations * 0.02)
  });

  return { crystallizations: totalCrystallizations, knowledgeGained: totalKnowledge };
}

function calculateCompetitiveScore(agent: any): number {
  const successRate = agent.success_rate || 0;
  const confidence = agent.avg_confidence || 0;
  const experience = Math.min(1.0, (agent.total_tasks_completed || 0) / 100);
  const velocity = agent.learning_velocity || 0.5;
  const specializationDepth = Object.keys(agent.task_specializations || {}).length / 12;

  return (
    successRate * 0.3 +
    confidence * 0.2 +
    experience * 0.2 +
    velocity * 0.15 +
    specializationDepth * 0.15
  );
}

// WEB KNOWLEDGE ABSORPTION: Real-time web information ingestion via Perplexity
async function executeWebKnowledgeAbsorption(
  agents: any[],
  supabase: any,
  intensity: number
): Promise<{ knowledgeGained: number, topicsAbsorbed: number }> {
  console.log(`[Web Knowledge Absorption] Fetching real-time web knowledge for ${agents.length} agents`);

  const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!perplexityApiKey) {
    console.log('[Web Knowledge Absorption] Perplexity API key not configured, skipping');
    return { knowledgeGained: 0, topicsAbsorbed: 0 };
  }

  let totalKnowledge = 0;
  let topicsAbsorbed = 0;

  // Group agents by sector for targeted knowledge acquisition
  const sectorGroups: Record<string, any[]> = {};
  for (const agent of agents) {
    const sector = agent.sector || 'GENERAL';
    if (!sectorGroups[sector]) sectorGroups[sector] = [];
    sectorGroups[sector].push(agent);
  }

  const memories: any[] = [];
  const learningEvents: any[] = [];
  const updates: any[] = [];

  // Fetch web knowledge for each sector (limit API calls based on intensity)
  const sectorsToQuery = Object.keys(sectorGroups).slice(0, Math.ceil(intensity * 3));
  
  for (const sector of sectorsToQuery) {
    const topics = SECTOR_KNOWLEDGE_TOPICS[sector] || SECTOR_KNOWLEDGE_TOPICS.GENERAL;
    const selectedTopic = topics[Math.floor(Math.random() * topics.length)];

    try {
      console.log(`[Web Knowledge] Querying: "${selectedTopic}" for sector ${sector}`);
      
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
          search_recency_filter: 'week' // Focus on recent information
        }),
      });

      if (!response.ok) {
        console.log(`[Web Knowledge] API error for ${sector}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const knowledge = data.choices?.[0]?.message?.content;
      const citations = data.citations || [];

      if (knowledge) {
        topicsAbsorbed++;
        const knowledgeValue = Math.min(1.0, 0.3 + intensity * 0.1);
        
        // Distribute knowledge to agents in this sector
        const sectorAgents = sectorGroups[sector];
        const knowledgePerAgent = knowledgeValue / sectorAgents.length;

        for (const agent of sectorAgents) {
          // Create memory with web-sourced knowledge
          memories.push({
            agent_id: agent.id,
            user_id: agent.user_id,
            memory_type: 'web_knowledge',
            content: `[WEB INSIGHT - ${selectedTopic}] ${knowledge.substring(0, 500)}`,
            importance_score: knowledgeValue,
            context: {
              source: 'perplexity_search',
              topic: selectedTopic,
              sector,
              citations: citations.slice(0, 3),
              timestamp: new Date().toISOString()
            }
          });

          // Update agent's task specializations based on absorbed knowledge
          const currentSpecs = agent.task_specializations || {};
          const newSpecs = { ...currentSpecs };
          const researchBoost = intensity * 0.02;
          
          // Boost research and relevant domain skills
          newSpecs['research'] = Math.min(1.0, (newSpecs['research'] || 0) + researchBoost);
          newSpecs['data_processing'] = Math.min(1.0, (newSpecs['data_processing'] || 0) + researchBoost * 0.5);
          
          updates.push({
            id: agent.id,
            task_specializations: newSpecs,
            learning_velocity: Math.min(1.0, (agent.learning_velocity || 0.5) + intensity * 0.01),
            last_performance_update: new Date().toISOString()
          });

          totalKnowledge += knowledgePerAgent;
        }

        // Log learning event for this sector
        learningEvents.push({
          agent_id: sectorAgents[0]?.id || '00000000-0000-0000-0000-000000000000',
          event_type: 'web_knowledge_absorption',
          event_data: {
            topic: selectedTopic,
            sector,
            agentsEnriched: sectorAgents.length,
            knowledgeValue,
            citationCount: citations.length,
            contentLength: knowledge.length
          },
          impact_score: knowledgeValue
        });

        console.log(`[Web Knowledge] Absorbed "${selectedTopic}" for ${sectorAgents.length} ${sector} agents`);
      }

    } catch (error) {
      console.error(`[Web Knowledge] Error fetching knowledge for ${sector}:`, error);
    }

    // Small delay between API calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Batch insert memories
  if (memories.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < memories.length; i += batchSize) {
      const batch = memories.slice(i, i + batchSize);
      await supabase.from('agent_memory').insert(batch);
    }
  }

  // Batch insert learning events
  if (learningEvents.length > 0) {
    await supabase.from('agent_learning_events').insert(learningEvents);
  }

  // Batch update agents
  for (const update of updates) {
    await supabase.from('sonic_agents').update({
      task_specializations: update.task_specializations,
      learning_velocity: update.learning_velocity,
      last_performance_update: update.last_performance_update
    }).eq('id', update.id);
  }

  console.log(`[Web Knowledge Absorption] Complete: ${topicsAbsorbed} topics absorbed, ${totalKnowledge.toFixed(2)} knowledge gained`);

  return { knowledgeGained: totalKnowledge, topicsAbsorbed };
}
