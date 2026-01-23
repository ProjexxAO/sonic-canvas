// Subscription and Hub Access Management Hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import {
  SubscriptionTier,
  HubType,
  FeatureKey,
  AgentClass,
  TIER_HUB_ACCESS,
  TIER_AGENT_LIMITS,
  TIER_FEATURES,
  TIER_USAGE_LIMITS,
  canAccessHub as tierCanAccessHub,
  hasFullHubAccess,
  canUseFeature,
  hasFullFeatureAccess,
  canAllocateAgentClass,
  getUpgradeTier,
  getTierLabel,
} from '@/lib/tierConfig';

export type { SubscriptionTier, HubType, FeatureKey, AgentClass };

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

  // Get the effective tier (from subscription or default to free)
  const tier: SubscriptionTier = (subscription?.tier as SubscriptionTier) || 'free';

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

        // Get hub access overrides
        const { data: accessData } = await supabase
          .from('hub_access')
          .select('hub_type, access_level, is_active')
          .eq('user_id', user.id);

        setHubAccess((accessData || []) as unknown as HubAccess[]);

        // Get tier features from DB (if any custom overrides)
        const tierValue = subData?.tier || 'free';
        const { data: featuresData } = await supabase
          .from('tier_features')
          .select('feature_key, is_enabled, usage_limit, description')
          .eq('tier', tierValue);

        setFeatures((featuresData || []) as unknown as TierFeature[]);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.id]);

  // Check if user can access a hub (combines tier config + explicit overrides)
  const canAccessHub = useCallback((hubType: HubType): boolean => {
    // Check explicit override first
    const access = hubAccess.find(h => h.hub_type === hubType);
    if (access?.is_active) return true;

    // Fall back to tier-based config
    return tierCanAccessHub(tier, hubType);
  }, [tier, hubAccess]);

  // Check if user has full (not limited) hub access
  const hasFullHub = useCallback((hubType: HubType): boolean => {
    const access = hubAccess.find(h => h.hub_type === hubType);
    if (access?.is_active && access.access_level === 'owner') return true;
    return hasFullHubAccess(tier, hubType);
  }, [tier, hubAccess]);

  // Check if a feature is enabled (combines tier config + DB overrides)
  const hasFeature = useCallback((featureKey: FeatureKey): boolean => {
    // Check DB overrides first
    const dbFeature = features.find(f => f.feature_key === featureKey);
    if (dbFeature !== undefined) return dbFeature.is_enabled;
    
    // Fall back to tier config
    return canUseFeature(tier, featureKey);
  }, [tier, features]);

  // Check if user has full (not limited) feature access
  const hasFullFeature = useCallback((featureKey: FeatureKey): boolean => {
    return hasFullFeatureAccess(tier, featureKey);
  }, [tier]);

  // Get feature limit
  const getFeatureLimit = useCallback((featureKey: string): number | null => {
    const dbFeature = features.find(f => f.feature_key === featureKey);
    return dbFeature?.usage_limit ?? null;
  }, [features]);

  // Agent-related checks
  const getAgentLimits = useCallback(() => {
    return TIER_AGENT_LIMITS[tier];
  }, [tier]);

  const canAllocateClass = useCallback((agentClass: AgentClass): boolean => {
    return canAllocateAgentClass(tier, agentClass);
  }, [tier]);

  const canOrchestrate = useCallback((): boolean => {
    return TIER_AGENT_LIMITS[tier].canOrchestrate;
  }, [tier]);

  const canSwarm = useCallback((): boolean => {
    return TIER_AGENT_LIMITS[tier].canSwarm;
  }, [tier]);

  const getSwarmLimit = useCallback((): number => {
    return TIER_AGENT_LIMITS[tier].swarmLimit;
  }, [tier]);

  // Usage limits
  const getUsageLimits = useCallback(() => {
    return TIER_USAGE_LIMITS[tier];
  }, [tier]);

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

  // Hub limits
  const getMaxGroups = useCallback((): number => {
    return TIER_HUB_ACCESS[tier].maxGroups;
  }, [tier]);

  // Upgrade helpers
  const nextTier = getUpgradeTier(tier);
  const canUpgrade = nextTier !== null;

  return {
    // Core subscription data
    subscription,
    tier,
    hubAccess,
    features,
    isLoading,

    // Hub access
    canAccessHub,
    hasFullHub,
    getMaxGroups,

    // Feature access
    hasFeature,
    hasFullFeature,
    getFeatureLimit,

    // Agent limits
    getAgentLimits,
    canAllocateClass,
    canOrchestrate,
    canSwarm,
    getSwarmLimit,

    // Usage limits
    getUsageLimits,
    hasAICredits,
    remainingAICredits,
    useAICredit,

    // Upgrade helpers
    nextTier,
    canUpgrade,
    getTierLabel: () => getTierLabel(tier),
  };
}
