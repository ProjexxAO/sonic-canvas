import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AccessibilitySettings {
  id?: string;
  user_id?: string;
  font_size: 'small' | 'medium' | 'large' | 'x-large';
  reduced_motion: boolean;
  high_contrast: boolean;
  dyslexia_friendly: boolean;
  screen_reader_optimized: boolean;
  audio_feedback_enabled: boolean;
  audio_volume: number;
  keyboard_navigation_hints: boolean;
  color_blind_mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | null;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  font_size: 'medium',
  reduced_motion: false,
  high_contrast: false,
  dyslexia_friendly: false,
  screen_reader_optimized: false,
  audio_feedback_enabled: true,
  audio_volume: 0.5,
  keyboard_navigation_hints: true,
  color_blind_mode: null,
};

export function useAccessibilitySettings(userId: string | undefined) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch settings
  useEffect(() => {
    if (!userId) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_accessibility_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
            font_size: data.font_size as AccessibilitySettings['font_size'],
            color_blind_mode: data.color_blind_mode as AccessibilitySettings['color_blind_mode'],
          });
        } else {
          // Create default settings
          const { error: insertError } = await supabase
            .from('user_accessibility_settings')
            .insert({ user_id: userId });

          if (!insertError) {
            setSettings({
              ...DEFAULT_SETTINGS,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching accessibility settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'x-large': '20px',
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.font_size]);
    root.style.fontSize = fontSizeMap[settings.font_size];

    // Reduced motion
    if (settings.reduced_motion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // High contrast
    if (settings.high_contrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Dyslexia friendly
    if (settings.dyslexia_friendly) {
      root.classList.add('dyslexia-friendly');
    } else {
      root.classList.remove('dyslexia-friendly');
    }

    // Color blind mode
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (settings.color_blind_mode && settings.color_blind_mode !== 'none') {
      root.classList.add(`colorblind-${settings.color_blind_mode}`);
    }

    return () => {
      root.classList.remove('reduce-motion', 'high-contrast', 'dyslexia-friendly');
      root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    };
  }, [settings]);

  const updateSettings = useCallback(async (updates: Partial<AccessibilitySettings>) => {
    if (!userId) return;

    setIsSaving(true);
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      const { error } = await supabase
        .from('user_accessibility_settings')
        .update({
          font_size: newSettings.font_size,
          reduced_motion: newSettings.reduced_motion,
          high_contrast: newSettings.high_contrast,
          dyslexia_friendly: newSettings.dyslexia_friendly,
          screen_reader_optimized: newSettings.screen_reader_optimized,
          audio_feedback_enabled: newSettings.audio_feedback_enabled,
          audio_volume: newSettings.audio_volume,
          keyboard_navigation_hints: newSettings.keyboard_navigation_hints,
          color_blind_mode: newSettings.color_blind_mode,
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
      setSettings(settings); // Revert on error
    } finally {
      setIsSaving(false);
    }
  }, [userId, settings]);

  return {
    settings,
    isLoading,
    isSaving,
    updateSettings,
  };
}
