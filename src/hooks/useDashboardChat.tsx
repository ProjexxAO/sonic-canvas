import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardMessage {
  id: string;
  dashboard_id: string;
  user_id: string;
  content: string;
  mentions: string[];
  reply_to_id: string | null;
  attachments: any[];
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
  reply_to?: DashboardMessage | null;
}

export function useDashboardChat(dashboardId: string | null, userId: string | undefined) {
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!dashboardId || !userId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dashboard_messages')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles for messages
      const userIds = [...new Set((data || []).map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedMessages: DashboardMessage[] = (data || []).map(msg => ({
        ...msg,
        mentions: (msg.mentions || []) as string[],
        attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
        user_name: profileMap.get(msg.user_id)?.display_name || 'Unknown',
        user_avatar: profileMap.get(msg.user_id)?.avatar_url,
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dashboardId, userId]);

  const sendMessage = async (
    content: string,
    options?: {
      mentions?: string[];
      replyToId?: string;
      attachments?: any[];
    }
  ) => {
    if (!dashboardId || !userId || !content.trim()) return null;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('dashboard_messages')
        .insert({
          dashboard_id: dashboardId,
          user_id: userId,
          content: content.trim(),
          mentions: options?.mentions || [],
          reply_to_id: options?.replyToId || null,
          attachments: options?.attachments || [],
        })
        .select()
        .single();

      if (error) throw error;

      // Create notifications for mentioned users
      if (options?.mentions?.length) {
        const notifications = options.mentions
          .filter(mentionedId => mentionedId !== userId)
          .map(mentionedId => ({
            dashboard_id: dashboardId,
            user_id: mentionedId,
            actor_id: userId,
            notification_type: 'mention',
            title: 'You were mentioned',
            message: content.substring(0, 100),
            reference_id: data.id,
            reference_type: 'message',
          }));

        if (notifications.length > 0) {
          await supabase.from('dashboard_notifications').insert(notifications);
        }
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    } finally {
      setIsSending(false);
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('dashboard_messages')
        .update({
          content: newContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('dashboard_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!dashboardId) return;

    fetchMessages();

    const channel = supabase
      .channel(`dashboard-chat-${dashboardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_messages',
          filter: `dashboard_id=eq.${dashboardId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch user profile for new message
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, display_name, avatar_url')
              .eq('user_id', (payload.new as any).user_id)
              .single();

            const newMessage = {
              ...(payload.new as DashboardMessage),
              mentions: (payload.new as any).mentions || [],
              attachments: (payload.new as any).attachments || [],
              user_name: profile?.display_name || 'Unknown',
              user_avatar: profile?.avatar_url,
            };

            setMessages(prev => [...prev, newMessage]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === (payload.new as any).id
                  ? { ...msg, ...(payload.new as DashboardMessage) }
                  : msg
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev =>
              prev.filter(msg => msg.id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dashboardId, fetchMessages]);

  return {
    messages,
    isLoading,
    isSending,
    sendMessage,
    editMessage,
    deleteMessage,
    refetch: fetchMessages,
  };
}
