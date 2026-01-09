import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Json | null;
  action_type: string;
  action_config: Json | null;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Visual builder data
  nodes?: WorkflowNode[];
  connections?: WorkflowConnection[];
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  trigger_data: Json | null;
  result_data: Json | null;
  error_message: string | null;
  user_id: string;
}

export const TRIGGER_TYPES = [
  { id: 'manual', label: 'Manual', description: 'Trigger workflow manually', icon: 'play' },
  { id: 'schedule', label: 'Scheduled', description: 'Run on a schedule', icon: 'clock' },
  { id: 'webhook', label: 'Webhook', description: 'Trigger via external webhook', icon: 'webhook' },
  { id: 'data_change', label: 'Data Change', description: 'When data is created/updated', icon: 'database' },
  { id: 'threshold', label: 'Threshold', description: 'When metrics cross threshold', icon: 'alert-triangle' },
  { id: 'event', label: 'Event', description: 'On calendar event', icon: 'calendar' },
];

export const ACTION_TYPES = [
  { id: 'create_task', label: 'Create Task', description: 'Create a new task', icon: 'check-square' },
  { id: 'send_notification', label: 'Send Notification', description: 'Send alert/notification', icon: 'bell' },
  { id: 'generate_report', label: 'Generate Report', description: 'Create a summary report', icon: 'file-text' },
  { id: 'run_agent', label: 'Run Agent', description: 'Execute an AI agent', icon: 'cpu' },
  { id: 'send_email', label: 'Send Email', description: 'Send an email', icon: 'mail' },
  { id: 'update_data', label: 'Update Data', description: 'Modify existing data', icon: 'edit' },
  { id: 'call_api', label: 'Call API', description: 'Make external API call', icon: 'globe' },
  { id: 'ai_analysis', label: 'AI Analysis', description: 'Run AI analysis on data', icon: 'brain' },
];

export const CONDITION_TYPES = [
  { id: 'if_then', label: 'If/Then', description: 'Conditional branching', icon: 'git-branch' },
  { id: 'filter', label: 'Filter', description: 'Filter data based on criteria', icon: 'filter' },
  { id: 'delay', label: 'Delay', description: 'Wait for specified time', icon: 'timer' },
  { id: 'loop', label: 'Loop', description: 'Iterate over items', icon: 'repeat' },
];

export function useWorkflows(userId: string | undefined) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const { data: workflowData, error: workflowError } = await supabase
        .from('atlas_workflows')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (workflowError) throw workflowError;
      setWorkflows(workflowData || []);

      const { data: runData, error: runError } = await supabase
        .from('atlas_workflow_runs')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(50);

      if (runError) throw runError;
      setRuns(runData || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const createWorkflow = useCallback(async (
    workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'trigger_count' | 'last_triggered_at'>
  ) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('atlas_workflows')
        .insert({
          name: workflow.name,
          description: workflow.description,
          trigger_type: workflow.trigger_type,
          trigger_config: workflow.trigger_config,
          action_type: workflow.action_type,
          action_config: workflow.action_config,
          is_active: workflow.is_active,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      setWorkflows(prev => [data, ...prev]);
      toast.success('Workflow created successfully');
      return data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
      return null;
    }
  }, [userId]);

  const updateWorkflow = useCallback(async (
    id: string,
    updates: Partial<Workflow>
  ) => {
    try {
      const { data, error } = await supabase
        .from('atlas_workflows')
        .update({
          name: updates.name,
          description: updates.description,
          trigger_type: updates.trigger_type,
          trigger_config: updates.trigger_config,
          action_type: updates.action_type,
          action_config: updates.action_config,
          is_active: updates.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setWorkflows(prev => prev.map(w => w.id === id ? data : w));
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(data);
      }
      toast.success('Workflow updated');
      return data;
    } catch (error) {
      console.error('Error updating workflow:', error);
      toast.error('Failed to update workflow');
      return null;
    }
  }, [selectedWorkflow]);

  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('atlas_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setWorkflows(prev => prev.filter(w => w.id !== id));
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
      }
      toast.success('Workflow deleted');
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  }, [selectedWorkflow]);

  const toggleWorkflow = useCallback(async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('atlas_workflows')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      setWorkflows(prev => prev.map(w => 
        w.id === id ? { ...w, is_active: isActive } : w
      ));
      toast.success(isActive ? 'Workflow activated' : 'Workflow paused');
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast.error('Failed to update workflow');
    }
  }, []);

  const runWorkflow = useCallback(async (id: string, triggerData?: Record<string, any>) => {
    if (!userId) return null;

    try {
      // Create run record
      const { data: run, error: runError } = await supabase
        .from('atlas_workflow_runs')
        .insert({
          workflow_id: id,
          user_id: userId,
          status: 'running',
          trigger_data: triggerData || {},
        })
        .select()
        .single();

      if (runError) throw runError;

      // Trigger via enterprise query
      const { data, error } = await supabase.functions.invoke('atlas-enterprise-query', {
        body: {
          action: 'workflow_trigger',
          userId,
          workflowId: id,
        }
      });

      // Update run status
      const finalStatus = error ? 'failed' : 'completed';
      await supabase
        .from('atlas_workflow_runs')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          result_data: data?.result || null,
          error_message: error?.message || null,
        })
        .eq('id', run.id);

      // Update workflow trigger count
      await supabase
        .from('atlas_workflows')
        .update({
          trigger_count: (workflows.find(w => w.id === id)?.trigger_count || 0) + 1,
          last_triggered_at: new Date().toISOString(),
        })
        .eq('id', id);

      await fetchWorkflows();
      toast.success('Workflow executed');
      return data;
    } catch (error) {
      console.error('Error running workflow:', error);
      toast.error('Failed to run workflow');
      return null;
    }
  }, [userId, workflows, fetchWorkflows]);

  const getWorkflowRuns = useCallback((workflowId: string) => {
    return runs.filter(r => r.workflow_id === workflowId);
  }, [runs]);

  return {
    workflows,
    runs,
    isLoading,
    selectedWorkflow,
    setSelectedWorkflow,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    runWorkflow,
    getWorkflowRuns,
  };
}
