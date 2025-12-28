import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Network, 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle,
  CheckCircle2,
  Search,
  Loader2,
  Bot,
  FileText,
  Calendar,
  DollarSign,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { useAtlasEnterprise } from '@/hooks/useAtlasEnterprise';

interface EnterpriseInsightsPanelProps {
  userId: string | undefined;
}

const DOMAIN_ICONS: Record<string, any> = {
  communications: MessageSquare,
  documents: FileText,
  events: Calendar,
  financials: DollarSign,
  tasks: CheckCircle2,
  knowledge: BookOpen
};

export function EnterpriseInsightsPanel({ userId }: EnterpriseInsightsPanelProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('query');
  
  const {
    isLoading,
    lastQuery,
    lastAnalysis,
    lastCorrelation,
    lastRecommendations,
    queryEnterprise,
    findCorrelations,
    analyzeEnterprise,
    getRecommendations
  } = useAtlasEnterprise(userId);

  const handleQuery = async () => {
    if (!query.trim()) return;
    await queryEnterprise(query, { timeRange: 'month' });
  };

  const handleCorrelate = async () => {
    await findCorrelations();
  };

  const handleAnalyze = async () => {
    await analyzeEnterprise(query || undefined);
  };

  const handleRecommend = async () => {
    await getRecommendations(query || undefined);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="border-primary/30 bg-background/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-mono text-primary">
          <Brain className="w-5 h-5" />
          ENTERPRISE INTELLIGENCE
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Query Input */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your enterprise data..."
            className="font-mono text-sm bg-background/50 border-primary/30"
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
          />
          <Button 
            onClick={handleQuery} 
            disabled={isLoading || !query.trim()}
            className="font-mono"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCorrelate}
            disabled={isLoading}
            className="font-mono text-xs"
          >
            <Network className="w-3 h-3 mr-1" />
            CORRELATE
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAnalyze}
            disabled={isLoading}
            className="font-mono text-xs"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            ANALYZE
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRecommend}
            disabled={isLoading}
            className="font-mono text-xs"
          >
            <Lightbulb className="w-3 h-3 mr-1" />
            RECOMMEND
          </Button>
        </div>

        {/* Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="query" className="font-mono text-xs">QUERY</TabsTrigger>
            <TabsTrigger value="correlations" className="font-mono text-xs">CORRELATIONS</TabsTrigger>
            <TabsTrigger value="analysis" className="font-mono text-xs">ANALYSIS</TabsTrigger>
            <TabsTrigger value="recommendations" className="font-mono text-xs">ACTIONS</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-64 mt-3">
            {/* Query Results */}
            <TabsContent value="query" className="space-y-3 mt-0">
              {lastQuery ? (
                <>
                  <div className="p-3 bg-muted/30 rounded-lg border border-primary/20">
                    <p className="text-sm whitespace-pre-wrap">{lastQuery.answer}</p>
                  </div>
                  
                  {/* Data Context */}
                  <div className="flex flex-wrap gap-2">
                    {lastQuery.dataContext.domains.map(d => {
                      const Icon = DOMAIN_ICONS[d.domain] || FileText;
                      return (
                        <Badge key={d.domain} variant="outline" className="font-mono text-xs">
                          <Icon className="w-3 h-3 mr-1" />
                          {d.domain}: {d.count}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Relevant Agents */}
                  {lastQuery.agents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-muted-foreground">RELEVANT AGENTS:</p>
                      {lastQuery.agents.map(agent => (
                        <div key={agent.id} className="flex items-center gap-2 p-2 bg-muted/20 rounded">
                          <Bot className="w-4 h-4 text-primary" />
                          <span className="text-xs font-mono">{agent.name}</span>
                          <Badge variant="outline" className="text-xs">{agent.sector}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Enter a query to search enterprise data
                </p>
              )}
            </TabsContent>

            {/* Correlations */}
            <TabsContent value="correlations" className="space-y-3 mt-0">
              {lastCorrelation ? (
                <>
                  {lastCorrelation.correlations.map((corr, i) => (
                    <div key={i} className="p-3 bg-muted/30 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getPriorityColor(corr.confidence)}>{corr.confidence}</Badge>
                        <span className="text-xs font-mono text-muted-foreground">{corr.type}</span>
                      </div>
                      <p className="text-sm">{corr.description}</p>
                      <div className="flex gap-1 mt-2">
                        {corr.domains.map(d => (
                          <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {lastCorrelation.insights.length > 0 && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-xs font-mono text-primary mb-2">KEY INSIGHTS:</p>
                      <ul className="space-y-1">
                        {lastCorrelation.insights.map((insight, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <Lightbulb className="w-3 h-3 mt-1 text-primary" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Click CORRELATE to find patterns across domains
                </p>
              )}
            </TabsContent>

            {/* Analysis */}
            <TabsContent value="analysis" className="space-y-3 mt-0">
              {lastAnalysis ? (
                <>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs font-mono text-muted-foreground mb-1">EXECUTIVE SUMMARY</p>
                    <p className="text-sm">{lastAnalysis.executiveSummary}</p>
                  </div>

                  {/* Risks */}
                  {lastAnalysis.risks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> RISKS
                      </p>
                      {lastAnalysis.risks.map((risk, i) => (
                        <div key={i} className="p-2 bg-destructive/10 rounded border border-destructive/30">
                          <div className="flex gap-2 mb-1">
                            <Badge className={getPriorityColor(risk.impact)}>Impact: {risk.impact}</Badge>
                            <Badge variant="outline" className="text-xs">P: {risk.probability}</Badge>
                          </div>
                          <p className="text-sm">{risk.risk}</p>
                          <p className="text-xs text-muted-foreground mt-1">Mitigation: {risk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agent Recommendations */}
                  {lastAnalysis.agentRecommendations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-primary flex items-center gap-1">
                        <Bot className="w-3 h-3" /> AGENT DEPLOYMENT
                      </p>
                      {lastAnalysis.agentRecommendations.map((rec, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-primary/10 rounded">
                          <Bot className="w-4 h-4 text-primary" />
                          <span className="text-sm font-mono">{rec.agentName}</span>
                          <span className="text-xs text-muted-foreground flex-1">{rec.task}</span>
                          <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Click ANALYZE for comprehensive enterprise analysis
                </p>
              )}
            </TabsContent>

            {/* Recommendations */}
            <TabsContent value="recommendations" className="space-y-3 mt-0">
              {lastRecommendations ? (
                <>
                  {/* Immediate Actions */}
                  {lastRecommendations.immediate.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-destructive">IMMEDIATE (24-48h)</p>
                      {lastRecommendations.immediate.map((item, i) => (
                        <div key={i} className="p-2 bg-destructive/10 rounded border border-destructive/30">
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-muted-foreground">{item.rationale}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Short Term */}
                  {lastRecommendations.shortTerm.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-yellow-400">SHORT TERM (1-2 weeks)</p>
                      {lastRecommendations.shortTerm.map((item, i) => (
                        <div key={i} className="p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                          <p className="text-sm font-medium">{item.action}</p>
                          <p className="text-xs text-muted-foreground">{item.timeline}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Strategic */}
                  {lastRecommendations.strategic.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-primary">STRATEGIC (Quarter)</p>
                      {lastRecommendations.strategic.map((item, i) => (
                        <div key={i} className="p-2 bg-primary/10 rounded border border-primary/30">
                          <p className="text-sm font-medium">{item.initiative}</p>
                          <p className="text-xs text-muted-foreground">Goal: {item.goal}</p>
                          <div className="flex gap-1 mt-1">
                            {item.kpis.map((kpi, j) => (
                              <Badge key={j} variant="outline" className="text-xs">{kpi}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Click RECOMMEND for actionable recommendations
                </p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
