// Cross-Hub Notification Preferences Hook
// Allows users to control notification boundaries between personal and business

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type HubType = 'personal' | 'group' | 'csuite';
export type NotificationType = 'email' | 'message' | 'task' | 'calendar' | 'mention' | 'update' | 'alert';

export interface NotificationPreference {
  hubType: HubType;
  notificationType: NotificationType;
  enabled: boolean;
  soundEnabled: boolean;
  showInPersonalHub: boolean;
}

export interface HubNotificationSettings {
  hubType: HubType;
  hubId?: string;
  hubName?: string;
  allowNotifications: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
  allowUrgentOverride: boolean;
  mutedUntil?: Date;
}

const DEFAULT_PREFERENCES: Record<HubType, NotificationPreference[]> = {
  personal: [
    { hubType: 'personal', notificationType: 'email', enabled: true, soundEnabled: true, showInPersonalHub: true },
    { hubType: 'personal', notificationType: 'message', enabled: true, soundEnabled: true, showInPersonalHub: true },
    { hubType: 'personal', notificationType: 'task', enabled: true, soundEnabled: false, showInPersonalHub: true },
    { hubType: 'personal', notificationType: 'calendar', enabled: true, soundEnabled: true, showInPersonalHub: true },
  ],
  group: [
    { hubType: 'group', notificationType: 'email', enabled: true, soundEnabled: false, showInPersonalHub: false },
    { hubType: 'group', notificationType: 'message', enabled: true, soundEnabled: false, showInPersonalHub: false },
    { hubType: 'group', notificationType: 'task', enabled: true, soundEnabled: false, showInPersonalHub: false },
    { hubType: 'group', notificationType: 'mention', enabled: true, soundEnabled: true, showInPersonalHub: true },
  ],
  csuite: [
    { hubType: 'csuite', notificationType: 'email', enabled: true, soundEnabled: false, showInPersonalHub: false },
    { hubType: 'csuite', notificationType: 'message', enabled: true, soundEnabled: false, showInPersonalHub: false },
    { hubType: 'csuite', notificationType: 'task', enabled: true, soundEnabled: false, showInPersonalHub: false },
    { hubType: 'csuite', notificationType: 'alert', enabled: true, soundEnabled: true, showInPersonalHub: true },
    { hubType: 'csuite', notificationType: 'mention', enabled: true, soundEnabled: true, showInPersonalHub: true },
  ],
};

const DEFAULT_HUB_SETTINGS: Record<HubType, Omit<HubNotificationSettings, 'hubId' | 'hubName'>> = {
  personal: {
    hubType: 'personal',
    allowNotifications: true,
    quietHoursEnabled: false,
    allowUrgentOverride: true,
  },
  group: {
    hubType: 'group',
    allowNotifications: true,
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    allowUrgentOverride: true,
  },
  csuite: {
    hubType: 'csuite',
    allowNotifications: true,
    quietHoursEnabled: true,
    quietHoursStart: '20:00',
    quietHoursEnd: '07:00',
    allowUrgentOverride: true,
  },
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    ...DEFAULT_PREFERENCES.personal,
    ...DEFAULT_PREFERENCES.group,
    ...DEFAULT_PREFERENCES.csuite,
  ]);
  const [hubSettings, setHubSettings] = useState<HubNotificationSettings[]>([
    DEFAULT_HUB_SETTINGS.personal as HubNotificationSettings,
    DEFAULT_HUB_SETTINGS.group as HubNotificationSettings,
    DEFAULT_HUB_SETTINGS.csuite as HubNotificationSettings,
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Load preferences from localStorage (or could be from DB)
  useEffect(() => {
    if (!user) return;
    
    const savedPrefs = localStorage.getItem(`notification-prefs-${user.id}`);
    const savedSettings = localStorage.getItem(`hub-notification-settings-${user.id}`);
    
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.error('Error loading notification preferences:', e);
      }
    }
    
    if (savedSettings) {
      try {
        setHubSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error loading hub settings:', e);
      }
    }
  }, [user]);

  // Save preferences
  const savePreferences = useCallback((newPrefs: NotificationPreference[]) => {
    if (!user) return;
    setPreferences(newPrefs);
    localStorage.setItem(`notification-prefs-${user.id}`, JSON.stringify(newPrefs));
  }, [user]);

  // Save hub settings
  const saveHubSettings = useCallback((newSettings: HubNotificationSettings[]) => {
    if (!user) return;
    setHubSettings(newSettings);
    localStorage.setItem(`hub-notification-settings-${user.id}`, JSON.stringify(newSettings));
  }, [user]);

  // Update a specific preference
  const updatePreference = useCallback((
    hubType: HubType,
    notificationType: NotificationType,
    updates: Partial<Pick<NotificationPreference, 'enabled' | 'soundEnabled' | 'showInPersonalHub'>>
  ) => {
    const newPrefs = preferences.map(p => {
      if (p.hubType === hubType && p.notificationType === notificationType) {
        return { ...p, ...updates };
      }
      return p;
    });
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  // Update hub-level settings
  const updateHubSettings = useCallback((
    hubType: HubType,
    updates: Partial<Omit<HubNotificationSettings, 'hubType'>>
  ) => {
    const newSettings = hubSettings.map(s => {
      if (s.hubType === hubType) {
        return { ...s, ...updates };
      }
      return s;
    });
    saveHubSettings(newSettings);
  }, [hubSettings, saveHubSettings]);

  // Block all notifications from a hub type
  const blockHubNotifications = useCallback((hubType: HubType, until?: Date) => {
    updateHubSettings(hubType, { 
      allowNotifications: false,
      mutedUntil: until
    });
  }, [updateHubSettings]);

  // Unblock notifications
  const unblockHubNotifications = useCallback((hubType: HubType) => {
    updateHubSettings(hubType, { 
      allowNotifications: true,
      mutedUntil: undefined
    });
  }, [updateHubSettings]);

  // Check if a notification should be shown in personal hub
  const shouldShowInPersonalHub = useCallback((
    hubType: HubType,
    notificationType: NotificationType
  ): boolean => {
    const hubSetting = hubSettings.find(s => s.hubType === hubType);
    if (!hubSetting?.allowNotifications) return false;
    
    // Check quiet hours
    if (hubSetting.quietHoursEnabled && hubSetting.quietHoursStart && hubSetting.quietHoursEnd) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const isQuietTime = currentTime >= hubSetting.quietHoursStart || currentTime <= hubSetting.quietHoursEnd;
      
      if (isQuietTime && notificationType !== 'alert') {
        return false;
      }
    }
    
    const pref = preferences.find(p => p.hubType === hubType && p.notificationType === notificationType);
    return pref?.showInPersonalHub ?? false;
  }, [hubSettings, preferences]);

  // Get preferences by hub type
  const getPreferencesByHub = useCallback((hubType: HubType) => {
    return preferences.filter(p => p.hubType === hubType);
  }, [preferences]);

  // Get hub settings
  const getHubSettings = useCallback((hubType: HubType) => {
    return hubSettings.find(s => s.hubType === hubType);
  }, [hubSettings]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultPrefs = [
      ...DEFAULT_PREFERENCES.personal,
      ...DEFAULT_PREFERENCES.group,
      ...DEFAULT_PREFERENCES.csuite,
    ];
    const defaultSettings = [
      DEFAULT_HUB_SETTINGS.personal as HubNotificationSettings,
      DEFAULT_HUB_SETTINGS.group as HubNotificationSettings,
      DEFAULT_HUB_SETTINGS.csuite as HubNotificationSettings,
    ];
    savePreferences(defaultPrefs);
    saveHubSettings(defaultSettings);
  }, [savePreferences, saveHubSettings]);

  return {
    preferences,
    hubSettings,
    isLoading,
    updatePreference,
    updateHubSettings,
    blockHubNotifications,
    unblockHubNotifications,
    shouldShowInPersonalHub,
    getPreferencesByHub,
    getHubSettings,
    resetToDefaults,
  };
}
