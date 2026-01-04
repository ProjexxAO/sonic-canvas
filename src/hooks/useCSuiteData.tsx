import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DataDomainStats {
  communications: number;
  documents: number;
  events: number;
  financials: number;
  tasks: number;
  knowledge: number;
}

export interface ConnectorStatus {
  provider: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: Date | null;
}

export interface CSuiteReport {
  id: string;
  persona: string;
  type: string;
  title: string;
  content: string;
  generatedAt: Date;
}

// Domain item types
export interface DomainItem {
  id: string;
  title: string;
  preview: string;
  date: Date;
  type: string;
  metadata?: Record<string, any>;
}

export interface CommunicationItem extends DomainItem {
  from_address?: string;
  to_addresses?: string[];
  subject?: string;
}

export interface DocumentItem extends DomainItem {
  file_path?: string;
  file_size?: number;
  mime_type?: string;
}

export interface EventItem extends DomainItem {
  start_at?: Date;
  end_at?: Date;
  location?: string;
  attendees?: string[];
}

export interface FinancialItem extends DomainItem {
  amount?: number;
  currency?: string;
  category?: string;
  status?: string;
}

export interface TaskItem extends DomainItem {
  status?: string;
  priority?: string;
  due_date?: Date;
  assigned_to?: string;
}

export interface KnowledgeItem extends DomainItem {
  category?: string;
  tags?: string[];
  content?: string;
}

export type DomainKey = 'communications' | 'documents' | 'events' | 'financials' | 'tasks' | 'knowledge';

const DOMAIN_TABLE_MAP: Record<DomainKey, string> = {
  communications: 'csuite_communications',
  documents: 'csuite_documents',
  events: 'csuite_events',
  financials: 'csuite_financials',
  tasks: 'csuite_tasks',
  knowledge: 'csuite_knowledge',
};

export function useCSuiteData(userId: string | undefined) {
  const [stats, setStats] = useState<DataDomainStats>({
    communications: 0,
    documents: 0,
    events: 0,
    financials: 0,
    tasks: 0,
    knowledge: 0,
  });
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [reports, setReports] = useState<CSuiteReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [domainItems, setDomainItems] = useState<Record<DomainKey, DomainItem[]>>({
    communications: [],
    documents: [],
    events: [],
    financials: [],
    tasks: [],
    knowledge: [],
  });
  const [loadingDomains, setLoadingDomains] = useState<Record<DomainKey, boolean>>({
    communications: false,
    documents: false,
    events: false,
    financials: false,
    tasks: false,
    knowledge: false,
  });

  // Fetch data stats
  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      // Use any to bypass type checking for tables not yet in generated types
      const client = supabase as any;
      const [comms, docs, events, financials, tasks, knowledge] = await Promise.all([
        client.from('csuite_communications').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('csuite_documents').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('csuite_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('csuite_financials').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('csuite_tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        client.from('csuite_knowledge').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      setStats({
        communications: comms.count || 0,
        documents: docs.count || 0,
        events: events.count || 0,
        financials: financials.count || 0,
        tasks: tasks.count || 0,
        knowledge: knowledge.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [userId]);

  // Fetch items for a specific domain
  const fetchDomainItems = useCallback(async (domain: DomainKey): Promise<DomainItem[]> => {
    if (!userId) return [];

    setLoadingDomains(prev => ({ ...prev, [domain]: true }));

    try {
      const client = supabase as any;
      const tableName = DOMAIN_TABLE_MAP[domain];
      
      const { data, error } = await client
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const items: DomainItem[] = (data || []).map((item: any) => {
        const baseItem: DomainItem = {
          id: item.id,
          title: item.title || item.subject || 'Untitled',
          preview: item.content?.slice(0, 100) || item.description?.slice(0, 100) || '',
          date: new Date(item.created_at),
          type: item.type || domain,
          metadata: item.metadata,
        };

        // Add domain-specific fields
        switch (domain) {
          case 'communications':
            return {
              ...baseItem,
              from_address: item.from_address,
              to_addresses: item.to_addresses,
              subject: item.subject,
              title: item.subject || 'No Subject',
            } as CommunicationItem;
          case 'documents':
            return {
              ...baseItem,
              file_path: item.file_path,
              file_size: item.file_size,
              mime_type: item.mime_type,
            } as DocumentItem;
          case 'events':
            return {
              ...baseItem,
              start_at: item.start_at ? new Date(item.start_at) : undefined,
              end_at: item.end_at ? new Date(item.end_at) : undefined,
              location: item.location,
              attendees: item.attendees,
              preview: item.description?.slice(0, 100) || '',
            } as EventItem;
          case 'financials':
            return {
              ...baseItem,
              amount: item.amount,
              currency: item.currency,
              category: item.category,
              status: item.status,
            } as FinancialItem;
          case 'tasks':
            return {
              ...baseItem,
              status: item.status,
              priority: item.priority,
              due_date: item.due_date ? new Date(item.due_date) : undefined,
              assigned_to: item.assigned_to,
              preview: item.description?.slice(0, 100) || '',
            } as TaskItem;
          case 'knowledge':
            return {
              ...baseItem,
              category: item.category,
              tags: item.tags,
              content: item.content,
            } as KnowledgeItem;
          default:
            return baseItem;
        }
      });

      setDomainItems(prev => ({ ...prev, [domain]: items }));
      return items;
    } catch (error) {
      console.error(`Error fetching ${domain} items:`, error);
      return [];
    } finally {
      setLoadingDomains(prev => ({ ...prev, [domain]: false }));
    }
  }, [userId]);

  // Fetch connector statuses
  const fetchConnectors = useCallback(async () => {
    if (!userId) return;

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('csuite_connectors')
        .select('provider, status, last_sync_at')
        .eq('user_id', userId);

      if (error) throw error;

      const connectorList: ConnectorStatus[] = [
        { provider: 'gmail', status: 'disconnected', lastSync: null },
        { provider: 'gdrive', status: 'disconnected', lastSync: null },
        { provider: 'local', status: 'connected', lastSync: null },
      ];

      (data || []).forEach((conn: any) => {
        const idx = connectorList.findIndex(c => c.provider === conn.provider);
        if (idx !== -1) {
          connectorList[idx] = {
            provider: conn.provider,
            status: conn.status,
            lastSync: conn.last_sync_at ? new Date(conn.last_sync_at) : null,
          };
        }
      });

      setConnectors(connectorList);
    } catch (error) {
      console.error('Error fetching connectors:', error);
    }
  }, [userId]);

  // Fetch recent reports
  const fetchReports = useCallback(async () => {
    if (!userId) return;

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('csuite_reports')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setReports(
        (data || []).map((r: any) => ({
          id: r.id,
          persona: r.persona,
          type: r.type,
          title: r.title,
          content: r.content,
          generatedAt: new Date(r.generated_at),
        }))
      );
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  }, [userId]);

  // Upload file
  const uploadFile = useCallback(async (file: File) => {
    if (!userId) {
      toast.error('Please sign in to upload files');
      return null;
    }

    setIsUploading(true);
    try {
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('csuite-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const client = supabase as any;
      const { data, error: insertError } = await client
        .from('csuite_documents')
        .insert({
          user_id: userId,
          source: 'upload',
          type: file.type.includes('pdf') ? 'pdf' : 
                file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') ? 'spreadsheet' :
                file.type.includes('presentation') || file.name.endsWith('.pptx') ? 'presentation' : 'document',
          title: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(`Uploaded: ${file.name}`);
      fetchStats();
      fetchDomainItems('documents');
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [userId, fetchStats, fetchDomainItems]);

  // Connect OAuth provider (placeholder - will need backend implementation)
  const connectProvider = useCallback(async (provider: string) => {
    if (!userId) {
      toast.error('Please sign in to connect');
      return;
    }

    toast.info(`Connecting to ${provider}... (OAuth flow coming soon)`);
    // TODO: Implement OAuth flow via edge function
  }, [userId]);

  // Generate C-Suite report with custom options
  const generateReport = useCallback(async (
    persona: string, 
    options?: { depth?: 'brief' | 'standard' | 'detailed'; focusAreas?: string[] }
  ) => {
    if (!userId) {
      toast.error('Please sign in to generate reports');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('csuite-generate-report', {
        body: { persona, userId, options },
      });

      if (error) throw error;

      toast.success(`${persona.toUpperCase()} briefing generated`);
      fetchReports();
      return data;
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
      return null;
    }
  }, [userId, fetchReports]);

  // Delete domain item
  const deleteItem = useCallback(async (domain: DomainKey, itemId: string, filePath?: string) => {
    if (!userId) {
      toast.error('Please sign in to delete items');
      return false;
    }

    try {
      const client = supabase as any;
      const tableName = DOMAIN_TABLE_MAP[domain];

      // If it's a document with a file, delete from storage first
      if (domain === 'documents' && filePath) {
        const { error: storageError } = await supabase.storage
          .from('csuite-documents')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Storage delete warning:', storageError);
        }
      }

      // Delete the database record
      const { error } = await client
        .from(tableName)
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setDomainItems(prev => ({
        ...prev,
        [domain]: prev[domain].filter(item => item.id !== itemId)
      }));

      toast.success('Item deleted');
      fetchStats();
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete item');
      return false;
    }
  }, [userId, fetchStats]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      Promise.all([fetchStats(), fetchConnectors(), fetchReports()])
        .finally(() => setIsLoading(false));
    }
  }, [userId, fetchStats, fetchConnectors, fetchReports]);

  // Refresh all data with loading state
  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await Promise.all([fetchStats(), fetchConnectors(), fetchReports()]);
      toast.success('Data refreshed');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchStats, fetchConnectors, fetchReports]);

  return {
    stats,
    connectors,
    reports,
    isLoading,
    isUploading,
    domainItems,
    loadingDomains,
    uploadFile,
    connectProvider,
    generateReport,
    fetchDomainItems,
    deleteItem,
    refresh,
  };
}
