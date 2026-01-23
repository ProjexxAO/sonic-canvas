// Data Refresh Event System - Enables cross-component data synchronization
// When Atlas or widgets modify data, this triggers refreshes across the app
// ALL widgets subscribe to these events to stay in sync

import { useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';

type DataDomain = 'personal_items' | 'personal_goals' | 'personal_habits' | 'tasks' | 'widgets' | 'finance' | 'calendar' | 'all';

interface RefreshEvent {
  domain: DataDomain;
  timestamp: number;
  source?: string;
  payload?: any; // Optional data payload for immediate updates
}

interface DataRefreshStore {
  lastRefresh: Record<DataDomain, number>;
  lastEvent: RefreshEvent | null;
  eventHistory: RefreshEvent[];
  triggerRefresh: (domain: DataDomain, source?: string, payload?: any) => void;
  subscribe: (domain: DataDomain, callback: (event?: RefreshEvent) => void) => () => void;
  getLastEvent: () => RefreshEvent | null;
}

// Global store for data refresh events - single source of truth
export const useDataRefreshStore = create<DataRefreshStore>((set, get) => {
  const listeners: Map<DataDomain, Set<(event?: RefreshEvent) => void>> = new Map();

  return {
    lastRefresh: {
      personal_items: 0,
      personal_goals: 0,
      personal_habits: 0,
      tasks: 0,
      widgets: 0,
      finance: 0,
      calendar: 0,
      all: 0,
    },
    lastEvent: null,
    eventHistory: [],
    
    triggerRefresh: (domain: DataDomain, source?: string, payload?: any) => {
      const timestamp = Date.now();
      const event: RefreshEvent = { domain, timestamp, source, payload };
      
      console.log(`[DataRefresh] Broadcasting: ${domain} from ${source || 'unknown'}`, payload ? '(with payload)' : '');
      
      set((state) => ({
        lastRefresh: {
          ...state.lastRefresh,
          [domain]: timestamp,
          ...(domain === 'all' ? {
            personal_items: timestamp,
            personal_goals: timestamp,
            personal_habits: timestamp,
            tasks: timestamp,
            widgets: timestamp,
            finance: timestamp,
            calendar: timestamp,
          } : {}),
        },
        lastEvent: event,
        eventHistory: [...state.eventHistory.slice(-20), event], // Keep last 20 events
      }));
      
      // Notify domain-specific listeners
      const domainListeners = listeners.get(domain);
      if (domainListeners) {
        domainListeners.forEach(callback => callback(event));
      }
      
      // If 'all', notify all domain listeners
      if (domain === 'all') {
        listeners.forEach((callbacks, listenerDomain) => {
          if (listenerDomain !== 'all') {
            callbacks.forEach(callback => callback(event));
          }
        });
        // Also notify 'all' listeners
        const allListeners = listeners.get('all');
        if (allListeners) {
          allListeners.forEach(callback => callback(event));
        }
      }
    },
    
    subscribe: (domain: DataDomain, callback: (event?: RefreshEvent) => void) => {
      if (!listeners.has(domain)) {
        listeners.set(domain, new Set());
      }
      listeners.get(domain)!.add(callback);
      
      console.log(`[DataRefresh] Subscribed to: ${domain}, total listeners: ${listeners.get(domain)!.size}`);
      
      return () => {
        listeners.get(domain)?.delete(callback);
      };
    },
    
    getLastEvent: () => get().lastEvent,
  };
});

// Hook to trigger data refresh with enhanced payload support
export function useDataRefreshTrigger() {
  const triggerRefresh = useDataRefreshStore((state) => state.triggerRefresh);
  
  return {
    refreshPersonalItems: useCallback((source?: string, payload?: any) => triggerRefresh('personal_items', source, payload), [triggerRefresh]),
    refreshPersonalGoals: useCallback((source?: string, payload?: any) => triggerRefresh('personal_goals', source, payload), [triggerRefresh]),
    refreshPersonalHabits: useCallback((source?: string, payload?: any) => triggerRefresh('personal_habits', source, payload), [triggerRefresh]),
    refreshTasks: useCallback((source?: string, payload?: any) => triggerRefresh('tasks', source, payload), [triggerRefresh]),
    refreshWidgets: useCallback((source?: string, payload?: any) => triggerRefresh('widgets', source, payload), [triggerRefresh]),
    refreshFinance: useCallback((source?: string, payload?: any) => triggerRefresh('finance', source, payload), [triggerRefresh]),
    refreshCalendar: useCallback((source?: string, payload?: any) => triggerRefresh('calendar', source, payload), [triggerRefresh]),
    refreshAll: useCallback((source?: string, payload?: any) => triggerRefresh('all', source, payload), [triggerRefresh]),
  };
}

// Hook to subscribe to data refresh events with stable callback
export function useDataRefreshListener(
  domains: DataDomain | DataDomain[],
  callback: (event?: RefreshEvent) => void,
  deps: React.DependencyList = []
) {
  const subscribe = useDataRefreshStore((state) => state.subscribe);
  const callbackRef = useRef(callback);
  
  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    const domainList = Array.isArray(domains) ? domains : [domains];
    const stableCallback = (event?: RefreshEvent) => callbackRef.current(event);
    const unsubscribes = domainList.map(domain => subscribe(domain, stableCallback));
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [subscribe, JSON.stringify(Array.isArray(domains) ? domains : [domains]), ...deps]);
}

// Hook to get last refresh timestamp for a domain
export function useLastRefreshTime(domain: DataDomain) {
  return useDataRefreshStore((state) => state.lastRefresh[domain]);
}
