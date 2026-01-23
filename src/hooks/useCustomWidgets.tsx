import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type WidgetType = 
  | 'data-display'    // Charts, metrics, lists
  | 'ai-assistant'    // Mini-agents for specific tasks
  | 'automation'      // Action triggers
  | 'hybrid';         // Combination

export type DataSource = 
  // Core productivity
  | 'tasks'
  | 'goals'
  | 'habits'
  | 'calendar'
  | 'email'
  | 'documents'
  | 'notes'
  // Finance & commerce
  | 'finance'
  | 'banking'
  | 'investments'
  | 'shopping'
  | 'subscriptions'
  | 'expenses'
  // Health & wellness
  | 'health'
  | 'fitness'
  | 'nutrition'
  | 'sleep'
  | 'meditation'
  | 'mental-health'
  // Social & relationships
  | 'contacts'
  | 'relationships'
  | 'social-media'
  | 'messages'
  // Entertainment & leisure
  | 'entertainment'
  | 'music'
  | 'movies'
  | 'books'
  | 'podcasts'
  | 'gaming'
  // Travel & transportation
  | 'travel'
  | 'flights'
  | 'hotels'
  | 'transportation'
  | 'maps'
  // Home & lifestyle
  | 'home'
  | 'smart-home'
  | 'groceries'
  | 'recipes'
  | 'pets'
  | 'plants'
  // Learning & development
  | 'learning'
  | 'courses'
  | 'skills'
  | 'languages'
  | 'certifications'
  // Work & career
  | 'work'
  | 'meetings'
  | 'projects'
  | 'clients'
  | 'networking'
  // Media & files
  | 'photos'
  | 'videos'
  | 'files'
  | 'cloud-storage'
  // External integrations
  | 'custom-api'
  | 'webhooks'
  | 'iot-devices'
  | 'external-services';

export interface WidgetConfig {
  displayType?: 'chart' | 'list' | 'metric' | 'card' | 'timeline' | 'kanban';
  chartType?: 'bar' | 'line' | 'pie' | 'area' | 'radial';
  refreshInterval?: number;
  filters?: Record<string, any>;
  aggregation?: 'sum' | 'count' | 'average' | 'min' | 'max';
  groupBy?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AICapabilities {
  enabled: boolean;
  model?: string;
  systemPrompt?: string;
  capabilities?: string[];
  autoRefresh?: boolean;
  agents?: string[];
}

export interface WidgetLayout {
  colSpan: number;
  rowSpan?: number;
}

export interface WidgetStyle {
  icon?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  accentColor?: string;
}

export interface CustomWidget {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  widget_type: WidgetType;
  config: WidgetConfig;
  data_sources: DataSource[];
  ai_capabilities: AICapabilities;
  layout: WidgetLayout;
  style: WidgetStyle;
  is_active: boolean;
  created_by_atlas: boolean;
  generation_prompt?: string;
  agent_chain?: string[];
  version: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWidgetRequest {
  name: string;
  description?: string;
  widget_type: WidgetType;
  config: WidgetConfig;
  data_sources: DataSource[];
  ai_capabilities?: AICapabilities;
  layout?: WidgetLayout;
  style?: WidgetStyle;
  generation_prompt?: string;
  agent_chain?: string[];
}

// Helper to parse DB row to CustomWidget
function parseWidget(row: any): CustomWidget {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    widget_type: row.widget_type as WidgetType,
    config: (row.config || {}) as WidgetConfig,
    data_sources: (row.data_sources || []) as DataSource[],
    ai_capabilities: (row.ai_capabilities || { enabled: false }) as AICapabilities,
    layout: (row.layout || { colSpan: 2 }) as WidgetLayout,
    style: (row.style || {}) as WidgetStyle,
    is_active: row.is_active ?? true,
    created_by_atlas: row.created_by_atlas ?? true,
    generation_prompt: row.generation_prompt,
    agent_chain: row.agent_chain,
    version: row.version ?? 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useCustomWidgets() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<CustomWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all custom widgets
  const fetchWidgets = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('custom_widgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedWidgets = (data || []).map(parseWidget);
      setWidgets(typedWidgets);
    } catch (error) {
      console.error('Error fetching custom widgets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Create a new custom widget
  const createWidget = useCallback(async (request: CreateWidgetRequest): Promise<CustomWidget | null> => {
    if (!user?.id) return null;
    
    setIsCreating(true);
    try {
      const { data, error } = await (supabase as any)
        .from('custom_widgets')
        .insert({
          user_id: user.id,
          name: request.name,
          description: request.description,
          widget_type: request.widget_type,
          config: request.config,
          data_sources: request.data_sources,
          ai_capabilities: request.ai_capabilities || { enabled: false },
          layout: request.layout || { colSpan: 2 },
          style: request.style || {},
          generation_prompt: request.generation_prompt,
          agent_chain: request.agent_chain,
          created_by_atlas: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      const newWidget = parseWidget(data);
      setWidgets(prev => [newWidget, ...prev]);
      toast.success(`Widget "${request.name}" created!`);
      return newWidget;
    } catch (error) {
      console.error('Error creating custom widget:', error);
      toast.error('Failed to create widget');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user?.id]);

  // Update a widget
  const updateWidget = useCallback(async (
    widgetId: string, 
    updates: Partial<CreateWidgetRequest>
  ): Promise<boolean> => {
    try {
      const { error } = await (supabase as any)
        .from('custom_widgets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', widgetId);

      if (error) throw error;
      
      setWidgets(prev => prev.map(w => 
        w.id === widgetId ? { ...w, ...updates, updated_at: new Date().toISOString() } : w
      ));
      toast.success('Widget updated');
      return true;
    } catch (error) {
      console.error('Error updating widget:', error);
      toast.error('Failed to update widget');
      return false;
    }
  }, []);

  // Delete a widget
  const deleteWidget = useCallback(async (widgetId: string): Promise<boolean> => {
    try {
      const { error } = await (supabase as any)
        .from('custom_widgets')
        .update({ is_active: false })
        .eq('id', widgetId);

      if (error) throw error;
      
      setWidgets(prev => prev.filter(w => w.id !== widgetId));
      toast.success('Widget removed');
      return true;
    } catch (error) {
      console.error('Error deleting widget:', error);
      toast.error('Failed to remove widget');
      return false;
    }
  }, []);

  // Load widgets on mount
  useEffect(() => {
    fetchWidgets();
  }, [fetchWidgets]);

  return {
    widgets,
    isLoading,
    isCreating,
    createWidget,
    updateWidget,
    deleteWidget,
    refetch: fetchWidgets,
  };
}
