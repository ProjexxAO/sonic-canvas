import { useState } from 'react';
import { Bot, ArrowRight, ArrowLeft, SkipForward, Sparkles, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentAllocationPanel } from '@/components/atlas/AgentAllocationPanel';
import { TierBadge } from '@/components/subscription/TierBadge';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { SubscriptionTier, TIER_AGENT_LIMITS, getTierLabel } from '@/lib/tierConfig';
import { cn } from '@/lib/utils';

interface AllocateAgentsStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  selectedPersona: string;
  tier?: SubscriptionTier;
}

export function AllocateAgentsStep({
  onNext,
  onBack,
  onSkip,
  selectedPersona,
  tier = 'free',
}: AllocateAgentsStepProps) {
  const [hasAllocated, setHasAllocated] = useState(false);
  
  const agentLimits = TIER_AGENT_LIMITS[tier];
  const canOrchestrate = agentLimits.canOrchestrate;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Your AI Agent Team</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {selectedPersona ? (
              <>Based on your <span className="text-primary font-medium">{selectedPersona}</span> profile,</>
            ) : (
              <>Based on your tier,</>
            )}{' '}
            Atlas can deploy up to <span className="font-semibold text-foreground">{agentLimits.maxAgents.toLocaleString()}</span> AI agents.
          </p>
          <div className="flex items-center justify-center gap-2">
            <TierBadge tier={tier} />
            <span className="text-xs text-muted-foreground">
              • {agentLimits.allowedClasses.join(', ')} class agents
            </span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {['Welcome', 'Tour', 'Data', 'Report', 'Agents'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                i === 4 ? 'bg-primary' : i < 4 ? 'bg-primary/50' : 'bg-muted'
              )} />
              {i < 4 && <div className="w-8 h-px bg-muted" />}
            </div>
          ))}
        </div>

        {/* Agent Allocation or Upgrade Prompt */}
        {canOrchestrate ? (
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Recommended Agents</h2>
            </div>
            <AgentAllocationPanel 
              persona={selectedPersona}
              onAllocationComplete={() => setHasAllocated(true)}
              compact
            />
          </div>
        ) : (
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Agent Orchestration Locked</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your {getTierLabel(tier)} tier includes {agentLimits.maxAgents} basic agents with view-only access. 
              Upgrade to Pro or higher to unlock full agent orchestration.
            </p>
            <UpgradePrompt 
              currentTier={tier} 
              feature="swarm_orchestration"
              variant="banner"
            />
          </div>
        )}

        {/* Info card */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bot size={14} />
              <span>Max Agents: <strong className="text-foreground">{agentLimits.maxAgents.toLocaleString()}</strong></span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1">
              <Sparkles size={14} />
              <span>Concurrent: <strong className="text-foreground">{agentLimits.concurrentTasks}</strong></span>
            </div>
            {agentLimits.canSwarm && (
              <>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1">
                  <Crown size={14} className="text-accent" />
                  <span>Swarm: <strong className="text-foreground">{agentLimits.swarmLimit.toLocaleString()}</strong></span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onSkip} className="gap-2 text-muted-foreground">
              Skip
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button onClick={onNext} className="gap-2">
              {hasAllocated || !canOrchestrate ? 'Complete Setup' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
