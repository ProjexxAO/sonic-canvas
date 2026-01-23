import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingCompleteProps {
  onComplete: () => void;
}

export function OnboardingComplete({ onComplete }: OnboardingCompleteProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Success icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check size={48} className="text-green-500" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Sparkles size={20} className="text-primary-foreground" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-3 text-center">
        You're All Set!
      </h1>
      
      {/* Description */}
      <p className="text-lg text-muted-foreground text-center max-w-md mb-8">
        Your Enterprise Data Hub is ready. Start exploring your data and generating powerful insights.
      </p>

      {/* What's next */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        <h3 className="text-sm font-semibold text-foreground text-center mb-3">What you can do next:</h3>
        <NextStep icon="📊" text="Explore the Data Hub to see all your connected data" />
        <NextStep icon="🎯" text="Configure personas with custom focus areas" />
        <NextStep icon="🎤" text="Try voice commands with Atlas" />
        <NextStep icon="📄" text="Generate and export professional reports" />
      </div>

      {/* CTA */}
      <Button 
        size="lg" 
        className="px-8 font-semibold"
        onClick={onComplete}
      >
        Start Exploring
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  );
}

function NextStep({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}
