// Personal Data Hub - Complete personal interface for all individual needs
// Includes Tasks, Goals, Habits, Email, Finance, Photos, Social Media, News, Weather

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
  AlertCircle,
  Mail,
  DollarSign,
  Image,
  Camera,
  Share2,
  Newspaper,
  Cloud,
  Sun,
  ExternalLink,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Music,
  Wallet,
  CreditCard,
  PiggyBank,
  Heart,
  Dumbbell,
  Utensils,
  Pill,
  Plane,
  ShoppingBag,
  Car,
  Home,
  Smartphone,
  Gamepad2,
  BookOpen,
  Tv,
  Rss
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { usePersonalHub, PersonalItem, PersonalGoal, PersonalHabit } from '@/hooks/usePersonalHub';
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
  onClick,
  badge
}: { 
  icon: typeof CheckSquare; 
  label: string; 
  count?: number; 
  color: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-2 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors min-w-[60px]"
    >
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center mb-0.5"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={12} style={{ color }} />
      </div>
      <span className="text-[9px] font-mono text-foreground truncate max-w-full">{label}</span>
      {count !== undefined && (
        <Badge variant="secondary" className="text-[7px] mt-0.5 px-1 py-0 h-3">
          {count}
        </Badge>
      )}
      {badge && (
        <Badge variant="outline" className="text-[7px] mt-0.5 px-1 py-0 h-3">
          {badge}
        </Badge>
      )}
    </button>
  );
}

// External link card for social/services
function ExternalLinkCard({ 
  icon: Icon, 
  label, 
  url, 
  color,
  connected
}: { 
  icon: typeof Instagram; 
  label: string; 
  url: string;
  color: string;
  connected?: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate block">{label}</span>
        {connected && (
          <span className="text-[9px] text-emerald-500">Connected</span>
        )}
      </div>
      <ExternalLink size={10} className="text-muted-foreground" />
    </a>
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
      <button onClick={onComplete} className="flex-shrink-0">
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
function HabitCard({ habit, onComplete }: { habit: PersonalHabit; onComplete: () => void }) {
  const completedToday = habit.last_completed_at && isToday(parseISO(habit.last_completed_at));
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      completedToday ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:bg-card/80"
    )}>
      <button
        onClick={onComplete}
        disabled={completedToday}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          completedToday ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
        )}
      >
        {completedToday ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{habit.name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1">
            <Flame size={10} className="text-orange-500" />
            <span className="text-[10px] text-muted-foreground">{habit.current_streak} day streak</span>
          </div>
          <Badge variant="secondary" className="text-[8px]">{habit.frequency}</Badge>
        </div>
      </div>
      
      {completedToday && (
        <Badge className="bg-primary/10 text-primary text-[8px]">Done ✓</Badge>
      )}
    </div>
  );
}

export function PersonalDataHub({ userId }: PersonalDataHubProps) {
  const {
    items, goals, habits, isLoading, refetch,
    createItem, completeItem, deleteItem, completeHabit,
    stats, todaysTasks, overdueTasks, getItemsByType,
  } = usePersonalHub();

  const [activeTab, setActiveTab] = useState<'overview' | 'life' | 'social' | 'more'>('overview');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuickAddTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    await createItem('task', newTaskTitle.trim());
    setNewTaskTitle('');
    inputRef.current?.focus();
  }, [newTaskTitle, createItem]);

  const tasks = getItemsByType('task');
  const notes = getItemsByType('note');
  const activeTasks = tasks.filter(t => t.status === 'active');

  return (
    <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={14} className="text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase">PERSONAL HUB</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="justify-start rounded-none bg-transparent px-1 py-0 h-8 border-b border-border">
          <TabsTrigger value="overview" className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
            OVERVIEW
          </TabsTrigger>
          <TabsTrigger value="life" className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
            LIFE
          </TabsTrigger>
          <TabsTrigger value="social" className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
            SOCIAL
          </TabsTrigger>
          <TabsTrigger value="more" className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent">
            MORE
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Core Personal Items */}
        <TabsContent value="overview" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Primary Quick Actions */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">ESSENTIALS</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={CheckSquare} label="Tasks" count={stats.activeTasks} color="hsl(350 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Target} label="Goals" count={stats.activeGoals} color="hsl(150 70% 45%)" onClick={() => {}} />
                  <PersonalQuickAction icon={TrendingUp} label="Habits" count={stats.activeHabits} color="hsl(45 80% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Calendar} label="Events" color="hsl(280 70% 50%)" onClick={() => {}} />
                </div>
              </div>

              {/* Communication & Finance */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">COMMUNICATION & FINANCE</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={Mail} label="Email" badge="3" color="hsl(200 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={DollarSign} label="Finance" color="hsl(150 70% 45%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Wallet} label="Wallet" color="hsl(35 80% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={CreditCard} label="Cards" color="hsl(220 70% 50%)" onClick={() => {}} />
                </div>
              </div>

              {/* Media */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">PHOTOS & MEDIA</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={Image} label="Photos" color="hsl(280 60% 55%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Camera} label="Camera" color="hsl(200 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={FileText} label="Notes" count={notes.length} color="hsl(45 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Bookmark} label="Saved" color="hsl(350 60% 50%)" onClick={() => {}} />
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="bg-card/50">
                  <CardContent className="p-2 text-center">
                    <p className="text-xl font-bold text-primary">{stats.completedToday}</p>
                    <p className="text-[9px] text-muted-foreground">Today</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-2 text-center">
                    <p className="text-xl font-bold text-orange-500">{stats.totalStreak}</p>
                    <p className="text-[9px] text-muted-foreground">Streak</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-2 text-center">
                    <p className="text-xl font-bold">{stats.totalItems}</p>
                    <p className="text-[9px] text-muted-foreground">Items</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Add Task */}
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Quick add task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8 px-3" onClick={handleQuickAddTask} disabled={!newTaskTitle.trim()}>
                  <Plus size={14} />
                </Button>
              </div>

              {/* Today's Tasks */}
              {todaysTasks.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock size={10} /> TODAY'S TASKS
                  </h3>
                  <div className="space-y-1.5">
                    {todaysTasks.slice(0, 3).map(task => (
                      <TaskItem key={task.id} item={task} onComplete={() => completeItem(task.id)} onDelete={() => deleteItem(task.id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Overdue Warning */}
              {overdueTasks.length > 0 && (
                <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={12} className="text-destructive" />
                    <span className="text-[10px] text-destructive font-medium">{overdueTasks.length} overdue</span>
                  </div>
                </div>
              )}

              {/* Habits Preview */}
              {habits.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                    <Flame size={10} /> HABITS
                  </h3>
                  <div className="space-y-1.5">
                    {habits.slice(0, 2).map(habit => (
                      <HabitCard key={habit.id} habit={habit} onComplete={() => completeHabit(habit.id)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Life Tab - Personal Life Categories */}
        <TabsContent value="life" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Health & Wellness */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">HEALTH & WELLNESS</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={Heart} label="Health" color="hsl(350 70% 55%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Dumbbell} label="Fitness" color="hsl(200 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Utensils} label="Nutrition" color="hsl(35 80% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Pill} label="Meds" color="hsl(280 60% 55%)" onClick={() => {}} />
                </div>
              </div>

              {/* Lifestyle */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">LIFESTYLE</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={Plane} label="Travel" color="hsl(200 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={ShoppingBag} label="Shopping" color="hsl(320 70% 55%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Car} label="Transport" color="hsl(220 60% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Home} label="Home" color="hsl(35 60% 50%)" onClick={() => {}} />
                </div>
              </div>

              {/* Entertainment */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">ENTERTAINMENT</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={Tv} label="Streaming" color="hsl(350 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Music} label="Music" color="hsl(150 70% 45%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Gamepad2} label="Games" color="hsl(280 70% 55%)" onClick={() => {}} />
                  <PersonalQuickAction icon={BookOpen} label="Reading" color="hsl(35 70% 50%)" onClick={() => {}} />
                </div>
              </div>

              {/* Finance Details */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">FINANCE</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={DollarSign} label="Income" color="hsl(150 70% 45%)" onClick={() => {}} />
                  <PersonalQuickAction icon={CreditCard} label="Expenses" color="hsl(350 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={PiggyBank} label="Savings" color="hsl(200 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={TrendingUp} label="Invest" color="hsl(280 60% 55%)" onClick={() => {}} />
                </div>
              </div>

              {/* Goals Preview */}
              {goals.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                    <Target size={10} /> YOUR GOALS
                  </h3>
                  <div className="space-y-2">
                    {goals.slice(0, 3).map(goal => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Social Tab - Social Media & Connections */}
        <TabsContent value="social" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Social Media Links */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">SOCIAL MEDIA</h3>
                <div className="space-y-2">
                  <ExternalLinkCard icon={Instagram} label="Instagram" url="https://instagram.com" color="hsl(330 70% 55%)" />
                  <ExternalLinkCard icon={Twitter} label="X (Twitter)" url="https://x.com" color="hsl(200 90% 50%)" />
                  <ExternalLinkCard icon={Facebook} label="Facebook" url="https://facebook.com" color="hsl(220 70% 50%)" />
                  <ExternalLinkCard icon={Linkedin} label="LinkedIn" url="https://linkedin.com" color="hsl(210 80% 45%)" />
                  <ExternalLinkCard icon={Youtube} label="YouTube" url="https://youtube.com" color="hsl(0 70% 50%)" />
                </div>
              </div>

              {/* Messaging */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">MESSAGING</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={Mail} label="Email" color="hsl(200 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Smartphone} label="SMS" color="hsl(150 70% 45%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Share2} label="Share" color="hsl(280 60% 55%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Heart} label="Dating" color="hsl(350 70% 55%)" onClick={() => {}} />
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* More Tab - Additional Services */}
        <TabsContent value="more" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* News & Info */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">NEWS & INFORMATION</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={Newspaper} label="News" color="hsl(220 60% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Sun} label="Weather" color="hsl(45 90% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Cloud} label="Forecast" color="hsl(200 60% 55%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Rss} label="Feeds" color="hsl(35 80% 50%)" onClick={() => {}} />
                </div>
              </div>

              {/* Reports & Analytics */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">REPORTS & INSIGHTS</h3>
                <div className="grid grid-cols-4 gap-2">
                  <PersonalQuickAction icon={TrendingUp} label="Weekly" color="hsl(150 70% 45%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Target} label="Monthly" color="hsl(280 60% 55%)" onClick={() => {}} />
                  <PersonalQuickAction icon={DollarSign} label="Spending" color="hsl(350 70% 50%)" onClick={() => {}} />
                  <PersonalQuickAction icon={Heart} label="Wellness" color="hsl(320 60% 55%)" onClick={() => {}} />
                </div>
              </div>

              {/* Connected Services */}
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">CONNECTED SERVICES</h3>
                <div className="space-y-2">
                  <Card className="bg-card/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Cloud size={18} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Cloud Storage</p>
                          <p className="text-[10px] text-muted-foreground">Connect Google Drive, Dropbox, iCloud</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-[10px] h-7">
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Mail size={18} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Email Accounts</p>
                          <p className="text-[10px] text-muted-foreground">Sync Gmail, Outlook, Yahoo</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-[10px] h-7">
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <CreditCard size={18} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Banking</p>
                          <p className="text-[10px] text-muted-foreground">Link bank accounts for tracking</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-[10px] h-7">
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
