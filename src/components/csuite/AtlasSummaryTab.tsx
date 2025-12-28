import { useState } from 'react';
import { 
  Brain, 
  RefreshCw, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Insight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  domain: string;
}

interface Recommendation {
  action: string;
  rationale: string;
  urgency: 'immediate' | 'soon' | 'planned';
}

interface KeyMetric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
}

interface AtlasSummary {
  summary: string | null;
  insights: Insight[];
  recommendations: Recommendation[];
  keyMetrics: KeyMetric[];
  dataSources: string[];
  generatedAt: string;
  message?: string;
}

interface AtlasSummaryTabProps {
  userId: string | undefined;
}

export function AtlasSummaryTab({ userId }: AtlasSummaryTabProps) {
  const [summary, setSummary] = useState<AtlasSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requirements, setRequirements] = useState('');

  const generateSummary = async () => {
    if (!userId) {
      toast.error('Please sign in to generate a summary');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('atlas-generate-summary', {
        body: { userId, requirements: requirements.trim() || undefined }
      });

      if (error) throw error;

      setSummary(data);
      toast.success('Atlas summary generated');
    } catch (error) {
      console.error('Failed to generate summary:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate summary';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'medium': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      case 'low': return 'text-green-500 border-green-500/30 bg-green-500/10';
      default: return 'text-muted-foreground';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return <AlertTriangle size={10} className="text-red-500" />;
      case 'soon': return <Clock size={10} className="text-yellow-500" />;
      case 'planned': return <CheckCircle2 size={10} className="text-green-500" />;
      default: return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={12} className="text-green-500" />;
      case 'down': return <TrendingDown size={12} className="text-red-500" />;
      case 'stable': return <Minus size={12} className="text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-3">
        {/* Requirements Input */}
        <div className="p-3 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={14} className="text-primary" />
            <span className="text-xs font-mono text-foreground">ATLAS AI SUMMARY</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">
            Enter your requirements to generate a customized summary, or leave blank for a general overview.
          </p>
          <div className="flex gap-2">
            <Input
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="e.g., Focus on Q4 financials and upcoming deadlines..."
              className="text-xs h-8 font-mono"
              disabled={isLoading}
            />
            <Button
              onClick={generateSummary}
              disabled={isLoading || !userId}
              size="sm"
              className="h-8 text-[10px] font-mono gap-1 px-3"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={10} className="animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Sparkles size={10} />
                  GENERATE
                </>
              )}
            </Button>
          </div>
        </div>

        {/* No summary state */}
        {!summary && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Brain size={20} className="text-primary" />
            </div>
            <p className="text-xs font-mono text-muted-foreground mb-1">No summary generated yet</p>
            <p className="text-[10px] text-muted-foreground/70">
              Click generate to have Atlas analyze your data
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
              <Brain size={20} className="text-primary animate-bounce" />
            </div>
            <p className="text-xs font-mono text-primary">Atlas is analyzing your data...</p>
          </div>
        )}

        {/* Summary content */}
        {summary && !isLoading && (
          <>
            {/* No data message */}
            {summary.message && !summary.summary && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
                <p className="text-xs text-muted-foreground">{summary.message}</p>
              </div>
            )}

            {/* Executive Summary */}
            {summary.summary && (
              <div className="p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-[10px] font-mono text-muted-foreground">EXECUTIVE SUMMARY</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {summary.summary}
                </p>
                {summary.dataSources.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <span className="text-[9px] text-muted-foreground">Sources:</span>
                    {summary.dataSources.map(source => (
                      <Badge key={source} variant="secondary" className="text-[8px] font-mono px-1 py-0">
                        {source}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Key Metrics */}
            {summary.keyMetrics?.length > 0 && (
              <div className="p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={12} className="text-primary" />
                  <span className="text-[10px] font-mono text-muted-foreground">KEY METRICS</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {summary.keyMetrics.map((metric, i) => (
                    <div key={i} className="p-2 rounded bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] text-muted-foreground font-mono">{metric.label}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <span className="text-sm font-mono text-foreground">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {summary.insights?.length > 0 && (
              <div className="p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={12} className="text-primary" />
                  <span className="text-[10px] font-mono text-muted-foreground">INSIGHTS</span>
                </div>
                <div className="space-y-2">
                  {summary.insights.map((insight, i) => (
                    <div key={i} className="p-2 rounded bg-muted/30 border border-border">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={`text-[8px] font-mono px-1 py-0 ${getPriorityColor(insight.priority)}`}
                        >
                          {insight.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-[8px] font-mono px-1 py-0">
                          {insight.domain}
                        </Badge>
                      </div>
                      <p className="text-[10px] font-medium text-foreground mb-0.5">{insight.title}</p>
                      <p className="text-[9px] text-muted-foreground">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {summary.recommendations?.length > 0 && (
              <div className="p-3 rounded-lg bg-background border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={12} className="text-primary" />
                  <span className="text-[10px] font-mono text-muted-foreground">RECOMMENDATIONS</span>
                </div>
                <div className="space-y-2">
                  {summary.recommendations.map((rec, i) => (
                    <div key={i} className="p-2 rounded bg-muted/30 border border-border">
                      <div className="flex items-center gap-1.5 mb-1">
                        {getUrgencyIcon(rec.urgency)}
                        <span className="text-[9px] font-mono text-muted-foreground capitalize">
                          {rec.urgency}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-foreground mb-0.5">{rec.action}</p>
                      <p className="text-[9px] text-muted-foreground">{rec.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated timestamp */}
            {summary.generatedAt && (
              <p className="text-[9px] text-muted-foreground/60 text-center font-mono">
                Generated {new Date(summary.generatedAt).toLocaleString()}
              </p>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
