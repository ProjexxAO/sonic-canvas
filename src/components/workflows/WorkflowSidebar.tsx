import { useState } from 'react';
import { 
  Settings2, 
  Zap, 
  History, 
  ChevronRight,
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Workflow, 
  WorkflowRun, 
  WorkflowNode,
  TRIGGER_TYPES,
  ACTION_TYPES,
  CONDITION_TYPES 
} from '@/hooks/useWorkflows';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface WorkflowSidebarProps {
  workflow: Workflow | null;
  selectedNode: WorkflowNode | null;
  runs: WorkflowRun[];
  onWorkflowChange: (updates: Partial<Workflow>) => void;
  onNodeChange: (node: WorkflowNode) => void;
  onRun: () => void;
  onDelete: () => void;
}

const STATUS_CONFIG = {
  running: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  pending: { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function WorkflowSidebar({
  workflow,
  selectedNode,
  runs,
  onWorkflowChange,
  onNodeChange,
  onRun,
  onDelete,
}: WorkflowSidebarProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'node' | 'history'>('settings');

  if (!workflow) {
    return (
      <div className="w-80 border-l border-border bg-background p-4 flex items-center justify-center">
        <div className="text-center text-muted-foreground text-sm">
          Select or create a workflow to configure
        </div>
      </div>
    );
  }

  const getNodeTypes = () => {
    if (!selectedNode) return [];
    switch (selectedNode.type) {
      case 'trigger': return TRIGGER_TYPES;
      case 'action': return ACTION_TYPES;
      case 'condition': return CONDITION_TYPES;
      default: return [];
    }
  };

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold truncate">{workflow.name}</h3>
          <div className="flex items-center gap-1">
            <Switch
              checked={workflow.is_active}
              onCheckedChange={(checked) => onWorkflowChange({ is_active: checked })}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 gap-1"
            onClick={onRun}
            disabled={!workflow.is_active}
          >
            <Play size={12} />
            Run Now
          </Button>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={onDelete}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger 
            value="settings" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <Settings2 size={12} className="mr-1" />
            Settings
          </TabsTrigger>
          <TabsTrigger 
            value="node" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            disabled={!selectedNode}
          >
            <Zap size={12} className="mr-1" />
            Node
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          >
            <History size={12} className="mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="settings" className="p-4 space-y-4 mt-0">
            <div className="space-y-2">
              <Label className="text-xs">Workflow Name</Label>
              <Input
                value={workflow.name}
                onChange={(e) => onWorkflowChange({ name: e.target.value })}
                placeholder="My Workflow"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={workflow.description || ''}
                onChange={(e) => onWorkflowChange({ description: e.target.value })}
                placeholder="What does this workflow do?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Trigger Type</Label>
              <Select
                value={workflow.trigger_type}
                onValueChange={(value) => onWorkflowChange({ trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Action Type</Label>
              <Select
                value={workflow.action_type}
                onValueChange={(value) => onWorkflowChange({ action_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Runs</span>
                <span className="font-mono">{workflow.trigger_count}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Last Run</span>
                <span className="font-mono">
                  {workflow.last_triggered_at 
                    ? formatDistanceToNow(new Date(workflow.last_triggered_at), { addSuffix: true })
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Created</span>
                <span className="font-mono">
                  {format(new Date(workflow.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="node" className="p-4 space-y-4 mt-0">
            {selectedNode ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Node Label</Label>
                  <Input
                    value={selectedNode.label}
                    onChange={(e) => onNodeChange({ ...selectedNode, label: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={selectedNode.config?.typeId || ''}
                    onValueChange={(value) => {
                      const typeConfig = getNodeTypes().find(t => t.id === value);
                      if (typeConfig) {
                        onNodeChange({
                          ...selectedNode,
                          label: typeConfig.label,
                          config: { ...selectedNode.config, typeId: value, ...typeConfig },
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getNodeTypes().map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedNode.type.toUpperCase()}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">
                Select a node to configure
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="p-0 mt-0">
            {runs.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No runs yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {runs.map(run => {
                  const config = STATUS_CONFIG[run.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                  const StatusIcon = config.icon;
                  
                  return (
                    <div key={run.id} className="p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn('p-1 rounded', config.bg)}>
                          <StatusIcon size={12} className={config.color} />
                        </div>
                        <span className="text-xs font-medium capitalize">{run.status}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                        </span>
                      </div>
                      {run.error_message && (
                        <div className="text-xs text-red-400 mt-1 truncate">
                          {run.error_message}
                        </div>
                      )}
                      {run.completed_at && (
                        <div className="text-[10px] text-muted-foreground">
                          Duration: {Math.round(
                            (new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()) / 1000
                          )}s
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
