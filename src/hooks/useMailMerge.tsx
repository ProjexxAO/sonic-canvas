import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'paused' | 'completed' | 'failed';
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed';

export interface MailMergeCampaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  subject_template: string;
  body_template: string;
  body_html_template?: string;
  from_address?: string;
  status: CampaignStatus;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  platform: string;
  merge_fields: string[];
  settings: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MailMergeRecipient {
  id: string;
  campaign_id: string;
  email: string;
  merge_data: Record<string, any>;
  status: RecipientStatus;
  message_id?: string;
  sent_at?: string;
  error_message?: string;
  tracking_events: any[];
  created_at: string;
  updated_at: string;
}

export function useMailMerge(userId: string | undefined) {
  const [campaigns, setCampaigns] = useState<MailMergeCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<MailMergeCampaign | null>(null);
  const [recipients, setRecipients] = useState<MailMergeRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('mail_merge_campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create campaign
  const createCampaign = useCallback(async (
    name: string,
    subjectTemplate: string,
    bodyTemplate: string,
    options?: {
      description?: string;
      bodyHtmlTemplate?: string;
      fromAddress?: string;
      mergeFields?: string[];
      platform?: string;
    }
  ): Promise<MailMergeCampaign | null> => {
    if (!userId) return null;

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('mail_merge_campaigns')
        .insert({
          user_id: userId,
          name,
          description: options?.description,
          subject_template: subjectTemplate,
          body_template: bodyTemplate,
          body_html_template: options?.bodyHtmlTemplate,
          from_address: options?.fromAddress,
          merge_fields: options?.mergeFields || [],
          platform: options?.platform || 'internal',
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Campaign created');
      await fetchCampaigns();
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      return null;
    }
  }, [userId, fetchCampaigns]);

  // Update campaign
  const updateCampaign = useCallback(async (
    campaignId: string,
    updates: Partial<MailMergeCampaign>
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('mail_merge_campaigns')
        .update(updates)
        .eq('id', campaignId)
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Campaign updated');
      await fetchCampaigns();
      return true;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
      return false;
    }
  }, [userId, fetchCampaigns]);

  // Fetch recipients for a campaign
  const fetchRecipients = useCallback(async (campaignId: string) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('mail_merge_recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Add recipients
  const addRecipients = useCallback(async (
    campaignId: string,
    recipientData: { email: string; merge_data: Record<string, any> }[]
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      
      const recipients = recipientData.map(r => ({
        campaign_id: campaignId,
        email: r.email,
        merge_data: r.merge_data,
      }));

      const { error } = await client
        .from('mail_merge_recipients')
        .insert(recipients);

      if (error) throw error;

      // Update recipient count
      await client
        .from('mail_merge_campaigns')
        .update({ total_recipients: recipientData.length })
        .eq('id', campaignId);

      toast.success(`${recipientData.length} recipients added`);
      await fetchRecipients(campaignId);
      return true;
    } catch (error) {
      console.error('Error adding recipients:', error);
      toast.error('Failed to add recipients');
      return false;
    }
  }, [userId, fetchRecipients]);

  // Parse merge template
  const parseMergeTemplate = useCallback((
    template: string,
    data: Record<string, any>
  ): string => {
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, String(value || ''));
    });
    return result;
  }, []);

  // Extract merge fields from template
  const extractMergeFields = useCallback((template: string): string[] => {
    const regex = /\{\{\s*(\w+)\s*\}\}/g;
    const fields: string[] = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      if (!fields.includes(match[1])) {
        fields.push(match[1]);
      }
    }
    return fields;
  }, []);

  // Start campaign
  const startCampaign = useCallback(async (campaignId: string): Promise<boolean> => {
    if (!userId) return false;

    setIsSending(true);
    try {
      const client = supabase as any;
      
      // Update campaign status
      await client
        .from('mail_merge_campaigns')
        .update({
          status: 'sending',
          started_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      // In a real implementation, this would trigger an edge function
      // to process the campaign queue
      toast.success('Campaign started');
      await fetchCampaigns();
      return true;
    } catch (error) {
      console.error('Error starting campaign:', error);
      toast.error('Failed to start campaign');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [userId, fetchCampaigns]);

  // Pause campaign
  const pauseCampaign = useCallback(async (campaignId: string): Promise<boolean> => {
    return updateCampaign(campaignId, { status: 'paused' });
  }, [updateCampaign]);

  // Schedule campaign
  const scheduleCampaign = useCallback(async (
    campaignId: string,
    scheduledAt: Date
  ): Promise<boolean> => {
    return updateCampaign(campaignId, {
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
    });
  }, [updateCampaign]);

  // Delete campaign
  const deleteCampaign = useCallback(async (campaignId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('mail_merge_campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Campaign deleted');
      await fetchCampaigns();
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
      return false;
    }
  }, [userId, fetchCampaigns]);

  return {
    campaigns,
    selectedCampaign,
    recipients,
    isLoading,
    isSending,
    setSelectedCampaign,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    fetchRecipients,
    addRecipients,
    parseMergeTemplate,
    extractMergeFields,
    startCampaign,
    pauseCampaign,
    scheduleCampaign,
  };
}
