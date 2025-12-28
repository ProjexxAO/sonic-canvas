import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PersonaPermission {
  id: string;
  persona_id: string;
  domain: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function usePersonaPermissions(personaId: string | null) {
  const [permissions, setPermissions] = useState<PersonaPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!personaId) {
      setPermissions([]);
      return;
    }

    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('persona_permissions')
          .select('*')
          .eq('persona_id', personaId);

        if (error) throw error;
        setPermissions(data || []);
      } catch (error) {
        console.error('Error fetching persona permissions:', error);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [personaId]);

  const canViewDomain = (domain: string): boolean => {
    const perm = permissions.find(p => p.domain === domain);
    return perm?.can_view ?? true; // Default to true if no permission set
  };

  const canCreateInDomain = (domain: string): boolean => {
    const perm = permissions.find(p => p.domain === domain);
    return perm?.can_create ?? false;
  };

  const canEditInDomain = (domain: string): boolean => {
    const perm = permissions.find(p => p.domain === domain);
    return perm?.can_edit ?? false;
  };

  const canDeleteInDomain = (domain: string): boolean => {
    const perm = permissions.find(p => p.domain === domain);
    return perm?.can_delete ?? false;
  };

  const getViewableDomains = (): string[] => {
    return permissions.filter(p => p.can_view).map(p => p.domain);
  };

  return {
    permissions,
    isLoading,
    canViewDomain,
    canCreateInDomain,
    canEditInDomain,
    canDeleteInDomain,
    getViewableDomains,
  };
}
