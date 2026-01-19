import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SharedDashboard {
  id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  created_by: string;
  visibility: 'private' | 'workspace' | 'organization';
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
  my_role?: string;
}

export interface DashboardMember {
  id: string;
  dashboard_id: string;
  user_id: string;
  role: 'viewer' | 'contributor' | 'editor' | 'admin' | 'owner';
  can_upload: boolean;
  can_share: boolean;
  can_comment: boolean;
  invited_by: string | null;
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
}

export interface SharedItem {
  id: string;
  dashboard_id: string;
  item_type: string;
  item_id: string;
  shared_by: string;
  note: string | null;
  pin_position: number | null;
  created_at: string;
  shared_by_name?: string;
  item_title?: string;
}

export interface DashboardActivity {
  id: string;
  dashboard_id: string;
  user_id: string;
  action: string;
  item_type: string | null;
  item_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  user_name?: string;
}

export interface ActiveViewer {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  online_at: string;
}

export function useSharedDashboards(userId: string | undefined) {
  const [dashboards, setDashboards] = useState<SharedDashboard[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<SharedDashboard | null>(null);
  const [members, setMembers] = useState<DashboardMember[]>([]);
  const [sharedItems, setSharedItems] = useState<SharedItem[]>([]);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [activeViewers, setActiveViewers] = useState<ActiveViewer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null);

  // Fetch all dashboards user has access to
  const fetchDashboards = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('shared_dashboards')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get member counts and my role for each dashboard
      const dashboardsWithMeta = await Promise.all(
        (data || []).map(async (dashboard) => {
          const { data: memberData } = await supabase
            .from('shared_dashboard_members')
            .select('user_id, role')
            .eq('dashboard_id', dashboard.id);

          const myMembership = memberData?.find(m => m.user_id === userId);
          
          return {
            ...dashboard,
            member_count: memberData?.length || 0,
            my_role: dashboard.created_by === userId ? 'owner' : myMembership?.role,
          } as SharedDashboard;
        })
      );

      setDashboards(dashboardsWithMeta);
    } catch (error: any) {
      console.error('Failed to fetch dashboards:', error);
      toast.error('Failed to load shared dashboards');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create a new dashboard
  const createDashboard = useCallback(async (
    name: string, 
    description?: string,
    workspaceId?: string,
    visibility: 'private' | 'workspace' = 'private'
  ) => {
    if (!userId) return null;

    try {
      const { data: dashboard, error } = await supabase
        .from('shared_dashboards')
        .insert({
          name,
          description,
          workspace_id: workspaceId || null,
          visibility,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner member
      await supabase
        .from('shared_dashboard_members')
        .insert({
          dashboard_id: dashboard.id,
          user_id: userId,
          role: 'owner',
          can_upload: true,
          can_share: true,
          can_comment: true,
        });

      toast.success('Dashboard created');
      await fetchDashboards();
      return dashboard;
    } catch (error: any) {
      console.error('Failed to create dashboard:', error);
      toast.error('Failed to create dashboard');
      return null;
    }
  }, [userId, fetchDashboards]);

  // Select a dashboard
  const selectDashboard = useCallback(async (dashboardId: string | null) => {
    if (!dashboardId) {
      setCurrentDashboard(null);
      setMembers([]);
      setSharedItems([]);
      setActivities([]);
      
      // Cleanup presence
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
        setPresenceChannel(null);
      }
      return;
    }

    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return;

    setCurrentDashboard(dashboard);
    setIsLoading(true);

    try {
      // Fetch members with profile info
      const { data: memberData } = await supabase
        .from('shared_dashboard_members')
        .select('*')
        .eq('dashboard_id', dashboardId);

      if (memberData) {
        // Get profile info for each member
        const memberProfiles = await Promise.all(
          memberData.map(async (member) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', member.user_id)
              .maybeSingle();
            
            return {
              ...member,
              display_name: profile?.display_name || 'Unknown User',
              avatar_url: profile?.avatar_url,
            } as DashboardMember;
          })
        );
        setMembers(memberProfiles);
      }

      // Fetch shared items
      const { data: itemsData } = await supabase
        .from('shared_items')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('pin_position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      setSharedItems(itemsData || []);

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('dashboard_activity')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('created_at', { ascending: false })
        .limit(50);

      setActivities(activityData || []);

      // Setup presence tracking
      if (userId) {
        const channel = supabase.channel(`dashboard:${dashboardId}`)
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const viewers: ActiveViewer[] = [];
            Object.values(state).forEach((presences: any) => {
              presences.forEach((presence: any) => {
                viewers.push({
                  user_id: presence.user_id,
                  display_name: presence.display_name,
                  avatar_url: presence.avatar_url,
                  online_at: presence.online_at,
                });
              });
            });
            setActiveViewers(viewers);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('user_id', userId)
                .maybeSingle();

              await channel.track({
                user_id: userId,
                display_name: profile?.display_name || 'Unknown',
                avatar_url: profile?.avatar_url,
                online_at: new Date().toISOString(),
              });
            }
          });

        setPresenceChannel(channel);
      }

      // Subscribe to realtime updates
      supabase
        .channel(`dashboard-updates:${dashboardId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'dashboard_activity',
            filter: `dashboard_id=eq.${dashboardId}`,
          },
          (payload) => {
            setActivities(prev => [payload.new as DashboardActivity, ...prev].slice(0, 50));
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shared_items',
            filter: `dashboard_id=eq.${dashboardId}`,
          },
          async () => {
            // Refetch shared items on any change
            const { data } = await supabase
              .from('shared_items')
              .select('*')
              .eq('dashboard_id', dashboardId)
              .order('pin_position', { ascending: true, nullsFirst: false })
              .order('created_at', { ascending: false });
            setSharedItems(data || []);
          }
        )
        .subscribe();

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, userId, presenceChannel]);

  // Invite a member
  const inviteMember = useCallback(async (
    dashboardId: string,
    targetUserId: string,
    role: DashboardMember['role'] = 'viewer',
    permissions?: Partial<Pick<DashboardMember, 'can_upload' | 'can_share' | 'can_comment'>>
  ) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('shared_dashboard_members')
        .insert({
          dashboard_id: dashboardId,
          user_id: targetUserId,
          role,
          can_upload: permissions?.can_upload ?? (role !== 'viewer'),
          can_share: permissions?.can_share ?? (['contributor', 'editor', 'admin', 'owner'].includes(role)),
          can_comment: permissions?.can_comment ?? true,
          invited_by: userId,
        });

      if (error) throw error;

      // Log activity
      await logActivity(dashboardId, 'joined', undefined, undefined, { invited_user_id: targetUserId });
      
      toast.success('Member invited');
      
      // Refresh members
      if (currentDashboard?.id === dashboardId) {
        await selectDashboard(dashboardId);
      }
      
      return true;
    } catch (error: any) {
      console.error('Failed to invite member:', error);
      toast.error(error.message || 'Failed to invite member');
      return false;
    }
  }, [userId, currentDashboard, selectDashboard]);

  // Update member role
  const updateMemberRole = useCallback(async (
    memberId: string,
    role: DashboardMember['role'],
    permissions?: Partial<Pick<DashboardMember, 'can_upload' | 'can_share' | 'can_comment'>>
  ) => {
    try {
      const { error } = await supabase
        .from('shared_dashboard_members')
        .update({
          role,
          ...permissions,
        })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member updated');
      
      if (currentDashboard) {
        await selectDashboard(currentDashboard.id);
      }
      
      return true;
    } catch (error: any) {
      console.error('Failed to update member:', error);
      toast.error('Failed to update member');
      return false;
    }
  }, [currentDashboard, selectDashboard]);

  // Remove member
  const removeMember = useCallback(async (memberId: string) => {
    try {
      const member = members.find(m => m.id === memberId);
      
      const { error } = await supabase
        .from('shared_dashboard_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      if (member && currentDashboard) {
        await logActivity(currentDashboard.id, 'left', undefined, undefined, { removed_user_id: member.user_id });
      }

      toast.success('Member removed');
      
      if (currentDashboard) {
        await selectDashboard(currentDashboard.id);
      }
      
      return true;
    } catch (error: any) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
      return false;
    }
  }, [members, currentDashboard, selectDashboard]);

  // Share an item to dashboard
  const shareItem = useCallback(async (
    dashboardId: string,
    itemType: SharedItem['item_type'],
    itemId: string,
    note?: string
  ) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('shared_items')
        .insert({
          dashboard_id: dashboardId,
          item_type: itemType,
          item_id: itemId,
          shared_by: userId,
          note,
        });

      if (error) throw error;

      await logActivity(dashboardId, 'shared_item', itemType, itemId, { note });
      
      toast.success('Item shared to dashboard');
      return true;
    } catch (error: any) {
      console.error('Failed to share item:', error);
      toast.error('Failed to share item');
      return false;
    }
  }, [userId]);

  // Unshare an item
  const unshareItem = useCallback(async (sharedItemId: string) => {
    try {
      const { error } = await supabase
        .from('shared_items')
        .delete()
        .eq('id', sharedItemId);

      if (error) throw error;

      toast.success('Item removed from dashboard');
      return true;
    } catch (error: any) {
      console.error('Failed to remove item:', error);
      toast.error('Failed to remove item');
      return false;
    }
  }, []);

  // Pin/unpin item
  const togglePinItem = useCallback(async (sharedItemId: string, pinPosition: number | null) => {
    try {
      const { error } = await supabase
        .from('shared_items')
        .update({ pin_position: pinPosition })
        .eq('id', sharedItemId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Failed to update pin:', error);
      return false;
    }
  }, []);

  // Log activity
  const logActivity = useCallback(async (
    dashboardId: string,
    action: DashboardActivity['action'],
    itemType?: string,
    itemId?: string,
    metadata?: Record<string, any>
  ) => {
    if (!userId) return;

    try {
      await supabase
        .from('dashboard_activity')
        .insert({
          dashboard_id: dashboardId,
          user_id: userId,
          action,
          item_type: itemType,
          item_id: itemId,
          metadata: metadata || {},
        });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, [userId]);

  // Get my permissions for current dashboard
  const getMyPermissions = useCallback(() => {
    if (!currentDashboard || !userId) {
      return { canView: false, canUpload: false, canShare: false, canComment: false, canManage: false };
    }

    const isCreator = currentDashboard.created_by === userId;
    if (isCreator) {
      return { canView: true, canUpload: true, canShare: true, canComment: true, canManage: true };
    }

    const myMembership = members.find(m => m.user_id === userId);
    if (!myMembership) {
      return { canView: false, canUpload: false, canShare: false, canComment: false, canManage: false };
    }

    return {
      canView: true,
      canUpload: myMembership.can_upload,
      canShare: myMembership.can_share,
      canComment: myMembership.can_comment,
      canManage: ['admin', 'owner'].includes(myMembership.role),
    };
  }, [currentDashboard, members, userId]);

  // Initial fetch
  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (presenceChannel) {
        supabase.removeChannel(presenceChannel);
      }
    };
  }, [presenceChannel]);

  return {
    dashboards,
    currentDashboard,
    members,
    sharedItems,
    activities,
    activeViewers,
    isLoading,
    fetchDashboards,
    createDashboard,
    selectDashboard,
    inviteMember,
    updateMemberRole,
    removeMember,
    shareItem,
    unshareItem,
    togglePinItem,
    logActivity,
    getMyPermissions,
  };
}
