import { Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onStart, onSkip }: WelcomeScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Skip button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 text-muted-foreground"
        onClick={onSkip}
      >
        <X size={16} className="mr-1" />
        Skip
      </Button>

      {/* Logo/Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Sparkles size={40} className="text-primary-foreground" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <span className="text-xs font-bold text-secondary-foreground">AI</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-3 text-center">
        Welcome to C-Suite Data Hub
      </h1>
      
      {/* Subtitle */}
      <p className="text-lg text-muted-foreground text-center max-w-md mb-2">
        Your AI-powered executive intelligence platform
      </p>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground/80 text-center max-w-lg mb-8">
        Connect your data sources, choose your executive persona, and generate 
        personalized briefings tailored to your role. Let's get you set up in just a few steps.
      </p>

      {/* Features preview */}
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg">
        <FeaturePreview 
          number="1" 
          title="Connect" 
          description="Link your data sources"
        />
        <FeaturePreview 
          number="2" 
          title="Configure" 
          description="Choose your persona"
        />
        <FeaturePreview 
          number="3" 
          title="Generate" 
          description="Get AI briefings"
        />
      </div>

      {/* CTA */}
      <Button 
        size="lg" 
        className="px-8 font-semibold"
        onClick={onStart}
      >
        Get Started
        <ArrowRight size={18} className="ml-2" />
      </Button>

      {/* Time estimate */}
      <p className="text-xs text-muted-foreground mt-4">
        Takes about 2 minutes to complete
      </p>
    </div>
  );
}

function FeaturePreview({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-card border border-border">
      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-2">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
  );
}
