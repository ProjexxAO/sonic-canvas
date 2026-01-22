// Simplified Dashboard - User-centric, Atlas-first design
// Designed for universal accessibility: children to seniors
// Large touch targets, minimal cognitive load, AI-driven personalization

import { useMemo } from 'react';
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
  Flame
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePersonalHub } from '@/hooks/usePersonalHub';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO } from 'date-fns';

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
  highlight = false
}: { 
  icon: typeof CheckSquare; 
  title: string; 
  subtitle: string; 
  value?: string | number;
  color: string;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-6 rounded-2xl border-2 transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus:outline-none focus:ring-4 focus:ring-primary/20",
        highlight 
          ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" 
          : "bg-card border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center gap-4">
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
      </div>
    </button>
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

// Quick Stats Row - at-a-glance metrics
function QuickStatsRow({ 
  tasks, 
  goals, 
  habits 
}: { 
  tasks: number; 
  goals: number; 
  habits: number; 
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Tasks Today', value: tasks, color: 'hsl(var(--primary))' },
        { label: 'Goals Active', value: goals, color: 'hsl(200 70% 50%)' },
        { label: 'Habit Streak', value: habits, color: 'hsl(25 90% 55%)' },
      ].map((stat) => (
        <Card key={stat.label} className="bg-card/50">
          <CardContent className="p-4 text-center">
            <p 
              className="text-3xl font-bold"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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

  // Priority cards based on what user cares about
  const priorityCards = useMemo(() => {
    const cards = [];
    
    // Tasks - always show
    cards.push({
      id: 'tasks',
      icon: CheckSquare,
      title: 'Tasks',
      subtitle: stats.tasksToday > 0 ? `${stats.tasksToday} due today` : 'All caught up!',
      value: stats.tasksToday > 0 ? stats.tasksToday : undefined,
      color: 'hsl(var(--primary))',
      highlight: stats.tasksToday > 3
    });
    
    // Goals - always show
    cards.push({
      id: 'goals',
      icon: Target,
      title: 'Goals',
      subtitle: stats.activeGoals > 0 ? 'Track your progress' : 'Set a new goal',
      value: stats.activeGoals > 0 ? stats.activeGoals : undefined,
      color: 'hsl(200 70% 50%)',
      highlight: false
    });
    
    // Habits - show streak info
    cards.push({
      id: 'habits',
      icon: Flame,
      title: 'Habits',
      subtitle: stats.habitStreak > 0 ? `${stats.habitStreak} day streak!` : 'Build your routine',
      value: stats.habitStreak > 0 ? stats.habitStreak : undefined,
      color: 'hsl(25 90% 55%)',
      highlight: stats.habitStreak >= 7
    });
    
    // Calendar - always useful
    cards.push({
      id: 'calendar',
      icon: Calendar,
      title: 'Calendar',
      subtitle: "What's coming up",
      color: 'hsl(260 70% 55%)',
      highlight: false
    });
    
    // Create Widget - AI widget builder
    cards.push({
      id: 'create-widget',
      icon: Wand2,
      title: 'Create Widget',
      subtitle: 'Build with AI',
      color: 'hsl(280 80% 60%)',
      highlight: false
    });
    
    return cards;
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Greeting */}
      <div className={cn(
        "flex-shrink-0 px-6 pt-6 pb-4",
        isMobile && "px-4 pt-4 pb-3"
      )}>
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
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className={cn(
          "px-6 pb-32 space-y-6",
          isMobile && "px-4 space-y-4"
        )}>
          {/* Quick Stats */}
          <QuickStatsRow 
            tasks={stats.tasksToday}
            goals={stats.activeGoals}
            habits={stats.habitStreak}
          />

          {/* Today's Focus */}
          <TodaysFocusCard 
            task={topPriorityTask}
            onComplete={handleCompleteTask}
          />

          {/* Smart Priority Cards */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Your Dashboard
            </h2>
            {priorityCards.map((card) => (
              <PriorityCard
                key={card.id}
                icon={card.icon}
                title={card.title}
                subtitle={card.subtitle}
                value={card.value}
                color={card.color}
                highlight={card.highlight}
                onClick={() => {
                  if (card.id === 'create-widget') {
                    onCreateWidget?.();
                  } else {
                    onNavigate?.(card.id);
                  }
                }}
              />
            ))}
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
