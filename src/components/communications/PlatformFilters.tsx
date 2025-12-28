import { useState } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Phone,
  MessageCircle,
  Check,
  Plus,
  Settings,
  Trash2,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CommunicationPlatform, PlatformConnection } from '@/hooks/useCommunications';
import { ConnectPlatformDialog } from './ConnectPlatformDialog';
import { PlatformManagementPanel, PlatformConnection as ManagedConnection } from './PlatformManagementPanel';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface PlatformFiltersProps {
  platformFilter: CommunicationPlatform | 'all';
  setPlatformFilter: (platform: CommunicationPlatform | 'all') => void;
  platformConnections: PlatformConnection[];
  onConnectionChange?: () => void;
}

interface PlatformConfig {
  id: CommunicationPlatform | 'all';
  label: string;
  icon: typeof Mail;
  color: string;
  bgColor: string;
}

const PLATFORMS: PlatformConfig[] = [
  { id: 'all', label: 'All', icon: MessageSquare, color: 'text-foreground', bgColor: 'bg-muted' },
  { id: 'internal', label: 'Internal', icon: MessageSquare, color: 'text-primary', bgColor: 'bg-primary/10' },
  { id: 'gmail', label: 'Gmail', icon: Mail, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { id: 'outlook', label: 'Outlook', icon: Mail, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 'slack', label: 'Slack', icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { id: 'teams', label: 'Teams', icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
  { id: 'whatsapp', label: 'WhatsApp', icon: Phone, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { id: 'sms', label: 'SMS', icon: Phone, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  { id: 'messenger', label: 'Messenger', icon: MessageCircle, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
];

// Mock connected accounts for demo
interface MockConnection {
  platform: CommunicationPlatform;
  email: string;
  connectedAt: Date;
}

export function PlatformFilters({
  platformFilter,
  setPlatformFilter,
  platformConnections,
  onConnectionChange,
}: PlatformFiltersProps) {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [managementPanelOpen, setManagementPanelOpen] = useState(false);
  const [mockConnections, setMockConnections] = useState<MockConnection[]>([]);

  const isConnected = (platformId: CommunicationPlatform): boolean => {
    if (platformId === 'internal') return true;
    // Check both real connections and mock connections
    const hasRealConnection = platformConnections.some(c => c.platform === platformId && c.is_active);
    const hasMockConnection = mockConnections.some(c => c.platform === platformId);
    return hasRealConnection || hasMockConnection;
  };

  const getConnectionEmail = (platformId: CommunicationPlatform): string | undefined => {
    const mockConn = mockConnections.find(c => c.platform === platformId);
    if (mockConn) return mockConn.email;
    const realConn = platformConnections.find(c => c.platform === platformId && c.is_active);
    return realConn?.account_email || undefined;
  };

  const handleConnect = (platform: CommunicationPlatform, email: string) => {
    setMockConnections(prev => [
      ...prev,
      { platform, email, connectedAt: new Date() }
    ]);
    onConnectionChange?.();
  };

  const handleDisconnect = (platformId: CommunicationPlatform) => {
    setMockConnections(prev => prev.filter(c => c.platform !== platformId));
    toast.success(`Disconnected from ${PLATFORMS.find(p => p.id === platformId)?.label}`);
    onConnectionChange?.();
  };

  // Convert mock connections to managed connections format for the panel
  const managedConnections: ManagedConnection[] = mockConnections.map(conn => ({
    platform: conn.platform,
    email: conn.email,
    connectedAt: conn.connectedAt,
    lastSyncAt: new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
    isActive: true,
    syncStatus: 'synced' as const,
    messageCount: Math.floor(Math.random() * 500) + 50,
  }));

  const handleSync = (platform: CommunicationPlatform) => {
    // In a real implementation, this would trigger a sync
    console.log('Syncing platform:', platform);
  };

  const handleToggleActive = (platform: CommunicationPlatform, active: boolean) => {
    // In a real implementation, this would toggle the connection
    toast.success(`${PLATFORMS.find(p => p.id === platform)?.label} ${active ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Platforms
        </div>
        {mockConnections.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={() => setManagementPanelOpen(true)}
          >
            <Sliders size={10} className="text-muted-foreground" />
          </Button>
        )}
      </div>
      
      {PLATFORMS.map((platform) => {
        const Icon = platform.icon;
        const isActive = platformFilter === platform.id;
        const connected = platform.id === 'all' || isConnected(platform.id as CommunicationPlatform);
        const connectionEmail = platform.id !== 'all' && platform.id !== 'internal' 
          ? getConnectionEmail(platform.id as CommunicationPlatform) 
          : undefined;

        return (
          <div key={platform.id} className="group relative">
            <button
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors',
                'hover:bg-accent/50',
                isActive && 'bg-accent',
                !connected && platform.id !== 'all' && 'opacity-50'
              )}
              onClick={() => setPlatformFilter(platform.id as any)}
            >
              <div className={cn('p-1 rounded', platform.bgColor)}>
                <Icon size={12} className={platform.color} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs block">{platform.label}</span>
                {connectionEmail && (
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {connectionEmail}
                  </span>
                )}
              </div>
              {connected && platform.id !== 'all' && platform.id !== 'internal' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Settings size={10} className="text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDisconnect(platform.id as CommunicationPlatform)}
                    >
                      <Trash2 size={12} className="mr-2" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {connected && platform.id !== 'all' && platform.id !== 'internal' && (
                <Check size={10} className="text-green-500 group-hover:hidden" />
              )}
              {!connected && platform.id !== 'all' && platform.id !== 'internal' && (
                <Plus size={10} className="text-muted-foreground" />
              )}
            </button>
          </div>
        );
      })}

      <div className="pt-2 mt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground"
          onClick={() => setConnectDialogOpen(true)}
        >
          <Plus size={12} className="mr-2" />
          Connect Platform
        </Button>
        
        {mockConnections.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground mt-1"
            onClick={() => setManagementPanelOpen(true)}
          >
            <Sliders size={12} className="mr-2" />
            Manage Connections
          </Button>
        )}
      </div>

      <ConnectPlatformDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        onConnect={handleConnect}
      />

      <PlatformManagementPanel
        open={managementPanelOpen}
        onOpenChange={setManagementPanelOpen}
        connections={managedConnections}
        onDisconnect={handleDisconnect}
        onSync={handleSync}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
