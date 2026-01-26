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

    // Helper: call Lovable AI gateway with consistent error handling and retry logic
    const callAIGateway = async (messages: Array<{ role: string; content: string }>, maxRetries = 2) => {
      let lastError: string = '';
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-3-flash-preview',
              messages,
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const response = aiData?.choices?.[0]?.message?.content ?? '';
            return { status: 200, body: { response } };
          }

          // Handle specific error codes (don't retry these)
          if (aiResponse.status === 429) {
            return { status: 429, body: { error: 'Rate limit exceeded. Please try again later.' } };
          }
          if (aiResponse.status === 402) {
            return { status: 402, body: { error: 'Usage credits exhausted. Please add credits.' } };
          }

          // For 5xx errors, retry if we have attempts left
          lastError = await aiResponse.text();
          console.error(`AI gateway error (attempt ${attempt + 1}/${maxRetries + 1}):`, aiResponse.status, lastError.substring(0, 200));
          
          if (attempt < maxRetries && aiResponse.status >= 500) {
            // Wait before retry with exponential backoff
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
        } catch (fetchError) {
          lastError = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.error(`AI gateway fetch error (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError);
          
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
        }
      }

      return { status: 500, body: { error: 'AI gateway temporarily unavailable. Please try again.' } };
    };

    // Helper: resolve userId for request. For widget actions we require userId explicitly.
    // (Auth helper methods are not available in this edge runtime typing; callers must pass userId.)
    const resolveRequestUserId = async (): Promise<string | null> => {
      return userId || null;
    };

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

    // =============================================
    // PERSONAL HUB ACTIONS (Tasks, Goals, Habits)
    // =============================================

    // Create personal item (task, note, goal, habit, etc.)
    if (action === 'create_personal_item') {
      const { itemType, title, content, metadata, tags, priority, dueDate, reminderAt, recurrenceRule } = body;
      
      const { data, error } = await supabase
        .from('personal_items')
        .insert({
          user_id: userId,
          item_type: itemType || 'task',
          title,
          content: content || null,
          metadata: metadata || {},
          tags: tags || [],
          status: 'active',
          priority: priority || 'medium',
          due_date: dueDate || null,
          reminder_at: reminderAt || null,
          recurrence_rule: recurrenceRule || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        item: data,
        message: `${itemType || 'Task'} "${title}" created`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update personal item
    if (action === 'update_personal_item') {
      const { itemId, updates } = body;
      
      const updateData: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };
      
      // Handle completion
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('personal_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        item: data,
        message: 'Item updated'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Complete personal item
    if (action === 'complete_personal_item') {
      const { itemId, itemTitle } = body;
      
      let targetId = itemId;
      
      // Find by title if no ID provided
      if (!targetId && itemTitle) {
        const { data: items } = await supabase
          .from('personal_items')
          .select('id, title')
          .eq('user_id', userId)
          .eq('status', 'active')
          .ilike('title', `%${itemTitle}%`)
          .limit(1);
        
        if (items && items.length > 0) {
          targetId = items[0].id;
        }
      }

      if (!targetId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Item not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('personal_items')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        item: data,
        message: `"${data.title}" completed`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete personal item
    if (action === 'delete_personal_item') {
      const { itemId, itemTitle } = body;
      
      let targetId = itemId;
      
      // Find by title if no ID provided
      if (!targetId && itemTitle) {
        const { data: items } = await supabase
          .from('personal_items')
          .select('id, title')
          .eq('user_id', userId)
          .neq('status', 'deleted')
          .ilike('title', `%${itemTitle}%`)
          .limit(1);
        
        if (items && items.length > 0) {
          targetId = items[0].id;
        }
      }

      if (!targetId) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Item not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Soft delete
      const { data, error } = await supabase
        .from('personal_items')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        message: `"${data.title}" deleted`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get personal items
    if (action === 'get_personal_items') {
      const { itemType, status, limit: queryLimit } = body;
      
      let query = supabase
        .from('personal_items')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(queryLimit || 50);

      if (itemType) {
        query = query.eq('item_type', itemType);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return new Response(JSON.stringify({ items: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create personal goal
    if (action === 'create_personal_goal') {
      const { title, description, category, targetValue, unit, targetDate } = body;
      
      const { data, error } = await supabase
        .from('personal_goals')
        .insert({
          user_id: userId,
          title,
          description: description || null,
          category: category || 'general',
          target_value: targetValue || null,
          current_value: 0,
          unit: unit || null,
          target_date: targetDate || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        goal: data,
        message: `Goal "${title}" created`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update goal progress
    if (action === 'update_goal_progress') {
      const { goalId, goalTitle, value, increment } = body;
      
      let targetId = goalId;
      let currentGoal: any = null;
      
      // Find by title if no ID provided
      if (!targetId && goalTitle) {
        const { data: goals } = await supabase
          .from('personal_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .ilike('title', `%${goalTitle}%`)
          .limit(1);
        
        if (goals && goals.length > 0) {
          currentGoal = goals[0];
          targetId = goals[0].id;
        }
      } else if (targetId) {
        const { data: goal } = await supabase
          .from('personal_goals')
          .select('*')
          .eq('id', targetId)
          .single();
        currentGoal = goal;
      }

      if (!targetId || !currentGoal) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Goal not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newValue = increment 
        ? (currentGoal.current_value || 0) + increment 
        : value;
      
      const updates: Record<string, any> = { 
        current_value: newValue,
        updated_at: new Date().toISOString()
      };
      
      // Check if goal completed
      if (currentGoal.target_value && newValue >= currentGoal.target_value) {
        updates.status = 'completed';
      }

      const { data, error } = await supabase
        .from('personal_goals')
        .update(updates)
        .eq('id', targetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        goal: data,
        message: `Goal progress updated to ${newValue}${currentGoal.unit ? ` ${currentGoal.unit}` : ''}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create personal habit
    if (action === 'create_personal_habit') {
      const { name, description, frequency, targetCount } = body;
      
      const { data, error } = await supabase
        .from('personal_habits')
        .insert({
          user_id: userId,
          name,
          description: description || null,
          frequency: frequency || 'daily',
          target_count: targetCount || 1,
          current_streak: 0,
          longest_streak: 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        habit: data,
        message: `Habit "${name}" created`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Complete habit for today
    if (action === 'complete_habit') {
      const { habitId, habitName } = body;
      
      let targetId = habitId;
      let currentHabit: any = null;
      
      // Find by name if no ID provided
      if (!targetId && habitName) {
        const { data: habits } = await supabase
          .from('personal_habits')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .ilike('name', `%${habitName}%`)
          .limit(1);
        
        if (habits && habits.length > 0) {
          currentHabit = habits[0];
          targetId = habits[0].id;
        }
      } else if (targetId) {
        const { data: habit } = await supabase
          .from('personal_habits')
          .select('*')
          .eq('id', targetId)
          .single();
        currentHabit = habit;
      }

      if (!targetId || !currentHabit) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Habit not found'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert completion record
      await supabase
        .from('habit_completions')
        .insert({
          habit_id: targetId,
          user_id: userId,
        });

      // Update streak
      const newStreak = (currentHabit.current_streak || 0) + 1;
      const { data, error } = await supabase
        .from('personal_habits')
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, currentHabit.longest_streak || 0),
          last_completed_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        habit: data,
        message: `${currentHabit.name} completed! 🎯 ${newStreak} day streak`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get personal summary (tasks, goals, habits)
    if (action === 'get_personal_summary') {
      // Fetch all personal data in parallel
      const [itemsResult, goalsResult, habitsResult] = await Promise.all([
        supabase
          .from('personal_items')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('personal_goals')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('personal_habits')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const tasks = (itemsResult.data || []).filter(i => i.item_type === 'task');
      const goals = goalsResult.data || [];
      const habits = habitsResult.data || [];

      // Find today's tasks
      const today = new Date().toISOString().split('T')[0];
      const todaysTasks = tasks.filter(t => t.due_date?.startsWith(today));
      const overdueTasks = tasks.filter(t => t.due_date && t.due_date < today);

      return new Response(JSON.stringify({ 
        summary: {
          tasks: {
            total: tasks.length,
            today: todaysTasks.length,
            overdue: overdueTasks.length,
            items: tasks.slice(0, 5),
          },
          goals: {
            total: goals.length,
            items: goals.slice(0, 5),
          },
          habits: {
            total: habits.length,
            totalStreak: habits.reduce((sum, h) => sum + (h.current_streak || 0), 0),
            items: habits.slice(0, 5),
          },
        }
      }), {
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

    // =============================================
    // WIDGET AGENT ACTIONS (Agent Widgets)
    // =============================================

    if (action === 'widget_initialize') {
      const effectiveUserId = await resolveRequestUserId();
      if (!effectiveUserId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const widgetConfig = body.widgetConfig || {};
      const widgetContext = body.context || {};
      const message = body.message || query || `Initialize widget: ${widgetConfig?.name || 'Agent Widget'}`;

      // Determine what actions this widget can perform based on data sources
      const dataSources = widgetConfig?.dataSources || [];
      const capabilities: string[] = [];
      
      if (dataSources.includes('tasks')) {
        capabilities.push('create and manage tasks', 'prioritize your work');
      }
      if (dataSources.includes('goals')) {
        capabilities.push('track goal progress', 'set new goals');
      }
      if (dataSources.includes('habits')) {
        capabilities.push('build habits', 'track streaks');
      }
      if (dataSources.includes('finance')) {
        capabilities.push('analyze spending', 'provide budget insights');
      }
      if (dataSources.includes('calendar')) {
        capabilities.push('manage your schedule');
      }
      if (dataSources.includes('email')) {
        capabilities.push('summarize emails', 'find important messages');
      }

      const systemPrompt = `You are an Agent Widget inside Atlas OS.
You will speak concisely and stay aligned with the widget's purpose.

Widget name: ${widgetConfig?.name || 'Agent Widget'}
Widget purpose: ${widgetConfig?.purpose || widgetConfig?.description || 'Assist the user'}
User's capabilities through this widget: ${widgetConfig?.capabilities?.join(', ') || 'general assistance'}
Connected data sources: ${dataSources.join(', ') || 'none'}

What you can actually DO for the user:
${capabilities.length > 0 ? capabilities.join(', ') : 'provide general assistance and insights'}

CURRENT USER DATA SNAPSHOT:
${JSON.stringify(widgetContext, null, 2)}

INSTRUCTIONS:
1. Provide a brief, personalized welcome (max 2 sentences) based on the widget's purpose.
2. Reference SPECIFIC items from their actual data if available.
3. Suggest ONE concrete action they can take right now.
4. Do NOT mention internal systems, databases, or authentication.

Example good response:
"Welcome to your Task Tracker! You have 3 high-priority tasks due today. Would you like me to help you tackle 'Review Q4 budget' first?"
`;

      const result = await callAIGateway([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ]);

      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'widget_execute') {
      const effectiveUserId = await resolveRequestUserId();
      if (!effectiveUserId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const widgetConfig = body.widgetConfig || {};
      const widgetContext = body.context || {};
      const conversationHistory = Array.isArray(body.conversationHistory) ? body.conversationHistory : [];
      const message = body.message || query || '';

      // Determine available actions based on widget's data sources
      const dataSources = widgetConfig?.dataSources || [];
      const availableActions: string[] = [];
      
      // CORE DATA ACTIONS
      if (dataSources.includes('tasks')) {
        availableActions.push('create_task', 'complete_task', 'list_tasks', 'prioritize_tasks');
      }
      if (dataSources.includes('goals')) {
        availableActions.push('create_goal', 'update_goal_progress', 'list_goals');
      }
      if (dataSources.includes('habits')) {
        availableActions.push('create_habit', 'complete_habit', 'list_habits');
      }
      if (dataSources.includes('finance')) {
        availableActions.push('analyze_spending', 'budget_insights', 'spending_summary');
      }
      if (dataSources.includes('calendar')) {
        availableActions.push('schedule_event', 'list_events', 'check_availability');
      }
      if (dataSources.includes('email')) {
        availableActions.push('summarize_emails', 'draft_email', 'find_emails', 'create_email_monitor');
      }
      
      // AUTOMATION & WORKFLOW ACTIONS (always available to widgets)
      availableActions.push(
        'create_workflow',
        'create_automation',
        'send_notification',
        'schedule_reminder'
      );

      const systemPrompt = `You are an AUTONOMOUS Agent Widget inside Atlas OS that can EXECUTE real actions and CREATE automations.

Widget name: ${widgetConfig?.name || 'Agent Widget'}
Widget purpose: ${widgetConfig?.purpose || widgetConfig?.description || 'Assist the user'}
Capabilities: ${(widgetConfig?.capabilities || []).join(', ') || 'general assistance'}
Data sources: ${dataSources.join(', ') || 'none'}

AVAILABLE ACTIONS you can execute:
${availableActions.join(', ')}

CURRENT USER DATA:
${JSON.stringify(widgetContext, null, 2)}

CRITICAL INSTRUCTIONS:
1. You are AUTONOMOUS - when users ask you to monitor, automate, or create workflows, you MUST create them.
2. Always include a JSON action block when the request requires action.
3. For monitoring requests (email, data changes), use create_workflow or create_automation.
4. For reminders or alerts, use schedule_reminder or send_notification.
5. Base your analysis on the ACTUAL DATA provided.

ACTION FORMAT (ALWAYS include when executing):
\`\`\`json
{
  "action": "action_name",
  "params": { ... },
  "execute": true
}
\`\`\`

ACTION EXAMPLES:

1. CREATE TASK:
\`\`\`json
{"action": "create_task", "params": {"title": "Task name", "priority": "high"}, "execute": true}
\`\`\`

2. CREATE WORKFLOW (for automated processes):
\`\`\`json
{"action": "create_workflow", "params": {"name": "Email Monitor", "trigger_type": "email_received", "trigger_config": {"from_filter": "boss@company.com"}, "action_type": "send_notification", "action_config": {"title": "Important Email", "message": "Email from boss received"}}, "execute": true}
\`\`\`

3. CREATE EMAIL MONITOR:
\`\`\`json
{"action": "create_email_monitor", "params": {"name": "VIP Emails", "from_filter": "vip@example.com", "notify": true}, "execute": true}
\`\`\`

4. CREATE AUTOMATION (for event-based triggers):
\`\`\`json
{"action": "create_automation", "params": {"name": "Daily Summary", "trigger_type": "schedule", "schedule": "0 9 * * *", "action_type": "generate_summary"}, "execute": true}
\`\`\`

5. SEND NOTIFICATION:
\`\`\`json
{"action": "send_notification", "params": {"title": "Alert", "message": "Something happened", "priority": "high"}, "execute": true}
\`\`\`

6. SCHEDULE REMINDER:
\`\`\`json
{"action": "schedule_reminder", "params": {"title": "Reminder", "message": "Don't forget!", "remind_at": "2025-01-24T09:00:00Z"}, "execute": true}
\`\`\`

When users say things like:
- "Monitor my email for X" → create_workflow with email trigger
- "Remind me to X" → schedule_reminder
- "Alert me when X" → create_automation
- "Create a workflow for X" → create_workflow

ALWAYS execute real actions. Never just describe what you would do - DO IT.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message },
      ];

      const result = await callAIGateway(messages);
      
      if (result.status !== 200) {
        return new Response(JSON.stringify(result.body), {
          status: result.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Parse response to check for executable actions
      const responseText = result.body.response || '';
      let executedAction = null;
      let actionResult = null;

      // Check for action JSON in response
      const actionMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (actionMatch) {
        try {
          const actionData = JSON.parse(actionMatch[1]);
          if (actionData.execute && actionData.action) {
            // Execute the action
            switch (actionData.action) {
              case 'create_task':
                const { data: newTask, error: taskError } = await supabase
                  .from('personal_items')
                  .insert({
                    user_id: effectiveUserId,
                    item_type: 'task',
                    title: actionData.params?.title || 'New Task',
                    content: actionData.params?.description || '',
                    priority: actionData.params?.priority || 'medium',
                    status: 'active',
                  })
                  .select()
                  .single();
                if (!taskError && newTask) {
                  executedAction = 'create_task';
                  actionResult = { success: true, task: newTask };
                }
                break;

              case 'complete_task':
                if (actionData.params?.taskId) {
                  const { error: completeError } = await supabase
                    .from('personal_items')
                    .update({ status: 'completed', completed_at: new Date().toISOString() })
                    .eq('id', actionData.params.taskId)
                    .eq('user_id', effectiveUserId);
                  if (!completeError) {
                    executedAction = 'complete_task';
                    actionResult = { success: true };
                  }
                }
                break;

              case 'create_goal':
                const { data: newGoal, error: goalError } = await supabase
                  .from('personal_goals')
                  .insert({
                    user_id: effectiveUserId,
                    title: actionData.params?.title || 'New Goal',
                    description: actionData.params?.description || '',
                    target_value: actionData.params?.target || 100,
                    current_value: 0,
                    status: 'active',
                  })
                  .select()
                  .single();
                if (!goalError && newGoal) {
                  executedAction = 'create_goal';
                  actionResult = { success: true, goal: newGoal };
                }
                break;

              case 'update_goal_progress':
                if (actionData.params?.goalId && actionData.params?.progress !== undefined) {
                  const { error: progressError } = await supabase
                    .from('personal_goals')
                    .update({ current_value: actionData.params.progress })
                    .eq('id', actionData.params.goalId)
                    .eq('user_id', effectiveUserId);
                  if (!progressError) {
                    executedAction = 'update_goal_progress';
                    actionResult = { success: true };
                  }
                }
                break;

              case 'create_habit':
                const { data: newHabit, error: habitError } = await supabase
                  .from('personal_habits')
                  .insert({
                    user_id: effectiveUserId,
                    name: actionData.params?.name || 'New Habit',
                    description: actionData.params?.description || '',
                    frequency: actionData.params?.frequency || 'daily',
                    current_streak: 0,
                    longest_streak: 0,
                  })
                  .select()
                  .single();
                if (!habitError && newHabit) {
                  executedAction = 'create_habit';
                  actionResult = { success: true, habit: newHabit };
                }
                break;

              case 'complete_habit':
                if (actionData.params?.habitId) {
                  const { data: habit } = await supabase
                    .from('personal_habits')
                    .select('current_streak, longest_streak')
                    .eq('id', actionData.params.habitId)
                    .eq('user_id', effectiveUserId)
                    .single();
                  
                  if (habit) {
                    const newStreak = (habit.current_streak || 0) + 1;
                    const { error: habitCompleteError } = await supabase
                      .from('personal_habits')
                      .update({
                        last_completed_at: new Date().toISOString(),
                        current_streak: newStreak,
                        longest_streak: Math.max(newStreak, habit.longest_streak || 0),
                      })
                      .eq('id', actionData.params.habitId)
                      .eq('user_id', effectiveUserId);
                    if (!habitCompleteError) {
                      executedAction = 'complete_habit';
                      actionResult = { success: true, newStreak };
                    }
                  }
                }
                break;

              // ===== NEW AUTOMATION ACTIONS =====
              
              case 'create_workflow':
                const workflowData = {
                  user_id: effectiveUserId,
                  name: actionData.params?.name || 'New Workflow',
                  description: actionData.params?.description || `Created by ${widgetConfig?.name || 'Widget'}`,
                  trigger_type: actionData.params?.trigger_type || 'manual',
                  trigger_config: actionData.params?.trigger_config || {},
                  action_type: actionData.params?.action_type || 'send_notification',
                  action_config: actionData.params?.action_config || {},
                  is_active: true,
                };
                
                const { data: newWorkflow, error: workflowError } = await supabase
                  .from('atlas_workflows')
                  .insert(workflowData)
                  .select()
                  .single();
                  
                if (!workflowError && newWorkflow) {
                  executedAction = 'create_workflow';
                  actionResult = { success: true, workflow: newWorkflow };
                  console.log(`Workflow created: ${newWorkflow.name}`);
                } else {
                  console.error('Workflow creation error:', workflowError);
                }
                break;

              case 'create_email_monitor':
                // Create a workflow that monitors emails
                const emailMonitorWorkflow = {
                  user_id: effectiveUserId,
                  name: actionData.params?.name || 'Email Monitor',
                  description: `Monitors emails${actionData.params?.from_filter ? ` from ${actionData.params.from_filter}` : ''}`,
                  trigger_type: 'email_received',
                  trigger_config: {
                    from_filter: actionData.params?.from_filter || null,
                    subject_filter: actionData.params?.subject_filter || null,
                    keywords: actionData.params?.keywords || [],
                  },
                  action_type: actionData.params?.notify ? 'send_notification' : 'log_event',
                  action_config: {
                    notification_title: actionData.params?.notification_title || 'Email Alert',
                    notification_priority: actionData.params?.priority || 'medium',
                  },
                  is_active: true,
                };
                
                const { data: emailWorkflow, error: emailWorkflowError } = await supabase
                  .from('atlas_workflows')
                  .insert(emailMonitorWorkflow)
                  .select()
                  .single();
                  
                if (!emailWorkflowError && emailWorkflow) {
                  executedAction = 'create_email_monitor';
                  actionResult = { success: true, workflow: emailWorkflow };
                  console.log(`Email monitor created: ${emailWorkflow.name}`);
                }
                break;

              case 'create_automation':
                const automationData = {
                  user_id: effectiveUserId,
                  name: actionData.params?.name || 'New Automation',
                  description: actionData.params?.description || `Automation created by ${widgetConfig?.name || 'Widget'}`,
                  trigger_type: actionData.params?.trigger_type || 'schedule',
                  trigger_config: {
                    schedule: actionData.params?.schedule || null,
                    event_type: actionData.params?.event_type || null,
                    conditions: actionData.params?.conditions || {},
                  },
                  action_type: actionData.params?.action_type || 'send_notification',
                  action_config: actionData.params?.action_config || {},
                  is_active: true,
                };
                
                const { data: newAutomation, error: automationError } = await supabase
                  .from('atlas_workflows')
                  .insert(automationData)
                  .select()
                  .single();
                  
                if (!automationError && newAutomation) {
                  executedAction = 'create_automation';
                  actionResult = { success: true, automation: newAutomation };
                  console.log(`Automation created: ${newAutomation.name}`);
                }
                break;

              case 'send_notification':
                const notificationData = {
                  user_id: effectiveUserId,
                  title: actionData.params?.title || 'Widget Notification',
                  message: actionData.params?.message || 'Notification from your widget',
                  notification_type: actionData.params?.type || 'widget_alert',
                  priority: actionData.params?.priority || 'medium',
                  source_agent_name: widgetConfig?.name || 'Agent Widget',
                  metadata: {
                    widget_id: widgetConfig?.id,
                    widget_name: widgetConfig?.name,
                  },
                  is_read: false,
                  is_dismissed: false,
                };
                
                const { data: notification, error: notificationError } = await supabase
                  .from('agent_notifications')
                  .insert(notificationData)
                  .select()
                  .single();
                  
                if (!notificationError && notification) {
                  executedAction = 'send_notification';
                  actionResult = { success: true, notification };
                  console.log(`Notification sent: ${notification.title}`);
                }
                break;

              case 'schedule_reminder':
                // Create a task with a reminder time
                const reminderTime = actionData.params?.remind_at || 
                  new Date(Date.now() + 60 * 60 * 1000).toISOString(); // Default 1 hour
                
                const reminderItem = {
                  user_id: effectiveUserId,
                  item_type: 'reminder',
                  title: actionData.params?.title || 'Reminder',
                  content: actionData.params?.message || '',
                  status: 'active',
                  priority: actionData.params?.priority || 'medium',
                  reminder_at: reminderTime,
                  metadata: {
                    created_by_widget: widgetConfig?.name,
                    is_scheduled_reminder: true,
                  },
                };
                
                const { data: reminder, error: reminderError } = await supabase
                  .from('personal_items')
                  .insert(reminderItem)
                  .select()
                  .single();
                  
                if (!reminderError && reminder) {
                  executedAction = 'schedule_reminder';
                  actionResult = { success: true, reminder };
                  console.log(`Reminder scheduled: ${reminder.title} at ${reminderTime}`);
                }
                break;

              case 'schedule_event':
                // Create a calendar event
                const eventData = {
                  user_id: effectiveUserId,
                  title: actionData.params?.title || 'New Event',
                  description: actionData.params?.description || '',
                  start_at: actionData.params?.start_at || new Date().toISOString(),
                  end_at: actionData.params?.end_at || null,
                  location: actionData.params?.location || null,
                  attendees: actionData.params?.attendees || [],
                  type: 'event',
                  source: 'widget',
                  metadata: { created_by_widget: widgetConfig?.name },
                };
                
                const { data: event, error: eventError } = await supabase
                  .from('csuite_events')
                  .insert(eventData)
                  .select()
                  .single();
                  
                if (!eventError && event) {
                  executedAction = 'schedule_event';
                  actionResult = { success: true, event };
                  console.log(`Event created: ${event.title}`);
                }
                break;

              default:
                // For analysis actions, the response text is the result
                executedAction = actionData.action;
                actionResult = { success: true, type: 'analysis' };
            }
          }
        } catch (parseError) {
          console.log('No valid action JSON found, treating as regular response');
        }
      }

      // Clean up the response text (remove the action JSON block for cleaner display)
      let cleanResponse = responseText.replace(/```json[\s\S]*?```\s*/g, '').trim();
      
      // If we executed an action, prepend confirmation
      if (executedAction && actionResult?.success) {
        const actionConfirmations: Record<string, string> = {
          create_task: '✅ Task created! ',
          complete_task: '✅ Task completed! ',
          create_goal: '✅ Goal created! ',
          update_goal_progress: '✅ Progress updated! ',
          create_habit: '✅ Habit created! ',
          complete_habit: '✅ Habit completed! ',
          create_workflow: '🔄 Workflow created and activated! ',
          create_email_monitor: '📧 Email monitor created! ',
          create_automation: '⚡ Automation created and activated! ',
          send_notification: '🔔 Notification sent! ',
          schedule_reminder: '⏰ Reminder scheduled! ',
          schedule_event: '📅 Event scheduled! ',
        };
        cleanResponse = (actionConfirmations[executedAction] || '✅ Action completed! ') + cleanResponse;
      }

      return new Response(JSON.stringify({ 
        response: cleanResponse,
        executedAction,
        actionResult,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'orchestrate_agents') {
      // Get conversation context for better understanding
      const conversationContext = await getConversationContext(supabase, userId, sessionId, 15);
      
      // Extract task type from query for intelligent matching
      const { taskType: detectedTaskType } = body;
      
      // PHASE 2: Use intelligent agent-to-task matching via database function
      let specializedAgents: any[] = [];
      if (detectedTaskType) {
        const { data: bestAgents, error: bestAgentsError } = await supabase
          .rpc('find_best_agents_for_task', { 
            p_task_type: detectedTaskType,
            p_sector: null,
            p_limit: 10
          });
        
        if (!bestAgentsError && bestAgents) {
          specializedAgents = bestAgents;
          console.log(`Found ${bestAgents.length} specialized agents for task type: ${detectedTaskType}`);
        }
      }

      // Fallback: fetch all agents with enhanced metrics
      const { data: agents, error: agentsError } = await supabase
        .from('sonic_agents')
        .select('id, name, sector, description, capabilities, status, total_tasks_completed, success_rate, specialization_level, task_specializations, preferred_task_types, learning_velocity')
        .limit(50);

      if (agentsError) throw agentsError;

      // PHASE 2: Semantic memory search for relevant context
      const agentMemoryContexts: string[] = [];
      const agentSpecializationInfo: string[] = [];
      
      if (agents && agents.length > 0) {
        // Prioritize specialized agents if found, otherwise use top performers
        const priorityAgents = specializedAgents.length > 0
          ? agents.filter(a => specializedAgents.some(sa => sa.agent_id === a.id))
          : [...agents].sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0)).slice(0, 5);
        
        for (const agent of priorityAgents.slice(0, 5)) {
          // Fetch task-specific scores for context
          const { data: taskScores } = await supabase
            .from('agent_task_scores')
            .select('task_type, specialization_score, success_count, avg_confidence')
            .eq('agent_id', agent.id)
            .order('specialization_score', { ascending: false })
            .limit(3);
          
          if (taskScores && taskScores.length > 0) {
            const specInfo = taskScores.map(ts => 
              `${ts.task_type}: ${Math.round(ts.specialization_score * 100)}% specialized (${ts.success_count} successes)`
            ).join(', ');
            agentSpecializationInfo.push(`[${agent.name}] Specializations: ${specInfo}`);
          }

          // Semantic memory search if query provided
          if (query) {
            const { data: relevantMemories } = await supabase
              .rpc('search_agent_memories', {
                p_agent_id: agent.id,
                p_search_query: query,
                p_memory_type: null,
                p_limit: 3
              });
            
            if (relevantMemories && relevantMemories.length > 0) {
              agentMemoryContexts.push(
                `[${agent.name} Relevant Memory]\n${relevantMemories.map((m: any) => `- [${m.memory_type}] ${m.content} (relevance: ${Math.round(m.relevance_rank * 100)}%)`).join('\n')}`
              );
            }
          }
          
          // Fallback to importance-based if no semantic matches
          if (agentMemoryContexts.filter(c => c.includes(agent.name)).length === 0) {
            const { data: memories } = await supabase
              .from('agent_memory')
              .select('memory_type, content, importance_score')
              .eq('agent_id', agent.id)
              .order('importance_score', { ascending: false })
              .limit(3);
            
            if (memories && memories.length > 0) {
              agentMemoryContexts.push(
                `[${agent.name} Memory]\n${memories.map(m => `- [${m.memory_type}] ${m.content}`).join('\n')}`
              );
            }
          }
        }
      }

      const memorySection = agentMemoryContexts.length > 0 
        ? `\n\n=== Agent Learning History (Semantically Matched) ===\n${agentMemoryContexts.join('\n\n')}\n=== End Agent Memory ===\n`
        : '';
      
      const specializationSection = agentSpecializationInfo.length > 0
        ? `\n\n=== Agent Task Specializations ===\n${agentSpecializationInfo.join('\n')}\n=== End Specializations ===\n`
        : '';

      // Build specialized agent context if available
      const specializedContext = specializedAgents.length > 0
        ? `\n\nPRE-RANKED SPECIALISTS for "${detectedTaskType}":\n${specializedAgents.map((sa, i) => 
            `${i + 1}. ${sa.agent_name} - Specialization: ${Math.round(sa.specialization_score * 100)}%, Success: ${Math.round(sa.success_rate * 100)}%, Tasks: ${sa.total_tasks}`
          ).join('\n')}\n`
        : '';

      // Use AI to determine which agents are best suited for the task
      const orchestrationPrompt = `You are Atlas, an AI orchestrator with PHASE 2 advanced learning capabilities. Analyze the following user request and determine which agents should be engaged.

${conversationContext ? `Use this conversation history for context:${conversationContext}` : ''}
${memorySection}
${specializationSection}
${specializedContext}

Current User Request: ${query}
${detectedTaskType ? `Detected Task Type: ${detectedTaskType}` : ''}

Available Agents (with performance metrics):
${agents?.map(a => {
  const specializations = a.task_specializations && Object.keys(a.task_specializations).length > 0
    ? Object.entries(a.task_specializations).slice(0, 3).map(([k, v]) => `${k}:${Math.round((v as number) * 100)}%`).join(', ')
    : 'None yet';
  const preferred = a.preferred_task_types?.slice(0, 3).join(', ') || 'None';
  return `- ${a.name} (${a.sector}): ${a.description || 'No description'}
  Capabilities: ${a.capabilities?.join(', ') || 'None listed'}
  Level: ${a.specialization_level || 'novice'} | Tasks: ${a.total_tasks_completed || 0} | Success: ${Math.round((a.success_rate || 0) * 100)}%
  Specializations: ${specializations} | Preferred Tasks: ${preferred} | Learning Velocity: ${a.learning_velocity || 0.5}`;
}).join('\n')}

CRITICAL SELECTION CRITERIA (in order):
1. Use PRE-RANKED SPECIALISTS if provided - they have proven track records for this task type
2. Factor in SPECIALIZATION SCORES - agents with higher scores for the detected task type should be prioritized
3. Consider SEMANTIC MEMORY MATCHES - agents with relevant past experience should be preferred
4. Prefer agents with higher LEARNING VELOCITY for novel tasks (they adapt faster)
5. Success rate and total experience as baseline qualifiers

Respond with a JSON object:
{
  "recommended_agents": [
    {
      "agent_id": "uuid",
      "agent_name": "name",
      "role": "what this agent will do",
      "confidence": 0.0-1.0,
      "requires_approval": true/false,
      "reasoning": "why this agent was selected based on specialization/memory",
      "specialization_match": "high|medium|low|none"
    }
  ],
  "orchestration_plan": "brief description of how agents will work together",
  "task_type": "specific task type for specialization tracking",
  "estimated_duration": "time estimate",
  "learning_opportunity": "what agents will learn from this task"
}`;

      const aiResult = await callAIGateway([
        { role: 'system', content: 'You are Atlas, an expert AI orchestrator with Phase 2 advanced learning. Prioritize specialized agents and semantic memory matches. Always respond with valid JSON.' },
        { role: 'user', content: orchestrationPrompt },
      ]);

      if (aiResult.status !== 200) {
        return new Response(JSON.stringify(aiResult.body), {
          status: aiResult.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const orchestrationContent = aiResult.body.response;
      
      let orchestrationPlan;
      try {
        const jsonMatch = orchestrationContent.match(/\{[\s\S]*\}/);
        orchestrationPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (e) {
        console.error('Failed to parse orchestration plan:', e);
        orchestrationPlan = null;
      }

      // Store interaction memory for recommended agents with enhanced context
      if (orchestrationPlan?.recommended_agents && userId) {
        const taskTypeForMemory = orchestrationPlan.task_type || detectedTaskType || 'general';
        
        for (const rec of orchestrationPlan.recommended_agents.slice(0, 3)) {
          if (rec.agent_id && rec.agent_id.match(/^[0-9a-f-]{36}$/i)) {
            try {
              // Store enriched interaction memory
              await supabase
                .from('agent_memory')
                .insert({
                  agent_id: rec.agent_id,
                  user_id: userId,
                  memory_type: 'interaction',
                  content: `Assigned to "${taskTypeForMemory}" task: ${query?.substring(0, 100) || 'orchestration'}. Role: ${rec.role}. Match: ${rec.specialization_match || 'unrated'}`,
                  context: { 
                    task_type: taskTypeForMemory, 
                    confidence: rec.confidence,
                    specialization_match: rec.specialization_match,
                    learning_opportunity: orchestrationPlan.learning_opportunity
                  },
                  importance_score: rec.confidence || 0.5
                });
              
              // Log learning event for high-confidence selections
              if (rec.confidence >= 0.8) {
                await supabase
                  .from('agent_learning_events')
                  .insert({
                    agent_id: rec.agent_id,
                    event_type: 'skill_gained',
                    event_data: { 
                      task_type: taskTypeForMemory, 
                      confidence: rec.confidence,
                      role: rec.role
                    },
                    impact_score: rec.confidence
                  });
              }
            } catch (memErr) {
              console.warn('Failed to store agent memory/learning event:', memErr);
            }
          }
        }
      }

      return new Response(JSON.stringify({ 
        orchestration: orchestrationPlan,
        availableAgents: agents?.length || 0,
        specializedAgents,
        memoryEnabled: agentMemoryContexts.length > 0,
        phase: 2
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // =============================================
    // AGENT MEMORY & PERFORMANCE ACTIONS
    // =============================================

    if (action === 'record_agent_performance') {
      const { agentId, taskType, success, taskDescription, executionTimeMs, confidenceScore, errorType, context: perfContext } = body;
      
      if (!agentId || !taskType || success === undefined) {
        return new Response(JSON.stringify({ error: 'agentId, taskType, and success are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert performance record
      const { data: perfData, error: perfError } = await supabase
        .from('agent_performance')
        .insert({
          agent_id: agentId,
          user_id: userId,
          task_type: taskType,
          task_description: taskDescription,
          success,
          execution_time_ms: executionTimeMs,
          confidence_score: confidenceScore,
          error_type: errorType,
          context: perfContext || {}
        })
        .select()
        .single();

      if (perfError) throw perfError;

      // Also store as learning memory
      await supabase
        .from('agent_memory')
        .insert({
          agent_id: agentId,
          user_id: userId,
          memory_type: success ? 'outcome' : 'learning',
          content: `Task "${taskType}": ${success ? 'Completed successfully' : 'Failed'}${errorType ? ` - ${errorType}` : ''}`,
          context: { taskType, success, taskDescription },
          importance_score: success ? 0.6 : 0.8 // Failures are more important to remember
        });

      return new Response(JSON.stringify({ 
        success: true, 
        performance: perfData,
        message: `Performance recorded for agent`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_agent_memory') {
      const { agentId, memoryType, limit: memLimit } = body;
      
      if (!agentId) {
        return new Response(JSON.stringify({ error: 'agentId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let memQuery = supabase
        .from('agent_memory')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(memLimit || 50);

      if (memoryType) {
        memQuery = memQuery.eq('memory_type', memoryType);
      }

      const { data: memories, error: memError } = await memQuery;
      if (memError) throw memError;

      return new Response(JSON.stringify({ memories: memories || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_sonic_dna') {
      const { agentId, sonicSignature } = body;
      
      if (!agentId) {
        return new Response(JSON.stringify({ error: 'agentId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Try to get existing
      const { data: existing, error: fetchError } = await supabase
        .from('sonic_dna_embeddings')
        .select('*')
        .eq('agent_id', agentId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        return new Response(JSON.stringify({ sonicDNA: existing }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create new if signature provided
      if (sonicSignature) {
        // Calculate traits using the database function
        const { data: traits } = await supabase
          .rpc('calculate_sonic_dna_traits', { p_sonic_signature: sonicSignature });

        const { data: created, error: createError } = await supabase
          .from('sonic_dna_embeddings')
          .insert({
            agent_id: agentId,
            sonic_signature: sonicSignature,
            personality_traits: traits || {},
            specialization_score: {},
            affinity_matrix: {}
          })
          .select()
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify({ sonicDNA: created, created: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ sonicDNA: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_agent_relationship') {
      const { agentAId, agentBId, success: relSuccess } = body;
      
      if (!agentAId || !agentBId || relSuccess === undefined) {
        return new Response(JSON.stringify({ error: 'agentAId, agentBId, and success are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Ensure consistent ordering
      const [firstId, secondId] = agentAId < agentBId ? [agentAId, agentBId] : [agentBId, agentAId];

      // Try to get existing
      const { data: existing, error: fetchRelError } = await supabase
        .from('agent_relationships')
        .select('*')
        .eq('agent_a_id', firstId)
        .eq('agent_b_id', secondId)
        .maybeSingle();

      if (fetchRelError) throw fetchRelError;

      if (existing) {
        const newCount = (existing.interaction_count || 0) + 1;
        const currentRate = existing.success_rate || 0.5;
        const newRate = (currentRate * existing.interaction_count + (relSuccess ? 1 : 0)) / newCount;

        const { data: updated, error: updateRelError } = await supabase
          .from('agent_relationships')
          .update({
            interaction_count: newCount,
            success_rate: newRate,
            synergy_score: Math.min(1, (existing.synergy_score || 0.5) + (relSuccess ? 0.02 : -0.01))
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateRelError) throw updateRelError;

        return new Response(JSON.stringify({ relationship: updated }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create new
      const { data: created, error: createRelError } = await supabase
        .from('agent_relationships')
        .insert({
          agent_a_id: firstId,
          agent_b_id: secondId,
          relationship_type: 'collaboration',
          synergy_score: relSuccess ? 0.55 : 0.45,
          interaction_count: 1,
          success_rate: relSuccess ? 1.0 : 0.0
        })
        .select()
        .single();

      if (createRelError) throw createRelError;

      return new Response(JSON.stringify({ relationship: created, created: true }), {
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
