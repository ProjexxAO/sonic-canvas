// Fullscreen Detailed Dashboard - Expanded view showing all personal sections in detail
// Opens as overlay when user expands from SimplifiedDashboard

import { useMemo } from 'react';
import { 
  X,
  CheckSquare, 
  Target, 
  TrendingUp, 
  Calendar,
  Wallet,
  Heart,
  Flame,
  Clock,
  FileText,
  LayoutGrid,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePersonalHub, PersonalItem, PersonalGoal, PersonalHabit } from '@/hooks/usePersonalHub';
import { useBanking } from '@/hooks/useBanking';
import { useCustomWidgets } from '@/hooks/useCustomWidgets';
import { cn } from '@/lib/utils';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { CustomWidgetRenderer } from './CustomWidgetRenderer';

interface FullscreenDetailedDashboardProps {
  userId: string | undefined;
  onClose: () => void;
}

// Task item for detailed view
function DetailedTaskItem({ 
  item, 
  onComplete 
}: { 
  item: PersonalItem; 
  onComplete: () => void;
}) {
  const isOverdue = item.due_date && isPast(parseISO(item.due_date)) && item.status !== 'completed';
  const isDueToday = item.due_date && isToday(parseISO(item.due_date));
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      item.status === 'completed' 
        ? "bg-muted/30 border-border/50" 
        : isOverdue 
          ? "bg-destructive/5 border-destructive/30"
          : "bg-card border-border hover:bg-muted/50"
    )}>
      <button onClick={onComplete} className="flex-shrink-0">
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
          item.status === 'completed' 
            ? "bg-primary border-primary" 
            : "border-muted-foreground hover:border-primary"
        )}>
          {item.status === 'completed' && (
            <CheckSquare size={12} className="text-primary-foreground" />
          )}
        </div>
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium",
          item.status === 'completed' && "line-through text-muted-foreground"
        )}>
          {item.title}
        </p>
        <p className={cn(
          "text-sm font-medium",
          item.status === 'completed' && "line-through text-muted-foreground"
        )}>
          {item.title}
        </p>
        {item.due_date && (
          <div className="flex items-center gap-1 mt-1">
            <Clock size={10} className={isOverdue ? "text-destructive" : "text-muted-foreground"} />
            <span className={cn(
              "text-[10px]",
              isOverdue ? "text-destructive" : isDueToday ? "text-primary" : "text-muted-foreground"
            )}>
              {isDueToday ? 'Today' : format(parseISO(item.due_date), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </div>
      
      <Badge 
        variant="outline" 
        className={cn(
          "text-[10px]",
          item.priority === 'urgent' && "border-destructive text-destructive",
          item.priority === 'high' && "border-orange-500 text-orange-500",
          item.priority === 'medium' && "border-yellow-500 text-yellow-500",
          item.priority === 'low' && "border-muted-foreground text-muted-foreground"
        )}
      >
        {item.priority}
      </Badge>
    </div>
  );
}

// Goal card for detailed view
function DetailedGoalCard({ goal }: { goal: PersonalGoal }) {
  const progress = goal.target_value 
    ? Math.min((goal.current_value / goal.target_value) * 100, 100) 
    : 0;
  
  return (
    <Card className="bg-card/80">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold">{goal.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {goal.description || goal.category}
            </p>
          </div>
          <Badge variant="outline" className="ml-2">{goal.status}</Badge>
        </div>
        
        {goal.target_value && (
          <>
            <Progress value={progress} className="h-2 mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{goal.current_value} {goal.unit}</span>
              <span>Target: {goal.target_value} {goal.unit}</span>
            </div>
          </>
        )}
        
        {goal.target_date && (
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border">
            <Calendar size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Due {format(parseISO(goal.target_date), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Habit card for detailed view
function DetailedHabitCard({ habit, onComplete }: { habit: PersonalHabit; onComplete: () => void }) {
  const completedToday = habit.last_completed_at && isToday(parseISO(habit.last_completed_at));
  
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-lg border transition-colors",
      completedToday ? "bg-primary/5 border-primary/30" : "bg-card border-border"
    )}>
      <button
        onClick={onComplete}
        disabled={completedToday}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all",
          completedToday 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted hover:bg-primary/10 hover:text-primary"
        )}
      >
        {completedToday ? <CheckSquare size={24} /> : <Flame size={24} />}
      </button>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold">{habit.name}</h4>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1">
            <Flame size={12} className="text-orange-500" />
            <span className="text-xs text-muted-foreground">{habit.current_streak} day streak</span>
          </div>
          <Badge variant="secondary" className="text-[10px]">{habit.frequency}</Badge>
        </div>
      </div>
      
      {completedToday && (
        <Badge className="bg-primary/10 text-primary">Done ✓</Badge>
      )}
    </div>
  );
}

export function FullscreenDetailedDashboard({ userId, onClose }: FullscreenDetailedDashboardProps) {
  const { 
    items, 
    goals, 
    habits, 
    isLoading,
    completeItem,
    completeHabit,
    stats,
    getItemsByType
  } = usePersonalHub();
  
  const { accounts, isLoading: isBankingLoading } = useBanking();
  const { widgets: customWidgets, deleteWidget } = useCustomWidgets();

  const tasks = getItemsByType('task');
  const notes = getItemsByType('note');
  
  // Categorize tasks
  const categorizedTasks = useMemo(() => {
    const today = new Date();
    const active = tasks.filter(t => t.status !== 'completed');
    const completed = tasks.filter(t => t.status === 'completed');
    const overdue = active.filter(t => t.due_date && isPast(parseISO(t.due_date)));
    const dueToday = active.filter(t => t.due_date && isToday(parseISO(t.due_date)));
    
    return { active, completed, overdue, dueToday };
  }, [tasks]);

  // Total balance
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <LayoutGrid size={20} className="text-primary" />
          <h1 className="text-lg font-semibold">Detailed Dashboard</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClose} 
          className="h-9 px-3 rounded-xl gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
        >
          <X size={16} className="text-primary" />
          <span className="text-xs font-medium text-primary">Close</span>
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
          
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckSquare size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeTasks}</p>
                    <p className="text-xs text-muted-foreground">Active Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Target size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeGoals}</p>
                    <p className="text-xs text-muted-foreground">Active Goals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Flame size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeHabits}</p>
                    <p className="text-xs text-muted-foreground">Active Habits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Wallet size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Balance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Tasks Section */}
            <Card className="bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare size={18} className="text-primary" />
                  Tasks
                  <Badge variant="secondary" className="ml-auto">{categorizedTasks.active.length} active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {categorizedTasks.overdue.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-destructive mb-2">Overdue ({categorizedTasks.overdue.length})</p>
                    <div className="space-y-2">
                      {categorizedTasks.overdue.slice(0, 3).map(task => (
                        <DetailedTaskItem 
                          key={task.id} 
                          item={task} 
                          onComplete={() => completeItem(task.id)} 
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {categorizedTasks.active.filter(t => !categorizedTasks.overdue.includes(t)).slice(0, 5).map(task => (
                    <DetailedTaskItem 
                      key={task.id} 
                      item={task} 
                      onComplete={() => completeItem(task.id)} 
                    />
                  ))}
                  {categorizedTasks.active.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active tasks</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Goals Section */}
            <Card className="bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target size={18} className="text-emerald-500" />
                  Goals
                  <Badge variant="secondary" className="ml-auto">{goals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {goals.slice(0, 4).map(goal => (
                    <DetailedGoalCard key={goal.id} goal={goal} />
                  ))}
                  {goals.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No goals set</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Habits Section */}
            <Card className="bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp size={18} className="text-orange-500" />
                  Habits
                  <Badge variant="secondary" className="ml-auto">{habits.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {habits.slice(0, 5).map(habit => (
                    <DetailedHabitCard 
                      key={habit.id} 
                      habit={habit} 
                      onComplete={() => completeHabit(habit.id)} 
                    />
                  ))}
                  {habits.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No habits tracked</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Finance Section */}
            <Card className="bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet size={18} className="text-blue-500" />
                  Finance Overview
                  <Badge variant="secondary" className="ml-auto">{accounts.length} accounts</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {accounts.slice(0, 4).map(account => (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{account.account_name}</p>
                        <p className="text-xs text-muted-foreground">{account.institution_name}</p>
                      </div>
                      <p className="text-sm font-semibold">
                        ${(account.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                  {accounts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No accounts connected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custom Widgets Section */}
          {customWidgets.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <LayoutGrid size={18} className="text-primary" />
                My Widgets
                <Badge variant="secondary">{customWidgets.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customWidgets.map((widget) => (
                  <CustomWidgetRenderer
                    key={widget.id}
                    widget={widget}
                    onDelete={() => deleteWidget(widget.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Notes Section (if any) */}
          {notes.length > 0 && (
            <Card className="bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText size={18} className="text-yellow-500" />
                  Notes
                  <Badge variant="secondary" className="ml-auto">{notes.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notes.slice(0, 4).map(note => (
                    <div key={note.id} className="p-3 rounded-lg border border-border bg-muted/30">
                      <p className="text-sm font-medium truncate">{note.title}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default FullscreenDetailedDashboard;
