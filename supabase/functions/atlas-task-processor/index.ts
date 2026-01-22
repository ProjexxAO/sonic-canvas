import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry helper for transient network errors
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isTransient = lastError.message.includes('SSL') || 
                          lastError.message.includes('handshake') ||
                          lastError.message.includes('connection') ||
                          lastError.message.includes('network');
      if (!isTransient || attempt === maxRetries - 1) throw lastError;
      console.log(`Retry ${attempt + 1}/${maxRetries} after transient error: ${lastError.message}`);
      await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

interface Task {
  id: string;
  user_id: string;
  task_type: string;
  task_title: string;
  task_description?: string;
  task_priority: string;
  status: string;
  progress: number;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  created_at: string;
  started_at?: string;
}

// Process a single task using AI
async function processTask(
  supabase: any,
  task: Task,
  lovableApiKey: string
): Promise<{ success: boolean; progress: number; output?: any; error?: string }> {
  console.log(`Processing task: ${task.id} - ${task.task_title}`);

  try {
    // Determine task processing based on type
    const taskPrompt = `You are Atlas, an AI assistant processing a background task.

Task: ${task.task_title}
Description: ${task.task_description || 'No description provided'}
Type: ${task.task_type}
Priority: ${task.task_priority}
Current Progress: ${task.progress}%
Input Data: ${JSON.stringify(task.input_data || {})}

Analyze this task and provide:
1. What work can be done on this task right now
2. A progress update (as a percentage from ${task.progress} to 100)
3. Any output or results from your work
4. Whether the task is complete

Respond in JSON format:
{
  "work_done": "Description of work completed",
  "new_progress": <number 0-100>,
  "output": { "any": "relevant output data" },
  "is_complete": <boolean>,
  "next_steps": "What remains to be done if not complete"
}`;

    const response = await withRetry(async () => {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are Atlas, an AI task processor. Respond only with valid JSON.' },
            { role: 'user', content: taskPrompt }
          ],
          temperature: 0.3,
        }),
      });
      if (!res.ok) {
        throw new Error(`AI request failed: ${res.status}`);
      }
      return res;
    });

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
    const newProgress = Math.min(100, Math.max(task.progress, result.new_progress || task.progress + 10));
    const isComplete = result.is_complete || newProgress >= 100;

    // Update task in database
    const updates: Record<string, any> = {
      progress: newProgress,
      updated_at: new Date().toISOString(),
      output_data: {
        ...task.output_data,
        last_work: result.work_done,
        next_steps: result.next_steps,
        ...result.output,
        processed_at: new Date().toISOString(),
      },
    };

    if (isComplete) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    if (!task.started_at) {
      updates.started_at = new Date().toISOString();
    }

    await supabase
      .from('agent_task_queue')
      .update(updates)
      .eq('id', task.id);

    // Create notification for completed tasks
    if (isComplete) {
      await supabase
        .from('agent_notifications')
        .insert({
          user_id: task.user_id,
          notification_type: 'update',
          title: `Task Completed: ${task.task_title}`,
          message: result.work_done || 'Task has been completed successfully.',
          priority: task.task_priority === 'critical' ? 'high' : 'normal',
          source_agent_name: 'Atlas',
          related_entity_type: 'task',
          related_entity_id: task.id,
          metadata: { task_id: task.id, output: result.output },
        });
    }

    return {
      success: true,
      progress: newProgress,
      output: result,
    };
  } catch (error) {
    console.error(`Error processing task ${task.id}:`, error);
    
    // Update task with error info but don't fail it immediately
    await supabase
      .from('agent_task_queue')
      .update({
        updated_at: new Date().toISOString(),
        input_data: {
          ...task.input_data,
          last_error: error instanceof Error ? error.message : 'Unknown error',
          error_count: (task.input_data?.error_count || 0) + 1,
        },
      })
      .eq('id', task.id);

    return {
      success: false,
      progress: task.progress,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, userId, taskId } = body;
    
    console.log(`Task processor received action: ${action}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Process a single specific task
    if (action === 'process_task' && taskId) {
      const { data: task, error } = await supabase
        .from('agent_task_queue')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error || !task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const result = await processTask(supabase, task, lovableApiKey);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process all pending/in_progress tasks for a user
    if (action === 'process_user_tasks' && userId) {
      const { data: tasks, error } = await supabase
        .from('agent_task_queue')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'in_progress'])
        .order('task_priority', { ascending: false })
        .limit(10);

      if (error) throw error;

      const results = [];
      for (const task of tasks || []) {
        // Skip tasks that were recently processed (within last 30 seconds)
        const lastProcessed = task.output_data?.processed_at;
        if (lastProcessed) {
          const timeSince = Date.now() - new Date(lastProcessed).getTime();
          if (timeSince < 30000) {
            results.push({ id: task.id, skipped: true, reason: 'recently_processed' });
            continue;
          }
        }

        const result = await processTask(supabase, task, lovableApiKey);
        results.push({ id: task.id, ...result });
      }

      return new Response(JSON.stringify({ 
        processed: results.length,
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Background sweep - process all pending tasks across all users
    if (action === 'background_sweep') {
      const { data: tasks, error } = await supabase
        .from('agent_task_queue')
        .select('*')
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) throw error;

      const results = [];
      for (const task of tasks || []) {
        // Skip tasks with too many errors
        if ((task.input_data?.error_count || 0) >= 5) {
          await supabase
            .from('agent_task_queue')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('id', task.id);
          results.push({ id: task.id, failed: true, reason: 'max_errors' });
          continue;
        }

        // Skip recently processed tasks
        const lastProcessed = task.output_data?.processed_at;
        if (lastProcessed) {
          const timeSince = Date.now() - new Date(lastProcessed).getTime();
          if (timeSince < 60000) { // 1 minute cooldown for background sweep
            results.push({ id: task.id, skipped: true, reason: 'cooldown' });
            continue;
          }
        }

        const result = await processTask(supabase, task, lovableApiKey);
        results.push({ id: task.id, ...result });
        
        // Small delay between tasks to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return new Response(JSON.stringify({ 
        processed: results.filter(r => !r.skipped).length,
        skipped: results.filter(r => r.skipped).length,
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Task processor error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
