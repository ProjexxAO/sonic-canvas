// Shared Widget Data Store - Unified data synchronization across all widgets
// All widgets subscribe to the same data source, ensuring real-time consistency

import { create } from 'zustand';
import { useEffect, useCallback, useMemo } from 'react';
import { usePersonalHub, PersonalItem, PersonalGoal, PersonalHabit } from './usePersonalHub';
import { useBanking, BankAccount, BankTransaction } from './useBanking';
import { useDataRefreshStore } from './useDataRefresh';

// Centralized data state shared across ALL widgets
interface SharedWidgetDataState {
  // Core data
  tasks: PersonalItem[];
  goals: PersonalGoal[];
  habits: PersonalHabit[];
  accounts: BankAccount[];
  transactions: BankTransaction[];
  
  // Computed metrics
  metrics: {
    activeTasks: number;
    completedTasks: number;
    overdueTasks: number;
    highPriorityTasks: number;
    activeGoals: number;
    avgGoalProgress: number;
    habitStreak: number;
    habitsCompletedToday: number;
    totalBalance: number;
    recentSpending: number;
  };
  
  // State management
  lastUpdated: number;
  isLoading: boolean;
  
  // Actions
  setData: (data: Partial<Omit<SharedWidgetDataState, 'metrics' | 'setData' | 'broadcastChange'>>) => void;
  broadcastChange: (domain: string, source: string) => void;
}

// Calculate metrics from raw data
function calculateMetrics(state: Pick<SharedWidgetDataState, 'tasks' | 'goals' | 'habits' | 'accounts' | 'transactions'>): SharedWidgetDataState['metrics'] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const activeTasks = state.tasks.filter(t => t.status === 'active').length;
  const completedTasks = state.tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = state.tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false;
    return new Date(t.due_date) < now;
  }).length;
  const highPriorityTasks = state.tasks.filter(t => 
    t.status === 'active' && (t.priority === 'high' || t.priority === 'urgent')
  ).length;
  
  const activeGoals = state.goals.filter(g => g.status === 'active');
  const avgGoalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => 
        sum + (g.target_value ? (g.current_value / g.target_value) * 100 : 0), 0) / activeGoals.length)
    : 0;
  
  const habitStreak = state.habits.length > 0 
    ? Math.max(...state.habits.map(h => h.current_streak || 0)) 
    : 0;
  const habitsCompletedToday = state.habits.filter(h => 
    h.last_completed_at?.split('T')[0] === today
  ).length;
  
  const totalBalance = state.accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const recentSpending = state.transactions
    .filter(t => t.amount < 0)
    .slice(0, 30)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  return {
    activeTasks,
    completedTasks,
    overdueTasks,
    highPriorityTasks,
    activeGoals: activeGoals.length,
    avgGoalProgress,
    habitStreak,
    habitsCompletedToday,
    totalBalance,
    recentSpending,
  };
}

// Global store for shared widget data
export const useSharedWidgetDataStore = create<SharedWidgetDataState>((set, get) => ({
  tasks: [],
  goals: [],
  habits: [],
  accounts: [],
  transactions: [],
  metrics: {
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    highPriorityTasks: 0,
    activeGoals: 0,
    avgGoalProgress: 0,
    habitStreak: 0,
    habitsCompletedToday: 0,
    totalBalance: 0,
    recentSpending: 0,
  },
  lastUpdated: 0,
  isLoading: true,
  
  setData: (data) => {
    set(state => {
      const newState = { ...state, ...data, lastUpdated: Date.now() };
      // Recalculate metrics whenever data changes
      newState.metrics = calculateMetrics(newState);
      return newState;
    });
  },
  
  broadcastChange: (domain: string, source: string) => {
    console.log(`[SharedWidgetData] Broadcasting change: ${domain} from ${source}`);
    // This triggers the refresh store which all widgets listen to
    useDataRefreshStore.getState().triggerRefresh(domain as any, source);
  },
}));

// Hook to connect data sources to the shared store
export function useSharedWidgetDataProvider() {
  const { 
    items, goals, habits, 
    isLoading: isPersonalLoading, 
    refetch: refetchPersonal,
    createItem,
    updateItem,
    completeItem,
    completeHabit,
  } = usePersonalHub();
  const { accounts, transactions, isLoading: isBankingLoading, refreshAll: refreshBanking } = useBanking();
  const setData = useSharedWidgetDataStore(state => state.setData);
  
  // Sync personal hub data to shared store
  useEffect(() => {
    setData({
      tasks: items,
      goals,
      habits,
      isLoading: isPersonalLoading || isBankingLoading,
    });
  }, [items, goals, habits, isPersonalLoading, isBankingLoading, setData]);
  
  // Sync banking data to shared store
  useEffect(() => {
    setData({
      accounts,
      transactions,
    });
  }, [accounts, transactions, setData]);
  
  // Listen for refresh events and refetch data
  useEffect(() => {
    const unsubscribe = useDataRefreshStore.getState().subscribe('all', () => {
      refetchPersonal();
      refreshBanking();
    });
    return unsubscribe;
  }, [refetchPersonal, refreshBanking]);
  
  return {
    refetchAll: useCallback(() => {
      refetchPersonal();
      refreshBanking();
    }, [refetchPersonal, refreshBanking]),
    // Expose mutation functions
    createItem,
    updateItem,
    completeItem,
    completeHabit,
  };
}

// Hook for widgets to consume shared data
export function useSharedWidgetData(dataSources?: string[]) {
  const store = useSharedWidgetDataStore();
  const broadcastChange = store.broadcastChange;
  
  // Build context based on requested data sources
  const context = useMemo(() => {
    const ctx: Record<string, any> = {};
    const sources = dataSources || [];
    
    // Core productivity
    if (sources.includes('tasks') || sources.length === 0) {
      const activeTasks = store.tasks.filter(t => t.status === 'active');
      ctx.tasks = {
        items: activeTasks.slice(0, 10),
        all: store.tasks,
        total: store.tasks.length,
        active: activeTasks.length,
        completed: store.metrics.completedTasks,
        overdue: store.metrics.overdueTasks,
        highPriority: store.metrics.highPriorityTasks,
        highPriorityItems: activeTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').slice(0, 5),
      };
    }
    
    if (sources.includes('goals') || sources.length === 0) {
      const activeGoals = store.goals.filter(g => g.status === 'active');
      ctx.goals = {
        items: activeGoals.slice(0, 5),
        all: store.goals,
        total: store.goals.length,
        active: activeGoals.length,
        avgProgress: store.metrics.avgGoalProgress,
      };
    }
    
    if (sources.includes('habits') || sources.length === 0) {
      ctx.habits = {
        items: store.habits.slice(0, 5),
        all: store.habits,
        total: store.habits.length,
        completedToday: store.metrics.habitsCompletedToday,
        longestStreak: store.metrics.habitStreak,
      };
    }
    
    // Finance
    if (sources.some(s => ['finance', 'banking', 'expenses', 'investments'].includes(s))) {
      ctx.finance = {
        totalBalance: store.metrics.totalBalance,
        accounts: store.accounts,
        transactions: store.transactions.slice(0, 10),
        recentSpending: store.metrics.recentSpending,
        transactionCount: store.transactions.length,
      };
    }
    
    // Always include summary
    ctx.summary = {
      ...store.metrics,
      lastUpdated: store.lastUpdated,
    };
    
    return ctx;
  }, [store, dataSources]);
  
  // Action to notify other widgets of changes
  const notifyChange = useCallback((domain: string, source?: string) => {
    broadcastChange(domain, source || 'widget');
  }, [broadcastChange]);
  
  return {
    // Raw data access
    tasks: store.tasks,
    goals: store.goals,
    habits: store.habits,
    accounts: store.accounts,
    transactions: store.transactions,
    
    // Computed context for AI/display
    context,
    
    // Metrics
    metrics: store.metrics,
    
    // State
    isLoading: store.isLoading,
    lastUpdated: store.lastUpdated,
    
    // Actions
    notifyChange,
  };
}

// Export for direct store access when needed
export { calculateMetrics };
