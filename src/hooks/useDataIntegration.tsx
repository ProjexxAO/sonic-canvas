import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface IntegratedDataSummary {
  totalItems: number;
  byDomain: {
    tasks: { total: number; pending: number; completed: number; overdue: number };
    communications: { total: number; unread: number; important: number };
    financials: { total: number; revenue: number; expenses: number; pending: number };
    events: { total: number; upcoming: number; past: number };
    documents: { total: number; enhanced: number; summaries: number };
    knowledge: { total: number; categories: string[]; recent: number };
  };
  recentActivity: ActivityItem[];
  healthScore: number;
  lastUpdated: Date;
}

export interface ActivityItem {
  id: string;
  domain: string;
  action: string;
  title: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CrossDomainInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'action_required';
  title: string;
  description: string;
  relatedDomains: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  suggestedAction?: string;
}

export function useDataIntegration() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<IntegratedDataSummary | null>(null);
  const [insights, setInsights] = useState<CrossDomainInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchIntegratedSummary = useCallback(async () => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const client = supabase as any;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all domain data in parallel
      const [
        tasksData,
        commsData,
        financialsData,
        eventsData,
        documentsData,
        knowledgeData
      ] = await Promise.all([
        client.from('csuite_tasks').select('*').eq('user_id', user.id),
        client.from('csuite_communications').select('*').eq('user_id', user.id).gte('created_at', thirtyDaysAgo.toISOString()),
        client.from('csuite_financials').select('*').eq('user_id', user.id),
        client.from('csuite_events').select('*').eq('user_id', user.id),
        client.from('csuite_documents').select('*').eq('user_id', user.id),
        client.from('csuite_knowledge').select('*').eq('user_id', user.id)
      ]);

      const tasks = tasksData.data || [];
      const comms = commsData.data || [];
      const financials = financialsData.data || [];
      const events = eventsData.data || [];
      const documents = documentsData.data || [];
      const knowledge = knowledgeData.data || [];

      // Calculate task metrics
      const pendingTasks = tasks.filter((t: any) => t.status === 'pending' || t.status === 'todo').length;
      const completedTasks = tasks.filter((t: any) => t.status === 'completed' || t.status === 'done').length;
      const overdueTasks = tasks.filter((t: any) => 
        t.due_date && new Date(t.due_date) < now && t.status !== 'completed' && t.status !== 'done'
      ).length;

      // Calculate financial metrics
      const revenue = financials
        .filter((f: any) => f.type === 'income' || f.type === 'revenue')
        .reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
      const expenses = financials
        .filter((f: any) => f.type === 'expense')
        .reduce((sum: number, f: any) => sum + Math.abs(f.amount || 0), 0);
      const pendingFinancials = financials.filter((f: any) => f.status === 'pending').length;

      // Calculate event metrics
      const upcomingEvents = events.filter((e: any) => 
        e.start_at && new Date(e.start_at) > now
      ).length;
      const pastEvents = events.filter((e: any) => 
        e.start_at && new Date(e.start_at) <= now
      ).length;

      // Calculate document metrics
      const enhancedDocs = documents.filter((d: any) => 
        d.metadata?.is_enhanced || d.version?.includes('enhanced')
      ).length;
      const summaryDocs = documents.filter((d: any) => 
        d.metadata?.is_summary || d.type === 'summary'
      ).length;

      // Calculate knowledge metrics
      const categories = [...new Set(knowledge.map((k: any) => k.category).filter(Boolean))] as string[];
      const recentKnowledge = knowledge.filter((k: any) => 
        new Date(k.created_at) > thirtyDaysAgo
      ).length;

      // Build recent activity
      const allItems = [
        ...tasks.map((t: any) => ({ ...t, domain: 'task', action: 'task_updated' })),
        ...comms.slice(0, 10).map((c: any) => ({ ...c, domain: 'communication', action: 'message_received' })),
        ...events.slice(0, 5).map((e: any) => ({ ...e, domain: 'event', action: 'event_scheduled' })),
        ...financials.slice(0, 5).map((f: any) => ({ ...f, domain: 'financial', action: 'transaction_logged' })),
        ...documents.slice(0, 5).map((d: any) => ({ ...d, domain: 'document', action: 'document_added' }))
      ];

      const recentActivity: ActivityItem[] = allItems
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20)
        .map(item => ({
          id: item.id,
          domain: item.domain,
          action: item.action,
          title: item.title || item.subject || 'Untitled',
          timestamp: new Date(item.created_at),
          metadata: item.metadata
        }));

      // Calculate health score (0-100)
      let healthScore = 100;
      if (overdueTasks > 0) healthScore -= Math.min(overdueTasks * 5, 25);
      if (pendingFinancials > 5) healthScore -= Math.min((pendingFinancials - 5) * 2, 15);
      if (tasks.length === 0 && documents.length === 0) healthScore -= 20;
      healthScore = Math.max(0, healthScore);

      const totalItems = tasks.length + comms.length + financials.length + events.length + documents.length + knowledge.length;

      const integratedSummary: IntegratedDataSummary = {
        totalItems,
        byDomain: {
          tasks: { total: tasks.length, pending: pendingTasks, completed: completedTasks, overdue: overdueTasks },
          communications: { total: comms.length, unread: 0, important: 0 },
          financials: { total: financials.length, revenue, expenses, pending: pendingFinancials },
          events: { total: events.length, upcoming: upcomingEvents, past: pastEvents },
          documents: { total: documents.length, enhanced: enhancedDocs, summaries: summaryDocs },
          knowledge: { total: knowledge.length, categories, recent: recentKnowledge }
        },
        recentActivity,
        healthScore,
        lastUpdated: new Date()
      };

      setSummary(integratedSummary);
      return integratedSummary;
    } catch (error) {
      console.error('Error fetching integrated summary:', error);
      toast.error('Failed to load integrated data summary');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const generateCrossDomainInsights = useCallback(async () => {
    if (!user || !summary) return [];

    const generatedInsights: CrossDomainInsight[] = [];
    const { byDomain } = summary;

    // Check for overdue tasks
    if (byDomain.tasks.overdue > 0) {
      generatedInsights.push({
        id: 'overdue-tasks',
        type: 'action_required',
        title: `${byDomain.tasks.overdue} Overdue Task${byDomain.tasks.overdue > 1 ? 's' : ''}`,
        description: 'Tasks past their due date require immediate attention to maintain project timelines.',
        relatedDomains: ['tasks'],
        priority: byDomain.tasks.overdue > 3 ? 'critical' : 'high',
        actionable: true,
        suggestedAction: 'Review and prioritize overdue tasks'
      });
    }

    // Financial health insight
    const netCashflow = byDomain.financials.revenue - byDomain.financials.expenses;
    if (netCashflow < 0) {
      generatedInsights.push({
        id: 'negative-cashflow',
        type: 'risk',
        title: 'Negative Cash Flow Detected',
        description: `Expenses exceed revenue by ${Math.abs(netCashflow).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        relatedDomains: ['financials'],
        priority: 'high',
        actionable: true,
        suggestedAction: 'Review expense categories and identify cost-cutting opportunities'
      });
    } else if (byDomain.financials.revenue > 0) {
      generatedInsights.push({
        id: 'positive-cashflow',
        type: 'opportunity',
        title: 'Positive Cash Flow',
        description: `Net positive flow of ${netCashflow.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        relatedDomains: ['financials'],
        priority: 'low',
        actionable: false
      });
    }

    // Upcoming events with tasks correlation
    if (byDomain.events.upcoming > 0 && byDomain.tasks.pending > 0) {
      generatedInsights.push({
        id: 'event-task-alignment',
        type: 'trend',
        title: 'Event-Task Alignment Check',
        description: `${byDomain.events.upcoming} upcoming events with ${byDomain.tasks.pending} pending tasks. Ensure alignment.`,
        relatedDomains: ['events', 'tasks'],
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Cross-reference event preparation with task list'
      });
    }

    // Knowledge base health
    if (byDomain.knowledge.total > 0 && byDomain.knowledge.recent === 0) {
      generatedInsights.push({
        id: 'stale-knowledge',
        type: 'risk',
        title: 'Knowledge Base Needs Update',
        description: 'No new knowledge items added in the last 30 days. Consider updating documentation.',
        relatedDomains: ['knowledge', 'documents'],
        priority: 'medium',
        actionable: true,
        suggestedAction: 'Review and update key knowledge articles'
      });
    }

    // Document enhancement opportunity
    const unenhancedDocs = byDomain.documents.total - byDomain.documents.enhanced;
    if (unenhancedDocs > 5) {
      generatedInsights.push({
        id: 'unenhanced-docs',
        type: 'opportunity',
        title: 'Document Enhancement Opportunity',
        description: `${unenhancedDocs} documents could benefit from AI enhancement for better insights.`,
        relatedDomains: ['documents'],
        priority: 'low',
        actionable: true,
        suggestedAction: 'Run document enhancement on unprocessed files'
      });
    }

    setInsights(generatedInsights);
    return generatedInsights;
  }, [user, summary]);

  const syncAllDataSources = useCallback(async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      // Refresh summary and generate new insights
      await fetchIntegratedSummary();
      await generateCrossDomainInsights();
      toast.success('All data sources synchronized');
    } catch (error) {
      console.error('Error syncing data sources:', error);
      toast.error('Failed to sync data sources');
    } finally {
      setIsSyncing(false);
    }
  }, [user, fetchIntegratedSummary, generateCrossDomainInsights]);

  return {
    summary,
    insights,
    isLoading,
    isSyncing,
    fetchIntegratedSummary,
    generateCrossDomainInsights,
    syncAllDataSources
  };
}
