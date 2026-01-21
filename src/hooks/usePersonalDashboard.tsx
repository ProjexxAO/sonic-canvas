import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type WidgetType = 
  | 'bank-balance' 
  | 'email-inbox' 
  | 'calendar-upcoming' 
  | 'cloud-files'
  | 'spending-trends'
  | 'productivity-stats'
  | 'habit-streaks'
  | 'goal-progress'
  | 'quick-add-task'
  | 'quick-email'
  | 'quick-event'
  | 'quick-upload'
  | 'recent-activity'
  | 'weather'
  | 'tasks-today'
  | 'notes-recent'
  | 'hub-access';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: number;
  column: number;
  isVisible: boolean;
  config?: Record<string, any>;
}

export type LayoutPreset = 'default' | 'productivity' | 'finance' | 'minimal' | 'atlas-suggested';

export interface DashboardLayout {
  id: string;
  name: string;
  preset: LayoutPreset;
  columns: 1 | 2 | 3;
  widgets: DashboardWidget[];
}

export interface AtlasArrangementFilter {
  priority: 'data' | 'time' | 'category' | 'smart';
  showConnectedOnly: boolean;
  focusArea?: 'productivity' | 'finance' | 'health' | 'all';
}

// Widget catalog with categories
export const WIDGET_CATALOG: {
  category: string;
  widgets: { type: WidgetType; title: string; description: string; defaultSize: WidgetSize; icon: string }[];
}[] = [
  {
    category: 'Data Widgets',
    widgets: [
      { type: 'bank-balance', title: 'Bank Balance', description: 'View connected account balances', defaultSize: 'medium', icon: 'credit-card' },
      { type: 'email-inbox', title: 'Email Inbox', description: 'Recent emails from connected accounts', defaultSize: 'large', icon: 'mail' },
      { type: 'calendar-upcoming', title: 'Upcoming Events', description: 'Calendar events for the week', defaultSize: 'medium', icon: 'calendar' },
      { type: 'cloud-files', title: 'Cloud Files', description: 'Recent files from cloud storage', defaultSize: 'medium', icon: 'cloud' },
      { type: 'tasks-today', title: "Today's Tasks", description: 'Tasks due today', defaultSize: 'medium', icon: 'check-square' },
      { type: 'notes-recent', title: 'Recent Notes', description: 'Your latest notes', defaultSize: 'small', icon: 'file-text' },
    ]
  },
  {
    category: 'Insight Widgets',
    widgets: [
      { type: 'spending-trends', title: 'Spending Trends', description: 'Visualize your spending patterns', defaultSize: 'large', icon: 'trending-up' },
      { type: 'productivity-stats', title: 'Productivity Stats', description: 'Task completion and focus time', defaultSize: 'medium', icon: 'bar-chart' },
      { type: 'habit-streaks', title: 'Habit Streaks', description: 'Track your daily habits', defaultSize: 'small', icon: 'flame' },
      { type: 'goal-progress', title: 'Goal Progress', description: 'Progress towards your goals', defaultSize: 'medium', icon: 'target' },
    ]
  },
  {
    category: 'Quick Actions',
    widgets: [
      { type: 'quick-add-task', title: 'Quick Add Task', description: 'Quickly add new tasks', defaultSize: 'small', icon: 'plus' },
      { type: 'quick-email', title: 'Compose Email', description: 'Draft and send emails', defaultSize: 'medium', icon: 'send' },
      { type: 'quick-event', title: 'Schedule Event', description: 'Create calendar events', defaultSize: 'small', icon: 'calendar-plus' },
      { type: 'quick-upload', title: 'Upload Files', description: 'Upload to cloud storage', defaultSize: 'small', icon: 'upload' },
    ]
  },
  {
    category: 'Other',
    widgets: [
      { type: 'recent-activity', title: 'Recent Activity', description: 'Activity across all services', defaultSize: 'large', icon: 'activity' },
      { type: 'weather', title: 'Weather', description: 'Current weather conditions', defaultSize: 'small', icon: 'cloud-sun' },
      { type: 'hub-access', title: 'Hub Access', description: 'Quick links to invited dashboards', defaultSize: 'medium', icon: 'external-link' },
    ]
  }
];

// Preset layouts
const PRESET_LAYOUTS: Record<LayoutPreset, Omit<DashboardLayout, 'id'>> = {
  default: {
    name: 'Default Dashboard',
    preset: 'default',
    columns: 2,
    widgets: [
      { id: 'w1', type: 'tasks-today', title: "Today's Tasks", size: 'medium', position: 0, column: 0, isVisible: true },
      { id: 'w2', type: 'calendar-upcoming', title: 'Upcoming Events', size: 'medium', position: 1, column: 1, isVisible: true },
      { id: 'w3', type: 'habit-streaks', title: 'Habit Streaks', size: 'small', position: 2, column: 0, isVisible: true },
      { id: 'w4', type: 'goal-progress', title: 'Goal Progress', size: 'medium', position: 3, column: 1, isVisible: true },
      { id: 'w5', type: 'recent-activity', title: 'Recent Activity', size: 'large', position: 4, column: 0, isVisible: true },
    ]
  },
  productivity: {
    name: 'Productivity Focus',
    preset: 'productivity',
    columns: 3,
    widgets: [
      { id: 'w1', type: 'tasks-today', title: "Today's Tasks", size: 'large', position: 0, column: 0, isVisible: true },
      { id: 'w2', type: 'productivity-stats', title: 'Productivity Stats', size: 'medium', position: 1, column: 1, isVisible: true },
      { id: 'w3', type: 'quick-add-task', title: 'Quick Add', size: 'small', position: 2, column: 2, isVisible: true },
      { id: 'w4', type: 'calendar-upcoming', title: 'Upcoming Events', size: 'medium', position: 3, column: 1, isVisible: true },
      { id: 'w5', type: 'habit-streaks', title: 'Habits', size: 'small', position: 4, column: 2, isVisible: true },
      { id: 'w6', type: 'goal-progress', title: 'Goals', size: 'medium', position: 5, column: 0, isVisible: true },
    ]
  },
  finance: {
    name: 'Finance Dashboard',
    preset: 'finance',
    columns: 2,
    widgets: [
      { id: 'w1', type: 'bank-balance', title: 'Account Balances', size: 'large', position: 0, column: 0, isVisible: true },
      { id: 'w2', type: 'spending-trends', title: 'Spending Trends', size: 'large', position: 1, column: 1, isVisible: true },
      { id: 'w3', type: 'recent-activity', title: 'Recent Transactions', size: 'medium', position: 2, column: 0, isVisible: true },
      { id: 'w4', type: 'goal-progress', title: 'Savings Goals', size: 'medium', position: 3, column: 1, isVisible: true },
    ]
  },
  minimal: {
    name: 'Minimal View',
    preset: 'minimal',
    columns: 1,
    widgets: [
      { id: 'w1', type: 'tasks-today', title: "Today's Focus", size: 'large', position: 0, column: 0, isVisible: true },
      { id: 'w2', type: 'habit-streaks', title: 'Habits', size: 'medium', position: 1, column: 0, isVisible: true },
    ]
  },
  'atlas-suggested': {
    name: 'Atlas Suggested',
    preset: 'atlas-suggested',
    columns: 2,
    widgets: [] // Will be populated dynamically
  }
};

export function usePersonalDashboard(userId: string | undefined) {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [atlasFilter, setAtlasFilter] = useState<AtlasArrangementFilter>({
    priority: 'smart',
    showConnectedOnly: false,
    focusArea: 'all'
  });

  // Load user's dashboard layout
  const loadLayout = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Try to get from localStorage first for faster load
      const cached = localStorage.getItem(`dashboard-layout-${userId}`);
      if (cached) {
        setLayout(JSON.parse(cached));
      } else {
        // Use default layout
        setLayout({
          id: 'default',
          ...PRESET_LAYOUTS.default
        });
      }
    } catch (error) {
      console.error('Error loading layout:', error);
      setLayout({ id: 'default', ...PRESET_LAYOUTS.default });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save layout
  const saveLayout = useCallback(async (newLayout: DashboardLayout) => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      setLayout(newLayout);
      localStorage.setItem(`dashboard-layout-${userId}`, JSON.stringify(newLayout));
      toast.success('Dashboard layout saved');
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setIsSaving(false);
    }
  }, [userId]);

  // Apply preset layout
  const applyPreset = useCallback((preset: LayoutPreset) => {
    const presetLayout = PRESET_LAYOUTS[preset];
    const newLayout: DashboardLayout = {
      id: preset,
      ...presetLayout,
      widgets: presetLayout.widgets.map(w => ({ ...w, id: `${w.type}-${Date.now()}-${Math.random()}` }))
    };
    saveLayout(newLayout);
  }, [saveLayout]);

  // Add widget
  const addWidget = useCallback((type: WidgetType) => {
    if (!layout) return;
    
    const catalogEntry = WIDGET_CATALOG.flatMap(c => c.widgets).find(w => w.type === type);
    if (!catalogEntry) return;

    const newWidget: DashboardWidget = {
      id: `${type}-${Date.now()}`,
      type,
      title: catalogEntry.title,
      size: catalogEntry.defaultSize,
      position: layout.widgets.length,
      column: layout.widgets.length % layout.columns,
      isVisible: true
    };

    saveLayout({
      ...layout,
      widgets: [...layout.widgets, newWidget]
    });
  }, [layout, saveLayout]);

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    if (!layout) return;
    
    saveLayout({
      ...layout,
      widgets: layout.widgets.filter(w => w.id !== widgetId)
    });
  }, [layout, saveLayout]);

  // Update widget
  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    if (!layout) return;
    
    saveLayout({
      ...layout,
      widgets: layout.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      )
    });
  }, [layout, saveLayout]);

  // Reorder widgets (for drag & drop)
  const reorderWidgets = useCallback((widgets: DashboardWidget[]) => {
    if (!layout) return;
    saveLayout({ ...layout, widgets });
  }, [layout, saveLayout]);

  // Set column count
  const setColumns = useCallback((columns: 1 | 2 | 3) => {
    if (!layout) return;
    saveLayout({ ...layout, columns });
  }, [layout, saveLayout]);

  // Atlas auto-arrange based on filters
  const atlasAutoArrange = useCallback(async (
    connectedServices: string[],
    userStats: { tasksToday: number; goalsActive: number; habitsActive: number; hasBanking: boolean }
  ) => {
    const widgets: DashboardWidget[] = [];
    let position = 0;

    // Smart arrangement based on connected services and user data
    if (atlasFilter.priority === 'smart' || atlasFilter.priority === 'time') {
      // Time-based: prioritize upcoming tasks and events
      widgets.push({
        id: `tasks-today-${Date.now()}`,
        type: 'tasks-today',
        title: "Today's Tasks",
        size: userStats.tasksToday > 5 ? 'large' : 'medium',
        position: position++,
        column: 0,
        isVisible: true
      });

      if (connectedServices.includes('calendar') || connectedServices.includes('gmail')) {
        widgets.push({
          id: `calendar-${Date.now()}`,
          type: 'calendar-upcoming',
          title: 'Upcoming Events',
          size: 'medium',
          position: position++,
          column: 1,
          isVisible: true
        });
      }
    }

    if (atlasFilter.priority === 'smart' || atlasFilter.priority === 'data') {
      // Data priority: show connected service data
      if (userStats.hasBanking || connectedServices.some(s => s.includes('bank'))) {
        widgets.push({
          id: `bank-${Date.now()}`,
          type: 'bank-balance',
          title: 'Account Balance',
          size: 'medium',
          position: position++,
          column: widgets.length % 2,
          isVisible: true
        });
      }

      if (connectedServices.includes('gmail') || connectedServices.includes('outlook')) {
        widgets.push({
          id: `email-${Date.now()}`,
          type: 'email-inbox',
          title: 'Email Inbox',
          size: 'medium',
          position: position++,
          column: widgets.length % 2,
          isVisible: true
        });
      }

      if (connectedServices.includes('gdrive') || connectedServices.includes('dropbox')) {
        widgets.push({
          id: `files-${Date.now()}`,
          type: 'cloud-files',
          title: 'Cloud Files',
          size: 'small',
          position: position++,
          column: widgets.length % 2,
          isVisible: true
        });
      }
    }

    // Always include habits and goals if user has them
    if (userStats.habitsActive > 0) {
      widgets.push({
        id: `habits-${Date.now()}`,
        type: 'habit-streaks',
        title: 'Habit Streaks',
        size: 'small',
        position: position++,
        column: widgets.length % 2,
        isVisible: true
      });
    }

    if (userStats.goalsActive > 0) {
      widgets.push({
        id: `goals-${Date.now()}`,
        type: 'goal-progress',
        title: 'Goal Progress',
        size: 'medium',
        position: position++,
        column: widgets.length % 2,
        isVisible: true
      });
    }

    // Add quick actions
    widgets.push({
      id: `quick-task-${Date.now()}`,
      type: 'quick-add-task',
      title: 'Quick Add',
      size: 'small',
      position: position++,
      column: widgets.length % 2,
      isVisible: true
    });

    // Recent activity at the bottom
    widgets.push({
      id: `activity-${Date.now()}`,
      type: 'recent-activity',
      title: 'Recent Activity',
      size: 'large',
      position: position++,
      column: 0,
      isVisible: true
    });

    const newLayout: DashboardLayout = {
      id: 'atlas-suggested',
      name: 'Atlas Suggested',
      preset: 'atlas-suggested',
      columns: 2,
      widgets
    };

    saveLayout(newLayout);
    toast.success('Atlas arranged your dashboard based on your data and preferences');
  }, [atlasFilter, saveLayout]);

  // Load on mount
  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  return {
    layout,
    isLoading,
    isSaving,
    atlasFilter,
    setAtlasFilter,
    presets: PRESET_LAYOUTS,
    catalog: WIDGET_CATALOG,
    saveLayout,
    applyPreset,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    setColumns,
    atlasAutoArrange,
    loadLayout
  };
}
