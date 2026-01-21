import { 
  Mail, Cloud, Calendar, MessageSquare, 
  RefreshCw, Settings, Unlink, Check, 
  AlertCircle, Clock, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DataConnector, ConnectorConfig, SyncFrequency } from '@/hooks/useDataConnectors';
import { formatDistanceToNow } from 'date-fns';

interface DataConnectorCardProps {
  connector?: DataConnector;
  config: ConnectorConfig;
  onConnect: (platform: string) => void;
  onDisconnect: (connectorId: string) => void;
  onSync: (connectorId: string) => void;
  onUpdateFrequency: (connectorId: string, frequency: SyncFrequency) => void;
  isSyncing: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
  mail: Mail,
  cloud: Cloud,
  calendar: Calendar,
  'message-square': MessageSquare
};

const FREQUENCY_OPTIONS: { value: SyncFrequency; label: string }[] = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Every hour' },
  { value: 'daily', label: 'Once daily' },
  { value: 'manual', label: 'Manual only' }
];

export function DataConnectorCard({
  connector,
  config,
  onConnect,
  onDisconnect,
  onSync,
  onUpdateFrequency,
  isSyncing
}: DataConnectorCardProps) {
  const IconComponent = ICON_MAP[config.icon] || Cloud;
  const isConnected = connector?.isActive;
  const isAvailable = config.available;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200",
      isConnected && "ring-1 ring-primary/30",
      !isAvailable && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <IconComponent 
              size={24} 
              style={{ color: config.color }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{config.label}</h3>
              {isConnected && (
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                  <Check size={10} className="mr-1" />
                  Connected
                </Badge>
              )}
              {connector?.status === 'error' && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle size={10} className="mr-1" />
                  Error
                </Badge>
              )}
              {!isAvailable && (
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
              {config.description}
            </p>

            {isConnected && connector && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {connector.lastSyncAt 
                    ? `Synced ${formatDistanceToNow(connector.lastSyncAt, { addSuffix: true })}`
                    : 'Never synced'}
                </span>
                <span>{connector.itemsSynced.toLocaleString()} items</span>
              </div>
            )}

            {isConnected && connector?.accountEmail && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {connector.accountEmail}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isConnected && connector ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSync(connector.id)}
                  disabled={isSyncing}
                  className="h-8"
                >
                  {isSyncing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Settings size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Sync Frequency
                    </div>
                    {FREQUENCY_OPTIONS.map(option => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onUpdateFrequency(connector.id, option.value)}
                        className={cn(
                          connector.syncFrequency === option.value && "bg-accent"
                        )}
                      >
                        {option.label}
                        {connector.syncFrequency === option.value && (
                          <Check size={12} className="ml-auto" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDisconnect(connector.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Unlink size={14} className="mr-2" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => onConnect(config.platform)}
                disabled={!isAvailable}
                className="h-8"
              >
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* Features */}
        {!isConnected && isAvailable && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
            {config.features.slice(0, 4).map(feature => (
              <span 
                key={feature}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
