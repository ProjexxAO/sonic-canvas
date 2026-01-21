// Personal Data Hub - Dynamic personal interface with user-selected overview items
// Life, Social, More consolidated into dropdown menu

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
  ExternalLink,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Wallet,
  CreditCard,
  Heart,
  Dumbbell,
  Pill,
  Plane,
  ShoppingBag,
  Tv,
  Rss,
  Cloud,
  Sun,
  ChevronDown,
  Settings,
  Star,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { usePersonalHub, PersonalItem, PersonalGoal, PersonalHabit } from '@/hooks/usePersonalHub';
import { cn } from '@/lib/utils';
import { format, isToday, isPast, parseISO } from 'date-fns';

interface PersonalDataHubProps {
  userId: string | undefined;
}

// Quick action item definition
interface QuickActionItem {
  id: string;
  icon: typeof CheckSquare;
  label: string;
  color: string;
  category: 'life' | 'social' | 'more';
  url?: string;
  count?: number;
  badge?: string;
}

// All available quick actions
const ALL_QUICK_ACTIONS: QuickActionItem[] = [
  // Life category
  { id: 'health', icon: Heart, label: 'Health', color: 'hsl(350 70% 50%)', category: 'life' },
  { id: 'fitness', icon: Dumbbell, label: 'Fitness', color: 'hsl(200 70% 50%)', category: 'life' },
  { id: 'medications', icon: Pill, label: 'Meds', color: 'hsl(150 60% 45%)', category: 'life' },
  { id: 'travel', icon: Plane, label: 'Travel', color: 'hsl(220 70% 55%)', category: 'life' },
  { id: 'shopping', icon: ShoppingBag, label: 'Shopping', color: 'hsl(280 60% 55%)', category: 'life' },
  { id: 'streaming', icon: Tv, label: 'Streaming', color: 'hsl(350 60% 50%)', category: 'life' },
  
  // Social category
  { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'hsl(340 75% 55%)', category: 'social', url: 'https://instagram.com' },
  { id: 'twitter', icon: Twitter, label: 'X / Twitter', color: 'hsl(200 90% 45%)', category: 'social', url: 'https://x.com' },
  { id: 'facebook', icon: Facebook, label: 'Facebook', color: 'hsl(220 70% 50%)', category: 'social', url: 'https://facebook.com' },
  { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'hsl(210 80% 45%)', category: 'social', url: 'https://linkedin.com' },
  { id: 'youtube', icon: Youtube, label: 'YouTube', color: 'hsl(0 80% 50%)', category: 'social', url: 'https://youtube.com' },
  
  // More category
  { id: 'news', icon: Rss, label: 'News', color: 'hsl(35 80% 50%)', category: 'more' },
  { id: 'weather', icon: Sun, label: 'Weather', color: 'hsl(45 90% 50%)', category: 'more' },
  { id: 'cloud', icon: Cloud, label: 'Cloud Storage', color: 'hsl(200 60% 50%)', category: 'more' },
];

// Quick action card for personal actions
function PersonalQuickAction({ 
  icon: Icon, 
  label, 
  count, 
  color, 
  onClick,
  badge,
  onRemove,
  url
}: { 
  icon: typeof CheckSquare; 
  label: string; 
  count?: number; 
  color: string;
  onClick: () => void;
  badge?: string;
  onRemove?: () => void;
  url?: string;
}) {
  const handleClick = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      onClick();
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        className="flex flex-col items-center justify-center p-2 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors min-w-[60px] w-full"
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
        {url && (
          <ExternalLink size={8} className="absolute top-1 right-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <Trash2 size={8} />
        </button>
      )}
    </div>
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
        <DropdownMenuContent align="end" className="bg-popover border-border">
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

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([
    'tasks', 'goals', 'habits', 'email', 'photos', 'finance'
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuickAddTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    await createItem('task', newTaskTitle.trim());
    setNewTaskTitle('');
    inputRef.current?.focus();
  }, [newTaskTitle, createItem]);

  const addActionToOverview = (actionId: string) => {
    if (!selectedActions.includes(actionId)) {
      setSelectedActions([...selectedActions, actionId]);
    }
  };

  const removeActionFromOverview = (actionId: string) => {
    setSelectedActions(selectedActions.filter(id => id !== actionId));
  };

  const tasks = getItemsByType('task');
  const notes = getItemsByType('note');

  // Default quick actions (always visible)
  const defaultActions = [
    { id: 'tasks', icon: CheckSquare, label: 'Tasks', count: stats.activeTasks, color: 'hsl(350 70% 50%)' },
    { id: 'goals', icon: Target, label: 'Goals', count: stats.activeGoals, color: 'hsl(150 70% 45%)' },
    { id: 'habits', icon: TrendingUp, label: 'Habits', count: stats.activeHabits, color: 'hsl(45 80% 50%)' },
    { id: 'email', icon: Mail, label: 'Email', badge: '3', color: 'hsl(200 70% 50%)' },
    { id: 'finance', icon: DollarSign, label: 'Finance', color: 'hsl(150 70% 45%)' },
    { id: 'photos', icon: Image, label: 'Photos', color: 'hsl(280 60% 55%)' },
    { id: 'wallet', icon: Wallet, label: 'Wallet', color: 'hsl(35 80% 50%)' },
    { id: 'cards', icon: CreditCard, label: 'Cards', color: 'hsl(220 70% 50%)' },
    { id: 'notes', icon: FileText, label: 'Notes', count: notes.length, color: 'hsl(45 70% 50%)' },
    { id: 'saved', icon: Bookmark, label: 'Saved', color: 'hsl(350 60% 50%)' },
  ];

  // Filter visible actions based on selection
  const visibleDefaultActions = defaultActions.filter(a => selectedActions.includes(a.id));
  const visibleCustomActions = ALL_QUICK_ACTIONS.filter(a => selectedActions.includes(a.id));

  const lifeActions = ALL_QUICK_ACTIONS.filter(a => a.category === 'life');
  const socialActions = ALL_QUICK_ACTIONS.filter(a => a.category === 'social');
  const moreActions = ALL_QUICK_ACTIONS.filter(a => a.category === 'more');

  return (
    <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Header with dropdown */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={14} className="text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase">MY OVERVIEW</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Add Items Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-mono">
                <Plus size={10} className="mr-1" />
                Add
                <ChevronDown size={10} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
              {/* Life Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <Heart size={12} className="mr-2" />
                  Life
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover border-border">
                    {lifeActions.map(action => (
                      <DropdownMenuItem 
                        key={action.id} 
                        onClick={() => addActionToOverview(action.id)}
                        className="text-xs"
                        disabled={selectedActions.includes(action.id)}
                      >
                        <action.icon size={12} className="mr-2" style={{ color: action.color }} />
                        {action.label}
                        {selectedActions.includes(action.id) && (
                          <CheckCircle2 size={10} className="ml-auto text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Social Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <Instagram size={12} className="mr-2" />
                  Social
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover border-border">
                    {socialActions.map(action => (
                      <DropdownMenuItem 
                        key={action.id} 
                        onClick={() => addActionToOverview(action.id)}
                        className="text-xs"
                        disabled={selectedActions.includes(action.id)}
                      >
                        <action.icon size={12} className="mr-2" style={{ color: action.color }} />
                        {action.label}
                        {selectedActions.includes(action.id) && (
                          <CheckCircle2 size={10} className="ml-auto text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* More Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <MoreHorizontal size={12} className="mr-2" />
                  More
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover border-border">
                    {moreActions.map(action => (
                      <DropdownMenuItem 
                        key={action.id} 
                        onClick={() => addActionToOverview(action.id)}
                        className="text-xs"
                        disabled={selectedActions.includes(action.id)}
                      >
                        <action.icon size={12} className="mr-2" style={{ color: action.color }} />
                        {action.label}
                        {selectedActions.includes(action.id) && (
                          <CheckCircle2 size={10} className="ml-auto text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              
              {/* Core items that were removed */}
              <DropdownMenuLabel className="text-[10px] text-muted-foreground">Core</DropdownMenuLabel>
              {defaultActions.filter(a => !selectedActions.includes(a.id)).map(action => (
                <DropdownMenuItem 
                  key={action.id} 
                  onClick={() => addActionToOverview(action.id)}
                  className="text-xs"
                >
                  <action.icon size={12} className="mr-2" style={{ color: action.color }} />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Content - User Selected Items Only */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* User Selected Quick Actions */}
          {(visibleDefaultActions.length > 0 || visibleCustomActions.length > 0) && (
            <div>
              <h3 className="text-[10px] font-mono text-muted-foreground mb-2">MY SHORTCUTS</h3>
              <div className="grid grid-cols-4 gap-2">
                {visibleDefaultActions.map(action => (
                  <PersonalQuickAction 
                    key={action.id}
                    icon={action.icon} 
                    label={action.label} 
                    count={action.count}
                    badge={action.badge}
                    color={action.color} 
                    onClick={() => {
                      // Scroll to the relevant section
                      const sectionId = `section-${action.id}`;
                      const element = document.getElementById(sectionId);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }} 
                    onRemove={() => removeActionFromOverview(action.id)}
                  />
                ))}
                {visibleCustomActions.map(action => (
                  <PersonalQuickAction 
                    key={action.id}
                    icon={action.icon} 
                    label={action.label} 
                    color={action.color} 
                    url={action.url}
                    onClick={() => {}} 
                    onRemove={() => removeActionFromOverview(action.id)}
                  />
                ))}
              </div>
            </div>
          )}

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
            <div id="section-tasks">
              <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                <Clock size={10} /> TODAY'S TASKS
              </h3>
              <div className="space-y-1.5">
                {todaysTasks.slice(0, 5).map(task => (
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
                <span className="text-[10px] text-destructive font-medium">{overdueTasks.length} overdue tasks</span>
              </div>
            </div>
          )}

          {/* Habits Preview */}
          {habits.length > 0 && (
            <div id="section-habits">
              <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                <Flame size={10} /> DAILY HABITS
              </h3>
              <div className="space-y-2">
                {habits.slice(0, 3).map(habit => (
                  <HabitCard key={habit.id} habit={habit} onComplete={() => completeHabit(habit.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Goals Preview */}
          {goals.length > 0 && (
            <div id="section-goals">
              <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                <Target size={10} /> ACTIVE GOALS
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {goals.slice(0, 4).map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {visibleDefaultActions.length === 0 && visibleCustomActions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Star size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No shortcuts added yet</p>
              <p className="text-xs mt-1">Use the "Add" button to customize your overview</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
