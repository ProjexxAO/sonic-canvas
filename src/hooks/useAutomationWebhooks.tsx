import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type WebhookProvider = 'zapier' | 'make' | 'n8n' | 'custom';
export type TriggerType = 'email_received' | 'email_sent' | 'contact_added' | 'campaign_completed' | 'tracking_event' | 'custom';

export interface AutomationWebhook {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  webhook_url: string;
  provider: WebhookProvider;
  trigger_type: TriggerType;
  trigger_conditions: Record<string, any>;
  is_active: boolean;
  last_triggered_at?: string;
  trigger_count: number;
  error_count: number;
  last_error?: string;
  headers: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useAutomationWebhooks(userId: string | undefined) {
  const [webhooks, setWebhooks] = useState<AutomationWebhook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  // Fetch webhooks
  const fetchWebhooks = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('automation_webhooks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create webhook
  const createWebhook = useCallback(async (
    name: string,
    webhookUrl: string,
    triggerType: TriggerType,
    options?: {
      description?: string;
      provider?: WebhookProvider;
      triggerConditions?: Record<string, any>;
      headers?: Record<string, any>;
    }
  ): Promise<AutomationWebhook | null> => {
    if (!userId) return null;

    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('automation_webhooks')
        .insert({
          user_id: userId,
          name,
          description: options?.description,
          webhook_url: webhookUrl,
          provider: options?.provider || 'zapier',
          trigger_type: triggerType,
          trigger_conditions: options?.triggerConditions || {},
          headers: options?.headers || {},
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Webhook created');
      await fetchWebhooks();
      return data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Failed to create webhook');
      return null;
    }
  }, [userId, fetchWebhooks]);

  // Update webhook
  const updateWebhook = useCallback(async (
    webhookId: string,
    updates: Partial<AutomationWebhook>
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('automation_webhooks')
        .update(updates)
        .eq('id', webhookId)
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Webhook updated');
      await fetchWebhooks();
      return true;
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast.error('Failed to update webhook');
      return false;
    }
  }, [userId, fetchWebhooks]);

  // Delete webhook
  const deleteWebhook = useCallback(async (webhookId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const client = supabase as any;
      const { error } = await client
        .from('automation_webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Webhook deleted');
      await fetchWebhooks();
      return true;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
      return false;
    }
  }, [userId, fetchWebhooks]);

  // Toggle webhook active state
  const toggleWebhook = useCallback(async (webhookId: string): Promise<boolean> => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) return false;
    
    return updateWebhook(webhookId, { is_active: !webhook.is_active });
  }, [webhooks, updateWebhook]);

  // Trigger webhook manually
  const triggerWebhook = useCallback(async (
    webhookId: string,
    payload: Record<string, any>
  ): Promise<boolean> => {
    if (!userId) return false;

    const webhook = webhooks.find(w => w.id === webhookId);
    if (!webhook) {
      toast.error('Webhook not found');
      return false;
    }

    setIsTriggering(true);
    try {
      // Make the webhook call
      const response = await fetch(webhook.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers,
        },
        mode: 'no-cors', // Handle CORS for Zapier
        body: JSON.stringify({
          ...payload,
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
          webhook_id: webhookId,
        }),
      });

      // Update trigger count
      const client = supabase as any;
      await client
        .from('automation_webhooks')
        .update({
          last_triggered_at: new Date().toISOString(),
          trigger_count: (webhook.trigger_count || 0) + 1,
          last_error: null,
        })
        .eq('id', webhookId);

      toast.success('Webhook triggered');
      await fetchWebhooks();
      return true;
    } catch (error: any) {
      console.error('Error triggering webhook:', error);
      
      // Update error count
      const client = supabase as any;
      await client
        .from('automation_webhooks')
        .update({
          error_count: (webhook.error_count || 0) + 1,
          last_error: error.message,
        })
        .eq('id', webhookId);

      toast.error('Failed to trigger webhook');
      return false;
    } finally {
      setIsTriggering(false);
    }
  }, [userId, webhooks, fetchWebhooks]);

  // Get webhooks by trigger type
  const getWebhooksByTrigger = useCallback((triggerType: TriggerType): AutomationWebhook[] => {
    return webhooks.filter(w => w.trigger_type === triggerType && w.is_active);
  }, [webhooks]);

  // Auto-trigger webhooks for an event
  const autoTriggerWebhooks = useCallback(async (
    triggerType: TriggerType,
    payload: Record<string, any>
  ): Promise<void> => {
    const matchingWebhooks = getWebhooksByTrigger(triggerType);
    
    for (const webhook of matchingWebhooks) {
      // Check conditions if any
      const conditions = webhook.trigger_conditions;
      let shouldTrigger = true;

      if (conditions && Object.keys(conditions).length > 0) {
        // Simple condition matching
        for (const [key, value] of Object.entries(conditions)) {
          if (payload[key] !== value) {
            shouldTrigger = false;
            break;
          }
        }
      }

      if (shouldTrigger) {
        await triggerWebhook(webhook.id, payload);
      }
    }
  }, [getWebhooksByTrigger, triggerWebhook]);

  return {
    webhooks,
    isLoading,
    isTriggering,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    toggleWebhook,
    triggerWebhook,
    getWebhooksByTrigger,
    autoTriggerWebhooks,
  };
}
