// Phone Sync Hook - Manages mobile device data synchronization
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PhoneDataType = 'photos' | 'contacts' | 'calendar' | 'files' | 'messages' | 'notifications';
export type HubDestination = 'personal' | 'group' | 'csuite' | 'auto';

export interface PhoneSyncItem {
  id: string;
  type: PhoneDataType;
  name: string;
  timestamp: string;
  size?: number;
  metadata?: Record<string, unknown>;
  suggestedHub?: HubDestination;
  confirmedHub?: HubDestination;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  previewUrl?: string;
}

export interface PhoneSyncConfig {
  autoSync: boolean;
  syncTypes: PhoneDataType[];
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  wifiOnly: boolean;
  autoCategorizationEnabled: boolean;
}

export interface PhoneSyncStats {
  totalSynced: number;
  pendingItems: number;
  lastSyncTime: string | null;
  syncedByHub: {
    personal: number;
    group: number;
    csuite: number;
  };
  syncedByType: Record<PhoneDataType, number>;
}

const DEFAULT_CONFIG: PhoneSyncConfig = {
  autoSync: true,
  syncTypes: ['photos', 'contacts', 'calendar', 'files'],
  syncFrequency: 'realtime',
  wifiOnly: false,
  autoCategorizationEnabled: true
};

// AI-based content analysis for hub routing
const CATEGORIZATION_RULES = {
  // Keywords and patterns for each hub
  personal: {
    keywords: ['family', 'vacation', 'birthday', 'personal', 'home', 'hobby', 'weekend', 'friends'],
    senderPatterns: ['mom', 'dad', 'wife', 'husband', 'son', 'daughter', 'friend'],
    filePatterns: ['selfie', 'holiday', 'pet', 'recipe']
  },
  group: {
    keywords: ['team', 'project', 'meeting', 'sprint', 'deadline', 'collaboration', 'task'],
    senderPatterns: ['team', 'group', 'dept', 'squad'],
    filePatterns: ['shared', 'draft', 'review', 'feedback']
  },
  csuite: {
    keywords: ['executive', 'board', 'investor', 'quarterly', 'strategy', 'revenue', 'forecast', 'confidential'],
    senderPatterns: ['ceo', 'cfo', 'cto', 'board', 'executive', 'investor'],
    filePatterns: ['report', 'presentation', 'financials', 'strategy', 'confidential']
  }
};

export function usePhoneSync(userId?: string) {
  const [syncItems, setSyncItems] = useState<PhoneSyncItem[]>([]);
  const [config, setConfig] = useState<PhoneSyncConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState<PhoneSyncStats>({
    totalSynced: 0,
    pendingItems: 0,
    lastSyncTime: null,
    syncedByHub: { personal: 0, group: 0, csuite: 0 },
    syncedByType: { photos: 0, contacts: 0, calendar: 0, files: 0, messages: 0, notifications: 0 }
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Load saved config from localStorage
  useEffect(() => {
    if (userId) {
      const savedConfig = localStorage.getItem(`phone-sync-config-${userId}`);
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
      
      const savedStats = localStorage.getItem(`phone-sync-stats-${userId}`);
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    }
  }, [userId]);

  // Save config when it changes
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`phone-sync-config-${userId}`, JSON.stringify(config));
    }
  }, [config, userId]);

  // AI categorization function
  const categorizeItem = useCallback((item: Partial<PhoneSyncItem>): HubDestination => {
    const name = (item.name || '').toLowerCase();
    const metadata = item.metadata || {};
    const content = JSON.stringify(metadata).toLowerCase();
    
    // Score each hub
    const scores = {
      personal: 0,
      group: 0,
      csuite: 0
    };

    // Check keywords
    for (const [hub, rules] of Object.entries(CATEGORIZATION_RULES)) {
      for (const keyword of rules.keywords) {
        if (name.includes(keyword) || content.includes(keyword)) {
          scores[hub as keyof typeof scores] += 2;
        }
      }
      for (const pattern of rules.filePatterns) {
        if (name.includes(pattern)) {
          scores[hub as keyof typeof scores] += 3;
        }
      }
    }

    // Time-based heuristics
    const hour = new Date(item.timestamp || Date.now()).getHours();
    if (hour < 9 || hour > 18) {
      scores.personal += 1; // Outside work hours → personal
    } else {
      scores.group += 1; // Work hours → likely work-related
    }

    // Photos from screenshots often are work-related
    if (item.type === 'photos' && name.includes('screenshot')) {
      scores.group += 2;
    }

    // Find highest score
    const maxHub = Object.entries(scores).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0] as HubDestination;

    // If all scores are low, default to personal
    const maxScore = Math.max(...Object.values(scores));
    return maxScore > 0 ? maxHub : 'personal';
  }, []);

  // Simulate phone connection (in real app, this would use Web APIs)
  const connectPhone = useCallback(async () => {
    try {
      // Check if we're on a mobile device or if media devices are available
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Request permissions for various phone features
      if ('contacts' in navigator && 'ContactsManager' in window) {
        // Contacts API available (Chrome on Android)
        console.log('Contacts API available');
      }

      // Check for media devices (camera access)
      if (navigator.mediaDevices) {
        try {
          // Just check permissions, don't actually access camera
          const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log('Camera permission:', permissions.state);
        } catch (e) {
          console.log('Camera permission check not supported');
        }
      }

      setIsConnected(true);
      toast({
        title: 'Phone Connected',
        description: isMobile 
          ? 'Your device is now syncing with Atlas OS'
          : 'Atlas OS is ready to receive data from your mobile device',
      });

      return true;
    } catch (error) {
      console.error('Failed to connect phone:', error);
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect phone. Please try again.',
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  // Handle file upload from phone (photos, documents)
  const handlePhoneUpload = useCallback(async (
    files: FileList | File[],
    type: PhoneDataType = 'files'
  ) => {
    if (!userId) return [];

    setIsSyncing(true);
    const uploadedItems: PhoneSyncItem[] = [];

    try {
      for (const file of Array.from(files)) {
        const timestamp = new Date().toISOString();
        const itemId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create sync item
        const item: PhoneSyncItem = {
          id: itemId,
          type: type === 'files' && file.type.startsWith('image/') ? 'photos' : type,
          name: file.name,
          timestamp,
          size: file.size,
          metadata: {
            mimeType: file.type,
            lastModified: file.lastModified
          },
          syncStatus: 'syncing'
        };

        // Add to pending items
        setSyncItems(prev => [...prev, item]);

        // Categorize the item
        const suggestedHub = categorizeItem(item);
        item.suggestedHub = suggestedHub;
        item.confirmedHub = config.autoCategorizationEnabled ? suggestedHub : undefined;

        // Upload to appropriate storage based on type
        let uploadPath = '';
        let bucket = 'user-photos';

        if (item.type === 'photos') {
          bucket = 'user-photos';
          uploadPath = `${userId}/${item.confirmedHub || 'uncategorized'}/${itemId}-${file.name}`;
        } else {
          // For other file types, we'd use a different bucket
          bucket = 'user-photos'; // Using same bucket for now
          uploadPath = `${userId}/files/${itemId}-${file.name}`;
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(uploadPath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          item.syncStatus = 'error';
        } else {
          item.syncStatus = 'synced';
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(uploadPath);
          
          item.previewUrl = publicUrl;

          // If it's a photo, save metadata to user_photos table
          if (item.type === 'photos') {
            await supabase.from('user_photos').insert({
              user_id: userId,
              file_name: file.name,
              file_path: uploadPath,
              file_size: file.size,
              mime_type: file.type,
              category: item.confirmedHub === 'csuite' ? 'work' 
                : item.confirmedHub === 'group' ? 'work'
                : 'personal',
              tags: [item.confirmedHub || 'uncategorized'],
              metadata: {
                source: 'phone_sync',
                suggested_hub: item.suggestedHub,
                confirmed_hub: item.confirmedHub
              }
            });
          }
        }

        // Update item in list
        setSyncItems(prev => prev.map(i => i.id === itemId ? item : i));
        uploadedItems.push(item);
      }

      // Update stats
      setStats(prev => {
        const newStats = { ...prev };
        newStats.totalSynced += uploadedItems.filter(i => i.syncStatus === 'synced').length;
        newStats.lastSyncTime = new Date().toISOString();
        
        for (const item of uploadedItems) {
          if (item.syncStatus === 'synced' && item.confirmedHub) {
            newStats.syncedByHub[item.confirmedHub as keyof typeof newStats.syncedByHub]++;
          }
          newStats.syncedByType[item.type]++;
        }
        
        if (userId) {
          localStorage.setItem(`phone-sync-stats-${userId}`, JSON.stringify(newStats));
        }
        
        return newStats;
      });

      toast({
        title: 'Sync Complete',
        description: `${uploadedItems.length} item(s) synced from your phone`
      });

    } catch (error) {
      console.error('Phone upload error:', error);
      toast({
        title: 'Sync Failed',
        description: 'Some items failed to sync',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }

    return uploadedItems;
  }, [userId, categorizeItem, config.autoCategorizationEnabled, toast]);

  // Manually reassign an item to a different hub
  const reassignToHub = useCallback(async (itemId: string, hub: HubDestination) => {
    setSyncItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, confirmedHub: hub }
        : item
    ));

    // Update in database if applicable
    const item = syncItems.find(i => i.id === itemId);
    if (item?.type === 'photos' && userId) {
      await supabase
        .from('user_photos')
        .update({
          tags: [hub],
          metadata: {
            suggested_hub: item.suggestedHub,
            confirmed_hub: hub,
            reassigned_at: new Date().toISOString()
          }
        })
        .eq('user_id', userId)
        .ilike('file_path', `%${itemId}%`);
    }

    toast({
      title: 'Item Reassigned',
      description: `Moved to ${hub === 'csuite' ? 'Enterprise' : hub.charAt(0).toUpperCase() + hub.slice(1)} Hub`
    });
  }, [syncItems, userId, toast]);

  // Update sync configuration
  const updateConfig = useCallback((updates: Partial<PhoneSyncConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Get pending items that need hub confirmation
  const getPendingConfirmation = useCallback(() => {
    return syncItems.filter(item => 
      item.syncStatus === 'synced' && 
      item.suggestedHub && 
      !item.confirmedHub
    );
  }, [syncItems]);

  // Get items by hub
  const getItemsByHub = useCallback((hub: HubDestination) => {
    return syncItems.filter(item => item.confirmedHub === hub);
  }, [syncItems]);

  return {
    // State
    syncItems,
    config,
    stats,
    isConnected,
    isSyncing,
    
    // Actions
    connectPhone,
    handlePhoneUpload,
    reassignToHub,
    updateConfig,
    categorizeItem,
    
    // Helpers
    getPendingConfirmation,
    getItemsByHub
  };
}
