// Personal Data Hub - Personal-only interface for Tasks, Goals, Habits
// This is the simplified hub for personal use, not C-Suite executive content

import { useState, useCallback, useRef } from 'react';
import { 
  CheckSquare, 
  Target, 
  TrendingUp, 
  FileText, 
  Bookmark,
  Calendar,
  Plus,
  RefreshCw,
  LayoutDashboard,
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Trash2,
  Edit,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { usePersonalHub, PersonalItem, PersonalGoal, PersonalHabit, ItemType } from '@/hooks/usePersonalHub';
import { cn } from '@/lib/utils';
import { format, isToday, isPast, parseISO } from 'date-fns';

interface PersonalDataHubProps {
  userId: string | undefined;
}

// Quick action card for personal actions
function PersonalQuickAction({ 
  icon: Icon, 
  label, 
  count, 
  color, 
  onClick 
}: { 
  icon: typeof CheckSquare; 
  label: string; 
  count?: number; 
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors min-w-[72px]"
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center mb-1"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <span className="text-[10px] font-mono text-foreground">{label}</span>
      {count !== undefined && (
        <Badge variant="secondary" className="text-[8px] mt-0.5 px-1.5 py-0">
          {count}
        </Badge>
      )}
    </button>
  );
}

// Task item component
function TaskItem({ 
  item, 
  onComplete, 
  onDelete 
}: { 
  item: PersonalItem; 
  onComplete: () => void;
  onDelete: () => void;
}) {
  const isOverdue = item.due_date && isPast(parseISO(item.due_date)) && item.status !== 'completed';
  const isDueToday = item.due_date && isToday(parseISO(item.due_date));
  
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border transition-colors",
      item.status === 'completed' 
        ? "bg-muted/30 border-border/50" 
        : isOverdue 
          ? "bg-destructive/5 border-destructive/30"
          : "bg-card border-border hover:bg-card/80"
    )}>
      <button
        onClick={onComplete}
        className="flex-shrink-0"
      >
        {item.status === 'completed' ? (
          <CheckCircle2 size={16} className="text-primary" />
        ) : (
          <Circle size={16} className="text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate",
          item.status === 'completed' && "line-through text-muted-foreground"
        )}>
          {item.title}
        </p>
        {item.due_date && (
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={10} className={isOverdue ? "text-destructive" : "text-muted-foreground"} />
            <span className={cn(
              "text-[10px]",
              isOverdue ? "text-destructive" : isDueToday ? "text-primary" : "text-muted-foreground"
            )}>
              {isDueToday ? 'Today' : format(parseISO(item.due_date), 'MMM d')}
            </span>
          </div>
        )}
      </div>
      
      <Badge 
        variant="outline" 
        className={cn(
          "text-[8px] px-1.5",
          item.priority === 'urgent' && "border-destructive text-destructive",
          item.priority === 'high' && "border-orange-500 text-orange-500",
          item.priority === 'medium' && "border-yellow-500 text-yellow-500",
          item.priority === 'low' && "border-muted-foreground text-muted-foreground"
        )}
      >
        {item.priority}
      </Badge>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 size={12} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Goal card component
function GoalCard({ goal }: { goal: PersonalGoal }) {
  const progress = goal.target_value 
    ? Math.min((goal.current_value / goal.target_value) * 100, 100) 
    : 0;
  
  return (
    <Card className="bg-card/50">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{goal.title}</h4>
            <p className="text-[10px] text-muted-foreground truncate">
              {goal.description || goal.category}
            </p>
          </div>
          <Badge variant="outline" className="text-[8px] ml-2">
            {goal.status}
          </Badge>
        </div>
        
        {goal.target_value && (
          <>
            <Progress value={progress} className="h-1.5 mb-1" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{goal.current_value} {goal.unit}</span>
              <span>/ {goal.target_value} {goal.unit}</span>
            </div>
          </>
        )}
        
        {goal.target_date && (
          <div className="flex items-center gap-1 mt-2">
            <Calendar size={10} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Due {format(parseISO(goal.target_date), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Habit card component
function HabitCard({ 
  habit, 
  onComplete 
}: { 
  habit: PersonalHabit; 
  onComplete: () => void;
}) {
  const completedToday = habit.last_completed_at && isToday(parseISO(habit.last_completed_at));
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      completedToday 
        ? "bg-primary/5 border-primary/30" 
        : "bg-card border-border hover:bg-card/80"
    )}>
      <button
        onClick={onComplete}
        disabled={completedToday}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          completedToday 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted hover:bg-muted/80"
        )}
      >
        {completedToday ? (
          <CheckCircle2 size={20} />
        ) : (
          <Circle size={20} />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{habit.name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1">
            <Flame size={10} className="text-orange-500" />
            <span className="text-[10px] text-muted-foreground">
              {habit.current_streak} day streak
            </span>
          </div>
          <Badge variant="secondary" className="text-[8px]">
            {habit.frequency}
          </Badge>
        </div>
      </div>
      
      {completedToday && (
        <Badge className="bg-primary/10 text-primary text-[8px]">
          Done today ✓
        </Badge>
      )}
    </div>
  );
}

export function PersonalDataHub({ userId }: PersonalDataHubProps) {
  const {
    items,
    goals,
    habits,
    isLoading,
    refetch,
    createItem,
    completeItem,
    deleteItem,
    completeHabit,
    stats,
    todaysTasks,
    overdueTasks,
    getItemsByType,
  } = usePersonalHub();

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'goals' | 'habits'>('overview');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick add task
  const handleQuickAddTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    await createItem('task', newTaskTitle.trim());
    setNewTaskTitle('');
    inputRef.current?.focus();
  }, [newTaskTitle, createItem]);

  const tasks = getItemsByType('task');
  const notes = getItemsByType('note');
  const activeTasks = tasks.filter(t => t.status === 'active');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={14} className="text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase">
            PERSONAL DATA HUB
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="justify-start rounded-none bg-transparent px-1 py-0 h-8 border-b border-border">
          <TabsTrigger 
            value="overview" 
            className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            OVERVIEW
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent flex items-center gap-1"
          >
            TASKS
            {activeTasks.length > 0 && (
              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">
                {activeTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="goals" 
            className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            GOALS
          </TabsTrigger>
          <TabsTrigger 
            value="habits" 
            className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            HABITS
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Quick Actions */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <PersonalQuickAction
                  icon={CheckSquare}
                  label="Tasks"
                  count={stats.activeTasks}
                  color="hsl(350 70% 50%)"
                  onClick={() => setActiveTab('tasks')}
                />
                <PersonalQuickAction
                  icon={Target}
                  label="Goals"
                  count={stats.activeGoals}
                  color="hsl(150 70% 45%)"
                  onClick={() => setActiveTab('goals')}
                />
                <PersonalQuickAction
                  icon={TrendingUp}
                  label="Habits"
                  count={stats.activeHabits}
                  color="hsl(45 80% 50%)"
                  onClick={() => setActiveTab('habits')}
                />
                <PersonalQuickAction
                  icon={FileText}
                  label="Notes"
                  count={notes.length}
                  color="hsl(200 70% 50%)"
                  onClick={() => {}}
                />
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{stats.completedToday}</p>
                    <p className="text-[10px] text-muted-foreground">Completed Today</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-orange-500">{stats.totalStreak}</p>
                    <p className="text-[10px] text-muted-foreground">Total Streak</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold">{stats.totalItems}</p>
                    <p className="text-[10px] text-muted-foreground">Total Items</p>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Tasks */}
              {todaysTasks.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock size={12} />
                    TODAY'S TASKS
                  </h3>
                  <div className="space-y-1.5">
                    {todaysTasks.slice(0, 3).map(task => (
                      <TaskItem
                        key={task.id}
                        item={task}
                        onComplete={() => completeItem(task.id)}
                        onDelete={() => deleteItem(task.id)}
                      />
                    ))}
                    {todaysTasks.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-[10px]"
                        onClick={() => setActiveTab('tasks')}
                      >
                        View all {todaysTasks.length} tasks →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Overdue Warning */}
              {overdueTasks.length > 0 && (
                <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-destructive" />
                    <span className="text-xs text-destructive font-medium">
                      {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Active Habits */}
              {habits.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono text-muted-foreground mb-2 flex items-center gap-1">
                    <Flame size={12} />
                    TODAY'S HABITS
                  </h3>
                  <div className="space-y-2">
                    {habits.slice(0, 3).map(habit => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        onComplete={() => completeHabit(habit.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="flex-1 m-0 overflow-hidden flex flex-col">
          {/* Quick Add */}
          <div className="p-2 border-b border-border flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Add a task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
              className="h-8 text-sm"
            />
            <Button 
              size="sm" 
              className="h-8 px-3"
              onClick={handleQuickAddTask}
              disabled={!newTaskTitle.trim()}
            >
              <Plus size={14} />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* Active Tasks */}
              {activeTasks.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono text-muted-foreground mb-2">
                    ACTIVE ({activeTasks.length})
                  </h3>
                  <div className="space-y-1.5">
                    {activeTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        item={task}
                        onComplete={() => completeItem(task.id)}
                        onDelete={() => deleteItem(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono text-muted-foreground mb-2">
                    COMPLETED ({completedTasks.length})
                  </h3>
                  <div className="space-y-1.5">
                    {completedTasks.slice(0, 5).map(task => (
                      <TaskItem
                        key={task.id}
                        item={task}
                        onComplete={() => completeItem(task.id)}
                        onDelete={() => deleteItem(task.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <CheckSquare size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
                  <p className="text-[10px] text-muted-foreground">Add your first task above</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {goals.length > 0 ? (
                goals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Target size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No goals yet</p>
                  <p className="text-[10px] text-muted-foreground">Set your first goal to track progress</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Habits Tab */}
        <TabsContent value="habits" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {habits.length > 0 ? (
                habits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onComplete={() => completeHabit(habit.id)}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <TrendingUp size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No habits yet</p>
                  <p className="text-[10px] text-muted-foreground">Build consistent habits to reach your goals</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
