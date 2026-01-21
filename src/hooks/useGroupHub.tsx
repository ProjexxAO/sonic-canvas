// Atlas Sonic OS - Group Data Hub Hook
// Manages team/family/project group data with role-based access control

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Types based on database schema
export type GroupHub = Tables<'group_hubs'>;
export type GroupMember = Tables<'group_members'>;
export type GroupItem = Tables<'group_items'>;
export type GroupActivity = Tables<'group_activity'>;
export type GroupInvitation = Tables<'group_invitations'>;
export type GroupRole = 'owner' | 'admin' | 'member' | 'viewer';
export type GroupHubType = 'team' | 'family' | 'project' | 'department' | 'organization';
export type ItemType = 'task' | 'note' | 'event' | 'goal' | 'resource' | 'announcement' | 'poll';
export type ItemStatus = 'active' | 'completed' | 'archived' | 'deleted';
export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface GroupMemberWithProfile extends GroupMember {
  profile?: {
    display_name: string;
    operator_handle: string;
  };
}

export interface GroupHubWithMembers extends GroupHub {
  members?: GroupMemberWithProfile[];
  myRole?: GroupRole;
}

export function useGroupHub() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupHubWithMembers[]>([]);
  const [currentGroup, setCurrentGroup] = useState<GroupHubWithMembers | null>(null);
  const [items, setItems] = useState<GroupItem[]>([]);
  const [activity, setActivity] = useState<GroupActivity[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all groups the user is a member of
  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get groups where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select(`
          role,
          group:group_hubs (*)
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Transform and add role info
      const groupsWithRole: GroupHubWithMembers[] = (memberData || [])
        .filter(item => item.group)
        .map(item => ({
          ...(item.group as GroupHub),
          myRole: item.role as GroupRole
        }));

      setGroups(groupsWithRole);
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Select a group and load its data
  const selectGroup = useCallback(async (groupId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('group_hubs')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      // Get my role
      const myMembership = (membersData || []).find(m => m.user_id === user.id);
      
      // Cast members data
      const members = (membersData || []) as GroupMemberWithProfile[];

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('group_items')
        .select('*')
        .eq('group_id', groupId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Fetch recent activity
      const { data: activityData, error: activityError } = await supabase
        .from('group_activity')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activityError) throw activityError;

      // Fetch pending invitations (if admin)
      let invitationsData: GroupInvitation[] = [];
      if (myMembership?.role === 'admin' || myMembership?.role === 'owner') {
        const { data, error: invError } = await supabase
          .from('group_invitations')
          .select('*')
          .eq('group_id', groupId)
          .eq('status', 'pending');

        if (!invError) invitationsData = data || [];
      }

      setCurrentGroup({
        ...groupData,
        members,
        myRole: myMembership?.role as GroupRole
      });
      setItems(itemsData || []);
      setActivity(activityData || []);
      setInvitations(invitationsData);

      // Set up realtime subscriptions
      const itemsChannel = supabase
        .channel(`group-items-${groupId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'group_items',
          filter: `group_id=eq.${groupId}`
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [payload.new as GroupItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as GroupItem : i));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== payload.old.id));
          }
        })
        .subscribe();

      const activityChannel = supabase
        .channel(`group-activity-${groupId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'group_activity',
          filter: `group_id=eq.${groupId}`
        }, (payload) => {
          setActivity(prev => [payload.new as GroupActivity, ...prev].slice(0, 50));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(itemsChannel);
        supabase.removeChannel(activityChannel);
      };
    } catch (err) {
      console.error('Error selecting group:', err);
      setError(err instanceof Error ? err.message : 'Failed to load group');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Create a new group
  const createGroup = useCallback(async (
    name: string,
    hubType: GroupHubType = 'team',
    description?: string
  ): Promise<GroupHub | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('group_hubs')
        .insert({
          name,
          description,
          hub_type: hubType,
          owner_id: user.id
        } as TablesInsert<'group_hubs'>)
        .select()
        .single();

      if (error) throw error;

      await fetchGroups();
      return data;
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
      return null;
    }
  }, [user, fetchGroups]);

  // Update group settings
  const updateGroup = useCallback(async (
    groupId: string,
    updates: Partial<Pick<GroupHub, 'name' | 'description' | 'visibility' | 'settings'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('group_hubs')
        .update(updates as TablesUpdate<'group_hubs'>)
        .eq('id', groupId);

      if (error) throw error;

      if (currentGroup?.id === groupId) {
        setCurrentGroup(prev => prev ? { ...prev, ...updates } : null);
      }
      return true;
    } catch (err) {
      console.error('Error updating group:', err);
      setError(err instanceof Error ? err.message : 'Failed to update group');
      return false;
    }
  }, [currentGroup]);

  // Delete a group
  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('group_hubs')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (currentGroup?.id === groupId) {
        setCurrentGroup(null);
        setItems([]);
        setActivity([]);
      }
      return true;
    } catch (err) {
      console.error('Error deleting group:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete group');
      return false;
    }
  }, [currentGroup]);

  // Create an item in the current group
  const createItem = useCallback(async (
    itemType: ItemType,
    title: string,
    content?: string,
    options?: {
      priority?: ItemPriority;
      dueDate?: Date;
      assignedTo?: string[];
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): Promise<GroupItem | null> => {
    if (!user || !currentGroup) return null;

    try {
      const { data, error } = await supabase
        .from('group_items')
        .insert({
          group_id: currentGroup.id,
          created_by: user.id,
          item_type: itemType,
          title,
          content,
          priority: options?.priority || 'medium',
          due_date: options?.dueDate?.toISOString(),
          assigned_to: options?.assignedTo || [],
          tags: options?.tags || [],
          metadata: options?.metadata || {}
        } as TablesInsert<'group_items'>)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating item:', err);
      setError(err instanceof Error ? err.message : 'Failed to create item');
      return null;
    }
  }, [user, currentGroup]);

  // Update an item
  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<Pick<GroupItem, 'title' | 'content' | 'status' | 'priority' | 'due_date' | 'assigned_to' | 'tags' | 'metadata'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('group_items')
        .update(updates as TablesUpdate<'group_items'>)
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update item');
      return false;
    }
  }, []);

  // Complete an item
  const completeItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_items')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id
        } as TablesUpdate<'group_items'>)
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error completing item:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete item');
      return false;
    }
  }, [user]);

  // Delete an item
  const deleteItem = useCallback(async (itemId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('group_items')
        .update({ status: 'deleted' } as TablesUpdate<'group_items'>)
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      return false;
    }
  }, []);

  // Invite a member
  const inviteMember = useCallback(async (
    email: string,
    role: GroupRole = 'member'
  ): Promise<boolean> => {
    if (!user || !currentGroup) return false;

    try {
      // Check if user exists
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('display_name', email)
        .maybeSingle();

      const { error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: currentGroup.id,
          email,
          invited_user_id: profileData?.user_id || null,
          invited_by: user.id,
          role
        } as TablesInsert<'group_invitations'>);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error inviting member:', err);
      setError(err instanceof Error ? err.message : 'Failed to invite member');
      return false;
    }
  }, [user, currentGroup]);

  // Accept an invitation
  const acceptInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get invitation details
      const { data: invitation, error: invError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (invError || !invitation) throw invError || new Error('Invitation not found');

      // Add user as member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invitation.group_id,
          user_id: user.id,
          role: invitation.role,
          invited_by: invitation.invited_by
        } as TablesInsert<'group_members'>);

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString()
        } as TablesUpdate<'group_invitations'>)
        .eq('id', invitationId);

      if (updateError) throw updateError;

      await fetchGroups();
      return true;
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
      return false;
    }
  }, [user, fetchGroups]);

  // Update member role
  const updateMemberRole = useCallback(async (
    memberId: string,
    role: GroupRole
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role } as TablesUpdate<'group_members'>)
        .eq('id', memberId);

      if (error) throw error;

      if (currentGroup) {
        setCurrentGroup(prev => prev ? {
          ...prev,
          members: prev.members?.map(m => m.id === memberId ? { ...m, role } : m)
        } : null);
      }
      return true;
    } catch (err) {
      console.error('Error updating member role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update member role');
      return false;
    }
  }, [currentGroup]);

  // Remove a member
  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      if (currentGroup) {
        setCurrentGroup(prev => prev ? {
          ...prev,
          members: prev.members?.filter(m => m.id !== memberId)
        } : null);
      }
      return true;
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      return false;
    }
  }, [currentGroup]);

  // Leave a group
  const leaveGroup = useCallback(async (groupId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (currentGroup?.id === groupId) {
        setCurrentGroup(null);
        setItems([]);
        setActivity([]);
      }
      return true;
    } catch (err) {
      console.error('Error leaving group:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave group');
      return false;
    }
  }, [user, currentGroup]);

  // Helper functions
  const isAdmin = currentGroup?.myRole === 'admin' || currentGroup?.myRole === 'owner';
  const isOwner = currentGroup?.myRole === 'owner';
  const canManageItems = currentGroup?.myRole !== 'viewer';

  const getItemsByType = useCallback((type: ItemType) => {
    return items.filter(item => item.item_type === type && item.status !== 'deleted');
  }, [items]);

  const getActiveItems = useCallback(() => {
    return items.filter(item => item.status === 'active');
  }, [items]);

  const getCompletedItems = useCallback(() => {
    return items.filter(item => item.status === 'completed');
  }, [items]);

  // Stats
  const stats = {
    totalItems: items.filter(i => i.status !== 'deleted').length,
    activeItems: items.filter(i => i.status === 'active').length,
    completedItems: items.filter(i => i.status === 'completed').length,
    memberCount: currentGroup?.member_count || 0,
    tasksDue: items.filter(i => 
      i.item_type === 'task' && 
      i.status === 'active' && 
      i.due_date && 
      new Date(i.due_date) <= new Date()
    ).length
  };

  // Initial fetch
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    // State
    groups,
    currentGroup,
    items,
    activity,
    invitations,
    isLoading,
    error,
    
    // Group operations
    fetchGroups,
    selectGroup,
    createGroup,
    updateGroup,
    deleteGroup,
    
    // Item operations
    createItem,
    updateItem,
    completeItem,
    deleteItem,
    
    // Member operations
    inviteMember,
    acceptInvitation,
    updateMemberRole,
    removeMember,
    leaveGroup,
    
    // Helpers
    isAdmin,
    isOwner,
    canManageItems,
    getItemsByType,
    getActiveItems,
    getCompletedItems,
    stats
  };
}
