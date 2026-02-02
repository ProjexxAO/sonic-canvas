// Agent Training Panel - Atlas-controlled training visualization
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAgentTraining, TrainingFeedback, TrainingStats } from '@/hooks/useAgentTraining';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Zap,
  ArrowRightLeft,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Target,
  Users,
  Activity,
} from 'lucide-react';

export function AgentTrainingPanel() {
  const { user } = useAuth();
  const {
    isTraining,
    currentSession,
    recentFeedback,
    trainingStats,
    runTrainingSession,
    fetchTrainingStats,
    autoTransferFromTopPerformers,
  } = useAgentTraining();

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.id) {
      fetchTrainingStats();
    }
  }, [user?.id, fetchTrainingStats]);

  const handleRunTraining = async (mode: 'feedback' | 'transfer' | 'discovery' | 'full') => {
    try {
      await runTrainingSession({ mode, intensity: 2.0 });
    } catch (error) {
      console.error('Training failed:', error);
    }
  };

  const handleAutoTransfer = async () => {
    await autoTransferFromTopPerformers(5, 25);
    await fetchTrainingStats();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-mono font-semibold">Agent Training</h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => fetchTrainingStats()}
          disabled={isTraining}
        >
          <RefreshCw className={`h-3 w-3 ${isTraining ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Current Session Status */}
      {currentSession && currentSession.status === 'running' && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-mono text-primary">Training in progress...</span>
            </div>
            <Progress value={50} className="h-1" />
            <div className="mt-2 text-[10px] text-muted-foreground font-mono">
              Mode: {currentSession.mode} | Agents: {currentSession.agentsProcessed}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {trainingStats && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Target className="h-3 w-3" />}
            label="Success Rate"
            value={`${(trainingStats.avgSuccessRate * 100).toFixed(1)}%`}
            trend={trainingStats.avgSuccessRate > 0.7 ? 'up' : 'neutral'}
          />
          <StatCard
            icon={<Sparkles className="h-3 w-3" />}
            label="Avg Confidence"
            value={`${(trainingStats.avgConfidence * 100).toFixed(1)}%`}
            trend={trainingStats.avgConfidence > 0.6 ? 'up' : 'neutral'}
          />
          <StatCard
            icon={<ArrowRightLeft className="h-3 w-3" />}
            label="Transfers"
            value={trainingStats.totalKnowledgeTransfers.toString()}
          />
          <StatCard
            icon={<Brain className="h-3 w-3" />}
            label="Patterns"
            value={trainingStats.totalPatternsDiscovered.toString()}
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 h-8">
          <TabsTrigger value="overview" className="text-[10px]">Overview</TabsTrigger>
          <TabsTrigger value="feedback" className="text-[10px]">Feedback</TabsTrigger>
          <TabsTrigger value="actions" className="text-[10px]">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-2 space-y-2">
          {/* Top Performers */}
          {trainingStats?.topPerformers && trainingStats.topPerformers.length > 0 && (
            <Card>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-xs font-mono flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <div className="space-y-1">
                  {trainingStats.topPerformers.slice(0, 5).map((agent, idx) => (
                    <div key={agent.agentId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono">{idx + 1}.</span>
                        <span className="font-medium truncate max-w-[120px]">{agent.agentName}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {(agent.successRate * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Learning Events */}
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-mono flex items-center gap-1">
                <Activity className="h-3 w-3 text-blue-500" />
                Learning Activity (24h)
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3">
              <div className="text-center py-2">
                <span className="text-2xl font-bold font-mono text-primary">
                  {trainingStats?.recentLearningEvents ?? 0}
                </span>
                <p className="text-[10px] text-muted-foreground">learning events</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-2">
          <ScrollArea className="h-48">
            {recentFeedback.length > 0 ? (
              <div className="space-y-2 pr-2">
                {recentFeedback.slice(0, 20).map((fb, idx) => (
                  <FeedbackCard key={`${fb.taskId}-${idx}`} feedback={fb} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No recent feedback recorded</p>
                <p className="text-[10px] mt-1">Atlas will record training data automatically</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="actions" className="mt-2 space-y-2">
          <Button
            className="w-full justify-start gap-2 text-xs"
            variant="outline"
            size="sm"
            onClick={() => handleRunTraining('full')}
            disabled={isTraining}
          >
            <Zap className="h-3 w-3" />
            Run Full Training Cycle
          </Button>

          <Button
            className="w-full justify-start gap-2 text-xs"
            variant="outline"
            size="sm"
            onClick={() => handleRunTraining('discovery')}
            disabled={isTraining}
          >
            <Target className="h-3 w-3" />
            Discover Task Patterns
          </Button>

          <Button
            className="w-full justify-start gap-2 text-xs"
            variant="outline"
            size="sm"
            onClick={handleAutoTransfer}
            disabled={isTraining}
          >
            <ArrowRightLeft className="h-3 w-3" />
            Transfer Top Knowledge
          </Button>

          <Button
            className="w-full justify-start gap-2 text-xs"
            variant="outline"
            size="sm"
            onClick={() => handleRunTraining('transfer')}
            disabled={isTraining}
          >
            <Sparkles className="h-3 w-3" />
            Crystallize Memories
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components
function StatCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="p-2">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] font-mono">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-bold font-mono">{value}</span>
        {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
      </div>
    </Card>
  );
}

function FeedbackCard({ feedback }: { feedback: TrainingFeedback }) {
  return (
    <div className="p-2 bg-muted/30 rounded-md border border-border/50">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {feedback.success ? (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          ) : (
            <XCircle className="h-3 w-3 text-red-500" />
          )}
          <span className="text-xs font-medium truncate max-w-[100px]">
            {feedback.agentName}
          </span>
        </div>
        <Badge variant="outline" className="text-[9px]">
          {feedback.taskType}
        </Badge>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Confidence: {(feedback.confidenceScore * 100).toFixed(0)}%</span>
        {feedback.executionTimeMs && (
          <span>{feedback.executionTimeMs}ms</span>
        )}
      </div>
    </div>
  );
}
