import { Crown, Sparkles, Building2, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SubscriptionTier, getTierLabel, getTierColor } from '@/lib/tierConfig';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: SubscriptionTier;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TIER_ICONS = {
  free: null,
  pro: Sparkles,
  business: Building2,
  enterprise: Crown,
};

const TIER_VARIANTS: Record<SubscriptionTier, string> = {
  free: 'bg-muted text-muted-foreground',
  pro: 'bg-primary/10 text-primary border-primary/20',
  business: 'bg-secondary/10 text-secondary border-secondary/20',
  enterprise: 'bg-accent/10 text-accent border-accent/20',
};

export function TierBadge({ tier, showIcon = true, size = 'md', className }: TierBadgeProps) {
  const Icon = TIER_ICONS[tier];
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        TIER_VARIANTS[tier],
        sizeClasses[size],
        'gap-1 font-medium',
        className
      )}
    >
      {showIcon && Icon && <Icon size={iconSizes[size]} />}
      {getTierLabel(tier)}
    </Badge>
  );
}

// Compact version for headers/nav
export function TierIndicator({ tier, className }: { tier: SubscriptionTier; className?: string }) {
  const Icon = TIER_ICONS[tier] || Rocket;
  
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs font-medium",
      getTierColor(tier),
      className
    )}>
      <Icon size={14} />
      <span>{getTierLabel(tier)}</span>
    </div>
  );
}
