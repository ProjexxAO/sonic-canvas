// Atlas Sonic OS - Cross-Hub Access Hook
// Manages access permissions between Personal, Group, and C-Suite hubs

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type HubType = 'personal' | 'group' | 'csuite';
export type AccessType = 'read' | 'write' | 'admin';

export type CrossHubAccess = Tables<'cross_hub_access'>;

export interface CrossHubGrant {
  id: string;
  granteeUserId: string;
  granteeDisplayName?: string;
  sourceHubType: HubType;
  sourceHubId?: string;
  sourceHubName?: string;
  accessType: AccessType;
  allowedDomains: string[] | null;
  grantedBy: string;
  grantedByName?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export function useCrossHubAccess() {
  const { user } = useAuth();
  const [grantedToMe, setGrantedToMe] = useState<CrossHubGrant[]>([]);
  const [grantedByMe, setGrantedByMe] = useState<CrossHubGrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all cross-hub access grants
  const fetchAccess = useCallback(async () => {
    if (!user) {
      setGrantedToMe([]);
      setGrantedByMe([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch grants where I am the grantee
      const { data: toMeData, error: toMeError } = await supabase
        .from('cross_hub_access')
        .select('*')
        .eq('grantee_user_id', user.id)
        .eq('is_active', true);

      if (toMeError) throw toMeError;

      // Fetch grants where I am the granter
      const { data: byMeData, error: byMeError } = await supabase
        .from('cross_hub_access')
        .select('*')
        .eq('granted_by', user.id);

      if (byMeError) throw byMeError;

      // Transform data
      const transformGrant = (grant: CrossHubAccess): CrossHubGrant => ({
        id: grant.id,
        granteeUserId: grant.grantee_user_id,
        sourceHubType: grant.source_hub_type as HubType,
        sourceHubId: grant.source_hub_id || undefined,
        accessType: grant.access_type as AccessType,
        allowedDomains: grant.allowed_domains,
        grantedBy: grant.granted_by,
        isActive: grant.is_active ?? true,
        expiresAt: grant.expires_at || undefined,
        createdAt: grant.created_at
      });

      setGrantedToMe((toMeData || []).map(transformGrant));
      setGrantedByMe((byMeData || []).map(transformGrant));
    } catch (err) {
      console.error('Error fetching cross-hub access:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch access grants');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Grant access to another user
  const grantAccess = useCallback(async (
    granteeUserId: string,
    sourceHubType: HubType,
    accessType: AccessType = 'read',
    options?: {
      sourceHubId?: string;
      allowedDomains?: string[];
      expiresAt?: Date;
    }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('cross_hub_access')
        .insert({
          grantee_user_id: granteeUserId,
          source_hub_type: sourceHubType,
          source_hub_id: options?.sourceHubId || null,
          access_type: accessType,
          allowed_domains: options?.allowedDomains || null,
          granted_by: user.id,
          expires_at: options?.expiresAt?.toISOString() || null
        } as TablesInsert<'cross_hub_access'>);

      if (error) throw error;

      await fetchAccess();
      return true;
    } catch (err) {
      console.error('Error granting access:', err);
      setError(err instanceof Error ? err.message : 'Failed to grant access');
      return false;
    }
  }, [user, fetchAccess]);

  // Revoke access
  const revokeAccess = useCallback(async (grantId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cross_hub_access')
        .delete()
        .eq('id', grantId);

      if (error) throw error;

      setGrantedByMe(prev => prev.filter(g => g.id !== grantId));
      return true;
    } catch (err) {
      console.error('Error revoking access:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke access');
      return false;
    }
  }, []);

  // Update access
  const updateAccess = useCallback(async (
    grantId: string,
    updates: {
      accessType?: AccessType;
      allowedDomains?: string[];
      isActive?: boolean;
      expiresAt?: Date | null;
    }
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      if (updates.accessType) updateData.access_type = updates.accessType;
      if (updates.allowedDomains !== undefined) updateData.allowed_domains = updates.allowedDomains;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.expiresAt !== undefined) {
        updateData.expires_at = updates.expiresAt?.toISOString() || null;
      }

      const { error } = await supabase
        .from('cross_hub_access')
        .update(updateData)
        .eq('id', grantId);

      if (error) throw error;

      await fetchAccess();
      return true;
    } catch (err) {
      console.error('Error updating access:', err);
      setError(err instanceof Error ? err.message : 'Failed to update access');
      return false;
    }
  }, [fetchAccess]);

  // Check if current user has access to a specific hub
  const hasAccessTo = useCallback((
    hubType: HubType,
    hubId?: string,
    requiredAccess: AccessType = 'read'
  ): boolean => {
    // Personal hub is always accessible to the owner
    if (hubType === 'personal' && !hubId) return true;

    const grant = grantedToMe.find(g => {
      if (g.sourceHubType !== hubType) return false;
      if (hubId && g.sourceHubId && g.sourceHubId !== hubId) return false;
      if (!g.isActive) return false;
      if (g.expiresAt && new Date(g.expiresAt) < new Date()) return false;
      
      // Check access level
      if (requiredAccess === 'read') return true;
      if (requiredAccess === 'write') return g.accessType === 'write' || g.accessType === 'admin';
      if (requiredAccess === 'admin') return g.accessType === 'admin';
      return false;
    });

    return !!grant;
  }, [grantedToMe]);

  // Get accessible hubs by type
  const getAccessibleHubs = useCallback((hubType: HubType): CrossHubGrant[] => {
    return grantedToMe.filter(g => 
      g.sourceHubType === hubType && 
      g.isActive &&
      (!g.expiresAt || new Date(g.expiresAt) > new Date())
    );
  }, [grantedToMe]);

  // Initial fetch
  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  return {
    // State
    grantedToMe,
    grantedByMe,
    isLoading,
    error,
    
    // Operations
    fetchAccess,
    grantAccess,
    revokeAccess,
    updateAccess,
    
    // Helpers
    hasAccessTo,
    getAccessibleHubs
  };
}
