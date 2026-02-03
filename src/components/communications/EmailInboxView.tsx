// Full Email Inbox View - inbox, sent, drafts, trash with full CRUD
import { useState, useMemo } from 'react';
import {
  Mail,
  Send as SendIcon,
  File,
  Trash2,
  Star,
  Archive,
  RefreshCw,
  Search,
  MoreHorizontal,
  Pencil,
  Reply,
  ReplyAll,
  Forward,
  Loader2,
  Inbox,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/hooks/useCommunications';
import { EmailComposerDialog, type ComposeMode } from './EmailComposerDialog';

type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'starred' | 'trash';

interface EmailInboxViewProps {
  userId: string | undefined;
  messages: Message[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function EmailInboxView({
  userId,
  messages,
  isLoading,
  onRefresh,
}: EmailInboxViewProps) {
  const [activeFolder, setActiveFolder] = useState<EmailFolder>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode>('new');
  const [editDraftId, setEditDraftId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter messages by folder
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    switch (activeFolder) {
      case 'inbox':
        filtered = messages.filter(m => m.is_incoming && m.status !== 'draft');
        break;
      case 'sent':
        filtered = messages.filter(m => !m.is_incoming && m.status === 'sent');
        break;
      case 'drafts':
        filtered = messages.filter(m => m.status === 'draft' || m.status === 'pending_approval');
        break;
      case 'starred':
        filtered = messages.filter(m => m.is_starred);
        break;
      case 'trash':
        // Would need a separate trash flag in DB
        filtered = [];
        break;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.content?.toLowerCase().includes(query) ||
        m.subject?.toLowerCase().includes(query) ||
        m.from_address?.toLowerCase().includes(query) ||
        m.to_addresses?.some(a => a.toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [messages, activeFolder, searchQuery]);

  const folders: { id: EmailFolder; label: string; icon: typeof Mail; count?: number }[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: messages.filter(m => m.is_incoming).length },
    { id: 'sent', label: 'Sent', icon: SendIcon, count: messages.filter(m => !m.is_incoming && m.status === 'sent').length },
    { id: 'drafts', label: 'Drafts', icon: File, count: messages.filter(m => m.status === 'draft' || m.status === 'pending_approval').length },
    { id: 'starred', label: 'Starred', icon: Star, count: messages.filter(m => m.is_starred).length },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
  ];

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMessages.map(m => m.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleCompose = (mode: ComposeMode = 'new', message?: Message) => {
    setComposeMode(mode);
    setSelectedMessage(message || null);
    setEditDraftId(null);
    setComposerOpen(true);
  };

  const handleEditDraft = (draft: Message) => {
    setComposeMode('new');
    setSelectedMessage(null);
    setEditDraftId(draft.id);
    setComposerOpen(true);
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const client = supabase as any;
      const { error } = await client
        .from('communication_messages')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`Deleted ${selectedIds.size} message(s)`);
      setSelectedIds(new Set());
      onRefresh();
    } catch (error) {
      console.error('Error deleting messages:', error);
      toast.error('Failed to delete messages');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleStar = async (messageId: string, currentlyStarred: boolean) => {
    try {
      const client = supabase as any;
      await client
        .from('communication_messages')
        .update({ is_starred: !currentlyStarred })
        .eq('id', messageId);

      onRefresh();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const handleArchive = async () => {
    // Would implement archive functionality
    toast.info('Archive functionality coming soon');
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-48 border-r flex flex-col">
        <div className="p-3">
          <Button
            className="w-full gap-2"
            onClick={() => handleCompose('new')}
          >
            <Pencil size={14} />
            Compose
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  activeFolder === folder.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <folder.icon size={14} />
                <span className="flex-1 text-left">{folder.label}</span>
                {folder.count !== undefined && folder.count > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {folder.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 border-b px-4 flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size > 0 && selectedIds.size === filteredMessages.length}
            onCheckedChange={handleSelectAll}
          />

          {selectedIds.size > 0 ? (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchive}
                className="h-8"
              >
                <Archive size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-8 text-destructive hover:text-destructive"
              >
                <Trash2 size={14} />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8"
              >
                <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8">
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Mark all as read</DropdownMenuItem>
                  <DropdownMenuItem>Select all</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <div className="flex-1" />

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-64 pl-8 text-sm"
            />
          </div>
        </div>

        {/* Message List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Mail size={48} className="mb-4 opacity-30" />
              <p className="text-sm">No messages in {activeFolder}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMessages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors',
                    selectedIds.has(message.id) && 'bg-primary/5'
                  )}
                >
                  <Checkbox
                    checked={selectedIds.has(message.id)}
                    onCheckedChange={() => handleSelectOne(message.id)}
                    onClick={(e) => e.stopPropagation()}
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(message.id, message.is_starred);
                    }}
                    className="text-muted-foreground hover:text-amber-500"
                  >
                    <Star
                      size={14}
                      className={cn(message.is_starred && 'fill-amber-500 text-amber-500')}
                    />
                  </button>

                  <div
                    className="flex-1 min-w-0"
                    onClick={() => {
                      if (activeFolder === 'drafts') {
                        handleEditDraft(message);
                      } else {
                        setSelectedMessage(message);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {message.is_incoming
                          ? message.from_address || 'Unknown'
                          : message.to_addresses?.join(', ') || 'No recipient'}
                      </span>
                      {message.status === 'draft' && (
                        <Badge variant="secondary" className="text-[10px] h-4">
                          Draft
                        </Badge>
                      )}
                      {message.status === 'pending_approval' && (
                        <Badge variant="outline" className="text-[10px] h-4 border-amber-500 text-amber-500">
                          Pending
                        </Badge>
                      )}
                      {message.drafted_by_atlas && (
                        <Badge variant="outline" className="text-[10px] h-4 border-primary text-primary">
                          Atlas
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate">
                        {message.subject || '(No subject)'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        - {message.content?.substring(0, 60)}...
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={12} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {activeFolder !== 'drafts' && (
                          <>
                            <DropdownMenuItem onClick={() => handleCompose('reply', message)}>
                              <Reply size={12} className="mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCompose('replyAll', message)}>
                              <ReplyAll size={12} className="mr-2" />
                              Reply All
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCompose('forward', message)}>
                              <Forward size={12} className="mr-2" />
                              Forward
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {activeFolder === 'drafts' && (
                          <DropdownMenuItem onClick={() => handleEditDraft(message)}>
                            <Pencil size={12} className="mr-2" />
                            Edit Draft
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedIds(new Set([message.id]));
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={12} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Preview Panel */}
      {selectedMessage && activeFolder !== 'drafts' && (
        <div className="w-96 border-l flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold truncate">{selectedMessage.subject || '(No subject)'}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedMessage(null)}
            >
              <X size={14} />
            </Button>
          </div>

          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium">
                  {(selectedMessage.from_address || 'U')[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedMessage.from_address || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  to {selectedMessage.to_addresses?.join(', ') || 'me'}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(selectedMessage.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
          </ScrollArea>

          <div className="p-4 border-t flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleCompose('reply', selectedMessage)}
            >
              <Reply size={14} className="mr-1" />
              Reply
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleCompose('forward', selectedMessage)}
            >
              <Forward size={14} className="mr-1" />
              Forward
            </Button>
          </div>
        </div>
      )}

      {/* Composer Dialog */}
      <EmailComposerDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        userId={userId}
        mode={composeMode}
        originalMessage={selectedMessage}
        draftId={editDraftId}
        onSent={onRefresh}
        onDraftSaved={onRefresh}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} message(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
