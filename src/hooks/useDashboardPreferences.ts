import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardPreferences {
  id?: string;
  widget_order: string[];
  selected_shortcuts: string[];
  columns: number;
  layout_preset: string;
  atlas_filter: {
    priority: 'smart' | 'data' | 'time' | 'category';
    focusArea?: 'all' | 'productivity' | 'finance' | 'health';
  };
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  widget_order: [],
  selected_shortcuts: ['tasks', 'goals', 'habits', 'email', 'photos', 'finance'],
  columns: 2,
  layout_preset: 'default',
  atlas_filter: { priority: 'smart' }
};

export function useDashboardPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch preferences from database
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('user_dashboard_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching dashboard preferences:', error);
        }

        if (data) {
          setPreferences({
            id: data.id,
            widget_order: data.widget_order || [],
            selected_shortcuts: data.selected_shortcuts || DEFAULT_PREFERENCES.selected_shortcuts,
            columns: data.columns || 2,
            layout_preset: data.layout_preset || 'default',
            atlas_filter: (data.atlas_filter as DashboardPreferences['atlas_filter']) || DEFAULT_PREFERENCES.atlas_filter
          });
        } else {
          // Migrate from localStorage if available
          const savedWidgetOrder = localStorage.getItem(`personal-widget-order-${user.id}`);
          const savedShortcuts = localStorage.getItem(`personal-shortcuts-${user.id}`);
          
          const migratedPrefs: DashboardPreferences = {
            ...DEFAULT_PREFERENCES,
            widget_order: savedWidgetOrder ? JSON.parse(savedWidgetOrder) : [],
            selected_shortcuts: savedShortcuts ? JSON.parse(savedShortcuts) : DEFAULT_PREFERENCES.selected_shortcuts
          };
          
          setPreferences(migratedPrefs);
          
          // Save migrated preferences to database
          if (savedWidgetOrder || savedShortcuts) {
            await savePreferences(migratedPrefs);
          }
        }
      } catch (err) {
        console.error('Error in fetchPreferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.id]);

  const savePreferences = useCallback(async (newPrefs: Partial<DashboardPreferences>) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const prefsToSave = { ...preferences, ...newPrefs };
      
      const { error } = await supabase
        .from('user_dashboard_preferences')
        .upsert({
          user_id: user.id,
          widget_order: prefsToSave.widget_order,
          selected_shortcuts: prefsToSave.selected_shortcuts,
          columns: prefsToSave.columns,
          layout_preset: prefsToSave.layout_preset,
          atlas_filter: prefsToSave.atlas_filter as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving dashboard preferences:', error);
      } else {
        setPreferences(prefsToSave);
        
        // Clear localStorage after successful save to database
        localStorage.removeItem(`personal-widget-order-${user.id}`);
        localStorage.removeItem(`personal-shortcuts-${user.id}`);
      }
    } catch (err) {
      console.error('Error in savePreferences:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences]);

  const updateWidgetOrder = useCallback((newOrder: string[]) => {
    setPreferences(prev => ({ ...prev, widget_order: newOrder }));
    savePreferences({ widget_order: newOrder });
  }, [savePreferences]);

  const updateSelectedShortcuts = useCallback((shortcuts: string[]) => {
    setPreferences(prev => ({ ...prev, selected_shortcuts: shortcuts }));
    savePreferences({ selected_shortcuts: shortcuts });
  }, [savePreferences]);

  const updateColumns = useCallback((columns: number) => {
    setPreferences(prev => ({ ...prev, columns }));
    savePreferences({ columns });
  }, [savePreferences]);

  const updateLayoutPreset = useCallback((preset: string) => {
    setPreferences(prev => ({ ...prev, layout_preset: preset }));
    savePreferences({ layout_preset: preset });
  }, [savePreferences]);

  const updateAtlasFilter = useCallback((filter: DashboardPreferences['atlas_filter']) => {
    setPreferences(prev => ({ ...prev, atlas_filter: filter }));
    savePreferences({ atlas_filter: filter });
  }, [savePreferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    updateWidgetOrder,
    updateSelectedShortcuts,
    updateColumns,
    updateLayoutPreset,
    updateAtlasFilter
  };
}
