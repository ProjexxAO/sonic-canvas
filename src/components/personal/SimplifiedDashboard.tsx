// Simplified Dashboard - Mobile-first, minimal cognitive load
// Best practices: Large touch targets, clear hierarchy, essential info only

import { useMemo } from 'react';
import { 
  Mail, 
  Image, 
  Calendar, 
  Sun,
  Moon,
  Sunrise,
  Wallet,
  Flame,
  Settings,
  Plus,
  CheckSquare
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

// Simple Quick Action Button - large touch target, clear purpose
function QuickAction({ 
  icon: Icon, 
  label, 
  value, 
  color, 
  onClick,
  highlight = false
}: { 
  icon: typeof CheckSquare; 
  label: string; 
  value?: string | number;
  color: string;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200",
        "min-h-[100px] focus:outline-none focus:ring-4 focus:ring-primary/20 active:scale-95",
        highlight 
          ? "bg-primary/10 border-primary" 
          : "bg-card border-border hover:border-primary/50"
      )}
    >
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      {value !== undefined && (
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      )}
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </button>
  );
}

// Today's Priority - single focus card
function TodaysFocus({ 
  task, 
  onComplete 
}: { 
  task: { title: string; priority: string } | null;
  onComplete?: () => void;
}) {
  if (!task) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-5 text-center">
          <CheckSquare size={32} className="text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground">All clear!</h3>
          <p className="text-sm text-muted-foreground">No urgent tasks right now</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-5">
        <Badge variant="secondary" className="text-[10px] mb-3">TOP PRIORITY</Badge>
        <h3 className="text-lg font-semibold text-foreground mb-4 line-clamp-2">
          {task.title}
        </h3>
        <Button 
          onClick={onComplete}
          size="lg"
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          <CheckSquare size={20} className="mr-2" />
          Done
        </Button>
      </CardContent>
    </Card>
  );
}

// Stats Row - key metrics at a glance
function StatsRow({ stats }: { 
  stats: { tasksToday: number; activeGoals: number; habitStreak: number } 
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-card border border-border rounded-xl p-3 text-center">
        <span className="text-2xl font-bold text-foreground">{stats.tasksToday}</span>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tasks</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 text-center">
        <span className="text-2xl font-bold text-foreground">{stats.activeGoals}</span>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Goals</p>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <Flame size={16} className="text-orange-500" />
          <span className="text-2xl font-bold text-foreground">{stats.habitStreak}</span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Streak</p>
      </div>
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

  // Calculate stats
  const stats = useMemo(() => {
    const todayTasks = items.filter(i => 
      i.item_type === 'task' && 
      i.status !== 'completed' &&
      i.due_date && 
      isToday(parseISO(i.due_date))
    );
    
    const activeGoals = goals.filter(g => g.status === 'in_progress');
    const currentStreak = habits.reduce((max, h) => Math.max(max, h.current_streak || 0), 0);

    return {
      tasksToday: todayTasks.length,
      activeGoals: activeGoals.length,
      habitStreak: currentStreak,
    };
  }, [items, goals, habits]);

  // Top priority task
  const topPriorityTask = useMemo(() => {
    return items
      .filter(i => 
        i.item_type === 'task' && 
        i.status !== 'completed' &&
        (i.priority === 'urgent' || i.priority === 'high')
      )
      .sort((a, b) => {
        if (a.priority === 'urgent') return -1;
        if (b.priority === 'urgent') return 1;
        return 0;
      })[0] || null;
  }, [items]);

  const handleCompleteTask = async () => {
    if (topPriorityTask) {
      await completeItem(topPriorityTask.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className={cn("flex-shrink-0 px-5 pt-5 pb-3", isMobile && "px-4 pt-4")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center",
              greeting.period === 'morning' && "bg-orange-100 dark:bg-orange-900/30",
              greeting.period === 'afternoon' && "bg-yellow-100 dark:bg-yellow-900/30",
              greeting.period === 'evening' && "bg-indigo-100 dark:bg-indigo-900/30"
            )}>
              <greeting.icon size={22} className={cn(
                greeting.period === 'morning' && "text-orange-500",
                greeting.period === 'afternoon' && "text-yellow-500",
                greeting.period === 'evening' && "text-indigo-400"
              )} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {greeting.text}, {userName}
              </h1>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), 'EEE, MMM d')}
              </p>
            </div>
          </div>
          
          {/* Settings shortcut */}
          <button
            onClick={onOpenFullDashboard}
            className="w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <Settings size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className={cn("px-5 pb-28 space-y-5", isMobile && "px-4 space-y-4")}>
          
          {/* Stats Row */}
          <StatsRow stats={stats} />

          {/* Today's Focus */}
          <TodaysFocus 
            task={topPriorityTask}
            onComplete={handleCompleteTask}
          />

          {/* Quick Actions Grid - Priority: Email, Finance, Photos, Calendar */}
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              icon={Mail}
              label="Email"
              color="hsl(220 70% 50%)"
              onClick={() => onNavigate?.('email')}
            />
            <QuickAction
              icon={Wallet}
              label="Finance"
              color="hsl(150 70% 45%)"
              onClick={() => onNavigate?.('finance')}
            />
            <QuickAction
              icon={Image}
              label="Photos"
              color="hsl(340 70% 55%)"
              onClick={() => onNavigate?.('photos')}
            />
            <QuickAction
              icon={Calendar}
              label="Calendar"
              color="hsl(260 70% 55%)"
              onClick={() => onNavigate?.('calendar')}
            />
          </div>

          {/* Add Widget */}
          {onCreateWidget && (
            <Button
              variant="outline"
              onClick={onCreateWidget}
              className="w-full h-12 rounded-xl border-dashed"
            >
              <Plus size={18} className="mr-2" />
              Add Widget
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default SimplifiedDashboard;
