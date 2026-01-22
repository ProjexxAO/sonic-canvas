// IntegrationSurfaceWidget - Renders connected integrations within hub sections
// Shows integration data/actions embedded in relevant dashboard areas

import { useMemo } from 'react';
import { 
  RefreshCw, 
  ExternalLink,
  MoreHorizontal,
  Check,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  useIntegrationSurfaces, 
  IntegrationSurface, 
  SurfacedIntegration,
  HubType 
} from '@/hooks/useIntegrationSurfaces';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface IntegrationSurfaceWidgetProps {
  surface: IntegrationSurface;
  hubType?: HubType;
  variant?: 'inline' | 'compact' | 'card';
  className?: string;
  maxItems?: number;
  showEmpty?: boolean;
}

// Inline integration badge for embedding in section headers
export function IntegrationSurfaceWidget({
  surface,
  hubType = 'personal',
  variant = 'inline',
  className,
  maxItems = 5,
  showEmpty = false,
}: IntegrationSurfaceWidgetProps) {
  const { 
    getIntegrationsForSurface, 
    triggerSync,
    disconnectIntegration 
  } = useIntegrationSurfaces(hubType);

  const integrations = useMemo(() => {
    return getIntegrationsForSurface(surface).slice(0, maxItems);
  }, [getIntegrationsForSurface, surface, maxItems]);

  if (integrations.length === 0 && !showEmpty) return null;

  if (variant === 'inline') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {integrations.map(integration => (
          <IntegrationBadge 
            key={integration.id} 
            integration={integration}
            onSync={() => triggerSync(integration.id)}
          />
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <ScrollArea className={cn("w-full", className)}>
        <div className="flex gap-2 pb-2">
          {integrations.map(integration => (
            <IntegrationCompactCard
              key={integration.id}
              integration={integration}
              onSync={() => triggerSync(integration.id)}
              onDisconnect={() => disconnectIntegration(integration.id)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  // Card variant - fuller display
  return (
    <div className={cn("space-y-2", className)}>
      {integrations.map(integration => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onSync={() => triggerSync(integration.id)}
          onDisconnect={() => disconnectIntegration(integration.id)}
        />
      ))}
    </div>
  );
}

// Small badge for section headers
function IntegrationBadge({ 
  integration, 
  onSync 
}: { 
  integration: SurfacedIntegration;
  onSync: () => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onSync}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-colors",
              "bg-primary/10 hover:bg-primary/20 border border-primary/20"
            )}
          >
            <span className="text-xs">{integration.icon}</span>
            <span className="text-muted-foreground max-w-[60px] truncate">{integration.name}</span>
            {integration.syncStatus === 'active' && (
              <Check size={8} className="text-green-500" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>{integration.name} - {integration.dataPoints} items synced</p>
          <p className="text-muted-foreground">
            Last sync: {integration.lastSyncAt ? format(integration.lastSyncAt, 'MMM d, h:mm a') : 'Never'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact card for horizontal scrolling
function IntegrationCompactCard({
  integration,
  onSync,
  onDisconnect,
}: {
  integration: SurfacedIntegration;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border bg-card/50",
      "min-w-[140px] flex-shrink-0 group"
    )}>
      <span className="text-lg">{integration.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{integration.name}</p>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{integration.dataPoints}</span>
          <Badge 
            variant="secondary" 
            className={cn(
              "h-3 px-1 text-[8px]",
              integration.syncStatus === 'active' && "bg-green-500/10 text-green-600",
              integration.syncStatus === 'error' && "bg-destructive/10 text-destructive"
            )}
          >
            {integration.syncStatus}
          </Badge>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onSync}
      >
        <RefreshCw size={10} />
      </Button>
    </div>
  );
}

// Full card display
function IntegrationCard({
  integration,
  onSync,
  onDisconnect,
}: {
  integration: SurfacedIntegration;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors",
      "hover:bg-card/80"
    )}>
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
        {integration.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">{integration.name}</h4>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-[9px]",
              integration.syncStatus === 'active' && "bg-green-500/10 text-green-600",
              integration.syncStatus === 'error' && "bg-destructive/10 text-destructive"
            )}
          >
            {integration.syncStatus}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
          <span>{integration.dataPoints} items</span>
          <span>•</span>
          <span>{integration.syncFrequency} sync</span>
          {integration.lastSyncAt && (
            <>
              <span>•</span>
              <span>Updated {format(integration.lastSyncAt, 'MMM d, h:mm a')}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onSync}
        >
          <RefreshCw size={12} />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSync}>
              <RefreshCw size={12} className="mr-2" />
              Sync Now
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ExternalLink size={12} className="mr-2" />
              Open in {integration.name}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDisconnect}
              className="text-destructive"
            >
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Quick action buttons for connected integrations
export function IntegrationQuickActions({
  hubType = 'personal',
  className,
  maxItems = 6,
}: {
  hubType?: HubType;
  className?: string;
  maxItems?: number;
}) {
  const { quickActionIntegrations, triggerSync } = useIntegrationSurfaces(hubType);
  
  const visibleIntegrations = quickActionIntegrations.slice(0, maxItems);

  if (visibleIntegrations.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleIntegrations.map(integration => (
        <TooltipProvider key={integration.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => triggerSync(integration.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md",
                  "bg-card border border-border hover:bg-accent transition-colors",
                  "text-xs"
                )}
              >
                <span>{integration.icon}</span>
                <span className="hidden sm:inline">{integration.name}</span>
                {integration.syncStatus === 'active' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{integration.name}</p>
              <p className="text-muted-foreground text-[10px]">{integration.dataPoints} items synced</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
}

// Surface summary for a section
export function IntegrationSurfaceSummary({
  surface,
  hubType = 'personal',
  className,
}: {
  surface: IntegrationSurface;
  hubType?: HubType;
  className?: string;
}) {
  const { getIntegrationsForSurface } = useIntegrationSurfaces(hubType);
  const integrations = getIntegrationsForSurface(surface);

  if (integrations.length === 0) return null;

  const totalDataPoints = integrations.reduce((sum, i) => sum + i.dataPoints, 0);
  const activeCount = integrations.filter(i => i.syncStatus === 'active').length;

  return (
    <div className={cn("flex items-center gap-2 text-[10px] text-muted-foreground", className)}>
      <div className="flex -space-x-1">
        {integrations.slice(0, 3).map(i => (
          <span 
            key={i.id} 
            className="w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center text-xs"
          >
            {i.icon}
          </span>
        ))}
        {integrations.length > 3 && (
          <span className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center text-[8px]">
            +{integrations.length - 3}
          </span>
        )}
      </div>
      <span>{totalDataPoints.toLocaleString()} items</span>
      <span>•</span>
      <span className="text-green-600">{activeCount} active</span>
    </div>
  );
}

export default IntegrationSurfaceWidget;
