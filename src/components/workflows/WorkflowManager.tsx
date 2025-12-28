import { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Bell,
  FileText,
  Calendar,
  ChevronRight,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Json;
  action_type: string;
  action_config: Json;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: string;
  trigger_data: Json;
  result_data: Json;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

interface WorkflowManagerProps {
  userId: string | undefined;
}

const TRIGGER_TYPES = [
  { id: 'manual', label: 'Manual', icon: Play, description: 'Trigger manually' },
  { id: 'schedule', label: 'Scheduled', icon: Clock, description: 'Run on a schedule' },
  { id: 'insight', label: 'On Insight', icon: Zap, description: 'When Atlas finds an insight' },
  { id: 'report', label: 'On Report', icon: FileText, description: 'After report generation' },
];

const ACTION_TYPES = [
  { id: 'create_task', label: 'Create Task', icon: CheckCircle2, description: 'Add a new task' },
  { id: 'send_notification', label: 'Notification', icon: Bell, description: 'Send a notification' },
  { id: 'generate_summary', label: 'Generate Summary', icon: FileText, description: 'Create an AI summary' },
  { id: 'schedule_followup', label: 'Schedule Follow-up', icon: Calendar, description: 'Create a calendar reminder' },
];

export function WorkflowManager({ userId }: WorkflowManagerProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  // Create form state
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger_type: 'manual',
    action_type: 'create_task',
    action_config: { title: '', description: '' }
  });

  useEffect(() => {
    if (!userId) return;
    fetchWorkflows();
  }, [userId]);

  const fetchWorkflows = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('atlas_workflows')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);

      // Fetch recent runs
      const { data: runsData } = await supabase
        .from('atlas_workflow_runs')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(20);

      setRuns(runsData || []);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkflow = async () => {
    if (!userId || !newWorkflow.name || !newWorkflow.action_type) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('atlas_workflows')
        .insert({
          user_id: userId,
          name: newWorkflow.name,
          description: newWorkflow.description || null,
          trigger_type: newWorkflow.trigger_type,
          trigger_config: {},
          action_type: newWorkflow.action_type,
          action_config: newWorkflow.action_config
        })
        .select()
        .single();

      if (error) throw error;

      setWorkflows(prev => [data, ...prev]);
      setShowCreateDialog(false);
      setNewWorkflow({
        name: '',
        description: '',
        trigger_type: 'manual',
        action_type: 'create_task',
        action_config: { title: '', description: '' }
      });
      toast.success('Workflow created');
    } catch (error) {
      console.error('Failed to create workflow:', error);
      toast.error('Failed to create workflow');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleWorkflow = async (workflow: Workflow) => {
    try {
      const { error } = await supabase
        .from('atlas_workflows')
        .update({ is_active: !workflow.is_active })
        .eq('id', workflow.id);

      if (error) throw error;

      setWorkflows(prev => prev.map(w => 
        w.id === workflow.id ? { ...w, is_active: !w.is_active } : w
      ));
      toast.success(workflow.is_active ? 'Workflow paused' : 'Workflow activated');
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
      toast.error('Failed to update workflow');
    }
  };

  const runWorkflow = async (workflow: Workflow) => {
    if (!userId) return;

    try {
      // Create a run record
      const { data: run, error: runError } = await supabase
        .from('atlas_workflow_runs')
        .insert({
          workflow_id: workflow.id,
          user_id: userId,
          status: 'running',
          trigger_data: { manual: true }
        })
        .select()
        .single();

      if (runError) throw runError;

      toast.info(`Running workflow: ${workflow.name}`);

      // Execute the action based on type
      let resultData = {};
      let status = 'completed';
      let errorMessage = null;

      try {
        const actionConfig = workflow.action_config as Record<string, any> || {};
        
        switch (workflow.action_type) {
          case 'create_task':
            const { error: taskError } = await supabase
              .from('csuite_tasks')
              .insert({
                user_id: userId,
                title: actionConfig.title || `Task from ${workflow.name}`,
                description: actionConfig.description || '',
                source: 'atlas_workflow',
                status: 'pending',
                priority: 'medium'
              });
            if (taskError) throw taskError;
            resultData = { taskCreated: true };
            break;

          case 'send_notification':
            toast.info(actionConfig.message || 'Workflow notification');
            resultData = { notificationSent: true };
            break;

          case 'generate_summary':
            const { data: summaryData, error: summaryError } = await supabase.functions.invoke('atlas-generate-summary', {
              body: { userId, requirements: actionConfig.requirements }
            });
            if (summaryError) throw summaryError;
            resultData = { summaryGenerated: true, summary: summaryData };
            break;

          default:
            resultData = { executed: true };
        }
      } catch (actionError) {
        status = 'failed';
        errorMessage = actionError instanceof Error ? actionError.message : 'Action failed';
      }

      // Update run status
      await supabase
        .from('atlas_workflow_runs')
        .update({
          status,
          result_data: resultData,
          error_message: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id);

      // Update workflow stats
      await supabase
        .from('atlas_workflows')
        .update({
          last_triggered_at: new Date().toISOString(),
          trigger_count: workflow.trigger_count + 1
        })
        .eq('id', workflow.id);

      fetchWorkflows();
      toast.success('Workflow completed');
    } catch (error) {
      console.error('Failed to run workflow:', error);
      toast.error('Failed to run workflow');
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    try {
      const { error } = await supabase
        .from('atlas_workflows')
        .delete()
        .eq('id', workflowId);

      if (error) throw error;

      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      toast.success('Workflow deleted');
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const getTriggerIcon = (type: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.id === type);
    return trigger?.icon || Zap;
  };

  const getActionIcon = (type: string) => {
    const action = ACTION_TYPES.find(a => a.id === type);
    return action?.icon || Zap;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          <span className="text-xs font-mono text-muted-foreground">AUTOMATED WORKFLOWS</span>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-6 text-[10px] font-mono gap-1">
              <Plus size={10} />
              NEW
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-mono">Create Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono">Name</Label>
                <Input
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Workflow"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono">Description</Label>
                <Textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What this workflow does..."
                  className="text-sm h-20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono">Trigger</Label>
                <Select
                  value={newWorkflow.trigger_type}
                  onValueChange={(value) => setNewWorkflow(prev => ({ ...prev, trigger_type: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map(trigger => (
                      <SelectItem key={trigger.id} value={trigger.id} className="text-sm">
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono">Action</Label>
                <Select
                  value={newWorkflow.action_type}
                  onValueChange={(value) => setNewWorkflow(prev => ({ ...prev, action_type: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(action => (
                      <SelectItem key={action.id} value={action.id} className="text-sm">
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newWorkflow.action_type === 'create_task' && (
                <div className="space-y-2">
                  <Label className="text-xs font-mono">Task Title</Label>
                  <Input
                    value={newWorkflow.action_config.title || ''}
                    onChange={(e) => setNewWorkflow(prev => ({
                      ...prev,
                      action_config: { ...prev.action_config, title: e.target.value }
                    }))}
                    placeholder="Task title..."
                    className="text-sm"
                  />
                </div>
              )}
              <Button
                onClick={createWorkflow}
                disabled={isCreating || !newWorkflow.name}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <RefreshCw size={14} className="mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Workflow'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 p-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={20} className="animate-spin text-primary" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Zap size={20} className="text-primary" />
            </div>
            <p className="text-xs font-mono text-muted-foreground mb-1">No workflows yet</p>
            <p className="text-[10px] text-muted-foreground/70">
              Create automated actions triggered by Atlas
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {workflows.map(workflow => {
              const TriggerIcon = getTriggerIcon(workflow.trigger_type);
              const ActionIcon = getActionIcon(workflow.action_type);

              return (
                <div
                  key={workflow.id}
                  className="p-3 rounded-lg bg-background border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={() => toggleWorkflow(workflow)}
                        className="scale-75"
                      />
                      <span className="text-xs font-mono text-foreground">{workflow.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {workflow.trigger_type === 'manual' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => runWorkflow(workflow)}
                        >
                          <Play size={10} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => deleteWorkflow(workflow.id)}
                      >
                        <Trash2 size={10} />
                      </Button>
                    </div>
                  </div>
                  
                  {workflow.description && (
                    <p className="text-[10px] text-muted-foreground mb-2">{workflow.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-[9px]">
                    <Badge variant="outline" className="gap-1 px-1.5 py-0">
                      <TriggerIcon size={8} />
                      {workflow.trigger_type}
                    </Badge>
                    <ChevronRight size={10} className="text-muted-foreground" />
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0">
                      <ActionIcon size={8} />
                      {workflow.action_type.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[9px] text-muted-foreground">
                    <span>{workflow.trigger_count} runs</span>
                    {workflow.last_triggered_at && (
                      <span>Last: {new Date(workflow.last_triggered_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Runs */}
        {runs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={12} className="text-primary" />
              <span className="text-[10px] font-mono text-muted-foreground">RECENT RUNS</span>
            </div>
            <div className="space-y-1">
              {runs.slice(0, 5).map(run => {
                const workflow = workflows.find(w => w.id === run.workflow_id);
                return (
                  <div key={run.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      {run.status === 'completed' ? (
                        <CheckCircle2 size={10} className="text-green-500" />
                      ) : run.status === 'failed' ? (
                        <AlertCircle size={10} className="text-red-500" />
                      ) : (
                        <RefreshCw size={10} className="text-yellow-500 animate-spin" />
                      )}
                      <span className="text-[10px] text-foreground">{workflow?.name || 'Unknown'}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
