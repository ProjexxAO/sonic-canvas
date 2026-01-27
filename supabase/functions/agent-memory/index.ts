/**
 * Sonic Agent Memory Service
 * Persistent memory management for individual agents with semantic search
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

interface MemoryEntry {
  id?: string;
  agent_id: string;
  user_id: string | null;
  memory_type: 'experience' | 'skill' | 'preference' | 'relationship' | 'insight' | 'feedback';
  content: string;
  importance_score: number;
  context: Record<string, unknown>;
  embedding_vector?: number[];
  created_at?: string;
  expires_at?: string | null;
}

interface MemoryRequest {
  action: 'store' | 'retrieve' | 'search' | 'consolidate' | 'forget' | 'reflect';
  agent_id: string;
  user_id?: string;
  memory_type?: string;
  content?: string;
  query?: string;
  importance_threshold?: number;
  limit?: number;
  context?: Record<string, unknown>;
  time_range?: { start: string; end: string };
}

interface ReflectionResult {
  patterns: string[];
  strengths: string[];
  growth_areas: string[];
  key_learnings: string[];
  suggested_actions: string[];
}

// ============================================================================
// Utility Functions
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    // Return mock embedding if no API key
    return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  }
}

// ============================================================================
// Memory Operations
// ============================================================================

async function storeMemory(
  supabase: SupabaseClient,
  request: MemoryRequest,
  logger: ServiceLogger
): Promise<{ success: boolean; memory_id?: string; error?: string }> {
  await logger.info('Storing agent memory', { agent_id: request.agent_id, type: request.memory_type });

  if (!request.content) {
    return { success: false, error: 'Content is required for storing memory' };
  }

  const embedding = await generateEmbedding(request.content);

  const memoryEntry: MemoryEntry = {
    agent_id: request.agent_id,
    user_id: request.user_id ?? null,
    memory_type: (request.memory_type as MemoryEntry['memory_type']) || 'experience',
    content: request.content,
    importance_score: clamp(request.importance_threshold ?? 0.5, 0, 1),
    context: request.context ?? {},
    embedding_vector: embedding,
  };

  const { data, error } = await supabase
    .from('agent_memory')
    .insert(memoryEntry)
    .select('id')
    .single();

  if (error) {
    await logger.error('Failed to store memory', { error: error.message });
    return { success: false, error: error.message };
  }

  await logger.info('Memory stored successfully', { memory_id: data.id });
  return { success: true, memory_id: data.id };
}

async function retrieveMemories(
  supabase: SupabaseClient,
  request: MemoryRequest,
  logger: ServiceLogger
): Promise<{ success: boolean; memories?: MemoryEntry[]; error?: string }> {
  await logger.info('Retrieving agent memories', { agent_id: request.agent_id });

  let query = supabase
    .from('agent_memory')
    .select('*')
    .eq('agent_id', request.agent_id)
    .order('created_at', { ascending: false })
    .limit(request.limit ?? 50);

  if (request.memory_type) {
    query = query.eq('memory_type', request.memory_type);
  }

  if (request.importance_threshold) {
    query = query.gte('importance_score', request.importance_threshold);
  }

  if (request.time_range) {
    query = query.gte('created_at', request.time_range.start).lte('created_at', request.time_range.end);
  }

  const { data, error } = await query;

  if (error) {
    await logger.error('Failed to retrieve memories', { error: error.message });
    return { success: false, error: error.message };
  }

  return { success: true, memories: data ?? [] };
}

async function searchMemories(
  supabase: SupabaseClient,
  request: MemoryRequest,
  logger: ServiceLogger
): Promise<{ success: boolean; memories?: MemoryEntry[]; error?: string }> {
  await logger.info('Searching agent memories', { agent_id: request.agent_id, query: request.query });

  if (!request.query) {
    return { success: false, error: 'Query is required for semantic search' };
  }

  const queryEmbedding = await generateEmbedding(request.query);

  const { data, error } = await supabase.rpc('match_agent_memories', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: request.limit ?? 20,
    filter_agent_id: request.agent_id,
  });

  if (error) {
    // Fallback to text search if semantic search fails
    const { data: textData, error: textError } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('agent_id', request.agent_id)
      .ilike('content', `%${request.query}%`)
      .limit(request.limit ?? 20);

    if (textError) {
      await logger.error('Failed to search memories', { error: textError.message });
      return { success: false, error: textError.message };
    }

    return { success: true, memories: textData ?? [] };
  }

  return { success: true, memories: data ?? [] };
}

async function consolidateMemories(
  supabase: SupabaseClient,
  request: MemoryRequest,
  logger: ServiceLogger
): Promise<{ success: boolean; consolidated_count?: number; error?: string }> {
  await logger.info('Consolidating agent memories', { agent_id: request.agent_id });

  // Get all memories for the agent
  const { data: memories, error: fetchError } = await supabase
    .from('agent_memory')
    .select('*')
    .eq('agent_id', request.agent_id)
    .lt('importance_score', 0.3)
    .order('created_at', { ascending: true });

  if (fetchError || !memories?.length) {
    return { success: true, consolidated_count: 0 };
  }

  // Group similar memories and consolidate
  const typeGroups: Record<string, MemoryEntry[]> = {};
  for (const memory of memories) {
    const type = memory.memory_type;
    if (!typeGroups[type]) typeGroups[type] = [];
    typeGroups[type].push(memory);
  }

  let consolidatedCount = 0;
  const idsToDelete: string[] = [];

  for (const [type, groupMemories] of Object.entries(typeGroups)) {
    if (groupMemories.length >= 5) {
      // Create consolidated memory
      const consolidatedContent = groupMemories
        .map(m => m.content)
        .join(' | ');

      const avgImportance = groupMemories.reduce((sum, m) => sum + m.importance_score, 0) / groupMemories.length;

      await supabase.from('agent_memory').insert({
        agent_id: request.agent_id,
        user_id: request.user_id ?? null,
        memory_type: type,
        content: `[CONSOLIDATED] ${consolidatedContent.substring(0, 1000)}`,
        importance_score: Math.min(avgImportance + 0.2, 1),
        context: { consolidated: true, source_count: groupMemories.length },
      });

      idsToDelete.push(...groupMemories.map(m => m.id).filter((id): id is string => id !== undefined));
      consolidatedCount += groupMemories.length;
    }
  }

  // Delete old memories
  if (idsToDelete.length > 0) {
    await supabase.from('agent_memory').delete().in('id', idsToDelete);
  }

  await logger.info('Memory consolidation complete', { consolidated_count: consolidatedCount });
  return { success: true, consolidated_count: consolidatedCount };
}

async function forgetMemories(
  supabase: SupabaseClient,
  request: MemoryRequest,
  logger: ServiceLogger
): Promise<{ success: boolean; forgotten_count?: number; error?: string }> {
  await logger.info('Forgetting low-value memories', { agent_id: request.agent_id });

  const threshold = request.importance_threshold ?? 0.1;

  const { data, error } = await supabase
    .from('agent_memory')
    .delete()
    .eq('agent_id', request.agent_id)
    .lt('importance_score', threshold)
    .select('id');

  if (error) {
    await logger.error('Failed to forget memories', { error: error.message });
    return { success: false, error: error.message };
  }

  return { success: true, forgotten_count: data?.length ?? 0 };
}

async function reflectOnMemories(
  supabase: SupabaseClient,
  request: MemoryRequest,
  logger: ServiceLogger
): Promise<{ success: boolean; reflection?: ReflectionResult; error?: string }> {
  await logger.info('Generating memory reflection', { agent_id: request.agent_id });

  // Get high-importance memories
  const { data: memories, error } = await supabase
    .from('agent_memory')
    .select('*')
    .eq('agent_id', request.agent_id)
    .gte('importance_score', 0.5)
    .order('importance_score', { ascending: false })
    .limit(50);

  if (error || !memories?.length) {
    return {
      success: true,
      reflection: {
        patterns: ['Insufficient data for pattern analysis'],
        strengths: ['Building experience base'],
        growth_areas: ['Continue gathering experiences'],
        key_learnings: [],
        suggested_actions: ['Engage in more tasks to build memory'],
      },
    };
  }

  // Analyze memory patterns
  const typeDistribution: Record<string, number> = {};
  const contentThemes: string[] = [];

  for (const memory of memories) {
    typeDistribution[memory.memory_type] = (typeDistribution[memory.memory_type] || 0) + 1;
    if (memory.content.length > 50) {
      contentThemes.push(memory.content.substring(0, 100));
    }
  }

  const dominantType = Object.entries(typeDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'experience';

  const reflection: ReflectionResult = {
    patterns: [
      `Primary memory type: ${dominantType}`,
      `Total significant memories: ${memories.length}`,
      `Memory distribution: ${Object.entries(typeDistribution).map(([k, v]) => `${k}(${v})`).join(', ')}`,
    ],
    strengths: [
      memories.some(m => m.memory_type === 'skill') ? 'Skill acquisition active' : 'Building skill base',
      memories.some(m => m.memory_type === 'insight') ? 'Generating insights' : 'Developing analytical capacity',
    ],
    growth_areas: [
      !memories.some(m => m.memory_type === 'relationship') ? 'Build more collaborative relationships' : null,
      memories.length < 20 ? 'Accumulate more experiences' : null,
    ].filter(Boolean) as string[],
    key_learnings: contentThemes.slice(0, 5),
    suggested_actions: [
      'Continue current learning trajectory',
      'Seek diverse task types for broader skill development',
      'Engage in collaborative tasks to build relationships',
    ],
  };

  // Store reflection as a new memory
  await supabase.from('agent_memory').insert({
    agent_id: request.agent_id,
    user_id: request.user_id ?? null,
    memory_type: 'insight',
    content: `[REFLECTION] Patterns: ${reflection.patterns.join('; ')}. Key strengths: ${reflection.strengths.join('; ')}.`,
    importance_score: 0.8,
    context: { reflection: true, timestamp: new Date().toISOString() },
  });

  return { success: true, reflection };
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
    const request: MemoryRequest = await req.json();

    const logger = new ServiceLogger(
      supabase,
      requestId,
      request.user_id ?? null,
      null,
      'agent-memory'
    );

    await logger.info(`Processing ${request.action} request`, { agent_id: request.agent_id });

    let result: any;

    switch (request.action) {
      case 'store':
        result = await storeMemory(supabase, request, logger);
        break;
      case 'retrieve':
        result = await retrieveMemories(supabase, request, logger);
        break;
      case 'search':
        result = await searchMemories(supabase, request, logger);
        break;
      case 'consolidate':
        result = await consolidateMemories(supabase, request, logger);
        break;
      case 'forget':
        result = await forgetMemories(supabase, request, logger);
        break;
      case 'reflect':
        result = await reflectOnMemories(supabase, request, logger);
        break;
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    const duration = Date.now() - startTime;
    await logger.info('Operation completed', { action: request.action, duration_ms: duration });

    return new Response(JSON.stringify({
      ...result,
      metadata: {
        request_id: requestId,
        service: 'agent-memory',
        action: request.action,
        processing_time_ms: duration,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Agent Memory] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'AGENT_MEMORY_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: requestId,
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
