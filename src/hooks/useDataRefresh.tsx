// Data Refresh Event System - Enables cross-component data synchronization
// When Atlas or widgets modify data, this triggers refreshes across the app

import { useEffect, useCallback } from 'react';
import { create } from 'zustand';

type DataDomain = 'personal_items' | 'personal_goals' | 'personal_habits' | 'tasks' | 'widgets' | 'all';

interface RefreshEvent {
  domain: DataDomain;
  timestamp: number;
  source?: string;
}

interface DataRefreshStore {
  lastRefresh: Record<DataDomain, number>;
  triggerRefresh: (domain: DataDomain, source?: string) => void;
  subscribe: (domain: DataDomain, callback: () => void) => () => void;
}

// Global store for data refresh events
export const useDataRefreshStore = create<DataRefreshStore>((set, get) => {
  const listeners: Map<DataDomain, Set<() => void>> = new Map();

  return {
    lastRefresh: {
      personal_items: 0,
      personal_goals: 0,
      personal_habits: 0,
      tasks: 0,
      widgets: 0,
      all: 0,
    },
    
    triggerRefresh: (domain: DataDomain, source?: string) => {
      const timestamp = Date.now();
      console.log(`[DataRefresh] Triggering refresh for ${domain} from ${source || 'unknown'}`);
      
      set((state) => ({
        lastRefresh: {
          ...state.lastRefresh,
          [domain]: timestamp,
          ...(domain !== 'all' ? {} : {
            personal_items: timestamp,
            personal_goals: timestamp,
            personal_habits: timestamp,
            tasks: timestamp,
            widgets: timestamp,
          }),
        },
      }));
      
      // Notify listeners
      const domainListeners = listeners.get(domain);
      if (domainListeners) {
        domainListeners.forEach(callback => callback());
      }
      
      // If 'all', notify all domain listeners
      if (domain === 'all') {
        listeners.forEach((callbacks) => {
          callbacks.forEach(callback => callback());
        });
      }
    },
    
    subscribe: (domain: DataDomain, callback: () => void) => {
      if (!listeners.has(domain)) {
        listeners.set(domain, new Set());
      }
      listeners.get(domain)!.add(callback);
      
      return () => {
        listeners.get(domain)?.delete(callback);
      };
    },
  };
});

// Hook to trigger data refresh
export function useDataRefreshTrigger() {
  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);
  
  return {
    refreshPersonalItems: useCallback((source?: string) => triggerRefresh('personal_items', source), [triggerRefresh]),
    refreshPersonalGoals: useCallback((source?: string) => triggerRefresh('personal_goals', source), [triggerRefresh]),
    refreshPersonalHabits: useCallback((source?: string) => triggerRefresh('personal_habits', source), [triggerRefresh]),
    refreshTasks: useCallback((source?: string) => triggerRefresh('tasks', source), [triggerRefresh]),
    refreshWidgets: useCallback((source?: string) => triggerRefresh('widgets', source), [triggerRefresh]),
    refreshAll: useCallback((source?: string) => triggerRefresh('all', source), [triggerRefresh]),
  };
}

// Hook to subscribe to data refresh events
export function useDataRefreshListener(
  domains: DataDomain | DataDomain[],
  callback: () => void,
  deps: React.DependencyList = []
) {
  const subscribe = useDataRefreshStore((state) => state.subscribe);
  
  useEffect(() => {
    const domainList = Array.isArray(domains) ? domains : [domains];
    const unsubscribes = domainList.map(domain => subscribe(domain, callback));
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [subscribe, ...deps]);
}
