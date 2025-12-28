import { 
  Mail, 
  MessageSquare, 
  Phone,
  MessageCircle,
  ExternalLink,
  Check,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CommunicationPlatform, PlatformConnection } from '@/hooks/useCommunications';

interface PlatformFiltersProps {
  platformFilter: CommunicationPlatform | 'all';
  setPlatformFilter: (platform: CommunicationPlatform | 'all') => void;
  platformConnections: PlatformConnection[];
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

export function PlatformFilters({
  platformFilter,
  setPlatformFilter,
  platformConnections,
}: PlatformFiltersProps) {
  const isConnected = (platformId: CommunicationPlatform): boolean => {
    if (platformId === 'internal') return true;
    return platformConnections.some(c => c.platform === platformId && c.is_active);
  };

  return (
    <div className="space-y-1">
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
        Platforms
      </div>
      
      {PLATFORMS.map((platform) => {
        const Icon = platform.icon;
        const isActive = platformFilter === platform.id;
        const connected = platform.id === 'all' || isConnected(platform.id as CommunicationPlatform);

        return (
          <button
            key={platform.id}
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
            <span className="flex-1 text-xs">{platform.label}</span>
            {connected && platform.id !== 'all' && platform.id !== 'internal' && (
              <Check size={10} className="text-green-500" />
            )}
            {!connected && platform.id !== 'all' && platform.id !== 'internal' && (
              <Plus size={10} className="text-muted-foreground" />
            )}
          </button>
        );
      })}

      <div className="pt-2 mt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground"
        >
          <Plus size={12} className="mr-2" />
          Connect Platform
        </Button>
      </div>
    </div>
  );
}
