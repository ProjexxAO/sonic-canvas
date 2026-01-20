import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type JobType = 'full_sync' | 'incremental_sync' | 'send_pending' | 'tracking_update';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface SyncJob {
  id: string;
  user_id: string;
  platform_connection_id?: string;
  platform: string;
  job_type: JobType;
  status: JobStatus;
  priority: number;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  progress: number;
  total_items: number;
  processed_items: number;
  error_count: number;
  last_error?: string;
  sync_cursor?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useEmailSync(userId: string | undefined) {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [activeJob, setActiveJob] = useState<SyncJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncInterval, setSyncInterval] = useState<number | null>(null);

  // Fetch sync jobs
  const fetchJobs = useCallback(async (status?: JobStatus) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const client = supabase as any;
      let query = client
        .from('email_sync_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      setJobs(data || []);
      
      // Set active job if any
      const running = data?.find((j: SyncJob) => j.status === 'running');
      setActiveJob(running || null);
    } catch (error) {
      console.error('Error fetching sync jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create sync job
  const createSyncJob = useCallback(async (
    platform: string,
    jobType: JobType,
    options?: {
      platformConnectionId?: string;
      priority?: number;
      scheduledAt?: Date;
      metadata?: Record<string, any>;
    }
  ): Promise<SyncJob | null> => {
    if (!userId) return null;

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('email_sync_jobs')
        .insert({
          user_id: userId,
          platform,
          job_type: jobType,
          platform_connection_id: options?.platformConnectionId,
          priority: options?.priority || 5,
          scheduled_at: options?.scheduledAt?.toISOString() || new Date().toISOString(),
          metadata: options?.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success(`${jobType.replace('_', ' ')} job scheduled`);
      await fetchJobs();
      return data;
    } catch (error) {
      console.error('Error creating sync job:', error);
      toast.error('Failed to schedule sync');
      return null;
    }
  }, [userId, fetchJobs]);

  // Start full sync
  const startFullSync = useCallback(async (
    platform: string,
    connectionId?: string
  ): Promise<SyncJob | null> => {
    return createSyncJob(platform, 'full_sync', {
      platformConnectionId: connectionId,
      priority: 3, // Higher priority
    });
  }, [createSyncJob]);

  // Start incremental sync
  const startIncrementalSync = useCallback(async (
    platform: string,
    connectionId?: string
  ): Promise<SyncJob | null> => {
    return createSyncJob(platform, 'incremental_sync', {
      platformConnectionId: connectionId,
    });
  }, [createSyncJob]);

  // Cancel job
  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('email_sync_jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Sync cancelled');
      await fetchJobs();
      return true;
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast.error('Failed to cancel sync');
      return false;
    }
  }, [userId, fetchJobs]);

  // Update job progress (simulated - would be called by edge function)
  const updateJobProgress = useCallback(async (
    jobId: string,
    progress: number,
    processedItems: number,
    totalItems: number
  ): Promise<boolean> => {
    try {
      const client = supabase as any;
      const { error } = await client
        .from('email_sync_jobs')
        .update({
          progress,
          processed_items: processedItems,
          total_items: totalItems,
          status: progress >= 100 ? 'completed' : 'running',
          completed_at: progress >= 100 ? new Date().toISOString() : null,
        })
        .eq('id', jobId);

      if (error) throw error;
      await fetchJobs();
      return true;
    } catch (error) {
      console.error('Error updating job progress:', error);
      return false;
    }
  }, [fetchJobs]);

  // Start auto-sync interval
  const startAutoSync = useCallback((
    platform: string,
    intervalMinutes: number = 15,
    connectionId?: string
  ) => {
    // Clear existing interval
    if (syncInterval) {
      clearInterval(syncInterval);
    }

    // Start incremental sync immediately
    startIncrementalSync(platform, connectionId);

    // Set up interval
    const interval = window.setInterval(() => {
      startIncrementalSync(platform, connectionId);
    }, intervalMinutes * 60 * 1000);

    setSyncInterval(interval);
    toast.success(`Auto-sync enabled (every ${intervalMinutes} minutes)`);
  }, [syncInterval, startIncrementalSync]);

  // Stop auto-sync
  const stopAutoSync = useCallback(() => {
    if (syncInterval) {
      clearInterval(syncInterval);
      setSyncInterval(null);
      toast.success('Auto-sync disabled');
    }
  }, [syncInterval]);

  // Get sync stats
  const getSyncStats = useCallback(() => {
    const completed = jobs.filter(j => j.status === 'completed');
    const failed = jobs.filter(j => j.status === 'failed');
    const pending = jobs.filter(j => j.status === 'pending');

    const totalItems = completed.reduce((sum, j) => sum + (j.processed_items || 0), 0);
    const lastSync = completed[0]?.completed_at;

    return {
      totalJobs: jobs.length,
      completedJobs: completed.length,
      failedJobs: failed.length,
      pendingJobs: pending.length,
      totalItemsSynced: totalItems,
      lastSyncAt: lastSync,
      isAutoSyncEnabled: syncInterval !== null,
    };
  }, [jobs, syncInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [syncInterval]);

  // Real-time subscription for job updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('sync-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_sync_jobs',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const job = payload.new as SyncJob;
          if (job.status === 'running') {
            setActiveJob(job);
          } else if (job.status === 'completed' || job.status === 'failed') {
            setActiveJob(null);
          }
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchJobs]);

  return {
    jobs,
    activeJob,
    isLoading,
    isAutoSyncEnabled: syncInterval !== null,
    fetchJobs,
    createSyncJob,
    startFullSync,
    startIncrementalSync,
    cancelJob,
    updateJobProgress,
    startAutoSync,
    stopAutoSync,
    getSyncStats,
  };
}
