/**
 * Atlas Data Hub Control Hook
 * Provides full C-Suite Data Hub control capabilities for Atlas
 * with persona permission enforcement and admin hierarchy support
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataHubController, getDomainKeyFromName, getTabFromName, getPersonaFromName } from './useDataHubController';
import { usePersonaPermissions } from './usePersonaPermissions';
import { DomainKey } from './useCSuiteData';
import { toast } from 'sonner';

interface AtlasControlResult {
  success: boolean;
  message: string;
  data?: any;
}

interface AtlasDataHubControlOptions {
  userId: string | undefined;
  personaId: string | null;
  isAdmin?: boolean;
}

// Valid table names for C-Suite domains
type CSuiteTableName = 
  | 'csuite_communications' 
  | 'csuite_documents' 
  | 'csuite_events' 
  | 'csuite_financials' 
  | 'csuite_tasks' 
  | 'csuite_knowledge';

// Helper to map domain keys to table names
function getTableForDomain(domain: DomainKey): CSuiteTableName {
  const tableMap: Record<DomainKey, CSuiteTableName> = {
    communications: 'csuite_communications',
    documents: 'csuite_documents',
    events: 'csuite_events',
    financials: 'csuite_financials',
    tasks: 'csuite_tasks',
    knowledge: 'csuite_knowledge',
  };
  return tableMap[domain];
}

export function useAtlasDataHubControl({ userId, personaId, isAdmin = false }: AtlasDataHubControlOptions) {
  const controller = useDataHubController();
  const permissions = usePersonaPermissions(personaId);

  // ============= NAVIGATION CONTROLS =============

  const switchTab = useCallback((tabName: string): AtlasControlResult => {
    const tabId = getTabFromName(tabName);
    if (!tabId) {
      return { success: false, message: `Unknown tab "${tabName}". Available: command, insights, admin` };
    }

    // Admin tab requires admin privileges
    if (tabId === 'admin' && !isAdmin) {
      return { success: false, message: 'Admin tab requires administrator privileges' };
    }

    controller.setActiveTab(tabId);
    toast.info(`Switched to ${tabId} tab`);
    return { success: true, message: `Switched to ${tabId} tab` };
  }, [controller, isAdmin]);

  const openDomain = useCallback((domainName: string): AtlasControlResult => {
    const domainKey = getDomainKeyFromName(domainName);
    if (!domainKey) {
      return { success: false, message: `Unknown domain "${domainName}". Available: communications, documents, events, financials, tasks, knowledge` };
    }

    // Check persona permission
    if (!permissions.canViewDomain(domainKey)) {
      return { success: false, message: `Your persona does not have access to view ${domainKey}` };
    }

    controller.setExpandedDomain(domainKey);
    controller.setActiveTab('command');
    toast.info(`Opened ${domainKey} domain`);
    return { success: true, message: `Opened ${domainKey} domain` };
  }, [controller, permissions]);

  const closeDomain = useCallback((): AtlasControlResult => {
    controller.setExpandedDomain(null);
    return { success: true, message: 'Closed domain view' };
  }, [controller]);

  const switchPersona = useCallback((personaName: string): AtlasControlResult => {
    const newPersonaId = getPersonaFromName(personaName);
    if (!newPersonaId) {
      return { success: false, message: `Unknown persona "${personaName}". Try: CEO, CFO, COO, CTO, CMO, etc.` };
    }

    controller.setTargetPersona(newPersonaId);
    toast.info(`Switched to ${newPersonaId.toUpperCase()} persona`);
    return { success: true, message: `Switched to ${newPersonaId.toUpperCase()} persona` };
  }, [controller]);

  // ============= DATA OPERATIONS =============

  const createItem = useCallback(async (domain: string, itemData: Record<string, any>): Promise<AtlasControlResult> => {
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    const domainKey = getDomainKeyFromName(domain);
    if (!domainKey) {
      return { success: false, message: `Unknown domain "${domain}"` };
    }

    // Check create permission
    if (!permissions.canCreateInDomain(domainKey)) {
      return { success: false, message: `Your persona does not have permission to create in ${domainKey}` };
    }

    try {
      const tableName = getTableForDomain(domainKey);
      
      // Build insert data with required fields
      const insertData = {
        ...itemData,
        user_id: userId,
        source: 'atlas',
        title: itemData.title || 'Untitled',
      };
      
      const { data, error } = await supabase
        .from(tableName)
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      toast.success(`Created new ${domainKey} item`);
      return { success: true, message: `Created new item in ${domainKey}`, data };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Creation failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, [userId, permissions]);

  const updateItem = useCallback(async (domain: string, itemId: string, updates: Record<string, any>): Promise<AtlasControlResult> => {
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    const domainKey = getDomainKeyFromName(domain);
    if (!domainKey) {
      return { success: false, message: `Unknown domain "${domain}"` };
    }

    // Check edit permission
    if (!permissions.canEditInDomain(domainKey)) {
      return { success: false, message: `Your persona does not have permission to edit in ${domainKey}` };
    }

    try {
      const tableName = getTableForDomain(domainKey);
      const { data, error } = await supabase
        .from(tableName)
        .update(updates as any)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      toast.success(`Updated ${domainKey} item`);
      return { success: true, message: `Updated item in ${domainKey}`, data };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Update failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, [userId, permissions]);

  const deleteItem = useCallback(async (domain: string, itemId: string): Promise<AtlasControlResult> => {
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    const domainKey = getDomainKeyFromName(domain);
    if (!domainKey) {
      return { success: false, message: `Unknown domain "${domain}"` };
    }

    // Check delete permission
    if (!permissions.canDeleteInDomain(domainKey)) {
      return { success: false, message: `Your persona does not have permission to delete from ${domainKey}` };
    }

    try {
      const tableName = getTableForDomain(domainKey);
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`Deleted item from ${domainKey}`);
      return { success: true, message: `Deleted item from ${domainKey}` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Deletion failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, [userId, permissions]);

  const getItems = useCallback(async (domain: string, filters?: Record<string, any>): Promise<AtlasControlResult> => {
    if (!userId) {
      return { success: false, message: 'Authentication required' };
    }

    const domainKey = getDomainKeyFromName(domain);
    if (!domainKey) {
      return { success: false, message: `Unknown domain "${domain}"` };
    }

    // Check view permission
    if (!permissions.canViewDomain(domainKey)) {
      return { success: false, message: `Your persona does not have access to view ${domainKey}` };
    }

    try {
      const tableName = getTableForDomain(domainKey);
      // Build base query - use explicit any typing to avoid deep type instantiation
      const baseQuery = supabase.from(tableName).select('*').eq('user_id', userId) as any;
      const { data, error } = await baseQuery.order('created_at', { ascending: false }).limit(100);

      if (error) throw error;

      return { success: true, message: `Retrieved ${data?.length || 0} items from ${domainKey}`, data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Query failed';
      return { success: false, message: msg };
    }
  }, [userId, permissions]);

  // ============= REPORT & QUERY OPERATIONS =============

  const generateReport = useCallback((persona?: string): AtlasControlResult => {
    const targetPersona = persona ? getPersonaFromName(persona) : personaId;
    if (!targetPersona) {
      return { success: false, message: 'No persona specified for report generation' };
    }

    controller.requestReportGeneration(targetPersona);
    toast.info(`Generating ${targetPersona.toUpperCase()} report...`);
    return { success: true, message: `Generating report for ${targetPersona.toUpperCase()} persona` };
  }, [controller, personaId]);

  const runEnterpriseQuery = useCallback((query: string): AtlasControlResult => {
    if (!query.trim()) {
      return { success: false, message: 'Query cannot be empty' };
    }

    controller.setEnterpriseQuery(query);
    controller.setTriggerEnterpriseQuery(true);
    toast.info(`Running enterprise query: ${query}`);
    return { success: true, message: `Running enterprise query: ${query}` };
  }, [controller]);

  const refreshData = useCallback((): AtlasControlResult => {
    controller.requestRefresh();
    toast.info('Refreshing Data Hub...');
    return { success: true, message: 'Data refresh triggered' };
  }, [controller]);

  // ============= ADMIN OPERATIONS =============

  const updateUserPersona = useCallback(async (targetUserId: string, newPersonaId: string): Promise<AtlasControlResult> => {
    if (!isAdmin) {
      return { success: false, message: 'Administrator privileges required to change user personas' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_persona: newPersonaId })
        .eq('user_id', targetUserId);

      if (error) throw error;

      toast.success(`Updated user persona to ${newPersonaId}`);
      return { success: true, message: `Updated user persona to ${newPersonaId}` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update persona';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, [isAdmin]);

  const updatePersonaPermission = useCallback(async (
    targetPersonaId: string,
    domain: string,
    permission: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    value: boolean
  ): Promise<AtlasControlResult> => {
    if (!isAdmin) {
      return { success: false, message: 'Administrator privileges required to modify permissions' };
    }

    const domainKey = getDomainKeyFromName(domain);
    if (!domainKey) {
      return { success: false, message: `Unknown domain "${domain}"` };
    }

    try {
      // Check if permission exists
      const { data: existing } = await supabase
        .from('persona_permissions')
        .select('id')
        .eq('persona_id', targetPersonaId)
        .eq('domain', domainKey)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('persona_permissions')
          .update({ [permission]: value })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('persona_permissions')
          .insert({
            persona_id: targetPersonaId,
            domain: domainKey,
            [permission]: value,
            created_by: userId,
          });

        if (error) throw error;
      }

      toast.success(`Updated ${permission} for ${targetPersonaId} on ${domainKey}`);
      return { success: true, message: `Updated ${permission} for ${targetPersonaId} on ${domainKey}` };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update permission';
      toast.error(msg);
      return { success: false, message: msg };
    }
  }, [isAdmin, userId]);

  // ============= QUICK ACTION HELPERS =============

  const executeQuickAction = useCallback(async (actionId: string): Promise<AtlasControlResult> => {
    // Map action IDs to operations
    const actionHandlers: Record<string, () => AtlasControlResult | Promise<AtlasControlResult>> = {
      // Domain opens
      'email': () => openDomain('communications'),
      'tasks': () => openDomain('tasks'),
      'calendar': () => openDomain('events'),
      'documents': () => openDomain('documents'),
      'financials': () => openDomain('financials'),
      'knowledge': () => openDomain('knowledge'),
      
      // Tab switches
      'insights': () => switchTab('insights'),
      'admin': () => switchTab('admin'),
      'command': () => switchTab('command'),
      
      // Reports
      'report': () => generateReport(),
      'ceo_report': () => generateReport('ceo'),
      'cfo_report': () => generateReport('cfo'),
      
      // Refresh
      'refresh': () => refreshData(),
    };

    const handler = actionHandlers[actionId];
    if (handler) {
      return await handler();
    }

    return { success: false, message: `Unknown action: ${actionId}` };
  }, [openDomain, switchTab, generateReport, refreshData]);

  // Get accessible domains for current persona
  const getAccessibleDomains = useCallback((): string[] => {
    const domains: DomainKey[] = ['communications', 'documents', 'events', 'financials', 'tasks', 'knowledge'];
    return domains.filter(d => permissions.canViewDomain(d));
  }, [permissions]);

  return {
    // Navigation
    switchTab,
    openDomain,
    closeDomain,
    switchPersona,
    
    // Data operations
    createItem,
    updateItem,
    deleteItem,
    getItems,
    
    // Reports & Queries
    generateReport,
    runEnterpriseQuery,
    refreshData,
    
    // Admin operations
    updateUserPersona,
    updatePersonaPermission,
    
    // Quick actions
    executeQuickAction,
    getAccessibleDomains,
    
    // Permission info
    permissions,
    isAdmin,
  };
}
