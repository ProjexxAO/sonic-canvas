import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Smile, Reply, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Message, AtlasDraft } from '@/hooks/useCommunications';
import { ChatInput } from './ChatInput';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
  rootMessage: Message;
  onClose: () => void;
  fetchReplies: (threadRootId: string) => Promise<Message[]>;
  onSendReply: (content: string) => Promise<void>;
  onAddReaction: (messageId: string, emoji: string) => Promise<boolean>;
  onRemoveReaction: (messageId: string, emoji: string) => Promise<boolean>;
  atlasDraft: AtlasDraft | null;
  onRequestAtlasDraft: (context: string) => Promise<void>;
  onClearDraft: () => void;
  isSending: boolean;
}

const QUICK_REACTIONS = ['👍', '❤️', '😊', '🎉', '👏', '🔥', '✅', '👀'];

export function MessageThread({
  rootMessage,
  onClose,
  fetchReplies,
  onSendReply,
  onAddReaction,
  onRemoveReaction,
  atlasDraft,
  onRequestAtlasDraft,
  onClearDraft,
  isSending,
}: MessageThreadProps) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(true);

  useEffect(() => {
    const loadReplies = async () => {
      setIsLoadingReplies(true);
      const data = await fetchReplies(rootMessage.id);
      setReplies(data);
      setIsLoadingReplies(false);
    };
    loadReplies();
  }, [rootMessage.id, fetchReplies]);

  const allMessages = [rootMessage, ...replies];

  const handleReaction = async (messageId: string, emoji: string) => {
    // Check if user already reacted with this emoji
    const message = allMessages.find(m => m.id === messageId);
    const existingReaction = message?.reactions?.find(
      r => r.emoji === emoji // In real app, also check r.user_id
    );

    if (existingReaction) {
      await onRemoveReaction(messageId, emoji);
    } else {
      await onAddReaction(messageId, emoji);
    }
  };

  const handleSendReply = async (content: string) => {
    await onSendReply(content);
    // Refresh replies
    const updatedReplies = await fetchReplies(rootMessage.id);
    setReplies(updatedReplies);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-border px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Reply size={16} className="text-muted-foreground" />
          <span className="font-medium text-sm">Thread</span>
          <span className="text-xs text-muted-foreground">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {allMessages.map((message, index) => {
            const senderName = message.sender?.display_name || message.from_address || 'You';
            const initials = senderName.slice(0, 2).toUpperCase();
            const isRootMessage = index === 0;

            return (
              <div
                key={message.id}
                className={cn(
                  'group',
                  isRootMessage && 'pb-4 border-b border-border'
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-muted">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{senderName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>

                    {message.subject && isRootMessage && (
                      <p className="font-medium mb-1">{message.subject}</p>
                    )}

                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(
                          message.reactions.reduce((acc, r) => {
                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-xs hover:bg-accent/80 transition-colors"
                            onClick={() => handleReaction(message.id, emoji)}
                          >
                            <span>{emoji}</span>
                            <span>{count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action bar */}
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Smile size={14} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="start">
                          <div className="flex gap-1">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                className="p-1.5 hover:bg-accent rounded transition-colors text-lg"
                                onClick={() => handleReaction(message.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoadingReplies && (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Reply Input */}
      <ChatInput
        onSend={handleSendReply}
        onRequestAtlasDraft={() => onRequestAtlasDraft(`Reply to: ${rootMessage.content.slice(0, 100)}`)}
        atlasDraft={atlasDraft}
        onClearDraft={onClearDraft}
        isSending={isSending}
        placeholder="Reply to thread..."
        compact
      />
    </div>
  );
}
