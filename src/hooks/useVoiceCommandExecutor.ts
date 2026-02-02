import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceCommandBus, VoiceCommand } from '@/lib/voice-command-bus';
import { useDataHubController } from '@/hooks/useDataHubController';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';

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

  const executeCommand = useCallback(async (command: VoiceCommand) => {
    console.log('⚡ Executing voice command:', command);
    setProcessing(true);

    try {
      switch (command.type) {
        // === NAVIGATION ===
        case 'navigate':
          navigate(command.path);
          toast({
            title: '🎤 Voice Navigation',
            description: `Navigating to ${command.path}`,
          });
          break;

        // === DATA HUB CONTROL ===
        case 'switch_tab':
          setActiveTab(command.tab);
          toast({
            title: '🎤 Tab Switched',
            description: `Switched to ${command.tab} tab`,
          });
          break;

        case 'expand_domain':
          setExpandedDomain(command.domain);
          toast({
            title: '🎤 Domain Opened',
            description: `Expanded ${command.domain} domain`,
          });
          break;

        case 'collapse_domain':
          setExpandedDomain(null);
          toast({
            title: '🎤 Domain Closed',
            description: 'Returned to hub view',
          });
          break;

        case 'switch_persona':
          setTargetPersona(command.persona);
          toast({
            title: '🎤 Persona Changed',
            description: `Switched to ${command.persona.toUpperCase()} view`,
          });
          break;

        // === REPORTS & QUERIES ===
        case 'generate_report':
          requestReportGeneration(command.persona || 'ceo');
          toast({
            title: '🎤 Report Requested',
            description: `Generating ${command.persona || 'CEO'} report...`,
          });
          break;

        case 'run_query':
          setEnterpriseQuery(command.query);
          setTriggerEnterpriseQuery(true);
          toast({
            title: '🎤 Query Running',
            description: `Analyzing: ${command.query}`,
          });
          break;

        case 'refresh_data':
          requestRefresh();
          toast({
            title: '🎤 Refreshing',
            description: 'Updating data...',
          });
          break;

        // === THEME ===
        case 'toggle_theme':
          setTheme(theme === 'dark' ? 'light' : 'dark');
          toast({
            title: '🎤 Theme Toggled',
            description: `Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`,
          });
          break;

        case 'set_theme':
          setTheme(command.theme);
          toast({
            title: '🎤 Theme Changed',
            description: `Set to ${command.theme} mode`,
          });
          break;

        // === FILTERING ===
        case 'filter':
          window.dispatchEvent(new CustomEvent('voice-filter', {
            detail: {
              entity: command.entity,
              criteria: command.criteria
            }
          }));
          toast({
            title: '🎤 Filter Applied',
            description: `Filtering ${command.entity}`,
          });
          break;

        case 'filter_agents':
          window.dispatchEvent(new CustomEvent('voice-filter-agents', {
            detail: {
              sector: command.sector,
              status: command.status,
              capability: command.capability
            }
          }));
          toast({
            title: '🎤 Agents Filtered',
            description: `Showing ${command.sector || command.status || 'filtered'} agents`,
          });
          break;

        case 'clear_filters':
          window.dispatchEvent(new CustomEvent('voice-clear-filters'));
          toast({
            title: '🎤 Filters Cleared',
            description: 'Showing all items',
          });
          break;

        // === SEARCH ===
        case 'search':
          window.dispatchEvent(new CustomEvent('voice-search', {
            detail: {
              query: command.query,
              scope: command.scope
            }
          }));
          toast({
            title: '🎤 Searching',
            description: `Searching for: ${command.query}`,
          });
          break;

        // === DIALOGS ===
        case 'open_dialog':
          window.dispatchEvent(new CustomEvent('voice-open-dialog', {
            detail: { dialog: command.dialog }
          }));
          toast({
            title: '🎤 Opening',
            description: `Opening ${command.dialog.replace(/_/g, ' ')}`,
          });
          break;

        // === NOTIFICATIONS ===
        case 'show_notification':
          toast({
            title: command.variant === 'error' ? '❌ Error' : 
                   command.variant === 'info' ? 'ℹ️ Info' : '✅ Success',
            description: command.message,
            variant: command.variant === 'error' ? 'destructive' : 'default'
          });
          break;

        case 'voice_response':
          toast({
            title: '🎤 Atlas',
            description: command.text,
          });
          break;

        // === WORKFLOWS ===
        case 'trigger_workflow':
          window.dispatchEvent(new CustomEvent('voice-trigger-workflow', {
            detail: { workflowId: command.workflowId }
          }));
          toast({
            title: '🎤 Workflow Triggered',
            description: `Starting workflow ${command.workflowId}`,
          });
          break;

        // === EMAIL / COMMUNICATIONS ===
        case 'draft_email':
          toast({
            title: '🎤 Drafting Email',
            description: `Atlas is drafting an email...`,
          });
          try {
            const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
              body: {
                action: 'draft_message',
                context: command.intent,
                platform: 'gmail',
              },
            });
            if (error) throw error;
            
            window.dispatchEvent(new CustomEvent('atlas-email-drafted', {
              detail: { draft: data.draft, suggestions: data.suggestions, messageId: data.messageId }
            }));
            
            toast({
              title: '✉️ Draft Ready',
              description: 'Atlas has drafted your email. Review it in Communications.',
            });
            
            // Navigate to communications
            setExpandedDomain('communications');
          } catch (err) {
            console.error('Error drafting email:', err);
            toast({
              title: 'Draft Failed',
              description: 'Could not generate email draft',
              variant: 'destructive'
            });
          }
          break;

        case 'compose_email':
          toast({
            title: '🎤 Composing Email',
            description: `Atlas is composing email to ${command.to}...`,
          });
          try {
            const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
              body: {
                action: 'compose_email',
                to: command.to,
                subject: command.subject,
                intent: command.intent,
                urgency: command.urgency,
              },
            });
            if (error) throw error;
            
            window.dispatchEvent(new CustomEvent('atlas-email-composed', {
              detail: { 
                messageId: data.messageId, 
                subject: data.subject, 
                body: data.body,
                to: data.to,
                requiresApproval: data.requiresApproval 
              }
            }));
            
            toast({
              title: '✉️ Email Composed',
              description: `Email to ${command.to} ready for your approval.`,
            });
            
            // Navigate to communications
            setExpandedDomain('communications');
          } catch (err) {
            console.error('Error composing email:', err);
            toast({
              title: 'Compose Failed',
              description: 'Could not compose email',
              variant: 'destructive'
            });
          }
          break;

        case 'send_email':
          toast({
            title: '🎤 Sending Email',
            description: `Sending email to ${command.to}...`,
          });
          try {
            const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
              body: {
                action: 'send_message',
                content: command.content || '',
                subject: command.subject,
                toAddresses: [command.to],
                platform: 'gmail',
                isDraft: true, // Always require approval
              },
            });
            if (error) throw error;
            
            toast({
              title: '✉️ Email Queued',
              description: 'Email saved. Please review and approve to send.',
            });
            
            setExpandedDomain('communications');
          } catch (err) {
            console.error('Error sending email:', err);
            toast({
              title: 'Send Failed',
              description: 'Could not queue email',
              variant: 'destructive'
            });
          }
          break;

        case 'open_communications':
          setExpandedDomain('communications');
          toast({
            title: '🎤 Opening Communications',
            description: 'Showing your inbox and messages',
          });
          break;

        default:
          console.warn('Unknown command type:', command);
      }
    } catch (error) {
      console.error('Command execution error:', error);
      toast({
        title: 'Command Failed',
        description: 'Could not execute voice command',
        variant: 'destructive'
      });
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
