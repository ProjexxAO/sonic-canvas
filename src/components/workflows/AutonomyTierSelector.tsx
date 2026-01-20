import { useState } from 'react';
import { Zap, Eye, User, Check, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AutonomyLevel, AUTONOMY_TIERS, AutonomyTierConfig } from '@/lib/agentProtocols';

interface AutonomyTierSelectorProps {
  selectedTier: AutonomyLevel;
  onTierChange: (tier: AutonomyLevel) => void;
  showDetails?: boolean;
  disabled?: boolean;
}

const TIER_ICONS = {
  full_auto: Zap,
  supervised: Eye,
  human_led: User,
};

export function AutonomyTierSelector({
  selectedTier,
  onTierChange,
  showDetails = true,
  disabled = false,
}: AutonomyTierSelectorProps) {
  const [hoveredTier, setHoveredTier] = useState<AutonomyLevel | null>(null);

  const tiers = Object.values(AUTONOMY_TIERS);
  const selectedConfig = AUTONOMY_TIERS[selectedTier];

  return (
    <div className="space-y-4">
      {/* Tier Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tiers.map((tier) => {
          const Icon = TIER_ICONS[tier.level];
          const isSelected = selectedTier === tier.level;
          const isHovered = hoveredTier === tier.level;

          return (
            <Card
              key={tier.level}
              className={cn(
                'cursor-pointer transition-all duration-200 relative overflow-hidden',
                isSelected && 'ring-2 ring-primary bg-primary/5',
                !isSelected && 'hover:border-primary/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !disabled && onTierChange(tier.level)}
              onMouseEnter={() => setHoveredTier(tier.level)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-primary-foreground" />
                  </div>
                </div>
              )}

              {/* Risk indicator bar */}
              <div 
                className={cn(
                  'absolute top-0 left-0 right-0 h-1',
                  tier.riskThreshold === 'low' && 'bg-emerald-500',
                  tier.riskThreshold === 'medium' && 'bg-amber-500',
                  tier.riskThreshold === 'high' && 'bg-red-500'
                )}
              />

              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${tier.color}20` }}
                  >
                    <Icon size={20} style={{ color: tier.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{tier.label}</CardTitle>
                    <CardDescription className="text-[10px]">
                      {tier.riskThreshold.toUpperCase()} RISK
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {tier.description}
                </p>

                {/* Permission badges */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {tier.permissions.canExecuteWithoutApproval && (
                    <Badge variant="secondary" className="text-[9px] py-0">
                      Auto-Execute
                    </Badge>
                  )}
                  {tier.permissions.canAccessExternalAPIs && (
                    <Badge variant="secondary" className="text-[9px] py-0">
                      API Access
                    </Badge>
                  )}
                  {tier.permissions.canModifyData && (
                    <Badge variant="secondary" className="text-[9px] py-0">
                      Data Modify
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Configuration View */}
      {showDetails && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${selectedConfig.color}20` }}
                >
                  {(() => {
                    const Icon = TIER_ICONS[selectedTier];
                    return <Icon size={14} style={{ color: selectedConfig.color }} />;
                  })()}
                </div>
                {selectedConfig.label} Configuration
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Info size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs">
                      {selectedConfig.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Permissions Grid */}
            <div className="grid grid-cols-2 gap-3">
              <PermissionItem 
                label="Execute Without Approval"
                enabled={selectedConfig.permissions.canExecuteWithoutApproval}
              />
              <PermissionItem 
                label="External API Access"
                enabled={selectedConfig.permissions.canAccessExternalAPIs}
              />
              <PermissionItem 
                label="Modify Data"
                enabled={selectedConfig.permissions.canModifyData}
              />
              <PermissionItem 
                label="Initiate Handoffs"
                enabled={selectedConfig.permissions.canInitiateHandoffs}
              />
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">
                  Max Actions/Session
                </span>
                <p className="text-sm font-medium">
                  {selectedConfig.permissions.maxActionsPerSession === -1 
                    ? 'Unlimited' 
                    : selectedConfig.permissions.maxActionsPerSession}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase">
                  Audit Logging
                </span>
                <p className="text-sm font-medium">
                  {selectedConfig.permissions.requiresAuditLog ? 'Required' : 'Optional'}
                </p>
              </div>
            </div>

            {/* Example Use Cases */}
            <div className="pt-2 border-t border-border">
              <span className="text-[10px] text-muted-foreground uppercase block mb-2">
                Example Use Cases
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedConfig.examples.map((example, idx) => (
                  <Badge key={idx} variant="outline" className="text-[10px]">
                    {example}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Risk Warning */}
            {selectedConfig.riskThreshold === 'high' && (
              <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This tier requires human approval for all actions. 
                  Best for sensitive operations where oversight is critical.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PermissionItem({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-background">
      <span className="text-xs">{label}</span>
      <div className={cn(
        'w-4 h-4 rounded flex items-center justify-center',
        enabled ? 'bg-emerald-500/20' : 'bg-muted'
      )}>
        {enabled ? (
          <Check size={10} className="text-emerald-500" />
        ) : (
          <span className="w-2 h-0.5 bg-muted-foreground/30 rounded" />
        )}
      </div>
    </div>
  );
}
