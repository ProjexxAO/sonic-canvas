import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceCommandBus, VoiceCommand, COMMAND_CATEGORIES } from '@/lib/voice-command-bus';
import { useDataHubController } from '@/hooks/useDataHubController';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// ============================================================================
// Universal Voice Command Executor
// Handles ALL command types across the entire Atlas system
// ============================================================================

export function useVoiceCommandExecutor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  
  // Data Hub controls
  const setActiveTab = useDataHubController((s) => s.setActiveTab);
  const setExpandedDomain = useDataHubController((s) => s.setExpandedDomain);
  const setTargetPersona = useDataHubController((s) => s.setTargetPersona);
  const requestReportGeneration = useDataHubController((s) => s.requestReportGeneration);
  const setEnterpriseQuery = useDataHubController((s) => s.setEnterpriseQuery);
  const setTriggerEnterpriseQuery = useDataHubController((s) => s.setTriggerEnterpriseQuery);
  const requestRefresh = useDataHubController((s) => s.requestRefresh);
  
  // Voice command state
  const currentCommand = useVoiceCommandBus((state) => state.currentCommand);
  const clearCommand = useVoiceCommandBus((state) => state.clearCommand);
  const setProcessing = useVoiceCommandBus((state) => state.setProcessing);

  // Get current user ID
  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  };

  const executeCommand = useCallback(async (command: VoiceCommand) => {
    console.log('⚡ Executing voice command:', command);
    setProcessing(true);

    try {
      switch (command.type) {
        // ====================================================================
        // NAVIGATION
        // ====================================================================
        case 'navigate':
          navigate(command.path);
          toast({ title: '🎤 Voice Navigation', description: `Navigating to ${command.path}` });
          break;

        // ====================================================================
        // DATA HUB CONTROL
        // ====================================================================
        case 'switch_tab':
          setActiveTab(command.tab);
          toast({ title: '🎤 Tab Switched', description: `Switched to ${command.tab} tab` });
          break;

        case 'expand_domain':
          setExpandedDomain(command.domain);
          toast({ title: '🎤 Domain Opened', description: `Expanded ${command.domain} domain` });
          break;

        case 'collapse_domain':
          setExpandedDomain(null);
          toast({ title: '🎤 Domain Closed', description: 'Returned to hub view' });
          break;

        case 'switch_persona':
          setTargetPersona(command.persona);
          toast({ title: '🎤 Persona Changed', description: `Switched to ${command.persona.toUpperCase()} view` });
          break;

        // ====================================================================
        // REPORTS & QUERIES
        // ====================================================================
        case 'generate_report':
          requestReportGeneration(command.persona || 'ceo');
          toast({ title: '🎤 Report Requested', description: `Generating ${command.persona || 'CEO'} report...` });
          break;

        case 'run_query':
          setEnterpriseQuery(command.query);
          setTriggerEnterpriseQuery(true);
          toast({ title: '🎤 Query Running', description: `Analyzing: ${command.query}` });
          break;

        case 'refresh_data':
          requestRefresh();
          toast({ title: '🎤 Refreshing', description: 'Updating data...' });
          break;

        case 'export_data':
          toast({ title: '🎤 Export Started', description: `Exporting ${command.entity || 'data'} as ${command.format || 'CSV'}...` });
          window.dispatchEvent(new CustomEvent('voice-export-data', { detail: command }));
          break;

        // ====================================================================
        // THEME & UI
        // ====================================================================
        case 'toggle_theme':
          setTheme(theme === 'dark' ? 'light' : 'dark');
          toast({ title: '🎤 Theme Toggled', description: `Switched to ${theme === 'dark' ? 'light' : 'dark'} mode` });
          break;

        case 'set_theme':
          setTheme(command.theme);
          toast({ title: '🎤 Theme Changed', description: `Set to ${command.theme} mode` });
          break;

        case 'toggle_fullscreen':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
          toast({ title: '🎤 Fullscreen Toggled' });
          break;

        case 'toggle_sidebar':
          window.dispatchEvent(new CustomEvent('voice-toggle-sidebar'));
          toast({ title: '🎤 Sidebar Toggled' });
          break;

        // ====================================================================
        // FILTERING & SEARCH
        // ====================================================================
        case 'filter':
          window.dispatchEvent(new CustomEvent('voice-filter', { detail: { entity: command.entity, criteria: command.criteria } }));
          toast({ title: '🎤 Filter Applied', description: `Filtering ${command.entity}` });
          break;

        case 'filter_agents':
          window.dispatchEvent(new CustomEvent('voice-filter-agents', { detail: { sector: command.sector, status: command.status, capability: command.capability } }));
          toast({ title: '🎤 Agents Filtered', description: `Showing ${command.sector || command.status || 'filtered'} agents` });
          break;

        case 'clear_filters':
          window.dispatchEvent(new CustomEvent('voice-clear-filters'));
          toast({ title: '🎤 Filters Cleared', description: 'Showing all items' });
          break;

        case 'search':
          window.dispatchEvent(new CustomEvent('voice-search', { detail: { query: command.query, scope: command.scope } }));
          toast({ title: '🎤 Searching', description: `Searching for: ${command.query}` });
          break;

        // ====================================================================
        // DIALOGS
        // ====================================================================
        case 'open_dialog':
          window.dispatchEvent(new CustomEvent('voice-open-dialog', { detail: { dialog: command.dialog } }));
          toast({ title: '🎤 Opening', description: `Opening ${command.dialog.replace(/_/g, ' ')}` });
          break;

        // ====================================================================
        // NOTIFICATIONS
        // ====================================================================
        case 'show_notification':
          toast({
            title: command.variant === 'error' ? '❌ Error' : command.variant === 'info' ? 'ℹ️ Info' : '✅ Success',
            description: command.message,
            variant: command.variant === 'error' ? 'destructive' : 'default'
          });
          break;

        case 'voice_response':
          toast({ title: '🎤 Atlas', description: command.text });
          break;

        // ====================================================================
        // WORKFLOWS
        // ====================================================================
        case 'trigger_workflow':
          window.dispatchEvent(new CustomEvent('voice-trigger-workflow', { detail: { workflowId: command.workflowId } }));
          toast({ title: '🎤 Workflow Triggered', description: `Starting workflow ${command.workflowId}` });
          break;

        case 'list_workflows':
          toast({ title: '🎤 Listing Workflows' });
          window.dispatchEvent(new CustomEvent('voice-list-workflows'));
          break;

        // ====================================================================
        // EMAIL / COMMUNICATIONS
        // ====================================================================
        case 'draft_email':
          toast({ title: '🎤 Drafting Email', description: `Atlas is drafting an email...` });
          try {
            const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
              body: { action: 'draft_message', context: command.intent, platform: 'gmail' },
            });
            if (error) throw error;
            window.dispatchEvent(new CustomEvent('atlas-email-drafted', { detail: data }));
            toast({ title: '✉️ Draft Ready', description: 'Review it in Communications.' });
            setExpandedDomain('communications');
          } catch (err) {
            console.error('Error drafting email:', err);
            toast({ title: 'Draft Failed', description: 'Could not generate email draft', variant: 'destructive' });
          }
          break;

        case 'compose_email':
          toast({ title: '🎤 Composing Email', description: `Atlas is composing email to ${command.to}...` });
          try {
            const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
              body: { action: 'compose_email', to: command.to, subject: command.subject, intent: command.intent, urgency: command.urgency },
            });
            if (error) throw error;
            window.dispatchEvent(new CustomEvent('atlas-email-composed', { detail: data }));
            toast({ title: '✉️ Email Composed', description: `Email to ${command.to} ready for approval.` });
            setExpandedDomain('communications');
          } catch (err) {
            console.error('Error composing email:', err);
            toast({ title: 'Compose Failed', description: 'Could not compose email', variant: 'destructive' });
          }
          break;

        case 'send_email':
          toast({ title: '🎤 Sending Email', description: `Sending email to ${command.to}...` });
          try {
            const { error } = await supabase.functions.invoke('atlas-orchestrator', {
              body: { action: 'send_message', content: command.content || '', subject: command.subject, toAddresses: [command.to], platform: 'gmail', isDraft: true },
            });
            if (error) throw error;
            toast({ title: '✉️ Email Queued', description: 'Please review and approve to send.' });
            setExpandedDomain('communications');
          } catch (err) {
            console.error('Error sending email:', err);
            toast({ title: 'Send Failed', description: 'Could not queue email', variant: 'destructive' });
          }
          break;

        case 'open_communications':
        case 'check_inbox':
          setExpandedDomain('communications');
          toast({ title: '🎤 Opening Communications', description: 'Showing your inbox and messages' });
          break;

        case 'reply_to_email':
          toast({ title: '🎤 Opening Reply', description: 'Preparing email reply...' });
          setExpandedDomain('communications');
          window.dispatchEvent(new CustomEvent('voice-reply-email', { detail: command }));
          break;

        case 'forward_email':
          toast({ title: '🎤 Forwarding Email' });
          setExpandedDomain('communications');
          window.dispatchEvent(new CustomEvent('voice-forward-email', { detail: command }));
          break;

        // ====================================================================
        // TASK MANAGEMENT
        // ====================================================================
        case 'create_task': {
          toast({ title: '🎤 Creating Task', description: command.title });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { error } = await supabase.from('personal_items').insert({
              user_id: userId,
              item_type: 'task',
              title: command.title,
              content: command.description || null,
              priority: command.priority || 'medium',
              status: 'active',
              metadata: { voice_created: true, due_date_hint: command.dueDate } as unknown as Json,
              tags: [],
            });
            if (error) throw error;
            toast({ title: '✅ Task Created', description: command.title });
            window.dispatchEvent(new CustomEvent('voice-task-created'));
          } catch (err) {
            console.error('Error creating task:', err);
            toast({ title: 'Failed to Create Task', variant: 'destructive' });
          }
          break;
        }

        case 'complete_task':
          toast({ title: '🎤 Completing Task', description: command.taskTitle || 'Task marked complete' });
          window.dispatchEvent(new CustomEvent('voice-complete-task', { detail: command }));
          break;

        case 'list_tasks':
          toast({ title: '🎤 Listing Tasks', description: `Showing ${command.filter || 'all'} tasks` });
          setExpandedDomain('tasks');
          window.dispatchEvent(new CustomEvent('voice-list-tasks', { detail: command }));
          break;

        case 'delete_task':
          toast({ title: '🎤 Deleting Task', description: command.taskTitle || 'Task' });
          window.dispatchEvent(new CustomEvent('voice-delete-task', { detail: command }));
          break;

        case 'assign_task':
          toast({ title: '🎤 Assigning Task' });
          window.dispatchEvent(new CustomEvent('voice-assign-task', { detail: command }));
          break;

        case 'update_task':
          toast({ title: '🎤 Updating Task' });
          window.dispatchEvent(new CustomEvent('voice-update-task', { detail: command }));
          break;

        // ====================================================================
        // NOTES & REMINDERS
        // ====================================================================
        case 'create_note': {
          toast({ title: '🎤 Creating Note', description: command.title });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { error } = await supabase.from('personal_items').insert({
              user_id: userId,
              item_type: 'note',
              title: command.title,
              content: command.content || null,
              priority: 'medium',
              status: 'active',
              metadata: { voice_created: true } as unknown as Json,
              tags: command.tags || [],
            });
            if (error) throw error;
            toast({ title: '📝 Note Created', description: command.title });
          } catch (err) {
            console.error('Error creating note:', err);
            toast({ title: 'Failed to Create Note', variant: 'destructive' });
          }
          break;
        }

        case 'create_reminder': {
          toast({ title: '🎤 Setting Reminder', description: command.title });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { error } = await supabase.from('personal_items').insert({
              user_id: userId,
              item_type: 'reminder',
              title: command.title,
              content: command.description || null,
              priority: 'high',
              status: 'active',
              reminder_at: command.reminderAt,
              metadata: { voice_created: true } as unknown as Json,
              tags: [],
            });
            if (error) throw error;
            toast({ title: '⏰ Reminder Set', description: command.title });
          } catch (err) {
            console.error('Error creating reminder:', err);
            toast({ title: 'Failed to Set Reminder', variant: 'destructive' });
          }
          break;
        }

        case 'list_notes':
          toast({ title: '🎤 Listing Notes' });
          window.dispatchEvent(new CustomEvent('voice-list-notes'));
          break;

        case 'search_notes':
          toast({ title: '🎤 Searching Notes', description: command.query });
          window.dispatchEvent(new CustomEvent('voice-search-notes', { detail: command }));
          break;

        // ====================================================================
        // GOALS & HABITS
        // ====================================================================
        case 'create_goal': {
          toast({ title: '🎤 Creating Goal', description: command.title });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { error } = await supabase.from('personal_goals').insert({
              user_id: userId,
              title: command.title,
              target_value: command.targetValue || null,
              target_date: command.targetDate || null,
              category: command.category || 'general',
              status: 'active',
              current_value: 0,
            });
            if (error) throw error;
            toast({ title: '🎯 Goal Created', description: command.title });
          } catch (err) {
            console.error('Error creating goal:', err);
            toast({ title: 'Failed to Create Goal', variant: 'destructive' });
          }
          break;
        }

        case 'list_goals':
          toast({ title: '🎤 Listing Goals' });
          window.dispatchEvent(new CustomEvent('voice-list-goals'));
          break;

        case 'update_goal_progress':
          toast({ title: '🎤 Updating Goal Progress' });
          window.dispatchEvent(new CustomEvent('voice-update-goal', { detail: command }));
          break;

        case 'create_habit': {
          toast({ title: '🎤 Creating Habit', description: command.name });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { error } = await supabase.from('personal_habits').insert({
              user_id: userId,
              name: command.name,
              frequency: command.frequency,
              target_count: 1,
              current_streak: 0,
              longest_streak: 0,
              is_active: true,
            });
            if (error) throw error;
            toast({ title: '🔄 Habit Created', description: command.name });
          } catch (err) {
            console.error('Error creating habit:', err);
            toast({ title: 'Failed to Create Habit', variant: 'destructive' });
          }
          break;
        }

        case 'complete_habit':
          toast({ title: '🎤 Completing Habit', description: command.habitName || 'Habit' });
          window.dispatchEvent(new CustomEvent('voice-complete-habit', { detail: command }));
          break;

        case 'get_habit_streak':
          toast({ title: '🎤 Checking Habit Streak' });
          window.dispatchEvent(new CustomEvent('voice-habit-streak', { detail: command }));
          break;

        // ====================================================================
        // CALENDAR & EVENTS
        // ====================================================================
        case 'show_calendar':
          toast({ title: '🎤 Opening Calendar' });
          setExpandedDomain('events');
          break;

        case 'create_event': {
          toast({ title: '🎤 Creating Event', description: command.title });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { error } = await supabase.from('csuite_events').insert({
              user_id: userId,
              title: command.title,
              start_at: command.startAt,
              end_at: command.endAt || null,
              location: command.location || null,
              attendees: command.attendees || null,
              source: 'atlas_voice',
              type: 'meeting',
            });
            if (error) throw error;
            toast({ title: '📅 Event Created', description: command.title });
            window.dispatchEvent(new CustomEvent('voice-event-created'));
          } catch (err) {
            console.error('Error creating event:', err);
            toast({ title: 'Failed to Create Event', variant: 'destructive' });
          }
          break;
        }

        case 'list_events':
          toast({ title: '🎤 Listing Events', description: `Showing ${command.timeframe || 'today'}` });
          setExpandedDomain('events');
          window.dispatchEvent(new CustomEvent('voice-list-events', { detail: command }));
          break;

        case 'cancel_event':
          toast({ title: '🎤 Cancelling Event', description: command.eventTitle || 'Event' });
          window.dispatchEvent(new CustomEvent('voice-cancel-event', { detail: command }));
          break;

        case 'reschedule_event':
          toast({ title: '🎤 Rescheduling Event' });
          window.dispatchEvent(new CustomEvent('voice-reschedule-event', { detail: command }));
          break;

        case 'get_availability':
          toast({ title: '🎤 Checking Availability' });
          setExpandedDomain('events');
          window.dispatchEvent(new CustomEvent('voice-check-availability', { detail: command }));
          break;

        case 'block_time':
          toast({ title: '🎤 Blocking Time', description: command.reason || 'Time blocked' });
          window.dispatchEvent(new CustomEvent('voice-block-time', { detail: command }));
          break;

        // ====================================================================
        // BANKING & FINANCE
        // ====================================================================
        case 'check_balance':
          toast({ title: '🎤 Checking Balance' });
          setExpandedDomain('financials');
          window.dispatchEvent(new CustomEvent('voice-check-balance', { detail: command }));
          break;

        case 'list_transactions':
          toast({ title: '🎤 Listing Transactions', description: `Showing ${command.filter || 'recent'}` });
          setExpandedDomain('financials');
          window.dispatchEvent(new CustomEvent('voice-list-transactions', { detail: command }));
          break;

        case 'get_financial_summary':
          toast({ title: '🎤 Getting Financial Summary', description: `Period: ${command.period || 'month'}` });
          setExpandedDomain('financials');
          window.dispatchEvent(new CustomEvent('voice-financial-summary', { detail: command }));
          break;

        case 'add_expense': {
          toast({ title: '🎤 Adding Expense', description: `$${command.amount} for ${command.category}` });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { error } = await supabase.from('csuite_financials').insert({
              user_id: userId,
              title: command.description || command.category,
              amount: -Math.abs(command.amount),
              category: command.category,
              type: 'expense',
              source: 'atlas_voice',
              transaction_date: new Date().toISOString(),
            });
            if (error) throw error;
            toast({ title: '💰 Expense Added', description: `$${command.amount} for ${command.category}` });
          } catch (err) {
            console.error('Error adding expense:', err);
            toast({ title: 'Failed to Add Expense', variant: 'destructive' });
          }
          break;
        }

        case 'get_cash_flow':
          toast({ title: '🎤 Analyzing Cash Flow' });
          setExpandedDomain('financials');
          window.dispatchEvent(new CustomEvent('voice-cash-flow'));
          break;

        case 'reconcile_accounts':
          toast({ title: '🎤 Reconciling Accounts' });
          setExpandedDomain('financials');
          window.dispatchEvent(new CustomEvent('voice-reconcile'));
          break;

        case 'set_budget':
          toast({ title: '🎤 Setting Budget', description: `$${command.amount} for ${command.category}` });
          window.dispatchEvent(new CustomEvent('voice-set-budget', { detail: command }));
          break;

        case 'categorize_transaction':
          toast({ title: '🎤 Categorizing Transaction' });
          window.dispatchEvent(new CustomEvent('voice-categorize', { detail: command }));
          break;

        // ====================================================================
        // AGENT CONTROL
        // ====================================================================
        case 'train_agent':
          toast({ title: '🎤 Training Agents' });
          window.dispatchEvent(new CustomEvent('voice-train-agent', { detail: command }));
          break;

        case 'allocate_agents':
          toast({ title: '🎤 Allocating Agents' });
          window.dispatchEvent(new CustomEvent('voice-allocate-agents', { detail: command }));
          break;

        case 'create_swarm':
          toast({ title: '🎤 Creating Agent Swarm', description: command.purpose || 'Collaborative task' });
          window.dispatchEvent(new CustomEvent('voice-create-swarm', { detail: command }));
          break;

        case 'get_agent_status':
          toast({ title: '🎤 Checking Agent Status' });
          window.dispatchEvent(new CustomEvent('voice-agent-status'));
          break;

        case 'transfer_knowledge':
          toast({ title: '🎤 Transferring Knowledge' });
          window.dispatchEvent(new CustomEvent('voice-transfer-knowledge', { detail: command }));
          break;

        // ====================================================================
        // WIDGETS
        // ====================================================================
        case 'create_widget':
          toast({ title: '🎤 Creating Widget', description: command.purpose });
          window.dispatchEvent(new CustomEvent('voice-create-widget', { detail: command }));
          break;

        case 'list_widgets':
          toast({ title: '🎤 Listing Widgets' });
          window.dispatchEvent(new CustomEvent('voice-list-widgets'));
          break;

        case 'delete_widget':
          toast({ title: '🎤 Deleting Widget', description: command.widgetName || 'Widget' });
          window.dispatchEvent(new CustomEvent('voice-delete-widget', { detail: command }));
          break;

        case 'refresh_widget':
          toast({ title: '🎤 Refreshing Widget' });
          window.dispatchEvent(new CustomEvent('voice-refresh-widget', { detail: command }));
          break;

        case 'update_widget':
          toast({ title: '🎤 Updating Widget' });
          window.dispatchEvent(new CustomEvent('voice-update-widget', { detail: command }));
          break;

        // ====================================================================
        // DOCUMENTS
        // ====================================================================
        case 'upload_file':
          toast({ title: '🎤 Opening File Upload' });
          window.dispatchEvent(new CustomEvent('voice-upload-file', { detail: command }));
          break;

        case 'search_documents':
          toast({ title: '🎤 Searching Documents', description: command.query });
          setExpandedDomain('documents');
          window.dispatchEvent(new CustomEvent('voice-search-documents', { detail: command }));
          break;

        case 'list_documents':
          toast({ title: '🎤 Listing Documents' });
          setExpandedDomain('documents');
          break;

        case 'analyze_document':
          toast({ title: '🎤 Analyzing Document' });
          window.dispatchEvent(new CustomEvent('voice-analyze-document', { detail: command }));
          break;

        case 'summarize_document':
          toast({ title: '🎤 Summarizing Document' });
          window.dispatchEvent(new CustomEvent('voice-summarize-document', { detail: command }));
          break;

        case 'create_document':
          toast({ title: '🎤 Creating Document', description: command.title });
          window.dispatchEvent(new CustomEvent('voice-create-document', { detail: command }));
          break;

        // ====================================================================
        // KNOWLEDGE
        // ====================================================================
        case 'save_knowledge':
          toast({ title: '🎤 Saving Knowledge', description: command.title });
          window.dispatchEvent(new CustomEvent('voice-save-knowledge', { detail: command }));
          break;

        case 'search_knowledge':
          toast({ title: '🎤 Searching Knowledge', description: command.query });
          setExpandedDomain('knowledge');
          window.dispatchEvent(new CustomEvent('voice-search-knowledge', { detail: command }));
          break;

        case 'get_insights':
          toast({ title: '🎤 Getting Insights', description: command.topic || 'General' });
          window.dispatchEvent(new CustomEvent('voice-get-insights', { detail: command }));
          break;

        case 'ask_atlas':
          toast({ title: '🎤 Asking Atlas', description: command.question.slice(0, 50) + '...' });
          // Route to Atlas chat
          try {
            const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
              body: { action: 'chat', query: command.question },
            });
            if (error) throw error;
            toast({ title: '🤖 Atlas', description: data.response?.slice(0, 100) || 'Processing...' });
          } catch (err) {
            console.error('Error asking Atlas:', err);
            toast({ title: 'Atlas Error', description: 'Could not process question', variant: 'destructive' });
          }
          break;

        // ====================================================================
        // DASHBOARD CONTROL
        // ====================================================================
        case 'add_to_dashboard':
          toast({ title: '🎤 Adding to Dashboard', description: command.widgetType });
          window.dispatchEvent(new CustomEvent('voice-add-to-dashboard', { detail: command }));
          break;

        case 'rearrange_dashboard':
          toast({ title: '🎤 Rearranging Dashboard' });
          window.dispatchEvent(new CustomEvent('voice-rearrange-dashboard'));
          break;

        case 'reset_dashboard':
          toast({ title: '🎤 Resetting Dashboard' });
          window.dispatchEvent(new CustomEvent('voice-reset-dashboard'));
          break;

        case 'share_dashboard':
          toast({ title: '🎤 Sharing Dashboard' });
          window.dispatchEvent(new CustomEvent('voice-share-dashboard', { detail: command }));
          break;

        // ====================================================================
        // HELP & ASSISTANCE
        // ====================================================================
        case 'get_help':
          toast({ title: '🎤 Getting Help', description: command.topic || 'General help' });
          navigate('/help');
          break;

        case 'show_tutorial':
          toast({ title: '🎤 Starting Tutorial', description: command.feature || 'Getting started' });
          window.dispatchEvent(new CustomEvent('voice-show-tutorial', { detail: command }));
          break;

        case 'list_commands':
        case 'what_can_you_do':
          const categories = Object.keys(COMMAND_CATEGORIES);
          const commandCount = Object.values(COMMAND_CATEGORIES).flat().length;
          toast({ 
            title: '🎤 Atlas Voice Commands', 
            description: `I support ${commandCount}+ commands across ${categories.length} categories: ${categories.slice(0, 5).join(', ')}...`
          });
          window.dispatchEvent(new CustomEvent('voice-list-commands'));
          break;

        // ====================================================================
        // SYSTEM ACTIONS
        // ====================================================================
        case 'sync_all':
          toast({ title: '🎤 Syncing All Data' });
          requestRefresh();
          window.dispatchEvent(new CustomEvent('voice-sync-all'));
          break;

        case 'clear_cache':
          toast({ title: '🎤 Clearing Cache' });
          window.dispatchEvent(new CustomEvent('voice-clear-cache'));
          break;

        case 'check_status':
          toast({ title: '🎤 Checking System Status' });
          window.dispatchEvent(new CustomEvent('voice-check-status'));
          break;

        case 'get_summary':
          toast({ title: '🎤 Getting Daily Summary' });
          try {
            const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
              body: { action: 'get_personal_summary' },
            });
            if (error) throw error;
            toast({ title: '📊 Your Summary', description: `Tasks: ${data.summary?.activeTasks || 0}, Streak: ${data.summary?.currentStreak || 0} days` });
          } catch (err) {
            console.error('Error getting summary:', err);
          }
          break;

        // ====================================================================
        // AUTOMATION & WEBHOOKS
        // ====================================================================
        case 'create_automation': {
          toast({ title: '🎤 Creating Automation', description: command.name });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const client = supabase as any;
            const { error } = await client.from('automation_webhooks').insert({
              user_id: userId,
              name: command.name,
              description: command.description || null,
              webhook_url: command.webhookUrl || '',
              provider: command.provider || 'zapier',
              trigger_type: command.trigger || 'custom',
              trigger_conditions: {},
              is_active: true,
              headers: {},
            });
            if (error) throw error;
            toast({ title: '⚡ Automation Created', description: command.name });
            window.dispatchEvent(new CustomEvent('voice-automation-created'));
          } catch (err) {
            console.error('Error creating automation:', err);
            toast({ title: 'Failed to Create Automation', variant: 'destructive' });
          }
          break;
        }

        case 'list_automations': {
          toast({ title: '🎤 Listing Automations' });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const client = supabase as any;
            let query = client.from('automation_webhooks').select('*').eq('user_id', userId);
            if (command.filter === 'active') {
              query = query.eq('is_active', true);
            } else if (command.filter === 'inactive') {
              query = query.eq('is_active', false);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            const count = data?.length || 0;
            toast({ title: '⚡ Your Automations', description: `Found ${count} automation${count !== 1 ? 's' : ''}` });
            window.dispatchEvent(new CustomEvent('voice-automations-listed', { detail: data }));
          } catch (err) {
            console.error('Error listing automations:', err);
            toast({ title: 'Failed to List Automations', variant: 'destructive' });
          }
          break;
        }

        case 'toggle_automation': {
          toast({ title: '🎤 Toggling Automation', description: command.automationName || 'Automation' });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const client = supabase as any;
            // Find the automation
            let matchQuery = client.from('automation_webhooks').select('*').eq('user_id', userId);
            if (command.automationId) {
              matchQuery = matchQuery.eq('id', command.automationId);
            } else if (command.automationName) {
              matchQuery = matchQuery.ilike('name', `%${command.automationName}%`);
            }
            const { data: automations, error: findError } = await matchQuery.limit(1);
            if (findError) throw findError;
            if (!automations || automations.length === 0) {
              toast({ title: 'Automation Not Found', variant: 'destructive' });
              break;
            }
            const automation = automations[0];
            const { error } = await client.from('automation_webhooks')
              .update({ is_active: !automation.is_active })
              .eq('id', automation.id);
            if (error) throw error;
            toast({ title: automation.is_active ? '⏸️ Automation Disabled' : '▶️ Automation Enabled', description: automation.name });
          } catch (err) {
            console.error('Error toggling automation:', err);
            toast({ title: 'Failed to Toggle Automation', variant: 'destructive' });
          }
          break;
        }

        case 'delete_automation': {
          toast({ title: '🎤 Deleting Automation', description: command.automationName || 'Automation' });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const client = supabase as any;
            let deleteQuery = client.from('automation_webhooks').delete().eq('user_id', userId);
            if (command.automationId) {
              deleteQuery = deleteQuery.eq('id', command.automationId);
            } else if (command.automationName) {
              deleteQuery = deleteQuery.ilike('name', `%${command.automationName}%`);
            }
            const { error } = await deleteQuery;
            if (error) throw error;
            toast({ title: '🗑️ Automation Deleted', description: command.automationName || 'Automation removed' });
            window.dispatchEvent(new CustomEvent('voice-automation-deleted'));
          } catch (err) {
            console.error('Error deleting automation:', err);
            toast({ title: 'Failed to Delete Automation', variant: 'destructive' });
          }
          break;
        }

        case 'test_automation': {
          toast({ title: '🎤 Testing Automation', description: command.automationName || 'Testing...' });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const client = supabase as any;
            let matchQuery = client.from('automation_webhooks').select('*').eq('user_id', userId);
            if (command.automationId) {
              matchQuery = matchQuery.eq('id', command.automationId);
            } else if (command.automationName) {
              matchQuery = matchQuery.ilike('name', `%${command.automationName}%`);
            }
            const { data: automations, error: findError } = await matchQuery.limit(1);
            if (findError) throw findError;
            if (!automations || automations.length === 0) {
              toast({ title: 'Automation Not Found', variant: 'destructive' });
              break;
            }
            const automation = automations[0];
            if (automation.webhook_url) {
              await fetch(automation.webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...automation.headers },
                mode: 'no-cors',
                body: JSON.stringify({
                  test: true,
                  timestamp: new Date().toISOString(),
                  triggered_from: 'atlas_voice_test',
                  automation_name: automation.name,
                }),
              });
              // Update trigger count
              await client.from('automation_webhooks').update({
                last_triggered_at: new Date().toISOString(),
                trigger_count: (automation.trigger_count || 0) + 1,
              }).eq('id', automation.id);
            }
            toast({ title: '✅ Automation Tested', description: `Test payload sent to ${automation.name}` });
          } catch (err) {
            console.error('Error testing automation:', err);
            toast({ title: 'Test Failed', description: 'Could not send test payload', variant: 'destructive' });
          }
          break;
        }

        case 'trigger_webhook':
          toast({ title: '🎤 Triggering Webhook' });
          try {
            await fetch(command.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              mode: 'no-cors',
              body: JSON.stringify({
                ...(command.payload || {}),
                timestamp: new Date().toISOString(),
                triggered_from: 'atlas_voice',
              }),
            });
            toast({ title: '⚡ Webhook Triggered', description: 'Payload sent successfully' });
          } catch (err) {
            console.error('Error triggering webhook:', err);
            toast({ title: 'Webhook Failed', variant: 'destructive' });
          }
          break;

        case 'connect_zapier':
        case 'connect_make':
        case 'connect_n8n': {
          const providerName = command.type === 'connect_zapier' ? 'Zapier' : command.type === 'connect_make' ? 'Make' : 'n8n';
          const provider = command.type === 'connect_zapier' ? 'zapier' : command.type === 'connect_make' ? 'make' : 'n8n';
          toast({ title: `🎤 Connecting to ${providerName}`, description: command.webhookUrl ? 'Setting up webhook...' : 'Please provide a webhook URL' });
          if (command.webhookUrl) {
            const userId = await getUserId();
            if (!userId) {
              toast({ title: 'Authentication Required', variant: 'destructive' });
              break;
            }
            try {
              const client = supabase as any;
              const { error } = await client.from('automation_webhooks').insert({
                user_id: userId,
                name: `${providerName} Automation`,
                webhook_url: command.webhookUrl,
                provider: provider,
                trigger_type: command.triggerType || 'custom',
                is_active: true,
                trigger_conditions: {},
                headers: {},
              });
              if (error) throw error;
              toast({ title: `⚡ ${providerName} Connected`, description: 'Webhook automation created' });
              window.dispatchEvent(new CustomEvent('voice-automation-created'));
            } catch (err) {
              console.error(`Error connecting ${providerName}:`, err);
              toast({ title: `Failed to Connect ${providerName}`, variant: 'destructive' });
            }
          } else {
            // Open dialog or prompt for webhook URL
            window.dispatchEvent(new CustomEvent('voice-open-dialog', { detail: { dialog: 'connect_automation', provider } }));
          }
          break;
        }

        case 'get_automation_history': {
          toast({ title: '🎤 Getting Automation History' });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const client = supabase as any;
            let matchQuery = client.from('automation_webhooks').select('*').eq('user_id', userId);
            if (command.automationId) {
              matchQuery = matchQuery.eq('id', command.automationId);
            } else if (command.automationName) {
              matchQuery = matchQuery.ilike('name', `%${command.automationName}%`);
            }
            const { data, error } = await matchQuery.limit(1);
            if (error) throw error;
            if (data && data.length > 0) {
              const automation = data[0];
              toast({ 
                title: `📊 ${automation.name}`, 
                description: `Triggered ${automation.trigger_count || 0} times. Last: ${automation.last_triggered_at ? new Date(automation.last_triggered_at).toLocaleString() : 'Never'}`
              });
            } else {
              toast({ title: 'Automation Not Found', variant: 'destructive' });
            }
          } catch (err) {
            console.error('Error getting automation history:', err);
            toast({ title: 'Failed to Get History', variant: 'destructive' });
          }
          break;
        }

        case 'set_automation_schedule':
          toast({ title: '🎤 Setting Automation Schedule', description: command.schedule });
          window.dispatchEvent(new CustomEvent('voice-set-automation-schedule', { detail: command }));
          break;

        case 'create_workflow_automation':
          toast({ title: '🎤 Creating Workflow Automation', description: command.name });
          window.dispatchEvent(new CustomEvent('voice-create-workflow-automation', { detail: command }));
          break;

        // ====================================================================
        // NATIVE ATLAS/SUPABASE AUTOMATIONS
        // ====================================================================
        case 'create_atlas_workflow': {
          toast({ title: '🎤 Creating Atlas Workflow', description: command.name });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { error } = await supabase.from('atlas_workflows').insert({
              user_id: userId,
              name: command.name,
              description: command.description || null,
              trigger_type: command.triggerType,
              trigger_config: {},
              action_type: command.actionType,
              action_config: {},
              is_active: true,
            });
            if (error) throw error;
            toast({ title: '⚙️ Workflow Created', description: `${command.name} is now active` });
            window.dispatchEvent(new CustomEvent('voice-workflow-created'));
          } catch (err) {
            console.error('Error creating workflow:', err);
            toast({ title: 'Failed to Create Workflow', variant: 'destructive' });
          }
          break;
        }

        case 'list_atlas_workflows': {
          toast({ title: '🎤 Listing Atlas Workflows' });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            let query = supabase.from('atlas_workflows').select('*').eq('user_id', userId);
            if (command.filter === 'active') {
              query = query.eq('is_active', true);
            } else if (command.filter === 'inactive') {
              query = query.eq('is_active', false);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            const count = data?.length || 0;
            toast({ title: '⚙️ Your Workflows', description: `Found ${count} workflow${count !== 1 ? 's' : ''}` });
            window.dispatchEvent(new CustomEvent('voice-workflows-listed', { detail: data }));
          } catch (err) {
            console.error('Error listing workflows:', err);
            toast({ title: 'Failed to List Workflows', variant: 'destructive' });
          }
          break;
        }

        case 'run_atlas_workflow': {
          toast({ title: '🎤 Running Workflow', description: command.workflowName });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            // Find the workflow
            const { data: workflows, error: findError } = await supabase
              .from('atlas_workflows')
              .select('*')
              .eq('user_id', userId)
              .ilike('name', `%${command.workflowName}%`)
              .limit(1);
            if (findError) throw findError;
            if (!workflows || workflows.length === 0) {
              toast({ title: 'Workflow Not Found', variant: 'destructive' });
              break;
            }
            const workflow = workflows[0];
            // Create a workflow run
            const { error: runError } = await supabase.from('atlas_workflow_runs').insert({
              workflow_id: workflow.id,
              user_id: userId,
              status: 'running',
              trigger_data: { source: 'voice_command' },
            });
            if (runError) throw runError;
            // Update trigger count
            await supabase.from('atlas_workflows').update({
              trigger_count: (workflow.trigger_count || 0) + 1,
              last_triggered_at: new Date().toISOString(),
            }).eq('id', workflow.id);
            toast({ title: '▶️ Workflow Started', description: workflow.name });
            window.dispatchEvent(new CustomEvent('voice-workflow-run', { detail: workflow }));
          } catch (err) {
            console.error('Error running workflow:', err);
            toast({ title: 'Failed to Run Workflow', variant: 'destructive' });
          }
          break;
        }

        case 'schedule_atlas_task': {
          toast({ title: '🎤 Scheduling Task', description: `${command.taskName} - ${command.schedule}` });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            // Create a scheduled workflow
            const { error } = await supabase.from('atlas_workflows').insert({
              user_id: userId,
              name: command.taskName,
              description: `Scheduled: ${command.schedule}`,
              trigger_type: 'schedule',
              trigger_config: { schedule: command.schedule },
              action_type: command.action,
              action_config: {},
              is_active: true,
            });
            if (error) throw error;
            toast({ title: '📅 Task Scheduled', description: `${command.taskName} will run ${command.schedule}` });
          } catch (err) {
            console.error('Error scheduling task:', err);
            toast({ title: 'Failed to Schedule Task', variant: 'destructive' });
          }
          break;
        }

        case 'create_database_trigger':
          toast({ title: '🎤 Database Triggers', description: `Trigger on ${command.tableName} (${command.event})` });
          toast({ 
            title: '⚠️ Database triggers require migration', 
            description: 'Please ask me to create a database trigger migration for this.',
          });
          window.dispatchEvent(new CustomEvent('voice-create-db-trigger', { detail: command }));
          break;

        case 'list_scheduled_jobs': {
          toast({ title: '🎤 Listing Scheduled Jobs' });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { data, error } = await supabase
              .from('atlas_workflows')
              .select('*')
              .eq('user_id', userId)
              .eq('trigger_type', 'schedule')
              .order('created_at', { ascending: false });
            if (error) throw error;
            const count = data?.length || 0;
            toast({ title: '📅 Scheduled Jobs', description: `Found ${count} scheduled job${count !== 1 ? 's' : ''}` });
            window.dispatchEvent(new CustomEvent('voice-scheduled-jobs-listed', { detail: data }));
          } catch (err) {
            console.error('Error listing scheduled jobs:', err);
            toast({ title: 'Failed to List Jobs', variant: 'destructive' });
          }
          break;
        }

        case 'cancel_scheduled_job': {
          toast({ title: '🎤 Cancelling Scheduled Job', description: command.jobName });
          const userId = await getUserId();
          if (!userId) {
            toast({ title: 'Authentication Required', variant: 'destructive' });
            break;
          }
          try {
            const { error } = await supabase
              .from('atlas_workflows')
              .update({ is_active: false })
              .eq('user_id', userId)
              .eq('trigger_type', 'schedule')
              .ilike('name', `%${command.jobName}%`);
            if (error) throw error;
            toast({ title: '⏹️ Job Cancelled', description: command.jobName });
          } catch (err) {
            console.error('Error cancelling job:', err);
            toast({ title: 'Failed to Cancel Job', variant: 'destructive' });
          }
          break;
        }

        default:
          console.warn('Unknown command type:', command);
          toast({ title: '🎤 Unknown Command', description: 'I didn\'t understand that command', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Command execution error:', error);
      toast({ title: 'Command Failed', description: 'Could not execute voice command', variant: 'destructive' });
    } finally {
      setProcessing(false);
      clearCommand();
    }
  }, [
    navigate, toast, setTheme, theme,
    setActiveTab, setExpandedDomain, setTargetPersona,
    requestReportGeneration, setEnterpriseQuery, setTriggerEnterpriseQuery,
    requestRefresh, clearCommand, setProcessing
  ]);

  useEffect(() => {
    if (currentCommand) {
      executeCommand(currentCommand);
    }
  }, [currentCommand, executeCommand]);
}
