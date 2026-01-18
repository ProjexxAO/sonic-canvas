import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertCircle,
  ListTodo,
  ChevronDown,
  ChevronUp,
  Brain,
  RefreshCw,
  Trash2,
  History,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { AgentTask } from '@/hooks/useAgentOrchestration';
import { formatDistanceToNow } from 'date-fns';

interface AtlasTaskProgressProps {
  tasks: AgentTask[];
  completedTasks?: AgentTask[];
  isLoading?: boolean;
  onSyncMemory?: () => Promise<any>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string; animate?: boolean }> = {
  pending: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pending' },
  in_progress: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10', label: 'In Progress', animate: true },
  awaiting_approval: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', label: 'Awaiting Approval' },
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
  cancelled: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Cancelled' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-secondary text-secondary-foreground',
  high: 'bg-warning/20 text-warning',
  critical: 'bg-destructive/20 text-destructive',
};

export function AtlasTaskProgress({ tasks, completedTasks = [], isLoading, onSyncMemory, onDeleteTask }: AtlasTaskProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  
  const activeTasks = tasks.filter(t => 
    t.status === 'in_progress' || t.status === 'pending' || t.status === 'awaiting_approval'
  );

  const handleSyncMemory = async () => {
    if (!onSyncMemory || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncMemory();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!onDeleteTask || deletingTaskId) return;
    setDeletingTaskId(taskId);
    try {
      await onDeleteTask(taskId);
    } finally {
      setDeletingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs font-medium">Loading tasks...</span>
        </div>
      </div>
    );
  }

  const totalCount = activeTasks.length + completedTasks.length;

  if (totalCount === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ListTodo className="h-4 w-4" />
            <span className="text-xs font-medium">No tasks</span>
          </div>
          {onSyncMemory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSyncMemory}
              disabled={isSyncing}
              className="h-6 px-2 text-[10px] gap-1"
            >
              {isSyncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Brain className="h-3 w-3" />
              )}
              Sync from Memory
            </Button>
          )}
        </div>
      </div>
    );
  }

  const renderTaskItem = (task: AgentTask, showCompletedTime = false) => {
    const config = statusConfig[task.status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
      <div
        key={task.id}
        className={cn(
          "rounded-md border p-2.5 transition-all",
          task.status === 'in_progress'
            ? "border-primary/30 bg-primary/5"
            : task.status === 'completed'
              ? "border-success/20 bg-success/5"
              : task.status === 'failed'
                ? "border-destructive/20 bg-destructive/5"
                : "border-border bg-background/50"
        )}
      >
        {/* Task Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <StatusIcon
              className={cn(
                "h-3.5 w-3.5 mt-0.5 flex-shrink-0",
                config.color,
                config.animate && "animate-spin"
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground leading-snug break-words">{task.task_title}</p>
              {task.task_description && (
                <p className="text-[10px] text-muted-foreground leading-snug break-words mt-0.5">
                  {task.task_description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1.5 py-0",
                priorityColors[task.task_priority] || priorityColors.medium
              )}
            >
              {task.task_priority}
            </Badge>
            {onDeleteTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.id);
                }}
                disabled={deletingTaskId === task.id}
                className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive"
                title="Delete task"
              >
                {deletingTaskId === task.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar for active tasks / Completion info for completed */}
        {showCompletedTime ? (
          <div className="flex items-center justify-between">
            <span className={cn("text-[10px] font-medium", config.color)}>{config.label}</span>
            <span className="text-[10px] text-muted-foreground">
              {task.completed_at ? formatDistanceToNow(task.completed_at, { addSuffix: true }) : ''}
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={cn("text-[10px] font-medium", config.color)}>{config.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{task.progress}%</span>
            </div>
            <Progress
              value={task.progress}
              className={cn("h-1.5", task.status === 'in_progress' && "animate-pulse")}
            />
          </div>
        )}

        {/* Assigned Agents */}
        {task.assigned_agents && task.assigned_agents.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground">Agents:</span>
            <span className="text-[9px] text-foreground/70 truncate">
              {task.assigned_agents.length} assigned
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:bg-muted/50 transition-colors rounded px-1 -ml-1"
        >
          <div className="relative">
            <ListTodo className="h-4 w-4 text-primary" />
            {activeTasks.some(t => t.status === 'in_progress') && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <span className="text-xs font-semibold text-foreground">
            Atlas Tasks
          </span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {activeTasks.length}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        {onSyncMemory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSyncMemory}
            disabled={isSyncing}
            className="h-6 px-2 text-[10px] gap-1"
            title="Sync tasks from Atlas memory"
          >
            {isSyncing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {/* Task List with Tabs */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'completed')}>
            <TabsList className="w-full h-7 mb-2">
              <TabsTrigger value="active" className="flex-1 text-[10px] h-6 gap-1">
                <ListTodo className="h-3 w-3" />
                Active
                {activeTasks.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">
                    {activeTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 text-[10px] h-6 gap-1">
                <History className="h-3 w-3" />
                History
                {completedTasks.length > 0 && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 ml-1">
                    {completedTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="m-0">
              {activeTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No active tasks</p>
                </div>
              ) : (
                <ScrollArea
                  className="h-56"
                  onWheelCapture={(e) => e.stopPropagation()}
                  onTouchMoveCapture={(e) => e.stopPropagation()}
                >
                  <div className="space-y-2 pr-2">
                    {activeTasks.map((task) => renderTaskItem(task, false))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="completed" className="m-0">
              {completedTasks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <History className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No completed tasks yet</p>
                </div>
              ) : (
                <ScrollArea
                  className="h-56"
                  onWheelCapture={(e) => e.stopPropagation()}
                  onTouchMoveCapture={(e) => e.stopPropagation()}
                >
                  <div className="space-y-2 pr-2">
                    {completedTasks.map((task) => renderTaskItem(task, true))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}