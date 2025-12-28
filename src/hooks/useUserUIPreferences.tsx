import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LayoutConfig {
  sidebar_collapsed: boolean;
  dashboard_card_order: string[];
  hidden_sections: string[];
  panel_sizes: Record<string, number>;
}

export interface ThemeConfig {
  mode: 'system' | 'light' | 'dark';
  density: 'compact' | 'comfortable' | 'spacious';
  font_size: 'small' | 'medium' | 'large';
  accent_color: string | null;
  animations_enabled: boolean;
}

export interface DefaultsConfig {
  default_tab: string;
  default_view_mode: 'list' | 'grid';
  saved_filters: Record<string, any>;
  default_sort_orders: Record<string, string>;
  pinned_items: string[];
}

export interface ShortcutsConfig {
  pinned_agents: string[];
  favorite_reports: string[];
  quick_actions: string[];
}

export interface UserUIPreferences {
  id: string;
  user_id: string;
  layout_config: LayoutConfig;
  theme_config: ThemeConfig;
  defaults_config: DefaultsConfig;
  shortcuts_config: ShortcutsConfig;
}

const DEFAULT_LAYOUT: LayoutConfig = {
  sidebar_collapsed: false,
  dashboard_card_order: ['communications', 'documents', 'events', 'financials', 'tasks', 'knowledge'],
  hidden_sections: [],
  panel_sizes: {},
};

const DEFAULT_THEME: ThemeConfig = {
  mode: 'system',
  density: 'comfortable',
  font_size: 'medium',
  accent_color: null,
  animations_enabled: true,
};

const DEFAULT_DEFAULTS: DefaultsConfig = {
  default_tab: 'command',
  default_view_mode: 'list',
  saved_filters: {},
  default_sort_orders: {},
  pinned_items: [],
};

const DEFAULT_SHORTCUTS: ShortcutsConfig = {
  pinned_agents: [],
  favorite_reports: [],
  quick_actions: [],
};

export function useUserUIPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<UserUIPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('user_ui_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          id: data.id,
          user_id: data.user_id,
          layout_config: { ...DEFAULT_LAYOUT, ...data.layout_config },
          theme_config: { ...DEFAULT_THEME, ...data.theme_config },
          defaults_config: { ...DEFAULT_DEFAULTS, ...data.defaults_config },
          shortcuts_config: { ...DEFAULT_SHORTCUTS, ...data.shortcuts_config },
        });
      } else {
        // Create default preferences
        const { data: newData, error: insertError } = await (supabase as any)
          .from('user_ui_preferences')
          .insert({
            user_id: userId,
            layout_config: DEFAULT_LAYOUT,
            theme_config: DEFAULT_THEME,
            defaults_config: DEFAULT_DEFAULTS,
            shortcuts_config: DEFAULT_SHORTCUTS,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setPreferences({
          id: newData.id,
          user_id: newData.user_id,
          layout_config: DEFAULT_LAYOUT,
          theme_config: DEFAULT_THEME,
          defaults_config: DEFAULT_DEFAULTS,
          shortcuts_config: DEFAULT_SHORTCUTS,
        });
      }
    } catch (error) {
      console.error('Error fetching UI preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Update layout config
  const updateLayoutConfig = useCallback(async (updates: Partial<LayoutConfig>) => {
    if (!preferences || !userId) return;

    setIsSaving(true);
    const newLayout = { ...preferences.layout_config, ...updates };

    try {
      const { error } = await (supabase as any)
        .from('user_ui_preferences')
        .update({ layout_config: newLayout })
        .eq('user_id', userId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, layout_config: newLayout } : null);
    } catch (error) {
      console.error('Error updating layout:', error);
      toast.error('Failed to save layout preferences');
    } finally {
      setIsSaving(false);
    }
  }, [preferences, userId]);

  // Update theme config
  const updateThemeConfig = useCallback(async (updates: Partial<ThemeConfig>) => {
    if (!preferences || !userId) return;

    setIsSaving(true);
    const newTheme = { ...preferences.theme_config, ...updates };

    try {
      const { error } = await (supabase as any)
        .from('user_ui_preferences')
        .update({ theme_config: newTheme })
        .eq('user_id', userId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, theme_config: newTheme } : null);
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Failed to save theme preferences');
    } finally {
      setIsSaving(false);
    }
  }, [preferences, userId]);

  // Update defaults config
  const updateDefaultsConfig = useCallback(async (updates: Partial<DefaultsConfig>) => {
    if (!preferences || !userId) return;

    setIsSaving(true);
    const newDefaults = { ...preferences.defaults_config, ...updates };

    try {
      const { error } = await (supabase as any)
        .from('user_ui_preferences')
        .update({ defaults_config: newDefaults })
        .eq('user_id', userId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, defaults_config: newDefaults } : null);
    } catch (error) {
      console.error('Error updating defaults:', error);
      toast.error('Failed to save default preferences');
    } finally {
      setIsSaving(false);
    }
  }, [preferences, userId]);

  // Update shortcuts config
  const updateShortcutsConfig = useCallback(async (updates: Partial<ShortcutsConfig>) => {
    if (!preferences || !userId) return;

    setIsSaving(true);
    const newShortcuts = { ...preferences.shortcuts_config, ...updates };

    try {
      const { error } = await (supabase as any)
        .from('user_ui_preferences')
        .update({ shortcuts_config: newShortcuts })
        .eq('user_id', userId);

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, shortcuts_config: newShortcuts } : null);
    } catch (error) {
      console.error('Error updating shortcuts:', error);
      toast.error('Failed to save shortcut preferences');
    } finally {
      setIsSaving(false);
    }
  }, [preferences, userId]);

  // Reorder dashboard cards
  const reorderDashboardCards = useCallback(async (newOrder: string[]) => {
    await updateLayoutConfig({ dashboard_card_order: newOrder });
  }, [updateLayoutConfig]);

  // Toggle section visibility
  const toggleSectionVisibility = useCallback(async (sectionId: string) => {
    if (!preferences) return;

    const hidden = preferences.layout_config.hidden_sections;
    const newHidden = hidden.includes(sectionId)
      ? hidden.filter(s => s !== sectionId)
      : [...hidden, sectionId];

    await updateLayoutConfig({ hidden_sections: newHidden });
  }, [preferences, updateLayoutConfig]);

  // Save a filter preset
  const saveFilterPreset = useCallback(async (domain: string, name: string, filter: any) => {
    if (!preferences) return;

    const savedFilters = { ...preferences.defaults_config.saved_filters };
    if (!savedFilters[domain]) savedFilters[domain] = {};
    savedFilters[domain][name] = filter;

    await updateDefaultsConfig({ saved_filters: savedFilters });
    toast.success(`Filter "${name}" saved`);
  }, [preferences, updateDefaultsConfig]);

  // Pin/unpin an agent
  const togglePinnedAgent = useCallback(async (agentId: string) => {
    if (!preferences) return;

    const pinned = preferences.shortcuts_config.pinned_agents;
    const newPinned = pinned.includes(agentId)
      ? pinned.filter(id => id !== agentId)
      : [...pinned, agentId];

    await updateShortcutsConfig({ pinned_agents: newPinned });
  }, [preferences, updateShortcutsConfig]);

  return {
    preferences,
    isLoading,
    isSaving,
    updateLayoutConfig,
    updateThemeConfig,
    updateDefaultsConfig,
    updateShortcutsConfig,
    reorderDashboardCards,
    toggleSectionVisibility,
    saveFilterPreset,
    togglePinnedAgent,
    refresh: fetchPreferences,
  };
}
