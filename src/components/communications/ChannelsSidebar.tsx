import { Hash, Users, Lock, Megaphone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Channel } from '@/hooks/useCommunications';

interface ChannelsSidebarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  collapsed?: boolean;
  isDMList?: boolean;
  onCreateChannel?: () => void;
}

const CHANNEL_TYPE_ICONS = {
  public: Hash,
  private: Lock,
  direct: Users,
  announcement: Megaphone,
};

export function ChannelsSidebar({
  channels,
  selectedChannel,
  onSelectChannel,
  collapsed = false,
  isDMList = false,
  onCreateChannel,
}: ChannelsSidebarProps) {
  if (collapsed) {
    return (
      <div className="space-y-1">
        {channels.map((channel) => {
          const Icon = CHANNEL_TYPE_ICONS[channel.channel_type] || Hash;
          const isSelected = selectedChannel?.id === channel.id;
          
          return (
            <Button
              key={channel.id}
              variant={isSelected ? 'secondary' : 'ghost'}
              size="icon"
              className="w-8 h-8"
              onClick={() => onSelectChannel(channel)}
            >
              <Icon size={14} />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {channels.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4">
          {isDMList ? 'No direct messages yet' : 'No channels yet'}
        </div>
      ) : (
        channels.map((channel) => {
          const Icon = CHANNEL_TYPE_ICONS[channel.channel_type] || Hash;
          const isSelected = selectedChannel?.id === channel.id;
          
          return (
            <button
              key={channel.id}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors',
                'hover:bg-accent/50',
                isSelected && 'bg-accent text-accent-foreground'
              )}
              onClick={() => onSelectChannel(channel)}
            >
              <Icon size={14} className="shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm">
                {isDMList ? channel.name.replace('Direct Message', 'DM') : channel.name}
              </span>
              {channel.unread_count && channel.unread_count > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 text-[10px]">
                  {channel.unread_count}
                </Badge>
              )}
            </button>
          );
        })
      )}

      {onCreateChannel && !isDMList && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
          onClick={onCreateChannel}
        >
          <Plus size={12} className="mr-2" />
          Add Channel
        </Button>
      )}
    </div>
  );
}
