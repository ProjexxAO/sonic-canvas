import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuickActionUsage {
  actionId: string;
  useCount: number;
  lastUsed: string;
}

export interface QuickActionPreferences {
  customOrder: string[] | null; // null means use auto-sort by usage
  usageStats: Record<string, QuickActionUsage>;
  autoSortByUsage: boolean;
}

const DEFAULT_PREFERENCES: QuickActionPreferences = {
  customOrder: null,
  usageStats: {},
  autoSortByUsage: true,
};

export function useQuickActionPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<QuickActionPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from user_ui_preferences shortcuts_config
  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_ui_preferences')
        .select('shortcuts_config')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data?.shortcuts_config) {
        const config = data.shortcuts_config as any;
        setPreferences({
          customOrder: config.quick_action_order || null,
          usageStats: config.quick_action_usage || {},
          autoSortByUsage: config.auto_sort_actions ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching quick action preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Save preferences to database
  const savePreferences = useCallback(async (newPrefs: Partial<QuickActionPreferences>) => {
    if (!userId) return;

    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);

    try {
      // First get current shortcuts_config
      const { data: current } = await supabase
        .from('user_ui_preferences')
        .select('shortcuts_config')
        .eq('user_id', userId)
        .maybeSingle();

      const currentConfig = (current?.shortcuts_config || {}) as any;
      
      const newConfig = {
        ...currentConfig,
        quick_action_order: updated.customOrder,
        quick_action_usage: updated.usageStats,
        auto_sort_actions: updated.autoSortByUsage,
      };

      await supabase
        .from('user_ui_preferences')
        .upsert({
          user_id: userId,
          shortcuts_config: newConfig,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error saving quick action preferences:', error);
    }
  }, [userId, preferences]);

  // Record action usage
  const recordUsage = useCallback((actionId: string) => {
    const currentStats = preferences.usageStats[actionId] || { actionId, useCount: 0, lastUsed: '' };
    const newStats = {
      ...preferences.usageStats,
      [actionId]: {
        actionId,
        useCount: currentStats.useCount + 1,
        lastUsed: new Date().toISOString(),
      },
    };
    savePreferences({ usageStats: newStats });
  }, [preferences.usageStats, savePreferences]);

  // Set custom order
  const setCustomOrder = useCallback((order: string[]) => {
    savePreferences({ customOrder: order, autoSortByUsage: false });
  }, [savePreferences]);

  // Clear custom order (revert to auto-sort)
  const clearCustomOrder = useCallback(() => {
    savePreferences({ customOrder: null, autoSortByUsage: true });
  }, [savePreferences]);

  // Get sorted action IDs based on preferences
  const getSortedActionIds = useCallback((actionIds: string[]): string[] => {
    // If custom order exists, use it
    if (preferences.customOrder && !preferences.autoSortByUsage) {
      // Merge custom order with any new actions
      const orderedSet = new Set(preferences.customOrder);
      const result = [...preferences.customOrder.filter(id => actionIds.includes(id))];
      actionIds.forEach(id => {
        if (!orderedSet.has(id)) result.push(id);
      });
      return result;
    }

    // Auto-sort by usage count (most used first)
    return [...actionIds].sort((a, b) => {
      const aUsage = preferences.usageStats[a]?.useCount || 0;
      const bUsage = preferences.usageStats[b]?.useCount || 0;
      return bUsage - aUsage;
    });
  }, [preferences]);

  return {
    preferences,
    isLoading,
    recordUsage,
    setCustomOrder,
    clearCustomOrder,
    getSortedActionIds,
  };
}
