import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface KnowledgeDiscovery {
  id: string;
  domain: string;
  title: string;
  summary: string;
  detailed_content: string;
  source_query: string;
  confidence_score: number;
  application_areas: string[];
  is_applied: boolean;
  applied_to: string[];
  applied_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeDiscovery() {
  const [discoveries, setDiscoveries] = useState<KnowledgeDiscovery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [lastDiscoveryAt, setLastDiscoveryAt] = useState<Date | null>(null);

  // Fetch recent discoveries
  const fetchDiscoveries = useCallback(async (limit = 10) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-discovery-engine', {
        body: { action: 'get_recent', limit }
      });

      if (error) throw error;
      setDiscoveries(data.discoveries || []);
    } catch (error) {
      console.error('Error fetching discoveries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger new discovery
  const triggerDiscovery = useCallback(async (domain?: string) => {
    setIsDiscovering(true);
    try {
      toast.info('Starting knowledge discovery...', { duration: 3000 });
      
      const { data, error } = await supabase.functions.invoke('knowledge-discovery-engine', {
        body: { action: 'discover', domain }
      });

      if (error) throw error;

      if (data.discoveries_count > 0) {
        toast.success(`Discovered ${data.discoveries_count} new insights!`);
        setLastDiscoveryAt(new Date());
        await fetchDiscoveries();
      } else {
        toast.info('No new discoveries at this time');
      }

      return data;
    } catch (error) {
      console.error('Error triggering discovery:', error);
      toast.error('Discovery failed');
      return null;
    } finally {
      setIsDiscovering(false);
    }
  }, [fetchDiscoveries]);

  // Get applicable discoveries for enhancement
  const getApplicableDiscoveries = useCallback(async (limit = 5) => {
    try {
      const { data, error } = await supabase.functions.invoke('knowledge-discovery-engine', {
        body: { action: 'get_applicable', limit }
      });

      if (error) throw error;
      return data.discoveries || [];
    } catch (error) {
      console.error('Error fetching applicable discoveries:', error);
      return [];
    }
  }, []);

  // Subscribe to real-time discoveries
  useEffect(() => {
    const channel = supabase
      .channel('knowledge-discoveries')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'knowledge_discoveries' },
        (payload) => {
          const newDiscovery = payload.new as KnowledgeDiscovery;
          setDiscoveries(prev => [newDiscovery, ...prev].slice(0, 20));
          toast.success(`New discovery: ${newDiscovery.title}`, { duration: 5000 });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDiscoveries();
  }, [fetchDiscoveries]);

  return {
    discoveries,
    isLoading,
    isDiscovering,
    lastDiscoveryAt,
    fetchDiscoveries,
    triggerDiscovery,
    getApplicableDiscoveries
  };
}
