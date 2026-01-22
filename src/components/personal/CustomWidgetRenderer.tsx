import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, 
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
  Image as ImageIcon,
  ChevronRight,
  Check,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';

interface CustomWidgetRendererProps {
  widget: CustomWidget;
  onEdit?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

interface AIInsight {
  summary: string;
  items?: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    action?: string;
    completed?: boolean;
  }>;
  metrics?: {
    primary: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' };
    secondary?: { label: string; value: string | number };
  };
  suggestions?: string[];
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
  blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  green: 'text-green-500 bg-green-500/10 border-green-500/20',
  purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  pink: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
  yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  red: 'text-red-500 bg-red-500/10 border-red-500/20',
  orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
};

const ICON_COLOR_MAP: Record<string, string> = {
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
  const { items: tasks, goals, habits, createItem, updateItem } = usePersonalHub();
  const { accounts, transactions } = useBanking();
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const colorClass = widget.style.color 
    ? COLOR_MAP[widget.style.color] || COLOR_MAP.purple
    : COLOR_MAP.purple;

  const iconColorClass = widget.style.color 
    ? ICON_COLOR_MAP[widget.style.color] || ICON_COLOR_MAP.purple
    : ICON_COLOR_MAP.purple;

  const primaryDataSource = widget.data_sources[0];
  const DataIcon = primaryDataSource ? DATA_SOURCE_ICONS[primaryDataSource] : Brain;

  // Aggregate data based on data sources
  const aggregatedData = useMemo(() => {
    const data: Record<string, any> = {};

    if (widget.data_sources.includes('tasks')) {
      const activeTasks = tasks.filter(t => t.status === 'active');
      const highPriority = activeTasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
      data.tasks = {
        items: activeTasks.slice(0, 10),
        total: tasks.length,
        active: activeTasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        highPriority: highPriority.length,
        highPriorityItems: highPriority.slice(0, 5),
      };
    }

    if (widget.data_sources.includes('goals')) {
      const activeGoals = goals.filter(g => g.status === 'active');
      data.goals = {
        items: activeGoals.slice(0, 5),
        total: goals.length,
        active: activeGoals.length,
        avgProgress: activeGoals.length > 0 
          ? Math.round(activeGoals.reduce((sum, g) => sum + (g.target_value ? (g.current_value / g.target_value) * 100 : 0), 0) / activeGoals.length)
          : 0,
      };
    }

    if (widget.data_sources.includes('habits')) {
      const today = new Date().toISOString().split('T')[0];
      const completedToday = habits.filter(h => h.last_completed_at?.split('T')[0] === today);
      data.habits = {
        items: habits.slice(0, 5),
        total: habits.length,
        completedToday: completedToday.length,
        longestStreak: Math.max(...habits.map(h => h.current_streak || 0), 0),
      };
    }

    if (widget.data_sources.includes('finance')) {
      const recentTransactions = transactions.slice(0, 10);
      const spending = recentTransactions.filter(t => t.amount < 0);
      data.finance = {
        totalBalance: accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0),
        accounts: accounts.slice(0, 3),
        recentTransactions,
        totalSpending: spending.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        transactionCount: spending.length,
      };
    }

    if (widget.data_sources.includes('email')) {
      // Mock email data for demonstration
      data.email = {
        unread: 12,
        urgent: 3,
        items: [
          { id: '1', from: 'Team Lead', subject: 'Q4 Review Meeting', urgent: true },
          { id: '2', from: 'HR', subject: 'Benefits Enrollment Deadline', urgent: true },
          { id: '3', from: 'Client', subject: 'Project Update Request', urgent: false },
        ]
      };
    }

    return data;
  }, [widget.data_sources, tasks, goals, habits, accounts, transactions]);

  // Fetch AI analysis based on widget configuration
  const fetchAIAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build a context-aware prompt based on widget purpose
      const capabilities = widget.ai_capabilities.capabilities || [];
      const widgetPurpose = widget.generation_prompt || widget.description || widget.name;
      
      const systemPrompt = `You are an AI widget assistant. Your purpose: "${widgetPurpose}".
      
Your capabilities include: ${capabilities.join(', ')}.

Analyze the provided data and return a JSON response with this exact structure:
{
  "summary": "A brief 1-2 sentence insight or action recommendation",
  "items": [
    {
      "id": "unique-id",
      "title": "Actionable item or insight",
      "priority": "high|medium|low",
      "action": "Optional quick action label"
    }
  ],
  "metrics": {
    "primary": { "label": "Main metric label", "value": "value", "trend": "up|down|neutral" },
    "secondary": { "label": "Secondary label", "value": "value" }
  },
  "suggestions": ["Quick suggestion 1", "Quick suggestion 2"]
}

Focus on being actionable and specific. Provide real insights based on the data.`;

      const { data, error: funcError } = await supabase.functions.invoke('atlas-orchestrator', {
        body: {
          action: 'chat',
          message: `Analyze this data for my "${widget.name}" widget:\n\n${JSON.stringify(aggregatedData, null, 2)}`,
          context: {
            systemPrompt,
            widgetName: widget.name,
            widgetType: widget.widget_type,
            capabilities: widget.ai_capabilities.capabilities,
            responseFormat: 'json'
          }
        }
      });

      if (funcError) throw funcError;

      // Parse the AI response
      let parsed: AIInsight;
      try {
        // Try to extract JSON from the response
        const responseText = data?.response || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to simple text response
          parsed = {
            summary: responseText || 'No insights available yet.',
            items: [],
            suggestions: []
          };
        }
      } catch {
        parsed = {
          summary: data?.response || 'Widget is ready. Add more data for insights.',
          items: [],
          suggestions: []
        };
      }

      setAiInsight(parsed);
    } catch (err) {
      console.error('Widget AI error:', err);
      setError('Failed to load insights');
      // Provide fallback content
      setAiInsight({
        summary: 'Connect your data sources to see AI-powered insights.',
        items: [],
        suggestions: ['Add more tasks', 'Connect your email', 'Set up goals']
      });
    } finally {
      setIsLoading(false);
    }
  }, [widget, aggregatedData]);

  // Initial fetch
  useEffect(() => {
    if (widget.ai_capabilities.enabled) {
      fetchAIAnalysis();
    } else {
      setIsLoading(false);
    }
  }, [widget.id]);

  // Handle item action
  const handleItemAction = async (itemId: string, action?: string) => {
    setCompletedItems(prev => new Set(prev).add(itemId));
    
    // If it's a real task, mark it as complete
    const task = tasks.find(t => t.id === itemId);
    if (task) {
      await updateItem(itemId, { status: 'completed' });
      toast.success('Task completed!');
    } else {
      toast.success(action || 'Action completed!');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden border", colorClass)}>
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", iconColorClass)}>
              <DataIcon size={16} />
            </div>
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "group relative overflow-hidden border transition-all hover:shadow-lg",
      colorClass
    )}>
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={cn("p-2 rounded-lg shrink-0", iconColorClass)}>
              <DataIcon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold truncate">{widget.name}</CardTitle>
              {!compact && widget.description && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {widget.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={fetchAIAnalysis}
              disabled={isLoading}
            >
              <RefreshCw size={12} className={cn(isLoading && "animate-spin")} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border z-50">
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

        {/* Type badge */}
        {widget.ai_capabilities.enabled && (
          <Badge className="text-[8px] bg-purple-500/20 text-purple-500 mt-2 w-fit">
            <Brain size={8} className="mr-1" />
            AI Powered
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="px-3 pb-3">
        {error ? (
          <div className="flex items-center gap-2 text-destructive text-xs py-2">
            <AlertCircle size={14} />
            {error}
          </div>
        ) : aiInsight ? (
          <div className="space-y-3">
            {/* Metrics */}
            {aiInsight.metrics?.primary && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                <div>
                  <p className="text-[10px] text-muted-foreground">{aiInsight.metrics.primary.label}</p>
                  <p className="text-xl font-bold">{aiInsight.metrics.primary.value}</p>
                </div>
                {aiInsight.metrics.primary.trend && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    aiInsight.metrics.primary.trend === 'up' && "text-green-500",
                    aiInsight.metrics.primary.trend === 'down' && "text-red-500"
                  )}>
                    {aiInsight.metrics.primary.trend === 'up' ? <TrendingUp size={14} /> : 
                     aiInsight.metrics.primary.trend === 'down' ? <TrendingDown size={14} /> : null}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <p className="text-xs text-foreground leading-relaxed">
              {aiInsight.summary}
            </p>

            {/* Action Items */}
            {aiInsight.items && aiInsight.items.length > 0 && (
              <ScrollArea className="max-h-32">
                <div className="space-y-1.5">
                  {aiInsight.items.slice(0, 5).map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-all",
                        completedItems.has(item.id) 
                          ? "bg-muted/50 border-muted opacity-60"
                          : "bg-background/50 border-border/50 hover:border-primary/30"
                      )}
                    >
                      <button
                        onClick={() => handleItemAction(item.id, item.action)}
                        disabled={completedItems.has(item.id)}
                        className={cn(
                          "shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          completedItems.has(item.id)
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/30 hover:border-primary"
                        )}
                      >
                        {completedItems.has(item.id) && <Check size={10} className="text-primary-foreground" />}
                      </button>
                      <span className={cn(
                        "text-[11px] flex-1 truncate",
                        completedItems.has(item.id) && "line-through text-muted-foreground"
                      )}>
                        {item.title}
                      </span>
                      {item.priority === 'high' && !completedItems.has(item.id) && (
                        <Badge variant="destructive" className="text-[8px] px-1 py-0">
                          Urgent
                        </Badge>
                      )}
                      {item.action && !completedItems.has(item.id) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-5 px-2 text-[9px]"
                          onClick={() => handleItemAction(item.id, item.action)}
                        >
                          {item.action}
                          <ChevronRight size={10} className="ml-1" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Quick Suggestions */}
            {aiInsight.suggestions && aiInsight.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {aiInsight.suggestions.slice(0, 3).map((suggestion, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => toast.info(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <Brain size={20} className="mx-auto mb-2 opacity-50" />
            No insights yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}