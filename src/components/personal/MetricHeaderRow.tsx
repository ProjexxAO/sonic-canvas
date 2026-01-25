// Metric Header Row - 3 KPI cards at-a-glance
// Inspired by Famous AI dashboard design patterns

import { useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Heart, 
  TrendingUp, 
  TrendingDown,
  Minus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePersonalHub } from '@/hooks/usePersonalHub';
import { isToday, parseISO, subDays, isWithinInterval } from 'date-fns';

interface MetricHeaderRowProps {
  className?: string;
}

interface MetricCardProps {
  icon: typeof CheckCircle2;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
  bgColor: string;
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  trend,
  trendValue,
  color, 
  bgColor 
}: MetricCardProps) {
  return (
    <Card className={cn(
      "border-0 shadow-sm transition-all duration-200 hover:shadow-md",
      bgColor
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5",
              trend === 'up' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              trend === 'down' && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
              trend === 'neutral' && "bg-muted text-muted-foreground"
            )}>
              {trend === 'up' && <TrendingUp size={10} />}
              {trend === 'down' && <TrendingDown size={10} />}
              {trend === 'neutral' && <Minus size={10} />}
              {trendValue}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p 
            className="text-2xl font-bold tracking-tight"
            style={{ color }}
          >
            {value}
          </p>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          {subtext && (
            <p className="text-[10px] text-muted-foreground/70">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricHeaderRow({ className }: MetricHeaderRowProps) {
  const { items, habits, goals } = usePersonalHub();

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const weekAgo = subDays(today, 7);

    // Tasks completed today
    const tasksCompletedToday = items.filter(i => 
      i.status === 'completed' && 
      i.completed_at && 
      isToday(parseISO(i.completed_at))
    ).length;

    // Tasks completed yesterday (for trend)
    const tasksCompletedYesterday = items.filter(i => 
      i.status === 'completed' && 
      i.completed_at && 
      isWithinInterval(parseISO(i.completed_at), { 
        start: subDays(yesterday, 1), 
        end: yesterday 
      })
    ).length;

    // Active tasks remaining
    const activeTasks = items.filter(i => 
      i.item_type === 'task' && 
      i.status === 'active'
    ).length;

    // Focus time (estimated from completed high-priority tasks)
    const highPriorityCompleted = items.filter(i => 
      i.status === 'completed' && 
      (i.priority === 'high' || i.priority === 'urgent') &&
      i.completed_at && 
      isToday(parseISO(i.completed_at))
    ).length;
    const focusMinutes = highPriorityCompleted * 25; // Pomodoro estimate

    // Wellness score (based on habits completion)
    const habitsCompletedToday = habits.filter(h => 
      h.last_completed_at && isToday(parseISO(h.last_completed_at))
    ).length;
    const wellnessScore = habits.length > 0 
      ? Math.round((habitsCompletedToday / habits.length) * 100)
      : 0;

    // Goal progress
    const activeGoals = goals.filter(g => g.status === 'in_progress' || g.status === 'active');
    const avgGoalProgress = activeGoals.length > 0
      ? Math.round(activeGoals.reduce((sum, g) => {
          if (g.target_value) {
            return sum + (g.current_value / g.target_value) * 100;
          }
          return sum;
        }, 0) / activeGoals.length)
      : 0;

    // Calculate trends
    const taskTrend: 'up' | 'down' | 'neutral' = tasksCompletedToday > tasksCompletedYesterday ? 'up' 
      : tasksCompletedToday < tasksCompletedYesterday ? 'down' 
      : 'neutral';

    return {
      tasksCompleted: tasksCompletedToday,
      tasksRemaining: activeTasks,
      taskTrend,
      taskTrendValue: taskTrend === 'up' 
        ? `+${tasksCompletedToday - tasksCompletedYesterday}` 
        : taskTrend === 'down' 
          ? `${tasksCompletedToday - tasksCompletedYesterday}`
          : 'same',
      focusTime: focusMinutes,
      wellnessScore,
      goalProgress: avgGoalProgress,
    };
  }, [items, habits, goals]);

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      <MetricCard
        icon={CheckCircle2}
        label="Tasks Done"
        value={metrics.tasksCompleted}
        subtext={`${metrics.tasksRemaining} remaining`}
        trend={metrics.taskTrend}
        trendValue={metrics.taskTrendValue}
        color="hsl(var(--primary))"
        bgColor="bg-gradient-to-br from-primary/5 to-primary/10"
      />
      
      <MetricCard
        icon={Clock}
        label="Focus Time"
        value={metrics.focusTime > 60 
          ? `${Math.floor(metrics.focusTime / 60)}h ${metrics.focusTime % 60}m`
          : `${metrics.focusTime}m`
        }
        subtext="Deep work today"
        color="hsl(200 70% 50%)"
        bgColor="bg-gradient-to-br from-blue-500/5 to-blue-500/10"
      />
      
      <MetricCard
        icon={Heart}
        label="Wellness"
        value={`${metrics.wellnessScore}%`}
        subtext="Habits completed"
        trend={metrics.wellnessScore >= 70 ? 'up' : metrics.wellnessScore >= 40 ? 'neutral' : 'down'}
        trendValue={metrics.wellnessScore >= 70 ? 'great' : metrics.wellnessScore >= 40 ? 'ok' : 'low'}
        color="hsl(340 70% 55%)"
        bgColor="bg-gradient-to-br from-pink-500/5 to-pink-500/10"
      />
    </div>
  );
}

export default MetricHeaderRow;
