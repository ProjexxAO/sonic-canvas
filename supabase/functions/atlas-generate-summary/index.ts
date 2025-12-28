import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, requirements } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch data from all domains
    const limit = 15;
    const [comms, docs, events, financials, tasks, knowledge] = await Promise.all([
      supabase.from('csuite_communications').select('subject, content, sent_at, from_address').eq('user_id', userId).order('sent_at', { ascending: false }).limit(limit),
      supabase.from('csuite_documents').select('title, content, type, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
      supabase.from('csuite_events').select('title, description, start_at, end_at, location').eq('user_id', userId).order('start_at', { ascending: false }).limit(limit),
      supabase.from('csuite_financials').select('title, amount, type, status, transaction_date, category').eq('user_id', userId).order('transaction_date', { ascending: false }).limit(limit),
      supabase.from('csuite_tasks').select('title, description, priority, status, due_date, project').eq('user_id', userId).order('due_date', { ascending: true }).limit(limit),
      supabase.from('csuite_knowledge').select('title, content, category, tags').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit),
    ]);

    // Build context string with enhanced metadata
    const contextParts: string[] = [];
    const dataSources: string[] = [];

    if (comms.data?.length) {
      dataSources.push('communications');
      contextParts.push(`COMMUNICATIONS (${comms.data.length} items):\n${comms.data.map(c => 
        `- [${new Date(c.sent_at).toLocaleDateString()}] ${c.subject || 'No subject'} from ${c.from_address || 'unknown'}: ${(c.content || '').slice(0, 300)}`
      ).join('\n')}`);
    }
    if (docs.data?.length) {
      dataSources.push('documents');
      contextParts.push(`DOCUMENTS (${docs.data.length} items):\n${docs.data.map(d => 
        `- [${d.type}] ${d.title}: ${(d.content || '').slice(0, 300)}`
      ).join('\n')}`);
    }
    if (events.data?.length) {
      dataSources.push('events');
      contextParts.push(`EVENTS (${events.data.length} items):\n${events.data.map(e => 
        `- ${e.title} (${new Date(e.start_at).toLocaleDateString()}${e.location ? ` @ ${e.location}` : ''}): ${e.description || ''}`
      ).join('\n')}`);
    }
    if (financials.data?.length) {
      dataSources.push('financials');
      contextParts.push(`FINANCIALS (${financials.data.length} items):\n${financials.data.map(f => 
        `- [${f.type}/${f.category || 'general'}] ${f.title}: $${f.amount} (${f.status})`
      ).join('\n')}`);
    }
    if (tasks.data?.length) {
      dataSources.push('tasks');
      contextParts.push(`TASKS (${tasks.data.length} items):\n${tasks.data.map(t => 
        `- [${t.priority}/${t.status}${t.project ? ` - ${t.project}` : ''}] ${t.title}${t.due_date ? ` (due: ${new Date(t.due_date).toLocaleDateString()})` : ''}: ${t.description || ''}`
      ).join('\n')}`);
    }
    if (knowledge.data?.length) {
      dataSources.push('knowledge');
      contextParts.push(`KNOWLEDGE BASE (${knowledge.data.length} items):\n${knowledge.data.map(k => 
        `- [${k.category}${k.tags?.length ? ` | ${k.tags.join(', ')}` : ''}] ${k.title}: ${(k.content || '').slice(0, 300)}`
      ).join('\n')}`);
    }

    const context = contextParts.join('\n\n');

    if (!context.trim()) {
      return new Response(
        JSON.stringify({
          summary: null,
          insights: [],
          recommendations: [],
          dataSources: [],
          message: 'No data available yet. Please connect data sources or upload documents to generate a summary.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build the system prompt based on requirements
    const systemPrompt = `You are Atlas, an AI executive assistant that analyzes organizational data and provides actionable insights.

Your task is to generate a comprehensive summary based on the user's requirements and the available data.

${requirements ? `USER REQUIREMENTS: ${requirements}` : 'Provide a general overview of all available data with key insights.'}

You MUST respond with a valid JSON object in this exact format:
{
  "summary": "A 2-3 paragraph executive summary highlighting the most important findings",
  "insights": [
    {"title": "Insight title", "description": "Detailed insight description", "priority": "high|medium|low", "domain": "communications|documents|events|financials|tasks|knowledge"},
    ...
  ],
  "recommendations": [
    {"action": "Specific action to take", "rationale": "Why this action is important", "urgency": "immediate|soon|planned"},
    ...
  ],
  "keyMetrics": [
    {"label": "Metric name", "value": "Metric value", "trend": "up|down|stable"},
    ...
  ]
}

Generate 3-5 insights, 2-4 recommendations, and 3-6 key metrics based on the data.
Focus on actionable intelligence and patterns that matter for executive decision-making.`;

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
          { role: 'user', content: `Analyze this organizational data and generate a summary:\n\n${context}` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate summary');
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('Empty response from AI');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseContent);
      throw new Error('Failed to parse AI response');
    }

    console.log(`Generated Atlas summary for user ${userId}`);

    return new Response(
      JSON.stringify({
        ...parsedResponse,
        dataSources,
        generatedAt: new Date().toISOString(),
      }),
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
