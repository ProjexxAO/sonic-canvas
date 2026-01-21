// Personal Data Hub - Executive-Level Design
// Matches C-Suite aesthetic with professional styling

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalHub, ItemType } from '@/hooks/usePersonalHub';
import { useSubscription } from '@/hooks/useSubscription';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  CheckSquare, 
  FileText, 
  Target, 
  Zap, 
  Plus,
  Calendar,
  Bookmark,
  Heart,
  DollarSign,
  ArrowLeft,
  Flame,
  Trophy,
  Clock,
  User,
  Sparkles,
  TrendingUp,
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function PersonalHub() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tier, canAccessHub } = useSubscription();
  const { theme, setTheme } = useTheme();
  const {
    items,
    goals,
    habits,
    isLoading,
    createItem,
    completeItem,
    createGoal,
    createHabit,
    completeHabit,
    getItemsByType,
    todaysTasks,
    overdueTasks,
    stats,
  } = usePersonalHub();

  const [activeTab, setActiveTab] = useState('overview');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<ItemType>('task');

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  const handleQuickAdd = async () => {
    if (!newItemTitle.trim()) return;
    await createItem(newItemType, newItemTitle);
    setNewItemTitle('');
  };

  const itemTypeConfig: Record<ItemType, { icon: typeof CheckSquare; color: string; label: string }> = {
    task: { icon: CheckSquare, color: 'text-primary', label: 'Tasks' },
    note: { icon: FileText, color: 'text-purple-500', label: 'Notes' },
    event: { icon: Calendar, color: 'text-emerald-500', label: 'Events' },
    goal: { icon: Target, color: 'text-amber-500', label: 'Goals' },
    habit: { icon: Zap, color: 'text-yellow-500', label: 'Habits' },
    finance: { icon: DollarSign, color: 'text-emerald-500', label: 'Finances' },
    health: { icon: Heart, color: 'text-rose-500', label: 'Health' },
    bookmark: { icon: Bookmark, color: 'text-cyan-500', label: 'Bookmarks' },
  };

  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden",
      theme === 'dark' 
        ? "bg-[hsl(240_10%_4%)]" 
        : "bg-gradient-to-br from-[hsl(220_25%_97%)] via-[hsl(220_20%_95%)] to-[hsl(220_30%_92%)]"
    )}>
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {theme === 'dark' ? (
          <>
            {/* Dark mode: Subtle cosmic glow */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
          </>
        ) : (
          <>
            {/* Light mode: Elegant professional gradients */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full blur-[60px]" />
          </>
        )}
      </div>

      {/* Header */}
      <header className={cn(
        "relative z-50 border-b backdrop-blur-xl sticky top-0",
        theme === 'dark' 
          ? "bg-[hsl(240_10%_6%/0.8)] border-border/50" 
          : "bg-white/70 border-border/30 shadow-sm"
      )}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/atlas')}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30"
                    : "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                )}>
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    PERSONAL HUB
                    <Sparkles className="h-4 w-4 text-primary/60" />
                  </h1>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                    Life Command Center
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-8 w-8"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize font-mono text-xs",
                  theme === 'dark' ? "border-primary/30 text-primary" : "border-primary/40 text-primary"
                )}
              >
                {tier} Plan
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-8 space-y-8">
        {/* Executive Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: CheckSquare, value: stats.activeTasks, label: 'Active Tasks', color: 'primary' },
            { icon: Trophy, value: stats.completedToday, label: 'Completed Today', color: 'amber' },
            { icon: Target, value: stats.activeGoals, label: 'Active Goals', color: 'emerald' },
            { icon: Flame, value: stats.totalStreak, label: 'Habit Streak', color: 'rose' },
          ].map((stat, i) => (
            <Card 
              key={i} 
              className={cn(
                "border-0 shadow-lg backdrop-blur-sm overflow-hidden group transition-all duration-300 hover:scale-[1.02]",
                theme === 'dark' 
                  ? "bg-card/40 hover:bg-card/60" 
                  : "bg-white/80 hover:bg-white/95"
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={cn(
                      "text-3xl font-bold tracking-tight",
                      stat.color === 'primary' && "text-primary",
                      stat.color === 'amber' && "text-amber-500",
                      stat.color === 'emerald' && "text-emerald-500",
                      stat.color === 'rose' && "text-rose-500"
                    )}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                  <div className={cn(
                    "p-2.5 rounded-xl transition-colors",
                    stat.color === 'primary' && "bg-primary/10 text-primary",
                    stat.color === 'amber' && "bg-amber-500/10 text-amber-500",
                    stat.color === 'emerald' && "bg-emerald-500/10 text-emerald-500",
                    stat.color === 'rose' && "bg-rose-500/10 text-rose-500"
                  )}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className={cn(
                  "h-1 w-full rounded-full mt-4 overflow-hidden",
                  theme === 'dark' ? "bg-muted/30" : "bg-muted/50"
                )}>
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      stat.color === 'primary' && "bg-primary",
                      stat.color === 'amber' && "bg-amber-500",
                      stat.color === 'emerald' && "bg-emerald-500",
                      stat.color === 'rose' && "bg-rose-500"
                    )}
                    style={{ width: `${Math.min(100, stat.value * 10)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Add - Executive Style */}
        <Card className={cn(
          "border-0 shadow-lg backdrop-blur-sm",
          theme === 'dark' ? "bg-card/40" : "bg-white/80"
        )}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Quick Add</span>
            </div>
            <div className="flex gap-3">
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as ItemType)}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  theme === 'dark' 
                    ? "bg-muted/30 border-border/50 text-foreground" 
                    : "bg-muted/50 border-border/30 text-foreground",
                  "border focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                )}
              >
                {Object.entries(itemTypeConfig).map(([type, config]) => (
                  <option key={type} value={type}>{config.label}</option>
                ))}
              </select>
              <Input
                placeholder={`Add new ${newItemType}...`}
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                className={cn(
                  "flex-1 h-11",
                  theme === 'dark' ? "bg-muted/20" : "bg-muted/30"
                )}
              />
              <Button 
                onClick={handleQuickAdd} 
                disabled={!newItemTitle.trim()}
                className="h-11 px-6"
              >
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs - Executive Style */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={cn(
            "grid w-full grid-cols-5 p-1 h-12",
            theme === 'dark' ? "bg-card/40" : "bg-white/60 shadow-sm"
          )}>
            {[
              { value: 'overview', icon: BarChart3, label: 'Overview' },
              { value: 'tasks', icon: CheckSquare, label: 'Tasks' },
              { value: 'goals', icon: Target, label: 'Goals' },
              { value: 'habits', icon: Zap, label: 'Habits' },
              { value: 'notes', icon: FileText, label: 'Notes' },
            ].map(tab => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 font-medium"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Today's Focus */}
              <Card className={cn(
                "border-0 shadow-lg backdrop-blur-sm",
                theme === 'dark' ? "bg-card/40" : "bg-white/80"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 font-semibold">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    Today's Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[220px] pr-4">
                    {todaysTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <CheckSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No tasks due today</p>
                        <p className="text-xs text-muted-foreground/70">Add tasks to stay organized</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {todaysTasks.map(task => (
                          <div 
                            key={task.id} 
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg transition-all",
                              theme === 'dark' ? "hover:bg-muted/20" : "hover:bg-muted/40"
                            )}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg hover:bg-primary/20"
                              onClick={() => completeItem(task.id)}
                            >
                              <CheckSquare className="h-4 w-4 text-primary" />
                            </Button>
                            <span className="text-sm flex-1 font-medium">{task.title}</span>
                            <Badge 
                              variant={task.priority === 'urgent' ? 'destructive' : 'secondary'} 
                              className="text-[10px] font-mono"
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Habits */}
              <Card className={cn(
                "border-0 shadow-lg backdrop-blur-sm",
                theme === 'dark' ? "bg-card/40" : "bg-white/80"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 font-semibold">
                    <div className="p-1.5 rounded-lg bg-yellow-500/10">
                      <Zap className="h-4 w-4 text-yellow-500" />
                    </div>
                    Daily Habits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[220px] pr-4">
                    {habits.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <Zap className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No habits yet</p>
                        <p className="text-xs text-muted-foreground/70">Build streaks with daily habits</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {habits.map(habit => {
                          const completedToday = habit.last_completed_at 
                            && new Date(habit.last_completed_at).toDateString() === new Date().toDateString();
                          return (
                            <div 
                              key={habit.id} 
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-all",
                                theme === 'dark' ? "hover:bg-muted/20" : "hover:bg-muted/40",
                                completedToday && "opacity-60"
                              )}
                            >
                              <Button
                                variant={completedToday ? 'default' : 'outline'}
                                size="icon"
                                className="h-7 w-7 rounded-lg"
                                onClick={() => !completedToday && completeHabit(habit.id)}
                                disabled={completedToday}
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                              <span className="text-sm flex-1 font-medium">{habit.name}</span>
                              <div className="flex items-center gap-1.5 text-amber-500">
                                <Flame className="h-4 w-4" />
                                <span className="text-sm font-bold">{habit.current_streak}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Goals Progress */}
            <Card className={cn(
              "border-0 shadow-lg backdrop-blur-sm",
              theme === 'dark' ? "bg-card/40" : "bg-white/80"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 font-semibold">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10">
                    <Target className="h-4 w-4 text-emerald-500" />
                  </div>
                  Goal Progress
                  <TrendingUp className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Target className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No goals set yet</p>
                    <p className="text-xs text-muted-foreground/70">Define goals to track your progress</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {goals.slice(0, 3).map(goal => {
                      const progress = goal.target_value 
                        ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                        : 0;
                      return (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{goal.title}</span>
                            <span className="text-muted-foreground font-mono text-xs">
                              {goal.current_value} / {goal.target_value} {goal.unit}
                            </span>
                          </div>
                          <div className={cn(
                            "h-2.5 rounded-full overflow-hidden",
                            theme === 'dark' ? "bg-muted/30" : "bg-muted/50"
                          )}>
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card className={cn(
              "border-0 shadow-lg backdrop-blur-sm",
              theme === 'dark' ? "bg-card/40" : "bg-white/80"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  All Tasks
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  {getItemsByType('task').length} total tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-3">
                    {getItemsByType('task').map(task => (
                      <div 
                        key={task.id} 
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all",
                          task.status === 'completed' ? 'opacity-50' : '',
                          theme === 'dark' 
                            ? "bg-muted/10 border-border/30 hover:bg-muted/20" 
                            : "bg-muted/20 border-border/20 hover:bg-muted/40"
                        )}
                      >
                        <Button
                          variant={task.status === 'completed' ? 'default' : 'outline'}
                          size="icon"
                          className="h-9 w-9 rounded-lg shrink-0"
                          onClick={() => task.status !== 'completed' && completeItem(task.id)}
                          disabled={task.status === 'completed'}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium truncate",
                            task.status === 'completed' && 'line-through'
                          )}>
                            {task.title}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground font-mono">
                              Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={task.priority === 'urgent' ? 'destructive' : 'outline'}
                          className="font-mono text-[10px]"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <Card className={cn(
              "border-0 shadow-lg backdrop-blur-sm",
              theme === 'dark' ? "bg-card/40" : "bg-white/80"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-500" />
                  Your Goals
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  Track your long-term objectives
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4">
                    {goals.map(goal => {
                      const progress = goal.target_value 
                        ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                        : 0;
                      return (
                        <Card 
                          key={goal.id}
                          className={cn(
                            "border-0",
                            theme === 'dark' ? "bg-muted/20" : "bg-muted/30"
                          )}
                        >
                          <CardContent className="p-5">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">{goal.title}</h4>
                                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                                </div>
                                <Badge variant="outline" className="font-mono text-[10px]">
                                  {goal.category}
                                </Badge>
                              </div>
                              {goal.target_value && (
                                <>
                                  <div className={cn(
                                    "h-3 rounded-full overflow-hidden",
                                    theme === 'dark' ? "bg-muted/30" : "bg-muted/50"
                                  )}>
                                    <div 
                                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-right text-muted-foreground font-mono">
                                    {goal.current_value} / {goal.target_value} {goal.unit} ({progress.toFixed(0)}%)
                                  </p>
                                </>
                              )}
                              {goal.target_date && (
                                <p className="text-xs text-muted-foreground">
                                  Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits">
            <Card className={cn(
              "border-0 shadow-lg backdrop-blur-sm",
              theme === 'dark' ? "bg-card/40" : "bg-white/80"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Habit Tracker
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  Build consistency with daily habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4">
                    {habits.map(habit => {
                      const completedToday = habit.last_completed_at 
                        && new Date(habit.last_completed_at).toDateString() === new Date().toDateString();
                      return (
                        <Card 
                          key={habit.id} 
                          className={cn(
                            "border-0 transition-all",
                            completedToday && "ring-1 ring-emerald-500/30",
                            theme === 'dark' ? "bg-muted/20" : "bg-muted/30"
                          )}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold">{habit.name}</h4>
                                <p className="text-sm text-muted-foreground">{habit.description}</p>
                                <div className="flex gap-6 mt-3 text-sm">
                                  <span className="flex items-center gap-1.5">
                                    <Flame className="h-4 w-4 text-amber-500" />
                                    <span className="font-mono">{habit.current_streak}</span>
                                    <span className="text-muted-foreground">day streak</span>
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    <span className="font-mono">Best: {habit.longest_streak}</span>
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant={completedToday ? 'default' : 'outline'}
                                onClick={() => !completedToday && completeHabit(habit.id)}
                                disabled={completedToday}
                                className="ml-4"
                              >
                                {completedToday ? '✓ Done' : 'Complete'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card className={cn(
              "border-0 shadow-lg backdrop-blur-sm",
              theme === 'dark' ? "bg-card/40" : "bg-white/80"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Notes
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  Quick thoughts and ideas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {getItemsByType('note').map(note => (
                      <Card 
                        key={note.id}
                        className={cn(
                          "border-0 transition-all hover:scale-[1.01]",
                          theme === 'dark' ? "bg-muted/20 hover:bg-muted/30" : "bg-muted/30 hover:bg-muted/40"
                        )}
                      >
                        <CardContent className="p-5">
                          <h4 className="font-semibold">{note.title}</h4>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {note.content || 'No content'}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-3 font-mono">
                            {format(new Date(note.created_at), 'MMM d, yyyy')}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
