// Hub Connections - Manages connections to Personal, Group, and C-Suite hubs
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataHubController } from '@/hooks/useDataHubController';
import { useAtlasLifeManager } from '@/hooks/useAtlasLifeManager';
import { useFinancialIntelligence } from '@/hooks/useFinancialIntelligence';
import { useAtlasUniversalAccess } from '@/hooks/useAtlasUniversalAccess';

export type HubType = 'personal' | 'group' | 'csuite' | 'all';

export interface UniversalHubAccess {
  personal: {
    connected: boolean;
    itemCount: number;
    recentActivity: number;
    features: string[];
  };
  group: {
    connected: boolean;
    groupCount: number;
    memberAccess: number;
    features: string[];
  };
  csuite: {
    connected: boolean;
    domainAccess: string[];
    personaActive: string;
    features: string[];
  };
}

export function useHubConnections(userId: string | undefined) {
  const dataHubController = useDataHubController();
  const lifeManager = useAtlasLifeManager();
  const financialIntelligence = useFinancialIntelligence();
  const universalAccess = useAtlasUniversalAccess();

  const [hubAccess, setHubAccess] = useState<UniversalHubAccess>({
    personal: { connected: false, itemCount: 0, recentActivity: 0, features: [] },
    group: { connected: false, groupCount: 0, memberAccess: 0, features: [] },
    csuite: { connected: false, domainAccess: [], personaActive: '', features: [] },
  });

  const initializeHubConnections = useCallback(async () => {
    if (!userId) return;

    try {
      const [personalRes, groupRes, csuiteRes] = await Promise.all([
        supabase.from('personal_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('group_members').select('group_id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('csuite_tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      setHubAccess({
        personal: {
          connected: true,
          itemCount: personalRes.count || 0,
          recentActivity: Date.now(),
          features: ['tasks', 'goals', 'habits', 'calendar', 'finances', 'wellness', 'life_balance'],
        },
        group: {
          connected: true,
          groupCount: groupRes.data?.length || 0,
          memberAccess: groupRes.data?.length || 0,
          features: ['shared_tasks', 'team_calendar', 'collaboration', 'file_sharing'],
        },
        csuite: {
          connected: true,
          domainAccess: ['communications', 'documents', 'events', 'financials', 'tasks', 'knowledge'],
          personaActive: dataHubController.targetPersona || 'ceo',
          features: ['enterprise_query', 'reports', 'insights', 'agent_allocation'],
        },
      });
    } catch (error) {
      console.error('Error initializing hub connections:', error);
    }
  }, [userId, dataHubController.targetPersona]);

  const executeUniversalAction = useCallback(async (
    hub: HubType,
    action: string,
    params: Record<string, any>
  ): Promise<{ success: boolean; result?: any; error?: string }> => {
    if (!userId) return { success: false, error: 'Authentication required' };

    try {
      switch (hub) {
        case 'personal':
          switch (action) {
            case 'create_task':
              const { data: taskData } = await supabase.from('personal_items').insert({
                user_id: userId,
                item_type: 'task',
                title: params.title,
                content: params.description,
                metadata: { priority: params.priority, due_date: params.dueDate },
              }).select().single();
              return { success: true, result: taskData };

            case 'create_goal':
              const { data: goalData } = await supabase.from('personal_goals').insert({
                user_id: userId,
                title: params.title,
                description: params.description,
                target_date: params.targetDate,
                category: params.category || 'personal',
              }).select().single();
              return { success: true, result: goalData };

            case 'schedule_event':
              const { data: eventData } = await supabase.from('csuite_events').insert({
                user_id: userId,
                title: params.title,
                description: params.description,
                start_at: params.startTime,
                end_at: params.endTime,
                type: params.eventType || 'personal',
                source: 'atlas_orchestration',
              }).select().single();
              return { success: true, result: eventData };

            case 'manage_finances':
              return { success: true, result: financialIntelligence.financialHealth };

            case 'life_balance':
              return { success: true, result: lifeManager.workLifeBalance };

            default:
              return { success: false, error: `Unknown personal action: ${action}` };
          }

        case 'group':
          switch (action) {
            case 'create_shared_task':
              const { data: sharedTask } = await supabase.from('group_items').insert({
                group_id: params.groupId,
                created_by: userId,
                item_type: 'task',
                title: params.title,
                content: params.description,
              }).select().single();
              return { success: true, result: sharedTask };

            case 'invite_member':
              const { data: invite } = await supabase.from('group_invitations').insert({
                group_id: params.groupId,
                invited_by: userId,
                email: params.email,
                role: params.role || 'member',
              }).select().single();
              return { success: true, result: invite };

            default:
              return { success: false, error: `Unknown group action: ${action}` };
          }

        case 'csuite':
          switch (action) {
            case 'generate_report':
              dataHubController.requestReportGeneration(params.persona || 'ceo');
              return { success: true, result: { generating: true, persona: params.persona } };

            case 'enterprise_query':
              dataHubController.setEnterpriseQuery(params.query);
              dataHubController.setTriggerEnterpriseQuery(true);
              return { success: true, result: { querying: true, query: params.query } };

            case 'switch_persona':
              dataHubController.setTargetPersona(params.persona);
              return { success: true, result: { switched: true, persona: params.persona } };

            case 'expand_domain':
              dataHubController.setExpandedDomain(params.domain);
              return { success: true, result: { expanded: true, domain: params.domain } };

            default:
              return { success: false, error: `Unknown csuite action: ${action}` };
          }

        case 'all':
          if (action === 'universal_search') {
            const results = await universalAccess.universalSearch(params.query, params.options);
            return { success: true, result: results };
          }
          if (action === 'get_insights') {
            const insights = await universalAccess.getUniversalInsights();
            return { success: true, result: insights };
          }
          return { success: false, error: `Unknown universal action: ${action}` };

        default:
          return { success: false, error: `Unknown hub: ${hub}` };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Action failed';
      return { success: false, error: message };
    }
  }, [userId, dataHubController, universalAccess, financialIntelligence, lifeManager]);

  return {
    hubAccess,
    initializeHubConnections,
    executeUniversalAction,
    universalAccess,
    lifeManager,
    financialIntelligence,
  };
}
