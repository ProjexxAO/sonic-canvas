import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VeracityEvaluation {
  statement: string;
  context?: string;
  veracity_score: number;
  confidence_level: 'low' | 'medium' | 'high' | 'very_high';
  plausibility_factors: PlausibilityFactor[];
  supporting_evidence: Evidence[];
  contradicting_evidence: Evidence[];
  knowledge_alignment_score: number;
  contextual_fit_score: number;
  source_reliability_score: number;
  citations: string[];
  evaluation_summary: string;
}

interface PlausibilityFactor {
  factor: string;
  score: number;
  explanation: string;
}

interface Evidence {
  source: string;
  content: string;
  relevance: number;
  type: 'supporting' | 'contradicting' | 'neutral';
}

interface KnowledgeMatch {
  id: string;
  title: string;
  summary: string;
  confidence_score: number;
  domain: string;
}

async function searchKnowledgeBase(
  supabase: any,
  statement: string
): Promise<KnowledgeMatch[]> {
  // Search existing knowledge discoveries for relevant information
  const keywords = statement
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 4)
    .slice(0, 5);

  if (keywords.length === 0) return [];

  const { data: discoveries } = await supabase
    .from('knowledge_discoveries')
    .select('id, title, summary, confidence_score, domain')
    .or(keywords.map(k => `title.ilike.%${k}%,summary.ilike.%${k}%`).join(','))
    .limit(5);

  return discoveries || [];
}

async function searchWebForVerification(
  statement: string,
  perplexityKey: string
): Promise<{ content: string; citations: string[] }> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: `You are a fact-checker and veracity evaluator. Your task is to:
1. Verify claims and statements against current, reliable sources
2. Identify supporting AND contradicting evidence
3. Assess the plausibility of statements based on established knowledge
4. Be objective and cite specific sources for your findings

Focus on factual accuracy, logical consistency, and source reliability.`
        },
        {
          role: 'user',
          content: `Evaluate the veracity of this statement and find evidence both supporting and contradicting it:

"${statement}"

Provide:
1. Evidence that supports this claim (with sources)
2. Evidence that contradicts this claim (with sources)
3. Assessment of how well this aligns with established knowledge
4. Any logical inconsistencies or red flags`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for factual accuracy
    }),
  });

  if (!response.ok) {
    console.error('Perplexity verification error:', response.status);
    return { content: '', citations: [] };
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    citations: data.citations || []
  };
}

async function synthesizeVeracityEvaluation(
  statement: string,
  context: string | undefined,
  webVerification: { content: string; citations: string[] },
  knowledgeMatches: KnowledgeMatch[],
  lovableApiKey: string
): Promise<VeracityEvaluation | null> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert veracity evaluator that synthesizes evidence to produce plausibility assessments. You evaluate statements on multiple dimensions:

1. **Knowledge Alignment**: How well does the statement align with established, verified knowledge?
2. **Contextual Fit**: Does the statement make sense within its given context?
3. **Source Reliability**: How reliable are the sources that support or contradict this?
4. **Logical Consistency**: Is the statement internally consistent and logically sound?
5. **Evidence Quality**: What is the quality and quantity of evidence?

Output ONLY valid JSON with no markdown code blocks.`
        },
        {
          role: 'user',
          content: `Evaluate the veracity of this statement:

STATEMENT: "${statement}"
${context ? `CONTEXT: "${context}"` : ''}

WEB VERIFICATION RESULTS:
${webVerification.content}

EXISTING KNOWLEDGE BASE MATCHES:
${knowledgeMatches.length > 0 
  ? knowledgeMatches.map(k => `- [${k.domain}] ${k.title}: ${k.summary} (confidence: ${k.confidence_score})`).join('\n')
  : 'No direct matches found in knowledge base.'
}

CITATIONS:
${webVerification.citations.join('\n')}

Return a JSON evaluation:
{
  "veracity_score": 0.0-1.0,
  "confidence_level": "low" | "medium" | "high" | "very_high",
  "plausibility_factors": [
    {"factor": "name", "score": 0.0-1.0, "explanation": "why"}
  ],
  "supporting_evidence": [
    {"source": "url or name", "content": "summary", "relevance": 0.0-1.0, "type": "supporting"}
  ],
  "contradicting_evidence": [
    {"source": "url or name", "content": "summary", "relevance": 0.0-1.0, "type": "contradicting"}
  ],
  "knowledge_alignment_score": 0.0-1.0,
  "contextual_fit_score": 0.0-1.0,
  "source_reliability_score": 0.0-1.0,
  "evaluation_summary": "brief paragraph explaining the overall assessment"
}`
        }
      ],
      max_tokens: 2500,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Synthesis API error:', response.status, errorText);
    return null;
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';

  try {
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanContent);
    
    return {
      statement,
      context,
      veracity_score: parsed.veracity_score || 0.5,
      confidence_level: parsed.confidence_level || 'medium',
      plausibility_factors: parsed.plausibility_factors || [],
      supporting_evidence: parsed.supporting_evidence || [],
      contradicting_evidence: parsed.contradicting_evidence || [],
      knowledge_alignment_score: parsed.knowledge_alignment_score || 0.5,
      contextual_fit_score: parsed.contextual_fit_score || 0.5,
      source_reliability_score: parsed.source_reliability_score || 0.5,
      citations: webVerification.citations,
      evaluation_summary: parsed.evaluation_summary || 'Unable to provide detailed assessment.',
    };
  } catch (e) {
    console.error('Failed to parse evaluation result:', e, content);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, statement, context, discovery_id, limit = 10 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === 'evaluate') {
      if (!statement) {
        return new Response(
          JSON.stringify({ error: 'Statement is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!perplexityKey) {
        return new Response(
          JSON.stringify({ error: 'Perplexity API key not configured for web verification' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Evaluating veracity: "${statement.substring(0, 100)}..."`);

      // Step 1: Search knowledge base for relevant existing knowledge
      const knowledgeMatches = await searchKnowledgeBase(supabase, statement);
      console.log(`Found ${knowledgeMatches.length} knowledge base matches`);

      // Step 2: Search web for verification evidence
      const webVerification = await searchWebForVerification(statement, perplexityKey);
      console.log(`Web verification complete with ${webVerification.citations.length} citations`);

      // Step 3: Synthesize all evidence into veracity evaluation
      const evaluation = await synthesizeVeracityEvaluation(
        statement,
        context,
        webVerification,
        knowledgeMatches,
        lovableApiKey
      );

      if (!evaluation) {
        return new Response(
          JSON.stringify({ error: 'Failed to synthesize evaluation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Step 4: Store evaluation
      const { data: stored, error: storeError } = await supabase
        .from('veracity_evaluations')
        .insert({
          statement: evaluation.statement,
          context: evaluation.context,
          veracity_score: evaluation.veracity_score,
          confidence_level: evaluation.confidence_level,
          plausibility_factors: evaluation.plausibility_factors,
          supporting_evidence: evaluation.supporting_evidence,
          contradicting_evidence: evaluation.contradicting_evidence,
          knowledge_alignment_score: evaluation.knowledge_alignment_score,
          contextual_fit_score: evaluation.contextual_fit_score,
          source_reliability_score: evaluation.source_reliability_score,
          citations: evaluation.citations,
          evaluation_summary: evaluation.evaluation_summary,
          related_discovery_id: discovery_id || null,
          metadata: { knowledge_matches: knowledgeMatches.length }
        })
        .select()
        .single();

      if (storeError) {
        console.error('Error storing evaluation:', storeError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          evaluation: {
            ...evaluation,
            id: stored?.id
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_recent') {
      const { data: evaluations, error } = await supabase
        .from('veracity_evaluations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      return new Response(
        JSON.stringify({ evaluations: evaluations || [], error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_by_discovery') {
      if (!discovery_id) {
        return new Response(
          JSON.stringify({ error: 'discovery_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: evaluations, error } = await supabase
        .from('veracity_evaluations')
        .select('*')
        .eq('related_discovery_id', discovery_id)
        .order('created_at', { ascending: false });

      return new Response(
        JSON.stringify({ evaluations: evaluations || [], error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_stats') {
      const { data: evaluations } = await supabase
        .from('veracity_evaluations')
        .select('veracity_score, confidence_level, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!evaluations || evaluations.length === 0) {
        return new Response(
          JSON.stringify({ 
            stats: { 
              total: 0, 
              avg_score: 0, 
              high_confidence: 0,
              distribution: { low: 0, medium: 0, high: 0, very_high: 0 }
            } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const avgScore = evaluations.reduce((acc, e) => acc + (e.veracity_score || 0), 0) / evaluations.length;
      const distribution = evaluations.reduce((acc: Record<string, number>, e) => {
        acc[e.confidence_level || 'medium'] = (acc[e.confidence_level || 'medium'] || 0) + 1;
        return acc;
      }, { low: 0, medium: 0, high: 0, very_high: 0 });

      return new Response(
        JSON.stringify({
          stats: {
            total: evaluations.length,
            avg_score: Math.round(avgScore * 100) / 100,
            high_confidence: distribution.high + distribution.very_high,
            distribution
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: evaluate, get_recent, get_by_discovery, or get_stats' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Veracity evaluator error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
