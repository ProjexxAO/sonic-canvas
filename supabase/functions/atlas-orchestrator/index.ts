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
    // SHARED DASHBOARD ACTIONS
    // =============================================

    if (action === 'dashboard_list') {
      // List all dashboards user has access to
      const { data: memberData, error: memberError } = await supabase
        .from('shared_dashboard_members')
        .select('dashboard_id, role')
        .eq('user_id', userId);

      if (memberError) throw memberError;

      const dashboardIds = memberData?.map(m => m.dashboard_id) || [];
      
      if (dashboardIds.length === 0) {
        return new Response(JSON.stringify({ dashboards: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: dashboards, error: dashError } = await supabase
        .from('shared_dashboards')
        .select('id, name, description, created_at, updated_at')
        .in('id', dashboardIds)
        .eq('is_active', true);

      if (dashError) throw dashError;

      // Enrich with member counts and user's role
      const enrichedDashboards = await Promise.all(
        (dashboards || []).map(async (d) => {
          const { count } = await supabase
            .from('shared_dashboard_members')
            .select('*', { count: 'exact', head: true })
            .eq('dashboard_id', d.id);

          const myMembership = memberData?.find(m => m.dashboard_id === d.id);
          
          return {
            ...d,
            member_count: count || 0,
            role: myMembership?.role || 'viewer',
          };
        })
      );

      return new Response(JSON.stringify({ dashboards: enrichedDashboards }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dashboard_select') {
      const { dashboardName } = body;
      
      // Find dashboard by name (case-insensitive)
      const { data: dashboards, error } = await supabase
        .from('shared_dashboards')
        .select('id, name, description')
        .ilike('name', `%${dashboardName}%`)
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;

      const dashboard = dashboards?.[0];
      if (!dashboard) {
        return new Response(JSON.stringify({ error: 'Dashboard not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify user is a member
      const { data: membership } = await supabase
        .from('shared_dashboard_members')
        .select('role')
        .eq('dashboard_id', dashboard.id)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        return new Response(JSON.stringify({ error: 'You are not a member of this dashboard' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get member count
      const { count } = await supabase
        .from('shared_dashboard_members')
        .select('*', { count: 'exact', head: true })
        .eq('dashboard_id', dashboard.id);

      return new Response(JSON.stringify({ 
        dashboard: {
          ...dashboard,
          role: membership.role,
          member_count: count || 0,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dashboard_messages') {
      const { dashboardName, limit = 20 } = body;
      
      let dashboardId: string | null = null;

      if (dashboardName) {
        const { data } = await supabase
          .from('shared_dashboards')
          .select('id')
          .ilike('name', `%${dashboardName}%`)
          .limit(1);
        dashboardId = data?.[0]?.id || null;
      } else {
        // Get user's most recent dashboard
        const { data: memberData } = await supabase
          .from('shared_dashboard_members')
          .select('dashboard_id')
          .eq('user_id', userId)
          .limit(1);
        dashboardId = memberData?.[0]?.dashboard_id || null;
      }

      if (!dashboardId) {
        return new Response(JSON.stringify({ messages: [], error: 'No dashboard found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get messages with user info
      const { data: messages, error } = await supabase
        .from('dashboard_messages')
        .select('id, content, user_id, created_at, is_edited, mentions')
        .eq('dashboard_id', dashboardId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Enrich with user names
      const userIds = [...new Set((messages || []).map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      const enrichedMessages = (messages || []).map(m => ({
        ...m,
        sender_name: profileMap.get(m.user_id) || 'Unknown User',
      }));

      return new Response(JSON.stringify({ messages: enrichedMessages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dashboard_send_message') {
      const { dashboardName, message } = body;
      
      let dashboardId: string | null = null;

      if (dashboardName) {
        const { data } = await supabase
          .from('shared_dashboards')
          .select('id')
          .ilike('name', `%${dashboardName}%`)
          .limit(1);
        dashboardId = data?.[0]?.id || null;
      } else {
        const { data: memberData } = await supabase
          .from('shared_dashboard_members')
          .select('dashboard_id')
          .eq('user_id', userId)
          .limit(1);
        dashboardId = memberData?.[0]?.dashboard_id || null;
      }

      if (!dashboardId) {
        return new Response(JSON.stringify({ error: 'No dashboard found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check user has permission to comment
      const { data: membership } = await supabase
        .from('shared_dashboard_members')
        .select('can_comment')
        .eq('dashboard_id', dashboardId)
        .eq('user_id', userId)
        .single();

      if (!membership?.can_comment) {
        return new Response(JSON.stringify({ error: 'You do not have permission to send messages' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert message
      const { data: newMessage, error } = await supabase
        .from('dashboard_messages')
        .insert({
          dashboard_id: dashboardId,
          user_id: userId,
          content: message,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: newMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dashboard_files') {
      const { dashboardName } = body;
      
      let dashboardId: string | null = null;

      if (dashboardName) {
        const { data } = await supabase
          .from('shared_dashboards')
          .select('id')
          .ilike('name', `%${dashboardName}%`)
          .limit(1);
        dashboardId = data?.[0]?.id || null;
      } else {
        const { data: memberData } = await supabase
          .from('shared_dashboard_members')
          .select('dashboard_id')
          .eq('user_id', userId)
          .limit(1);
        dashboardId = memberData?.[0]?.dashboard_id || null;
      }

      if (!dashboardId) {
        return new Response(JSON.stringify({ files: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: files, error } = await supabase
        .from('dashboard_files')
        .select('id, file_name, file_size, mime_type, uploaded_by, created_at')
        .eq('dashboard_id', dashboardId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with uploader names and format size
      const uploaderIds = [...new Set((files || []).map(f => f.uploaded_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', uploaderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      const formatSize = (bytes: number | null): string => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      };

      const enrichedFiles = (files || []).map(f => ({
        ...f,
        uploader_name: profileMap.get(f.uploaded_by) || 'Unknown',
        size_formatted: formatSize(f.file_size),
      }));

      return new Response(JSON.stringify({ files: enrichedFiles }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dashboard_notifications') {
      const { data: notifications, error } = await supabase
        .from('dashboard_notifications')
        .select('id, title, message, notification_type, is_read, created_at, dashboard_id, actor_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(JSON.stringify({ notifications: notifications || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dashboard_members') {
      const { dashboardName } = body;
      
      let dashboardId: string | null = null;

      if (dashboardName) {
        const { data } = await supabase
          .from('shared_dashboards')
          .select('id')
          .ilike('name', `%${dashboardName}%`)
          .limit(1);
        dashboardId = data?.[0]?.id || null;
      } else {
        const { data: memberData } = await supabase
          .from('shared_dashboard_members')
          .select('dashboard_id')
          .eq('user_id', userId)
          .limit(1);
        dashboardId = memberData?.[0]?.dashboard_id || null;
      }

      if (!dashboardId) {
        return new Response(JSON.stringify({ members: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: members, error } = await supabase
        .from('shared_dashboard_members')
        .select('user_id, role, can_comment, can_share, can_upload, joined_at')
        .eq('dashboard_id', dashboardId);

      if (error) throw error;

      // Enrich with profile info
      const userIds = (members || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedMembers = (members || []).map(m => ({
        ...m,
        display_name: profileMap.get(m.user_id)?.display_name || 'Unknown User',
        avatar_url: profileMap.get(m.user_id)?.avatar_url,
      }));

      return new Response(JSON.stringify({ members: enrichedMembers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'dashboard_summary') {
      const { dashboardName } = body;
      
      let dashboardId: string | null = null;
      let dashboardNameResolved = dashboardName;

      if (dashboardName) {
        const { data } = await supabase
          .from('shared_dashboards')
          .select('id, name')
          .ilike('name', `%${dashboardName}%`)
          .limit(1);
        dashboardId = data?.[0]?.id || null;
        dashboardNameResolved = data?.[0]?.name || dashboardName;
      } else {
        const { data: memberData } = await supabase
          .from('shared_dashboard_members')
          .select('dashboard_id')
          .eq('user_id', userId)
          .limit(1);
        dashboardId = memberData?.[0]?.dashboard_id || null;
        
        if (dashboardId) {
          const { data } = await supabase
            .from('shared_dashboards')
            .select('name')
            .eq('id', dashboardId)
            .single();
          dashboardNameResolved = data?.name || 'Dashboard';
        }
      }

      if (!dashboardId) {
        return new Response(JSON.stringify({ summary: 'No dashboard found to summarize.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Gather dashboard data for AI summary
      const [messagesRes, filesRes, membersRes, activitiesRes] = await Promise.all([
        supabase.from('dashboard_messages').select('content, created_at').eq('dashboard_id', dashboardId).order('created_at', { ascending: false }).limit(20),
        supabase.from('dashboard_files').select('file_name, created_at').eq('dashboard_id', dashboardId).limit(10),
        supabase.from('shared_dashboard_members').select('role').eq('dashboard_id', dashboardId),
        supabase.from('dashboard_activity').select('action, item_type, created_at').eq('dashboard_id', dashboardId).order('created_at', { ascending: false }).limit(20),
      ]);

      const context = {
        name: dashboardNameResolved,
        messageCount: messagesRes.data?.length || 0,
        recentMessages: messagesRes.data?.slice(0, 5).map(m => m.content.slice(0, 100)) || [],
        fileCount: filesRes.data?.length || 0,
        recentFiles: filesRes.data?.map(f => f.file_name) || [],
        memberCount: membersRes.data?.length || 0,
        roles: membersRes.data?.map(m => m.role) || [],
        recentActivity: activitiesRes.data?.slice(0, 5).map(a => a.action) || [],
      };

      // Generate AI summary
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are Atlas, a helpful AI assistant. Generate a concise but informative summary of a shared dashboard based on the provided context. Focus on recent activity, key discussions, and team composition.' },
            { role: 'user', content: `Summarize this dashboard:\n${JSON.stringify(context, null, 2)}` },
          ],
        }),
      });

      if (!aiResponse.ok) {
        return new Response(JSON.stringify({ summary: 'Unable to generate summary at this time.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiData = await aiResponse.json();
      const summary = aiData.choices?.[0]?.message?.content || 'No summary available.';

      return new Response(JSON.stringify({ summary }), {
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
