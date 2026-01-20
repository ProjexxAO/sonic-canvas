import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoveryResult {
  domain: string;
  title: string;
  summary: string;
  detailed_content: string;
  source_query: string;
  confidence_score: number;
  application_areas: string[];
}

const RESEARCH_DOMAINS = [
  { domain: 'mathematics', queries: [
    'breakthrough mathematical theorems 2024 2025',
    'new mathematical methods optimization algorithms',
    'advances in number theory cryptography',
    'machine learning mathematical foundations'
  ]},
  { domain: 'physics', queries: [
    'quantum computing breakthroughs applications',
    'condensed matter physics discoveries',
    'theoretical physics new models'
  ]},
  { domain: 'computer_science', queries: [
    'AI agent orchestration techniques',
    'distributed systems consensus algorithms',
    'natural language processing advances',
    'graph neural networks applications'
  ]},
  { domain: 'biology', queries: [
    'synthetic biology breakthroughs',
    'protein folding prediction advances',
    'CRISPR gene editing innovations'
  ]},
  { domain: 'materials_science', queries: [
    'new materials superconductors',
    'metamaterials applications',
    'sustainable materials innovations'
  ]},
  { domain: 'economics', queries: [
    'behavioral economics new models',
    'market prediction algorithms',
    'decentralized finance mechanisms'
  ]},
  { domain: 'cognitive_science', queries: [
    'human-AI collaboration research',
    'decision making cognitive models',
    'attention and memory mechanisms'
  ]}
];

async function searchWithPerplexity(query: string, perplexityKey: string): Promise<string> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant focused on discovering actionable knowledge that can enhance AI agent systems. Focus on practical applications, novel algorithms, and breakthrough methodologies.'
        },
        {
          role: 'user',
          content: `Research and summarize the latest findings on: ${query}. Focus on actionable insights that could be applied to AI agent orchestration, automation, or decision-making systems.`
        }
      ],
      max_tokens: 1500,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function synthesizeDiscovery(
  domain: string,
  rawContent: string,
  query: string,
  lovableApiKey: string
): Promise<DiscoveryResult | null> {
  const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
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
          content: `You are an expert at extracting actionable knowledge from research findings. Your goal is to identify discoveries that can be applied to:
1. AI Agent enhancement (new capabilities, behaviors, or algorithms)
2. Orchestration improvements (better coordination, handoffs, or task allocation)
3. Decision-making optimization (new heuristics, models, or frameworks)
4. System architecture patterns (novel designs or integrations)

Output ONLY valid JSON with no markdown.`
        },
        {
          role: 'user',
          content: `Analyze this research content and extract the most valuable discovery:

Domain: ${domain}
Query: ${query}
Content: ${rawContent}

Return JSON:
{
  "title": "concise title of the discovery",
  "summary": "2-3 sentence summary of the key finding",
  "detailed_content": "full explanation with practical applications",
  "confidence_score": 0.0-1.0,
  "application_areas": ["agent_enhancement", "orchestration", "decision_making", "architecture", "prompt_engineering", "data_processing"]
}

If no actionable discovery found, return {"skip": true}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.error('Synthesis API error:', response.status);
    return null;
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  
  try {
    const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
    if (parsed.skip) return null;
    
    return {
      domain,
      title: parsed.title,
      summary: parsed.summary,
      detailed_content: parsed.detailed_content,
      source_query: query,
      confidence_score: parsed.confidence_score || 0.7,
      application_areas: parsed.application_areas || []
    };
  } catch (e) {
    console.error('Failed to parse synthesis result:', e);
    return null;
  }
}

async function applyDiscoveryToSystem(
  supabase: any,
  discovery: DiscoveryResult,
  lovableApiKey: string
): Promise<{ applied: boolean; applied_to: string[] }> {
  const appliedTo: string[] = [];
  
  // Check if discovery can enhance agent prompts or behaviors
  if (discovery.application_areas.includes('agent_enhancement') || 
      discovery.application_areas.includes('prompt_engineering')) {
    
    // Generate enhancement suggestions for agents
    const enhancementResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
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
            content: 'You generate practical agent capability enhancements based on research discoveries. Output JSON only.'
          },
          {
            role: 'user',
            content: `Based on this discovery, suggest agent capability enhancements:
Discovery: ${discovery.title}
Details: ${discovery.detailed_content}

Return JSON array of capabilities:
[{"capability_name": "name", "capability_type": "reasoning|analysis|generation|orchestration", "description": "how to apply this", "trigger_conditions": {"domain": "relevant_domain"}}]`
          }
        ],
        max_tokens: 1000,
        temperature: 0.4,
      }),
    });

    if (enhancementResponse.ok) {
      const enhData = await enhancementResponse.json();
      const capabilities = JSON.parse(enhData.choices[0]?.message?.content?.replace(/```json\n?|\n?```/g, '').trim() || '[]');
      
      if (capabilities.length > 0) {
        appliedTo.push('agent_capabilities_suggestions');
        
        // Store as knowledge for Atlas to use
        await supabase.from('csuite_knowledge').insert({
          user_id: '00000000-0000-0000-0000-000000000000', // System knowledge
          title: `Agent Enhancement: ${discovery.title}`,
          content: JSON.stringify(capabilities),
          source: 'knowledge_discovery',
          type: 'agent_enhancement',
          category: discovery.domain,
          metadata: {
            discovery_id: discovery.title,
            application_areas: discovery.application_areas,
            auto_generated: true
          }
        });
      }
    }
  }

  // If discovery relates to orchestration, update workflow suggestions
  if (discovery.application_areas.includes('orchestration')) {
    appliedTo.push('orchestration_patterns');
  }

  // If discovery relates to decision making, add to reasoning library
  if (discovery.application_areas.includes('decision_making')) {
    appliedTo.push('decision_frameworks');
  }

  return {
    applied: appliedTo.length > 0,
    applied_to: appliedTo
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, domain, limit = 3 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'discover') {
      if (!perplexityKey) {
        return new Response(
          JSON.stringify({ error: 'Perplexity API key not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const discoveries: DiscoveryResult[] = [];
      const domainsToSearch = domain 
        ? RESEARCH_DOMAINS.filter(d => d.domain === domain)
        : RESEARCH_DOMAINS.slice(0, 3); // Limit domains per run

      for (const domainConfig of domainsToSearch) {
        const query = domainConfig.queries[Math.floor(Math.random() * domainConfig.queries.length)];
        
        try {
          console.log(`Researching: ${domainConfig.domain} - ${query}`);
          
          const rawContent = await searchWithPerplexity(query, perplexityKey);
          const discovery = await synthesizeDiscovery(domainConfig.domain, rawContent, query, lovableApiKey);
          
          if (discovery) {
            // Check for duplicates
            const { data: existing } = await supabase
              .from('knowledge_discoveries')
              .select('id')
              .ilike('title', `%${discovery.title.substring(0, 30)}%`)
              .limit(1);

            if (!existing || existing.length === 0) {
              // Apply discovery to system
              const application = await applyDiscoveryToSystem(supabase, discovery, lovableApiKey);
              
              // Store discovery
              const { data: inserted, error } = await supabase
                .from('knowledge_discoveries')
                .insert({
                  ...discovery,
                  is_applied: application.applied,
                  applied_to: application.applied_to,
                  applied_at: application.applied ? new Date().toISOString() : null,
                  metadata: { auto_discovered: true }
                })
                .select()
                .single();

              if (!error && inserted) {
                discoveries.push(discovery);
              }
            }
          }
        } catch (err) {
          console.error(`Error researching ${domainConfig.domain}:`, err);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          discoveries_count: discoveries.length,
          discoveries 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_recent') {
      const { data: discoveries, error } = await supabase
        .from('knowledge_discoveries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return new Response(
        JSON.stringify({ discoveries: discoveries || [], error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_applicable') {
      // Get discoveries that can enhance specific areas
      const { data: discoveries, error } = await supabase
        .from('knowledge_discoveries')
        .select('*')
        .eq('is_applied', false)
        .gte('confidence_score', 0.7)
        .order('confidence_score', { ascending: false })
        .limit(limit);

      return new Response(
        JSON.stringify({ discoveries: discoveries || [], error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Knowledge discovery error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
