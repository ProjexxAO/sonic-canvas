/**
 * Atlas Dashboard Control Hook
 * Provides unified control over shared dashboards for Atlas AI assistant.
 * Respects role-based permissions (viewer, contributor, editor, admin, owner).
 */

import { useCallback, useMemo } from 'react';
import { useSharedDashboards } from './useSharedDashboards';
import { useDashboardChat } from './useDashboardChat';
import { useDashboardNotifications } from './useDashboardNotifications';
import { useDashboardFiles } from './useDashboardFiles';
import { supabase } from '@/integrations/supabase/client';

export interface AtlasDashboardContext {
  currentDashboard: {
    id: string;
    name: string;
    role: string;
    memberCount: number;
    sharedItemCount: number;
  } | null;
  permissions: {
    canChat: boolean;
    canComment: boolean;
    canUpload: boolean;
    canShare: boolean;
    canManage: boolean;
  };
}

export interface DashboardSummary {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  role: string;
  lastActivity: string | null;
}

export function useAtlasDashboardControl(userId: string | undefined) {
  // Core dashboard hooks
  const sharedDashboards = useSharedDashboards(userId);
  const dashboardNotifications = useDashboardNotifications(userId);
  
  // Current dashboard context
  const currentDashboardId = sharedDashboards.currentDashboard?.id || null;
  const dashboardChat = useDashboardChat(currentDashboardId, userId);
  const dashboardFiles = useDashboardFiles(currentDashboardId, userId);
  
  // Get user's role and permissions for current dashboard
  const myPermissions = useMemo(() => {
    const perms = sharedDashboards.getMyPermissions();
    // Get role from member list
    const member = sharedDashboards.members.find(m => m.user_id === userId);
    return {
      ...perms,
      role: member?.role || 'viewer',
      isAdmin: perms.canManage,
    };
  }, [sharedDashboards, userId]);

  // ==================== Dashboard Navigation ====================
  
  const listDashboards = useCallback(async (): Promise<DashboardSummary[]> => {
    await sharedDashboards.fetchDashboards();
    
    return sharedDashboards.dashboards.map(d => {
      const member = sharedDashboards.members.find(m => m.user_id === userId);
      return {
        id: d.id,
        name: d.name,
        description: d.description,
        memberCount: sharedDashboards.members.filter(m => m.dashboard_id === d.id).length || 0,
        role: member?.role || 'viewer',
        lastActivity: d.updated_at,
      };
    });
  }, [sharedDashboards, userId]);

  const selectDashboard = useCallback(async (dashboardId: string | null): Promise<boolean> => {
    try {
      await sharedDashboards.selectDashboard(dashboardId);
      return true;
    } catch (error) {
      console.error('[AtlasDashboardControl] Failed to select dashboard:', error);
      return false;
    }
  }, [sharedDashboards]);

  const getDashboardInfo = useCallback((): AtlasDashboardContext => {
    const dashboard = sharedDashboards.currentDashboard;
    if (!dashboard) {
      return {
        currentDashboard: null,
        permissions: {
          canChat: false,
          canComment: false,
          canUpload: false,
          canShare: false,
          canManage: false,
        },
      };
    }

    return {
      currentDashboard: {
        id: dashboard.id,
        name: dashboard.name,
        role: myPermissions.role,
        memberCount: sharedDashboards.members.length,
        sharedItemCount: sharedDashboards.sharedItems.length,
      },
      permissions: {
        canChat: myPermissions.canComment,
        canComment: myPermissions.canComment,
        canUpload: myPermissions.canUpload,
        canShare: myPermissions.canShare,
        canManage: myPermissions.isAdmin,
      },
    };
  }, [sharedDashboards, myPermissions]);

  // ==================== Chat Operations ====================

  const getRecentMessages = useCallback(async (limit: number = 20) => {
    if (!currentDashboardId) {
      return { success: false, error: 'No dashboard selected', messages: [] };
    }
    
    return {
      success: true,
      messages: dashboardChat.messages.slice(0, limit).map(m => ({
        id: m.id,
        content: m.content,
        senderName: m.user_name || 'Unknown',
        senderAvatar: m.user_avatar,
        createdAt: m.created_at,
        isEdited: m.is_edited,
      })),
    };
  }, [currentDashboardId, dashboardChat.messages]);

  const sendMessage = useCallback(async (content: string, mentions?: string[]): Promise<{ success: boolean; error?: string }> => {
    if (!currentDashboardId) {
      return { success: false, error: 'No dashboard selected' };
    }
    
    if (!myPermissions.canComment) {
      return { success: false, error: 'You do not have permission to send messages in this dashboard' };
    }

    try {
      await dashboardChat.sendMessage(content, mentions ? { mentions } : undefined);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
    }
  }, [currentDashboardId, myPermissions, dashboardChat]);

  // ==================== File Operations ====================

  const listFiles = useCallback(async () => {
    if (!currentDashboardId) {
      return { success: false, error: 'No dashboard selected', files: [] };
    }

    return {
      success: true,
      files: dashboardFiles.files.map(f => ({
        id: f.id,
        name: f.file_name,
        size: f.file_size,
        mimeType: f.mime_type,
        uploadedBy: f.uploader_name || 'Unknown',
        uploadedAt: f.created_at,
        downloadUrl: f.download_url,
      })),
    };
  }, [currentDashboardId, dashboardFiles.files]);

  const downloadFile = useCallback(async (fileId: string) => {
    const file = dashboardFiles.files.find(f => f.id === fileId);
    if (!file) {
      return { success: false, error: 'File not found' };
    }
    
    dashboardFiles.downloadFile(file);
    return { success: true, url: file.download_url };
  }, [dashboardFiles]);

  // ==================== Comments Operations ====================

  const getItemComments = useCallback(async (sharedItemId: string) => {
    if (!userId) {
      return { success: false, error: 'Not authenticated', comments: [] };
    }

    const { data, error } = await supabase
      .from('item_comments')
      .select('id, content, user_id, created_at, is_edited')
      .eq('shared_item_id', sharedItemId)
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: error.message, comments: [] };
    }

    return {
      success: true,
      comments: data || [],
    };
  }, [userId]);

  const addItemComment = useCallback(async (sharedItemId: string, content: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    if (!myPermissions.canComment) {
      return { success: false, error: 'You do not have permission to comment' };
    }

    const { error } = await supabase
      .from('item_comments')
      .insert({
        shared_item_id: sharedItemId,
        user_id: userId,
        content,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }, [userId, myPermissions]);

  // ==================== Notifications ====================

  const getNotifications = useCallback(async (unreadOnly: boolean = true) => {
    const notifications = unreadOnly
      ? dashboardNotifications.notifications.filter(n => !n.is_read)
      : dashboardNotifications.notifications;

    return {
      success: true,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.notification_type,
        isRead: n.is_read,
        actorName: n.actor_name,
        dashboardName: n.dashboard_name,
        createdAt: n.created_at,
      })),
      unreadCount: dashboardNotifications.unreadCount,
    };
  }, [dashboardNotifications]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await dashboardNotifications.markAsRead(notificationId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to mark as read' };
    }
  }, [dashboardNotifications]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await dashboardNotifications.markAllAsRead();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to mark all as read' };
    }
  }, [dashboardNotifications]);

  // ==================== Member Operations ====================

  const getDashboardMembers = useCallback(async () => {
    if (!currentDashboardId) {
      return { success: false, error: 'No dashboard selected', members: [] };
    }

    return {
      success: true,
      members: sharedDashboards.members.map(m => ({
        userId: m.user_id,
        displayName: m.display_name || 'Unknown User',
        avatarUrl: m.avatar_url,
        role: m.role,
        canComment: m.can_comment,
        canShare: m.can_share,
        canUpload: m.can_upload,
        joinedAt: m.joined_at,
      })),
    };
  }, [currentDashboardId, sharedDashboards.members]);

  const getActiveViewers = useCallback(() => {
    return {
      success: true,
      viewers: sharedDashboards.activeViewers.map(v => ({
        id: v.user_id,
        displayName: v.display_name || 'Unknown',
        avatarUrl: v.avatar_url,
        lastSeen: new Date().toISOString(),
      })),
    };
  }, [sharedDashboards.activeViewers]);

  // ==================== Shared Items ====================

  const getSharedItems = useCallback(async () => {
    if (!currentDashboardId) {
      return { success: false, error: 'No dashboard selected', items: [] };
    }

    return {
      success: true,
      items: sharedDashboards.sharedItems.map(item => ({
        id: item.id,
        itemType: item.item_type,
        itemId: item.item_id,
        note: item.note,
        isPinned: item.pin_position !== null,
        sharedBy: item.shared_by,
        createdAt: item.created_at,
      })),
    };
  }, [currentDashboardId, sharedDashboards.sharedItems]);

  const shareItem = useCallback(async (itemType: string, itemId: string, note?: string) => {
    if (!currentDashboardId) {
      return { success: false, error: 'No dashboard selected' };
    }

    if (!myPermissions.canShare) {
      return { success: false, error: 'You do not have permission to share items' };
    }

    try {
      await sharedDashboards.shareItem(itemType, itemId, note);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to share item' };
    }
  }, [currentDashboardId, myPermissions, sharedDashboards]);

  // ==================== Activity Log ====================

  const getRecentActivity = useCallback(async (limit: number = 20) => {
    if (!currentDashboardId) {
      return { success: false, error: 'No dashboard selected', activities: [] };
    }

    return {
      success: true,
      activities: sharedDashboards.activities.slice(0, limit).map(a => ({
        id: a.id,
        action: a.action,
        userName: a.user_name || 'Unknown',
        itemType: a.item_type,
        createdAt: a.created_at,
        metadata: a.metadata,
      })),
    };
  }, [currentDashboardId, sharedDashboards.activities]);

  // ==================== AI Summary Generation ====================

  const generateDashboardSummary = useCallback(async (): Promise<{ success: boolean; summary?: string; error?: string }> => {
    if (!currentDashboardId || !userId) {
      return { success: false, error: 'No dashboard selected' };
    }

    try {
      const response = await supabase.functions.invoke('atlas-orchestrator', {
        body: {
          action: 'dashboard_summary',
          userId,
          dashboardId: currentDashboardId,
        },
      });

      if (response.error) throw response.error;

      return {
        success: true,
        summary: response.data?.summary || 'No summary available',
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to generate summary' };
    }
  }, [currentDashboardId, userId]);

  // ==================== Cross-Dashboard Query ====================

  const queryAcrossDashboards = useCallback(async (query: string) => {
    if (!userId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await supabase.functions.invoke('atlas-enterprise-query', {
        body: {
          action: 'dashboard_correlate',
          userId,
          query,
        },
      });

      if (response.error) throw response.error;

      return {
        success: true,
        ...response.data,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Query failed' };
    }
  }, [userId]);

  return {
    // State
    dashboards: sharedDashboards.dashboards,
    currentDashboard: sharedDashboards.currentDashboard,
    members: sharedDashboards.members,
    sharedItems: sharedDashboards.sharedItems,
    activities: sharedDashboards.activities,
    activeViewers: sharedDashboards.activeViewers,
    messages: dashboardChat.messages,
    files: dashboardFiles.files,
    notifications: dashboardNotifications.notifications,
    unreadCount: dashboardNotifications.unreadCount,
    
    // Loading states
    isLoading: sharedDashboards.isLoading || dashboardChat.isLoading || dashboardFiles.isLoading,
    
    // Permissions
    myPermissions,
    
    // Dashboard navigation
    listDashboards,
    selectDashboard,
    getDashboardInfo,
    
    // Chat
    getRecentMessages,
    sendMessage,
    
    // Files
    listFiles,
    downloadFile,
    
    // Comments
    getItemComments,
    addItemComment,
    
    // Notifications
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    
    // Members
    getDashboardMembers,
    getActiveViewers,
    
    // Shared items
    getSharedItems,
    shareItem,
    
    // Activity
    getRecentActivity,
    
    // AI
    generateDashboardSummary,
    queryAcrossDashboards,
    
    // Direct access to underlying hooks
    sharedDashboards,
    dashboardChat,
    dashboardFiles,
    dashboardNotifications,
  };
}
