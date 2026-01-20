import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Brain,
  Scale,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useVeracityEvaluation, VeracityEvaluation } from '@/hooks/useVeracityEvaluation';

export function VeracityEvaluationPanel() {
  const {
    isEvaluating,
    isLoading,
    evaluations,
    currentEvaluation,
    stats,
    evaluateStatement,
    fetchRecentEvaluations,
    fetchStats,
    getConfidenceColor,
    getScoreColor,
  } = useVeracityEvaluation();

  const [statement, setStatement] = useState('');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [expandedEvaluation, setExpandedEvaluation] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentEvaluations(5);
    fetchStats();
  }, [fetchRecentEvaluations, fetchStats]);

  const handleEvaluate = async () => {
    if (!statement.trim()) return;
    await evaluateStatement(statement, context || undefined);
    setStatement('');
    setContext('');
    setShowContext(false);
  };

  const formatScore = (score: number) => Math.round(score * 100);

  const renderScoreBar = (label: string, score: number, icon: React.ReactNode) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className={getScoreColor(score)}>{formatScore(score)}%</span>
      </div>
      <Progress value={score * 100} className="h-1" />
    </div>
  );

  const renderEvaluation = (evaluation: VeracityEvaluation, isExpanded: boolean) => (
    <div 
      key={evaluation.id || evaluation.statement.substring(0, 20)}
      className="bg-background border border-border rounded-lg p-3 space-y-2"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground line-clamp-2">
            "{evaluation.statement.substring(0, 100)}{evaluation.statement.length > 100 ? '...' : ''}"
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={`${getConfidenceColor(evaluation.confidence_level)} border-current shrink-0`}
        >
          {formatScore(evaluation.veracity_score)}%
        </Badge>
      </div>

      {/* Score Summary */}
      <div className="grid grid-cols-3 gap-2">
        {renderScoreBar('Knowledge', evaluation.knowledge_alignment_score, <Brain size={10} />)}
        {renderScoreBar('Context', evaluation.contextual_fit_score, <Target size={10} />)}
        {renderScoreBar('Sources', evaluation.source_reliability_score, <Scale size={10} />)}
      </div>

      {/* Expandable Details */}
      <Collapsible 
        open={isExpanded} 
        onOpenChange={(open) => setExpandedEvaluation(open ? evaluation.id || null : null)}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full h-6 text-[10px] text-muted-foreground">
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {isExpanded ? 'Less Details' : 'More Details'}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          {/* Summary */}
          <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded">
            {evaluation.evaluation_summary}
          </div>

          {/* Plausibility Factors */}
          {evaluation.plausibility_factors.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground">Plausibility Factors</span>
              <div className="space-y-1">
                {evaluation.plausibility_factors.map((factor, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <div className={`w-1.5 h-1.5 rounded-full ${getScoreColor(factor.score)} bg-current`} />
                    <span className="text-foreground/80">{factor.factor}</span>
                    <span className={`ml-auto ${getScoreColor(factor.score)}`}>{formatScore(factor.score)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          <div className="grid grid-cols-2 gap-2">
            {/* Supporting Evidence */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-green-500">
                <CheckCircle2 size={10} />
                <span>Supporting ({evaluation.supporting_evidence.length})</span>
              </div>
              {evaluation.supporting_evidence.slice(0, 2).map((ev, i) => (
                <div key={i} className="text-[9px] text-muted-foreground bg-green-500/5 p-1 rounded">
                  {ev.content.substring(0, 60)}...
                </div>
              ))}
            </div>

            {/* Contradicting Evidence */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-red-400">
                <XCircle size={10} />
                <span>Contradicting ({evaluation.contradicting_evidence.length})</span>
              </div>
              {evaluation.contradicting_evidence.slice(0, 2).map((ev, i) => (
                <div key={i} className="text-[9px] text-muted-foreground bg-red-500/5 p-1 rounded">
                  {ev.content.substring(0, 60)}...
                </div>
              ))}
            </div>
          </div>

          {/* Citations */}
          {evaluation.citations.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-medium text-muted-foreground">Sources</span>
              <div className="flex flex-wrap gap-1">
                {evaluation.citations.slice(0, 3).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink size={8} />
                    {new URL(url).hostname.replace('www.', '')}
                  </a>
                ))}
                {evaluation.citations.length > 3 && (
                  <span className="text-[9px] text-muted-foreground">
                    +{evaluation.citations.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <span className="text-sm font-mono font-medium">Veracity Evaluator</span>
        </div>
        {stats && (
          <Badge variant="outline" className="text-[10px]">
            {stats.total} evaluations
          </Badge>
        )}
      </div>

      {/* Stats Summary */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-3 gap-2 p-3 border-b border-border bg-muted/20">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{stats.avg_score * 100}%</div>
            <div className="text-[9px] text-muted-foreground">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-500">{stats.high_confidence}</div>
            <div className="text-[9px] text-muted-foreground">High Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{stats.total}</div>
            <div className="text-[9px] text-muted-foreground">Total</div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="p-3 border-b border-border space-y-2">
        <Textarea
          placeholder="Enter a statement to evaluate..."
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          className="min-h-[60px] text-xs resize-none"
        />
        
        <Collapsible open={showContext} onOpenChange={setShowContext}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground p-0">
              {showContext ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              Add Context (optional)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Input
              placeholder="Additional context..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="text-xs"
            />
          </CollapsibleContent>
        </Collapsible>

        <Button
          onClick={handleEvaluate}
          disabled={isEvaluating || !statement.trim()}
          className="w-full gap-2 text-xs"
          size="sm"
        >
          {isEvaluating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Search size={14} />
              Evaluate Veracity
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Current Evaluation */}
          {currentEvaluation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-primary font-medium">
                <AlertTriangle size={10} />
                Latest Evaluation
              </div>
              {renderEvaluation(currentEvaluation, expandedEvaluation === currentEvaluation.id)}
            </div>
          )}

          {/* Previous Evaluations */}
          {evaluations.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] text-muted-foreground font-medium">
                Recent Evaluations
              </div>
              {evaluations
                .filter(e => e.id !== currentEvaluation?.id)
                .slice(0, 5)
                .map(evaluation => renderEvaluation(evaluation, expandedEvaluation === evaluation.id))}
            </div>
          )}

          {evaluations.length === 0 && !currentEvaluation && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">No evaluations yet</p>
              <p className="text-[10px]">Enter a statement to assess its veracity</p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
