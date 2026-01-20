// Subscription and Hub Access Management Hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionTier = 'free' | 'personal' | 'team' | 'business' | 'enterprise';
export type HubType = 'personal' | 'group' | 'csuite';

interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: string;
  personal_items_limit: number;
  group_memberships_limit: number;
  storage_mb_limit: number;
  ai_credits_monthly: number;
  ai_credits_used: number;
  current_period_start: string | null;
  current_period_end: string | null;
}

interface HubAccess {
  hub_type: HubType;
  access_level: string;
  is_active: boolean;
}

interface TierFeature {
  feature_key: string;
  is_enabled: boolean;
  usage_limit: number | null;
  description: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hubAccess, setHubAccess] = useState<HubAccess[]>([]);
  const [features, setFeatures] = useState<TierFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch subscription data
  useEffect(() => {
    if (!user?.id) {
      setSubscription(null);
      setHubAccess([]);
      setFeatures([]);
      setIsLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      setIsLoading(true);
      try {
        // Get subscription
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (subData) {
          setSubscription(subData as unknown as Subscription);
        } else {
          // Create default subscription if none exists
          const { data: newSub } = await supabase
            .from('subscriptions')
            .insert({ user_id: user.id, tier: 'free', status: 'active' })
            .select()
            .single();
          setSubscription(newSub as unknown as Subscription);
        }

        // Get hub access
        const { data: accessData } = await supabase
          .from('hub_access')
          .select('hub_type, access_level, is_active')
          .eq('user_id', user.id);

        setHubAccess((accessData || []) as unknown as HubAccess[]);

        // Get tier features
        const tier = subData?.tier || 'free';
        const { data: featuresData } = await supabase
          .from('tier_features')
          .select('feature_key, is_enabled, usage_limit, description')
          .eq('tier', tier);

        setFeatures((featuresData || []) as unknown as TierFeature[]);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.id]);

  // Check if user can access a hub
  const canAccessHub = useCallback((hubType: HubType): boolean => {
    if (!subscription) return hubType === 'personal'; // Everyone can access personal
    
    const access = hubAccess.find(h => h.hub_type === hubType);
    if (access?.is_active) return true;

    // Check tier-based access
    switch (hubType) {
      case 'personal':
        return true;
      case 'group':
        return ['team', 'business', 'enterprise'].includes(subscription.tier);
      case 'csuite':
        return ['business', 'enterprise'].includes(subscription.tier);
      default:
        return false;
    }
  }, [subscription, hubAccess]);

  // Check if a feature is enabled
  const hasFeature = useCallback((featureKey: string): boolean => {
    const feature = features.find(f => f.feature_key === featureKey);
    return feature?.is_enabled ?? false;
  }, [features]);

  // Get feature limit
  const getFeatureLimit = useCallback((featureKey: string): number | null => {
    const feature = features.find(f => f.feature_key === featureKey);
    return feature?.usage_limit ?? null;
  }, [features]);

  // Check AI credits
  const hasAICredits = useCallback((): boolean => {
    if (!subscription) return false;
    return subscription.ai_credits_used < subscription.ai_credits_monthly;
  }, [subscription]);

  const remainingAICredits = subscription 
    ? subscription.ai_credits_monthly - subscription.ai_credits_used 
    : 0;

  // Use AI credit
  const useAICredit = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !subscription || !hasAICredits()) return false;

    const { error } = await supabase
      .from('subscriptions')
      .update({ ai_credits_used: subscription.ai_credits_used + 1 })
      .eq('user_id', user.id);

    if (!error) {
      setSubscription(prev => prev ? { ...prev, ai_credits_used: prev.ai_credits_used + 1 } : null);
      return true;
    }
    return false;
  }, [user?.id, subscription, hasAICredits]);

  return {
    subscription,
    tier: subscription?.tier || 'free',
    hubAccess,
    features,
    isLoading,
    canAccessHub,
    hasFeature,
    getFeatureLimit,
    hasAICredits,
    remainingAICredits,
    useAICredit,
  };
}
