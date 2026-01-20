import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TrackingEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spam' | 'unsubscribed';

export interface TrackingEvent {
  id: string;
  message_id: string;
  user_id: string;
  event_type: TrackingEventType;
  recipient_email?: string;
  link_url?: string;
  link_id?: string;
  user_agent?: string;
  ip_address?: string;
  geo_location?: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TrackingAggregate {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  period_type: 'day' | 'week' | 'month';
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  unique_opens: number;
  unique_clicks: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useEmailTracking(userId: string | undefined) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [aggregates, setAggregates] = useState<TrackingAggregate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tracking events for a message
  const fetchTrackingEvents = useCallback(async (messageId?: string) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const client = supabase as any;
      let query = client
        .from('email_tracking_events')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (messageId) {
        query = query.eq('message_id', messageId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching tracking events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch tracking aggregates
  const fetchAggregates = useCallback(async (
    periodType: 'day' | 'week' | 'month' = 'day',
    limit = 30
  ) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('email_tracking_aggregates')
        .select('*')
        .eq('user_id', userId)
        .eq('period_type', periodType)
        .order('period_start', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setAggregates(data || []);
    } catch (error) {
      console.error('Error fetching aggregates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Record a tracking event
  const recordEvent = useCallback(async (
    messageId: string,
    eventType: TrackingEventType,
    metadata?: Partial<TrackingEvent>
  ) => {
    if (!userId) return null;

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('email_tracking_events')
        .insert({
          message_id: messageId,
          user_id: userId,
          event_type: eventType,
          recipient_email: metadata?.recipient_email,
          link_url: metadata?.link_url,
          link_id: metadata?.link_id,
          user_agent: metadata?.user_agent || navigator.userAgent,
          metadata: metadata?.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording tracking event:', error);
      return null;
    }
  }, [userId]);

  // Get analytics summary
  const getAnalyticsSummary = useCallback(() => {
    const totalSent = aggregates.reduce((sum, a) => sum + (a.total_sent || 0), 0);
    const totalOpened = aggregates.reduce((sum, a) => sum + (a.total_opened || 0), 0);
    const totalClicked = aggregates.reduce((sum, a) => sum + (a.total_clicked || 0), 0);
    const totalBounced = aggregates.reduce((sum, a) => sum + (a.total_bounced || 0), 0);

    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0',
      clickRate: totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0',
      bounceRate: totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0',
    };
  }, [aggregates]);

  return {
    events,
    aggregates,
    isLoading,
    fetchTrackingEvents,
    fetchAggregates,
    recordEvent,
    getAnalyticsSummary,
  };
}
