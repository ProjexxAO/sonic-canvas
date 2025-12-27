import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersonaConfig {
  name: string;
  focus: string[];
  tone: string;
  priorities: string[];
}

interface ReportOptions {
  depth: 'brief' | 'standard' | 'detailed';
  focusAreas: string[];
}

const DEPTH_CONFIGS = {
  brief: {
    maxItems: 5,
    structure: `Generate a very brief executive summary with:
1. Key Takeaway (1-2 sentences)
2. Top 3 Highlights (bullet points only)`,
  },
  standard: {
    maxItems: 10,
    structure: `Generate a concise executive briefing with:
1. Executive Summary (2-3 sentences)
2. Key Highlights (3-5 bullet points)
3. Action Items (if applicable)
4. Risks & Opportunities (if applicable)`,
  },
  detailed: {
    maxItems: 20,
    structure: `Generate a comprehensive executive briefing with:
1. Executive Summary (3-4 sentences with context)
2. Detailed Analysis by Domain
3. Key Highlights (5-8 bullet points with data references)
4. Action Items (prioritized list with owners if mentioned)
5. Risks & Opportunities (detailed assessment)
6. Recommendations (3-5 strategic suggestions)
7. Next Steps & Follow-ups`,
  },
};

const PERSONA_CONFIGS: Record<string, PersonaConfig> = {
  ceo: {
    name: 'CEO',
    focus: ['strategic_overview', 'key_decisions', 'market_position', 'stakeholder_concerns'],
    tone: 'executive, decisive, forward-looking',
    priorities: ['growth opportunities', 'major risks', 'competitive landscape', 'organizational health'],
  },
  cfo: {
    name: 'CFO',
    focus: ['financial_health', 'cash_flow', 'forecasts', 'compliance'],
    tone: 'analytical, precise, risk-aware',
    priorities: ['revenue trends', 'expense management', 'investment decisions', 'financial risks'],
  },
  coo: {
    name: 'COO',
    focus: ['operations_efficiency', 'process_optimization', 'team_performance', 'resource_allocation'],
    tone: 'operational, detail-oriented, solution-focused',
    priorities: ['bottlenecks', 'capacity planning', 'quality metrics', 'delivery timelines'],
  },
  chief_of_staff: {
    name: 'Chief of Staff',
    focus: ['cross_functional', 'executive_priorities', 'organizational_alignment', 'action_items'],
    tone: 'comprehensive, balanced, action-oriented',
    priorities: ['coordination needs', 'upcoming decisions', 'stakeholder updates', 'follow-up items'],
  },
  cto: {
    name: 'CTO',
    focus: ['technology_strategy', 'innovation', 'technical_debt', 'infrastructure'],
    tone: 'technical, strategic, innovation-focused',
    priorities: ['technology roadmap', 'security posture', 'scalability', 'emerging technologies'],
  },
  ciso: {
    name: 'CISO',
    focus: ['security_posture', 'risk_assessment', 'compliance', 'incident_response'],
    tone: 'security-focused, risk-aware, compliance-driven',
    priorities: ['vulnerabilities', 'threat landscape', 'audit readiness', 'security investments'],
  },
  chro: {
    name: 'CHRO',
    focus: ['workforce_analytics', 'culture', 'talent_acquisition', 'retention'],
    tone: 'people-centric, strategic, empathetic',
    priorities: ['employee engagement', 'diversity metrics', 'skills gaps', 'succession planning'],
  },
  chief_people: {
    name: 'Chief People Officer',
    focus: ['employee_engagement', 'talent_development', 'organizational_culture', 'wellbeing'],
    tone: 'empathetic, developmental, culture-focused',
    priorities: ['team morale', 'learning initiatives', 'workplace experience', 'leadership development'],
  },
  cmo: {
    name: 'CMO',
    focus: ['marketing_performance', 'brand_health', 'customer_insights', 'campaigns'],
    tone: 'creative, data-driven, customer-focused',
    priorities: ['brand awareness', 'lead generation', 'customer acquisition', 'market trends'],
  },
  cro: {
    name: 'CRO',
    focus: ['revenue_growth', 'pipeline', 'sales_performance', 'customer_success'],
    tone: 'results-oriented, growth-focused, metric-driven',
    priorities: ['revenue targets', 'conversion rates', 'customer retention', 'expansion opportunities'],
  },
  clo: {
    name: 'CLO',
    focus: ['legal_matters', 'contracts', 'intellectual_property', 'litigation'],
    tone: 'precise, risk-aware, compliance-focused',
    priorities: ['legal risks', 'contract obligations', 'regulatory changes', 'dispute resolution'],
  },
  cco: {
    name: 'CCO',
    focus: ['compliance', 'regulatory', 'ethics', 'governance'],
    tone: 'thorough, regulatory-focused, governance-oriented',
    priorities: ['compliance gaps', 'regulatory updates', 'policy adherence', 'audit findings'],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { persona, userId, options } = await req.json();

    if (!persona || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing persona or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const personaConfig = PERSONA_CONFIGS[persona];
    if (!personaConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid persona' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Merge default config with custom options
    const reportOptions: ReportOptions = {
      depth: options?.depth || 'standard',
      focusAreas: options?.focusAreas?.length ? options.focusAreas : personaConfig.focus,
    };

    const depthConfig = DEPTH_CONFIGS[reportOptions.depth];

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch recent data from all domains with depth-based limits
    const limit = depthConfig.maxItems;
    const [comms, docs, events, financials, tasks, knowledge] = await Promise.all([
      supabase.from('csuite_communications').select('subject, content, sent_at').eq('user_id', userId).order('sent_at', { ascending: false }).limit(limit),
      supabase.from('csuite_documents').select('title, content, type').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
      supabase.from('csuite_events').select('title, description, start_at, end_at').eq('user_id', userId).order('start_at', { ascending: false }).limit(limit),
      supabase.from('csuite_financials').select('title, amount, type, status, transaction_date').eq('user_id', userId).order('transaction_date', { ascending: false }).limit(limit),
      supabase.from('csuite_tasks').select('title, description, priority, status, due_date').eq('user_id', userId).order('due_date', { ascending: true }).limit(limit),
      supabase.from('csuite_knowledge').select('title, content, category').eq('user_id', userId).order('created_at', { ascending: false }).limit(Math.ceil(limit / 2)),
    ]);

    // Build context string
    const contextParts: string[] = [];

    if (comms.data?.length) {
      contextParts.push(`COMMUNICATIONS:\n${comms.data.map(c => `- ${c.subject || 'No subject'}: ${(c.content || '').slice(0, 200)}`).join('\n')}`);
    }
    if (docs.data?.length) {
      contextParts.push(`DOCUMENTS:\n${docs.data.map(d => `- [${d.type}] ${d.title}: ${(d.content || '').slice(0, 200)}`).join('\n')}`);
    }
    if (events.data?.length) {
      contextParts.push(`EVENTS:\n${events.data.map(e => `- ${e.title} (${e.start_at}): ${e.description || ''}`).join('\n')}`);
    }
    if (financials.data?.length) {
      contextParts.push(`FINANCIALS:\n${financials.data.map(f => `- [${f.type}] ${f.title}: $${f.amount} (${f.status})`).join('\n')}`);
    }
    if (tasks.data?.length) {
      contextParts.push(`TASKS:\n${tasks.data.map(t => `- [${t.priority}/${t.status}] ${t.title}: ${t.description || ''}`).join('\n')}`);
    }
    if (knowledge.data?.length) {
      contextParts.push(`KNOWLEDGE BASE:\n${knowledge.data.map(k => `- [${k.category}] ${k.title}: ${(k.content || '').slice(0, 200)}`).join('\n')}`);
    }

    const context = contextParts.join('\n\n');

    if (!context.trim()) {
      // No data available, return placeholder report
      const placeholderReport = {
        id: crypto.randomUUID(),
        persona,
        type: 'briefing',
        title: `${personaConfig.name} Briefing - ${new Date().toLocaleDateString()}`,
        content: `No data available yet. Please connect data sources or upload documents to generate insights.`,
        generatedAt: new Date().toISOString(),
      };

      return new Response(
        JSON.stringify(placeholderReport),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build focus areas string from custom selection
    const focusAreasFormatted = reportOptions.focusAreas.map(a => a.replace(/_/g, ' ')).join(', ');

    // Generate report using Lovable AI
    const systemPrompt = `You are an executive briefing generator for a ${personaConfig.name}. 
Your focus areas are: ${focusAreasFormatted}.
Your tone should be: ${personaConfig.tone}.
Prioritize insights about: ${personaConfig.priorities.join(', ')}.

${depthConfig.structure}

Be specific and reference actual data points when available.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a ${personaConfig.name} briefing based on this organizational data:\n\n${context}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      throw new Error('Failed to generate report');
    }

    const aiData = await aiResponse.json();
    const reportContent = aiData.choices?.[0]?.message?.content || 'Failed to generate report content.';

    // Save report to database
    const { data: savedReport, error: saveError } = await supabase
      .from('csuite_reports')
      .insert({
        user_id: userId,
        persona,
        type: 'briefing',
        title: `${personaConfig.name} Briefing - ${new Date().toLocaleDateString()}`,
        content: reportContent,
        data_sources: ['communications', 'documents', 'events', 'financials', 'tasks', 'knowledge'].filter((_, i) => 
          [comms, docs, events, financials, tasks, knowledge][i].data?.length
        ),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      throw saveError;
    }

    console.log(`Generated ${persona} report for user ${userId}`);

    return new Response(
      JSON.stringify(savedReport),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
