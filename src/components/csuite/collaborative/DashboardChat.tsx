import React, { useState, useRef, useEffect } from 'react';
import { useDashboardChat, DashboardMessage } from '@/hooks/useDashboardChat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Send, MoreVertical, Pencil, Trash2, Reply, AtSign, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardChatProps {
  dashboardId: string;
  userId: string;
  members: Array<{ user_id: string; display_name?: string }>;
}

export function DashboardChat({ dashboardId, userId, members }: DashboardChatProps) {
  const { messages, isLoading, isSending, sendMessage, editMessage, deleteMessage } = useDashboardChat(dashboardId, userId);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyTo, setReplyTo] = useState<DashboardMessage | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[2]);
    }
    return mentions;
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const mentions = extractMentions(newMessage);
    // Convert mention format to plain text for display
    const cleanContent = newMessage.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');

    await sendMessage(cleanContent, {
      mentions,
      replyToId: replyTo?.id,
    });

    setNewMessage('');
    setReplyTo(null);
  };

  const handleEdit = async (messageId: string) => {
    if (!editContent.trim()) return;
    const success = await editMessage(messageId, editContent);
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleDelete = async (messageId: string) => {
    await deleteMessage(messageId);
  };

  const insertMention = (member: { user_id: string; display_name?: string }) => {
    const mention = `@[${member.display_name || 'User'}](${member.user_id})`;
    setNewMessage(prev => prev + mention + ' ');
    setShowMentions(false);
    setMentionSearch('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === '@') {
      setShowMentions(true);
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
      setReplyTo(null);
    }
  };

  const filteredMembers = members.filter(m =>
    m.user_id !== userId &&
    (m.display_name?.toLowerCase().includes(mentionSearch.toLowerCase()) || !mentionSearch)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 group',
                  message.user_id === userId && 'flex-row-reverse'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={message.user_avatar} />
                  <AvatarFallback>{message.user_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>

                <div className={cn(
                  'flex flex-col max-w-[70%]',
                  message.user_id === userId && 'items-end'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{message.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {message.is_edited && (
                      <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                  </div>

                  {message.reply_to && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 mb-1 border-l-2 border-primary">
                      Replying to: {message.reply_to.content.substring(0, 50)}...
                    </div>
                  )}

                  {editingId === message.id ? (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEdit(message.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      'rounded-lg px-3 py-2',
                      message.user_id === userId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )}

                  {/* Message Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={message.user_id === userId ? 'end' : 'start'}>
                        <DropdownMenuItem onClick={() => setReplyTo(message)}>
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        {message.user_id === userId && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setEditingId(message.id);
                              setEditContent(message.content);
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(message.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Replying to <span className="font-medium">{replyTo.user_name}</span>: {replyTo.content.substring(0, 40)}...
          </div>
          <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Mention suggestions */}
      {showMentions && filteredMembers.length > 0 && (
        <div className="px-4 py-2 border-t bg-popover">
          <div className="text-xs text-muted-foreground mb-2">Mention someone</div>
          <div className="flex flex-wrap gap-2">
            {filteredMembers.slice(0, 5).map(member => (
              <Button
                key={member.user_id}
                variant="secondary"
                size="sm"
                onClick={() => insertMention(member)}
                className="h-7"
              >
                <AtSign className="h-3 w-3 mr-1" />
                {member.display_name || 'User'}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={newMessage}
            onChange={e => {
              setNewMessage(e.target.value);
              if (e.target.value.endsWith('@')) {
                setShowMentions(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (use @ to mention)"
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="shrink-0"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
