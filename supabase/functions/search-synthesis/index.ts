/**
 * Search & Synthesis Service
 * Unified search across agents, tasks, memories with AI-powered synthesis
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ServiceLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Type Definitions
// ============================================================================

interface SearchResult {
  id: string;
  type: 'agent' | 'task' | 'memory' | 'event' | 'dashboard';
  title: string;
  content: string;
  relevance_score: number;
  metadata: Record<string, unknown>;
  highlights: string[];
}

interface SynthesisResult {
  summary: string;
  key_insights: string[];
  related_topics: string[];
  suggested_actions: string[];
  confidence_score: number;
}

interface SearchRequest {
  action: 'search' | 'synthesize' | 'related' | 'trending';
  user_id: string;
  query?: string;
  search_types?: ('agent' | 'task' | 'memory' | 'event' | 'dashboard')[];
  filters?: {
    date_range?: { start: string; end: string };
    status?: string[];
    sector?: string[];
    importance_min?: number;
  };
  limit?: number;
  synthesize?: boolean;
  org_id?: string;
}

// ============================================================================
// Search Operations
// ============================================================================

async function searchAll(
  supabase: SupabaseClient,
  request: SearchRequest,
  logger: ServiceLogger
): Promise<{ results: SearchResult[]; total: number }> {
  await logger.info('Executing unified search', { query: request.query });

  if (!request.query) {
    return { results: [], total: 0 };
  }

  const searchTypes = request.search_types ?? ['agent', 'task', 'memory', 'event'];
  const limit = request.limit ?? 20;
  const results: SearchResult[] = [];

  const queryLower = request.query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  // Search agents
  if (searchTypes.includes('agent')) {
    const { data: agents } = await supabase
      .from('sonic_agents')
      .select('*')
      .or(`name.ilike.%${request.query}%,sector.ilike.%${request.query}%,description.ilike.%${request.query}%`)
      .eq('user_id', request.user_id)
      .limit(Math.ceil(limit / searchTypes.length));

    for (const agent of agents ?? []) {
      const nameMatch = agent.name.toLowerCase().includes(queryLower) ? 0.8 : 0;
      const sectorMatch = (agent.sector ?? '').toLowerCase().includes(queryLower) ? 0.5 : 0;
      const descMatch = (agent.description ?? '').toLowerCase().includes(queryLower) ? 0.4 : 0;
      const relevance = Math.max(nameMatch, sectorMatch, descMatch) + (agent.success_rate ?? 0) * 0.2;

      results.push({
        id: agent.id,
        type: 'agent',
        title: agent.name,
        content: agent.description || `${agent.sector} agent with ${((agent.success_rate ?? 0) * 100).toFixed(0)}% success rate`,
        relevance_score: relevance,
        metadata: {
          sector: agent.sector,
          status: agent.status,
          success_rate: agent.success_rate,
        },
        highlights: highlightTerms(agent.name + ' ' + (agent.sector ?? '') + ' ' + (agent.description ?? ''), queryTerms),
      });
    }
  }

  // Search tasks (using agent_task_queue table)
  if (searchTypes.includes('task')) {
    const { data: tasks } = await supabase
      .from('agent_task_queue')
      .select('*')
      .or(`task_title.ilike.%${request.query}%,task_description.ilike.%${request.query}%,task_type.ilike.%${request.query}%`)
      .eq('user_id', request.user_id)
      .limit(Math.ceil(limit / searchTypes.length));

    for (const task of tasks ?? []) {
      const titleMatch = (task.task_title ?? '').toLowerCase().includes(queryLower) ? 0.8 : 0;
      const descMatch = (task.task_description ?? '').toLowerCase().includes(queryLower) ? 0.7 : 0;
      const typeMatch = (task.task_type ?? '').toLowerCase().includes(queryLower) ? 0.6 : 0;
      const relevance = Math.max(titleMatch, descMatch, typeMatch);

      results.push({
        id: task.id,
        type: 'task',
        title: task.task_title ?? task.task_type ?? 'Task',
        content: task.task_description ?? 'No description',
        relevance_score: relevance,
        metadata: {
          status: task.status,
          priority: task.task_priority,
          progress: task.progress,
          created_at: task.created_at,
        },
        highlights: highlightTerms((task.task_title ?? '') + ' ' + (task.task_description ?? ''), queryTerms),
      });
    }
  }

  // Search memories
  if (searchTypes.includes('memory')) {
    const { data: memories } = await supabase
      .from('agent_memory')
      .select('*')
      .ilike('content', `%${request.query}%`)
      .eq('user_id', request.user_id)
      .limit(Math.ceil(limit / searchTypes.length));

    for (const memory of memories ?? []) {
      results.push({
        id: memory.id,
        type: 'memory',
        title: `${memory.memory_type} memory`,
        content: memory.content.substring(0, 200),
        relevance_score: memory.importance_score ?? 0.5,
        metadata: {
          agent_id: memory.agent_id,
          memory_type: memory.memory_type,
          importance: memory.importance_score,
        },
        highlights: highlightTerms(memory.content, queryTerms),
      });
    }
  }

  // Search events
  if (searchTypes.includes('event')) {
    const { data: events } = await supabase
      .from('agent_learning_events')
      .select('*')
      .ilike('event_type', `%${request.query}%`)
      .limit(Math.ceil(limit / searchTypes.length));

    for (const event of events ?? []) {
      results.push({
        id: event.id,
        type: 'event',
        title: event.event_type.replace(/_/g, ' '),
        content: JSON.stringify(event.event_data).substring(0, 200),
        relevance_score: event.impact_score ?? 0.5,
        metadata: {
          agent_id: event.agent_id,
          impact_score: event.impact_score,
          created_at: event.created_at,
        },
        highlights: [],
      });
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  return {
    results: results.slice(0, limit),
    total: results.length,
  };
}

function highlightTerms(text: string, terms: string[]): string[] {
  const highlights: string[] = [];
  const sentences = text.split(/[.!?]+/);

  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase();
    if (terms.some(term => sentenceLower.includes(term))) {
      highlights.push(sentence.trim());
    }
  }

  return highlights.slice(0, 3);
}

async function synthesizeResults(
  supabase: SupabaseClient,
  results: SearchResult[],
  query: string,
  logger: ServiceLogger
): Promise<SynthesisResult> {
  await logger.info('Synthesizing search results', { result_count: results.length });

  if (results.length === 0) {
    return {
      summary: 'No results found for your query.',
      key_insights: [],
      related_topics: [],
      suggested_actions: ['Try different search terms', 'Broaden your search criteria'],
      confidence_score: 0,
    };
  }

  // Analyze result patterns
  const typeDistribution: Record<string, number> = {};
  const contentSnippets: string[] = [];

  for (const result of results) {
    typeDistribution[result.type] = (typeDistribution[result.type] || 0) + 1;
    contentSnippets.push(result.content.substring(0, 100));
  }

  const dominantType = Object.entries(typeDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'mixed';

  const avgRelevance = results.reduce((sum, r) => sum + r.relevance_score, 0) / results.length;

  // Generate synthesis using AI if available
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (apiKey && results.length >= 3) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a search synthesis AI. Analyze search results and provide a concise summary with key insights. Be specific and actionable. Format your response as: Summary on line 1, then "Key Insights:" followed by bullet points, then "Related Topics:" with bullet points, then "Suggested Actions:" with bullet points.',
            },
            {
              role: 'user',
              content: `Query: "${query}"\n\nSearch Results:\n${results.map(r => `- [${r.type}] ${r.title}: ${r.content}`).join('\n')}\n\nProvide a synthesis with: 1) Brief summary, 2) 3 key insights, 3) Related topics to explore, 4) Suggested actions.`,
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content ?? '';

        // Parse AI response
        const lines = aiResponse.split('\n').filter((l: string) => l.trim());
        const summary = lines[0] ?? `Found ${results.length} results related to "${query}"`;
        
        return {
          summary,
          key_insights: extractListItems(aiResponse, 'insight'),
          related_topics: extractListItems(aiResponse, 'topic'),
          suggested_actions: extractListItems(aiResponse, 'action'),
          confidence_score: avgRelevance,
        };
      }
    } catch (error) {
      await logger.warn('AI synthesis failed, using fallback', { error: String(error) });
    }
  }

  // Fallback synthesis
  return {
    summary: `Found ${results.length} ${dominantType} results related to "${query}". Average relevance: ${(avgRelevance * 100).toFixed(0)}%.`,
    key_insights: [
      `Most results are ${dominantType} type`,
      `Top result: ${results[0]?.title ?? 'N/A'}`,
      results.length > 5 ? 'Consider narrowing your search' : 'Good focused result set',
    ],
    related_topics: Object.keys(typeDistribution),
    suggested_actions: [
      'Review top results for detailed information',
      'Use filters to refine results',
      'Explore related topics',
    ],
    confidence_score: avgRelevance,
  };
}

function extractListItems(text: string, _type: string): string[] {
  const items: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
      items.push(trimmed.replace(/^[-•\d.)\s]+/, '').trim());
    }
  }

  return items.slice(0, 4);
}

async function getRelatedContent(
  supabase: SupabaseClient,
  request: SearchRequest,
  logger: ServiceLogger
): Promise<SearchResult[]> {
  await logger.info('Finding related content', { query: request.query });

  // Get base results
  const { results } = await searchAll(supabase, { ...request, limit: 5 }, logger);

  if (results.length === 0) {
    return [];
  }

  // Find related based on metadata
  const sectors = [...new Set(results.map(r => r.metadata.sector as string).filter(Boolean))];

  const related: SearchResult[] = [];

  // Find items in same sectors
  for (const sector of sectors.slice(0, 2)) {
    const { data: agents } = await supabase
      .from('sonic_agents')
      .select('*')
      .eq('sector', sector)
      .neq('id', results[0]?.id)
      .eq('user_id', request.user_id)
      .limit(3);

    for (const agent of agents ?? []) {
      related.push({
        id: agent.id,
        type: 'agent',
        title: agent.name,
        content: agent.description || `Related ${sector} agent`,
        relevance_score: 0.6,
        metadata: { sector: agent.sector, status: agent.status },
        highlights: [],
      });
    }
  }

  return related.slice(0, 10);
}

async function getTrending(
  supabase: SupabaseClient,
  userId: string,
  logger: ServiceLogger
): Promise<{
  trending_queries: string[];
  popular_agents: any[];
  active_topics: string[];
}> {
  await logger.info('Fetching trending content');

  // Get recent high-activity agents for this user
  const { data: agents } = await supabase
    .from('sonic_agents')
    .select('id, name, sector, total_tasks_completed, success_rate')
    .eq('user_id', userId)
    .order('total_tasks_completed', { ascending: false })
    .limit(5);

  // Get recent event types
  const { data: events } = await supabase
    .from('agent_learning_events')
    .select('event_type')
    .order('created_at', { ascending: false })
    .limit(50);

  const eventTypes: Record<string, number> = {};
  for (const event of events ?? []) {
    eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
  }

  const activeTopics = Object.entries(eventTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type]) => type.replace(/_/g, ' '));

  return {
    trending_queries: [
      'agent performance',
      'task optimization',
      'learning velocity',
      'success rate analysis',
      'sector comparison',
    ],
    popular_agents: agents ?? [],
    active_topics: activeTopics.length > 0 ? activeTopics : ['agent learning', 'task completion', 'performance metrics'],
  };
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
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const request: SearchRequest = await req.json();

    if (!request.user_id) {
      throw new Error('user_id is required');
    }

    const logger = new ServiceLogger(
      supabase,
      requestId,
      request.user_id,
      request.org_id ?? null,
      'search-synthesis'
    );

    await logger.info(`Processing ${request.action} request`);

    let result: any;

    switch (request.action) {
      case 'search':
        const searchResults = await searchAll(supabase, request, logger);
        
        if (request.synthesize && searchResults.results.length > 0) {
          const synthesis = await synthesizeResults(supabase, searchResults.results, request.query ?? '', logger);
          result = { success: true, ...searchResults, synthesis };
        } else {
          result = { success: true, ...searchResults };
        }
        break;

      case 'synthesize':
        const toSynthesize = await searchAll(supabase, request, logger);
        const synthesis = await synthesizeResults(supabase, toSynthesize.results, request.query ?? '', logger);
        result = { success: true, synthesis };
        break;

      case 'related':
        const related = await getRelatedContent(supabase, request, logger);
        result = { success: true, related };
        break;

      case 'trending':
        const trending = await getTrending(supabase, request.user_id, logger);
        result = { success: true, ...trending };
        break;

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    const duration = Date.now() - startTime;
    await logger.info('search_synthesis_operation completed', { duration_ms: duration });

    return new Response(JSON.stringify({
      ...result,
      metadata: {
        request_id: requestId,
        service: 'search-synthesis',
        action: request.action,
        processing_time_ms: duration,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Search Synthesis] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'SEARCH_SYNTHESIS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: requestId,
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
