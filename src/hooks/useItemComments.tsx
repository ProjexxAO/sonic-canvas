import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ItemComment {
  id: string;
  shared_item_id: string;
  user_id: string;
  content: string;
  mentions: string[];
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_avatar?: string;
}

export function useItemComments(sharedItemId: string | null, userId: string | undefined) {
  const [comments, setComments] = useState<ItemComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!sharedItemId || !userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('item_comments')
        .select('*')
        .eq('shared_item_id', sharedItemId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedComments = (data || []).map(comment => ({
        ...comment,
        mentions: comment.mentions || [],
        user_name: profileMap.get(comment.user_id)?.display_name || 'Unknown',
        user_avatar: profileMap.get(comment.user_id)?.avatar_url,
      }));

      setComments(enrichedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sharedItemId, userId]);

  const addComment = async (content: string, mentions?: string[]) => {
    if (!sharedItemId || !userId || !content.trim()) return null;

    setIsSending(true);
    try {
      const { data, error } = await supabase
        .from('item_comments')
        .insert({
          shared_item_id: sharedItemId,
          user_id: userId,
          content: content.trim(),
          mentions: mentions || [],
        })
        .select()
        .single();

      if (error) throw error;

      // Get the shared item to find dashboard_id for notifications
      const { data: sharedItem } = await supabase
        .from('shared_items')
        .select('dashboard_id')
        .eq('id', sharedItemId)
        .single();

      // Create notifications for mentioned users
      if (mentions?.length && sharedItem) {
        const notifications = mentions
          .filter(mentionedId => mentionedId !== userId)
          .map(mentionedId => ({
            dashboard_id: sharedItem.dashboard_id,
            user_id: mentionedId,
            actor_id: userId,
            notification_type: 'comment_mention',
            title: 'You were mentioned in a comment',
            message: content.substring(0, 100),
            reference_id: data.id,
            reference_type: 'comment',
          }));

        if (notifications.length > 0) {
          await supabase.from('dashboard_notifications').insert(notifications);
        }
      }

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    } finally {
      setIsSending(false);
    }
  };

  const editComment = async (commentId: string, newContent: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('item_comments')
        .update({
          content: newContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error editing comment:', error);
      return false;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('item_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!sharedItemId) return;

    fetchComments();

    const channel = supabase
      .channel(`item-comments-${sharedItemId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_comments',
          filter: `shared_item_id=eq.${sharedItemId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, display_name, avatar_url')
              .eq('user_id', (payload.new as any).user_id)
              .single();

            const newComment = {
              ...(payload.new as ItemComment),
              mentions: (payload.new as any).mentions || [],
              user_name: profile?.display_name || 'Unknown',
              user_avatar: profile?.avatar_url,
            };

            setComments(prev => [...prev, newComment]);
          } else if (payload.eventType === 'UPDATE') {
            setComments(prev =>
              prev.map(c =>
                c.id === (payload.new as any).id
                  ? { ...c, ...(payload.new as ItemComment) }
                  : c
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setComments(prev =>
              prev.filter(c => c.id !== (payload.old as any).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sharedItemId, fetchComments]);

  return {
    comments,
    isLoading,
    isSending,
    addComment,
    editComment,
    deleteComment,
    refetch: fetchComments,
  };
}
