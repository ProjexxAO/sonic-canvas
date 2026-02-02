// Simplified Enterprise Dashboard - Mobile-first, minimal cognitive load
// Best practices: Large touch targets, clear hierarchy, essential info only

import { useMemo } from 'react';
import { 
  Mail, 
  FileText, 
  Calendar, 
  DollarSign,
  Sun,
  Moon,
  Sunrise,
  Users,
  TrendingUp,
  BarChart3,
  Maximize2,
  Plus,
  LayoutGrid,
  CheckSquare,
  BookOpen
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCSuiteData } from '@/hooks/useCSuiteData';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SimplifiedEnterpriseDashboardProps {
  userId: string | undefined;
  onExpandDashboard?: () => void;
  onNavigate?: (view: string) => void;
}

// Get time-based greeting
function getGreeting(): { text: string; icon: typeof Sun; period: 'morning' | 'afternoon' | 'evening' } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise, period: 'morning' };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun, period: 'afternoon' };
  return { text: 'Good evening', icon: Moon, period: 'evening' };
}

// Compact Shortcut Button
function ShortcutButton({ 
  icon: Icon, 
  label, 
  badge,
  color,
  onClick 
}: { 
  icon: typeof Mail; 
  label: string; 
  badge?: number;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center min-w-[72px] p-3 rounded-xl border border-border bg-card hover:bg-muted/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-95 relative"
    >
      <div className="relative">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center mb-1"
          style={{ backgroundColor: color ? `${color}20` : 'hsl(var(--primary) / 0.1)' }}
        >
          <Icon size={18} style={{ color: color || 'hsl(var(--primary))' }} />
        </div>
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

// Key Metric Card
function MetricCard({ 
  label, 
  value, 
  icon: Icon,
  trend,
  color
}: { 
  label: string;
  value: string | number;
  icon: typeof TrendingUp;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}) {
  return (
    <Card className="bg-gradient-to-br from-card to-muted/30 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color ? `${color}20` : 'hsl(var(--primary) / 0.1)' }}
          >
            <Icon size={16} style={{ color: color || 'hsl(var(--primary))' }} />
          </div>
          {trend && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px]",
                trend === 'up' && "text-green-500 border-green-500/30",
                trend === 'down' && "text-red-500 border-red-500/30"
              )}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </Badge>
          )}
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export function SimplifiedEnterpriseDashboard({ 
  userId, 
  onExpandDashboard,
  onNavigate
}: SimplifiedEnterpriseDashboardProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { stats, isLoading } = useCSuiteData(userId);

  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.email?.split('@')[0] || 'Executive';

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
                {format(new Date(), 'EEE, MMM d')} • Enterprise Hub
              </p>
            </div>
          </div>
          
          {/* Expand button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onExpandDashboard}
            className="h-9 px-3 rounded-xl gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50"
          >
            <Maximize2 size={16} className="text-primary" />
            <span className="text-xs font-medium text-primary">Expand</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className={cn("px-5 pb-28 space-y-5", isMobile && "px-4 space-y-4")}>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Communications"
              value={stats.communications}
              icon={Mail}
              color="hsl(200 70% 50%)"
            />
            <MetricCard
              label="Documents"
              value={stats.documents}
              icon={FileText}
              color="hsl(280 70% 50%)"
            />
            <MetricCard
              label="Events"
              value={stats.events}
              icon={Calendar}
              color="hsl(150 70% 45%)"
            />
            <MetricCard
              label="Tasks"
              value={stats.tasks}
              icon={CheckSquare}
              color="hsl(350 70% 50%)"
            />
          </div>

          {/* Domain Shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domains</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <ShortcutButton
                icon={Mail}
                label="Comms"
                badge={stats.communications}
                color="hsl(200 70% 50%)"
                onClick={() => onNavigate?.('communications')}
              />
              <ShortcutButton
                icon={FileText}
                label="Docs"
                badge={stats.documents}
                color="hsl(280 70% 50%)"
                onClick={() => onNavigate?.('documents')}
              />
              <ShortcutButton
                icon={Calendar}
                label="Events"
                badge={stats.events}
                color="hsl(150 70% 45%)"
                onClick={() => onNavigate?.('events')}
              />
              <ShortcutButton
                icon={DollarSign}
                label="Finance"
                badge={stats.financials}
                color="hsl(45 80% 50%)"
                onClick={() => onNavigate?.('financials')}
              />
              <ShortcutButton
                icon={CheckSquare}
                label="Tasks"
                badge={stats.tasks}
                color="hsl(350 70% 50%)"
                onClick={() => onNavigate?.('tasks')}
              />
              <ShortcutButton
                icon={BookOpen}
                label="Knowledge"
                badge={stats.knowledge}
                color="hsl(220 70% 55%)"
                onClick={() => onNavigate?.('knowledge')}
              />
            </div>
          </div>

          {/* Quick Summary */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BarChart3 size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Enterprise Overview</h3>
                  <p className="text-xs text-muted-foreground">Total data items across all domains</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-primary">
                {Object.values(stats).reduce((a, b) => a + b, 0)}
              </div>
              <p className="text-sm text-muted-foreground">items in your knowledge base</p>
            </CardContent>
          </Card>

        </div>
      </ScrollArea>
    </div>
  );
}

export default SimplifiedEnterpriseDashboard;
