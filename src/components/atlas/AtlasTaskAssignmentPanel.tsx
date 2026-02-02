import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Users, 
  Zap, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Bot,
  Target,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAtlasTaskAssignment, TaskAssignment, SpecializedAgent } from '@/hooks/useAtlasTaskAssignment';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const TASK_TYPES = [
  { value: 'analysis', label: 'Analysis', icon: TrendingUp },
  { value: 'automation', label: 'Automation', icon: Zap },
  { value: 'assistance', label: 'Assistance', icon: Users },
  { value: 'notification', label: 'Notification', icon: AlertCircle },
  { value: 'background', label: 'Background', icon: Clock },
];

export function AtlasTaskAssignmentPanel() {
  const { user } = useAuth();
  const {
    assignments,
    specializedAgents,
    isAssigning,
    loading,
    fetchSpecializedAgents,
    autoAssignTask,
    fetchRecentAssignments,
  } = useAtlasTaskAssignment(user?.id);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState('assistance');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [showAgentPreview, setShowAgentPreview] = useState(false);

  useEffect(() => {
    fetchRecentAssignments();
  }, [fetchRecentAssignments]);

  // Fetch specialized agents when task type changes
  useEffect(() => {
    if (taskType) {
      fetchSpecializedAgents(taskType);
      setShowAgentPreview(true);
    }
  }, [taskType, fetchSpecializedAgents]);

  const handleAutoAssign = async () => {
    if (!taskTitle.trim()) return;

    const result = await autoAssignTask(taskTitle, taskDescription, taskType, priority);
    
    if (result.success) {
      setTaskTitle('');
      setTaskDescription('');
      setTaskType('assistance');
      setPriority('medium');
      setShowAgentPreview(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMatchColor = (match: string) => {
    switch (match) {
      case 'high':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Atlas Task Assignment
          </CardTitle>
          <CardDescription>
            Let Atlas automatically assign tasks to the most qualified agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Task title..."
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="font-medium"
            />
          </div>

          <Textarea
            placeholder="Describe what needs to be done..."
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger>
                <SelectValue placeholder="Task type" />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Specialized Agent Preview */}
          {showAgentPreview && specializedAgents.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Top Specialists for "{taskType}"
              </p>
              <div className="flex flex-wrap gap-2">
                {specializedAgents.slice(0, 3).map((agent) => (
                  <Badge key={agent.id} variant="secondary" className="gap-1">
                    <Bot className="h-3 w-3" />
                    {agent.name}
                    <span className="text-xs opacity-70">
                      {Math.round(agent.specializationScore * 100)}%
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleAutoAssign}
            disabled={!taskTitle.trim() || isAssigning}
            className="w-full gap-2"
          >
            {isAssigning ? (
              <>
                <Zap className="h-4 w-4 animate-pulse" />
                Assigning to Specialists...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Auto-Assign to Best Agents
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recent Task Assignments
          </CardTitle>
          <CardDescription>
            Tasks assigned to specialized agents by Atlas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No task assignments yet</p>
              <p className="text-sm">Create a task above to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3 pr-4">
                {assignments.map((assignment, index) => (
                  <AssignmentCard key={`${assignment.taskId}-${assignment.agentId}-${index}`} assignment={assignment} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AssignmentCardProps {
  assignment: TaskAssignment;
}

function AssignmentCard({ assignment }: AssignmentCardProps) {
  const getMatchColor = (match: string) => {
    switch (match) {
      case 'high':
        return 'text-green-500 bg-green-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-orange-500 bg-orange-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500">In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'assigned':
        return <Badge variant="outline" className="bg-primary/10 text-primary">Assigned</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium truncate">{assignment.agentName}</span>
            {getStatusBadge(assignment.status)}
          </div>
          <p className="text-sm text-muted-foreground truncate">{assignment.taskTitle}</p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className={cn("px-1.5 py-0.5 rounded", getMatchColor(assignment.specializationMatch))}>
              {assignment.specializationMatch} match
            </span>
            <span className="text-muted-foreground">
              {Math.round(assignment.confidence * 100)}% confidence
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      {assignment.reasoning && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {assignment.reasoning}
        </p>
      )}
    </div>
  );
}
