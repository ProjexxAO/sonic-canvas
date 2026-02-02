import { VoiceCommand, COMMAND_CATEGORIES } from './voice-command-bus';
import { getDomainKeyFromName, getTabFromName, getPersonaFromName } from '@/hooks/useDataHubController';

interface ParsedIntent {
  command: VoiceCommand;
  confidence: number;
  original: string;
}

// ============================================================================
// Universal Voice Intent Parser - Supports ALL Atlas Commands
// ============================================================================

export class VoiceIntentParser {
  
  // Comprehensive route mapping for all app pages
  private routeMap: Record<string, string> = {
    // Main pages
    'dashboard': '/atlas',
    'home': '/atlas',
    'main': '/atlas',
    'index': '/',
    'agents': '/',
    'sonic nodes': '/',
    'agent dashboard': '/atlas',
    'atlas': '/atlas',
    'command center': '/atlas',
    'voice': '/atlas',
    'voice control': '/atlas',
    'ai assistant': '/atlas',
    'data hub': '/atlas',
    'c-suite': '/atlas',
    'csuite': '/atlas',
    'enterprise': '/atlas',
    
    // Data Hubs
    'personal hub': '/personal',
    'personal': '/personal',
    'my hub': '/personal',
    'my data': '/personal',
    'personal data': '/personal',
    'group hub': '/group',
    'group': '/group',
    'team hub': '/group',
    'team': '/group',
    'groups': '/group',
    'shared hub': '/group',
    'c-suite hub': '/atlas',
    'csuite hub': '/atlas',
    'enterprise hub': '/atlas',
    'enterprise data': '/atlas',
    
    // Import
    'import': '/import',
    'import agents': '/import',
    'bulk import': '/import',
    'upload agents': '/import',
    
    // Governance & Permissions
    'governance': '/governance',
    'tool governance': '/governance',
    'agent governance': '/governance',
    'permissions': '/workspace/tools',
    'user permissions': '/workspace/tools',
    'tool permissions': '/workspace/tools',
    'workspace tools': '/workspace/tools',
    
    // Integrations / Marketplace
    'integrations': '/marketplace',
    'marketplace': '/marketplace',
    'connect': '/marketplace',
    'connections': '/marketplace',
    'apps': '/marketplace',
    
    // Auth
    'auth': '/auth',
    'login': '/auth',
    'sign in': '/auth',
    'sign up': '/auth',
    'register': '/auth',
    'authentication': '/auth',
    
    // Help & Legal
    'help': '/help',
    'support': '/help',
    'assistance': '/help',
    'terms': '/terms-of-service',
    'terms of service': '/terms-of-service',
    'privacy': '/privacy-policy',
    'privacy policy': '/privacy-policy',
    'about': '/about',
    'about us': '/about',

    // Banking
    'banking': '/personal',
    'finance': '/personal',
    'accounts': '/personal',
    'transactions': '/personal',

    // Calendar
    'calendar': '/personal',
    'schedule': '/personal',
    'events': '/personal',
  };

  // Sector keywords for agent filtering
  private sectorKeywords: Record<string, string> = {
    'finance': 'FINANCE',
    'financial': 'FINANCE',
    'legal': 'LEGAL',
    'operations': 'OPERATIONS',
    'ops': 'OPERATIONS',
    'technology': 'TECHNOLOGY',
    'tech': 'TECHNOLOGY',
    'analytics': 'ANALYTICS',
    'data': 'ANALYTICS',
    'research': 'RESEARCH',
    'communications': 'COMMUNICATIONS',
    'comms': 'COMMUNICATIONS',
    'marketing': 'MARKETING',
    'sales': 'SALES',
    'hr': 'HR',
    'human resources': 'HR',
    'security': 'SECURITY',
    'compliance': 'COMPLIANCE',
    'strategy': 'STRATEGY',
  };

  // Priority keywords for tasks
  private priorityKeywords: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'low': 'low',
    'minor': 'low',
    'medium': 'medium',
    'normal': 'medium',
    'high': 'high',
    'important': 'high',
    'urgent': 'critical',
    'critical': 'critical',
    'asap': 'critical',
  };

  // Timeframe keywords
  private timeframeKeywords: Record<string, string> = {
    'today': 'today',
    'tomorrow': 'tomorrow',
    'this week': 'this_week',
    'next week': 'next_week',
    'this month': 'this_month',
    'next month': 'next_month',
  };

  parse(text: string): ParsedIntent | null {
    const normalized = text.toLowerCase().trim();

    // Try each parser in order of specificity (most specific first)
    return this.parseHelpCommand(normalized, text)
        || this.parseTaskCommand(normalized, text)
        || this.parseCalendarCommand(normalized, text)
        || this.parseBankingCommand(normalized, text)
        || this.parseGoalHabitCommand(normalized, text)
        || this.parseNoteReminderCommand(normalized, text)
        || this.parseAgentControlCommand(normalized, text)
        || this.parseWidgetCommand(normalized, text)
        || this.parseDocumentCommand(normalized, text)
        || this.parseKnowledgeCommand(normalized, text)
        || this.parseEmailCommand(normalized, text)
        || this.parseDataHubCommand(normalized, text)
        || this.parseThemeCommand(normalized, text)
        || this.parseAgentCommand(normalized, text)
        || this.parseReportCommand(normalized, text)
        || this.parseNavigationCommand(normalized, text)
        || this.parseFilterCommand(normalized, text)
        || this.parseSearchCommand(normalized, text)
        || this.parseDialogCommand(normalized, text)
        || this.parseRefreshCommand(normalized, text)
        || this.parseSystemCommand(normalized, text)
        || this.parseAskAtlas(normalized, text);
  }

  // ============================================================================
  // HELP COMMANDS
  // ============================================================================
  private parseHelpCommand(normalized: string, original: string): ParsedIntent | null {
    if (/(?:what can you do|what are your capabilities|help me|show commands|list commands)/i.test(normalized)) {
      return {
        command: { type: 'list_commands' },
        confidence: 0.95,
        original
      };
    }

    const helpPattern = /(?:help|explain|how do i|how to)\s+(?:with\s+)?(.+)/i;
    const helpMatch = normalized.match(helpPattern);
    if (helpMatch) {
      return {
        command: { type: 'get_help', topic: helpMatch[1].trim() },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // TASK MANAGEMENT COMMANDS
  // ============================================================================
  private parseTaskCommand(normalized: string, original: string): ParsedIntent | null {
    // Create task: "create a task to review budget", "add task call john tomorrow"
    const createTaskPattern = /(?:create|add|new|make)\s+(?:a\s+)?(?:new\s+)?task\s+(?:to\s+)?(?:called\s+)?(.+)/i;
    const createMatch = normalized.match(createTaskPattern);
    if (createMatch) {
      const taskText = createMatch[1].trim();
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      let dueDate: string | undefined;
      
      // Extract priority
      for (const [keyword, level] of Object.entries(this.priorityKeywords)) {
        if (taskText.includes(keyword)) {
          priority = level;
          break;
        }
      }
      
      // Extract due date hints
      if (/today/i.test(taskText)) dueDate = 'today';
      else if (/tomorrow/i.test(taskText)) dueDate = 'tomorrow';
      else if (/this week/i.test(taskText)) dueDate = 'this_week';
      
      return {
        command: { type: 'create_task', title: taskText, priority, dueDate },
        confidence: 0.95,
        original
      };
    }

    // Complete task: "complete task review budget", "mark task done", "finish task"
    if (/(?:complete|finish|done|mark.+done|check off)\s+(?:the\s+)?(?:task\s+)?(.+)?/i.test(normalized)) {
      const match = normalized.match(/(?:complete|finish|done|mark.+done|check off)\s+(?:the\s+)?(?:task\s+)?(.+)?/i);
      return {
        command: { type: 'complete_task', taskTitle: match?.[1]?.trim() },
        confidence: 0.9,
        original
      };
    }

    // List tasks: "show my tasks", "list tasks for today", "what tasks do I have"
    const listTasksPattern = /(?:show|list|get|what|display)\s+(?:my\s+)?(?:all\s+)?tasks(?:\s+(?:for\s+)?(.+))?/i;
    const listMatch = normalized.match(listTasksPattern);
    if (listMatch) {
      let filter: 'all' | 'today' | 'overdue' | 'upcoming' = 'all';
      const timeframe = listMatch[1]?.toLowerCase();
      if (timeframe?.includes('today')) filter = 'today';
      else if (timeframe?.includes('overdue')) filter = 'overdue';
      else if (timeframe?.includes('upcoming') || timeframe?.includes('tomorrow')) filter = 'upcoming';
      
      return {
        command: { type: 'list_tasks', filter },
        confidence: 0.9,
        original
      };
    }

    // Delete task
    if (/(?:delete|remove|cancel)\s+(?:the\s+)?task\s+(.+)/i.test(normalized)) {
      const match = normalized.match(/(?:delete|remove|cancel)\s+(?:the\s+)?task\s+(.+)/i);
      return {
        command: { type: 'delete_task', taskTitle: match?.[1]?.trim() },
        confidence: 0.85,
        original
      };
    }

    // Assign task to agent
    if (/(?:assign|give|delegate)\s+(?:the\s+)?(?:task\s+)?(.+?)\s+to\s+(.+)/i.test(normalized)) {
      return {
        command: { type: 'assign_task' },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // CALENDAR & EVENTS COMMANDS
  // ============================================================================
  private parseCalendarCommand(normalized: string, original: string): ParsedIntent | null {
    // Show calendar
    if (/(?:show|open|display)\s+(?:my\s+)?calendar/i.test(normalized)) {
      return {
        command: { type: 'show_calendar' },
        confidence: 0.95,
        original
      };
    }

    // Create event: "schedule a meeting tomorrow at 3pm", "create event team sync"
    const createEventPattern = /(?:schedule|create|add|book)\s+(?:a\s+)?(?:new\s+)?(?:meeting|event|appointment|call)\s+(?:called\s+|for\s+|about\s+)?(.+)/i;
    const eventMatch = normalized.match(createEventPattern);
    if (eventMatch) {
      const eventText = eventMatch[1].trim();
      let startAt = new Date().toISOString();
      
      // Try to extract time info
      if (/tomorrow/i.test(eventText)) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        startAt = tomorrow.toISOString();
      } else if (/today/i.test(eventText)) {
        startAt = new Date().toISOString();
      }
      
      return {
        command: { type: 'create_event', title: eventText, startAt },
        confidence: 0.9,
        original
      };
    }

    // List events: "what's on my calendar", "show events for today"
    const listEventsPattern = /(?:what'?s?\s+(?:on\s+)?(?:my\s+)?|show|list|get)\s+(?:events?|calendar|schedule|meetings?)(?:\s+(?:for\s+)?(.+))?/i;
    const listMatch = normalized.match(listEventsPattern);
    if (listMatch) {
      let timeframe: 'today' | 'tomorrow' | 'this_week' | 'next_week' = 'today';
      const tf = listMatch[1]?.toLowerCase();
      if (tf?.includes('tomorrow')) timeframe = 'tomorrow';
      else if (tf?.includes('this week')) timeframe = 'this_week';
      else if (tf?.includes('next week')) timeframe = 'next_week';
      
      return {
        command: { type: 'list_events', timeframe },
        confidence: 0.9,
        original
      };
    }

    // Cancel event
    if (/(?:cancel|delete|remove)\s+(?:the\s+)?(?:meeting|event|appointment)\s+(.+)?/i.test(normalized)) {
      const match = normalized.match(/(?:cancel|delete|remove)\s+(?:the\s+)?(?:meeting|event|appointment)\s+(.+)?/i);
      return {
        command: { type: 'cancel_event', eventTitle: match?.[1]?.trim() },
        confidence: 0.85,
        original
      };
    }

    // Get availability
    if (/(?:am i free|what'?s? my availability|when am i free|check availability)/i.test(normalized)) {
      return {
        command: { type: 'get_availability' },
        confidence: 0.9,
        original
      };
    }

    // Block time
    const blockTimePattern = /(?:block|reserve)\s+(?:time\s+)?(?:for\s+)?(.+)/i;
    const blockMatch = normalized.match(blockTimePattern);
    if (blockMatch) {
      return {
        command: { 
          type: 'block_time', 
          startAt: new Date().toISOString(), 
          endAt: new Date(Date.now() + 3600000).toISOString(),
          reason: blockMatch[1].trim()
        },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // BANKING & FINANCE COMMANDS
  // ============================================================================
  private parseBankingCommand(normalized: string, original: string): ParsedIntent | null {
    // Check balance
    if (/(?:check|show|what'?s?\s+(?:my\s+)?|get)\s*(?:my\s+)?(?:balance|bank\s*balance|account\s*balance)/i.test(normalized)) {
      return {
        command: { type: 'check_balance' },
        confidence: 0.95,
        original
      };
    }

    // List transactions
    const transactionsPattern = /(?:show|list|get|display)\s+(?:my\s+)?(?:recent\s+)?transactions/i;
    if (transactionsPattern.test(normalized)) {
      let filter: 'recent' | 'pending' | 'all' = 'recent';
      if (/pending/i.test(normalized)) filter = 'pending';
      else if (/all/i.test(normalized)) filter = 'all';
      
      return {
        command: { type: 'list_transactions', filter },
        confidence: 0.9,
        original
      };
    }

    // Financial summary
    if (/(?:financial|spending|money)\s+summary|how much (?:did i|have i) (?:spend|spent)|spending report/i.test(normalized)) {
      let period: 'today' | 'week' | 'month' | 'year' = 'month';
      if (/today/i.test(normalized)) period = 'today';
      else if (/week/i.test(normalized)) period = 'week';
      else if (/year/i.test(normalized)) period = 'year';
      
      return {
        command: { type: 'get_financial_summary', period },
        confidence: 0.9,
        original
      };
    }

    // Add expense
    const expensePattern = /(?:add|log|record)\s+(?:an?\s+)?expense\s+(?:of\s+)?\$?(\d+(?:\.\d{2})?)\s+(?:for\s+)?(.+)/i;
    const expenseMatch = normalized.match(expensePattern);
    if (expenseMatch) {
      return {
        command: { 
          type: 'add_expense', 
          amount: parseFloat(expenseMatch[1]), 
          category: expenseMatch[2].trim(),
          description: original
        },
        confidence: 0.9,
        original
      };
    }

    // Cash flow
    if (/(?:cash\s*flow|money\s*flow|income\s*vs\s*expense)/i.test(normalized)) {
      return {
        command: { type: 'get_cash_flow' },
        confidence: 0.9,
        original
      };
    }

    // Reconcile
    if (/reconcile|match\s+transactions/i.test(normalized)) {
      return {
        command: { type: 'reconcile_accounts' },
        confidence: 0.9,
        original
      };
    }

    // Set budget
    const budgetPattern = /(?:set|create)\s+(?:a\s+)?budget\s+(?:of\s+)?\$?(\d+)\s+(?:for\s+)?(.+)/i;
    const budgetMatch = normalized.match(budgetPattern);
    if (budgetMatch) {
      return {
        command: { 
          type: 'set_budget', 
          amount: parseFloat(budgetMatch[1]), 
          category: budgetMatch[2].trim()
        },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // GOALS & HABITS COMMANDS
  // ============================================================================
  private parseGoalHabitCommand(normalized: string, original: string): ParsedIntent | null {
    // Create goal
    const goalPattern = /(?:create|set|add)\s+(?:a\s+)?(?:new\s+)?goal\s+(?:to\s+)?(.+)/i;
    const goalMatch = normalized.match(goalPattern);
    if (goalMatch) {
      return {
        command: { type: 'create_goal', title: goalMatch[1].trim() },
        confidence: 0.9,
        original
      };
    }

    // Update goal progress
    if (/(?:update|log|record)\s+(?:my\s+)?(?:goal\s+)?progress/i.test(normalized)) {
      return {
        command: { type: 'update_goal_progress', value: 1 },
        confidence: 0.85,
        original
      };
    }

    // List goals
    if (/(?:show|list|get|what are)\s+(?:my\s+)?goals/i.test(normalized)) {
      return {
        command: { type: 'list_goals' },
        confidence: 0.9,
        original
      };
    }

    // Create habit
    const habitPattern = /(?:create|start|add)\s+(?:a\s+)?(?:new\s+)?(?:daily\s+|weekly\s+)?habit\s+(?:to\s+|for\s+)?(.+)/i;
    const habitMatch = normalized.match(habitPattern);
    if (habitMatch) {
      let frequency: 'daily' | 'weekly' | 'monthly' = 'daily';
      if (/weekly/i.test(normalized)) frequency = 'weekly';
      else if (/monthly/i.test(normalized)) frequency = 'monthly';
      
      return {
        command: { type: 'create_habit', name: habitMatch[1].trim(), frequency },
        confidence: 0.9,
        original
      };
    }

    // Complete habit
    const completeHabitPattern = /(?:complete|done|log|check off)\s+(?:my\s+)?(?:habit\s+)?(.+)/i;
    if (/habit/i.test(normalized) && completeHabitPattern.test(normalized)) {
      const match = normalized.match(completeHabitPattern);
      return {
        command: { type: 'complete_habit', habitName: match?.[1]?.trim() },
        confidence: 0.85,
        original
      };
    }

    // Get habit streak
    if (/(?:habit\s+)?streak|how many days/i.test(normalized)) {
      return {
        command: { type: 'get_habit_streak' },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // NOTES & REMINDERS COMMANDS
  // ============================================================================
  private parseNoteReminderCommand(normalized: string, original: string): ParsedIntent | null {
    // Create note
    const notePattern = /(?:create|add|make|write)\s+(?:a\s+)?(?:new\s+)?note\s+(?:called\s+|about\s+|for\s+)?(.+)/i;
    const noteMatch = normalized.match(notePattern);
    if (noteMatch) {
      return {
        command: { type: 'create_note', title: noteMatch[1].trim() },
        confidence: 0.9,
        original
      };
    }

    // Create reminder
    const reminderPattern = /(?:remind me|set\s+(?:a\s+)?reminder|create\s+(?:a\s+)?reminder)\s+(?:to\s+)?(.+)/i;
    const reminderMatch = normalized.match(reminderPattern);
    if (reminderMatch) {
      return {
        command: { 
          type: 'create_reminder', 
          title: reminderMatch[1].trim(),
          reminderAt: new Date(Date.now() + 3600000).toISOString() // Default 1 hour
        },
        confidence: 0.9,
        original
      };
    }

    // List notes
    if (/(?:show|list|get)\s+(?:my\s+)?notes/i.test(normalized)) {
      return {
        command: { type: 'list_notes' },
        confidence: 0.9,
        original
      };
    }

    // Search notes
    const searchNotesPattern = /(?:search|find)\s+(?:my\s+)?notes?\s+(?:for\s+|about\s+)?(.+)/i;
    const searchMatch = normalized.match(searchNotesPattern);
    if (searchMatch) {
      return {
        command: { type: 'search_notes', query: searchMatch[1].trim() },
        confidence: 0.9,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // AGENT CONTROL COMMANDS
  // ============================================================================
  private parseAgentControlCommand(normalized: string, original: string): ParsedIntent | null {
    // Train agent
    if (/(?:train|improve|enhance)\s+(?:the\s+)?(?:agent|agents)/i.test(normalized)) {
      return {
        command: { type: 'train_agent' },
        confidence: 0.9,
        original
      };
    }

    // Allocate agents
    if (/(?:allocate|assign|deploy)\s+(?:\d+\s+)?agents?\s+(?:to\s+)?(.+)?/i.test(normalized)) {
      return {
        command: { type: 'allocate_agents' },
        confidence: 0.85,
        original
      };
    }

    // Create swarm
    if (/(?:create|form|assemble)\s+(?:a\s+)?(?:agent\s+)?swarm/i.test(normalized)) {
      const purposeMatch = normalized.match(/(?:for|to)\s+(.+)/i);
      return {
        command: { type: 'create_swarm', purpose: purposeMatch?.[1]?.trim() },
        confidence: 0.85,
        original
      };
    }

    // Get agent status
    if (/(?:agent|agents)\s+status|how are (?:the\s+)?agents/i.test(normalized)) {
      return {
        command: { type: 'get_agent_status' },
        confidence: 0.9,
        original
      };
    }

    // Transfer knowledge
    if (/(?:transfer|share)\s+(?:agent\s+)?knowledge/i.test(normalized)) {
      return {
        command: { type: 'transfer_knowledge' },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // WIDGET COMMANDS
  // ============================================================================
  private parseWidgetCommand(normalized: string, original: string): ParsedIntent | null {
    // Create widget
    const createWidgetPattern = /(?:create|add|make)\s+(?:a\s+)?(?:new\s+)?widget\s+(?:for\s+|to\s+|about\s+)?(.+)/i;
    const widgetMatch = normalized.match(createWidgetPattern);
    if (widgetMatch) {
      return {
        command: { type: 'create_widget', purpose: widgetMatch[1].trim() },
        confidence: 0.9,
        original
      };
    }

    // List widgets
    if (/(?:show|list|get)\s+(?:my\s+)?widgets/i.test(normalized)) {
      return {
        command: { type: 'list_widgets' },
        confidence: 0.9,
        original
      };
    }

    // Delete widget
    if (/(?:delete|remove)\s+(?:the\s+)?widget\s+(.+)/i.test(normalized)) {
      const match = normalized.match(/(?:delete|remove)\s+(?:the\s+)?widget\s+(.+)/i);
      return {
        command: { type: 'delete_widget', widgetName: match?.[1]?.trim() },
        confidence: 0.85,
        original
      };
    }

    // Refresh widget
    if (/(?:refresh|update)\s+(?:the\s+)?widget/i.test(normalized)) {
      return {
        command: { type: 'refresh_widget' },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // DOCUMENT COMMANDS
  // ============================================================================
  private parseDocumentCommand(normalized: string, original: string): ParsedIntent | null {
    // Upload file
    if (/(?:upload|add)\s+(?:a\s+)?(?:new\s+)?(?:file|document)/i.test(normalized)) {
      return {
        command: { type: 'upload_file' },
        confidence: 0.9,
        original
      };
    }

    // Search documents
    const searchDocsPattern = /(?:search|find)\s+(?:my\s+)?(?:documents?|files?)\s+(?:for\s+|about\s+)?(.+)/i;
    const searchMatch = normalized.match(searchDocsPattern);
    if (searchMatch) {
      return {
        command: { type: 'search_documents', query: searchMatch[1].trim() },
        confidence: 0.9,
        original
      };
    }

    // List documents
    if (/(?:show|list|get)\s+(?:my\s+)?(?:documents?|files?)/i.test(normalized)) {
      return {
        command: { type: 'list_documents' },
        confidence: 0.9,
        original
      };
    }

    // Analyze document
    if (/(?:analyze|review)\s+(?:the\s+|this\s+)?document/i.test(normalized)) {
      return {
        command: { type: 'analyze_document' },
        confidence: 0.85,
        original
      };
    }

    // Summarize document
    if (/(?:summarize|summarise|give me a summary of)\s+(?:the\s+|this\s+)?document/i.test(normalized)) {
      return {
        command: { type: 'summarize_document' },
        confidence: 0.85,
        original
      };
    }

    // Create document
    const createDocPattern = /(?:create|make)\s+(?:a\s+)?(?:new\s+)?document\s+(?:called\s+|titled\s+)?(.+)/i;
    const createMatch = normalized.match(createDocPattern);
    if (createMatch) {
      return {
        command: { type: 'create_document', title: createMatch[1].trim() },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // KNOWLEDGE COMMANDS
  // ============================================================================
  private parseKnowledgeCommand(normalized: string, original: string): ParsedIntent | null {
    // Save knowledge
    const savePattern = /(?:save|store|remember)\s+(?:this\s+)?(?:knowledge|information|fact)?\s*:\s*(.+)/i;
    const saveMatch = normalized.match(savePattern);
    if (saveMatch && /knowledge|remember|store/i.test(normalized)) {
      return {
        command: { type: 'save_knowledge', title: 'Note', content: saveMatch[1].trim() },
        confidence: 0.85,
        original
      };
    }

    // Search knowledge
    const searchPattern = /(?:search|find|look up)\s+(?:in\s+)?(?:my\s+)?knowledge\s+(?:base\s+)?(?:for\s+|about\s+)?(.+)/i;
    const searchMatch = normalized.match(searchPattern);
    if (searchMatch) {
      return {
        command: { type: 'search_knowledge', query: searchMatch[1].trim() },
        confidence: 0.9,
        original
      };
    }

    // Get insights
    if (/(?:give me|show|get)\s+(?:some\s+)?insights?\s+(?:on\s+|about\s+)?(.+)?/i.test(normalized)) {
      const match = normalized.match(/(?:give me|show|get)\s+(?:some\s+)?insights?\s+(?:on\s+|about\s+)?(.+)?/i);
      return {
        command: { type: 'get_insights', topic: match?.[1]?.trim() },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // ASK ATLAS (Fallback for natural questions)
  // ============================================================================
  private parseAskAtlas(normalized: string, original: string): ParsedIntent | null {
    // If it's clearly a question, route to Atlas
    if (/^(?:what|who|where|when|why|how|can you|could you|would you|will you|is|are|do|does)/i.test(normalized)) {
      return {
        command: { type: 'ask_atlas', question: original },
        confidence: 0.7,
        original
      };
    }
    
    return null;
  }

  // ============================================================================
  // SYSTEM COMMANDS
  // ============================================================================
  private parseSystemCommand(normalized: string, original: string): ParsedIntent | null {
    // Sync all
    if (/(?:sync|synchronize)\s+(?:all|everything|data)/i.test(normalized)) {
      return {
        command: { type: 'sync_all' },
        confidence: 0.9,
        original
      };
    }

    // Check status
    if (/(?:system|atlas)\s+status|how'?s?\s+(?:the\s+)?system/i.test(normalized)) {
      return {
        command: { type: 'check_status' },
        confidence: 0.9,
        original
      };
    }

    // Get summary
    if (/(?:give me|show|get)\s+(?:a\s+)?(?:daily\s+)?summary/i.test(normalized)) {
      return {
        command: { type: 'get_summary' },
        confidence: 0.9,
        original
      };
    }

    // Clear cache
    if (/clear\s+(?:the\s+)?cache/i.test(normalized)) {
      return {
        command: { type: 'clear_cache' },
        confidence: 0.9,
        original
      };
    }

    // Toggle fullscreen
    if (/(?:toggle|enter|exit)\s+fullscreen/i.test(normalized)) {
      return {
        command: { type: 'toggle_fullscreen' },
        confidence: 0.9,
        original
      };
    }

    // Toggle sidebar
    if (/(?:toggle|show|hide)\s+(?:the\s+)?sidebar/i.test(normalized)) {
      return {
        command: { type: 'toggle_sidebar' },
        confidence: 0.9,
        original
      };
    }

    // Export data
    const exportPattern = /(?:export|download)\s+(?:my\s+)?(?:data|(.+))/i;
    const exportMatch = normalized.match(exportPattern);
    if (exportMatch) {
      let format: 'csv' | 'pdf' | 'json' = 'csv';
      if (/pdf/i.test(normalized)) format = 'pdf';
      else if (/json/i.test(normalized)) format = 'json';
      
      return {
        command: { type: 'export_data', format, entity: exportMatch[1]?.trim() },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // ============================================================================
  // EXISTING PARSERS (Email, DataHub, Theme, Agent, Report, Navigation, etc.)
  // ============================================================================
  private parseEmailCommand(normalized: string, original: string): ParsedIntent | null {
    // Draft email: "draft an email to john@example.com about the project update"
    const draftPattern = /(?:draft|write|compose)\s+(?:an?\s+)?email\s+(?:to\s+)?([^\s]+(?:@[^\s]+)?)\s+(?:about|regarding|for)\s+(.+)/i;
    const draftMatch = normalized.match(draftPattern);
    if (draftMatch) {
      const to = draftMatch[1].includes('@') ? draftMatch[1] : undefined;
      return {
        command: { 
          type: 'compose_email', 
          to: to || draftMatch[1],
          intent: draftMatch[2].trim(),
          urgency: normalized.includes('urgent') ? 'high' : 'normal'
        },
        confidence: 0.95,
        original
      };
    }

    // Simple draft: "draft email about budget meeting"
    const simpleDraftPattern = /(?:draft|write|compose)\s+(?:an?\s+)?email\s+(?:about|regarding|for)\s+(.+)/i;
    const simpleDraftMatch = normalized.match(simpleDraftPattern);
    if (simpleDraftMatch) {
      return {
        command: { 
          type: 'draft_email', 
          intent: simpleDraftMatch[1].trim()
        },
        confidence: 0.85,
        original
      };
    }

    // Send email: "send email to john@example.com"
    const sendPattern = /(?:send)\s+(?:an?\s+)?email\s+to\s+([^\s]+@[^\s]+)(?:\s+(?:about|regarding|for)\s+(.+))?/i;
    const sendMatch = normalized.match(sendPattern);
    if (sendMatch) {
      return {
        command: { 
          type: 'compose_email', 
          to: sendMatch[1],
          intent: sendMatch[2]?.trim() || 'general message',
          urgency: normalized.includes('urgent') ? 'high' : 'normal'
        },
        confidence: 0.9,
        original
      };
    }

    // Reply to email
    if (/(?:reply|respond)\s+(?:to\s+)?(?:the\s+)?(?:last\s+)?email/i.test(normalized)) {
      return {
        command: { type: 'reply_to_email' },
        confidence: 0.85,
        original
      };
    }

    // Check inbox
    if (/(?:check|open|show|view)\s+(?:my\s+)?(?:email|inbox|messages|communications)/i.test(normalized)) {
      return {
        command: { type: 'check_inbox' },
        confidence: 0.9,
        original
      };
    }

    return null;
  }

  private parseDataHubCommand(normalized: string, original: string): ParsedIntent | null {
    // Tab switching
    const tabPatterns = [
      /(?:switch to|go to|show|open)\s+(?:the\s+)?(\w+)\s+tab/i,
      /(?:show me|display)\s+(?:the\s+)?(\w+)\s+(?:tab|section)/i,
    ];
    
    for (const pattern of tabPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const tab = getTabFromName(match[1]);
        if (tab) {
          return {
            command: { type: 'switch_tab', tab },
            confidence: 0.95,
            original
          };
        }
      }
    }

    // Domain expansion
    const domainPatterns = [
      /(?:open|expand|show)\s+(?:the\s+)?(\w+)\s+(?:domain|section|area)/i,
      /(?:open|expand|show me|display)\s+(?:the\s+)?(\w+)$/i,
      /(?:let me see|view)\s+(?:the\s+)?(\w+)/i,
    ];
    
    for (const pattern of domainPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const domain = getDomainKeyFromName(match[1]);
        if (domain) {
          return {
            command: { type: 'expand_domain', domain },
            confidence: 0.9,
            original
          };
        }
      }
    }

    // Collapse domain
    if (/(?:close|collapse|hide)\s+(?:the\s+)?(?:domain|section)|go back|back to hub/i.test(normalized)) {
      return {
        command: { type: 'collapse_domain' },
        confidence: 0.85,
        original
      };
    }

    // Persona switching
    const personaPatterns = [
      /(?:switch to|change to|show me|use)\s+(?:the\s+)?(\w+)\s+(?:view|dashboard|persona|mode)/i,
      /(?:be|act as|become)\s+(?:the\s+)?(\w+)/i,
      /(?:change|switch)\s+persona\s+to\s+(\w+)/i,
    ];
    
    for (const pattern of personaPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const persona = getPersonaFromName(match[1]);
        if (persona) {
          return {
            command: { type: 'switch_persona', persona },
            confidence: 0.9,
            original
          };
        }
      }
    }

    return null;
  }

  private parseThemeCommand(normalized: string, original: string): ParsedIntent | null {
    if (/(?:toggle|switch|change)\s+(?:the\s+)?theme/i.test(normalized)) {
      return {
        command: { type: 'toggle_theme' },
        confidence: 0.95,
        original
      };
    }

    if (/(?:use|switch to|enable|set)\s+(?:the\s+)?dark\s+(?:mode|theme)/i.test(normalized)) {
      return {
        command: { type: 'set_theme', theme: 'dark' },
        confidence: 0.95,
        original
      };
    }

    if (/(?:use|switch to|enable|set)\s+(?:the\s+)?light\s+(?:mode|theme)/i.test(normalized)) {
      return {
        command: { type: 'set_theme', theme: 'light' },
        confidence: 0.95,
        original
      };
    }

    return null;
  }

  private parseAgentCommand(normalized: string, original: string): ParsedIntent | null {
    // Filter by sector
    const sectorPattern = /(?:show|filter|display|find)\s+(?:me\s+)?(?:all\s+)?(\w+)\s+agents?/i;
    const sectorMatch = normalized.match(sectorPattern);
    if (sectorMatch) {
      const sectorKey = sectorMatch[1].toLowerCase();
      const sector = this.sectorKeywords[sectorKey];
      if (sector) {
        return {
          command: { type: 'filter_agents', sector },
          confidence: 0.9,
          original
        };
      }
    }

    // Filter by status
    const statusPattern = /(?:show|filter|display|find)\s+(?:me\s+)?(?:all\s+)?(active|idle|processing|standby)\s+agents?/i;
    const statusMatch = normalized.match(statusPattern);
    if (statusMatch) {
      return {
        command: { type: 'filter_agents', status: statusMatch[1].toUpperCase() },
        confidence: 0.9,
        original
      };
    }

    // Clear agent filters
    if (/(?:show all agents|clear\s+(?:agent\s+)?filters|reset\s+(?:agent\s+)?filters)/i.test(normalized)) {
      return {
        command: { type: 'clear_filters' },
        confidence: 0.9,
        original
      };
    }

    return null;
  }

  private parseReportCommand(normalized: string, original: string): ParsedIntent | null {
    const reportPatterns = [
      /(?:generate|create|run|make)\s+(?:a\s+)?(?:(\w+)\s+)?report/i,
      /(?:generate|create|run)\s+(?:a\s+)?(?:(\w+)\s+)?analysis/i,
    ];

    for (const pattern of reportPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const persona = match[1] ? getPersonaFromName(match[1]) : undefined;
        return {
          command: { type: 'generate_report', persona: persona || undefined },
          confidence: 0.9,
          original
        };
      }
    }

    const queryPattern = /(?:run query|analyze|query)\s+(?:about\s+)?(.+)/i;
    const queryMatch = normalized.match(queryPattern);
    if (queryMatch) {
      return {
        command: { type: 'run_query', query: queryMatch[1] },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  private parseNavigationCommand(normalized: string, original: string): ParsedIntent | null {
    const navPatterns = [
      /(?:show me|open|go to|navigate to|take me to)\s+(?:the\s+)?(.+?)(?:\s+page)?$/i,
      /(?:show|display)\s+(?:the\s+)?(.+?)$/i,
    ];

    for (const pattern of navPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const target = match[1].trim();
        const sortedRoutes = Object.entries(this.routeMap).sort((a, b) => b[0].length - a[0].length);
        
        for (const [key, path] of sortedRoutes) {
          if (target.includes(key) || key.includes(target)) {
            return {
              command: { type: 'navigate', path },
              confidence: 0.9,
              original
            };
          }
        }
      }
    }

    return null;
  }

  private parseFilterCommand(normalized: string, original: string): ParsedIntent | null {
    const filterPattern = /(?:filter|show only|find)\s+(.+?)\s+(?:by|where|with)\s+(.+)/i;
    const filterMatch = normalized.match(filterPattern);
    if (filterMatch) {
      return {
        command: {
          type: 'filter',
          entity: filterMatch[1].trim(),
          criteria: { query: filterMatch[2].trim() }
        },
        confidence: 0.8,
        original
      };
    }

    return null;
  }

  private parseSearchCommand(normalized: string, original: string): ParsedIntent | null {
    const searchPattern = /(?:search|find|look for|lookup)\s+(?:for\s+)?(.+)/i;
    const searchMatch = normalized.match(searchPattern);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      let scope: 'agents' | 'documents' | 'all' | 'tasks' | 'emails' | 'events' = 'all';
      if (/agents?/i.test(query)) scope = 'agents';
      if (/documents?|files?/i.test(query)) scope = 'documents';
      if (/tasks?/i.test(query)) scope = 'tasks';
      if (/emails?|messages?/i.test(query)) scope = 'emails';
      if (/events?|meetings?|calendar/i.test(query)) scope = 'events';
      
      return {
        command: { type: 'search', query, scope },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  private parseDialogCommand(normalized: string, original: string): ParsedIntent | null {
    if (/(?:create|add|new)\s+(?:an?\s+)?agent/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'create_agent' },
        confidence: 0.9,
        original
      };
    }

    if (/(?:import|upload)\s+agents?/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'import_agents' },
        confidence: 0.9,
        original
      };
    }

    if (/(?:connect|add)\s+(?:a\s+)?(?:new\s+)?(?:bank\s+)?account/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'add_bank_account' },
        confidence: 0.9,
        original
      };
    }

    if (/(?:connect|add)\s+(?:a\s+)?(?:new\s+)?platform/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'connect_platform' },
        confidence: 0.9,
        original
      };
    }

    if (/(?:create|add|new)\s+(?:a\s+)?channel/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'create_channel' },
        confidence: 0.9,
        original
      };
    }

    if (/(?:open|show)\s+settings/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'settings' },
        confidence: 0.9,
        original
      };
    }

    return null;
  }

  private parseRefreshCommand(normalized: string, original: string): ParsedIntent | null {
    if (/(?:refresh|reload|update)\s+(?:the\s+)?(?:data|dashboard|view|page)?/i.test(normalized)) {
      return {
        command: { type: 'refresh_data' },
        confidence: 0.9,
        original
      };
    }

    return null;
  }
}

// Singleton
export const voiceIntentParser = new VoiceIntentParser();
