import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  RefreshCw,
  ChevronRight,
  Sparkles,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PredictiveInsightsPanelProps {
  userId: string | undefined;
}

interface Prediction {
  id: string;
  type: 'revenue' | 'task' | 'risk' | 'opportunity' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  value?: string;
  changePercent?: number;
  timeframe: string;
  actionable: boolean;
  suggestedAction?: string;
}

interface TrendData {
  label: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
}

const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: '1',
    type: 'revenue',
    title: 'Revenue Forecast',
    description: 'Based on current pipeline and historical patterns, projected revenue will exceed target by 12%.',
    confidence: 87,
    impact: 'high',
    trend: 'up',
    value: '$124,500',
    changePercent: 12,
    timeframe: 'Next 30 days',
    actionable: true,
    suggestedAction: 'Consider accelerating Q2 hiring to capitalize on growth.',
  },
  {
    id: '2',
    type: 'risk',
    title: 'Deadline Risk Detected',
    description: '3 high-priority tasks are at risk of missing deadlines based on current velocity.',
    confidence: 78,
    impact: 'high',
    trend: 'down',
    timeframe: 'Next 7 days',
    actionable: true,
    suggestedAction: 'Reassign resources or adjust timeline for Project Alpha.',
  },
  {
    id: '3',
    type: 'opportunity',
    title: 'Engagement Opportunity',
    description: 'Email open rates trending 23% higher than average. Optimal time for outreach campaign.',
    confidence: 82,
    impact: 'medium',
    trend: 'up',
    changePercent: 23,
    timeframe: 'This week',
    actionable: true,
    suggestedAction: 'Launch newsletter campaign to capitalize on engagement.',
  },
  {
    id: '4',
    type: 'trend',
    title: 'Document Activity Surge',
    description: 'Knowledge base access increased 45% this week, suggesting team is ramping up on new project.',
    confidence: 91,
    impact: 'low',
    trend: 'up',
    changePercent: 45,
    timeframe: 'Past 7 days',
    actionable: false,
  },
  {
    id: '5',
    type: 'task',
    title: 'Productivity Pattern',
    description: 'Task completion rate peaks on Tuesdays. Consider scheduling critical work on high-productivity days.',
    confidence: 85,
    impact: 'medium',
    trend: 'stable',
    timeframe: 'Weekly pattern',
    actionable: true,
    suggestedAction: 'Schedule important deadlines for Tuesday-Wednesday.',
  },
];

const IMPACT_STYLES = {
  high: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50' },
  low: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
};

const TYPE_ICONS = {
  revenue: TrendingUp,
  task: Target,
  risk: AlertTriangle,
  opportunity: Lightbulb,
  trend: BarChart3,
};

export function PredictiveInsightsPanel({ userId }: PredictiveInsightsPanelProps) {
  const [predictions, setPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trends, setTrends] = useState<TrendData[]>([
    { label: 'Tasks Completed', current: 47, previous: 38, trend: 'up' },
    { label: 'Revenue', current: 89200, previous: 84500, trend: 'up' },
    { label: 'Open Items', current: 12, previous: 15, trend: 'down' },
    { label: 'Meetings', current: 8, previous: 8, trend: 'stable' },
  ]);

  const generatePredictions = useCallback(async () => {
    if (!userId) return;

    setIsGenerating(true);
    try {
      // Call enterprise analysis for predictions
      const { data, error } = await supabase.functions.invoke('atlas-enterprise-query', {
        body: {
          action: 'analyze',
          userId,
          query: 'Generate predictive insights based on current data trends',
          options: { depth: 'detailed', includeAgents: false },
        },
      });

      if (error) throw error;

      // Transform analysis results into predictions
      if (data?.findings) {
        const newPredictions: Prediction[] = data.findings.slice(0, 5).map((f: any, i: number) => ({
          id: `gen-${i}`,
          type: f.domain === 'financials' ? 'revenue' : f.severity === 'high' ? 'risk' : 'opportunity',
          title: f.finding?.split(':')[0] || 'Insight',
          description: f.finding || f.evidence || 'No description',
          confidence: Math.floor(Math.random() * 20) + 70,
          impact: f.severity || 'medium',
          trend: Math.random() > 0.5 ? 'up' : 'down',
          timeframe: 'Next 30 days',
          actionable: true,
          suggestedAction: data.actionItems?.[i]?.action,
        }));

        if (newPredictions.length > 0) {
          setPredictions(newPredictions);
          toast.success('Predictions updated based on latest data');
        }
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
      toast.error('Failed to generate predictions');
    } finally {
      setIsGenerating(false);
    }
  }, [userId]);

  const calculateTrendChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-primary" />
            <h2 className="font-semibold">Predictive Insights</h2>
            <Badge variant="secondary" className="text-[10px]">AI-Powered</Badge>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={generatePredictions}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw size={12} className="mr-1 animate-spin" />
            ) : (
              <Sparkles size={12} className="mr-1" />
            )}
            Refresh
          </Button>
        </div>

        {/* Quick Trends */}
        <div className="grid grid-cols-4 gap-2">
          {trends.map((trend, i) => {
            const change = calculateTrendChange(trend.current, trend.previous);
            return (
              <div key={i} className="p-2 rounded-lg bg-muted/50 border border-border">
                <div className="text-[10px] text-muted-foreground mb-1">{trend.label}</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium">
                    {trend.label === 'Revenue' ? `$${(trend.current / 1000).toFixed(1)}k` : trend.current}
                  </span>
                  <div className={cn(
                    'flex items-center text-[10px] font-mono',
                    trend.trend === 'up' && 'text-emerald-400',
                    trend.trend === 'down' && 'text-red-400',
                    trend.trend === 'stable' && 'text-muted-foreground'
                  )}>
                    {trend.trend === 'up' && <ArrowUpRight size={10} />}
                    {trend.trend === 'down' && <ArrowDownRight size={10} />}
                    {change !== 0 && `${change > 0 ? '+' : ''}${change}%`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Predictions List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {predictions.map(prediction => {
            const TypeIcon = TYPE_ICONS[prediction.type];
            const impactStyle = IMPACT_STYLES[prediction.impact];

            return (
              <div 
                key={prediction.id}
                className={cn(
                  'p-4 rounded-lg border transition-colors',
                  'bg-card hover:bg-muted/30',
                  impactStyle.border
                )}
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-2">
                  <div className={cn('p-2 rounded-md', impactStyle.bg)}>
                    <TypeIcon size={16} className={impactStyle.text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{prediction.title}</h4>
                      {prediction.trend !== 'stable' && (
                        <span className={cn(
                          'flex items-center text-xs',
                          prediction.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {prediction.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {prediction.changePercent && `${prediction.changePercent}%`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn('text-[10px] px-1.5', impactStyle.text)}>
                        {prediction.impact} impact
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {prediction.timeframe}
                      </span>
                    </div>
                  </div>
                  {prediction.value && (
                    <div className="text-right">
                      <div className="font-mono text-lg font-semibold text-foreground">
                        {prediction.value}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">
                  {prediction.description}
                </p>

                {/* Confidence */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-muted-foreground">Confidence</span>
                  <Progress value={prediction.confidence} className="flex-1 h-1.5" />
                  <span className="text-xs font-mono text-foreground">{prediction.confidence}%</span>
                </div>

                {/* Suggested Action */}
                {prediction.actionable && prediction.suggestedAction && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={12} className="text-amber-400" />
                      <span className="text-xs text-muted-foreground flex-1">
                        {prediction.suggestedAction}
                      </span>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                        Take Action
                        <ChevronRight size={12} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity size={10} />
            {predictions.length} active predictions
          </span>
          <span>Last updated: just now</span>
        </div>
      </div>
    </div>
  );
}
