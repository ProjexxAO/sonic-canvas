import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get conversation context for AI prompts
async function getConversationContext(
  supabase: any, 
  userId: string, 
  sessionId?: string,
  limit: number = 20
): Promise<string> {
  try {
    let query = supabase
      .from('atlas_conversations')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Optionally filter by session
    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    
    const { data: history, error } = await query;
    
    if (error || !history || history.length === 0) {
      return '';
    }
    
    // Reverse to chronological order and format
    const formattedHistory = history
      .reverse()
      .map((m: any) => `${m.role === 'user' ? 'User' : 'Atlas'}: ${m.content}`)
      .join('\n');
    
    return `\n\n=== Recent Conversation History ===\n${formattedHistory}\n=== End History ===\n`;
  } catch (e) {
    console.error('Error fetching conversation context:', e);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { query, action, userId, preferences, taskData, notificationId, sessionId } = body;
    console.log(`Atlas orchestrator received action: ${action}, query: ${query}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // =============================================
    // UI PREFERENCES ACTIONS
    // =============================================
    
    if (action === 'get_ui_preferences') {
      const { data, error } = await supabase
        .from('user_ui_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify({ preferences: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_ui_preferences') {
      const { data, error } = await supabase
        .from('user_ui_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        preferences: data,
        message: 'UI preferences updated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================
    // AGENT ORCHESTRATION ACTIONS
    // =============================================

    if (action === 'create_task') {
      const { data, error } = await supabase
        .from('agent_task_queue')
        .insert({
          user_id: userId,
          ...taskData,
          status: 'pending',
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        task: data,
        message: `Task "${taskData.task_title}" created`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_task') {
      const { taskId, updates } = body;
      
      const { data, error } = await supabase
        .from('agent_task_queue')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        task: data,
        message: `Task updated`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete_task') {
      const { taskId } = body;
      
      // Check if it's a csuite task
      if (taskId.startsWith('csuite:')) {
        const actualId = taskId.replace('csuite:', '');
        const { error } = await supabase
          .from('csuite_tasks')
          .delete()
          .eq('id', actualId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agent_task_queue')
          .delete()
          .eq('id', taskId)
          .eq('user_id', userId);

        if (error) throw error;
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Task deleted'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_tasks') {
      const { data, error } = await supabase
        .from('agent_task_queue')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(JSON.stringify({ tasks: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sync tasks from long-term memory using AI extraction
    if (action === 'sync_memory_tasks') {
      // Fetch recent memory messages
      const { data: memoryMessages, error: memError } = await supabase
        .from('user_memory_messages')
        .select('id, content, role, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (memError) throw memError;

      if (!memoryMessages || memoryMessages.length === 0) {
        return new Response(JSON.stringify({ tasks: [], message: 'No memory to extract tasks from' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build conversation text for AI analysis
      const conversationText = memoryMessages
        .reverse()
        .map((m: any) => `${m.role === 'user' ? 'User' : 'Atlas'}: ${m.content}`)
        .join('\n');

      // Use AI to extract tasks from memory
      const extractionPrompt = `Analyze the following conversation between a user and Atlas (an AI assistant). Extract any tasks, action items, or commitments that were discussed or assigned.

For each task found, provide:
- title: A concise task title (max 100 chars)
- description: Brief description of what needs to be done
- priority: "low", "medium", "high", or "critical"
- status: "pending" if not started, "in_progress" if work has begun

Only extract tasks that are actionable and specific. Do not include vague mentions or completed tasks.

Return a JSON array of tasks, or an empty array if no tasks are found.

Conversation:
${conversationText}

Return ONLY valid JSON in this format:
[{"title": "...", "description": "...", "priority": "medium", "status": "pending"}]`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a task extraction assistant. Extract actionable tasks from conversations and return them as JSON.' },
            { role: 'user', content: extractionPrompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI extraction failed:', await aiResponse.text());
        throw new Error('Failed to extract tasks from memory');
      }

      const aiData = await aiResponse.json();
      const extractedContent = aiData.choices[0].message.content;

      // Parse extracted tasks
      let extractedTasks = [];
      try {
        const jsonMatch = extractedContent.match(/\[[\s\S]*\]/);
        extractedTasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch (e) {
        console.error('Failed to parse extracted tasks:', e);
        extractedTasks = [];
      }

      if (extractedTasks.length === 0) {
        return new Response(JSON.stringify({ tasks: [], message: 'No actionable tasks found in memory' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check for existing tasks to avoid duplicates
      const { data: existingTasks } = await supabase
        .from('agent_task_queue')
        .select('task_title')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress', 'awaiting_approval']);

      const existingTitles = new Set((existingTasks || []).map((t: any) => t.task_title.toLowerCase()));

      // Filter out duplicates and insert new tasks
      const newTasks = extractedTasks.filter(
        (t: any) => !existingTitles.has(t.title.toLowerCase())
      );

      if (newTasks.length > 0) {
        const tasksToInsert = newTasks.map((t: any) => ({
          user_id: userId,
          task_title: t.title,
          task_description: t.description || '',
          task_priority: t.priority || 'medium',
          task_type: 'assistance',
          orchestration_mode: 'hybrid',
          status: t.status || 'pending',
          progress: t.status === 'in_progress' ? 25 : 0,
          input_data: { source: 'memory_extraction' },
          output_data: {},
          agent_suggestions: [],
        }));

        const { data: insertedTasks, error: insertError } = await supabase
          .from('agent_task_queue')
          .insert(tasksToInsert)
          .select();

        if (insertError) throw insertError;

        return new Response(JSON.stringify({ 
          tasks: insertedTasks,
          extracted: extractedTasks.length,
          inserted: newTasks.length,
          message: `Extracted ${extractedTasks.length} tasks, inserted ${newTasks.length} new tasks`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        tasks: [],
        extracted: extractedTasks.length,
        inserted: 0,
        message: `Found ${extractedTasks.length} tasks but all already exist`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================
    // CONVERSATION MEMORY ACTIONS
    // =============================================

    if (action === 'get_conversation_history') {
      const { limit = 50 } = body;
      
      let query = supabase
        .from('atlas_conversations')
        .select('id, role, content, created_at, session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }
      
      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({ history: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'chat') {
      // Context-aware chat with conversation memory
      const conversationContext = await getConversationContext(supabase, userId, sessionId, 30);
      
      const chatPrompt = `You are Atlas, an intelligent AI orchestrator and assistant. You help users manage their agents, search for information, analyze data, and automate tasks.

Use the conversation history below to maintain context and provide helpful, personalized responses. Reference past conversations when relevant to show continuity.
${conversationContext}

Current user message: ${query}

Respond naturally and helpfully. If the user references something from a previous conversation, acknowledge it. Be concise but thorough.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are Atlas, an expert AI assistant with memory of past conversations. Be helpful, concise, and personalized.' },
            { role: 'user', content: chatPrompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: 'Usage credits exhausted. Please add credits.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await aiResponse.text();
        console.error('AI chat error:', errorText);
        throw new Error('Failed to generate response');
      }

      const aiData = await aiResponse.json();
      const response = aiData.choices[0].message.content;

      return new Response(JSON.stringify({ 
        response,
        hasContext: conversationContext.length > 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'orchestrate_agents') {
      // Get conversation context for better understanding
      const conversationContext = await getConversationContext(supabase, userId, sessionId, 15);
      
      // Analyze the user request and determine which agents to engage
      const { data: agents, error: agentsError } = await supabase
        .from('sonic_agents')
        .select('id, name, sector, description, capabilities, status')
        .limit(50);

      if (agentsError) throw agentsError;

      // Use AI to determine which agents are best suited for the task
      const orchestrationPrompt = `You are Atlas, an AI orchestrator. Analyze the following user request and determine which agents should be engaged.

${conversationContext ? `Use this conversation history for context:${conversationContext}` : ''}

Current User Request: ${query}

Available Agents:
${agents?.map(a => `- ${a.name} (${a.sector}): ${a.description || 'No description'}. Capabilities: ${a.capabilities?.join(', ') || 'None listed'}`).join('\n')}

Respond with a JSON object:
{
  "recommended_agents": [
    {
      "agent_id": "uuid",
      "agent_name": "name",
      "role": "what this agent will do",
      "confidence": 0.0-1.0,
      "requires_approval": true/false
    }
  ],
  "orchestration_plan": "brief description of how agents will work together",
  "task_type": "automation|notification|analysis|assistance|background",
  "estimated_duration": "time estimate"
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
            { role: 'system', content: 'You are Atlas, an expert AI orchestrator. Always respond with valid JSON.' },
            { role: 'user', content: orchestrationPrompt },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI orchestration error:', errorText);
        throw new Error('Failed to orchestrate agents');
      }

      const aiData = await aiResponse.json();
      const orchestrationContent = aiData.choices[0].message.content;
      
      let orchestrationPlan;
      try {
        const jsonMatch = orchestrationContent.match(/\{[\s\S]*\}/);
        orchestrationPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (e) {
        console.error('Failed to parse orchestration plan:', e);
        orchestrationPlan = null;
      }

      return new Response(JSON.stringify({ 
        orchestration: orchestrationPlan,
        availableAgents: agents?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send_notification') {
      const { notification } = body;
      
      const { data, error } = await supabase
        .from('agent_notifications')
        .insert({
          user_id: userId,
          ...notification,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        notification: data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_notifications') {
      const { data, error } = await supabase
        .from('agent_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(JSON.stringify({ notifications: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dismiss_notification') {
      const { error } = await supabase
        .from('agent_notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================
    // EXISTING SEARCH/SYNTHESIS ACTIONS
    // =============================================

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
      const { agentIds, requirements } = body;
      
      // Get conversation context for better synthesis
      const conversationContext = await getConversationContext(supabase, userId, sessionId, 10);
      
      // Validate agentIds - must be an array of valid UUIDs
      const validAgentIds = Array.isArray(agentIds) 
        ? agentIds.filter(id => typeof id === 'string' && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
        : [];
      
      // If no valid agent IDs, synthesize from requirements alone
      let agents: any[] = [];
      if (validAgentIds.length > 0) {
        const { data, error } = await supabase
          .from('sonic_agents')
          .select('*')
          .in('id', validAgentIds);

        if (error) throw error;
        agents = data || [];
      }

      // Use Lovable AI to synthesize a new agent
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
