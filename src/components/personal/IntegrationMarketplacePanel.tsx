import { useState } from 'react';
import { 
  Store, 
  Search, 
  X, 
  Check, 
  ExternalLink,
  RefreshCw,
  Zap,
  Clock,
  Star,
  Filter,
  Grid,
  List,
  Loader2,
  Link,
  Unlink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIntegrationMarketplace, Integration, IntegrationCategory } from '@/hooks/useIntegrationMarketplace';
import { cn } from '@/lib/utils';

interface IntegrationMarketplacePanelProps {
  onRemove?: () => void;
  compact?: boolean;
}

export function IntegrationMarketplacePanel({ onRemove, compact = false }: IntegrationMarketplacePanelProps) {
  const {
    connectedIntegrations,
    searchQuery,
    selectedCategory,
    isConnecting,
    categories,
    filteredIntegrations,
    popularIntegrations,
    stats,
    categoryInfo,
    connectIntegration,
    disconnectIntegration,
    triggerSync,
    isConnected,
    setSearchQuery,
    setSelectedCategory,
  } = useIntegrationMarketplace();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (compact) {
    return (
      <Card className="bg-card/50 border-border relative group">
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          >
            <X size={12} />
          </button>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Store size={14} className="text-primary" />
            Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Available</span>
            <Badge variant="secondary">{stats.totalAvailable}+</Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Connected</span>
            <Badge className="bg-green-500/20 text-green-500">{stats.connected}</Badge>
          </div>
          <Button size="sm" variant="outline" className="w-full mt-2">
            <Store size={12} className="mr-1" />
            Browse All
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background relative group">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
        >
          <X size={14} />
        </button>
      )}

      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Integration Marketplace</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{stats.totalAvailable}+ apps</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations..."
              className="pl-9 h-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List size={14} /> : <Grid size={14} />}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="browse" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="browse" className="text-xs">Browse</TabsTrigger>
          <TabsTrigger value="connected" className="text-xs">
            Connected ({stats.connected})
          </TabsTrigger>
          <TabsTrigger value="popular" className="text-xs">Popular</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="flex-1 overflow-hidden flex">
          {/* Category sidebar */}
          <div className="w-40 border-r border-border p-2 overflow-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                selectedCategory === 'all' ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              All ({stats.totalAvailable})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5",
                  selectedCategory === cat.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <span>{cat.icon}</span>
                <span className="flex-1 truncate">{cat.name}</span>
                <span className="text-muted-foreground">{cat.count}</span>
              </button>
            ))}
          </div>

          {/* Integration grid */}
          <ScrollArea className="flex-1 p-4">
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-2 lg:grid-cols-3 gap-3" 
                : "space-y-2"
            )}>
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  isConnected={isConnected(integration.id)}
                  isConnecting={isConnecting}
                  viewMode={viewMode}
                  onConnect={() => connectIntegration(integration.id)}
                  onDisconnect={() => disconnectIntegration(integration.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="connected" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            {connectedIntegrations.length === 0 ? (
              <div className="text-center py-8">
                <Store size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No integrations connected yet</p>
                <p className="text-xs text-muted-foreground mt-1">Browse and connect apps to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedIntegrations.map((integration) => (
                  <Card key={integration.id} className="bg-card/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{integration.icon}</div>
                          <div>
                            <h4 className="text-sm font-medium">{integration.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{integration.dataPoints} items synced</span>
                              <span>•</span>
                              <span className={cn(
                                integration.syncStatus === 'active' && "text-green-500",
                                integration.syncStatus === 'error' && "text-destructive"
                              )}>
                                {integration.syncStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => triggerSync(integration.id)}
                          >
                            <RefreshCw size={12} className="mr-1" />
                            Sync
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnectIntegration(integration.id)}
                            className="text-destructive"
                          >
                            <Unlink size={12} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="popular" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {popularIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  isConnected={isConnected(integration.id)}
                  isConnecting={isConnecting}
                  viewMode="grid"
                  onConnect={() => connectIntegration(integration.id)}
                  onDisconnect={() => disconnectIntegration(integration.id)}
                  showPopularity
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IntegrationCard({
  integration,
  isConnected,
  isConnecting,
  viewMode,
  onConnect,
  onDisconnect,
  showPopularity = false,
}: {
  integration: Integration;
  isConnected: boolean;
  isConnecting: boolean;
  viewMode: 'grid' | 'list';
  onConnect: () => void;
  onDisconnect: () => void;
  showPopularity?: boolean;
}) {
  if (viewMode === 'list') {
    return (
      <Card className="bg-card/50 border-border">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl">{integration.icon}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">{integration.name}</h4>
                  <Badge variant="outline" className="text-[10px]">{integration.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{integration.shortDescription}</p>
              </div>
            </div>
            {isConnected ? (
              <Button variant="outline" size="sm" onClick={onDisconnect}>
                <Check size={12} className="mr-1 text-green-500" />
                Connected
              </Button>
            ) : (
              <Button size="sm" onClick={onConnect} disabled={isConnecting}>
                {isConnecting ? (
                  <Loader2 size={12} className="mr-1 animate-spin" />
                ) : (
                  <Link size={12} className="mr-1" />
                )}
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-card/50 border-border hover:border-primary/50 transition-colors",
      isConnected && "border-green-500/50 bg-green-500/5"
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="text-2xl">{integration.icon}</div>
          {isConnected && (
            <Badge className="bg-green-500/20 text-green-500 text-[10px]">
              <Check size={10} className="mr-0.5" />
              Connected
            </Badge>
          )}
        </div>

        <h4 className="text-sm font-medium">{integration.name}</h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {integration.shortDescription}
        </p>

        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline" className="text-[9px]">{integration.authType}</Badge>
          <Badge variant="outline" className="text-[9px]">{integration.pricing}</Badge>
        </div>

        {showPopularity && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Star size={10} className="text-yellow-500" />
            <span>{integration.popularity}% popularity</span>
          </div>
        )}

        <div className="mt-3">
          {isConnected ? (
            <Button variant="outline" size="sm" className="w-full" onClick={onDisconnect}>
              <Unlink size={12} className="mr-1" />
              Disconnect
            </Button>
          ) : (
            <Button size="sm" className="w-full" onClick={onConnect} disabled={isConnecting}>
              {isConnecting ? (
                <Loader2 size={12} className="mr-1 animate-spin" />
              ) : (
                <Link size={12} className="mr-1" />
              )}
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
