// Full Email Composer Dialog - compose, reply, forward, draft
import { useState, useEffect } from 'react';
import {
  Send,
  Save,
  X,
  Paperclip,
  Sparkles,
  ChevronDown,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Image,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/hooks/useCommunications';

export type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward';

interface EmailComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  mode?: ComposeMode;
  originalMessage?: Message | null;
  draftId?: string | null;
  onSent?: () => void;
  onDraftSaved?: () => void;
}

export function EmailComposerDialog({
  open,
  onOpenChange,
  userId,
  mode = 'new',
  originalMessage,
  draftId,
  onSent,
  onDraftSaved,
}: EmailComposerDialogProps) {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(draftId || null);

  // Initialize fields based on mode
  useEffect(() => {
    if (!open) return;

    if (draftId) {
      loadDraft(draftId);
      return;
    }

    if (mode === 'new') {
      resetForm();
      return;
    }

    if (originalMessage) {
      switch (mode) {
        case 'reply':
          setTo(originalMessage.from_address || '');
          setSubject(`Re: ${originalMessage.subject || ''}`);
          setContent(`\n\n---\nOn ${new Date(originalMessage.created_at).toLocaleString()}, ${originalMessage.from_address} wrote:\n> ${originalMessage.content}`);
          break;
        case 'replyAll':
          setTo(originalMessage.from_address || '');
          setCc(originalMessage.cc_addresses?.join(', ') || '');
          setSubject(`Re: ${originalMessage.subject || ''}`);
          setContent(`\n\n---\nOn ${new Date(originalMessage.created_at).toLocaleString()}, ${originalMessage.from_address} wrote:\n> ${originalMessage.content}`);
          setShowCcBcc(true);
          break;
        case 'forward':
          setSubject(`Fwd: ${originalMessage.subject || ''}`);
          setContent(`\n\n---\nForwarded message:\nFrom: ${originalMessage.from_address}\nDate: ${new Date(originalMessage.created_at).toLocaleString()}\nSubject: ${originalMessage.subject}\n\n${originalMessage.content}`);
          break;
      }
    }
  }, [open, mode, originalMessage, draftId]);

  const resetForm = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setContent('');
    setShowCcBcc(false);
    setCurrentDraftId(null);
  };

  const loadDraft = async (id: string) => {
    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('communication_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setTo(data.to_addresses?.join(', ') || '');
      setCc(data.cc_addresses?.join(', ') || '');
      setBcc(data.bcc_addresses?.join(', ') || '');
      setSubject(data.subject || '');
      setContent(data.content || '');
      setCurrentDraftId(id);
      if (data.cc_addresses?.length || data.bcc_addresses?.length) {
        setShowCcBcc(true);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      toast.error('Failed to load draft');
    }
  };

  const parseEmails = (input: string): string[] => {
    return input
      .split(/[,;]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
  };

  const handleSend = async () => {
    if (!userId || !to.trim()) {
      toast.error('Please enter a recipient');
      return;
    }

    setIsSending(true);
    try {
      const client = supabase as any;
      const messageData = {
        user_id: userId,
        content,
        subject: subject || null,
        platform: 'gmail',
        to_addresses: parseEmails(to),
        cc_addresses: parseEmails(cc),
        bcc_addresses: parseEmails(bcc),
        status: 'sent',
        sent_at: new Date().toISOString(),
        is_incoming: false,
        drafted_by_atlas: false,
      };

      if (currentDraftId) {
        // Update existing draft to sent
        const { error } = await client
          .from('communication_messages')
          .update({
            ...messageData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDraftId);

        if (error) throw error;
      } else {
        // Create new sent message
        const { error } = await client
          .from('communication_messages')
          .insert(messageData);

        if (error) throw error;
      }

      toast.success('Email sent successfully');
      resetForm();
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!userId) return;

    setIsSavingDraft(true);
    try {
      const client = supabase as any;
      const draftData = {
        user_id: userId,
        content,
        subject: subject || null,
        platform: 'gmail',
        to_addresses: parseEmails(to),
        cc_addresses: parseEmails(cc),
        bcc_addresses: parseEmails(bcc),
        status: 'draft',
        is_incoming: false,
        drafted_by_atlas: false,
      };

      if (currentDraftId) {
        // Update existing draft
        const { error } = await client
          .from('communication_messages')
          .update({
            ...draftData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDraftId);

        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await client
          .from('communication_messages')
          .insert(draftData)
          .select()
          .single();

        if (error) throw error;
        setCurrentDraftId(data.id);
      }

      toast.success('Draft saved');
      onDraftSaved?.();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleAtlasDraft = async () => {
    if (!subject && !content) {
      toast.error('Please provide some context for Atlas to generate a draft');
      return;
    }

    setIsGeneratingDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
        body: {
          action: 'draft_message',
          context: subject || content,
          replyTo: originalMessage
            ? {
                content: originalMessage.content,
                from: originalMessage.from_address,
                subject: originalMessage.subject,
              }
            : undefined,
          platform: 'gmail',
          toAddresses: parseEmails(to),
        },
      });

      if (error) throw error;

      if (data?.draft) {
        setContent(data.draft);
        toast.success('Atlas generated a draft for you');
      }
    } catch (error) {
      console.error('Error generating draft:', error);
      toast.error('Failed to generate draft');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleDiscard = async () => {
    if (currentDraftId) {
      try {
        const client = supabase as any;
        await client
          .from('communication_messages')
          .delete()
          .eq('id', currentDraftId);
        toast.success('Draft discarded');
      } catch (error) {
        console.error('Error discarding draft:', error);
      }
    }
    resetForm();
    onOpenChange(false);
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'reply':
        return 'Reply';
      case 'replyAll':
        return 'Reply All';
      case 'forward':
        return 'Forward';
      default:
        return 'New Email';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getModeLabel()}
              {currentDraftId && (
                <Badge variant="secondary" className="text-xs">
                  Draft
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDiscard}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 size={16} className="mr-1" />
                Discard
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Recipients */}
          <div className="px-6 py-3 border-b space-y-2">
            <div className="flex items-center gap-2">
              <Label className="w-12 text-sm text-muted-foreground">To:</Label>
              <Input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
              />
              {!showCcBcc && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowCcBcc(true)}
                >
                  Cc/Bcc
                </Button>
              )}
            </div>

            {showCcBcc && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="w-12 text-sm text-muted-foreground">Cc:</Label>
                  <Input
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-12 text-sm text-muted-foreground">Bcc:</Label>
                  <Input
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <Label className="w-12 text-sm text-muted-foreground">Subject:</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
                className="flex-1 border-0 shadow-none focus-visible:ring-0 px-0"
              />
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="px-6 py-2 border-b flex items-center gap-1">
            <TooltipProvider>
              {[
                { icon: Bold, label: 'Bold' },
                { icon: Italic, label: 'Italic' },
                { icon: Underline, label: 'Underline' },
              ].map(({ icon: Icon, label }) => (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Icon size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{label}</TooltipContent>
                </Tooltip>
              ))}
              <div className="h-4 w-px bg-border mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <List size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bullet List</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <LinkIcon size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert Link</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Image size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert Image</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Email Body */}
          <div className="flex-1 px-6 py-4 overflow-auto">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message..."
              className="min-h-full border-0 shadow-none focus-visible:ring-0 resize-none text-sm"
            />
          </div>

          {/* Actions Footer */}
          <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Button onClick={handleSend} disabled={isSending || !to.trim()}>
                {isSending ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Send size={16} className="mr-2" />
                )}
                Send
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleSend()}>
                    Send Now
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    Schedule Send
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
              >
                {isSavingDraft ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Save size={16} className="mr-2" />
                )}
                Save Draft
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" disabled>
                <Paperclip size={16} />
              </Button>

              <Button
                variant="outline"
                onClick={handleAtlasDraft}
                disabled={isGeneratingDraft}
                className="gap-2"
              >
                {isGeneratingDraft ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Ask Atlas
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
