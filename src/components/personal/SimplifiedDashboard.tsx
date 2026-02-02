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
  Settings,
  Plus,
  CheckSquare,
  LayoutGrid
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePersonalHub } from '@/hooks/usePersonalHub';
import { useCustomWidgets } from '@/hooks/useCustomWidgets';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { format, isToday, parseISO } from 'date-fns';
import { CustomWidgetRenderer } from './CustomWidgetRenderer';

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

// Compact Shortcut Button - horizontal scrollable style matching reference
function ShortcutButton({ 
  icon: Icon, 
  label, 
  badge,
  onClick 
}: { 
  icon: typeof Mail; 
  label: string; 
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center min-w-[72px] p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-95 relative"
    >
      <div className="relative">
        <Icon size={22} className="text-muted-foreground mb-1" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[60px]">{label}</span>
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
  
  // Fetch custom widgets created by the user
  const { widgets, isLoading: widgetsLoading, deleteWidget } = useCustomWidgets();

  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.email?.split('@')[0] || 'there';


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

          {/* Today's Focus */}
          <TodaysFocus 
            task={topPriorityTask}
            onComplete={handleCompleteTask}
          />

          {/* My Shortcuts - Priority: Calendar, Email, Photos, Finance */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Shortcuts</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <ShortcutButton
                icon={Calendar}
                label="Calendar"
                onClick={() => onNavigate?.('calendar')}
              />
              <ShortcutButton
                icon={Mail}
                label="Email"
                badge={3}
                onClick={() => onNavigate?.('email')}
              />
              <ShortcutButton
                icon={Image}
                label="Photos"
                onClick={() => onNavigate?.('photos')}
              />
              <ShortcutButton
                icon={Wallet}
                label="Finance"
                onClick={() => onNavigate?.('finance')}
              />
            </div>
          </div>

          {/* Custom Widgets Section */}
          {widgets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutGrid size={12} />
                  My Widgets
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {widgets.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {widgets.map((widget) => (
                  <CustomWidgetRenderer
                    key={widget.id}
                    widget={widget}
                    compact
                    onDelete={() => deleteWidget(widget.id)}
                  />
                ))}
              </div>
            </div>
          )}

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
