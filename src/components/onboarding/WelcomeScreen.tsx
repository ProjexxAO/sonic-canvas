import { Hexagon, Radio, ArrowRight, X, Users, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/subscription/TierBadge';
import { SubscriptionTier, TIER_PRICING, getTierLabel } from '@/lib/tierConfig';

interface WelcomeScreenProps {
  onStart: () => void;
  onSkip: () => void;
  tier?: SubscriptionTier;
}

export function WelcomeScreen({
  onStart,
  onSkip,
  tier = 'free'
}: WelcomeScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 animate-fade-in">
      {/* Skip button */}
      <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-muted-foreground" onClick={onSkip}>
        <X size={16} className="mr-1" />
        Skip
      </Button>

      {/* Atlas Logo */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <div className="relative">
            <Hexagon size={48} className="text-primary-foreground" />
            <Radio size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground" />
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <span className="text-xs font-bold text-secondary-foreground">AI</span>
        </div>
      </div>

      {/* Tier badge */}
      <div className="mb-4">
        <TierBadge tier={tier} size="md" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-3 text-center text-foreground">Welcome to Atlas</h1>
      
      {/* Subtitle */}
      <p className="text-lg text-muted-foreground text-center max-w-md mb-2">
        Your AI-powered life & business operating system
      </p>
      
      {/* Description */}
      <p className="text-sm text-muted-foreground/80 text-center max-w-lg mb-8">
        Atlas connects across three powerful hubs: Personal for your life, Group for your teams, 
        and Enterprise for your organization. Let's get you set up.
      </p>

      {/* Hub preview */}
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg">
        <HubPreview 
          icon={User}
          title="Personal Hub" 
          description="Tasks, goals & life management"
          available={true}
        />
        <HubPreview 
          icon={Users}
          title="Group Hub" 
          description="Team collaboration"
          available={tier !== 'free'}
          locked={tier === 'free'}
        />
        <HubPreview 
          icon={Building2}
          title="Enterprise Hub" 
          description="Executive intelligence"
          available={tier === 'business' || tier === 'enterprise'}
          locked={tier !== 'business' && tier !== 'enterprise'}
        />
      </div>

      {/* CTA */}
      <Button size="lg" className="px-8 font-semibold" onClick={onStart}>
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

function HubPreview({
  icon: Icon,
  title,
  description,
  available,
  locked
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  available: boolean;
  locked?: boolean;
}) {
  return (
    <div className={`text-center p-3 rounded-lg bg-card border border-border ${locked ? 'opacity-50' : ''}`}>
      <div className={`w-8 h-8 rounded-full ${available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} font-bold text-sm flex items-center justify-center mx-auto mb-2`}>
        <Icon size={16} />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-0.5">{title}</h3>
      <p className="text-[10px] text-muted-foreground">{description}</p>
      {locked && <p className="text-[9px] text-amber-500 mt-1">Upgrade to unlock</p>}
    </div>
  );
}
