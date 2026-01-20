import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardNotification {
  id: string;
  dashboard_id: string;
  user_id: string;
  actor_id: string;
  notification_type: string;
  title: string;
  message: string | null;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string;
  dashboard_name?: string;
}

export function useDashboardNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dashboard_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch actor profiles and dashboard names
      const actorIds = [...new Set((data || []).map(n => n.actor_id))];
      const dashboardIds = [...new Set((data || []).map(n => n.dashboard_id))];

      const [{ data: profiles }, { data: dashboards }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', actorIds),
        supabase.from('shared_dashboards').select('id, name').in('id', dashboardIds),
      ]);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const dashboardMap = new Map(dashboards?.map(d => [d.id, d]) || []);

      const enrichedNotifications = (data || []).map(notif => ({
        ...notif,
        actor_name: profileMap.get(notif.actor_id)?.display_name || 'Unknown',
        actor_avatar: profileMap.get(notif.actor_id)?.avatar_url,
        dashboard_name: dashboardMap.get(notif.dashboard_id)?.name,
      }));

      setNotifications(enrichedNotifications);
      setUnreadCount(enrichedNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('dashboard_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('dashboard_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('dashboard_notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  const createNotification = async (
    dashboardId: string,
    targetUserId: string,
    type: string,
    title: string,
    message?: string,
    referenceId?: string,
    referenceType?: string
  ) => {
    if (!userId || targetUserId === userId) return null;

    try {
      const { data, error } = await supabase
        .from('dashboard_notifications')
        .insert({
          dashboard_id: dashboardId,
          user_id: targetUserId,
          actor_id: userId,
          notification_type: type,
          title,
          message,
          reference_id: referenceId,
          reference_type: referenceType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dashboard_notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const newNotif = payload.new as DashboardNotification;

          // Fetch actor profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url')
            .eq('user_id', newNotif.actor_id)
            .single();

          const enrichedNotif = {
            ...newNotif,
            actor_name: profile?.display_name || 'Unknown',
            actor_avatar: profile?.avatar_url,
          };

          setNotifications(prev => [enrichedNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refetch: fetchNotifications,
  };
}
