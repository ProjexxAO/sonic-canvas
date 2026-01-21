import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Mail, 
  Calendar, 
  Cloud, 
  TrendingUp, 
  BarChart3, 
  Flame, 
  Target,
  Plus,
  Send,
  CalendarPlus,
  Upload,
  Activity,
  CloudSun,
  CheckSquare,
  FileText,
  GripVertical,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Briefcase,
  Users,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DashboardWidget as DashboardWidgetType, WidgetType } from '@/hooks/usePersonalDashboard';
import { useTheme } from 'next-themes';
import { useCrossHubAccess } from '@/hooks/useCrossHubAccess';

const WIDGET_ICONS: Record<WidgetType, typeof CreditCard> = {
  'bank-balance': CreditCard,
  'email-inbox': Mail,
  'calendar-upcoming': Calendar,
  'cloud-files': Cloud,
  'spending-trends': TrendingUp,
  'productivity-stats': BarChart3,
  'habit-streaks': Flame,
  'goal-progress': Target,
  'quick-add-task': Plus,
  'quick-email': Send,
  'quick-event': CalendarPlus,
  'quick-upload': Upload,
  'recent-activity': Activity,
  'weather': CloudSun,
  'tasks-today': CheckSquare,
  'notes-recent': FileText,
  'hub-access': ExternalLink,
};

const WIDGET_COLORS: Record<WidgetType, string> = {
  'bank-balance': 'emerald',
  'email-inbox': 'blue',
  'calendar-upcoming': 'purple',
  'cloud-files': 'amber',
  'spending-trends': 'emerald',
  'productivity-stats': 'cyan',
  'habit-streaks': 'orange',
  'goal-progress': 'emerald',
  'quick-add-task': 'primary',
  'quick-email': 'blue',
  'quick-event': 'purple',
  'quick-upload': 'amber',
  'recent-activity': 'slate',
  'weather': 'sky',
  'tasks-today': 'primary',
  'notes-recent': 'purple',
  'hub-access': 'primary',
};

interface DashboardWidgetProps {
  widget: DashboardWidgetType;
  onRemove: () => void;
  onResize: (size: 'small' | 'medium' | 'large') => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

// Hub Access Widget Content
function HubAccessContent() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { grantedToMe } = useCrossHubAccess();
  
  const hubInvitations = grantedToMe.filter(g => g.sourceHubType !== 'personal');

  if (hubInvitations.length === 0) {
    return (
      <div className="text-center py-4">
        <ExternalLink className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No hub invitations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hubInvitations.slice(0, 3).map(grant => {
        const isGroup = grant.sourceHubType === 'group';
        const Icon = isGroup ? Users : Briefcase;
        const route = isGroup ? '/group' : '/atlas';
        
        return (
          <div
            key={grant.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
              theme === 'dark' ? "hover:bg-muted/30" : "hover:bg-muted/40"
            )}
            onClick={() => navigate(route)}
          >
            <div className={cn(
              "p-1.5 rounded-lg",
              isGroup ? "bg-emerald-500/10" : "bg-purple-500/10"
            )}>
              <Icon className={cn(
                "h-3.5 w-3.5",
                isGroup ? "text-emerald-500" : "text-purple-500"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {grant.sourceHubName || (isGroup ? 'Group Hub' : 'Executive Hub')}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {grant.accessType} access
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        );
      })}
      {hubInvitations.length > 3 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => navigate('/personal')}
        >
          View all {hubInvitations.length} invitations
        </Button>
      )}
    </div>
  );
}

function DashboardWidgetComponent({
  widget,
  onRemove,
  onResize,
  isDragging,
  dragHandleProps
}: DashboardWidgetProps) {
  const { theme } = useTheme();
  const Icon = WIDGET_ICONS[widget.type];
  const color = WIDGET_COLORS[widget.type];

  const getColorClass = (type: 'bg' | 'text') => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-500' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-500' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
      orange: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
      primary: { bg: 'bg-primary/10', text: 'text-primary' },
      slate: { bg: 'bg-slate-500/10', text: 'text-slate-500' },
      sky: { bg: 'bg-sky-500/10', text: 'text-sky-500' },
    };
    return colorMap[color]?.[type] || 'bg-muted/10';
  };

  // Render widget content based on type
  const renderContent = () => {
    switch (widget.type) {
      case 'bank-balance':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Balance</span>
              <Badge variant="outline" className="text-[10px]">3 accounts</Badge>
            </div>
            <p className="text-3xl font-bold">$12,450.00</p>
            <div className="flex gap-2 text-xs">
              <span className="text-emerald-500">+2.4%</span>
              <span className="text-muted-foreground">this month</span>
            </div>
          </div>
        );
      
      case 'email-inbox':
        return (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn(
                "p-2 rounded-lg flex items-start gap-2",
                theme === 'dark' ? "bg-muted/20" : "bg-muted/30"
              )}>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                  {['JD', 'AM', 'SK'][i - 1]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Email subject {i}</p>
                  <p className="text-xs text-muted-foreground truncate">Preview of email content...</p>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'calendar-upcoming':
        return (
          <div className="space-y-2">
            {['Team Standup', 'Client Call', 'Review Meeting'].map((event, i) => (
              <div key={i} className={cn(
                "p-2 rounded-lg flex items-center gap-3",
                theme === 'dark' ? "bg-muted/20" : "bg-muted/30"
              )}>
                <div className={cn("w-1 h-8 rounded-full", i === 0 ? "bg-primary" : "bg-muted-foreground/30")} />
                <div>
                  <p className="text-sm font-medium">{event}</p>
                  <p className="text-xs text-muted-foreground">{10 + i}:00 AM</p>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'tasks-today':
        return (
          <div className="space-y-2">
            {['Complete report', 'Review PRs', 'Update docs'].map((task, i) => (
              <div key={i} className="flex items-center gap-2 p-2">
                <div className={cn(
                  "w-4 h-4 rounded border-2",
                  i === 0 ? "bg-primary border-primary" : "border-muted-foreground/30"
                )} />
                <span className={cn("text-sm", i === 0 && "line-through text-muted-foreground")}>{task}</span>
              </div>
            ))}
          </div>
        );
      
      case 'habit-streaks':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-orange-500">7</p>
              <p className="text-xs text-muted-foreground">day streak</p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <div key={d} className={cn(
                  "w-3 h-8 rounded-sm",
                  d <= 5 ? "bg-orange-500" : "bg-muted/30"
                )} />
              ))}
            </div>
          </div>
        );
      
      case 'goal-progress':
        return (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Savings Goal</span>
                <span className="text-muted-foreground">$8k / $10k</span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-emerald-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Read 20 Books</span>
                <span className="text-muted-foreground">12 / 20</span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-purple-500 rounded-full" />
              </div>
            </div>
          </div>
        );
      
      case 'quick-add-task':
        return (
          <Button variant="outline" className="w-full h-12 gap-2">
            <Plus className="h-4 w-4" />
            Add New Task
          </Button>
        );
      
      case 'recent-activity':
        return (
          <div className="space-y-2">
            {['Task completed', 'Email received', 'File uploaded', 'Goal updated'].map((activity, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span>{activity}</span>
                <span className="text-xs text-muted-foreground ml-auto">{i + 1}h ago</span>
              </div>
            ))}
          </div>
        );
      
      case 'hub-access':
        return <HubAccessContent />;
      
      default:
        return (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
            Widget content
          </div>
        );
    }
  };

  return (
    <Card className={cn(
      "border-0 shadow-lg backdrop-blur-sm transition-all group relative",
      theme === 'dark' ? "bg-card/40" : "bg-white/80",
      isDragging && "opacity-50 scale-105",
      widget.size === 'small' && "min-h-[120px]",
      widget.size === 'medium' && "min-h-[180px]",
      widget.size === 'large' && "min-h-[240px]"
    )}>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className={cn("p-1.5 rounded-lg", getColorClass('bg'))}>
            <Icon className={cn("h-4 w-4", getColorClass('text'))} />
          </div>
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onResize(widget.size === 'small' ? 'medium' : widget.size === 'medium' ? 'large' : 'small')}
          >
            {widget.size === 'large' ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

export const DashboardWidgetMemo = memo(DashboardWidgetComponent);
export { DashboardWidgetComponent as DashboardWidget };
