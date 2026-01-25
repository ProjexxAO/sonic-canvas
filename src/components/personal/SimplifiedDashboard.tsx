// Simplified Dashboard - User-centric, Atlas-first design
// Designed for universal accessibility: children to seniors
// Large touch targets, minimal cognitive load, AI-driven personalization
// Enhanced with Famous AI-inspired UI patterns

import { useMemo, useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  CheckSquare, 
  Target, 
  Calendar, 
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
  Sunrise,
  Plus,
  Wand2,
  Flame,
  GripVertical,
  Wallet
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePersonalHub } from '@/hooks/usePersonalHub';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { MetricHeaderRow } from './MetricHeaderRow';
import { WeekHabitGrid } from './WeekHabitGrid';
import { CompactFinanceCard } from './CompactFinanceCard';

interface SimplifiedDashboardProps {
  userId: string | undefined;
  onOpenFullDashboard?: () => void;
  onNavigate?: (view: string) => void;
  onCreateWidget?: () => void;
}

// Get time-based greeting
function getGreeting(): { text: string; icon: typeof Sun; period: 'morning' | 'afternoon' | 'evening' } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise, period: 'morning' };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun, period: 'afternoon' };
  return { text: 'Good evening', icon: Moon, period: 'evening' };
}

// Smart priority card - shows what matters most right now
function PriorityCard({ 
  icon: Icon, 
  title, 
  subtitle, 
  value, 
  color, 
  onClick,
  highlight = false,
  dragHandleProps,
  isDragging = false
}: { 
  icon: typeof CheckSquare; 
  title: string; 
  subtitle: string; 
  value?: string | number;
  color: string;
  onClick?: () => void;
  highlight?: boolean;
  dragHandleProps?: any;
  isDragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 bg-card group relative",
        "focus:outline-none focus:ring-4 focus:ring-primary/20",
        highlight 
          ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" 
          : "border-border hover:border-primary/50",
        isDragging && "shadow-xl opacity-95 ring-2 ring-primary/30"
      )}
    >
      {/* Drag handle */}
      <div 
        {...dragHandleProps}
        className={cn(
          "absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded cursor-grab active:cursor-grabbing",
          "opacity-0 group-hover:opacity-100 transition-opacity bg-muted/80 hover:bg-muted"
        )}
      >
        <GripVertical size={16} className="text-muted-foreground" />
      </div>
      
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 text-left"
      >
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={32} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-foreground truncate">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        {value !== undefined && (
          <div className="text-right flex-shrink-0">
            <span className="text-3xl font-bold" style={{ color }}>{value}</span>
          </div>
        )}
        <ChevronRight size={24} className="text-muted-foreground flex-shrink-0" />
      </button>
    </div>
  );
}

// Today's Focus Card - the most important thing
function TodaysFocusCard({ 
  task, 
  onComplete 
}: { 
  task: { title: string; priority: string } | null;
  onComplete?: () => void;
}) {
  if (!task) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <Sparkles size={48} className="text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-foreground mb-2">All caught up!</h3>
          <p className="text-muted-foreground">You have no urgent tasks. Enjoy your day!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="text-xs px-3 py-1">
            TOP PRIORITY
          </Badge>
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-4 leading-tight">
          {task.title}
        </h3>
        <Button 
          onClick={onComplete}
          size="lg"
          className="w-full h-14 text-lg font-semibold rounded-xl"
        >
          <CheckSquare size={24} className="mr-3" />
          Mark Complete
        </Button>
      </CardContent>
    </Card>
  );
}

// Note: QuickStatsRow replaced by MetricHeaderRow for Famous AI-inspired design

export function SimplifiedDashboard({ 
  userId, 
  onOpenFullDashboard,
  onNavigate,
  onCreateWidget
}: SimplifiedDashboardProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { 
    items, 
    goals, 
    habits, 
    isLoading,
    completeItem
  } = usePersonalHub();
  
  const { preferences, updateWidgetOrder } = useDashboardPreferences();
  const [cardOrder, setCardOrder] = useState<string[]>(['tasks', 'goals', 'habits', 'calendar']);

  // Sync card order from preferences
  useEffect(() => {
    if (preferences.widget_order && preferences.widget_order.length > 0) {
      // Filter to only include valid simple dashboard cards
      const validCards = ['tasks', 'goals', 'habits', 'calendar'];
      const savedOrder = preferences.widget_order.filter(id => validCards.includes(id));
      // Add any missing cards at the end
      const missingCards = validCards.filter(id => !savedOrder.includes(id));
      setCardOrder([...savedOrder, ...missingCards]);
    }
  }, [preferences.widget_order]);

  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.email?.split('@')[0] || 'there';

  // Calculate smart stats
  const stats = useMemo(() => {
    const todayTasks = items.filter(i => 
      i.item_type === 'task' && 
      i.status !== 'completed' &&
      i.due_date && 
      isToday(parseISO(i.due_date))
    );
    
    const activeGoals = goals.filter(g => g.status === 'in_progress');
    
    const currentStreak = habits.reduce((max, h) => 
      Math.max(max, h.current_streak || 0), 0
    );

    return {
      tasksToday: todayTasks.length,
      activeGoals: activeGoals.length,
      habitStreak: currentStreak,
    };
  }, [items, goals, habits]);

  // Get the top priority task
  const topPriorityTask = useMemo(() => {
    const urgentTasks = items
      .filter(i => 
        i.item_type === 'task' && 
        i.status !== 'completed' &&
        (i.priority === 'urgent' || i.priority === 'high')
      )
      .sort((a, b) => {
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
        return 0;
      });
    
    return urgentTasks[0] || null;
  }, [items]);

  const handleCompleteTask = async () => {
    if (topPriorityTask) {
      await completeItem(topPriorityTask.id);
    }
  };

  // Handle drag end for reordering cards
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(cardOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setCardOrder(items);
    updateWidgetOrder(items);
    toast.success('Dashboard order saved');
  }, [cardOrder, updateWidgetOrder]);

  // Priority cards configuration based on what user cares about
  const priorityCardsConfig = useMemo(() => {
    return {
      tasks: {
        id: 'tasks',
        icon: CheckSquare,
        title: 'Tasks',
        subtitle: stats.tasksToday > 0 ? `${stats.tasksToday} due today` : 'All caught up!',
        value: stats.tasksToday > 0 ? stats.tasksToday : undefined,
        color: 'hsl(var(--primary))',
        highlight: stats.tasksToday > 3
      },
      goals: {
        id: 'goals',
        icon: Target,
        title: 'Goals',
        subtitle: stats.activeGoals > 0 ? 'Track your progress' : 'Set a new goal',
        value: stats.activeGoals > 0 ? stats.activeGoals : undefined,
        color: 'hsl(200 70% 50%)',
        highlight: false
      },
      habits: {
        id: 'habits',
        icon: Flame,
        title: 'Habits',
        subtitle: stats.habitStreak > 0 ? `${stats.habitStreak} day streak!` : 'Build your routine',
        value: stats.habitStreak > 0 ? stats.habitStreak : undefined,
        color: 'hsl(25 90% 55%)',
        highlight: stats.habitStreak >= 7
      },
      calendar: {
        id: 'calendar',
        icon: Calendar,
        title: 'Calendar',
        subtitle: "What's coming up",
        value: undefined as string | number | undefined,
        color: 'hsl(260 70% 55%)',
        highlight: false
      }
    };
  }, [stats]);

  // Sort cards based on user's saved order
  const sortedCards = useMemo(() => {
    return cardOrder
      .map(id => priorityCardsConfig[id as keyof typeof priorityCardsConfig])
      .filter(Boolean);
  }, [cardOrder, priorityCardsConfig]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Greeting with Create Widget button */}
      <div className={cn(
        "flex-shrink-0 px-6 pt-6 pb-4",
        isMobile && "px-4 pt-4 pb-3"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              greeting.period === 'morning' && "bg-orange-100 dark:bg-orange-900/30",
              greeting.period === 'afternoon' && "bg-yellow-100 dark:bg-yellow-900/30",
              greeting.period === 'evening' && "bg-indigo-100 dark:bg-indigo-900/30"
            )}>
              <greeting.icon size={24} className={cn(
                greeting.period === 'morning' && "text-orange-500",
                greeting.period === 'afternoon' && "text-yellow-500",
                greeting.period === 'evening' && "text-indigo-400"
              )} />
            </div>
            <div>
              <h1 className={cn(
                "font-bold text-foreground",
                isMobile ? "text-xl" : "text-2xl"
              )}>
                {greeting.text}, {userName}!
              </h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
            </div>
          </div>
          
          {/* Create Widget button in header */}
          <button
            onClick={onCreateWidget}
            className={cn(
              "w-10 h-10 rounded-xl border transition-all duration-200 flex items-center justify-center",
              "hover:scale-105 active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
            )}
            title="Create Widget with AI"
          >
            <Wand2 size={18} className="text-purple-500" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className={cn(
          "px-6 pb-32 space-y-5",
          isMobile && "px-4 space-y-4"
        )}>
          {/* Metric Header Row - Famous AI inspired KPIs */}
          <MetricHeaderRow />

          {/* Today's Focus */}
          <TodaysFocusCard 
            task={topPriorityTask}
            onComplete={handleCompleteTask}
          />

          {/* Compact Finance Card with circular progress */}
          <CompactFinanceCard 
            onClick={() => onNavigate?.('finance')}
            savingsGoal={10000}
          />

          {/* Week Habit Grid - Visual 7-day checkmarks */}
          <WeekHabitGrid 
            onHabitClick={(habitId) => onNavigate?.('habits')}
          />

          {/* Smart Priority Cards with Drag & Drop */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Quick Access
            </h2>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="simple-dashboard-cards" direction="vertical">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3"
                  >
                    {sortedCards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <PriorityCard
                              icon={card.icon}
                              title={card.title}
                              subtitle={card.subtitle}
                              value={card.value}
                              color={card.color}
                              highlight={card.highlight}
                              onClick={() => onNavigate?.(card.id)}
                              dragHandleProps={provided.dragHandleProps}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* More Options Link */}
          {onOpenFullDashboard && (
            <Button
              variant="outline"
              onClick={onOpenFullDashboard}
              className="w-full h-14 text-base rounded-xl"
            >
              <Plus size={20} className="mr-2" />
              More Options
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default SimplifiedDashboard;
