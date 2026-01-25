// Week Habit Grid - Visual 7-day checkmark grid for habit tracking
// Inspired by Famous AI scannable design patterns

import { useMemo } from 'react';
import { Check, X, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePersonalHub, type PersonalHabit } from '@/hooks/usePersonalHub';
import { format, subDays, isToday, parseISO, isSameDay } from 'date-fns';

interface WeekHabitGridProps {
  className?: string;
  onHabitClick?: (habitId: string) => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekHabitGrid({ className, onHabitClick }: WeekHabitGridProps) {
  const { habits, completeHabit } = usePersonalHub();

  // Generate last 7 days (Mon-Sun style layout)
  const last7Days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
  }, []);

  // Check if habit was completed on a specific day
  const wasCompletedOnDay = (habit: PersonalHabit, day: Date): boolean => {
    if (!habit.last_completed_at) return false;
    return isSameDay(parseISO(habit.last_completed_at), day);
  };

  // Calculate completion rate for the week
  const weekCompletionRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const todayCompletions = habits.filter(h => 
      h.last_completed_at && isToday(parseISO(h.last_completed_at))
    ).length;
    return Math.round((todayCompletions / habits.length) * 100);
  }, [habits]);

  // Total streak across all habits
  const totalStreak = useMemo(() => {
    return habits.reduce((sum, h) => sum + h.current_streak, 0);
  }, [habits]);

  const handleHabitComplete = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await completeHabit(habitId);
  };

  if (habits.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border bg-gradient-to-br from-card to-orange-500/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20">
              <Flame size={14} className="text-orange-500" />
            </div>
            Weekly Habits
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              <Flame size={10} className="mr-1 text-orange-500" />
              {totalStreak} streak
            </Badge>
            <Badge 
              variant={weekCompletionRate >= 70 ? "default" : "secondary"} 
              className="text-[10px]"
            >
              {weekCompletionRate}% today
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Day headers */}
        <div className="grid grid-cols-[1fr_repeat(7,2rem)] gap-1 mb-2">
          <div className="text-[10px] text-muted-foreground font-medium">Habit</div>
          {DAY_LABELS.map((day, i) => (
            <div 
              key={i} 
              className={cn(
                "text-[10px] text-center font-mono font-medium",
                isToday(last7Days[i]) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Habit rows */}
        <div className="space-y-2">
          {habits.slice(0, 5).map((habit) => {
            const completedToday = habit.last_completed_at && 
              isToday(parseISO(habit.last_completed_at));
            
            return (
              <div 
                key={habit.id} 
                className="grid grid-cols-[1fr_repeat(7,2rem)] gap-1 items-center group"
                onClick={() => onHabitClick?.(habit.id)}
              >
                {/* Habit name */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs truncate flex-1">{habit.name}</span>
                  {habit.current_streak > 0 && (
                    <span className="text-[9px] text-orange-500 font-mono flex-shrink-0">
                      {habit.current_streak}🔥
                    </span>
                  )}
                </div>

                {/* Day checkboxes */}
                {last7Days.map((day, dayIndex) => {
                  const isCompleted = wasCompletedOnDay(habit, day);
                  const isTodayCell = isToday(day);
                  
                  return (
                    <button
                      key={dayIndex}
                      onClick={(e) => isTodayCell && !completedToday && handleHabitComplete(habit.id, e)}
                      disabled={!isTodayCell || completedToday}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30",
                        isCompleted 
                          ? "bg-emerald-500/20 text-emerald-500" 
                          : isTodayCell && !completedToday
                            ? "bg-muted/60 hover:bg-primary/20 hover:scale-110 cursor-pointer border border-dashed border-muted-foreground/30"
                            : "bg-muted/30 text-muted-foreground/40",
                        isTodayCell && "ring-1 ring-primary/40"
                      )}
                    >
                      {isCompleted ? (
                        <Check size={14} className="stroke-[3]" />
                      ) : isTodayCell && !completedToday ? (
                        <span className="text-[10px] text-muted-foreground">+</span>
                      ) : (
                        <X size={10} className="opacity-30" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Show more if > 5 habits */}
        {habits.length > 5 && (
          <div className="mt-3 text-center">
            <span className="text-[10px] text-muted-foreground">
              +{habits.length - 5} more habits
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WeekHabitGrid;
