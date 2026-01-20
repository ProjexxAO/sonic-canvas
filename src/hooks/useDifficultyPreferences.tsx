import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type DifficultyLevel = 'beginner' | 'standard' | 'advanced' | 'expert';
export type ReportComplexity = 'brief' | 'standard' | 'detailed' | 'comprehensive';
export type AutonomyPreference = 'human_led' | 'supervised' | 'full_auto';

export interface DifficultyPreferences {
  id?: string;
  user_id?: string;
  global_difficulty: DifficultyLevel;
  domain_difficulties: Record<string, DifficultyLevel>;
  auto_adjust_enabled: boolean;
  show_advanced_features: boolean;
  report_complexity: ReportComplexity;
  agent_autonomy_preference: AutonomyPreference;
}

const DEFAULT_PREFERENCES: DifficultyPreferences = {
  global_difficulty: 'standard',
  domain_difficulties: {},
  auto_adjust_enabled: true,
  show_advanced_features: false,
  report_complexity: 'standard',
  agent_autonomy_preference: 'supervised',
};

export function useDifficultyPreferences(userId: string | undefined) {
  const [preferences, setPreferences] = useState<DifficultyPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPreferences(DEFAULT_PREFERENCES);
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_difficulty_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...data,
            global_difficulty: data.global_difficulty as DifficultyLevel,
            domain_difficulties: (data.domain_difficulties as Record<string, DifficultyLevel>) || {},
            report_complexity: data.report_complexity as ReportComplexity,
            agent_autonomy_preference: data.agent_autonomy_preference as AutonomyPreference,
          });
        } else {
          const { error: insertError } = await supabase
            .from('user_difficulty_preferences')
            .insert({ user_id: userId });

          if (!insertError) {
            setPreferences({
              ...DEFAULT_PREFERENCES,
              user_id: userId,
              ...newData,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching difficulty preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [userId]);

  const updatePreferences = useCallback(async (updates: Partial<DifficultyPreferences>) => {
    if (!userId) return;

    setIsSaving(true);
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);

    try {
      const { error } = await supabase
        .from('user_difficulty_preferences')
        .update({
          global_difficulty: newPrefs.global_difficulty,
          domain_difficulties: newPrefs.domain_difficulties,
          auto_adjust_enabled: newPrefs.auto_adjust_enabled,
          show_advanced_features: newPrefs.show_advanced_features,
          report_complexity: newPrefs.report_complexity,
          agent_autonomy_preference: newPrefs.agent_autonomy_preference,
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating difficulty preferences:', error);
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  }, [userId, preferences]);

  const setDomainDifficulty = useCallback((domain: string, level: DifficultyLevel) => {
    updatePreferences({
      domain_difficulties: {
        ...preferences.domain_difficulties,
        [domain]: level,
      },
    });
  }, [preferences, updatePreferences]);

  const getDomainDifficulty = useCallback((domain: string): DifficultyLevel => {
    return preferences.domain_difficulties[domain] || preferences.global_difficulty;
  }, [preferences]);

  return {
    preferences,
    isLoading,
    isSaving,
    updatePreferences,
    setDomainDifficulty,
    getDomainDifficulty,
  };
}
