import { useState, useEffect } from 'react';
import { 
  Plug, RefreshCw, ChevronRight, Database,
  TrendingUp, Clock, Check, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DataConnectorCard } from './DataConnectorCard';
import { useDataConnectors, ConnectorPlatform, CONNECTOR_CONFIGS } from '@/hooks/useDataConnectors';
import { formatDistanceToNow } from 'date-fns';

interface DataConnectorHubProps {
  userId: string | undefined;
  compact?: boolean;
  onConnectionChange?: () => void;
}

export function DataConnectorHub({ userId, compact = false, onConnectionChange }: DataConnectorHubProps) {
  const {
    connectors,
    isLoading,
    isSyncing,
    initializeConnector,
    disconnectConnector,
    triggerSync,
    syncAllConnectors,
    updateSyncFrequency,
    getConnectorStats
  } = useDataConnectors(userId);

  const [connectDialog, setConnectDialog] = useState<{
    open: boolean;
    platform: ConnectorPlatform | null;
  }>({ open: false, platform: null });
  
  const [email, setEmail] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const stats = getConnectorStats();

  const handleConnect = (platform: string) => {
    setConnectDialog({ open: true, platform: platform as ConnectorPlatform });
    setEmail('');
  };

  const handleConfirmConnect = async () => {
    if (!connectDialog.platform || !email) return;

    setIsConnecting(true);
    try {
      await initializeConnector(connectDialog.platform, { email });
      setConnectDialog({ open: false, platform: null });
      onConnectionChange?.();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    await disconnectConnector(connectorId);
    onConnectionChange?.();
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      await syncAllConnectors();
    } finally {
      setIsSyncingAll(false);
    }
  };

  const getConnectorForPlatform = (platform: ConnectorPlatform) => {
    return connectors.find(c => c.platform === platform && c.isActive);
  };

  // Compact view for dashboard/sidebar
  if (compact) {
    return (
      <Card className="bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Plug size={16} className="text-primary" />
              Data Connectors
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSyncAll}
              disabled={isSyncingAll || stats.activeConnectors === 0}
            >
              {isSyncingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-foreground">{stats.activeConnectors}</div>
              <div className="text-xs text-muted-foreground">Connected</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-foreground">{stats.totalItemsSynced.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Items Synced</div>
            </div>
          </div>

          {/* Connected platforms */}
          {stats.activeConnectors > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.platforms.map(platform => {
                const config = CONNECTOR_CONFIGS.find(c => c.platform === platform);
                return config ? (
                  <span 
                    key={platform}
                    className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                    style={{ 
                      backgroundColor: `${config.color}15`,
                      color: config.color
                    }}
                  >
                    <Check size={10} />
                    {config.label}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No connectors active
            </p>
          )}

          {stats.lastSyncAt && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} />
              Last sync {formatDistanceToNow(stats.lastSyncAt, { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Database className="text-primary" size={20} />
            Data Connectors
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your data sources for automatic synchronization
          </p>
        </div>

        {stats.activeConnectors > 0 && (
          <Button 
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            variant="outline"
          >
            {isSyncingAll ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Sync All
              </>
            )}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Connectors</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.activeConnectors}
                  <span className="text-lg text-muted-foreground">/{CONNECTOR_CONFIGS.filter(c => c.available).length}</span>
                </p>
              </div>
              <Plug className="text-primary" size={32} />
            </div>
            <Progress 
              value={(stats.activeConnectors / CONNECTOR_CONFIGS.filter(c => c.available).length) * 100} 
              className="h-1.5 mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items Synced</p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalItemsSynced.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
            {stats.lastSyncAt && (
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Clock size={12} />
                Last sync {formatDistanceToNow(stats.lastSyncAt, { addSuffix: true })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Platforms</p>
                <p className="text-3xl font-bold text-foreground">
                  {CONNECTOR_CONFIGS.length}
                </p>
              </div>
              <Database className="text-muted-foreground" size={32} />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {CONNECTOR_CONFIGS.filter(c => !c.available).length} coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONNECTOR_CONFIGS.map(config => (
          <DataConnectorCard
            key={config.platform}
            config={config}
            connector={getConnectorForPlatform(config.platform)}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSync={triggerSync}
            onUpdateFrequency={updateSyncFrequency}
            isSyncing={isSyncing === getConnectorForPlatform(config.platform)?.id}
          />
        ))}
      </div>

      {/* Connect Dialog */}
      <Dialog open={connectDialog.open} onOpenChange={(open) => setConnectDialog({ open, platform: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Connect {CONNECTOR_CONFIGS.find(c => c.platform === connectDialog.platform)?.label}
            </DialogTitle>
            <DialogDescription>
              Enter your account email to connect this data source. In production, this would redirect to OAuth.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Account Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">What we'll access:</p>
              <ul className="space-y-1">
                {CONNECTOR_CONFIGS.find(c => c.platform === connectDialog.platform)?.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog({ open: false, platform: null })}>
              Cancel
            </Button>
            <Button onClick={handleConfirmConnect} disabled={!email || isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect
                  <ChevronRight size={16} className="ml-1" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
