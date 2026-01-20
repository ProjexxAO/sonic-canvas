import React, { useState } from 'react';
import { useItemComments, ItemComment } from '@/hooks/useItemComments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Send, MoreVertical, Pencil, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ItemCommentsPanelProps {
  sharedItemId: string | null;
  userId: string;
  itemTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members?: Array<{ user_id: string; display_name?: string }>;
}

export function ItemCommentsPanel({ 
  sharedItemId, 
  userId, 
  itemTitle,
  open, 
  onOpenChange,
  members = []
}: ItemCommentsPanelProps) {
  const { comments, isLoading, isSending, addComment, editComment, deleteComment } = useItemComments(sharedItemId, userId);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    // Extract mentions from content
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newComment)) !== null) {
      mentions.push(match[2]);
    }
    
    const cleanContent = newComment.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
    
    await addComment(cleanContent, mentions);
    setNewComment('');
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    const success = await editComment(commentId, editContent);
    if (success) {
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
            {itemTitle && (
              <span className="text-sm font-normal text-muted-foreground truncate">
                on {itemTitle}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={comment.user_avatar} />
                  <AvatarFallback>{comment.user_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.user_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                    {comment.is_edited && (
                      <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                  </div>

                  {editingId === comment.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEdit(comment.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>

                {comment.user_id === userId && editingId !== comment.id && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(comment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[44px] max-h-24 resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSending}
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
      </SheetContent>
    </Sheet>
  );
}
