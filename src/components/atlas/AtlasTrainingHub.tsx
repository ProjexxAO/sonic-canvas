// Atlas Training Hub - Internal visualization of Atlas-controlled agent training
// Users can MONITOR training but cannot directly control it - Atlas manages all assignments
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAgentTraining } from '@/hooks/useAgentTraining';
import { useHyperEvolution } from '@/hooks/useHyperEvolution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  Zap,
  ArrowRightLeft,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  Activity,
  Users,
  Clock,
  BarChart3,
} from 'lucide-react';

export function AtlasTrainingHub() {
  const { user } = useAuth();
  const {
    trainingStats,
    recentFeedback,
    fetchTrainingStats,
    isTraining,
  } = useAgentTraining();

  const {
    isEvolving,
    lastEvolution,
    sessionsCompleted,
    totalAgentsEvolved,
    totalKnowledgeGained,
    recentResults,
    evolutionHistory,
  } = useHyperEvolution();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      fetchTrainingStats().finally(() => setIsLoading(false));
    }
  }, [user?.id, fetchTrainingStats]);

  const isActive = isTraining || isEvolving;

  return (
    <div className="space-y-3 p-1">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
          <span className="text-xs font-mono text-muted-foreground">
            {isActive ? 'Training Active' : 'Idle'}
          </span>
        </div>
        {lastEvolution && (
          <span className="text-[10px] text-muted-foreground">
            Last: {formatTimeAgo(lastEvolution)}
          </span>
        )}
      </div>

      {/* Evolution Progress (if running) */}
      {isActive && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-2 px-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary">Atlas Training Cycle</span>
            </div>
            <Progress value={isEvolving ? 50 : 75} className="h-1" />
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-1.5">
        <MetricMini
          icon={<Users className="h-3 w-3" />}
          value={totalAgentsEvolved.toString()}
          label="Evolved"
        />
        <MetricMini
          icon={<Brain className="h-3 w-3" />}
          value={totalKnowledgeGained.toFixed(0)}
          label="Knowledge"
        />
        <MetricMini
          icon={<Activity className="h-3 w-3" />}
          value={sessionsCompleted.toString()}
          label="Sessions"
        />
      </div>

      {/* Training Stats */}
      {trainingStats && (
        <>
          <Separator className="my-2" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono">Success Rate</span>
              <div className="flex items-center gap-1">
                <span className="font-bold">{(trainingStats.avgSuccessRate * 100).toFixed(1)}%</span>
                {trainingStats.avgSuccessRate > 0.7 && (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                )}
              </div>
            </div>
            <Progress value={trainingStats.avgSuccessRate * 100} className="h-1" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono">Confidence</span>
              <span className="font-bold">{(trainingStats.avgConfidence * 100).toFixed(1)}%</span>
            </div>
            <Progress value={trainingStats.avgConfidence * 100} className="h-1" />
          </div>
        </>
      )}

      {/* Top Performers */}
      {trainingStats?.topPerformers && trainingStats.topPerformers.length > 0 && (
        <>
          <Separator className="my-2" />
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mb-1">
              <Target className="h-3 w-3" />
              TOP SPECIALISTS
            </div>
            {trainingStats.topPerformers.slice(0, 3).map((agent, idx) => (
              <div key={agent.agentId} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{idx + 1}.</span>
                  <span className="truncate max-w-[80px]">{agent.agentName}</span>
                </div>
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                  {(agent.successRate * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent Evolution Results */}
      {recentResults.length > 0 && (
        <>
          <Separator className="my-2" />
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mb-1">
              <Sparkles className="h-3 w-3" />
              RECENT EVOLUTIONS
            </div>
            <ScrollArea className="h-20">
              <div className="space-y-1 pr-2">
                {recentResults.slice(0, 5).map((result, idx) => (
                  <div key={`${result.agentId}-${idx}`} className="flex items-center justify-between text-[10px] py-0.5">
                    <span className="truncate max-w-[90px]">{result.agentName}</span>
                    <div className="flex items-center gap-1">
                      {result.evolutionGain > 0 ? (
                        <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                      ) : (
                        <Activity className="h-2.5 w-2.5 text-muted-foreground" />
                      )}
                      <span className="text-green-600">+{result.evolutionGain.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {/* Knowledge Transfers */}
      {trainingStats && trainingStats.totalKnowledgeTransfers > 0 && (
        <>
          <Separator className="my-2" />
          
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1 text-muted-foreground">
              <ArrowRightLeft className="h-3 w-3" />
              <span className="font-mono">Transfers</span>
            </div>
            <span className="font-bold">{trainingStats.totalKnowledgeTransfers}</span>
          </div>
        </>
      )}

      {/* Feedback Log */}
      {recentFeedback.length > 0 && (
        <>
          <Separator className="my-2" />
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono mb-1">
              <BarChart3 className="h-3 w-3" />
              FEEDBACK ({recentFeedback.length})
            </div>
            <ScrollArea className="h-16">
              <div className="space-y-1 pr-2">
                {recentFeedback.slice(0, 5).map((fb, idx) => (
                  <div key={`${fb.taskId}-${idx}`} className="flex items-center gap-1 text-[10px]">
                    {fb.success ? (
                      <CheckCircle2 className="h-2.5 w-2.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-2.5 w-2.5 text-red-500 flex-shrink-0" />
                    )}
                    <span className="truncate max-w-[70px]">{fb.agentName}</span>
                    <span className="text-muted-foreground">{fb.taskType}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {/* Empty State */}
      {!trainingStats && !isLoading && (
        <div className="text-center py-4 text-muted-foreground">
          <Brain className="h-6 w-6 mx-auto mb-1 opacity-30" />
          <p className="text-[10px]">Atlas manages all training</p>
        </div>
      )}
    </div>
  );
}

// Helper Components
function MetricMini({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center p-1.5 bg-muted/30 rounded">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
        {icon}
      </div>
      <div className="text-xs font-bold font-mono">{value}</div>
      <div className="text-[8px] text-muted-foreground">{label}</div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
