import { useState, useRef, KeyboardEvent } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Sparkles, 
  X, 
  Check, 
  Loader2,
  AtSign,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AtlasDraft } from '@/hooks/useCommunications';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (content: string, options?: { useAtlasDraft?: boolean }) => Promise<void>;
  onRequestAtlasDraft: (context: string) => Promise<void>;
  atlasDraft: AtlasDraft | null;
  onClearDraft: () => void;
  onApproveDraft?: (messageId: string) => Promise<boolean>;
  isSending: boolean;
  placeholder?: string;
  compact?: boolean;
}

const QUICK_EMOJIS = ['😊', '👍', '🎉', '❤️', '🔥', '✨', '💪', '🙏'];

export function ChatInput({
  onSend,
  onRequestAtlasDraft,
  atlasDraft,
  onClearDraft,
  isSending,
  placeholder = 'Type a message...',
  compact = false,
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isRequestingDraft, setIsRequestingDraft] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const messageContent = atlasDraft?.content || content;
    if (!messageContent.trim() || isSending) return;

    await onSend(messageContent, { useAtlasDraft: !!atlasDraft });
    setContent('');
    onClearDraft();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRequestDraft = async () => {
    if (!content.trim()) {
      // If no content, use a generic request
      setIsRequestingDraft(true);
      await onRequestAtlasDraft('Help me write a professional response');
      setIsRequestingDraft(false);
    } else {
      setIsRequestingDraft(true);
      await onRequestAtlasDraft(content);
      setIsRequestingDraft(false);
    }
  };

  const handleUseDraft = () => {
    if (atlasDraft) {
      setContent(atlasDraft.content);
      onClearDraft();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      // Focus and set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
  };

  return (
    <div className={cn('border-t border-border', compact ? 'p-2' : 'p-3')}>
      {/* Atlas Draft Preview */}
      {atlasDraft && (
        <div className="mb-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <span className="text-xs font-medium text-primary">Atlas Draft</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleUseDraft}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-destructive"
                onClick={onClearDraft}
              >
                <X size={12} />
              </Button>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{atlasDraft.content}</p>
          {atlasDraft.suggestions && atlasDraft.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {atlasDraft.suggestions.map((suggestion, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-[10px] cursor-pointer hover:bg-accent"
                  onClick={() => setContent(suggestion)}
                >
                  {suggestion.slice(0, 30)}...
                </Badge>
              ))}
            </div>
          )}
          <Button
            size="sm"
            className="mt-2 w-full"
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <Check size={14} className="mr-2" />
            )}
            Send as Draft (Pending Approval)
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'resize-none pr-20',
              compact ? 'min-h-[40px] text-sm' : 'min-h-[60px]'
            )}
            rows={compact ? 1 : 2}
          />
          
          {/* Inline actions */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Smile size={14} className="text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <div className="flex gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className="p-1.5 hover:bg-accent rounded transition-colors text-lg"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Paperclip size={14} className="text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {/* Atlas Draft Button */}
          <Button
            variant="outline"
            size={compact ? 'sm' : 'default'}
            onClick={handleRequestDraft}
            disabled={isRequestingDraft || isSending}
            className="gap-1"
          >
            {isRequestingDraft ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} className="text-primary" />
            )}
            {!compact && <span className="text-xs">Atlas</span>}
          </Button>

          {/* Send Button */}
          <Button
            size={compact ? 'sm' : 'default'}
            onClick={handleSend}
            disabled={(!content.trim() && !atlasDraft) || isSending}
          >
            {isSending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      {!compact && (
        <div className="flex items-center gap-2 mt-2">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
            <AtSign size={12} className="mr-1" />
            Mention
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
            <Hash size={12} className="mr-1" />
            Channel
          </Button>
        </div>
      )}
    </div>
  );
}
