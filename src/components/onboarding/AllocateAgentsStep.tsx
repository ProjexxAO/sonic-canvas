import { useState } from 'react';
import { Bot, ArrowRight, ArrowLeft, SkipForward, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentAllocationPanel } from '@/components/atlas/AgentAllocationPanel';

interface AllocateAgentsStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  selectedPersona: string;
}

export function AllocateAgentsStep({
  onNext,
  onBack,
  onSkip,
  selectedPersona,
}: AllocateAgentsStepProps) {
  const [hasAllocated, setHasAllocated] = useState(false);

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
            Based on your <span className="text-primary font-medium">{selectedPersona || 'executive'}</span> profile, 
            Atlas has identified the best AI agents to support your work.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {['Welcome', 'Tour', 'Data', 'Report', 'Agents'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${i === 4 ? 'bg-primary' : 'bg-muted'}`} />
              {i < 4 && <div className="w-8 h-px bg-muted" />}
            </div>
          ))}
        </div>

        {/* Agent Allocation Panel */}
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

        {/* Info card */}
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Agents are allocated based on your <strong>organization tier</strong> and <strong>persona</strong>.
            Higher tiers unlock access to more advanced agent classes.
          </p>
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
              {hasAllocated ? 'Complete Setup' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
