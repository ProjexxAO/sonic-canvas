// Personal Data Hub - Main Page Component

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePersonalHub, ItemType } from '@/hooks/usePersonalHub';
import { useSubscription } from '@/hooks/useSubscription';
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
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

export default function PersonalHub() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tier, canAccessHub } = useSubscription();
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
    task: { icon: CheckSquare, color: 'text-blue-500', label: 'Tasks' },
    note: { icon: FileText, color: 'text-purple-500', label: 'Notes' },
    event: { icon: Calendar, color: 'text-green-500', label: 'Events' },
    goal: { icon: Target, color: 'text-orange-500', label: 'Goals' },
    habit: { icon: Zap, color: 'text-yellow-500', label: 'Habits' },
    finance: { icon: DollarSign, color: 'text-emerald-500', label: 'Finances' },
    health: { icon: Heart, color: 'text-red-500', label: 'Health' },
    bookmark: { icon: Bookmark, color: 'text-cyan-500', label: 'Bookmarks' },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/atlas')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Personal Hub</h1>
              <p className="text-sm text-muted-foreground">Your life, organized</p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">{tier} Plan</Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeTasks}</p>
                  <p className="text-xs text-muted-foreground">Active Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                  <p className="text-xs text-muted-foreground">Completed Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeGoals}</p>
                  <p className="text-xs text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalStreak}</p>
                  <p className="text-xs text-muted-foreground">Habit Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Add */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as ItemType)}
                className="px-3 py-2 border rounded-md bg-background text-sm"
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
                className="flex-1"
              />
              <Button onClick={handleQuickAdd} disabled={!newItemTitle.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Today's Focus */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" /> Today's Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    {todaysTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tasks due today</p>
                    ) : (
                      <div className="space-y-2">
                        {todaysTasks.map(task => (
                          <div key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => completeItem(task.id)}
                            >
                              <CheckSquare className="h-4 w-4" />
                            </Button>
                            <span className="text-sm flex-1">{task.title}</span>
                            <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" /> Daily Habits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    {habits.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No habits yet. Add one to start building streaks!</p>
                    ) : (
                      <div className="space-y-2">
                        {habits.map(habit => {
                          const completedToday = habit.last_completed_at 
                            && new Date(habit.last_completed_at).toDateString() === new Date().toDateString();
                          return (
                            <div key={habit.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent">
                              <Button
                                variant={completedToday ? 'default' : 'outline'}
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => !completedToday && completeHabit(habit.id)}
                                disabled={completedToday}
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                              <span className="text-sm flex-1">{habit.name}</span>
                              <div className="flex items-center gap-1">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-medium">{habit.current_streak}</span>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" /> Goal Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No goals yet. Set a goal to track your progress!</p>
                ) : (
                  <div className="space-y-4">
                    {goals.slice(0, 3).map(goal => {
                      const progress = goal.target_value 
                        ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                        : 0;
                      return (
                        <div key={goal.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{goal.title}</span>
                            <span className="text-muted-foreground">
                              {goal.current_value} / {goal.target_value} {goal.unit}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
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
            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
                <CardDescription>{getItemsByType('task').length} total tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {getItemsByType('task').map(task => (
                      <div 
                        key={task.id} 
                        className={`flex items-center gap-3 p-3 rounded border ${
                          task.status === 'completed' ? 'opacity-50' : ''
                        }`}
                      >
                        <Button
                          variant={task.status === 'completed' ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => task.status !== 'completed' && completeItem(task.id)}
                          disabled={task.status === 'completed'}
                        >
                          <CheckSquare className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                          <p className={task.status === 'completed' ? 'line-through' : ''}>{task.title}</p>
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        <Badge variant={task.priority === 'urgent' ? 'destructive' : 'outline'}>
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
            <Card>
              <CardHeader>
                <CardTitle>Your Goals</CardTitle>
                <CardDescription>Track your long-term objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {goals.map(goal => {
                      const progress = goal.target_value 
                        ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                        : 0;
                      return (
                        <Card key={goal.id}>
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{goal.title}</h4>
                                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                                </div>
                                <Badge>{goal.category}</Badge>
                              </div>
                              {goal.target_value && (
                                <>
                                  <Progress value={progress} />
                                  <p className="text-sm text-right text-muted-foreground">
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
            <Card>
              <CardHeader>
                <CardTitle>Habit Tracker</CardTitle>
                <CardDescription>Build consistency with daily habits</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {habits.map(habit => {
                      const completedToday = habit.last_completed_at 
                        && new Date(habit.last_completed_at).toDateString() === new Date().toDateString();
                      return (
                        <Card key={habit.id} className={completedToday ? 'border-green-500/50' : ''}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{habit.name}</h4>
                                <p className="text-sm text-muted-foreground">{habit.description}</p>
                                <div className="flex gap-4 mt-2 text-sm">
                                  <span className="flex items-center gap-1">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    {habit.current_streak} day streak
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    Best: {habit.longest_streak}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant={completedToday ? 'default' : 'outline'}
                                onClick={() => !completedToday && completeHabit(habit.id)}
                                disabled={completedToday}
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
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Quick thoughts and ideas</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="grid gap-4 md:grid-cols-2">
                    {getItemsByType('note').map(note => (
                      <Card key={note.id}>
                        <CardContent className="pt-4">
                          <h4 className="font-medium">{note.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                            {note.content || 'No content'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
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
