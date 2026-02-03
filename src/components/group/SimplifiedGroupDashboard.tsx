// Simplified Group Dashboard - Mobile-first, minimal cognitive load
// Best practices: Large touch targets, clear hierarchy, essential info only

import { useMemo } from 'react';
import { 
  Users,
  MessageSquare,
  Calendar,
  CheckSquare,
  FileText,
  Sun,
  Moon,
  Sunrise,
  Maximize2,
  Activity,
  Bell
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SimplifiedGroupDashboardProps {
  userId: string | undefined;
  groupId?: string;
  groupName?: string;
  memberCount?: number;
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
  icon: typeof Users; 
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

// Activity Card
function ActivityCard({ 
  title, 
  description,
  time,
  icon: Icon
}: { 
  title: string;
  description: string;
  time: string;
  icon: typeof Activity;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
    </div>
  );
}

export function SimplifiedGroupDashboard({ 
  userId,
  groupId,
  groupName = 'Group',
  memberCount = 0,
  onExpandDashboard,
  onNavigate
}: SimplifiedGroupDashboardProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.email?.split('@')[0] || 'there';

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className={cn("flex-shrink-0 px-5 pt-5 pb-3", isMobile && "px-4 pt-4")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30"
            )}>
              <Users size={22} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {groupName}
              </h1>
              <p className="text-xs text-muted-foreground">
                {memberCount} members • {format(new Date(), 'EEE, MMM d')}
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

          {/* Group Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="bg-card/50">
              <CardContent className="p-3 text-center">
                <Users size={18} className="mx-auto mb-1 text-blue-500" />
                <p className="text-lg font-bold">{memberCount}</p>
                <p className="text-[10px] text-muted-foreground">Members</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-3 text-center">
                <CheckSquare size={18} className="mx-auto mb-1 text-green-500" />
                <p className="text-lg font-bold">0</p>
                <p className="text-[10px] text-muted-foreground">Tasks</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-3 text-center">
                <Calendar size={18} className="mx-auto mb-1 text-purple-500" />
                <p className="text-lg font-bold">0</p>
                <p className="text-[10px] text-muted-foreground">Events</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Shortcuts */}
          <div className="overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Access</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollPaddingRight: '16px' }}>
              <ShortcutButton
                icon={MessageSquare}
                label="Chat"
                color="hsl(200 70% 50%)"
                onClick={() => onNavigate?.('chat')}
              />
              <ShortcutButton
                icon={CheckSquare}
                label="Tasks"
                color="hsl(150 70% 45%)"
                onClick={() => onNavigate?.('tasks')}
              />
              <ShortcutButton
                icon={Calendar}
                label="Events"
                color="hsl(280 60% 55%)"
                onClick={() => onNavigate?.('events')}
              />
              <ShortcutButton
                icon={FileText}
                label="Files"
                color="hsl(45 80% 50%)"
                onClick={() => onNavigate?.('files')}
              />
              <ShortcutButton
                icon={Users}
                label="Members"
                color="hsl(220 70% 55%)"
                onClick={() => onNavigate?.('members')}
              />
              {/* Spacer to ensure last item is fully visible */}
              <div className="flex-shrink-0 w-1" aria-hidden="true" />
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={12} />
                Recent Activity
              </span>
            </div>
            
            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <CardContent className="p-5 text-center">
                <Activity size={32} className="text-blue-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Welcome to {groupName}!</h3>
                <p className="text-sm text-muted-foreground">
                  Start collaborating with your team
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}

export default SimplifiedGroupDashboard;
