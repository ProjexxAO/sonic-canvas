// Goal Progress Timeline - Visual timeline of goal progress
import { useMemo } from 'react';
import { 
  Target, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { usePersonalHub, type PersonalGoal } from '@/hooks/usePersonalHub';
import { format, parseISO, differenceInDays, isPast, isFuture, isToday } from 'date-fns';

interface GoalProgressTimelineProps {
  className?: string;
}

export function GoalProgressTimeline({ className }: GoalProgressTimelineProps) {
  const { goals } = usePersonalHub();

  // Helper to calculate progress percentage
  const getProgress = (goal: PersonalGoal) => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  // Sort goals by target date
  const sortedGoals = useMemo(() => {
    return [...goals]
      .filter(g => g.status === 'active')
      .sort((a, b) => {
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
      });
  }, [goals]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = goals.filter(g => g.status === 'active').length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const avgProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + getProgress(g), 0) / goals.length)
      : 0;
    const overdue = goals.filter(g => 
      g.target_date && isPast(parseISO(g.target_date)) && g.status === 'active'
    ).length;

    return { active, completed, avgProgress, overdue };
  }, [goals]);

  const getStatusBadge = (goal: PersonalGoal) => {
    const progress = getProgress(goal);
    if (progress >= 100) {
      return <Badge className="bg-emerald-500 text-[8px]">Complete</Badge>;
    }
    if (goal.target_date) {
      const daysLeft = differenceInDays(parseISO(goal.target_date), new Date());
      if (daysLeft < 0) {
        return <Badge variant="destructive" className="text-[8px]">{Math.abs(daysLeft)}d overdue</Badge>;
      }
      if (daysLeft <= 7) {
        return <Badge variant="secondary" className="text-[8px] bg-amber-500/20 text-amber-600">{daysLeft}d left</Badge>;
      }
      return <Badge variant="secondary" className="text-[8px]">{daysLeft}d left</Badge>;
    }
    return null;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-muted-foreground';
  };

  if (goals.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border bg-gradient-to-br from-card to-blue-500/5", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Target size={14} className="text-blue-500" />
            </div>
            Goal Progress
          </CardTitle>
          <Badge variant="secondary" className="text-[9px]">
            {stats.avgProgress}% avg
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-blue-500">{stats.active}</div>
            <div className="text-[8px] text-muted-foreground">Active</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-emerald-500">{stats.completed}</div>
            <div className="text-[8px] text-muted-foreground">Done</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-purple-500">{stats.avgProgress}%</div>
            <div className="text-[8px] text-muted-foreground">Avg</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className={cn(
              "text-lg font-bold",
              stats.overdue > 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {stats.overdue}
            </div>
            <div className="text-[8px] text-muted-foreground">Overdue</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-3">
            {sortedGoals.slice(0, 4).map((goal, index) => {
              const isOverdue = goal.target_date && isPast(parseISO(goal.target_date));
              const progress = getProgress(goal);
              
              return (
                <div key={goal.id} className="relative pl-8">
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-background",
                    progress >= 100 
                      ? "bg-emerald-500" 
                      : isOverdue 
                        ? "bg-red-500"
                        : "bg-primary"
                  )}>
                    {progress >= 100 && (
                      <CheckCircle2 size={8} className="text-white absolute -top-0.5 -left-0.5" />
                    )}
                  </div>

                  {/* Goal Card */}
                  <div className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate flex-1">{goal.title}</span>
                      {getStatusBadge(goal)}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1.5">
                      <Progress 
                        value={progress} 
                        className="h-1.5 flex-1" 
                      />
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                        {progress}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      {goal.target_date && (
                        <span className="flex items-center gap-0.5">
                          <Calendar size={8} />
                          {format(parseISO(goal.target_date), 'MMM d')}
                        </span>
                      )}
                      {goal.category && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0">
                          {goal.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Show more indicator */}
        {sortedGoals.length > 4 && (
          <div className="mt-2 text-center">
            <span className="text-[10px] text-muted-foreground">
              +{sortedGoals.length - 4} more goals
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}