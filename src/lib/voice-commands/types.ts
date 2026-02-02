/**
 * Extended Voice Command Type Definitions
 * Supports all Atlas domains with universal capabilities
 */

import { DomainKey } from '@/hooks/useCSuiteData';

// ============================================================================
// Base Command Types (existing)
// ============================================================================

export type BaseVoiceCommand = 
  // Navigation
  | { type: 'navigate'; path: string }
  | { type: 'show_notification'; message: string; variant?: 'success' | 'error' | 'info' }
  
  // Filtering & Search
  | { type: 'filter'; entity: string; criteria: Record<string, any> }
  | { type: 'search'; query: string; scope?: 'agents' | 'documents' | 'all' | 'tasks' | 'emails' | 'events' }
  | { type: 'clear_filters' }
  
  // Data Hub Control
  | { type: 'switch_tab'; tab: 'command' | 'insights' | 'admin' }
  | { type: 'expand_domain'; domain: DomainKey }
  | { type: 'collapse_domain' }
  | { type: 'switch_persona'; persona: string }
  
  // Reports & Analysis
  | { type: 'generate_report'; persona?: string }
  | { type: 'run_query'; query: string }
  | { type: 'refresh_data' }
  | { type: 'export_data'; format?: 'csv' | 'pdf' | 'json'; entity?: string }
  
  // Theme & UI
  | { type: 'toggle_theme' }
  | { type: 'set_theme'; theme: 'light' | 'dark' }
  | { type: 'toggle_fullscreen' }
  | { type: 'toggle_sidebar' }
  
  // Agent Control
  | { type: 'select_agent'; agentId: string }
  | { type: 'filter_agents'; sector?: string; status?: string; capability?: string }
  | { type: 'train_agent'; agentId?: string; taskType?: string }
  | { type: 'allocate_agents'; taskId?: string; count?: number }
  | { type: 'create_swarm'; agentIds?: string[]; purpose?: string }
  | { type: 'get_agent_status'; agentId?: string }
  | { type: 'transfer_knowledge'; fromAgentId?: string; toAgentId?: string }
  
  // Voice Responses
  | { type: 'voice_response'; text: string }
  
  // Workflows
  | { type: 'trigger_workflow'; workflowId: string }
  | { type: 'create_workflow'; name: string; description?: string }
  | { type: 'list_workflows' }
  | { type: 'stop_workflow'; workflowId?: string }
  
  // Dialogs
  | { type: 'open_dialog'; dialog: 'create_agent' | 'import_agents' | 'connect_platform' | 'create_channel' | 'compose_email' | 'create_task' | 'create_event' | 'create_widget' | 'settings' | 'add_bank_account' }
  
  // Email / Communications
  | { type: 'draft_email'; to?: string; subject?: string; intent: string }
  | { type: 'send_email'; to: string; subject?: string; content?: string }
  | { type: 'compose_email'; to: string; subject?: string; intent: string; urgency?: 'low' | 'normal' | 'high' }
  | { type: 'open_communications' }
  | { type: 'check_inbox' }
  | { type: 'reply_to_email'; emailId?: string; intent?: string }
  | { type: 'forward_email'; emailId?: string; to?: string }
  
  // Tasks
  | { type: 'create_task'; title: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'critical'; dueDate?: string }
  | { type: 'complete_task'; taskId?: string; taskTitle?: string }
  | { type: 'update_task'; taskId?: string; updates: Record<string, any> }
  | { type: 'list_tasks'; filter?: 'all' | 'today' | 'overdue' | 'upcoming' }
  | { type: 'delete_task'; taskId?: string; taskTitle?: string }
  | { type: 'assign_task'; taskId?: string; agentId?: string }
  
  // Notes & Reminders
  | { type: 'create_note'; title: string; content?: string; tags?: string[] }
  | { type: 'create_reminder'; title: string; reminderAt: string; description?: string }
  | { type: 'list_notes' }
  | { type: 'search_notes'; query: string }
  
  // Goals & Habits
  | { type: 'create_goal'; title: string; targetValue?: number; targetDate?: string; category?: string }
  | { type: 'update_goal_progress'; goalId?: string; value: number }
  | { type: 'list_goals' }
  | { type: 'create_habit'; name: string; frequency: 'daily' | 'weekly' | 'monthly' }
  | { type: 'complete_habit'; habitId?: string; habitName?: string }
  | { type: 'get_habit_streak'; habitName?: string }
  
  // Calendar & Events
  | { type: 'create_event'; title: string; startAt: string; endAt?: string; location?: string; attendees?: string[] }
  | { type: 'list_events'; timeframe?: 'today' | 'tomorrow' | 'this_week' | 'next_week' }
  | { type: 'cancel_event'; eventId?: string; eventTitle?: string }
  | { type: 'reschedule_event'; eventId?: string; newTime: string }
  | { type: 'get_availability'; date?: string }
  | { type: 'block_time'; startAt: string; endAt: string; reason?: string }
  | { type: 'show_calendar' }
  
  // Banking & Finance
  | { type: 'check_balance'; accountId?: string }
  | { type: 'list_transactions'; filter?: 'recent' | 'pending' | 'all'; accountId?: string }
  | { type: 'categorize_transaction'; transactionId?: string; category: string }
  | { type: 'get_financial_summary'; period?: 'today' | 'week' | 'month' | 'year' }
  | { type: 'reconcile_accounts' }
  | { type: 'add_expense'; amount: number; category: string; description?: string }
  | { type: 'set_budget'; category: string; amount: number; period?: 'monthly' | 'weekly' }
  | { type: 'get_cash_flow' }
  
  // Widgets
  | { type: 'create_widget'; purpose: string; dataSource?: string }
  | { type: 'update_widget'; widgetId?: string; updates: Record<string, any> }
  | { type: 'delete_widget'; widgetId?: string; widgetName?: string }
  | { type: 'list_widgets' }
  | { type: 'refresh_widget'; widgetId?: string }
  
  // Documents
  | { type: 'upload_file'; category?: string }
  | { type: 'search_documents'; query: string }
  | { type: 'list_documents'; category?: string }
  | { type: 'analyze_document'; documentId?: string }
  | { type: 'summarize_document'; documentId?: string }
  | { type: 'create_document'; title: string; content?: string; docType?: string }
  
  // Knowledge
  | { type: 'save_knowledge'; title: string; content: string; category?: string }
  | { type: 'search_knowledge'; query: string }
  | { type: 'get_insights'; topic?: string }
  | { type: 'ask_atlas'; question: string }
  
  // Dashboard
  | { type: 'add_to_dashboard'; widgetType: string }
  | { type: 'rearrange_dashboard' }
  | { type: 'reset_dashboard' }
  | { type: 'share_dashboard'; email?: string }
  
  // Help & Assistance
  | { type: 'get_help'; topic?: string }
  | { type: 'show_tutorial'; feature?: string }
  | { type: 'list_commands' }
  | { type: 'what_can_you_do' }
  
  // System
  | { type: 'sync_all' }
  | { type: 'clear_cache' }
  | { type: 'check_status' }
  | { type: 'get_summary' };

// ============================================================================
// NEW: CRM & Contacts Commands
// ============================================================================

export type CRMCommand =
  | { type: 'create_contact'; name: string; email?: string; phone?: string; company?: string; role?: string }
  | { type: 'update_contact'; contactId?: string; name?: string; updates: Record<string, any> }
  | { type: 'delete_contact'; contactId?: string; name?: string }
  | { type: 'search_contacts'; query: string }
  | { type: 'list_contacts'; filter?: 'all' | 'recent' | 'favorites' }
  | { type: 'log_interaction'; contactId?: string; contactName?: string; interactionType: 'call' | 'email' | 'meeting' | 'note'; summary: string }
  | { type: 'get_contact_history'; contactId?: string; contactName?: string }
  | { type: 'create_lead'; name: string; email?: string; source?: string; value?: number }
  | { type: 'update_lead_status'; leadId?: string; status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' }
  | { type: 'list_leads'; filter?: 'all' | 'hot' | 'warm' | 'cold' }
  | { type: 'create_deal'; title: string; value: number; contactId?: string; stage?: string }
  | { type: 'update_deal'; dealId?: string; updates: Record<string, any> }
  | { type: 'get_pipeline_summary' }
  | { type: 'schedule_followup'; contactId?: string; contactName?: string; followupDate: string; note?: string };

// ============================================================================
// NEW: Project Management Commands
// ============================================================================

export type ProjectCommand =
  | { type: 'create_project'; name: string; description?: string; deadline?: string; priority?: 'low' | 'medium' | 'high' }
  | { type: 'update_project'; projectId?: string; projectName?: string; updates: Record<string, any> }
  | { type: 'delete_project'; projectId?: string; projectName?: string }
  | { type: 'list_projects'; filter?: 'all' | 'active' | 'completed' | 'on_hold' }
  | { type: 'get_project_status'; projectId?: string; projectName?: string }
  | { type: 'create_milestone'; projectId?: string; title: string; dueDate: string }
  | { type: 'complete_milestone'; milestoneId?: string; title?: string }
  | { type: 'assign_team_member'; projectId?: string; memberId?: string; memberName?: string; role?: string }
  | { type: 'remove_team_member'; projectId?: string; memberId?: string }
  | { type: 'get_project_timeline'; projectId?: string }
  | { type: 'create_sprint'; projectId?: string; name: string; startDate: string; endDate: string }
  | { type: 'add_to_sprint'; sprintId?: string; taskId?: string }
  | { type: 'get_sprint_burndown'; sprintId?: string }
  | { type: 'create_epic'; title: string; description?: string; projectId?: string }
  | { type: 'link_tasks_to_epic'; epicId?: string; taskIds: string[] };

// ============================================================================
// NEW: Analytics & Reporting Commands
// ============================================================================

export type AnalyticsCommand =
  | { type: 'get_analytics'; metric: string; period?: string }
  | { type: 'compare_periods'; metric: string; period1: string; period2: string }
  | { type: 'get_trends'; metric: string; timeRange?: 'week' | 'month' | 'quarter' | 'year' }
  | { type: 'create_dashboard_widget'; metric: string; chartType?: 'line' | 'bar' | 'pie' | 'area' }
  | { type: 'schedule_report'; reportType: string; frequency: 'daily' | 'weekly' | 'monthly'; recipients?: string[] }
  | { type: 'get_kpi_summary'; category?: string }
  | { type: 'set_alert'; metric: string; threshold: number; condition: 'above' | 'below' | 'equals' }
  | { type: 'get_forecast'; metric: string; periods: number }
  | { type: 'run_analysis'; analysisType: 'cohort' | 'funnel' | 'retention' | 'segmentation'; parameters?: Record<string, any> }
  | { type: 'export_analytics'; format: 'csv' | 'pdf' | 'excel'; metrics?: string[] };

// ============================================================================
// NEW: Smart Home / IoT Commands
// ============================================================================

export type IoTCommand =
  | { type: 'control_device'; deviceId?: string; deviceName?: string; action: 'on' | 'off' | 'toggle' | 'dim' | 'set' }
  | { type: 'set_device_value'; deviceId?: string; deviceName?: string; value: number | string }
  | { type: 'get_device_status'; deviceId?: string; deviceName?: string }
  | { type: 'list_devices'; room?: string; deviceType?: string }
  | { type: 'create_scene'; name: string; devices: Array<{ deviceId: string; action: string; value?: any }> }
  | { type: 'activate_scene'; sceneName: string }
  | { type: 'set_schedule'; deviceId?: string; schedule: { time: string; action: string; days?: string[] } }
  | { type: 'get_energy_usage'; period?: 'day' | 'week' | 'month' }
  | { type: 'set_thermostat'; temperature: number; mode?: 'heat' | 'cool' | 'auto' }
  | { type: 'lock_door'; doorId?: string; doorName?: string }
  | { type: 'unlock_door'; doorId?: string; doorName?: string }
  | { type: 'arm_security'; mode?: 'home' | 'away' | 'night' }
  | { type: 'disarm_security' };

// ============================================================================
// NEW: Scheduled & Recurring Commands
// ============================================================================

export type ScheduledCommand =
  | { type: 'schedule_command'; command: VoiceCommand; executeAt: string; recurring?: boolean; frequency?: 'daily' | 'weekly' | 'monthly' }
  | { type: 'list_scheduled_commands' }
  | { type: 'cancel_scheduled_command'; scheduleId: string }
  | { type: 'set_daily_routine'; name: string; time: string; commands: VoiceCommand[] }
  | { type: 'run_routine'; routineName: string }
  | { type: 'snooze_reminder'; reminderId?: string; duration?: number };

// ============================================================================
// NEW: Multi-Step Workflow Commands
// ============================================================================

export type MultiStepCommand =
  | { type: 'chain_commands'; commands: VoiceCommand[]; waitForConfirmation?: boolean }
  | { type: 'conditional_command'; condition: string; ifTrue: VoiceCommand; ifFalse?: VoiceCommand }
  | { type: 'batch_create'; entityType: 'task' | 'event' | 'contact' | 'note'; items: any[] }
  | { type: 'copy_to_calendar'; taskId?: string; eventDetails?: Partial<{ startAt: string; endAt: string }> }
  | { type: 'email_summary'; recipientEmail: string; summaryType: 'daily' | 'weekly' | 'project' | 'financial' }
  | { type: 'create_from_template'; templateName: string; parameters?: Record<string, any> }
  | { type: 'bulk_update'; entityType: string; filter: Record<string, any>; updates: Record<string, any> };

// ============================================================================
// NEW: Context-Aware Commands
// ============================================================================

export type ContextAwareCommand =
  | { type: 'do_this_later'; deferMinutes?: number }
  | { type: 'remind_about_this'; reminderTime: string }
  | { type: 'share_this'; recipientEmail: string; message?: string }
  | { type: 'add_this_to_project'; projectId?: string; projectName?: string }
  | { type: 'convert_to_task'; priority?: 'low' | 'medium' | 'high' }
  | { type: 'analyze_selected' }
  | { type: 'summarize_selected' }
  | { type: 'explain_this' }
  | { type: 'find_similar' }
  | { type: 'get_context' };

// ============================================================================
// NEW: Interaction Mode Commands
// ============================================================================

export type InteractionCommand =
  | { type: 'set_interaction_mode'; mode: 'autonomous' | 'preview' | 'conversational' }
  | { type: 'enable_confirmations' }
  | { type: 'disable_confirmations' }
  | { type: 'set_verbosity'; level: 'minimal' | 'normal' | 'detailed' }
  | { type: 'undo_last' }
  | { type: 'redo_last' }
  | { type: 'cancel_current' }
  | { type: 'pause_atlas' }
  | { type: 'resume_atlas' }
  | { type: 'request_clarification'; question: string; options?: string[] };

// ============================================================================
// NEW: Automation & Webhook Commands
// ============================================================================

export type AutomationTrigger = 
  | 'email_received' 
  | 'email_sent' 
  | 'contact_added' 
  | 'task_completed' 
  | 'event_created' 
  | 'expense_added'
  | 'goal_completed'
  | 'habit_completed'
  | 'document_uploaded'
  | 'custom';

export type AutomationProvider = 'zapier' | 'make' | 'n8n' | 'custom';

export type AutomationCommand =
  | { type: 'create_automation'; name: string; trigger: AutomationTrigger; webhookUrl?: string; provider?: AutomationProvider; description?: string }
  | { type: 'list_automations'; filter?: 'all' | 'active' | 'inactive' }
  | { type: 'toggle_automation'; automationId?: string; automationName?: string }
  | { type: 'delete_automation'; automationId?: string; automationName?: string }
  | { type: 'test_automation'; automationId?: string; automationName?: string }
  | { type: 'trigger_webhook'; webhookUrl: string; payload?: Record<string, any> }
  | { type: 'connect_zapier'; webhookUrl: string; triggerType?: AutomationTrigger }
  | { type: 'connect_make'; webhookUrl: string; triggerType?: AutomationTrigger }
  | { type: 'connect_n8n'; webhookUrl: string; triggerType?: AutomationTrigger }
  | { type: 'create_workflow_automation'; name: string; steps: Array<{ action: string; config?: Record<string, any> }> }
  | { type: 'get_automation_history'; automationId?: string; automationName?: string }
  | { type: 'set_automation_schedule'; automationId?: string; schedule: string; timezone?: string };

// ============================================================================
// Combined Voice Command Type
// ============================================================================

export type VoiceCommand = 
  | BaseVoiceCommand
  | CRMCommand
  | ProjectCommand
  | AnalyticsCommand
  | IoTCommand
  | ScheduledCommand
  | MultiStepCommand
  | ContextAwareCommand
  | InteractionCommand
  | AutomationCommand;

// ============================================================================
// Command Categories
// ============================================================================

export const EXTENDED_COMMAND_CATEGORIES = {
  navigation: ['navigate', 'expand_domain', 'collapse_domain', 'switch_tab', 'switch_persona'],
  communication: ['draft_email', 'send_email', 'compose_email', 'open_communications', 'check_inbox', 'reply_to_email', 'forward_email'],
  tasks: ['create_task', 'complete_task', 'update_task', 'list_tasks', 'delete_task', 'assign_task'],
  calendar: ['create_event', 'list_events', 'cancel_event', 'reschedule_event', 'get_availability', 'block_time', 'show_calendar'],
  finance: ['check_balance', 'list_transactions', 'get_financial_summary', 'reconcile_accounts', 'add_expense', 'set_budget', 'get_cash_flow'],
  agents: ['filter_agents', 'train_agent', 'allocate_agents', 'create_swarm', 'get_agent_status', 'transfer_knowledge'],
  notes: ['create_note', 'create_reminder', 'list_notes', 'search_notes'],
  goals: ['create_goal', 'update_goal_progress', 'list_goals', 'create_habit', 'complete_habit', 'get_habit_streak'],
  widgets: ['create_widget', 'update_widget', 'delete_widget', 'list_widgets', 'refresh_widget'],
  documents: ['upload_file', 'search_documents', 'list_documents', 'analyze_document', 'summarize_document', 'create_document'],
  knowledge: ['save_knowledge', 'search_knowledge', 'get_insights', 'ask_atlas'],
  reports: ['generate_report', 'run_query', 'export_data'],
  system: ['refresh_data', 'toggle_theme', 'set_theme', 'sync_all', 'clear_cache', 'check_status', 'get_summary'],
  help: ['get_help', 'show_tutorial', 'list_commands', 'what_can_you_do'],
  // NEW categories
  crm: ['create_contact', 'update_contact', 'search_contacts', 'list_contacts', 'log_interaction', 'create_lead', 'update_lead_status', 'create_deal', 'get_pipeline_summary', 'schedule_followup'],
  projects: ['create_project', 'update_project', 'list_projects', 'get_project_status', 'create_milestone', 'assign_team_member', 'create_sprint', 'get_sprint_burndown', 'create_epic'],
  analytics: ['get_analytics', 'compare_periods', 'get_trends', 'schedule_report', 'get_kpi_summary', 'set_alert', 'get_forecast', 'run_analysis'],
  iot: ['control_device', 'set_device_value', 'get_device_status', 'list_devices', 'create_scene', 'activate_scene', 'set_thermostat', 'arm_security'],
  scheduling: ['schedule_command', 'list_scheduled_commands', 'cancel_scheduled_command', 'set_daily_routine', 'run_routine'],
  workflows: ['chain_commands', 'batch_create', 'email_summary', 'create_from_template', 'bulk_update'],
  context: ['do_this_later', 'remind_about_this', 'share_this', 'convert_to_task', 'analyze_selected', 'explain_this'],
  interaction: ['set_interaction_mode', 'enable_confirmations', 'undo_last', 'cancel_current', 'pause_atlas', 'resume_atlas'],
  automation: ['create_automation', 'list_automations', 'toggle_automation', 'delete_automation', 'test_automation', 'trigger_webhook', 'connect_zapier', 'connect_make', 'connect_n8n', 'create_workflow_automation', 'get_automation_history', 'set_automation_schedule'],
} as const;

export type CommandCategory = keyof typeof EXTENDED_COMMAND_CATEGORIES;

// ============================================================================
// Interaction Mode Types
// ============================================================================

export type InteractionMode = 'autonomous' | 'preview' | 'conversational';

export interface CommandExecutionContext {
  mode: InteractionMode;
  requiresConfirmation: boolean;
  currentSelection?: any;
  recentCommands: VoiceCommand[];
  userId?: string;
  sessionId?: string;
}

export interface PendingCommand {
  command: VoiceCommand;
  context: CommandExecutionContext;
  preview?: {
    description: string;
    impact: 'low' | 'medium' | 'high';
    reversible: boolean;
  };
}
