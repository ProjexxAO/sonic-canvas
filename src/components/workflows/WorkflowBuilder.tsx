import { useState, useCallback } from 'react';
import { 
  Plus, 
  Workflow as WorkflowIcon, 
  Search,
  LayoutGrid,
  List as ListIcon,
  Play,
  Pause,
  Clock,
  Zap,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowSidebar } from './WorkflowSidebar';
import { 
  useWorkflows, 
  Workflow, 
  WorkflowNode as WorkflowNodeType, 
  WorkflowConnection 
} from '@/hooks/useWorkflows';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface WorkflowBuilderProps {
  userId: string | undefined;
}

export function WorkflowBuilder({ userId }: WorkflowBuilderProps) {
  const {
    workflows,
    runs,
    isLoading,
    selectedWorkflow,
    setSelectedWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    runWorkflow,
    getWorkflowRuns,
  } = useWorkflows(userId);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'canvas'>('canvas');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
  
  // Canvas state
  const [nodes, setNodes] = useState<WorkflowNodeType[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null);

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name.trim()) return;

    const workflow = await createWorkflow({
      name: newWorkflow.name,
      description: newWorkflow.description || null,
      trigger_type: 'manual',
      trigger_config: null,
      action_type: 'create_task',
      action_config: null,
      is_active: true,
    });

    if (workflow) {
      setSelectedWorkflow(workflow);
      setNewWorkflow({ name: '', description: '' });
      setShowCreateDialog(false);
      setNodes([]);
      setConnections([]);
    }
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    // Load visual builder data if exists
    setNodes(workflow.nodes || []);
    setConnections(workflow.connections || []);
    setSelectedNode(null);
  };

  const handleWorkflowChange = async (updates: Partial<Workflow>) => {
    if (!selectedWorkflow) return;
    await updateWorkflow(selectedWorkflow.id, updates);
  };

  const handleNodeChange = (node: WorkflowNodeType) => {
    setNodes(prev => prev.map(n => n.id === node.id ? node : n));
    setSelectedNode(node);
  };

  const handleRun = async () => {
    if (!selectedWorkflow) return;
    await runWorkflow(selectedWorkflow.id);
  };

  const handleDelete = async () => {
    if (!selectedWorkflow) return;
    await deleteWorkflow(selectedWorkflow.id);
    setNodes([]);
    setConnections([]);
    setSelectedNode(null);
  };

  const workflowRuns = selectedWorkflow ? getWorkflowRuns(selectedWorkflow.id) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Workflow List Sidebar */}
      <div className="w-72 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <WorkflowIcon size={16} className="text-primary" />
              Workflows
            </h2>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus size={14} className="mr-1" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Workflow List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredWorkflows.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {workflows.length === 0 ? 'No workflows yet' : 'No matching workflows'}
              </div>
            ) : (
              filteredWorkflows.map(workflow => (
                <div
                  key={workflow.id}
                  onClick={() => handleSelectWorkflow(workflow)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-colors',
                    'hover:bg-muted/50',
                    selectedWorkflow?.id === workflow.id && 'bg-muted border border-border'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={12} className={workflow.is_active ? 'text-emerald-400' : 'text-muted-foreground'} />
                    <span className="font-medium text-sm truncate flex-1">{workflow.name}</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px] px-1.5',
                        workflow.is_active ? 'border-emerald-500/50 text-emerald-400' : 'text-muted-foreground'
                      )}
                    >
                      {workflow.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>
                  {workflow.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {workflow.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play size={10} />
                      {workflow.trigger_count} runs
                    </span>
                    {workflow.last_triggered_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(workflow.last_triggered_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {selectedWorkflow ? (
          <div className="flex-1 flex">
            <WorkflowCanvas
              nodes={nodes}
              connections={connections}
              onNodesChange={setNodes}
              onConnectionsChange={setConnections}
              onNodeSelect={setSelectedNode}
              selectedNodeId={selectedNode?.id || null}
            />
            <WorkflowSidebar
              workflow={selectedWorkflow}
              selectedNode={selectedNode}
              runs={workflowRuns}
              onWorkflowChange={handleWorkflowChange}
              onNodeChange={handleNodeChange}
              onRun={handleRun}
              onDelete={handleDelete}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-4">
              <WorkflowIcon size={48} className="mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="font-medium text-foreground">No workflow selected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a workflow from the list or create a new one
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus size={14} className="mr-1" />
                Create Workflow
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Set up a new automated workflow with triggers and actions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="My Workflow"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="What does this workflow do?"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkflow} disabled={!newWorkflow.name.trim()}>
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
