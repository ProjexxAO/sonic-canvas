import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Bot, 
  Zap, 
  Sparkles,
  RefreshCw,
  MoreHorizontal,
  Loader2,
  Brain,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Target,
  Flame,
  DollarSign,
  Calendar,
  Mail,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CustomWidget, DataSource } from '@/hooks/useCustomWidgets';
import { usePersonalHub } from '@/hooks/usePersonalHub';
import { useBanking } from '@/hooks/useBanking';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CustomWidgetRendererProps {
  widget: CustomWidget;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

const DATA_SOURCE_ICONS: Record<DataSource, React.ElementType> = {
  tasks: CheckSquare,
  goals: Target,
  habits: Flame,
  finance: DollarSign,
  calendar: Calendar,
  email: Mail,
  documents: FileText,
  photos: ImageIcon,
  'custom-api': Zap,
};

const WIDGET_TYPE_ICONS = {
  'data-display': BarChart3,
  'ai-assistant': Bot,
  'automation': Zap,
  'hybrid': Sparkles,
};

const COLOR_MAP: Record<string, string> = {
  blue: 'text-blue-500 bg-blue-500/20',
  green: 'text-green-500 bg-green-500/20',
  purple: 'text-purple-500 bg-purple-500/20',
  pink: 'text-pink-500 bg-pink-500/20',
  yellow: 'text-yellow-500 bg-yellow-500/20',
  red: 'text-red-500 bg-red-500/20',
  orange: 'text-orange-500 bg-orange-500/20',
  cyan: 'text-cyan-500 bg-cyan-500/20',
};

export function CustomWidgetRenderer({ 
  widget, 
  onEdit, 
  onDelete,
  compact = false 
}: CustomWidgetRendererProps) {
  const { items: tasks, goals, habits } = usePersonalHub();
  const { accounts, transactions } = useBanking();
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const colorClass = widget.style.color 
    ? COLOR_MAP[widget.style.color] || COLOR_MAP.blue
    : COLOR_MAP.blue;

  const Icon = WIDGET_TYPE_ICONS[widget.widget_type] || Sparkles;
  const primaryDataSource = widget.data_sources[0];
  const DataIcon = primaryDataSource ? DATA_SOURCE_ICONS[primaryDataSource] : BarChart3;

  // Aggregate data based on data sources
  const aggregatedData = useMemo(() => {
    const data: Record<string, any> = {};

    if (widget.data_sources.includes('tasks')) {
      data.tasks = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'active').length,
        highPriority: tasks.filter(t => t.priority === 'high').length,
      };
    }

    if (widget.data_sources.includes('goals')) {
      const goalsWithProgress = goals.map(g => ({
        ...g,
        progress: g.target_value ? Math.min((g.current_value / g.target_value) * 100, 100) : 0
      }));
      data.goals = {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        completed: goals.filter(g => g.status === 'completed').length,
        avgProgress: goalsWithProgress.length > 0 
          ? Math.round(goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) / goalsWithProgress.length)
          : 0,
      };
    }

    if (widget.data_sources.includes('habits')) {
      const today = new Date().toISOString().split('T')[0];
      data.habits = {
        total: habits.length,
        activeToday: habits.filter(h => {
          if (!h.last_completed_at) return false;
          return h.last_completed_at.split('T')[0] === today;
        }).length,
        longestStreak: Math.max(...habits.map(h => h.current_streak || 0), 0),
      };
    }

    if (widget.data_sources.includes('finance')) {
      data.finance = {
        totalBalance: accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0),
        accountCount: accounts.length,
        recentTransactions: transactions.slice(0, 5),
        spending: transactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      };
    }

    return data;
  }, [widget.data_sources, tasks, goals, habits, accounts, transactions]);

  // Fetch AI insights if enabled
  const fetchAIInsights = async () => {
    if (!widget.ai_capabilities.enabled) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
        body: {
          action: 'chat',
          message: `Analyze this data and provide a brief insight (2-3 sentences max): ${JSON.stringify(aggregatedData)}`,
          context: {
            widgetName: widget.name,
            capabilities: widget.ai_capabilities.capabilities,
          }
        }
      });

      if (!error && data?.response) {
        setAiResponse(data.response);
      }
    } catch (err) {
      console.error('AI insight error:', err);
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date());
    }
  };

  // Auto-refresh if configured
  useEffect(() => {
    if (widget.ai_capabilities.enabled && widget.config.refreshInterval && widget.config.refreshInterval > 0) {
      const interval = setInterval(fetchAIInsights, widget.config.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [widget.ai_capabilities.enabled, widget.config.refreshInterval]);

  // Initial AI fetch
  useEffect(() => {
    if (widget.ai_capabilities.enabled && !aiResponse) {
      fetchAIInsights();
    }
  }, [widget.ai_capabilities.enabled]);

  const renderMetricContent = () => {
    const primarySource = widget.data_sources[0];
    const sourceData = aggregatedData[primarySource];
    
    if (!sourceData) {
      return (
        <div className="text-center py-4 text-muted-foreground text-xs">
          No data available
        </div>
      );
    }

    switch (primarySource) {
      case 'tasks':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{sourceData.completed}/{sourceData.total}</span>
              <Badge variant="secondary" className="text-[9px]">
                {Math.round((sourceData.completed / sourceData.total) * 100) || 0}%
              </Badge>
            </div>
            <Progress value={(sourceData.completed / sourceData.total) * 100 || 0} className="h-1.5" />
            {sourceData.highPriority > 0 && (
              <p className="text-[10px] text-red-500">{sourceData.highPriority} high priority</p>
            )}
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{sourceData.avgProgress}%</span>
              <div className="flex items-center gap-1 text-[10px] text-green-500">
                <TrendingUp size={10} />
                Progress
              </div>
            </div>
            <Progress value={sourceData.avgProgress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              {sourceData.active} active goals
            </p>
          </div>
        );

      case 'habits':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{sourceData.activeToday}/{sourceData.total}</span>
              <Badge className="text-[9px] bg-orange-500/20 text-orange-500">
                <Flame size={8} className="mr-1" />
                {sourceData.longestStreak}d streak
              </Badge>
            </div>
            <Progress value={(sourceData.activeToday / sourceData.total) * 100 || 0} className="h-1.5" />
          </div>
        );

      case 'finance':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                ${sourceData.totalBalance.toLocaleString()}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-red-500">
                <TrendingDown size={10} />
                -${sourceData.spending.toLocaleString()}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Across {sourceData.accountCount} accounts
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-muted-foreground text-xs">
            Configure data source
          </div>
        );
    }
  };

  const renderAIContent = () => {
    if (!widget.ai_capabilities.enabled) return null;

    return (
      <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-2">
          <Brain size={12} className="text-primary mt-0.5" />
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={10} className="animate-spin" />
              Analyzing...
            </div>
          ) : aiResponse ? (
            <p className="text-[10px] text-muted-foreground leading-relaxed">{aiResponse}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">AI insights loading...</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn(
      "group relative transition-all hover:shadow-md",
      compact && "border-0 shadow-none"
    )}>
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg", colorClass)}>
              <DataIcon size={14} />
            </div>
            <div>
              <CardTitle className="text-xs font-medium">{widget.name}</CardTitle>
              {widget.description && !compact && (
                <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">
                  {widget.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {widget.ai_capabilities.enabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={fetchAIInsights}
                disabled={isLoading}
              >
                <RefreshCw size={10} className={cn(isLoading && "animate-spin")} />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <MoreHorizontal size={10} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    Edit Widget
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    Remove Widget
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Type badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          {widget.ai_capabilities.enabled && (
            <Badge className="text-[8px] bg-purple-500/20 text-purple-500">
              <Brain size={8} className="mr-1" />
              AI
            </Badge>
          )}
          {widget.agent_chain && widget.agent_chain.length > 0 && (
            <Badge variant="outline" className="text-[8px]">
              {widget.agent_chain.length} agents
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-3 pb-3">
        {widget.config.displayType === 'metric' || !widget.config.displayType ? (
          renderMetricContent()
        ) : widget.config.displayType === 'list' ? (
          <ScrollArea className="h-24">
            <div className="space-y-1">
              {aggregatedData.tasks?.total > 0 && tasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-[10px]">
                  <CheckSquare size={10} className={task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'} />
                  <span className={cn(task.status === 'completed' && 'line-through text-muted-foreground')}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          renderMetricContent()
        )}
        
        {renderAIContent()}
      </CardContent>
    </Card>
  );
}
