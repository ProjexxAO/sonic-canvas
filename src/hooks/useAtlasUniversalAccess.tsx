/**
 * Atlas Universal Access Hook
 * Provides unified query capabilities across Personal, Group, and C-Suite hubs
 * with cross-hub access enforcement and semantic search
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCrossHubAccess, HubType } from './useCrossHubAccess';
import { useSubscription } from './useSubscription';
import { toast } from 'sonner';

// Universal search result types
export interface UniversalSearchResult {
  id: string;
  hubType: HubType;
  hubId?: string; // For group items
  itemType: string;
  title: string;
  content?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  relevanceScore?: number;
  source: 'personal' | 'group' | 'csuite';
}

export interface UniversalQueryOptions {
  hubs?: HubType[]; // Which hubs to search (default: all accessible)
  itemTypes?: string[]; // Filter by item types
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  sortBy?: 'relevance' | 'date' | 'title';
}

export interface HubSummary {
  hubType: HubType;
  hubName?: string;
  totalItems: number;
  recentActivity: number;
  topCategories: { name: string; count: number }[];
}

export interface UniversalQueryResult {
  results: UniversalSearchResult[];
  hubSummaries: HubSummary[];
  totalResults: number;
  searchedHubs: HubType[];
  query: string;
}

export function useAtlasUniversalAccess() {
  const { user } = useAuth();
  const { grantedToMe, hasAccessTo } = useCrossHubAccess();
  const { canAccessHub } = useSubscription();
  
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState<UniversalQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine which hubs the user can access
  const getAccessibleHubs = useCallback((): HubType[] => {
    const accessible: HubType[] = [];
    
    // Personal hub is always accessible
    accessible.push('personal');
    
    // Check subscription-based access
    if (canAccessHub('group')) {
      accessible.push('group');
    }
    if (canAccessHub('csuite')) {
      accessible.push('csuite');
    }
    
    // Check cross-hub grants
    grantedToMe.forEach(grant => {
      if (grant.isActive && !accessible.includes(grant.sourceHubType)) {
        accessible.push(grant.sourceHubType);
      }
    });
    
    return accessible;
  }, [canAccessHub, grantedToMe]);

  // Universal semantic search across all accessible hubs
  const universalSearch = useCallback(async (
    query: string,
    options: UniversalQueryOptions = {}
  ): Promise<UniversalQueryResult | null> => {
    if (!user?.id) {
      setError('Authentication required');
      return null;
    }

    if (!query.trim()) {
      setError('Search query cannot be empty');
      return null;
    }

    setIsSearching(true);
    setError(null);

    try {
      const accessibleHubs = getAccessibleHubs();
      const hubsToSearch = options.hubs?.filter(h => accessibleHubs.includes(h)) || accessibleHubs;
      
      const allResults: UniversalSearchResult[] = [];
      const hubSummaries: HubSummary[] = [];
      const limit = options.limit || 50;

      // Search Personal Hub
      if (hubsToSearch.includes('personal')) {
        const personalResults = await searchPersonalHub(query, options, limit);
        allResults.push(...personalResults.results);
        hubSummaries.push(personalResults.summary);
      }

      // Search Group Hub (if accessible)
      if (hubsToSearch.includes('group')) {
        const groupResults = await searchGroupHub(query, options, limit);
        allResults.push(...groupResults.results);
        hubSummaries.push(...groupResults.summaries);
      }

      // Search C-Suite Hub (if accessible)
      if (hubsToSearch.includes('csuite')) {
        const csuiteResults = await searchCSuiteHub(query, options, limit);
        allResults.push(...csuiteResults.results);
        hubSummaries.push(csuiteResults.summary);
      }

      // Sort results
      const sortedResults = sortResults(allResults, options.sortBy || 'relevance');

      const result: UniversalQueryResult = {
        results: sortedResults.slice(0, limit),
        hubSummaries,
        totalResults: allResults.length,
        searchedHubs: hubsToSearch,
        query,
      };

      setLastQuery(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Universal search failed';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, [user?.id, getAccessibleHubs]);

  // Search Personal Hub
  async function searchPersonalHub(
    query: string,
    options: UniversalQueryOptions,
    limit: number
  ): Promise<{ results: UniversalSearchResult[]; summary: HubSummary }> {
    const queryLower = query.toLowerCase();
    
    // Search personal_items
    let itemsQuery = supabase
      .from('personal_items')
      .select('*')
      .eq('user_id', user!.id)
      .neq('status', 'deleted')
      .or(`title.ilike.%${queryLower}%,content.ilike.%${queryLower}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options.itemTypes?.length) {
      itemsQuery = itemsQuery.in('item_type', options.itemTypes);
    }
    if (options.dateFrom) {
      itemsQuery = itemsQuery.gte('created_at', options.dateFrom.toISOString());
    }
    if (options.dateTo) {
      itemsQuery = itemsQuery.lte('created_at', options.dateTo.toISOString());
    }

    const { data: items, error } = await itemsQuery;
    if (error) throw error;

    // Also search goals and habits
    const { data: goals } = await supabase
      .from('personal_goals')
      .select('*')
      .eq('user_id', user!.id)
      .or(`title.ilike.%${queryLower}%,description.ilike.%${queryLower}%`)
      .limit(10);

    const { data: habits } = await supabase
      .from('personal_habits')
      .select('*')
      .eq('user_id', user!.id)
      .ilike('name', `%${queryLower}%`)
      .limit(10);

    // Transform to universal format
    const results: UniversalSearchResult[] = [
      ...(items || []).map((item: any) => ({
        id: item.id,
        hubType: 'personal' as HubType,
        itemType: item.item_type,
        title: item.title,
        content: item.content,
        metadata: item.metadata,
        createdAt: item.created_at,
        relevanceScore: calculateRelevance(query, item.title, item.content),
        source: 'personal' as const,
      })),
      ...(goals || []).map((goal: any) => ({
        id: goal.id,
        hubType: 'personal' as HubType,
        itemType: 'goal',
        title: goal.title,
        content: goal.description,
        metadata: { category: goal.category, status: goal.status },
        createdAt: goal.created_at,
        relevanceScore: calculateRelevance(query, goal.title, goal.description),
        source: 'personal' as const,
      })),
      ...(habits || []).map((habit: any) => ({
        id: habit.id,
        hubType: 'personal' as HubType,
        itemType: 'habit',
        title: habit.name,
        content: habit.description,
        metadata: { frequency: habit.frequency, streak: habit.current_streak },
        createdAt: habit.created_at,
        relevanceScore: calculateRelevance(query, habit.name, habit.description),
        source: 'personal' as const,
      })),
    ];

    // Build summary
    const typeCounts: Record<string, number> = {};
    results.forEach(r => {
      typeCounts[r.itemType] = (typeCounts[r.itemType] || 0) + 1;
    });

    const summary: HubSummary = {
      hubType: 'personal',
      hubName: 'Personal Hub',
      totalItems: results.length,
      recentActivity: results.filter(r => {
        const created = new Date(r.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }).length,
      topCategories: Object.entries(typeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };

    return { results, summary };
  }

  // Search Group Hub
  async function searchGroupHub(
    query: string,
    options: UniversalQueryOptions,
    limit: number
  ): Promise<{ results: UniversalSearchResult[]; summaries: HubSummary[] }> {
    const queryLower = query.toLowerCase();
    
    // Get groups user is member of
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, role, group_hubs!inner(id, name)')
      .eq('user_id', user!.id);

    if (!memberships?.length) {
      return { results: [], summaries: [] };
    }

    const groupIds = memberships.map((m: any) => m.group_id);
    const groupMap = new Map(memberships.map((m: any) => [m.group_id, m.group_hubs?.name || 'Unknown Group']));

    // Search group_items
    let itemsQuery = supabase
      .from('group_items')
      .select('*')
      .in('group_id', groupIds)
      .or(`title.ilike.%${queryLower}%,content.ilike.%${queryLower}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options.itemTypes?.length) {
      itemsQuery = itemsQuery.in('item_type', options.itemTypes);
    }

    const { data: items, error } = await itemsQuery;
    if (error) throw error;

    // Transform to universal format
    const results: UniversalSearchResult[] = (items || []).map((item: any) => ({
      id: item.id,
      hubType: 'group' as HubType,
      hubId: item.group_id,
      itemType: item.item_type,
      title: item.title,
      content: item.content,
      metadata: { 
        ...item.metadata, 
        groupName: groupMap.get(item.group_id),
        status: item.status,
        priority: item.priority,
      },
      createdAt: item.created_at,
      relevanceScore: calculateRelevance(query, item.title, item.content),
      source: 'group' as const,
    }));

    // Build summaries per group
    const groupCounts: Record<string, { items: number; recent: number; types: Record<string, number> }> = {};
    results.forEach(r => {
      const gid = r.hubId!;
      if (!groupCounts[gid]) {
        groupCounts[gid] = { items: 0, recent: 0, types: {} };
      }
      groupCounts[gid].items++;
      groupCounts[gid].types[r.itemType] = (groupCounts[gid].types[r.itemType] || 0) + 1;
      
      const created = new Date(r.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (created > weekAgo) {
        groupCounts[gid].recent++;
      }
    });

    const summaries: HubSummary[] = Object.entries(groupCounts).map(([gid, data]) => ({
      hubType: 'group' as HubType,
      hubName: groupMap.get(gid) || 'Unknown Group',
      totalItems: data.items,
      recentActivity: data.recent,
      topCategories: Object.entries(data.types)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    }));

    return { results, summaries };
  }

  // Search C-Suite Hub
  async function searchCSuiteHub(
    query: string,
    options: UniversalQueryOptions,
    limit: number
  ): Promise<{ results: UniversalSearchResult[]; summary: HubSummary }> {
    const queryLower = query.toLowerCase();
    const allResults: UniversalSearchResult[] = [];
    
    // Check cross-hub access permissions for domains
    const accessGrant = grantedToMe.find(g => g.sourceHubType === 'csuite' && g.isActive);
    const allowedDomains = accessGrant?.allowedDomains || null;

    // Domain tables to search
    const domains = [
      { table: 'csuite_tasks', type: 'task' },
      { table: 'csuite_events', type: 'event' },
      { table: 'csuite_documents', type: 'document' },
      { table: 'csuite_communications', type: 'communication' },
      { table: 'csuite_financials', type: 'financial' },
      { table: 'csuite_knowledge', type: 'knowledge' },
    ];

    for (const domain of domains) {
      // Check if domain is allowed
      if (allowedDomains && !allowedDomains.includes(domain.type)) {
        continue;
      }

      try {
        const { data, error } = await supabase
          .from(domain.table as any)
          .select('*')
          .eq('user_id', user!.id)
          .or(`title.ilike.%${queryLower}%,content.ilike.%${queryLower}%`)
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / domains.length));

        if (error) continue;

        const domainResults: UniversalSearchResult[] = (data || []).map((item: any) => ({
          id: item.id,
          hubType: 'csuite' as HubType,
          itemType: domain.type,
          title: item.title,
          content: item.content || item.description,
          metadata: item.metadata,
          createdAt: item.created_at,
          relevanceScore: calculateRelevance(query, item.title, item.content || item.description),
          source: 'csuite' as const,
        }));

        allResults.push(...domainResults);
      } catch (e) {
        console.error(`Error searching ${domain.table}:`, e);
      }
    }

    // Build summary
    const typeCounts: Record<string, number> = {};
    allResults.forEach(r => {
      typeCounts[r.itemType] = (typeCounts[r.itemType] || 0) + 1;
    });

    const summary: HubSummary = {
      hubType: 'csuite',
      hubName: 'C-Suite Data Hub',
      totalItems: allResults.length,
      recentActivity: allResults.filter(r => {
        const created = new Date(r.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created > weekAgo;
      }).length,
      topCategories: Object.entries(typeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };

    return { results: allResults, summary };
  }

  // Calculate relevance score for sorting
  function calculateRelevance(query: string, title: string, content?: string | null): number {
    const queryLower = query.toLowerCase();
    const titleLower = (title || '').toLowerCase();
    const contentLower = (content || '').toLowerCase();
    
    let score = 0;
    
    // Exact title match
    if (titleLower === queryLower) score += 100;
    // Title starts with query
    else if (titleLower.startsWith(queryLower)) score += 80;
    // Title contains query
    else if (titleLower.includes(queryLower)) score += 60;
    
    // Content contains query
    if (contentLower.includes(queryLower)) {
      const occurrences = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
      score += Math.min(occurrences * 5, 30);
    }
    
    // Word matching
    const queryWords = queryLower.split(/\s+/);
    queryWords.forEach(word => {
      if (word.length > 2) {
        if (titleLower.includes(word)) score += 10;
        if (contentLower.includes(word)) score += 5;
      }
    });
    
    return score;
  }

  // Sort results by different criteria
  function sortResults(
    results: UniversalSearchResult[],
    sortBy: 'relevance' | 'date' | 'title'
  ): UniversalSearchResult[] {
    switch (sortBy) {
      case 'relevance':
        return [...results].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      case 'date':
        return [...results].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'title':
        return [...results].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return results;
    }
  }

  // Get aggregated insights across all hubs
  const getUniversalInsights = useCallback(async (): Promise<{
    totalItems: Record<HubType, number>;
    recentActivity: Record<HubType, number>;
    upcomingDeadlines: UniversalSearchResult[];
    topTags: { tag: string; count: number }[];
  } | null> => {
    if (!user?.id) return null;

    try {
      const accessibleHubs = getAccessibleHubs();
      const totalItems: Record<HubType, number> = { personal: 0, group: 0, csuite: 0 };
      const recentActivity: Record<HubType, number> = { personal: 0, group: 0, csuite: 0 };
      const upcomingDeadlines: UniversalSearchResult[] = [];
      const tagCounts: Record<string, number> = {};

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Personal Hub stats
      if (accessibleHubs.includes('personal')) {
        const { count: personalCount } = await supabase
          .from('personal_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('status', 'deleted');
        totalItems.personal = personalCount || 0;

        const { count: recentPersonal } = await supabase
          .from('personal_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('updated_at', weekAgo.toISOString());
        recentActivity.personal = recentPersonal || 0;

        // Upcoming deadlines
        const { data: personalDeadlines } = await supabase
          .from('personal_items')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'completed')
          .not('due_date', 'is', null)
          .gte('due_date', new Date().toISOString())
          .lte('due_date', nextWeek.toISOString())
          .order('due_date', { ascending: true })
          .limit(10);

        (personalDeadlines || []).forEach((item: any) => {
          upcomingDeadlines.push({
            id: item.id,
            hubType: 'personal',
            itemType: item.item_type,
            title: item.title,
            content: item.content,
            metadata: { dueDate: item.due_date, priority: item.priority },
            createdAt: item.created_at,
            source: 'personal',
          });
          (item.tags || []).forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
      }

      // Group Hub stats
      if (accessibleHubs.includes('group')) {
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (memberships?.length) {
          const groupIds = memberships.map((m: any) => m.group_id);
          
          const { count: groupCount } = await supabase
            .from('group_items')
            .select('*', { count: 'exact', head: true })
            .in('group_id', groupIds);
          totalItems.group = groupCount || 0;

          const { count: recentGroup } = await supabase
            .from('group_items')
            .select('*', { count: 'exact', head: true })
            .in('group_id', groupIds)
            .gte('updated_at', weekAgo.toISOString());
          recentActivity.group = recentGroup || 0;
        }
      }

      // C-Suite Hub stats
      if (accessibleHubs.includes('csuite')) {
        let csuiteTotal = 0;
        let csuiteRecent = 0;

        const tables = ['csuite_tasks', 'csuite_events', 'csuite_documents', 'csuite_communications'];
        for (const table of tables) {
          const { count: tableCount } = await supabase
            .from(table as any)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          csuiteTotal += tableCount || 0;

          const { count: tableRecent } = await supabase
            .from(table as any)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('updated_at', weekAgo.toISOString());
          csuiteRecent += tableRecent || 0;
        }

        totalItems.csuite = csuiteTotal;
        recentActivity.csuite = csuiteRecent;
      }

      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return { totalItems, recentActivity, upcomingDeadlines, topTags };
    } catch (err) {
      console.error('Error getting universal insights:', err);
      return null;
    }
  }, [user?.id, getAccessibleHubs]);

  // AI-powered universal query using edge function
  const aiUniversalQuery = useCallback(async (
    naturalLanguageQuery: string
  ): Promise<{ answer: string; sources: UniversalSearchResult[] } | null> => {
    if (!user?.id) return null;

    setIsSearching(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke('atlas-universal-query', {
        body: {
          userId: user.id,
          query: naturalLanguageQuery,
          accessibleHubs: getAccessibleHubs(),
        },
      });

      if (response.error) throw response.error;

      return {
        answer: response.data?.answer || 'No answer available',
        sources: response.data?.sources || [],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI query failed';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsSearching(false);
    }
  }, [user?.id, getAccessibleHubs]);

  return {
    // Search
    universalSearch,
    aiUniversalQuery,
    getUniversalInsights,
    
    // State
    isSearching,
    lastQuery,
    error,
    
    // Access info
    getAccessibleHubs,
    accessibleHubs: getAccessibleHubs(),
  };
}
