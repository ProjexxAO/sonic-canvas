// Habit Streak Chart - Visual representation of habit completion
import { useMemo } from 'react';
import { 
  Flame, 
  Calendar,
  TrendingUp,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePersonalHub, type PersonalHabit } from '@/hooks/usePersonalHub';
import { format, subDays, isToday, parseISO, isSameDay, startOfWeek, eachDayOfInterval } from 'date-fns';

interface HabitStreakChartProps {
  className?: string;
}

export function HabitStreakChart({ className }: HabitStreakChartProps) {
  const { habits } = usePersonalHub();

  // Generate last 7 days
  const last7Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  }, []);

  // Calculate completion data for each day
  const completionData = useMemo(() => {
    return last7Days.map(day => {
      const completedCount = habits.filter(habit => {
        if (!habit.last_completed_at) return false;
        return isSameDay(parseISO(habit.last_completed_at), day);
      }).length;

      return {
        date: day,
        completed: completedCount,
        total: habits.length,
        percentage: habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0,
      };
    });
  }, [habits, last7Days]);

  // Calculate week average
  const weekAverage = useMemo(() => {
    if (completionData.length === 0) return 0;
    return Math.round(
      completionData.reduce((sum, d) => sum + d.percentage, 0) / completionData.length
    );
  }, [completionData]);

  // Best streak
  const bestStreak = useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, h.longest_streak), 0);
  }, [habits]);

  // Current total streak
  const currentTotalStreak = useMemo(() => {
    return habits.reduce((sum, h) => sum + h.current_streak, 0);
  }, [habits]);

  const getBarHeight = (percentage: number) => {
    return Math.max(4, (percentage / 100) * 40); // min 4px, max 40px
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-green-500';
    if (percentage >= 40) return 'bg-amber-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-muted';
  };

  if (habits.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border bg-gradient-to-br from-card to-orange-500/5", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20">
              <Flame size={14} className="text-orange-500" />
            </div>
            Habit Streaks
          </CardTitle>
          <Badge variant="secondary" className="text-[9px]">
            {weekAverage}% this week
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-orange-500 flex items-center justify-center gap-1">
              <Flame size={14} />
              {currentTotalStreak}
            </div>
            <div className="text-[9px] text-muted-foreground">Current</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-amber-500 flex items-center justify-center gap-1">
              <Award size={14} />
              {bestStreak}
            </div>
            <div className="text-[9px] text-muted-foreground">Best</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-emerald-500">{habits.length}</div>
            <div className="text-[9px] text-muted-foreground">Habits</div>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-2">
            <Calendar size={10} className="text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase text-muted-foreground">
              Last 7 Days
            </span>
          </div>
          <div className="flex items-end justify-between h-12 gap-1">
            {completionData.map((day, i) => (
              <div 
                key={i} 
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div 
                  className={cn(
                    "w-full rounded-t transition-all",
                    getBarColor(day.percentage)
                  )}
                  style={{ height: `${getBarHeight(day.percentage)}px` }}
                />
                <span className={cn(
                  "text-[8px]",
                  isToday(day.date) ? "font-bold text-primary" : "text-muted-foreground"
                )}>
                  {format(day.date, 'EEE').charAt(0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual Habit Progress */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={10} className="text-muted-foreground" />
            <span className="text-[10px] font-mono uppercase text-muted-foreground">
              By Habit
            </span>
          </div>
          {habits.slice(0, 4).map((habit) => {
            const completedToday = habit.last_completed_at && 
              isToday(parseISO(habit.last_completed_at));
            
            return (
              <div key={habit.id} className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  completedToday ? "bg-emerald-500" : "bg-muted"
                )} />
                <span className="text-[10px] flex-1 truncate">{habit.name}</span>
                <div className="flex items-center gap-1">
                  <Flame size={10} className={cn(
                    habit.current_streak > 0 ? "text-orange-500" : "text-muted-foreground"
                  )} />
                  <span className="text-[10px] font-mono">{habit.current_streak}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}