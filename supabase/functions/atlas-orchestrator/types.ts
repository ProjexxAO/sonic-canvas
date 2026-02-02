/**
 * Atlas Orchestrator - Shared Types
 *
 * Type definitions shared across all handler modules
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

// ============================================================================
// Core Types
// ============================================================================

export type OrchestratorAction =
  // UI Preferences
  | 'get_ui_preferences'
  | 'update_ui_preferences'
  // Task Queue
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'get_tasks'
  // Personal Hub
  | 'create_personal_item'
  | 'update_personal_item'
  | 'complete_personal_item'
  | 'delete_personal_item'
  | 'get_personal_items'
  | 'create_personal_goal'
  | 'update_goal_progress'
  | 'create_personal_habit'
  | 'complete_habit'
  | 'get_personal_summary'
  | 'sync_memory_tasks'
  // Conversation Memory
  | 'get_conversation_history'
  | 'chat'
  // Widget Agent
  | 'widget_initialize'
  | 'widget_execute'
  // Agent Orchestration
  | 'orchestrate_agents'
  | 'route_task'
  // Agent Memory & Performance
  | 'record_agent_performance'
  | 'get_agent_memory'
  | 'get_sonic_dna'
  | 'update_agent_relationship'
  | 'consolidate_memories'
  | 'crystallize_knowledge'
  | 'run_reflection'
  | 'send_notification'
  | 'get_notifications'
  | 'dismiss_notification'
  // Shared Dashboard
  | 'dashboard_list'
  | 'dashboard_select'
  | 'dashboard_messages'
  | 'dashboard_send_message'
  | 'dashboard_files'
  | 'dashboard_notifications'
  | 'dashboard_members'
  | 'dashboard_summary'
  // Search & Synthesis
  | 'search'
  | 'web_search'
  | 'synthesize';

export interface OrchestratorRequest {
  query?: string;
  action: OrchestratorAction;
  userId?: string;
  sessionId?: string;
  preferences?: Record<string, unknown>;
  taskData?: TaskData;
  notificationId?: string;
  [key: string]: unknown;
}

export interface TaskData {
  task_title: string;
  task_description?: string;
  task_priority?: 'low' | 'medium' | 'high' | 'critical';
  task_type?: string;
  orchestration_mode?: string;
  input_data?: Record<string, unknown>;
  due_date?: string;
}

export interface HandlerContext {
  supabase: SupabaseClient;
  corsHeaders: Record<string, string>;
  userId: string | null;
  sessionId?: string;
  lovableApiKey: string;
}

export interface HandlerResult {
  status: number;
  body: Record<string, unknown>;
}

// ============================================================================
// Personal Hub Types
// ============================================================================

export interface PersonalItem {
  id: string;
  user_id: string;
  item_type: 'task' | 'note' | 'reminder' | 'goal' | 'habit';
  title: string;
  content?: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  status: 'active' | 'completed' | 'deleted';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string | null;
  reminder_at?: string | null;
  recurrence_rule?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category: string;
  target_value?: number | null;
  current_value: number;
  unit?: string | null;
  target_date?: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface PersonalHabit {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  current_streak: number;
  longest_streak: number;
  last_completed_at?: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// Agent Types
// ============================================================================

export interface SonicAgent {
  id: string;
  name: string;
  sector: string;
  description?: string | null;
  capabilities?: string[] | null;
  status?: string;
  total_tasks_completed?: number;
  success_rate?: number;
  specialization_level?: string;
  task_specializations?: Record<string, number>;
  preferred_task_types?: string[];
  learning_velocity?: number;
  code_artifact?: string;
}

export interface AgentMemory {
  id: string;
  agent_id: string;
  user_id?: string | null;
  memory_type: 'interaction' | 'outcome' | 'learning' | 'preference';
  content: string;
  context?: Record<string, unknown>;
  importance_score: number;
  created_at: string;
}

export interface AgentPerformance {
  id: string;
  agent_id: string;
  user_id?: string | null;
  task_type: string;
  task_description?: string | null;
  success: boolean;
  execution_time_ms?: number | null;
  confidence_score?: number | null;
  error_type?: string | null;
  context: Record<string, unknown>;
  created_at: string;
}

export interface OrchestrationPlan {
  recommended_agents: RecommendedAgent[];
  orchestration_plan: string;
  task_type?: string;
  estimated_duration?: string;
  learning_opportunity?: string;
  routing_tier?: 'tier1' | 'tier2' | 'tier3';
  routing_time_ms?: number;
  llm_bypassed?: boolean;
}

export interface RecommendedAgent {
  agent_id: string;
  agent_name: string;
  role: string;
  confidence: number;
  requires_approval: boolean;
  reasoning: string;
  specialization_match?: 'high' | 'medium' | 'low' | 'none';
}

// ============================================================================
// Widget Types
// ============================================================================

export interface WidgetConfig {
  id?: string;
  name?: string;
  purpose?: string;
  description?: string;
  capabilities?: string[];
  dataSources?: string[];
}

export interface WidgetAction {
  action: string;
  params: Record<string, unknown>;
  execute: boolean;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface SharedDashboard {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardMember {
  user_id: string;
  dashboard_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  can_comment: boolean;
  can_share: boolean;
  can_upload: boolean;
  joined_at: string;
}

export interface DashboardMessage {
  id: string;
  dashboard_id: string;
  user_id: string;
  content: string;
  is_edited: boolean;
  mentions?: string[] | null;
  created_at: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface AgentNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source_agent_name?: string | null;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

// ============================================================================
// AI Gateway Types
// ============================================================================

export interface AIGatewayMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGatewayResponse {
  status: number;
  body: {
    response?: string;
    error?: string;
  };
}

// ============================================================================
// Workflow Types
// ============================================================================

export interface AtlasWorkflow {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}
