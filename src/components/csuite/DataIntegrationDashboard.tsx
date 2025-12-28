import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  DollarSign,
  CheckSquare,
  Calendar,
  FileText,
  BookOpen,
  MessageSquare,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { useDataIntegration, CrossDomainInsight } from '@/hooks/useDataIntegration';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DataIntegrationDashboardProps {
  onDomainClick?: (domain: string) => void;
  onInsightClick?: (insight: CrossDomainInsight) => void;
}

export function DataIntegrationDashboard({ onDomainClick, onInsightClick }: DataIntegrationDashboardProps) {
  const {
    summary,
    insights,
    isLoading,
    isSyncing,
    fetchIntegratedSummary,
    generateCrossDomainInsights,
    syncAllDataSources
  } = useDataIntegration();

  useEffect(() => {
    fetchIntegratedSummary();
  }, [fetchIntegratedSummary]);

  useEffect(() => {
    if (summary) {
      generateCrossDomainInsights();
    }
  }, [summary, generateCrossDomainInsights]);

  const getDomainIcon = (domain: string) => {
    switch (domain) {
      case 'tasks': return <CheckSquare className="h-4 w-4" />;
      case 'communications': return <MessageSquare className="h-4 w-4" />;
      case 'financials': return <DollarSign className="h-4 w-4" />;
      case 'events': return <Calendar className="h-4 w-4" />;
      case 'documents': return <FileText className="h-4 w-4" />;
      case 'knowledge': return <BookOpen className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getInsightTypeColor = (type: CrossDomainInsight['type']) => {
    switch (type) {
      case 'opportunity': return 'text-emerald-500 bg-emerald-500/10';
      case 'risk': return 'text-red-500 bg-red-500/10';
      case 'trend': return 'text-blue-500 bg-blue-500/10';
      case 'action_required': return 'text-amber-500 bg-amber-500/10';
    }
  };

  const getInsightIcon = (type: CrossDomainInsight['type']) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'trend': return <Activity className="h-4 w-4" />;
      case 'action_required': return <Zap className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: CrossDomainInsight['priority']) => {
    const colors = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-blue-500/20 text-blue-500',
      high: 'bg-amber-500/20 text-amber-500',
      critical: 'bg-red-500/20 text-red-500'
    };
    return <Badge variant="outline" className={cn("text-xs", colors[priority])}>{priority}</Badge>;
  };

  if (isLoading && !summary) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading integrated data...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Data Integration Hub
            </CardTitle>
            <CardDescription className="mt-1">
              Cross-domain insights and operational health
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={syncAllDataSources}
            disabled={isSyncing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>
      </CardHeader>

      {summary && (
        <>
          {/* Health Score */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Operational Health Score</span>
              <span className={cn(
                "text-lg font-bold",
                summary.healthScore >= 80 ? "text-emerald-500" :
                summary.healthScore >= 60 ? "text-amber-500" : "text-red-500"
              )}>
                {summary.healthScore}/100
              </span>
            </div>
            <Progress 
              value={summary.healthScore} 
              className={cn(
                "h-3",
                summary.healthScore >= 80 ? "[&>div]:bg-emerald-500" :
                summary.healthScore >= 60 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"
              )}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Based on {summary.totalItems} items across all data sources
            </p>
          </div>

          <Separator />

          {/* Domain Summary Grid */}
          <div className="px-6 py-4">
            <h4 className="text-sm font-medium mb-3">Domain Overview</h4>
            <div className="grid grid-cols-3 gap-3">
              {/* Tasks */}
              <div 
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onDomainClick?.('tasks')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium">Tasks</span>
                </div>
                <div className="text-xl font-bold">{summary.byDomain.tasks.total}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{summary.byDomain.tasks.pending} pending</span>
                  {summary.byDomain.tasks.overdue > 0 && (
                    <span className="text-xs text-red-500">{summary.byDomain.tasks.overdue} overdue</span>
                  )}
                </div>
              </div>

              {/* Financials */}
              <div 
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onDomainClick?.('financials')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-medium">Financials</span>
                </div>
                <div className="text-xl font-bold">{summary.byDomain.financials.total}</div>
                <div className="flex items-center gap-1 mt-1">
                  {summary.byDomain.financials.revenue - summary.byDomain.financials.expenses >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    Net: ${(summary.byDomain.financials.revenue - summary.byDomain.financials.expenses).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Events */}
              <div 
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onDomainClick?.('events')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium">Events</span>
                </div>
                <div className="text-xl font-bold">{summary.byDomain.events.total}</div>
                <span className="text-xs text-muted-foreground">{summary.byDomain.events.upcoming} upcoming</span>
              </div>

              {/* Communications */}
              <div 
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onDomainClick?.('communications')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-medium">Comms</span>
                </div>
                <div className="text-xl font-bold">{summary.byDomain.communications.total}</div>
                <span className="text-xs text-muted-foreground">Recent 30 days</span>
              </div>

              {/* Documents */}
              <div 
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onDomainClick?.('documents')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-cyan-500" />
                  <span className="text-xs font-medium">Documents</span>
                </div>
                <div className="text-xl font-bold">{summary.byDomain.documents.total}</div>
                <span className="text-xs text-muted-foreground">{summary.byDomain.documents.enhanced} enhanced</span>
              </div>

              {/* Knowledge */}
              <div 
                className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onDomainClick?.('knowledge')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-medium">Knowledge</span>
                </div>
                <div className="text-xl font-bold">{summary.byDomain.knowledge.total}</div>
                <span className="text-xs text-muted-foreground">{summary.byDomain.knowledge.categories.length} categories</span>
              </div>
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Cross-Domain Insights */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Cross-Domain Insights
          </h4>
          <Badge variant="secondary">{insights.length}</Badge>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 pb-6 space-y-3">
            {insights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50 text-emerald-500" />
                <p className="text-sm">All systems operating normally</p>
                <p className="text-xs mt-1">No actionable insights at this time</p>
              </div>
            ) : (
              insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors cursor-pointer"
                  onClick={() => onInsightClick?.(insight)}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn("p-1.5 rounded", getInsightTypeColor(insight.type))}>
                      {getInsightIcon(insight.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{insight.title}</span>
                        {getPriorityBadge(insight.priority)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {insight.relatedDomains.map(domain => (
                          <Badge key={domain} variant="outline" className="text-xs gap-1">
                            {getDomainIcon(domain)}
                            {domain}
                          </Badge>
                        ))}
                      </div>
                      {insight.suggestedAction && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs flex items-center gap-2">
                          <Zap className="h-3 w-3 text-primary shrink-0" />
                          <span>{insight.suggestedAction}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Last Updated */}
      {summary && (
        <div className="px-6 py-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Last updated {formatDistanceToNow(summary.lastUpdated, { addSuffix: true })}
          </p>
        </div>
      )}
    </Card>
  );
}
