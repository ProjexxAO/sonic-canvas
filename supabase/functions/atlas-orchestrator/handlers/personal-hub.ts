/**
 * Atlas Orchestrator - Personal Hub Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse, notFoundResponse } from "../utils.ts";
import { callAIGateway, getTodayISO } from "../utils.ts";

export async function createPersonalItem(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { itemType, title, content, metadata, tags, priority, dueDate, reminderAt, recurrenceRule } = req as any;

  const { data, error } = await ctx.supabase
    .from('personal_items')
    .insert({
      user_id: req.userId,
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

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    item: data,
    message: `${itemType || 'Task'} "${title}" created`
  });
}

export async function updatePersonalItem(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { itemId, updates } = req as any;

  const updateData: Record<string, any> = { ...updates, updated_at: new Date().toISOString() };

  if (updates.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await ctx.supabase
    .from('personal_items')
    .update(updateData)
    .eq('id', itemId)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    item: data,
    message: 'Item updated'
  });
}

export async function completePersonalItem(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { itemId, itemTitle } = req as any;

  let targetId = itemId;

  if (!targetId && itemTitle) {
    const { data: items } = await ctx.supabase
      .from('personal_items')
      .select('id, title')
      .eq('user_id', req.userId)
      .eq('status', 'active')
      .ilike('title', `%${itemTitle}%`)
      .limit(1);

    if (items && items.length > 0) {
      targetId = items[0].id;
    }
  }

  if (!targetId) {
    return notFoundResponse('Item not found');
  }

  const { data, error } = await ctx.supabase
    .from('personal_items')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', targetId)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    item: data,
    message: `"${data.title}" completed`
  });
}

export async function deletePersonalItem(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { itemId, itemTitle } = req as any;

  let targetId = itemId;

  if (!targetId && itemTitle) {
    const { data: items } = await ctx.supabase
      .from('personal_items')
      .select('id, title')
      .eq('user_id', req.userId)
      .neq('status', 'deleted')
      .ilike('title', `%${itemTitle}%`)
      .limit(1);

    if (items && items.length > 0) {
      targetId = items[0].id;
    }
  }

  if (!targetId) {
    return notFoundResponse('Item not found');
  }

  const { data, error } = await ctx.supabase
    .from('personal_items')
    .update({
      status: 'deleted',
      updated_at: new Date().toISOString()
    })
    .eq('id', targetId)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    message: `"${data.title}" deleted`
  });
}

export async function getPersonalItems(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { itemType, status, limit: queryLimit } = req as any;

  let query = ctx.supabase
    .from('personal_items')
    .select('*')
    .eq('user_id', req.userId)
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

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ items: data || [] });
}

export async function createPersonalGoal(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { title, description, category, targetValue, unit, targetDate } = req as any;

  const { data, error } = await ctx.supabase
    .from('personal_goals')
    .insert({
      user_id: req.userId,
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

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    goal: data,
    message: `Goal "${title}" created`
  });
}

export async function updateGoalProgress(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { goalId, goalTitle, value, increment } = req as any;

  let targetId = goalId;
  let currentGoal: any = null;

  if (!targetId && goalTitle) {
    const { data: goals } = await ctx.supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', 'active')
      .ilike('title', `%${goalTitle}%`)
      .limit(1);

    if (goals && goals.length > 0) {
      currentGoal = goals[0];
      targetId = goals[0].id;
    }
  } else if (targetId) {
    const { data: goal } = await ctx.supabase
      .from('personal_goals')
      .select('*')
      .eq('id', targetId)
      .single();
    currentGoal = goal;
  }

  if (!targetId || !currentGoal) {
    return notFoundResponse('Goal not found');
  }

  const newValue = increment
    ? (currentGoal.current_value || 0) + increment
    : value;

  const updates: Record<string, any> = {
    current_value: newValue,
    updated_at: new Date().toISOString()
  };

  if (currentGoal.target_value && newValue >= currentGoal.target_value) {
    updates.status = 'completed';
  }

  const { data, error } = await ctx.supabase
    .from('personal_goals')
    .update(updates)
    .eq('id', targetId)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    goal: data,
    message: `Goal progress updated to ${newValue}${currentGoal.unit ? ` ${currentGoal.unit}` : ''}`
  });
}

export async function createPersonalHabit(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { name, description, frequency, targetCount } = req as any;

  const { data, error } = await ctx.supabase
    .from('personal_habits')
    .insert({
      user_id: req.userId,
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

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    habit: data,
    message: `Habit "${name}" created`
  });
}

export async function completeHabit(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { habitId, habitName } = req as any;

  let targetId = habitId;
  let currentHabit: any = null;

  if (!targetId && habitName) {
    const { data: habits } = await ctx.supabase
      .from('personal_habits')
      .select('*')
      .eq('user_id', req.userId)
      .eq('is_active', true)
      .ilike('name', `%${habitName}%`)
      .limit(1);

    if (habits && habits.length > 0) {
      currentHabit = habits[0];
      targetId = habits[0].id;
    }
  } else if (targetId) {
    const { data: habit } = await ctx.supabase
      .from('personal_habits')
      .select('*')
      .eq('id', targetId)
      .single();
    currentHabit = habit;
  }

  if (!targetId || !currentHabit) {
    return notFoundResponse('Habit not found');
  }

  await ctx.supabase
    .from('habit_completions')
    .insert({
      habit_id: targetId,
      user_id: req.userId,
    });

  const newStreak = (currentHabit.current_streak || 0) + 1;
  const { data, error } = await ctx.supabase
    .from('personal_habits')
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, currentHabit.longest_streak || 0),
      last_completed_at: new Date().toISOString(),
    })
    .eq('id', targetId)
    .eq('user_id', req.userId)
    .select()
    .single();

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({
    success: true,
    habit: data,
    message: `${currentHabit.name} completed! 🎯 ${newStreak} day streak`
  });
}

export async function getPersonalSummary(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const [itemsResult, goalsResult, habitsResult] = await Promise.all([
    ctx.supabase
      .from('personal_items')
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20),
    ctx.supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', req.userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10),
    ctx.supabase
      .from('personal_habits')
      .select('*')
      .eq('user_id', req.userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const tasks = (itemsResult.data || []).filter((i: any) => i.item_type === 'task');
  const goals = goalsResult.data || [];
  const habits = habitsResult.data || [];

  const today = getTodayISO();
  const todaysTasks = tasks.filter((t: any) => t.due_date?.startsWith(today));
  const overdueTasks = tasks.filter((t: any) => t.due_date && t.due_date < today);

  return successResponse({
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
        totalStreak: habits.reduce((sum: number, h: any) => sum + (h.current_streak || 0), 0),
        items: habits.slice(0, 5),
      },
    }
  });
}

export async function syncMemoryTasks(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const { data: memoryMessages, error: memError } = await ctx.supabase
    .from('user_memory_messages')
    .select('id, content, role, created_at, metadata')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (memError) {
    return errorResponse(memError.message, 500);
  }

  if (!memoryMessages || memoryMessages.length === 0) {
    return successResponse({ tasks: [], message: 'No memory to extract tasks from' });
  }

  const conversationText = memoryMessages
    .reverse()
    .map((m: any) => `${m.role === 'user' ? 'User' : 'Atlas'}: ${m.content}`)
    .join('\n');

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

  const aiResult = await callAIGateway(ctx.lovableApiKey, [
    { role: 'system', content: 'You are a task extraction assistant. Extract actionable tasks from conversations and return them as JSON.' },
    { role: 'user', content: extractionPrompt },
  ]);

  if (aiResult.status !== 200) {
    return { status: aiResult.status, body: aiResult.body };
  }

  const extractedContent = aiResult.body.response || '';
  let extractedTasks: any[] = [];
  try {
    const jsonMatch = extractedContent.match(/\[[\s\S]*\]/);
    extractedTasks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (e) {
    console.error('Failed to parse extracted tasks:', e);
    extractedTasks = [];
  }

  if (extractedTasks.length === 0) {
    return successResponse({ tasks: [], message: 'No actionable tasks found in memory' });
  }

  const { data: existingTasks } = await ctx.supabase
    .from('agent_task_queue')
    .select('task_title')
    .eq('user_id', req.userId)
    .in('status', ['pending', 'in_progress', 'awaiting_approval']);

  const existingTitles = new Set((existingTasks || []).map((t: any) => t.task_title.toLowerCase()));

  const newTasks = extractedTasks.filter(
    (t: any) => !existingTitles.has(t.title.toLowerCase())
  );

  if (newTasks.length > 0) {
    const tasksToInsert = newTasks.map((t: any) => ({
      user_id: req.userId,
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

    const { data: insertedTasks, error: insertError } = await ctx.supabase
      .from('agent_task_queue')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      return errorResponse(insertError.message, 500);
    }

    return successResponse({
      tasks: insertedTasks,
      extracted: extractedTasks.length,
      inserted: newTasks.length,
      message: `Extracted ${extractedTasks.length} tasks, inserted ${newTasks.length} new tasks`
    });
  }

  return successResponse({
    tasks: [],
    extracted: extractedTasks.length,
    inserted: 0,
    message: `Found ${extractedTasks.length} tasks but all already exist`
  });
}
