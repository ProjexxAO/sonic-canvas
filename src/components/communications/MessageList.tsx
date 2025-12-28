import { format, isToday, isYesterday } from 'date-fns';
import { 
  Star, 
  MessageCircle, 
  Mail, 
  Slack, 
  MessageSquare,
  Phone,
  ExternalLink,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Message, CommunicationPlatform } from '@/hooks/useCommunications';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  selectedThread: Message | null;
  onSelectThread: (message: Message) => void;
  onToggleStar: (messageId: string) => void;
  onReply: (message: Message) => void;
}

const PLATFORM_ICONS: Record<CommunicationPlatform, typeof Mail> = {
  internal: MessageSquare,
  gmail: Mail,
  outlook: Mail,
  slack: Slack,
  teams: MessageSquare,
  whatsapp: Phone,
  sms: Phone,
  messenger: MessageCircle,
  other: ExternalLink,
};

const PLATFORM_COLORS: Record<CommunicationPlatform, string> = {
  internal: 'text-primary',
  gmail: 'text-red-500',
  outlook: 'text-blue-500',
  slack: 'text-purple-500',
  teams: 'text-blue-600',
  whatsapp: 'text-green-500',
  sms: 'text-gray-500',
  messenger: 'text-blue-400',
  other: 'text-muted-foreground',
};

const STATUS_ICONS = {
  draft: Clock,
  pending_approval: Sparkles,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
};

function formatMessageDate(date: Date): string {
  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
}

export function MessageList({
  messages,
  isLoading,
  selectedThread,
  onSelectThread,
  onToggleStar,
  onReply,
}: MessageListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Mail size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start a conversation or connect a platform</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border">
        {messages.map((message) => {
          const PlatformIcon = PLATFORM_ICONS[message.platform];
          const StatusIcon = STATUS_ICONS[message.status];
          const isSelected = selectedThread?.id === message.id;
          const senderName = message.sender?.display_name || message.from_address || 'Unknown';
          const initials = senderName.slice(0, 2).toUpperCase();

          return (
            <div
              key={message.id}
              className={cn(
                'p-3 hover:bg-accent/30 cursor-pointer transition-colors',
                isSelected && 'bg-accent/50',
                message.status === 'pending_approval' && 'bg-primary/5 border-l-2 border-primary'
              )}
              onClick={() => onSelectThread(message)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-muted">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-sm truncate">
                        {senderName}
                      </span>
                      <PlatformIcon 
                        size={12} 
                        className={cn('shrink-0', PLATFORM_COLORS[message.platform])} 
                      />
                      {message.drafted_by_atlas && (
                        <Badge variant="outline" className="h-4 text-[9px] gap-1">
                          <Sparkles size={8} />
                          Atlas Draft
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusIcon 
                        size={12} 
                        className={cn(
                          message.status === 'failed' && 'text-destructive',
                          message.status === 'pending_approval' && 'text-primary',
                          message.status === 'read' && 'text-primary'
                        )} 
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatMessageDate(new Date(message.created_at))}
                      </span>
                    </div>
                  </div>

                  {message.subject && (
                    <p className="text-sm font-medium truncate mb-0.5">
                      {message.subject}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.content}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(message.id);
                      }}
                    >
                      <Star 
                        size={12} 
                        className={cn('mr-1', message.is_starred && 'fill-yellow-400 text-yellow-400')} 
                      />
                      Star
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReply(message);
                      }}
                    >
                      <MessageCircle size={12} className="mr-1" />
                      Reply
                    </Button>
                    {message.replies_count && message.replies_count > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {message.replies_count} replies
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
