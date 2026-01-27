/**
 * Atlas Orchestrator - Search & Synthesis Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse, getConversationContext, filterValidUUIDs } from "../utils.ts";

export async function search(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  // Generate embedding for the query
  const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ctx.lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: req.query,
    }),
  });

  if (!embeddingResponse.ok) {
    // Fallback to text search if embeddings not available
    console.log('Embedding not available, using text search fallback');
    const { data: agents, error } = await ctx.supabase
      .from('sonic_agents')
      .select('id, name, sector, description, capabilities, code_artifact')
      .or(`name.ilike.%${req.query}%,description.ilike.%${req.query}%`)
      .limit(10);

    if (error) {
      return errorResponse(error.message, 500);
    }

    return successResponse({
      agents: agents || [],
      searchMethod: 'text'
    });
  }

  const embeddingData = await embeddingResponse.json();
  const queryEmbedding = embeddingData.data[0].embedding;

  // Search using vector similarity
  const { data: agents, error } = await ctx.supabase.rpc('search_agents_by_embedding', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 10,
  });

  if (error) {
    console.error('Vector search error:', error);
    return errorResponse(error.message, 500);
  }

  return successResponse({
    agents: agents || [],
    searchMethod: 'semantic'
  });
}

export async function webSearch(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

  if (!perplexityKey) {
    return errorResponse('Web search not configured', 500);
  }

  console.log('[atlas-orchestrator] Performing web search:', req.query);

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${perplexityKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: "Be precise and concise. Provide factual, up-to-date information." },
        { role: "user", content: req.query }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[atlas-orchestrator] Perplexity error:', errorText);
    return errorResponse('Web search failed', 500);
  }

  const data = await response.json();

  return successResponse({
    answer: data.choices?.[0]?.message?.content || "No results found",
    citations: data.citations || [],
    searchMethod: 'web'
  });
}

export async function synthesize(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { agentIds, requirements } = req as any;

  const conversationContext = await getConversationContext(ctx.supabase, ctx.userId!, ctx.sessionId, 10);

  const validAgentIds = filterValidUUIDs(agentIds || []);

  let agents: any[] = [];
  if (validAgentIds.length > 0) {
    const { data, error } = await ctx.supabase
      .from('sonic_agents')
      .select('*')
      .in('id', validAgentIds);

    if (error) {
      return errorResponse(error.message, 500);
    }
    agents = data || [];
  }

  const agentsList = agents.length > 0
    ? `Existing Agents to merge:\n${agents.map(a => `- ${a.name} (${a.sector}): ${a.description || 'No description'}`).join('\n')}`
    : 'No existing agents specified. Create a new agent from scratch based on the requirements.';

  const synthesisPrompt = `You are Atlas, an AI agent synthesizer. Create a new synthesized agent based on the requirements.

${conversationContext ? `Use this conversation context to better understand user needs:${conversationContext}` : ''}

${agentsList}

User Requirements: ${requirements || 'Create a general-purpose task management agent'}

Generate a JSON response with:
{
  "name": "synthesized agent name",
  "sector": "one of: FINANCE, BIOTECH, SECURITY, DATA, CREATIVE, UTILITY",
  "description": "detailed description",
  "capabilities": ["capability1", "capability2"],
  "code_artifact": "TypeScript code for the agent"
}`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ctx.lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are Atlas, an expert AI agent synthesizer. Always respond with valid JSON.' },
        { role: 'user', content: synthesisPrompt },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error('AI synthesis error:', errorText);
    return errorResponse('Failed to synthesize agent', 500);
  }

  const aiData = await aiResponse.json();
  const synthesizedContent = aiData.choices[0].message.content;

  let synthesizedAgent;
  try {
    const jsonMatch = synthesizedContent.match(/\{[\s\S]*\}/);
    synthesizedAgent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    console.error('Failed to parse synthesized agent:', e);
    synthesizedAgent = null;
  }

  return successResponse({
    synthesizedAgent,
    sourceAgents: agents
  });
}
