/**
 * Atlas Orchestrator - Widget Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse, unauthorizedResponse, callAIGateway, nowISO } from "../utils.ts";

export async function widgetInitialize(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  if (!ctx.userId) {
    return unauthorizedResponse();
  }

  const widgetConfig = (req as any).widgetConfig || {};
  const widgetContext = (req as any).context || {};
  const message = (req as any).message || req.query || `Initialize widget: ${widgetConfig?.name || 'Agent Widget'}`;

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

  const result = await callAIGateway(ctx.lovableApiKey, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ]);

  return { status: result.status, body: result.body };
}

export async function widgetExecute(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  if (!ctx.userId) {
    return unauthorizedResponse();
  }

  const widgetConfig = (req as any).widgetConfig || {};
  const widgetContext = (req as any).context || {};
  const conversationHistory = Array.isArray((req as any).conversationHistory) ? (req as any).conversationHistory : [];
  const message = (req as any).message || req.query || '';

  const dataSources = widgetConfig?.dataSources || [];
  const availableActions: string[] = [];

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

  availableActions.push('create_workflow', 'create_automation', 'send_notification', 'schedule_reminder');

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

ALWAYS execute real actions. Never just describe what you would do - DO IT.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
    { role: 'user' as const, content: message },
  ];

  const result = await callAIGateway(ctx.lovableApiKey, messages);

  if (result.status !== 200) {
    return { status: result.status, body: result.body };
  }

  const responseText = result.body.response || '';
  let executedAction = null;
  let actionResult = null;

  const actionMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (actionMatch) {
    try {
      const actionData = JSON.parse(actionMatch[1]);
      if (actionData.execute && actionData.action) {
        const execResult = await executeWidgetAction(ctx, actionData, widgetConfig);
        executedAction = actionData.action;
        actionResult = execResult;
      }
    } catch (e) {
      console.error('Failed to parse or execute action:', e);
    }
  }

  return successResponse({
    response: responseText,
    executedAction,
    actionResult,
  });
}

async function executeWidgetAction(
  ctx: HandlerContext,
  actionData: any,
  widgetConfig: any
): Promise<any> {
  const { action, params } = actionData;

  switch (action) {
    case 'create_task': {
      const { data, error } = await ctx.supabase
        .from('personal_items')
        .insert({
          user_id: ctx.userId,
          item_type: 'task',
          title: params?.title || 'New Task',
          content: params?.description || '',
          priority: params?.priority || 'medium',
          status: 'active',
        })
        .select()
        .single();
      return error ? { success: false, error: error.message } : { success: true, task: data };
    }

    case 'complete_task': {
      if (!params?.taskId) return { success: false, error: 'taskId required' };
      const { error } = await ctx.supabase
        .from('personal_items')
        .update({ status: 'completed', completed_at: nowISO() })
        .eq('id', params.taskId)
        .eq('user_id', ctx.userId);
      return error ? { success: false, error: error.message } : { success: true };
    }

    case 'create_goal': {
      const { data, error } = await ctx.supabase
        .from('personal_goals')
        .insert({
          user_id: ctx.userId,
          title: params?.title || 'New Goal',
          description: params?.description || '',
          target_value: params?.target || 100,
          current_value: 0,
          status: 'active',
        })
        .select()
        .single();
      return error ? { success: false, error: error.message } : { success: true, goal: data };
    }

    case 'update_goal_progress': {
      if (!params?.goalId || params?.progress === undefined) return { success: false, error: 'goalId and progress required' };
      const { error } = await ctx.supabase
        .from('personal_goals')
        .update({ current_value: params.progress })
        .eq('id', params.goalId)
        .eq('user_id', ctx.userId);
      return error ? { success: false, error: error.message } : { success: true };
    }

    case 'create_habit': {
      const { data, error } = await ctx.supabase
        .from('personal_habits')
        .insert({
          user_id: ctx.userId,
          name: params?.name || 'New Habit',
          description: params?.description || '',
          frequency: params?.frequency || 'daily',
          current_streak: 0,
          longest_streak: 0,
        })
        .select()
        .single();
      return error ? { success: false, error: error.message } : { success: true, habit: data };
    }

    case 'complete_habit': {
      if (!params?.habitId) return { success: false, error: 'habitId required' };
      const { data: habit } = await ctx.supabase
        .from('personal_habits')
        .select('current_streak, longest_streak')
        .eq('id', params.habitId)
        .eq('user_id', ctx.userId)
        .single();

      if (!habit) return { success: false, error: 'Habit not found' };

      const newStreak = (habit.current_streak || 0) + 1;
      const { error } = await ctx.supabase
        .from('personal_habits')
        .update({
          last_completed_at: nowISO(),
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, habit.longest_streak || 0),
        })
        .eq('id', params.habitId)
        .eq('user_id', ctx.userId);
      return error ? { success: false, error: error.message } : { success: true, newStreak };
    }

    case 'create_workflow': {
      const { data, error } = await ctx.supabase
        .from('atlas_workflows')
        .insert({
          user_id: ctx.userId,
          name: params?.name || 'New Workflow',
          description: params?.description || `Created by ${widgetConfig?.name || 'Widget'}`,
          trigger_type: params?.trigger_type || 'manual',
          trigger_config: params?.trigger_config || {},
          action_type: params?.action_type || 'send_notification',
          action_config: params?.action_config || {},
          is_active: true,
        })
        .select()
        .single();
      return error ? { success: false, error: error.message } : { success: true, workflow: data };
    }

    case 'send_notification': {
      const { data, error } = await ctx.supabase
        .from('agent_notifications')
        .insert({
          user_id: ctx.userId,
          title: params?.title || 'Widget Notification',
          message: params?.message || 'Notification from your widget',
          notification_type: params?.type || 'widget_alert',
          priority: params?.priority || 'medium',
          source_agent_name: widgetConfig?.name || 'Agent Widget',
          metadata: { widget_id: widgetConfig?.id, widget_name: widgetConfig?.name },
          is_read: false,
          is_dismissed: false,
        })
        .select()
        .single();
      return error ? { success: false, error: error.message } : { success: true, notification: data };
    }

    case 'schedule_reminder': {
      const reminderTime = params?.remind_at || new Date(Date.now() + 3600000).toISOString();
      const { data, error } = await ctx.supabase
        .from('personal_items')
        .insert({
          user_id: ctx.userId,
          item_type: 'reminder',
          title: params?.title || 'Reminder',
          content: params?.message || '',
          reminder_at: reminderTime,
          status: 'active',
          priority: 'medium',
        })
        .select()
        .single();
      return error ? { success: false, error: error.message } : { success: true, reminder: data };
    }

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}
