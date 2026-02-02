import { create } from 'zustand';
import { DomainKey } from '@/hooks/useCSuiteData';

// ============================================================================
// Comprehensive Voice Command Types for Universal Atlas Control
// ============================================================================

export type VoiceCommand = 
  // === NAVIGATION ===
  | { type: 'navigate'; path: string }
  
  // === NOTIFICATIONS ===
  | { type: 'show_notification'; message: string; variant?: 'success' | 'error' | 'info' }
  
  // === FILTERING & SEARCH ===
  | { type: 'filter'; entity: string; criteria: Record<string, any> }
  | { type: 'search'; query: string; scope?: 'agents' | 'documents' | 'all' | 'tasks' | 'emails' | 'events' }
  | { type: 'clear_filters' }
  
  // === DATA HUB CONTROL ===
  | { type: 'switch_tab'; tab: 'command' | 'insights' | 'admin' }
  | { type: 'expand_domain'; domain: DomainKey }
  | { type: 'collapse_domain' }
  | { type: 'switch_persona'; persona: string }
  
  // === REPORTS & ANALYSIS ===
  | { type: 'generate_report'; persona?: string }
  | { type: 'run_query'; query: string }
  | { type: 'refresh_data' }
  | { type: 'export_data'; format?: 'csv' | 'pdf' | 'json'; entity?: string }
  
  // === THEME & UI ===
  | { type: 'toggle_theme' }
  | { type: 'set_theme'; theme: 'light' | 'dark' }
  | { type: 'toggle_fullscreen' }
  | { type: 'toggle_sidebar' }
  
  // === AGENT CONTROL ===
  | { type: 'select_agent'; agentId: string }
  | { type: 'filter_agents'; sector?: string; status?: string; capability?: string }
  | { type: 'train_agent'; agentId?: string; taskType?: string }
  | { type: 'allocate_agents'; taskId?: string; count?: number }
  | { type: 'create_swarm'; agentIds?: string[]; purpose?: string }
  | { type: 'get_agent_status'; agentId?: string }
  | { type: 'transfer_knowledge'; fromAgentId?: string; toAgentId?: string }
  
  // === VOICE RESPONSES ===
  | { type: 'voice_response'; text: string }
  
  // === WORKFLOW TRIGGERS ===
  | { type: 'trigger_workflow'; workflowId: string }
  | { type: 'create_workflow'; name: string; description?: string }
  | { type: 'list_workflows' }
  | { type: 'stop_workflow'; workflowId?: string }
  
  // === DIALOGS ===
  | { type: 'open_dialog'; dialog: 'create_agent' | 'import_agents' | 'connect_platform' | 'create_channel' | 'compose_email' | 'create_task' | 'create_event' | 'create_widget' | 'settings' | 'add_bank_account' }
  
  // === EMAIL / COMMUNICATIONS ===
  | { type: 'draft_email'; to?: string; subject?: string; intent: string }
  | { type: 'send_email'; to: string; subject?: string; content?: string }
  | { type: 'compose_email'; to: string; subject?: string; intent: string; urgency?: 'low' | 'normal' | 'high' }
  | { type: 'open_communications' }
  | { type: 'check_inbox' }
  | { type: 'reply_to_email'; emailId?: string; intent?: string }
  | { type: 'forward_email'; emailId?: string; to?: string }
  
  // === TASK MANAGEMENT ===
  | { type: 'create_task'; title: string; description?: string; priority?: 'low' | 'medium' | 'high' | 'critical'; dueDate?: string }
  | { type: 'complete_task'; taskId?: string; taskTitle?: string }
  | { type: 'update_task'; taskId?: string; updates: Record<string, any> }
  | { type: 'list_tasks'; filter?: 'all' | 'today' | 'overdue' | 'upcoming' }
  | { type: 'delete_task'; taskId?: string; taskTitle?: string }
  | { type: 'assign_task'; taskId?: string; agentId?: string }
  
  // === NOTES & REMINDERS ===
  | { type: 'create_note'; title: string; content?: string; tags?: string[] }
  | { type: 'create_reminder'; title: string; reminderAt: string; description?: string }
  | { type: 'list_notes' }
  | { type: 'search_notes'; query: string }
  
  // === GOALS & HABITS ===
  | { type: 'create_goal'; title: string; targetValue?: number; targetDate?: string; category?: string }
  | { type: 'update_goal_progress'; goalId?: string; value: number }
  | { type: 'list_goals' }
  | { type: 'create_habit'; name: string; frequency: 'daily' | 'weekly' | 'monthly' }
  | { type: 'complete_habit'; habitId?: string; habitName?: string }
  | { type: 'get_habit_streak'; habitName?: string }
  
  // === CALENDAR & EVENTS ===
  | { type: 'create_event'; title: string; startAt: string; endAt?: string; location?: string; attendees?: string[] }
  | { type: 'list_events'; timeframe?: 'today' | 'tomorrow' | 'this_week' | 'next_week' }
  | { type: 'cancel_event'; eventId?: string; eventTitle?: string }
  | { type: 'reschedule_event'; eventId?: string; newTime: string }
  | { type: 'get_availability'; date?: string }
  | { type: 'block_time'; startAt: string; endAt: string; reason?: string }
  | { type: 'show_calendar' }
  
  // === BANKING & FINANCE ===
  | { type: 'check_balance'; accountId?: string }
  | { type: 'list_transactions'; filter?: 'recent' | 'pending' | 'all'; accountId?: string }
  | { type: 'categorize_transaction'; transactionId?: string; category: string }
  | { type: 'get_financial_summary'; period?: 'today' | 'week' | 'month' | 'year' }
  | { type: 'reconcile_accounts' }
  | { type: 'add_expense'; amount: number; category: string; description?: string }
  | { type: 'set_budget'; category: string; amount: number; period?: 'monthly' | 'weekly' }
  | { type: 'get_cash_flow' }
  
  // === WIDGETS ===
  | { type: 'create_widget'; purpose: string; dataSource?: string }
  | { type: 'update_widget'; widgetId?: string; updates: Record<string, any> }
  | { type: 'delete_widget'; widgetId?: string; widgetName?: string }
  | { type: 'list_widgets' }
  | { type: 'refresh_widget'; widgetId?: string }
  
  // === FILE OPERATIONS ===
  | { type: 'upload_file'; category?: string }
  | { type: 'search_documents'; query: string }
  | { type: 'list_documents'; category?: string }
  | { type: 'analyze_document'; documentId?: string }
  | { type: 'summarize_document'; documentId?: string }
  | { type: 'create_document'; title: string; content?: string; docType?: string }
  
  // === KNOWLEDGE & LEARNING ===
  | { type: 'save_knowledge'; title: string; content: string; category?: string }
  | { type: 'search_knowledge'; query: string }
  | { type: 'get_insights'; topic?: string }
  | { type: 'ask_atlas'; question: string }
  
  // === DASHBOARD CONTROL ===
  | { type: 'add_to_dashboard'; widgetType: string }
  | { type: 'rearrange_dashboard' }
  | { type: 'reset_dashboard' }
  | { type: 'share_dashboard'; email?: string }
  
  // === HELP & ASSISTANCE ===
  | { type: 'get_help'; topic?: string }
  | { type: 'show_tutorial'; feature?: string }
  | { type: 'list_commands' }
  | { type: 'what_can_you_do' }
  
  // === SYSTEM ACTIONS ===
  | { type: 'sync_all' }
  | { type: 'clear_cache' }
  | { type: 'check_status' }
  | { type: 'get_summary' };

// ============================================================================
// Voice Command Bus State Management
// ============================================================================

interface VoiceCommandBusState {
  currentCommand: VoiceCommand | null;
  commandHistory: VoiceCommand[];
  isProcessing: boolean;
  lastExecutedAt: number | null;
  pendingConfirmation: VoiceCommand | null;
  
  sendCommand: (command: VoiceCommand) => void;
  clearCommand: () => void;
  setProcessing: (processing: boolean) => void;
  getHistory: () => VoiceCommand[];
  setPendingConfirmation: (command: VoiceCommand | null) => void;
  confirmPendingCommand: () => void;
  cancelPendingCommand: () => void;
}

export const useVoiceCommandBus = create<VoiceCommandBusState>((set, get) => ({
  currentCommand: null,
  commandHistory: [],
  isProcessing: false,
  lastExecutedAt: null,
  pendingConfirmation: null,
  
  sendCommand: (command) => {
    console.log('🎤 Voice Command Dispatched:', command);
    set((state) => ({ 
      currentCommand: command,
      commandHistory: [...state.commandHistory.slice(-49), command], // Keep last 50
      lastExecutedAt: Date.now()
    }));
  },
  
  clearCommand: () => {
    set({ currentCommand: null, isProcessing: false });
  },
  
  setProcessing: (processing) => {
    set({ isProcessing: processing });
  },
  
  getHistory: () => get().commandHistory,
  
  setPendingConfirmation: (command) => {
    set({ pendingConfirmation: command });
  },
  
  confirmPendingCommand: () => {
    const pending = get().pendingConfirmation;
    if (pending) {
      get().sendCommand(pending);
      set({ pendingConfirmation: null });
    }
  },
  
  cancelPendingCommand: () => {
    set({ pendingConfirmation: null });
  }
}));

// ============================================================================
// Command Categories for Help & Discovery
// ============================================================================

export const COMMAND_CATEGORIES = {
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
  help: ['get_help', 'show_tutorial', 'list_commands', 'what_can_you_do']
} as const;

export type CommandCategory = keyof typeof COMMAND_CATEGORIES;
