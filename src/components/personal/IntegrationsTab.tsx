// IntegrationsTab - Context-aware integrations panel for Atlas right panel
// Shows personal integrations in Personal Hub, business integrations in Group/C-Suite

import { useState, useMemo } from 'react';
import { 
  Store, 
  Search, 
  Check, 
  Link,
  Unlink,
  Loader2,
  RefreshCw,
  ChevronRight,
  Plug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIntegrationMarketplace, Integration, IntegrationCategory } from '@/hooks/useIntegrationMarketplace';
import { cn } from '@/lib/utils';

type HubContext = 'personal' | 'group' | 'csuite';

interface IntegrationsTabProps {
  hubContext?: HubContext;
}

// Categories relevant to personal use
const PERSONAL_CATEGORIES: IntegrationCategory[] = [
  'productivity',
  'communication', 
  'storage',
  'calendar',
  'social'
];

// Categories relevant to business/enterprise
const BUSINESS_CATEGORIES: IntegrationCategory[] = [
  'automation', // Prioritize automation tools
  'finance',
  'crm',
  'marketing',
  'development',
  'analytics',
  'ecommerce',
  'hr',
  'project_management',
  'design',
  'ai',
  'security',
  'support',
];

export function IntegrationsTab({ hubContext = 'personal' }: IntegrationsTabProps) {
  const {
    connectedIntegrations,
    searchQuery,
    isConnecting,
    categories,
    filteredIntegrations,
    stats,
    connectIntegration,
    disconnectIntegration,
    triggerSync,
    isConnected,
    setSearchQuery,
    setSelectedCategory,
  } = useIntegrationMarketplace();

  const [activeSection, setActiveSection] = useState<'browse' | 'connected'>('browse');

  // Filter categories based on hub context
  const relevantCategories = useMemo(() => {
    const allowedCategories = hubContext === 'personal' 
      ? PERSONAL_CATEGORIES 
      : BUSINESS_CATEGORIES;
    
    return categories.filter(cat => allowedCategories.includes(cat.id));
  }, [categories, hubContext]);

  // Filter integrations based on context
  const contextIntegrations = useMemo(() => {
    const allowedCategories = hubContext === 'personal'
      ? PERSONAL_CATEGORIES
      : BUSINESS_CATEGORIES;
    
    return filteredIntegrations.filter(i => allowedCategories.includes(i.category));
  }, [filteredIntegrations, hubContext]);

  const contextConnected = useMemo(() => {
    const allowedCategories = hubContext === 'personal'
      ? PERSONAL_CATEGORIES
      : BUSINESS_CATEGORIES;
    
    return connectedIntegrations.filter(i => allowedCategories.includes(i.category));
  }, [connectedIntegrations, hubContext]);

  return (
    <div className="h-full flex flex-col bg-card/90 border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Plug size={14} className="text-primary" />
            <span className="text-xs font-mono uppercase text-muted-foreground">
              {hubContext === 'personal' ? 'Personal' : 'Business'} Integrations
            </span>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            {contextConnected.length} connected
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="pl-8 h-7 text-xs"
          />
        </div>
      </div>

      {/* Section Toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveSection('browse')}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-mono transition-colors",
            activeSection === 'browse' 
              ? "bg-primary/10 text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Browse ({contextIntegrations.length})
        </button>
        <button
          onClick={() => setActiveSection('connected')}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-mono transition-colors",
            activeSection === 'connected' 
              ? "bg-primary/10 text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Connected ({contextConnected.length})
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {activeSection === 'browse' ? (
            <>
              {/* Category Pills */}
              <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-border/50">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="px-2 py-0.5 text-[9px] rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  All
                </button>
                {relevantCategories.slice(0, 5).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="px-2 py-0.5 text-[9px] rounded-full bg-muted hover:bg-muted/80 transition-colors flex items-center gap-1"
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* Integration List */}
              {contextIntegrations.map(integration => (
                <IntegrationRow
                  key={integration.id}
                  integration={integration}
                  isConnected={isConnected(integration.id)}
                  isConnecting={isConnecting}
                  onConnect={() => connectIntegration(integration.id)}
                  onDisconnect={() => disconnectIntegration(integration.id)}
                />
              ))}

              {contextIntegrations.length === 0 && (
                <div className="text-center py-8">
                  <Store size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No integrations found</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Connected Integrations */}
              {contextConnected.map(integration => (
                <Card key={integration.id} className="bg-card/50 border-border">
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{integration.icon}</span>
                        <div>
                          <p className="text-xs font-medium">{integration.name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span>{integration.dataPoints} items</span>
                            <span className={cn(
                              integration.syncStatus === 'active' && "text-green-500",
                              integration.syncStatus === 'error' && "text-destructive"
                            )}>
                              • {integration.syncStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => triggerSync(integration.id)}
                        >
                          <RefreshCw size={10} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => disconnectIntegration(integration.id)}
                        >
                          <Unlink size={10} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {contextConnected.length === 0 && (
                <div className="text-center py-8">
                  <Plug size={24} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No integrations connected</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs mt-1"
                    onClick={() => setActiveSection('browse')}
                  >
                    Browse available
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function IntegrationRow({
  integration,
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect
}: {
  integration: Integration;
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border transition-colors",
      isConnected 
        ? "border-green-500/30 bg-green-500/5" 
        : "border-border bg-card/30 hover:bg-card/50"
    )}>
      <span className="text-lg">{integration.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-xs font-medium truncate">{integration.name}</p>
          {isConnected && <Check size={10} className="text-green-500 flex-shrink-0" />}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{integration.shortDescription}</p>
      </div>
      {isConnected ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px]"
          onClick={onDisconnect}
        >
          <Unlink size={10} className="mr-1" />
          Disconnect
        </Button>
      ) : (
        <Button
          size="sm"
          className="h-6 px-2 text-[10px]"
          onClick={onConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <>
              <Link size={10} className="mr-1" />
              Connect
            </>
          )}
        </Button>
      )}
    </div>
  );
}
