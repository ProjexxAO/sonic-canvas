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
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [userId, fetchStats]);

  // Connect OAuth provider (placeholder - will need backend implementation)
  const connectProvider = useCallback(async (provider: string) => {
    if (!userId) {
      toast.error('Please sign in to connect');
      return;
    }

    toast.info(`Connecting to ${provider}... (OAuth flow coming soon)`);
    // TODO: Implement OAuth flow via edge function
  }, [userId]);

  // Generate C-Suite report
  const generateReport = useCallback(async (persona: string) => {
    if (!userId) {
      toast.error('Please sign in to generate reports');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('csuite-generate-report', {
        body: { persona, userId },
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

  // Initial fetch
  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      Promise.all([fetchStats(), fetchConnectors(), fetchReports()])
        .finally(() => setIsLoading(false));
    }
  }, [userId, fetchStats, fetchConnectors, fetchReports]);

  return {
    stats,
    connectors,
    reports,
    isLoading,
    isUploading,
    uploadFile,
    connectProvider,
    generateReport,
    refresh: () => Promise.all([fetchStats(), fetchConnectors(), fetchReports()]),
  };
}
