import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, action } = await req.json();
    console.log(`Atlas orchestrator received action: ${action}, query: ${query}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'search') {
      // Generate embedding for the query
      const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: query,
        }),
      });

      if (!embeddingResponse.ok) {
        // Fallback to text search if embeddings not available
        console.log('Embedding not available, using text search fallback');
        const { data: agents, error } = await supabase
          .from('sonic_agents')
          .select('id, name, sector, description, capabilities, code_artifact')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(10);

        if (error) throw error;

        return new Response(JSON.stringify({ 
          agents: agents || [],
          searchMethod: 'text'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const embeddingData = await embeddingResponse.json();
      const queryEmbedding = embeddingData.data[0].embedding;

      // Search using vector similarity
      const { data: agents, error } = await supabase.rpc('search_agents_by_embedding', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 10,
      });

      if (error) {
        console.error('Vector search error:', error);
        throw error;
      }

      return new Response(JSON.stringify({ 
        agents: agents || [],
        searchMethod: 'semantic'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'web_search') {
      const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
      
      if (!perplexityKey) {
        return new Response(JSON.stringify({ 
          error: 'Web search not configured' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('[atlas-orchestrator] Performing web search:', query);

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
            { role: "user", content: query }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[atlas-orchestrator] Perplexity error:', errorText);
        throw new Error('Web search failed');
      }

      const data = await response.json();
      
      return new Response(JSON.stringify({ 
        answer: data.choices?.[0]?.message?.content || "No results found",
        citations: data.citations || [],
        searchMethod: 'web'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'synthesize') {
      const { agentIds, requirements } = await req.json();
      
      // Fetch the selected agents
      const { data: agents, error } = await supabase
        .from('sonic_agents')
        .select('*')
        .in('id', agentIds);

      if (error) throw error;

      // Use Lovable AI to synthesize a new agent
      const synthesisPrompt = `You are Atlas, an AI agent synthesizer. Based on the following agents and requirements, create a new synthesized agent.

Existing Agents:
${agents?.map(a => `- ${a.name} (${a.sector}): ${a.description || 'No description'}`).join('\n')}

User Requirements: ${requirements}

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
          'Authorization': `Bearer ${lovableApiKey}`,
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
        throw new Error('Failed to synthesize agent');
      }

      const aiData = await aiResponse.json();
      const synthesizedContent = aiData.choices[0].message.content;
      
      // Parse the JSON from the response
      let synthesizedAgent;
      try {
        const jsonMatch = synthesizedContent.match(/\{[\s\S]*\}/);
        synthesizedAgent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (e) {
        console.error('Failed to parse synthesized agent:', e);
        synthesizedAgent = null;
      }

      return new Response(JSON.stringify({ 
        synthesizedAgent,
        sourceAgents: agents 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Atlas orchestrator error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
