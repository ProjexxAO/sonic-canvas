/**
 * Extended Voice Intent Parser
 * Adds parsing for new command domains: CRM, Projects, Analytics, IoT, Scheduled, Multi-Step
 */

import type { VoiceCommand, CRMCommand, ProjectCommand, AnalyticsCommand, IoTCommand, ScheduledCommand, MultiStepCommand, ContextAwareCommand, InteractionCommand } from './types';

interface ParsedIntent {
  command: VoiceCommand;
  confidence: number;
  original: string;
}

// ============================================================================
// CRM & Contacts Parser
// ============================================================================

export function parseCRMCommand(normalized: string, original: string): ParsedIntent | null {
  // Create contact: "add contact John Smith email john@example.com"
  const createContactPattern = /(?:create|add|new)\s+contact\s+(.+?)(?:\s+email\s+(\S+))?(?:\s+(?:phone|at)\s+(\S+))?(?:\s+(?:at|company)\s+(.+))?$/i;
  const createMatch = normalized.match(createContactPattern);
  if (createMatch) {
    return {
      command: { 
        type: 'create_contact', 
        name: createMatch[1].trim(),
        email: createMatch[2],
        phone: createMatch[3],
        company: createMatch[4]?.trim()
      } as CRMCommand,
      confidence: 0.9,
      original
    };
  }

  // Search contacts
  const searchContactsPattern = /(?:search|find|look up)\s+(?:contact|contacts|person|people)\s+(?:named\s+|for\s+)?(.+)/i;
  const searchMatch = normalized.match(searchContactsPattern);
  if (searchMatch) {
    return {
      command: { type: 'search_contacts', query: searchMatch[1].trim() } as CRMCommand,
      confidence: 0.9,
      original
    };
  }

  // List contacts
  if (/(?:show|list|get)\s+(?:my\s+)?(?:all\s+)?contacts/i.test(normalized)) {
    return {
      command: { type: 'list_contacts', filter: 'all' } as CRMCommand,
      confidence: 0.9,
      original
    };
  }

  // Log interaction: "log a call with John about project update"
  const logInteractionPattern = /(?:log|record)\s+(?:a\s+)?(call|email|meeting|note)\s+with\s+(.+?)\s+(?:about\s+)?(.+)/i;
  const logMatch = normalized.match(logInteractionPattern);
  if (logMatch) {
    return {
      command: { 
        type: 'log_interaction', 
        contactName: logMatch[2].trim(),
        interactionType: logMatch[1].toLowerCase() as 'call' | 'email' | 'meeting' | 'note',
        summary: logMatch[3].trim()
      } as CRMCommand,
      confidence: 0.9,
      original
    };
  }

  // Create lead
  const createLeadPattern = /(?:create|add|new)\s+lead\s+(.+?)(?:\s+from\s+(.+))?(?:\s+worth\s+\$?(\d+))?/i;
  const leadMatch = normalized.match(createLeadPattern);
  if (leadMatch) {
    return {
      command: { 
        type: 'create_lead', 
        name: leadMatch[1].trim(),
        source: leadMatch[2]?.trim(),
        value: leadMatch[3] ? parseFloat(leadMatch[3]) : undefined
      } as CRMCommand,
      confidence: 0.85,
      original
    };
  }

  // Pipeline summary
  if (/(?:show|get)\s+(?:my\s+)?(?:sales\s+)?pipeline(?:\s+summary)?/i.test(normalized)) {
    return {
      command: { type: 'get_pipeline_summary' } as CRMCommand,
      confidence: 0.9,
      original
    };
  }

  // Create deal
  const createDealPattern = /(?:create|add|new)\s+deal\s+(.+?)\s+(?:worth|for|valued at)\s+\$?(\d+)/i;
  const dealMatch = normalized.match(createDealPattern);
  if (dealMatch) {
    return {
      command: { 
        type: 'create_deal', 
        title: dealMatch[1].trim(),
        value: parseFloat(dealMatch[2])
      } as CRMCommand,
      confidence: 0.85,
      original
    };
  }

  // Schedule followup
  const followupPattern = /(?:schedule|set)\s+(?:a\s+)?follow\s*up\s+with\s+(.+?)\s+(?:for\s+|on\s+)?(.+)/i;
  const followupMatch = normalized.match(followupPattern);
  if (followupMatch) {
    return {
      command: { 
        type: 'schedule_followup', 
        contactName: followupMatch[1].trim(),
        followupDate: followupMatch[2].trim()
      } as CRMCommand,
      confidence: 0.85,
      original
    };
  }

  return null;
}

// ============================================================================
// Project Management Parser
// ============================================================================

export function parseProjectCommand(normalized: string, original: string): ParsedIntent | null {
  // Create project
  const createProjectPattern = /(?:create|start|new)\s+project\s+(?:called\s+|named\s+)?(.+?)(?:\s+due\s+(.+))?$/i;
  const createMatch = normalized.match(createProjectPattern);
  if (createMatch) {
    return {
      command: { 
        type: 'create_project', 
        name: createMatch[1].trim(),
        deadline: createMatch[2]?.trim()
      } as ProjectCommand,
      confidence: 0.9,
      original
    };
  }

  // List projects
  if (/(?:show|list|get)\s+(?:my\s+)?(?:all\s+)?projects/i.test(normalized)) {
    let filter: 'all' | 'active' | 'completed' = 'all';
    if (/active/i.test(normalized)) filter = 'active';
    else if (/completed|done/i.test(normalized)) filter = 'completed';
    
    return {
      command: { type: 'list_projects', filter } as ProjectCommand,
      confidence: 0.9,
      original
    };
  }

  // Project status
  const statusPattern = /(?:what'?s?\s+(?:the\s+)?|get\s+|show\s+)(?:status\s+(?:of|for)\s+)?project\s+(.+)/i;
  const statusMatch = normalized.match(statusPattern);
  if (statusMatch) {
    return {
      command: { type: 'get_project_status', projectName: statusMatch[1].trim() } as ProjectCommand,
      confidence: 0.85,
      original
    };
  }

  // Create milestone
  const milestonePattern = /(?:create|add)\s+milestone\s+(.+?)\s+(?:for\s+project\s+(.+?)\s+)?due\s+(.+)/i;
  const milestoneMatch = normalized.match(milestonePattern);
  if (milestoneMatch) {
    return {
      command: { 
        type: 'create_milestone', 
        title: milestoneMatch[1].trim(),
        dueDate: milestoneMatch[3].trim()
      } as ProjectCommand,
      confidence: 0.85,
      original
    };
  }

  // Assign team member
  const assignPattern = /(?:assign|add)\s+(.+?)\s+to\s+(?:project\s+)?(.+)/i;
  if (/assign|add.+to.+project/i.test(normalized)) {
    const assignMatch = normalized.match(assignPattern);
    if (assignMatch) {
      return {
        command: { 
          type: 'assign_team_member', 
          memberName: assignMatch[1].trim(),
          projectName: assignMatch[2].trim()
        } as ProjectCommand,
        confidence: 0.8,
        original
      };
    }
  }

  // Create sprint
  const sprintPattern = /(?:create|start)\s+(?:a\s+)?sprint\s+(?:called\s+)?(.+?)\s+from\s+(.+?)\s+to\s+(.+)/i;
  const sprintMatch = normalized.match(sprintPattern);
  if (sprintMatch) {
    return {
      command: { 
        type: 'create_sprint', 
        name: sprintMatch[1].trim(),
        startDate: sprintMatch[2].trim(),
        endDate: sprintMatch[3].trim()
      } as ProjectCommand,
      confidence: 0.85,
      original
    };
  }

  // Sprint burndown
  if (/(?:show|get)\s+(?:sprint\s+)?burndown/i.test(normalized)) {
    return {
      command: { type: 'get_sprint_burndown' } as ProjectCommand,
      confidence: 0.9,
      original
    };
  }

  // Create epic
  const epicPattern = /(?:create|add)\s+epic\s+(.+)/i;
  const epicMatch = normalized.match(epicPattern);
  if (epicMatch) {
    return {
      command: { type: 'create_epic', title: epicMatch[1].trim() } as ProjectCommand,
      confidence: 0.85,
      original
    };
  }

  return null;
}

// ============================================================================
// Analytics Parser
// ============================================================================

export function parseAnalyticsCommand(normalized: string, original: string): ParsedIntent | null {
  // Get analytics
  const analyticsPattern = /(?:show|get|display)\s+(?:me\s+)?(.+?)\s+(?:analytics|metrics|data)(?:\s+for\s+(.+))?/i;
  const analyticsMatch = normalized.match(analyticsPattern);
  if (analyticsMatch) {
    return {
      command: { 
        type: 'get_analytics', 
        metric: analyticsMatch[1].trim(),
        period: analyticsMatch[2]?.trim()
      } as AnalyticsCommand,
      confidence: 0.85,
      original
    };
  }

  // Compare periods
  const comparePattern = /compare\s+(.+?)\s+(?:between|from)\s+(.+?)\s+(?:to|and|vs)\s+(.+)/i;
  const compareMatch = normalized.match(comparePattern);
  if (compareMatch) {
    return {
      command: { 
        type: 'compare_periods', 
        metric: compareMatch[1].trim(),
        period1: compareMatch[2].trim(),
        period2: compareMatch[3].trim()
      } as AnalyticsCommand,
      confidence: 0.85,
      original
    };
  }

  // Get trends
  const trendsPattern = /(?:show|get)\s+(.+?)\s+trends?(?:\s+(?:for|over)\s+(week|month|quarter|year))?/i;
  const trendsMatch = normalized.match(trendsPattern);
  if (trendsMatch) {
    return {
      command: { 
        type: 'get_trends', 
        metric: trendsMatch[1].trim(),
        timeRange: trendsMatch[2]?.toLowerCase() as 'week' | 'month' | 'quarter' | 'year'
      } as AnalyticsCommand,
      confidence: 0.85,
      original
    };
  }

  // KPI summary
  if (/(?:show|get)\s+(?:my\s+)?kpi(?:s|\s+summary)?/i.test(normalized)) {
    return {
      command: { type: 'get_kpi_summary' } as AnalyticsCommand,
      confidence: 0.9,
      original
    };
  }

  // Set alert
  const alertPattern = /(?:set|create)\s+(?:an?\s+)?alert\s+(?:when|if)\s+(.+?)\s+(above|below|equals?)\s+(\d+)/i;
  const alertMatch = normalized.match(alertPattern);
  if (alertMatch) {
    return {
      command: { 
        type: 'set_alert', 
        metric: alertMatch[1].trim(),
        condition: alertMatch[2].replace('equals', 'equals').toLowerCase() as 'above' | 'below' | 'equals',
        threshold: parseFloat(alertMatch[3])
      } as AnalyticsCommand,
      confidence: 0.85,
      original
    };
  }

  // Forecast
  const forecastPattern = /(?:forecast|predict)\s+(.+?)\s+(?:for\s+)?(\d+)\s+(?:periods?|months?|weeks?)/i;
  const forecastMatch = normalized.match(forecastPattern);
  if (forecastMatch) {
    return {
      command: { 
        type: 'get_forecast', 
        metric: forecastMatch[1].trim(),
        periods: parseInt(forecastMatch[2])
      } as AnalyticsCommand,
      confidence: 0.85,
      original
    };
  }

  // Schedule report
  const scheduleReportPattern = /schedule\s+(?:a\s+)?(.+?)\s+report\s+(daily|weekly|monthly)/i;
  const scheduleMatch = normalized.match(scheduleReportPattern);
  if (scheduleMatch) {
    return {
      command: { 
        type: 'schedule_report', 
        reportType: scheduleMatch[1].trim(),
        frequency: scheduleMatch[2].toLowerCase() as 'daily' | 'weekly' | 'monthly'
      } as AnalyticsCommand,
      confidence: 0.85,
      original
    };
  }

  return null;
}

// ============================================================================
// IoT / Smart Home Parser
// ============================================================================

export function parseIoTCommand(normalized: string, original: string): ParsedIntent | null {
  // Turn on/off device
  const controlPattern = /(?:turn\s+)?(on|off)\s+(?:the\s+)?(.+)/i;
  const controlMatch = normalized.match(controlPattern);
  if (controlMatch && /light|lamp|fan|switch|outlet|tv|speaker/i.test(controlMatch[2])) {
    return {
      command: { 
        type: 'control_device', 
        deviceName: controlMatch[2].trim(),
        action: controlMatch[1].toLowerCase() as 'on' | 'off'
      } as IoTCommand,
      confidence: 0.9,
      original
    };
  }

  // Dim lights
  const dimPattern = /dim\s+(?:the\s+)?(.+?)\s+to\s+(\d+)(?:\s*%)?/i;
  const dimMatch = normalized.match(dimPattern);
  if (dimMatch) {
    return {
      command: { 
        type: 'set_device_value', 
        deviceName: dimMatch[1].trim(),
        value: parseInt(dimMatch[2])
      } as IoTCommand,
      confidence: 0.9,
      original
    };
  }

  // Set thermostat
  const thermostatPattern = /set\s+(?:the\s+)?(?:thermostat|temperature|temp)\s+to\s+(\d+)(?:\s*°?(?:f|c)?)?/i;
  const thermostatMatch = normalized.match(thermostatPattern);
  if (thermostatMatch) {
    return {
      command: { 
        type: 'set_thermostat', 
        temperature: parseInt(thermostatMatch[1])
      } as IoTCommand,
      confidence: 0.95,
      original
    };
  }

  // Activate scene
  const scenePattern = /(?:activate|set|turn on)\s+(?:the\s+)?(.+?)\s+(?:scene|mode)/i;
  const sceneMatch = normalized.match(scenePattern);
  if (sceneMatch) {
    return {
      command: { type: 'activate_scene', sceneName: sceneMatch[1].trim() } as IoTCommand,
      confidence: 0.9,
      original
    };
  }

  // Lock/unlock door
  if (/lock\s+(?:the\s+)?(?:front\s+|back\s+)?door/i.test(normalized)) {
    const doorMatch = normalized.match(/lock\s+(?:the\s+)?(.+?\s*door)/i);
    return {
      command: { type: 'lock_door', doorName: doorMatch?.[1]?.trim() } as IoTCommand,
      confidence: 0.95,
      original
    };
  }
  if (/unlock\s+(?:the\s+)?(?:front\s+|back\s+)?door/i.test(normalized)) {
    const doorMatch = normalized.match(/unlock\s+(?:the\s+)?(.+?\s*door)/i);
    return {
      command: { type: 'unlock_door', doorName: doorMatch?.[1]?.trim() } as IoTCommand,
      confidence: 0.95,
      original
    };
  }

  // Arm security
  if (/arm\s+(?:the\s+)?(?:security|alarm)(?:\s+(home|away|night))?/i.test(normalized)) {
    const modeMatch = normalized.match(/arm.+(home|away|night)/i);
    return {
      command: { 
        type: 'arm_security', 
        mode: modeMatch?.[1]?.toLowerCase() as 'home' | 'away' | 'night'
      } as IoTCommand,
      confidence: 0.95,
      original
    };
  }
  if (/disarm\s+(?:the\s+)?(?:security|alarm)/i.test(normalized)) {
    return {
      command: { type: 'disarm_security' } as IoTCommand,
      confidence: 0.95,
      original
    };
  }

  // Device status
  if (/(?:what'?s?\s+the\s+)?status\s+(?:of\s+)?(?:the\s+)?(.+)/i.test(normalized) && 
      /device|light|thermostat|door|sensor/i.test(normalized)) {
    const statusMatch = normalized.match(/status\s+(?:of\s+)?(?:the\s+)?(.+)/i);
    return {
      command: { type: 'get_device_status', deviceName: statusMatch?.[1]?.trim() } as IoTCommand,
      confidence: 0.8,
      original
    };
  }

  // Energy usage
  if (/(?:show|get)\s+(?:my\s+)?energy\s+usage/i.test(normalized)) {
    return {
      command: { type: 'get_energy_usage' } as IoTCommand,
      confidence: 0.9,
      original
    };
  }

  return null;
}

// ============================================================================
// Scheduled Commands Parser
// ============================================================================

export function parseScheduledCommand(normalized: string, original: string): ParsedIntent | null {
  // Schedule command for later
  const schedulePattern = /(?:at|on|every)\s+(.+?)\s+(?:remind me to|run|execute|do)\s+(.+)/i;
  const scheduleMatch = normalized.match(schedulePattern);
  if (scheduleMatch) {
    return {
      command: { 
        type: 'schedule_command', 
        executeAt: scheduleMatch[1].trim(),
        command: { type: 'ask_atlas', question: scheduleMatch[2].trim() }
      } as ScheduledCommand,
      confidence: 0.8,
      original
    };
  }

  // List scheduled commands
  if (/(?:show|list|what are)\s+(?:my\s+)?scheduled\s+(?:commands|tasks|reminders)/i.test(normalized)) {
    return {
      command: { type: 'list_scheduled_commands' } as ScheduledCommand,
      confidence: 0.9,
      original
    };
  }

  // Set daily routine
  const routinePattern = /(?:set|create)\s+(?:a\s+)?(?:daily\s+)?routine\s+(?:called\s+)?(.+?)\s+at\s+(.+)/i;
  const routineMatch = normalized.match(routinePattern);
  if (routineMatch) {
    return {
      command: { 
        type: 'set_daily_routine', 
        name: routineMatch[1].trim(),
        time: routineMatch[2].trim(),
        commands: []
      } as ScheduledCommand,
      confidence: 0.85,
      original
    };
  }

  // Run routine
  const runRoutinePattern = /(?:run|start|activate)\s+(?:the\s+)?(.+?)\s+routine/i;
  const runMatch = normalized.match(runRoutinePattern);
  if (runMatch) {
    return {
      command: { type: 'run_routine', routineName: runMatch[1].trim() } as ScheduledCommand,
      confidence: 0.9,
      original
    };
  }

  // Snooze reminder
  if (/snooze\s+(?:for\s+)?(\d+)?\s*(?:minutes?|mins?|hours?|hrs?)?/i.test(normalized)) {
    const snoozeMatch = normalized.match(/snooze\s+(?:for\s+)?(\d+)?/i);
    return {
      command: { 
        type: 'snooze_reminder', 
        duration: snoozeMatch?.[1] ? parseInt(snoozeMatch[1]) : 10
      } as ScheduledCommand,
      confidence: 0.9,
      original
    };
  }

  return null;
}

// ============================================================================
// Multi-Step & Context-Aware Parser
// ============================================================================

export function parseMultiStepCommand(normalized: string, original: string): ParsedIntent | null {
  // Do this later
  if (/(?:do\s+this|remind me|come back to this)\s+(?:later|in\s+(\d+)\s+(?:minutes?|hours?))/i.test(normalized)) {
    const timeMatch = normalized.match(/in\s+(\d+)\s+(minutes?|hours?)/i);
    let deferMinutes = 30; // Default
    if (timeMatch) {
      deferMinutes = parseInt(timeMatch[1]) * (timeMatch[2].startsWith('hour') ? 60 : 1);
    }
    return {
      command: { type: 'do_this_later', deferMinutes } as ContextAwareCommand,
      confidence: 0.85,
      original
    };
  }

  // Convert to task
  if (/(?:convert|make|turn)\s+(?:this|that)\s+(?:into\s+)?(?:a\s+)?task/i.test(normalized)) {
    return {
      command: { type: 'convert_to_task' } as ContextAwareCommand,
      confidence: 0.9,
      original
    };
  }

  // Email summary
  const emailSummaryPattern = /email\s+(?:me\s+)?(?:a\s+)?(daily|weekly|project|financial)\s+summary\s+(?:to\s+)?(\S+@\S+)?/i;
  const emailMatch = normalized.match(emailSummaryPattern);
  if (emailMatch) {
    return {
      command: { 
        type: 'email_summary', 
        summaryType: emailMatch[1].toLowerCase() as 'daily' | 'weekly' | 'project' | 'financial',
        recipientEmail: emailMatch[2] || 'me'
      } as MultiStepCommand,
      confidence: 0.85,
      original
    };
  }

  // Explain this
  if (/explain\s+(?:this|that|it)/i.test(normalized)) {
    return {
      command: { type: 'explain_this' } as ContextAwareCommand,
      confidence: 0.9,
      original
    };
  }

  // Analyze selected
  if (/analyze\s+(?:this|that|selected|it)/i.test(normalized)) {
    return {
      command: { type: 'analyze_selected' } as ContextAwareCommand,
      confidence: 0.9,
      original
    };
  }

  // Find similar
  if (/find\s+similar/i.test(normalized)) {
    return {
      command: { type: 'find_similar' } as ContextAwareCommand,
      confidence: 0.85,
      original
    };
  }

  return null;
}

// ============================================================================
// Interaction Mode Parser
// ============================================================================

export function parseInteractionCommand(normalized: string, original: string): ParsedIntent | null {
  // Set mode
  if (/(?:set|switch to|enable)\s+(autonomous|preview|conversational)\s+mode/i.test(normalized)) {
    const modeMatch = normalized.match(/(autonomous|preview|conversational)/i);
    return {
      command: { 
        type: 'set_interaction_mode', 
        mode: modeMatch![1].toLowerCase() as 'autonomous' | 'preview' | 'conversational'
      } as InteractionCommand,
      confidence: 0.95,
      original
    };
  }

  // Enable/disable confirmations
  if (/(?:enable|turn on)\s+confirmations?/i.test(normalized)) {
    return {
      command: { type: 'enable_confirmations' } as InteractionCommand,
      confidence: 0.95,
      original
    };
  }
  if (/(?:disable|turn off)\s+confirmations?/i.test(normalized)) {
    return {
      command: { type: 'disable_confirmations' } as InteractionCommand,
      confidence: 0.95,
      original
    };
  }

  // Undo
  if (/undo(?:\s+(?:that|last|it))?/i.test(normalized)) {
    return {
      command: { type: 'undo_last' } as InteractionCommand,
      confidence: 0.95,
      original
    };
  }

  // Cancel
  if (/(?:cancel|stop|abort)(?:\s+(?:that|it|this))?/i.test(normalized)) {
    return {
      command: { type: 'cancel_current' } as InteractionCommand,
      confidence: 0.95,
      original
    };
  }

  // Pause/Resume Atlas
  if (/(?:pause|stop)\s+atlas/i.test(normalized)) {
    return {
      command: { type: 'pause_atlas' } as InteractionCommand,
      confidence: 0.95,
      original
    };
  }
  if (/(?:resume|continue|start)\s+atlas/i.test(normalized)) {
    return {
      command: { type: 'resume_atlas' } as InteractionCommand,
      confidence: 0.95,
      original
    };
  }

  return null;
}

// ============================================================================
// Combined Extended Parser
// ============================================================================

export function parseExtendedCommand(normalized: string, original: string): ParsedIntent | null {
  // Try each extended parser in order
  return parseInteractionCommand(normalized, original)
      || parseCRMCommand(normalized, original)
      || parseProjectCommand(normalized, original)
      || parseAnalyticsCommand(normalized, original)
      || parseIoTCommand(normalized, original)
      || parseScheduledCommand(normalized, original)
      || parseMultiStepCommand(normalized, original);
}
