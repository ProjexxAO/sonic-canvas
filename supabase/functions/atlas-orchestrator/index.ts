/**
 * Atlas Orchestrator - Main Entry Point (Modular)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";
import { createCorsHeaders, handleCorsPreflightRequest, ValidationError } from "../_shared/utils.ts";
import type { OrchestratorRequest, HandlerContext, HandlerResult, OrchestratorAction } from "./types.ts";
import { errorResponse } from "./utils.ts";

import {
  getUIPreferences, updateUIPreferences,
  createTask, updateTask, deleteTask, getTasks,
  createPersonalItem, updatePersonalItem, completePersonalItem, deletePersonalItem,
  getPersonalItems, createPersonalGoal, updateGoalProgress, createPersonalHabit,
  completeHabit, getPersonalSummary, syncMemoryTasks,
  getConversationHistory, chat,
  sendNotification, getNotifications, dismissNotification,
  recordAgentPerformance, getAgentMemory, getSonicDNA, updateAgentRelationship,
  consolidateMemories, crystallizeKnowledge, runReflection, routeTask,
  orchestrateAgents,
  widgetInitialize, widgetExecute,
  dashboardList, dashboardSelect, dashboardMessages, dashboardSendMessage,
  dashboardFiles, dashboardNotifications, dashboardMembers, dashboardSummary,
  search, webSearch, synthesize,
} from "./handlers/index.ts";

type HandlerFn = (ctx: HandlerContext, req: OrchestratorRequest) => Promise<HandlerResult>;

const actionHandlers: Record<OrchestratorAction, HandlerFn> = {
  get_ui_preferences: getUIPreferences,
  update_ui_preferences: updateUIPreferences,
  create_task: createTask,
  update_task: updateTask,
  delete_task: deleteTask,
  get_tasks: getTasks,
  create_personal_item: createPersonalItem,
  update_personal_item: updatePersonalItem,
  complete_personal_item: completePersonalItem,
  delete_personal_item: deletePersonalItem,
  get_personal_items: getPersonalItems,
  create_personal_goal: createPersonalGoal,
  update_goal_progress: updateGoalProgress,
  create_personal_habit: createPersonalHabit,
  complete_habit: completeHabit,
  get_personal_summary: getPersonalSummary,
  sync_memory_tasks: syncMemoryTasks,
  get_conversation_history: getConversationHistory,
  chat: chat,
  widget_initialize: widgetInitialize,
  widget_execute: widgetExecute,
  orchestrate_agents: orchestrateAgents,
  route_task: routeTask,
  record_agent_performance: recordAgentPerformance,
  get_agent_memory: getAgentMemory,
  get_sonic_dna: getSonicDNA,
  update_agent_relationship: updateAgentRelationship,
  consolidate_memories: consolidateMemories,
  crystallize_knowledge: crystallizeKnowledge,
  run_reflection: runReflection,
  send_notification: sendNotification,
  get_notifications: getNotifications,
  dismiss_notification: dismissNotification,
  dashboard_list: dashboardList,
  dashboard_select: dashboardSelect,
  dashboard_messages: dashboardMessages,
  dashboard_send_message: dashboardSendMessage,
  dashboard_files: dashboardFiles,
  dashboard_notifications: dashboardNotifications,
  dashboard_members: dashboardMembers,
  dashboard_summary: dashboardSummary,
  search: search,
  web_search: webSearch,
  synthesize: synthesize,
};

serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = createCorsHeaders(req.headers.get('origin'));

  try {
    let body: OrchestratorRequest;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    const { query, action, userId, sessionId } = body;
    console.log(`Atlas orchestrator received action: ${action}, query: ${query}`);

    if (!action || !(action in actionHandlers)) {
      return new Response(
        JSON.stringify({ error: 'Unknown action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const ctx: HandlerContext = {
      supabase,
      corsHeaders,
      userId: userId || null,
      sessionId,
      lovableApiKey,
    };

    const handler = actionHandlers[action as OrchestratorAction];
    const result = await handler(ctx, body);

    return new Response(
      JSON.stringify(result.body),
      { status: result.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Atlas orchestrator error:', error);
    const result = errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
    return new Response(
      JSON.stringify(result.body),
      { status: result.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
