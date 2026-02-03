import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export type CommunicationPlatform = 'internal' | 'gmail' | 'outlook' | 'slack' | 'teams' | 'whatsapp' | 'sms' | 'messenger' | 'other';
export type MessageStatus = 'draft' | 'pending_approval' | 'sent' | 'delivered' | 'read' | 'failed';
export type ChannelType = 'direct' | 'private' | 'public' | 'announcement';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  channel_type: ChannelType;
  created_by: string;
  workspace_id?: string;
  avatar_url?: string;
  is_archived: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: Message;
  members?: ChannelMember[];
}

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: string;
  is_muted: boolean;
  last_read_at: string;
  joined_at: string;
  profile?: {
    display_name?: string;
    avatar_url?: string;
  };
}

export interface Message {
  id: string;
  user_id: string;
  platform: CommunicationPlatform;
  channel_id?: string;
  parent_message_id?: string;
  thread_root_id?: string;
  subject?: string;
  content: string;
  content_html?: string;
  external_id?: string;
  from_address?: string;
  to_addresses?: string[];
  cc_addresses?: string[];
  bcc_addresses?: string[];
  status: MessageStatus;
  is_incoming: boolean;
  is_starred: boolean;
  is_pinned: boolean;
  drafted_by_atlas: boolean;
  atlas_draft_context?: Record<string, any>;
  approved_at?: string;
  approved_by?: string;
  attachments: any[];
  metadata: Record<string, any>;
  sent_at?: string;
  created_at: string;
  updated_at: string;
  reactions?: MessageReaction[];
  replies_count?: number;
  sender?: {
    display_name?: string;
    avatar_url?: string;
  };
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface PlatformConnection {
  id: string;
  user_id: string;
  platform: CommunicationPlatform;
  account_email?: string;
  account_name?: string;
  is_active: boolean;
  last_sync_at?: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AtlasDraft {
  content: string;
  context: Record<string, any>;
  suggestions?: string[];
}

export function useCommunications(userId: string | undefined) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [selectedThread, setSelectedThread] = useState<Message | null>(null);
  const [platformConnections, setPlatformConnections] = useState<PlatformConnection[]>([]);
  const [platformFilter, setPlatformFilter] = useState<CommunicationPlatform | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [atlasDraft, setAtlasDraft] = useState<AtlasDraft | null>(null);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    if (!userId) return;

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('communication_channels')
        .select(`
          *,
          channel_members!inner(user_id, role, last_read_at)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  }, [userId]);

  // Fetch messages for a channel or unified inbox
  const fetchMessages = useCallback(async (channelId?: string, platform?: CommunicationPlatform) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const client = supabase as any;
      let query = client
        .from('communication_messages')
        .select('*')
        .is('thread_root_id', null) // Only top-level messages
        .order('created_at', { ascending: false })
        .limit(50);

      if (channelId) {
        query = query.eq('channel_id', channelId);
      }

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch thread replies
  const fetchThreadReplies = useCallback(async (threadRootId: string): Promise<Message[]> => {
    if (!userId) return [];

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('communication_messages')
        .select('*')
        .eq('thread_root_id', threadRootId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching thread replies:', error);
      return [];
    }
  }, [userId]);

  // Fetch platform connections
  const fetchPlatformConnections = useCallback(async () => {
    if (!userId) return;

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('platform_connections')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setPlatformConnections(data || []);
    } catch (error) {
      console.error('Error fetching platform connections:', error);
    }
  }, [userId]);

  // Create a new channel
  const createChannel = useCallback(async (
    name: string,
    type: ChannelType,
    memberIds: string[] = [],
    description?: string
  ): Promise<Channel | null> => {
    if (!userId) return null;

    try {
      const client = supabase as any;
      
      // Create channel
      const { data: channel, error } = await client
        .from('communication_channels')
        .insert({
          name,
          description,
          channel_type: type,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await client.from('channel_members').insert({
        channel_id: channel.id,
        user_id: userId,
        role: 'owner',
      });

      // Add other members
      if (memberIds.length > 0) {
        await client.from('channel_members').insert(
          memberIds.map(memberId => ({
            channel_id: channel.id,
            user_id: memberId,
            role: 'member',
          }))
        );
      }

      toast.success('Channel created');
      await fetchChannels();
      return channel;
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
      return null;
    }
  }, [userId, fetchChannels]);

  // Create or get DM channel
  const getOrCreateDM = useCallback(async (otherUserId: string): Promise<Channel | null> => {
    if (!userId) return null;

    try {
      const client = supabase as any;
      
      // Check for existing DM channel
      const { data: existingChannels } = await client
        .from('communication_channels')
        .select(`
          *,
          channel_members!inner(user_id)
        `)
        .eq('channel_type', 'direct');

      // Find DM with both users
      const existingDM = existingChannels?.find((ch: any) => {
        const memberIds = ch.channel_members.map((m: any) => m.user_id);
        return memberIds.includes(userId) && memberIds.includes(otherUserId) && memberIds.length === 2;
      });

      if (existingDM) {
        return existingDM;
      }

      // Create new DM
      return await createChannel('Direct Message', 'direct', [otherUserId]);
    } catch (error) {
      console.error('Error getting/creating DM:', error);
      return null;
    }
  }, [userId, createChannel]);

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    options: {
      channelId?: string;
      platform?: CommunicationPlatform;
      parentMessageId?: string;
      threadRootId?: string;
      subject?: string;
      toAddresses?: string[];
      isAtlasDraft?: boolean;
      atlasDraftContext?: Record<string, any>;
    } = {}
  ): Promise<Message | null> => {
    if (!userId) return null;

    setIsSending(true);
    try {
      const client = supabase as any;
      
      const messageData = {
        user_id: userId,
        content,
        platform: options.platform || 'internal',
        channel_id: options.channelId || null,
        parent_message_id: options.parentMessageId || null,
        thread_root_id: options.threadRootId || null,
        subject: options.subject || null,
        to_addresses: options.toAddresses || null,
        status: options.isAtlasDraft ? 'pending_approval' : 'sent',
        drafted_by_atlas: options.isAtlasDraft || false,
        atlas_draft_context: options.atlasDraftContext || null,
        sent_at: options.isAtlasDraft ? null : new Date().toISOString(),
        is_incoming: false,
      };

      const { data, error } = await client
        .from('communication_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (!options.threadRootId) {
        setMessages(prev => [data, ...prev]);
      }

      if (!options.isAtlasDraft) {
        toast.success('Message sent');
      }

      setAtlasDraft(null);
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return null;
    } finally {
      setIsSending(false);
    }
  }, [userId]);

  // Approve Atlas draft
  const approveAtlasDraft = useCallback(async (messageId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('communication_messages')
        .update({
          status: 'sent',
          approved_at: new Date().toISOString(),
          approved_by: userId,
          sent_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === messageId 
          ? { ...m, status: 'sent' as MessageStatus, approved_at: new Date().toISOString() }
          : m
      ));

      toast.success('Message approved and sent');
      return true;
    } catch (error) {
      console.error('Error approving draft:', error);
      toast.error('Failed to approve message');
      return false;
    }
  }, [userId]);

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: userId,
          emoji,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  }, [userId]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing reaction:', error);
      return false;
    }
  }, [userId]);

  // Toggle star
  const toggleStar = useCallback(async (messageId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return false;

      const client = supabase as any;
      const { error } = await client
        .from('communication_messages')
        .update({ is_starred: !message.is_starred })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, is_starred: !m.is_starred } : m
      ));

      return true;
    } catch (error) {
      console.error('Error toggling star:', error);
      return false;
    }
  }, [userId, messages]);

  // Delete message(s)
  const deleteMessages = useCallback(async (messageIds: string[]): Promise<boolean> => {
    if (!userId || messageIds.length === 0) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('communication_messages')
        .delete()
        .in('id', messageIds);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.filter(m => !messageIds.includes(m.id)));

      toast.success(`Deleted ${messageIds.length} message(s)`);
      return true;
    } catch (error) {
      console.error('Error deleting messages:', error);
      toast.error('Failed to delete messages');
      return false;
    }
  }, [userId]);

  // Update a draft
  const updateDraft = useCallback(async (
    messageId: string,
    updates: Partial<Pick<Message, 'content' | 'subject' | 'to_addresses' | 'cc_addresses' | 'bcc_addresses'>>
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('communication_messages')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, ...updates } : m
      ));

      return true;
    } catch (error) {
      console.error('Error updating draft:', error);
      toast.error('Failed to update draft');
      return false;
    }
  }, [userId]);

  // Mark as read
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      await client
        .from('message_read_receipts')
        .upsert({
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString(),
        });

      return true;
    } catch (error) {
      console.error('Error marking as read:', error);
      return false;
    }
  }, [userId]);

  // Request Atlas to draft a message
  const requestAtlasDraft = useCallback(async (
    context: string,
    replyTo?: Message
  ): Promise<AtlasDraft | null> => {
    // This would call an edge function to generate a draft
    // For now, we'll simulate it
    try {
      const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
        body: {
          action: 'draft_message',
          context,
          replyTo: replyTo ? {
            content: replyTo.content,
            from: replyTo.from_address || replyTo.sender?.display_name,
            subject: replyTo.subject,
          } : undefined,
        },
      });

      if (error) throw error;

      const draft: AtlasDraft = {
        content: data?.draft || 'I would be happy to help with that. Let me know if you need any clarification.',
        context: { originalContext: context, replyTo: replyTo?.id },
        suggestions: data?.suggestions || [],
      };

      setAtlasDraft(draft);
      return draft;
    } catch (error) {
      console.error('Error requesting Atlas draft:', error);
      toast.error('Failed to generate draft');
      return null;
    }
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const messagesChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communication_messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Add to messages if it's for current channel/inbox
          if (!newMessage.thread_root_id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [newMessage, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reactions',
        },
        (payload) => {
          // Update reactions in messages
          const reaction = payload.new as MessageReaction;
          setMessages(prev => prev.map(m => {
            if (m.id === reaction.message_id) {
              return {
                ...m,
                reactions: [...(m.reactions || []), reaction],
              };
            }
            return m;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      Promise.all([
        fetchChannels(),
        fetchMessages(),
        fetchPlatformConnections(),
      ]).finally(() => setIsLoading(false));
    }
  }, [userId, fetchChannels, fetchMessages, fetchPlatformConnections]);

  // Refetch when platform filter changes
  useEffect(() => {
    if (userId) {
      fetchMessages(
        selectedChannel?.id,
        platformFilter === 'all' ? undefined : platformFilter
      );
    }
  }, [userId, platformFilter, selectedChannel, fetchMessages]);

  return {
    // State
    channels,
    messages,
    selectedChannel,
    selectedThread,
    platformConnections,
    platformFilter,
    isLoading,
    isSending,
    atlasDraft,

    // Setters
    setSelectedChannel,
    setSelectedThread,
    setPlatformFilter,
    setAtlasDraft,

    // Actions
    fetchChannels,
    fetchMessages,
    fetchThreadReplies,
    fetchPlatformConnections,
    createChannel,
    getOrCreateDM,
    sendMessage,
    approveAtlasDraft,
    addReaction,
    removeReaction,
    toggleStar,
    markAsRead,
    requestAtlasDraft,
    deleteMessages,
    updateDraft,
  };
}
