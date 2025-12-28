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
  ExternalLink,
  ChevronRight
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
import { CommunicationPlatform } from '@/hooks/useCommunications';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface PlatformConnection {
  platform: CommunicationPlatform;
  email: string;
  connectedAt: Date;
  lastSyncAt: Date;
  isActive: boolean;
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
  messageCount: number;
  errorMessage?: string;
}

interface PlatformManagementPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: PlatformConnection[];
  onDisconnect: (platform: CommunicationPlatform) => void;
  onSync: (platform: CommunicationPlatform) => void;
  onToggleActive: (platform: CommunicationPlatform, active: boolean) => void;
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

function SyncStatusBadge({ status }: { status: PlatformConnection['syncStatus'] }) {
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
  const config = PLATFORM_CONFIG[connection.platform];
  
  if (!config) return null;

  const Icon = config.icon;

  const handleSync = async () => {
    setIsSyncing(true);
    onSync();
    // Simulate sync delay
    setTimeout(() => {
      setIsSyncing(false);
      toast.success(`${config.name} synced successfully`);
    }, 2000);
  };

  return (
    <>
      <div className={cn(
        'p-4 rounded-lg border border-border',
        !connection.isActive && 'opacity-60'
      )}>
        <div className="flex items-start gap-3">
          <div className={cn('p-2.5 rounded-lg', config.bgColor)}>
            <Icon size={20} className={config.color} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{config.name}</span>
              <SyncStatusBadge status={isSyncing ? 'syncing' : connection.syncStatus} />
            </div>
            
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {connection.email}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                Last sync: {formatDistanceToNow(connection.lastSyncAt, { addSuffix: true })}
              </span>
              <span>{connection.messageCount.toLocaleString()} messages</span>
            </div>

            {connection.syncStatus === 'error' && connection.errorMessage && (
              <p className="text-[11px] text-destructive mt-2 flex items-center gap-1">
                <AlertCircle size={10} />
                {connection.errorMessage}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={connection.isActive}
              onCheckedChange={onToggleActive}
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
            disabled={isSyncing || !connection.isActive}
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
              This will remove the connection to {connection.email}. Your synced messages will remain 
              in Atlas, but no new messages will be imported. You can reconnect at any time.
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
  const activeConnections = connections.filter(c => c.isActive);
  const totalMessages = connections.reduce((sum, c) => sum + c.messageCount, 0);

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
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-semibold">{connections.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Platforms</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-semibold">{activeConnections.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-semibold">{totalMessages.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Messages</div>
            </div>
          </div>

          {/* Connections List */}
          {connections.length > 0 ? (
            <div className="space-y-3">
              {connections.map((connection) => (
                <ConnectionCard
                  key={connection.platform}
                  connection={connection}
                  onDisconnect={() => onDisconnect(connection.platform)}
                  onSync={() => onSync(connection.platform)}
                  onToggleActive={(active) => onToggleActive(connection.platform, active)}
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
                connections.forEach(c => onSync(c.platform));
                toast.success('Syncing all platforms...');
              }}
            >
              <RefreshCw size={14} className="mr-2" />
              Sync All Platforms
            </Button>
          )}

          {/* Help Link */}
          <div className="pt-4 border-t border-border">
            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
              <div>
                <p className="text-sm font-medium">Need help connecting?</p>
                <p className="text-xs text-muted-foreground">View our integration guide</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Export type for use in parent components
export type { PlatformConnection };
