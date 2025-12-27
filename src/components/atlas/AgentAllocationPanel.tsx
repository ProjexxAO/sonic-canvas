import { useEffect, useState } from 'react';
import { Sparkles, UserCheck, Zap, Building2, Crown, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentAllocation, AllocatedAgent } from '@/hooks/useAgentAllocation';
import { cn } from '@/lib/utils';

interface AgentAllocationPanelProps {
  persona?: string;
  onAllocationComplete?: () => void;
  compact?: boolean;
}

export function AgentAllocationPanel({ 
  persona, 
  onAllocationComplete,
  compact = false 
}: AgentAllocationPanelProps) {
  const {
    recommendations,
    context,
    loading,
    fetchRecommendations,
    allocateAgents,
    getTierLabel,
    getClassColor,
  } = useAgentAllocation();

  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [allocating, setAllocating] = useState(false);

  useEffect(() => {
    fetchRecommendations({ persona, limit: 6 });
  }, [persona, fetchRecommendations]);

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  const handleAllocate = async () => {
    if (selectedAgents.size === 0) return;
    
    setAllocating(true);
    const success = await allocateAgents(Array.from(selectedAgents));
    setAllocating(false);
    
    if (success) {
      setSelectedAgents(new Set());
      onAllocationComplete?.();
    }
  };

  const handleAutoAllocate = async () => {
    setAllocating(true);
    await fetchRecommendations({ persona, autoAssign: true, limit: 3 });
    setAllocating(false);
    onAllocationComplete?.();
  };

  const getSectorIcon = (sector: string) => {
    const icons: Record<string, React.ReactNode> = {
      'FINANCE': <Building2 className="h-4 w-4" />,
      'DATA': <Zap className="h-4 w-4" />,
      'SECURITY': <UserCheck className="h-4 w-4" />,
      'CREATIVE': <Sparkles className="h-4 w-4" />,
    };
    return icons[sector] || <Zap className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No agent recommendations available</p>
          <p className="text-xs text-muted-foreground mt-1">
            All suitable agents may already be allocated
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Context Header */}
      {context && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="gap-1">
            <Crown className="h-3 w-3" />
            {getTierLabel(context.tier)}
          </Badge>
          <Badge variant="secondary">{context.persona} Profile</Badge>
          {context.primarySectors.slice(0, 2).map(sector => (
            <Badge key={sector} variant="outline" className="text-xs">
              {sector}
            </Badge>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={handleAutoAllocate}
          disabled={allocating}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Auto-Allocate Top 3
        </Button>
        {selectedAgents.size > 0 && (
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleAllocate}
            disabled={allocating}
          >
            Allocate Selected ({selectedAgents.size})
          </Button>
        )}
      </div>

      {/* Recommendations Grid */}
      <ScrollArea className={cn("w-full", compact ? "max-h-[300px]" : "max-h-[400px]")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
          {recommendations.map((agent) => (
            <AgentRecommendationCard
              key={agent.id}
              agent={agent}
              selected={selectedAgents.has(agent.id)}
              onToggle={() => toggleAgent(agent.id)}
              getClassColor={getClassColor}
              getSectorIcon={getSectorIcon}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

interface AgentRecommendationCardProps {
  agent: AllocatedAgent;
  selected: boolean;
  onToggle: () => void;
  getClassColor: (c: string) => string;
  getSectorIcon: (s: string) => React.ReactNode;
}

function AgentRecommendationCard({
  agent,
  selected,
  onToggle,
  getClassColor,
  getSectorIcon,
}: AgentRecommendationCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        selected && "border-primary bg-primary/5"
      )}
      onClick={onToggle}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted">
              {getSectorIcon(agent.sector)}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
              <CardDescription className="text-xs">{agent.designation}</CardDescription>
            </div>
          </div>
          <div className={cn(
            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
          )}>
            {selected && <Check className="h-3 w-3" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {agent.sector}
            </Badge>
            <span className={cn("text-xs font-medium", getClassColor(agent.class))}>
              {agent.class}
            </span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span>{agent.relevanceScore}%</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
          {agent.relevanceReason}
        </p>
      </CardContent>
    </Card>
  );
}
