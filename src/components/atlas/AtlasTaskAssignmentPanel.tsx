// Atlas Task Assignment Panel - MONITORING ONLY
// Atlas (the AI orchestrator) controls all task assignments internally
// Users observe training status through this panel but cannot directly create tasks
import { useEffect } from 'react';
import { 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Bot,
  Target,
  TrendingUp,
  Brain,
  ArrowRightLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAtlasTaskAssignment, TaskAssignment } from '@/hooks/useAtlasTaskAssignment';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function AtlasTaskAssignmentPanel() {
  const { user } = useAuth();
  const {
    assignments,
    specializedAgents,
    loading,
    fetchRecentAssignments,
    fetchSpecializedAgents,
  } = useAtlasTaskAssignment(user?.id);

  useEffect(() => {
    fetchRecentAssignments();
    fetchSpecializedAgents('general');
  }, [fetchRecentAssignments, fetchSpecializedAgents]);

  // Calculate stats
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const pendingCount = assignments.filter(a => a.status === 'pending' || a.status === 'assigned').length;
  const inProgressCount = assignments.filter(a => a.status === 'in_progress').length;
  const avgConfidence = assignments.length > 0
    ? assignments.reduce((sum, a) => sum + a.confidence, 0) / assignments.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-sm font-semibold">Atlas Task Control</h3>
          <p className="text-[10px] text-muted-foreground">Automated agent assignments</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-2">
        <StatMini
          icon={<Clock className="h-3 w-3" />}
          value={pendingCount}
          label="Pending"
          color="text-yellow-500"
        />
        <StatMini
          icon={<Sparkles className="h-3 w-3" />}
          value={inProgressCount}
          label="Active"
          color="text-blue-500"
        />
        <StatMini
          icon={<CheckCircle2 className="h-3 w-3" />}
          value={completedCount}
          label="Done"
          color="text-green-500"
        />
        <StatMini
          icon={<Target className="h-3 w-3" />}
          value={`${Math.round(avgConfidence * 100)}%`}
          label="Conf."
          color="text-primary"
        />
      </div>

      {/* Top Specialists Available */}
      {specializedAgents.length > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-mono flex items-center gap-1">
              <Target className="h-3 w-3 text-primary" />
              Available Specialists
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <div className="flex flex-wrap gap-1.5">
              {specializedAgents.slice(0, 4).map((agent) => (
                <Badge 
                  key={agent.id} 
                  variant="outline" 
                  className="text-[9px] gap-1 px-1.5 py-0.5"
                >
                  <Bot className="h-2.5 w-2.5" />
                  <span className="truncate max-w-[50px]">{agent.name}</span>
                  <span className="opacity-60">
                    {Math.round(agent.successRate * 100)}%
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Assignments */}
      <Card>
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-xs font-mono flex items-center gap-1">
            <ArrowRightLeft className="h-3 w-3" />
            Recent Assignments
          </CardTitle>
          <CardDescription className="text-[10px]">
            Tasks routed by Atlas orchestrator
          </CardDescription>
        </CardHeader>
        <CardContent className="py-2 px-3">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No assignments yet</p>
              <p className="text-[10px]">Atlas will assign tasks automatically</p>
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-2">
                {assignments.slice(0, 15).map((assignment, index) => (
                  <AssignmentRow 
                    key={`${assignment.taskId}-${assignment.agentId}-${index}`} 
                    assignment={assignment} 
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components
function StatMini({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color?: string;
}) {
  return (
    <div className="text-center p-1.5 bg-muted/30 rounded border border-border/50">
      <div className={cn("flex items-center justify-center mb-0.5", color)}>
        {icon}
      </div>
      <div className="text-xs font-bold font-mono">{value}</div>
      <div className="text-[8px] text-muted-foreground">{label}</div>
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: TaskAssignment }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'in_progress':
        return <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getMatchColor = (match: string) => {
    switch (match) {
      case 'high':
        return 'bg-green-500/10 text-green-600';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'low':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="rounded border border-border/50 p-2 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {getStatusIcon(assignment.status)}
          <span className="text-xs font-medium truncate max-w-[80px]">
            {assignment.agentName}
          </span>
        </div>
        <Badge 
          variant="outline" 
          className={cn("text-[8px] px-1 py-0 h-4", getMatchColor(assignment.specializationMatch))}
        >
          {assignment.specializationMatch}
        </Badge>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
          {assignment.taskTitle}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {Math.round(assignment.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}
