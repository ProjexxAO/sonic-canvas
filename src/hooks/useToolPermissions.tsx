import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useWorkspaces } from './useWorkspaces';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface ToolCatalogItem {
  id: string;
  tool_id: string;
  name: string;
  description: string | null;
  icon: string;
  category: string | null;
  auto_invokable: boolean;
}

interface ToolItem {
  tool: string;
  label: string;
  icon: string;
  metadata: {
    autoInvokable?: boolean;
    category?: string;
    reason?: string;
    boost?: number;
  };
}

interface ToolSection {
  id: string;
  title: string;
  description: string;
  droppable: boolean;
  items: ToolItem[];
}

const defaultSections: ToolSection[] = [
  {
    id: 'allowed',
    title: 'Allowed Tools',
    description: 'Tools this user is permitted to use.',
    droppable: true,
    items: []
  },
  {
    id: 'blocked',
    title: 'Blocked Tools',
    description: 'Tools this user is not allowed to use.',
    droppable: true,
    items: []
  },
  {
    id: 'preferred',
    title: 'Preferred Tools',
    description: 'Tools the user prefers or uses frequently.',
    droppable: true,
    items: []
  },
  {
    id: 'available',
    title: 'Available Tools',
    description: 'Tools not yet assigned to any category.',
    droppable: true,
    items: []
  }
];

export function useToolPermissions(targetUserId?: string) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaces();
  const [sections, setSections] = useState<ToolSection[]>(defaultSections);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Use targetUserId if provided, otherwise use current user
  const effectiveUserId = targetUserId || user?.id;

  // Fetch tool catalog and permissions
  const fetchPermissions = useCallback(async () => {
    if (!effectiveUserId || !currentWorkspace) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch tool catalog
      const { data: catalog, error: catalogError } = await supabase
        .from('tool_catalog')
        .select('*');

      if (catalogError) throw catalogError;

      // Fetch user's permissions for this workspace
      const { data: permissions, error: permError } = await supabase
        .from('workspace_tool_permissions')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .eq('user_id', effectiveUserId);

      if (permError) throw permError;

      // Build sections from catalog and permissions
      const permissionMap = new Map(
        permissions?.map(p => [p.tool_id, { section: p.section, metadata: p.metadata }]) || []
      );

      const newSections: ToolSection[] = defaultSections.map(section => ({
        ...section,
        items: []
      }));

      catalog?.forEach((tool: ToolCatalogItem) => {
        const perm = permissionMap.get(tool.tool_id);
        const sectionId = perm?.section || 'available';
        const metadata = perm?.metadata as Record<string, unknown> || {};

        const toolItem: ToolItem = {
          tool: tool.tool_id,
          label: tool.name,
          icon: tool.icon,
          metadata: {
            autoInvokable: tool.auto_invokable,
            category: tool.category || undefined,
            ...metadata
          }
        };

        const section = newSections.find(s => s.id === sectionId);
        if (section) {
          section.items.push(toolItem);
        }
      });

      setSections(newSections);
    } catch (err) {
      console.error('Error fetching tool permissions:', err);
      toast.error('Failed to load tool permissions');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, currentWorkspace]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Save permissions to database
  const savePermissions = useCallback(async (newSections: ToolSection[]) => {
    if (!effectiveUserId || !currentWorkspace) return;

    try {
      setSaving(true);

      // Build upsert data from all sections
      const upsertData: {
        workspace_id: string;
        user_id: string;
        tool_id: string;
        section: string;
        metadata: Json;
      }[] = [];

      newSections.forEach(section => {
        section.items.forEach(item => {
          upsertData.push({
            workspace_id: currentWorkspace.id,
            user_id: effectiveUserId,
            tool_id: item.tool,
            section: section.id,
            metadata: {
              boost: item.metadata.boost ?? null,
              reason: item.metadata.reason ?? null
            } as Json
          });
        });
      });

      // Delete existing permissions for this workspace/user
      const { error: deleteError } = await supabase
        .from('workspace_tool_permissions')
        .delete()
        .eq('workspace_id', currentWorkspace.id)
        .eq('user_id', effectiveUserId);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (upsertData.length > 0) {
        const { error: insertError } = await supabase
          .from('workspace_tool_permissions')
          .insert(upsertData);

        if (insertError) throw insertError;
      }

      setSections(newSections);
      toast.success('Tool permissions saved');
    } catch (err) {
      console.error('Error saving tool permissions:', err);
      toast.error('Failed to save tool permissions');
    } finally {
      setSaving(false);
    }
  }, [effectiveUserId, currentWorkspace]);

  return {
    sections,
    loading,
    saving,
    savePermissions,
    refreshPermissions: fetchPermissions
  };
}
