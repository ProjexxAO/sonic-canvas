import { useState } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Phone,
  MessageCircle,
  Settings,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { CommunicationPlatform, PlatformConnection } from '@/hooks/useCommunications';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PlatformManagementPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: PlatformConnection[];
  onDisconnect: (connectionId: string) => Promise<void>;
  onSync: (connectionId: string) => Promise<void>;
  onToggleActive: (connectionId: string, active: boolean) => Promise<void>;
}

interface PlatformConfig {
  id: CommunicationPlatform;
  name: string;
  icon: typeof Mail;
  color: string;
  bgColor: string;
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  gmail: { id: 'gmail', name: 'Gmail', icon: Mail, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  outlook: { id: 'outlook', name: 'Outlook', icon: Mail, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  slack: { id: 'slack', name: 'Slack', icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  teams: { id: 'teams', name: 'Teams', icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
  whatsapp: { id: 'whatsapp', name: 'WhatsApp', icon: Phone, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  sms: { id: 'sms', name: 'SMS', icon: Phone, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  messenger: { id: 'messenger', name: 'Messenger', icon: MessageCircle, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
};

function getSyncStatus(connection: PlatformConnection): 'synced' | 'syncing' | 'error' | 'pending' {
  if (!connection.is_active) return 'pending';
  if (!connection.last_sync_at) return 'pending';
  // Check if last sync was more than 1 hour ago
  const lastSync = new Date(connection.last_sync_at);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (lastSync < hourAgo) return 'pending';
  return 'synced';
}

function SyncStatusBadge({ status }: { status: 'synced' | 'syncing' | 'error' | 'pending' }) {
  const config = {
    synced: { label: 'Synced', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    syncing: { label: 'Syncing...', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    error: { label: 'Error', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  };

  return (
    <Badge variant="outline" className={cn('text-[10px] font-medium', config[status].className)}>
      {status === 'syncing' && <RefreshCw size={10} className="mr-1 animate-spin" />}
      {status === 'synced' && <CheckCircle2 size={10} className="mr-1" />}
      {status === 'error' && <AlertCircle size={10} className="mr-1" />}
      {status === 'pending' && <Clock size={10} className="mr-1" />}
      {config[status].label}
    </Badge>
  );
}

function ConnectionCard({ 
  connection, 
  onDisconnect, 
  onSync, 
  onToggleActive 
}: { 
  connection: PlatformConnection;
  onDisconnect: () => void;
  onSync: () => void;
  onToggleActive: (active: boolean) => void;
}) {
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const config = PLATFORM_CONFIG[connection.platform];
  const syncStatus = getSyncStatus(connection);
  
  if (!config) return null;

  const Icon = config.icon;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
      toast.success(`${config.name} synced successfully`);
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleActive = async (active: boolean) => {
    setIsTogglingActive(true);
    try {
      await onToggleActive(active);
    } finally {
      setIsTogglingActive(false);
    }
  };

  return (
    <>
      <div className={cn(
        'p-4 rounded-lg border border-border',
        !connection.is_active && 'opacity-60'
      )}>
        <div className="flex items-start gap-3">
          <div className={cn('p-2.5 rounded-lg', config.bgColor)}>
            <Icon size={20} className={config.color} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{connection.account_name || config.name}</span>
              <SyncStatusBadge status={isSyncing ? 'syncing' : syncStatus} />
            </div>
            
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {connection.account_email || 'No email configured'}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
              {connection.last_sync_at && (
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  Last sync: {formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={10} />
                Connected: {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={connection.is_active}
              onCheckedChange={handleToggleActive}
              disabled={isTogglingActive}
              className="scale-75"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs flex-1"
            onClick={handleSync}
            disabled={isSyncing || !connection.is_active}
          >
            <RefreshCw size={12} className={cn('mr-1.5', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs"
          >
            <Settings size={12} className="mr-1.5" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => setShowDisconnectDialog(true)}
          >
            <Trash2 size={12} className="mr-1.5" />
            Disconnect
          </Button>
        </div>
      </div>

      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {config.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to {connection.account_email || 'this account'}. 
              Your synced messages will remain in Atlas, but no new messages will be imported. 
              You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDisconnect();
                setShowDisconnectDialog(false);
              }}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PlatformManagementPanel({
  open,
  onOpenChange,
  connections,
  onDisconnect,
  onSync,
  onToggleActive,
}: PlatformManagementPanelProps) {
  const activeConnections = connections.filter(c => c.is_active);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Connected Platforms</SheetTitle>
          <SheetDescription>
            Manage your email and messaging integrations
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-semibold">{connections.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Platforms</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-semibold">{activeConnections.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</div>
            </div>
          </div>

          {/* Connections List */}
          {connections.length > 0 ? (
            <div className="space-y-3">
              {connections.map((connection) => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onDisconnect={() => onDisconnect(connection.id)}
                  onSync={() => onSync(connection.id)}
                  onToggleActive={(active) => onToggleActive(connection.id, active)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-muted/50 inline-flex mb-3">
                <Mail size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No platforms connected yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Connect Gmail or Outlook to start syncing messages
              </p>
            </div>
          )}

          {/* Sync All Button */}
          {connections.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                connections.forEach(c => onSync(c.id));
                toast.success('Syncing all platforms...');
              }}
            >
              <RefreshCw size={14} className="mr-2" />
              Sync All Platforms
            </Button>
          )}

          {/* Help Link */}
          <div className="pt-4 border-t border-border">
            <button 
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
              onClick={() => window.open('https://docs.lovable.dev/features/cloud', '_blank')}
            >
              <div>
                <p className="text-sm font-medium">Need help connecting?</p>
                <p className="text-xs text-muted-foreground">View our integration guide</p>
              </div>
              <ExternalLink size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
