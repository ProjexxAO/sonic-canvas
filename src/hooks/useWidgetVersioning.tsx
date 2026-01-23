// Widget Versioning System - Safe updates with rollback capability
// Ensures user data is never compromised during widget updates

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { CustomWidget } from './useCustomWidgets';

export interface WidgetVersion {
  id: string;
  widget_id: string;
  user_id: string;
  version_number: number;
  version_name?: string;
  config: Record<string, any>;
  ai_capabilities?: Record<string, any>;
  data_sources?: string[];
  style?: Record<string, any>;
  layout?: Record<string, any>;
  agent_chain?: string[];
  generation_prompt?: string;
  is_current: boolean;
  created_at: string;
  created_by: string;
  change_summary?: string;
  data_snapshot?: Record<string, any>;
  rollback_available: boolean;
}

export interface WidgetUpdateInfo {
  available: boolean;
  currentVersion: number;
  latestVersion: number;
  improvements: string[];
  breakingChanges: boolean;
  securityNotes?: string;
  bestPractices?: Record<string, any>;
}

export interface SafeUpdateResult {
  success: boolean;
  newVersion?: number;
  backupId?: string;
  error?: string;
}

export function useWidgetVersioning() {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Get version history for a widget
  const getVersionHistory = useCallback(async (widgetId: string): Promise<WidgetVersion[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await (supabase as any)
        .from('widget_versions')
        .select('*')
        .eq('widget_id', widgetId)
        .eq('user_id', user.id)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching version history:', error);
      return [];
    }
  }, [user?.id]);

  // Create a manual version snapshot (before major changes)
  const createVersionSnapshot = useCallback(async (
    widget: CustomWidget,
    changeSummary?: string
  ): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('widget_versions')
        .insert({
          widget_id: widget.id,
          user_id: user.id,
          version_number: widget.version,
          config: widget.config,
          ai_capabilities: widget.ai_capabilities,
          data_sources: widget.data_sources,
          style: widget.style,
          layout: widget.layout,
          agent_chain: widget.agent_chain,
          generation_prompt: widget.generation_prompt,
          is_current: true,
          created_by: 'user',
          change_summary: changeSummary || 'Manual snapshot',
          rollback_available: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Mark previous versions as not current
      await (supabase as any)
        .from('widget_versions')
        .update({ is_current: false })
        .eq('widget_id', widget.id)
        .neq('id', data.id);

      return data.id;
    } catch (error) {
      console.error('Error creating version snapshot:', error);
      return null;
    }
  }, [user?.id]);

  // Check for available updates
  const checkForUpdates = useCallback(async (widget: CustomWidget): Promise<WidgetUpdateInfo | null> => {
    if (!user?.id) return null;
    
    setIsChecking(true);
    try {
      // Check the update registry for this widget type
      const { data: registry, error } = await (supabase as any)
        .from('widget_update_registry')
        .select('*')
        .eq('widget_type', widget.widget_type)
        .order('latest_version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // Update the widget's last check timestamp
      await (supabase as any)
        .from('custom_widgets')
        .update({ 
          last_update_check: new Date().toISOString(),
          update_available: registry ? registry.latest_version > widget.version : false,
          update_version: registry?.latest_version
        })
        .eq('id', widget.id);

      if (!registry || registry.latest_version <= widget.version) {
        return {
          available: false,
          currentVersion: widget.version,
          latestVersion: widget.version,
          improvements: [],
          breakingChanges: false,
        };
      }

      return {
        available: true,
        currentVersion: widget.version,
        latestVersion: registry.latest_version,
        improvements: registry.improvements || [],
        breakingChanges: registry.breaking_changes || false,
        securityNotes: registry.security_notes,
        bestPractices: registry.best_practices,
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [user?.id]);

  // Safely update a widget with automatic backup
  const safeUpdate = useCallback(async (
    widget: CustomWidget,
    updates: Partial<CustomWidget>,
    changeSummary?: string
  ): Promise<SafeUpdateResult> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    setIsUpdating(true);
    try {
      // Step 1: Create backup snapshot
      const backupId = await createVersionSnapshot(widget, `Pre-update backup: ${changeSummary || 'Widget update'}`);
      if (!backupId) {
        throw new Error('Failed to create backup snapshot');
      }

      // Step 2: Apply updates with version increment
      const newVersion = widget.version + 1;
      const { error: updateError } = await (supabase as any)
        .from('custom_widgets')
        .update({
          ...updates,
          version: newVersion,
          updated_at: new Date().toISOString(),
          security_verified: true,
        })
        .eq('id', widget.id);

      if (updateError) throw updateError;

      // Step 3: Create new version record
      await (supabase as any)
        .from('widget_versions')
        .insert({
          widget_id: widget.id,
          user_id: user.id,
          version_number: newVersion,
          config: updates.config || widget.config,
          ai_capabilities: updates.ai_capabilities || widget.ai_capabilities,
          data_sources: updates.data_sources || widget.data_sources,
          style: updates.style || widget.style,
          layout: updates.layout || widget.layout,
          agent_chain: updates.agent_chain || widget.agent_chain,
          generation_prompt: updates.generation_prompt || widget.generation_prompt,
          is_current: true,
          created_by: 'user',
          change_summary: changeSummary || 'Widget updated',
          rollback_available: true,
        });

      toast.success(`Widget updated to v${newVersion}`, {
        description: 'Backup created - you can rollback anytime',
      });

      return { success: true, newVersion, backupId };
    } catch (error: any) {
      console.error('Error updating widget:', error);
      toast.error('Update failed', {
        description: error.message || 'Your widget was not modified',
      });
      return { success: false, error: error.message };
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, createVersionSnapshot]);

  // Rollback to a previous version
  const rollbackToVersion = useCallback(async (
    widgetId: string,
    versionId: string
  ): Promise<boolean> => {
    if (!user?.id) return false;
    
    setIsRollingBack(true);
    try {
      // Get the version to restore
      const { data: version, error: fetchError } = await (supabase as any)
        .from('widget_versions')
        .select('*')
        .eq('id', versionId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !version) throw new Error('Version not found');
      if (!version.rollback_available) throw new Error('Rollback not available for this version');

      // Apply the version to the widget
      const { error: updateError } = await (supabase as any)
        .from('custom_widgets')
        .update({
          config: version.config,
          ai_capabilities: version.ai_capabilities,
          data_sources: version.data_sources,
          style: version.style,
          layout: version.layout,
          agent_chain: version.agent_chain,
          generation_prompt: version.generation_prompt,
          version: version.version_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', widgetId);

      if (updateError) throw updateError;

      // Update version records
      await (supabase as any)
        .from('widget_versions')
        .update({ is_current: false })
        .eq('widget_id', widgetId);

      await (supabase as any)
        .from('widget_versions')
        .update({ is_current: true })
        .eq('id', versionId);

      toast.success(`Rolled back to v${version.version_number}`, {
        description: 'Your widget has been restored',
      });

      return true;
    } catch (error: any) {
      console.error('Error rolling back:', error);
      toast.error('Rollback failed', {
        description: error.message,
      });
      return false;
    } finally {
      setIsRollingBack(false);
    }
  }, [user?.id]);

  // Verify widget security and data integrity
  const verifyWidgetSecurity = useCallback(async (widgetId: string): Promise<{
    secure: boolean;
    issues: string[];
  }> => {
    const issues: string[] = [];
    
    try {
      const { data: widget, error } = await (supabase as any)
        .from('custom_widgets')
        .select('*')
        .eq('id', widgetId)
        .single();

      if (error || !widget) {
        return { secure: false, issues: ['Widget not found'] };
      }

      // Check for security concerns
      if (!widget.security_verified) {
        issues.push('Widget has not been security verified');
      }

      // Validate AI capabilities
      if (widget.ai_capabilities?.enabled) {
        const caps = widget.ai_capabilities.capabilities || [];
        const dangerousCaps = caps.filter((c: string) => 
          c.includes('execute') || c.includes('delete') || c.includes('admin')
        );
        if (dangerousCaps.length > 0) {
          issues.push(`Widget has elevated capabilities: ${dangerousCaps.join(', ')}`);
        }
      }

      // Check data source access
      const sensitiveDataSources = ['banking', 'health', 'passwords'];
      const hasSensitive = (widget.data_sources || []).some((ds: string) => 
        sensitiveDataSources.includes(ds)
      );
      if (hasSensitive) {
        issues.push('Widget accesses sensitive data sources');
      }

      // Mark as verified if no issues
      if (issues.length === 0) {
        await (supabase as any)
          .from('custom_widgets')
          .update({ security_verified: true })
          .eq('id', widgetId);
      }

      return { secure: issues.length === 0, issues };
    } catch (error) {
      console.error('Error verifying security:', error);
      return { secure: false, issues: ['Verification failed'] };
    }
  }, []);

  return {
    // State
    isChecking,
    isUpdating,
    isRollingBack,
    
    // Version management
    getVersionHistory,
    createVersionSnapshot,
    
    // Updates
    checkForUpdates,
    safeUpdate,
    rollbackToVersion,
    
    // Security
    verifyWidgetSecurity,
  };
}
