import React from 'react';
import { useKnowledgeDiscovery, KnowledgeDiscovery } from '@/hooks/useKnowledgeDiscovery';
import { useVeracityEvaluation } from '@/hooks/useVeracityEvaluation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  RefreshCw, 
  Brain, 
  Lightbulb, 
  CheckCircle2,
  Atom,
  Calculator,
  Cpu,
  DollarSign,
  FlaskConical,
  Microscope,
  Shield,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const domainIcons: Record<string, React.ReactNode> = {
  mathematics: <Calculator className="h-4 w-4" />,
  physics: <Atom className="h-4 w-4" />,
  computer_science: <Cpu className="h-4 w-4" />,
  biology: <Microscope className="h-4 w-4" />,
  materials_science: <FlaskConical className="h-4 w-4" />,
  economics: <DollarSign className="h-4 w-4" />,
  cognitive_science: <Brain className="h-4 w-4" />,
};

const domainColors: Record<string, string> = {
  mathematics: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  physics: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  computer_science: 'bg-green-500/20 text-green-400 border-green-500/30',
  biology: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  materials_science: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  economics: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  cognitive_science: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

interface DiscoveryCardProps {
  discovery: KnowledgeDiscovery;
  onVerify: (discovery: KnowledgeDiscovery) => Promise<void>;
  isVerifying: boolean;
}

function DiscoveryCard({ discovery, onVerify, isVerifying }: DiscoveryCardProps) {
  const [expanded, setExpanded] = React.useState(false);
  
  return (
    <Card className="bg-background/50 border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={`${domainColors[discovery.domain] || 'bg-muted'} flex items-center gap-1`}
            >
              {domainIcons[discovery.domain] || <Lightbulb className="h-3 w-3" />}
              {discovery.domain.replace('_', ' ')}
            </Badge>
            {discovery.is_applied && (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Applied
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(discovery.created_at), { addSuffix: true })}
          </span>
        </div>
        <CardTitle className="text-sm font-medium leading-snug mt-2">
          {discovery.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <CardDescription className="text-xs leading-relaxed">
          {discovery.summary}
        </CardDescription>
        
        {expanded && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md mt-2">
            {discovery.detailed_content}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1 flex-wrap">
            {discovery.application_areas.slice(0, 3).map((area) => (
              <Badge key={area} variant="secondary" className="text-[10px] px-1.5 py-0">
                {area.replace('_', ' ')}
              </Badge>
            ))}
          </div>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-6 px-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Less' : 'More'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-6 px-2 gap-1"
              onClick={() => onVerify(discovery)}
              disabled={isVerifying}
              title="Verify this discovery's plausibility"
            >
              {isVerifying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Shield className="h-3 w-3" />
              )}
              Verify
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Confidence: {Math.round(discovery.confidence_score * 100)}%</span>
          {discovery.applied_to && discovery.applied_to.length > 0 && (
            <span>• Applied to: {discovery.applied_to.join(', ')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


export function KnowledgeDiscoveryPanel() {
  const { 
    discoveries, 
    isLoading, 
    isDiscovering, 
    triggerDiscovery,
    fetchDiscoveries 
  } = useKnowledgeDiscovery();
  
  const { evaluateStatement, isEvaluating } = useVeracityEvaluation();
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);

  const handleVerifyDiscovery = async (discovery: KnowledgeDiscovery) => {
    setVerifyingId(discovery.id);
    try {
      await evaluateStatement(
        discovery.summary,
        `Domain: ${discovery.domain}. Full content: ${discovery.detailed_content}`,
        discovery.id
      );
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Knowledge Discovery</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDiscoveries()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            onClick={() => triggerDiscovery()}
            disabled={isDiscovering}
            className="gap-1"
          >
            {isDiscovering ? (
              <>
                <Brain className="h-4 w-4 animate-pulse" />
                Discovering...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Discover
              </>
            )}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {isLoading && discoveries.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-background/50">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : discoveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <Brain className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No discoveries yet</p>
            <p className="text-xs mt-1">Click "Discover" to start researching new knowledge</p>
          </div>
        ) : (
          <div className="space-y-3">
            {discoveries.map((discovery) => (
              <DiscoveryCard 
                key={discovery.id} 
                discovery={discovery}
                onVerify={handleVerifyDiscovery}
                isVerifying={verifyingId === discovery.id || (isEvaluating && verifyingId === discovery.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

