import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  SubscriptionTier, 
  FeatureKey,
  getUpgradeTier, 
  getTierLabel, 
  TIER_PRICING,
  FEATURE_DESCRIPTIONS 
} from '@/lib/tierConfig';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  currentTier: SubscriptionTier;
  feature?: FeatureKey;
  requiredTier?: SubscriptionTier;
  variant?: 'inline' | 'card' | 'banner' | 'modal';
  className?: string;
  onUpgrade?: () => void;
}

export function UpgradePrompt({
  currentTier,
  feature,
  requiredTier,
  variant = 'inline',
  className,
  onUpgrade,
}: UpgradePromptProps) {
  const upgradeTo = requiredTier || getUpgradeTier(currentTier);
  
  if (!upgradeTo) return null;
  
  const pricing = TIER_PRICING[upgradeTo];
  const featureInfo = feature ? FEATURE_DESCRIPTIONS[feature] : null;

  if (variant === 'inline') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border",
        className
      )}>
        <Lock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {featureInfo ? `${featureInfo.name} requires` : 'Upgrade to'}{' '}
          <span className="font-medium text-foreground">{getTierLabel(upgradeTo)}</span>
        </span>
        <Button size="sm" variant="outline" className="ml-auto h-7" onClick={onUpgrade}>
          Upgrade
        </Button>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        "flex items-center justify-between gap-4 px-4 py-3 rounded-lg",
        "bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {featureInfo ? `Unlock ${featureInfo.name}` : `Upgrade to ${getTierLabel(upgradeTo)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {featureInfo?.description || pricing.description}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={onUpgrade} className="gap-1">
          Upgrade
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {featureInfo?.name || 'Feature Locked'}
            </CardTitle>
            <Badge variant="secondary">{getTierLabel(upgradeTo)}+</Badge>
          </div>
          <CardDescription>
            {featureInfo?.description || `This feature requires ${getTierLabel(upgradeTo)} or higher`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold">${pricing.monthlyPrice}</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
            <Button onClick={onUpgrade} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modal variant (full feature comparison)
  return (
    <div className={cn(
      "space-y-4 p-6 rounded-xl border bg-card",
      className
    )}>
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-bold">
          {featureInfo ? `Unlock ${featureInfo.name}` : 'Upgrade Your Plan'}
        </h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          {featureInfo?.description || pricing.description}
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Starting at</p>
        <div>
          <span className="text-3xl font-bold">${pricing.monthlyPrice}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          or ${pricing.annualPrice}/year (save 2 months)
        </p>
      </div>

      <Button className="w-full" size="lg" onClick={onUpgrade}>
        <Sparkles className="h-4 w-4 mr-2" />
        Upgrade to {getTierLabel(upgradeTo)}
      </Button>
    </div>
  );
}

// Inline gating wrapper component
interface FeatureGateProps {
  feature: FeatureKey;
  tier: SubscriptionTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgrade?: () => void;
}

export function FeatureGate({
  feature,
  tier,
  children,
  fallback,
  onUpgrade,
}: FeatureGateProps) {
  const hasAccess = (() => {
    const { TIER_FEATURES } = require('@/lib/tierConfig');
    const access = TIER_FEATURES[tier][feature];
    return access === true || access === 'limited';
  })();

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <UpgradePrompt
      currentTier={tier}
      feature={feature}
      variant="inline"
      onUpgrade={onUpgrade}
    />
  );
}
