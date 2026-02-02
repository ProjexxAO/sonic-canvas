// Fullscreen Detailed Dashboard - Expanded view of SimplifiedDashboard items
// Shows the same content as SimplifiedDashboard but with more details

import { useMemo } from 'react';
import ReactDOM from 'react-dom';
import { 
  X,
  CheckSquare, 
  Calendar,
  Mail,
  Image,
  Wallet,
  LayoutGrid,
  Sun,
  Moon,
  Sunrise,
  Clock,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePersonalHub, PersonalItem } from '@/hooks/usePersonalHub';
import { useCustomWidgets } from '@/hooks/useCustomWidgets';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { CustomWidgetRenderer } from './CustomWidgetRenderer';

interface FullscreenDetailedDashboardProps {
  userId: string | undefined;
  onClose: () => void;
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

// Detailed Task Item
function DetailedTaskItem({ 
  item, 
  onComplete,
  isTopPriority
}: { 
  item: PersonalItem; 
  onComplete: () => void;
  isTopPriority?: boolean;
}) {
  const isOverdue = item.due_date && isPast(parseISO(item.due_date)) && item.status !== 'completed';
  const isDueToday = item.due_date && isToday(parseISO(item.due_date));
  
  return (
    <div className={cn(
      "flex items-start gap-4 p-4 rounded-xl border transition-colors",
      isTopPriority 
        ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
        : item.status === 'completed' 
          ? "bg-muted/30 border-border/50" 
          : isOverdue 
            ? "bg-destructive/5 border-destructive/30"
            : "bg-card border-border hover:bg-muted/50"
    )}>
      <button onClick={onComplete} className="flex-shrink-0 mt-0.5">
        <div className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
          item.status === 'completed' 
            ? "bg-primary border-primary" 
            : "border-muted-foreground hover:border-primary"
        )}>
          {item.status === 'completed' && (
            <CheckSquare size={14} className="text-primary-foreground" />
          )}
        </div>
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn(
              "text-base font-medium",
              item.status === 'completed' && "line-through text-muted-foreground"
            )}>
              {item.title}
            </p>
            {item.content && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.content}
              </p>
            )}
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs flex-shrink-0",
              item.priority === 'urgent' && "border-destructive text-destructive bg-destructive/10",
              item.priority === 'high' && "border-orange-500 text-orange-500 bg-orange-500/10",
              item.priority === 'medium' && "border-yellow-500 text-yellow-500 bg-yellow-500/10",
              item.priority === 'low' && "border-muted-foreground text-muted-foreground"
            )}
          >
            {item.priority}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 mt-2">
          {item.due_date && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className={isOverdue ? "text-destructive" : isDueToday ? "text-primary" : "text-muted-foreground"} />
              <span className={cn(
                "text-xs",
                isOverdue ? "text-destructive font-medium" : isDueToday ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {isOverdue ? 'Overdue: ' : isDueToday ? 'Due today' : ''}{format(parseISO(item.due_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1">
              {item.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Expanded Shortcut Card
function ExpandedShortcutCard({ 
  icon: Icon, 
  label, 
  description,
  badge,
  onClick 
}: { 
  icon: typeof Mail; 
  label: string; 
  description: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors group"
      onClick={onClick}
    >
      <CardContent className="p-5 flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon size={28} className="text-primary" />
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">{label}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </CardContent>
    </Card>
  );
}

export function FullscreenDetailedDashboard({ 
  userId, 
  onClose,
  onNavigate,
  onCreateWidget
}: FullscreenDetailedDashboardProps) {
  const { user } = useAuth();
  const { 
    items, 
    isLoading,
    completeItem
  } = usePersonalHub();
  
  const { widgets: customWidgets, deleteWidget } = useCustomWidgets();

  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.email?.split('@')[0] || 'there';

  // Get high priority tasks (same logic as SimplifiedDashboard)
  const priorityTasks = useMemo(() => {
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
      });
  }, [items]);

  const topPriorityTask = priorityTasks[0] || null;

  if (isLoading) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] bg-background overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
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
            <h1 className="text-xl font-bold text-foreground">
              {greeting.text}, {userName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClose} 
          className="h-10 px-4 rounded-xl gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
        >
          <X size={18} className="text-primary" />
          <span className="text-sm font-medium text-primary">Close</span>
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
          
          {/* Today's Focus - Expanded */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckSquare size={20} className="text-primary" />
              Today's Focus
            </h2>
            
            {topPriorityTask ? (
              <div className="space-y-3">
                <DetailedTaskItem 
                  item={topPriorityTask}
                  onComplete={() => completeItem(topPriorityTask.id)}
                  isTopPriority
                />
                
                {/* Other high priority tasks */}
                {priorityTasks.length > 1 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-3">Other priority tasks</p>
                    <div className="space-y-2">
                      {priorityTasks.slice(1, 4).map(task => (
                        <DetailedTaskItem 
                          key={task.id}
                          item={task}
                          onComplete={() => completeItem(task.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-8 text-center">
                  <CheckSquare size={48} className="text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">All clear!</h3>
                  <p className="text-muted-foreground mt-1">No urgent tasks right now. Great job staying on top of things!</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* My Shortcuts - Expanded */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LayoutGrid size={20} className="text-primary" />
              My Shortcuts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ExpandedShortcutCard
                icon={Calendar}
                label="Calendar"
                description="View and manage your schedule"
                onClick={() => onNavigate?.('calendar')}
              />
              <ExpandedShortcutCard
                icon={Mail}
                label="Email"
                description="Check your inbox and messages"
                badge={3}
                onClick={() => onNavigate?.('email')}
              />
              <ExpandedShortcutCard
                icon={Image}
                label="Photos"
                description="Browse your photo library"
                onClick={() => onNavigate?.('photos')}
              />
              <ExpandedShortcutCard
                icon={Wallet}
                label="Finance"
                description="Track spending and accounts"
                onClick={() => onNavigate?.('finance')}
              />
            </div>
          </section>

          {/* Custom Widgets - Expanded */}
          {customWidgets.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <LayoutGrid size={20} className="text-primary" />
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
            </section>
          )}

          {/* Add Widget */}
          {onCreateWidget && (
            <Button
              variant="outline"
              onClick={onCreateWidget}
              className="w-full h-14 rounded-xl border-dashed text-base"
            >
              <Plus size={20} className="mr-2" />
              Add Widget
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>,
    document.body
  );
}

export default FullscreenDetailedDashboard;
