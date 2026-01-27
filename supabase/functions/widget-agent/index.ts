/**
 * Widget Agent Service
 * AI-powered widget generation and management for dashboards
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ServiceLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Type Definitions
// ============================================================================

interface WidgetConfig {
  id: string;
  type: 'chart' | 'metric' | 'list' | 'table' | 'status' | 'timeline' | 'custom';
  title: string;
  description?: string;
  data_source: DataSource;
  visualization: VisualizationConfig;
  refresh_interval: number;
  filters?: Record<string, unknown>;
  style?: StyleConfig;
}

interface DataSource {
  type: 'query' | 'api' | 'realtime' | 'computed';
  table?: string;
  query?: string;
  endpoint?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  group_by?: string[];
  time_range?: string;
}

interface VisualizationConfig {
  chart_type?: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter';
  x_axis?: string;
  y_axis?: string;
  color_scheme?: string[];
  show_legend?: boolean;
  show_labels?: boolean;
  animate?: boolean;
}

interface StyleConfig {
  background?: string;
  border_radius?: number;
  padding?: number;
  shadow?: boolean;
  gradient?: boolean;
}

interface WidgetData {
  widget_id: string;
  data: any;
  computed_at: string;
  expires_at: string;
}

interface WidgetRequest {
  action: 'generate' | 'get_data' | 'suggest' | 'validate' | 'optimize' | 'create_from_prompt';
  user_id: string;
  widget_config?: Partial<WidgetConfig>;
  widget_id?: string;
  prompt?: string;
  context?: Record<string, unknown>;
  dashboard_id?: string;
}

// ============================================================================
// Widget Operations
// ============================================================================

async function generateWidget(
  supabase: SupabaseClient,
  config: Partial<WidgetConfig>,
  logger: ServiceLogger
): Promise<WidgetConfig> {
  await logger.info('Generating widget configuration', { type: config.type });

  const widgetId = config.id ?? crypto.randomUUID();

  const defaultVisualization: VisualizationConfig = {
    chart_type: 'bar',
    show_legend: true,
    show_labels: true,
    animate: true,
    color_scheme: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'],
  };

  const defaultStyle: StyleConfig = {
    background: '#ffffff',
    border_radius: 12,
    padding: 16,
    shadow: true,
    gradient: false,
  };

  const widget: WidgetConfig = {
    id: widgetId,
    type: config.type ?? 'metric',
    title: config.title ?? 'New Widget',
    description: config.description,
    data_source: config.data_source ?? {
      type: 'query',
      table: 'sonic_agents',
      aggregation: 'count',
    },
    visualization: { ...defaultVisualization, ...config.visualization },
    refresh_interval: config.refresh_interval ?? 60,
    filters: config.filters,
    style: { ...defaultStyle, ...config.style },
  };

  await logger.info('Widget generated', { widget_id: widgetId });

  return widget;
}

async function getWidgetData(
  supabase: SupabaseClient,
  widgetConfig: WidgetConfig,
  userId: string,
  logger: ServiceLogger
): Promise<WidgetData> {
  await logger.info('Fetching widget data', { widget_id: widgetConfig.id, type: widgetConfig.type });

  let data: any;

  switch (widgetConfig.data_source.type) {
    case 'query':
      data = await executeQuery(supabase, widgetConfig.data_source, userId);
      break;

    case 'computed':
      data = await computeMetrics(supabase, widgetConfig.data_source, userId);
      break;

    case 'realtime':
      // For realtime, return current state
      data = await executeQuery(supabase, widgetConfig.data_source, userId);
      break;

    default:
      data = [];
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + widgetConfig.refresh_interval * 1000);

  return {
    widget_id: widgetConfig.id,
    data,
    computed_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
}

async function executeQuery(
  supabase: SupabaseClient,
  dataSource: DataSource,
  userId: string
): Promise<any> {
  if (!dataSource.table) {
    return [];
  }

  // Map table names to actual schema
  const tableMap: Record<string, string> = {
    'sonic_tasks': 'agent_task_queue',
  };
  const actualTable = tableMap[dataSource.table] ?? dataSource.table;

  let query = supabase.from(actualTable).select('*');

  // Apply user filter for user-scoped tables
  if (['sonic_agents', 'agent_task_queue', 'agent_memory'].includes(actualTable)) {
    query = query.eq('user_id', userId);
  }

  // Apply time range if specified
  if (dataSource.time_range) {
    const now = new Date();
    let startDate: Date;

    switch (dataSource.time_range) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    query = query.gte('created_at', startDate.toISOString());
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error('Query error:', error);
    return [];
  }

  // Apply aggregation if specified
  if (dataSource.aggregation && data) {
    return aggregateData(data, dataSource);
  }

  return data ?? [];
}

function aggregateData(data: any[], dataSource: DataSource): any {
  if (!dataSource.aggregation) return data;

  const groupBy = dataSource.group_by ?? [];

  if (groupBy.length === 0) {
    // Single aggregation
    switch (dataSource.aggregation) {
      case 'count':
        return { value: data.length };
      case 'sum':
        return { value: data.reduce((sum, item) => sum + (item.value ?? 0), 0) };
      case 'avg':
        return { value: data.length ? data.reduce((sum, item) => sum + (item.value ?? 0), 0) / data.length : 0 };
      case 'min':
        return { value: Math.min(...data.map(item => item.value ?? 0)) };
      case 'max':
        return { value: Math.max(...data.map(item => item.value ?? 0)) };
    }
  }

  // Grouped aggregation
  const groups: Record<string, any[]> = {};

  for (const item of data) {
    const key = groupBy.map(g => item[g] ?? 'unknown').join('|');
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return Object.entries(groups).map(([key, items]) => {
    const keyParts = key.split('|');
    const result: Record<string, any> = {};

    groupBy.forEach((g, i) => {
      result[g] = keyParts[i];
    });

    switch (dataSource.aggregation) {
      case 'count':
        result.value = items.length;
        break;
      case 'sum':
        result.value = items.reduce((sum, item) => sum + (item.value ?? 0), 0);
        break;
      case 'avg':
        result.value = items.length ? items.reduce((sum, item) => sum + (item.value ?? 0), 0) / items.length : 0;
        break;
    }

    return result;
  });
}

async function computeMetrics(
  supabase: SupabaseClient,
  dataSource: DataSource,
  userId: string
): Promise<any> {
  // Compute derived metrics
  const { data: agents } = await supabase
    .from('sonic_agents')
    .select('success_rate, learning_velocity, total_tasks_completed')
    .eq('user_id', userId);

  const { data: tasks } = await supabase
    .from('agent_task_queue')
    .select('status')
    .eq('user_id', userId);

  const completedTasks = tasks?.filter(t => t.status === 'completed').length ?? 0;
  const avgSuccessRate = agents?.length
    ? agents.reduce((sum, a) => sum + (a.success_rate ?? 0), 0) / agents.length
    : 0;

  return {
    total_agents: agents?.length ?? 0,
    total_tasks: tasks?.length ?? 0,
    completed_tasks: completedTasks,
    completion_rate: tasks?.length ? (completedTasks / tasks.length) * 100 : 0,
    avg_success_rate: avgSuccessRate * 100,
    productivity_score: Math.round(avgSuccessRate * 50 + (completedTasks / Math.max(tasks?.length ?? 1, 1)) * 50),
  };
}

async function suggestWidgets(
  supabase: SupabaseClient,
  userId: string,
  context: Record<string, unknown>,
  logger: ServiceLogger
): Promise<WidgetConfig[]> {
  await logger.info('Suggesting widgets based on context');

  // Get user's data to understand what widgets would be useful
  const { data: agents } = await supabase
    .from('sonic_agents')
    .select('sector, status')
    .eq('user_id', userId);

  const suggestions: WidgetConfig[] = [];

  // Always suggest a status overview
  suggestions.push(await generateWidget(supabase, {
    type: 'metric',
    title: 'Agent Status Overview',
    data_source: {
      type: 'query',
      table: 'sonic_agents',
      aggregation: 'count',
      group_by: ['status'],
    },
    visualization: {
      chart_type: 'donut',
    },
  }, logger));

  // Suggest sector breakdown if multiple sectors
  const sectors = [...new Set(agents?.map(a => a.sector).filter(Boolean))];
  if (sectors.length > 1) {
    suggestions.push(await generateWidget(supabase, {
      type: 'chart',
      title: 'Agents by Sector',
      data_source: {
        type: 'query',
        table: 'sonic_agents',
        aggregation: 'count',
        group_by: ['sector'],
      },
      visualization: {
        chart_type: 'bar',
      },
    }, logger));
  }

  // Task completion trend
  suggestions.push(await generateWidget(supabase, {
    type: 'chart',
    title: 'Task Completion Trend',
    data_source: {
      type: 'query',
      table: 'agent_task_queue',
      aggregation: 'count',
      group_by: ['status'],
      time_range: '7d',
    },
    visualization: {
      chart_type: 'area',
    },
  }, logger));

  // Performance metrics
  suggestions.push(await generateWidget(supabase, {
    type: 'metric',
    title: 'Performance Metrics',
    data_source: {
      type: 'computed',
    },
  }, logger));

  return suggestions;
}

async function createFromPrompt(
  supabase: SupabaseClient,
  prompt: string,
  userId: string,
  logger: ServiceLogger
): Promise<WidgetConfig> {
  await logger.info('Creating widget from prompt', { prompt });

  const apiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!apiKey) {
    // Fallback to rule-based generation
    return parsePromptToWidget(prompt, logger);
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a widget configuration generator. Given a user prompt, generate a JSON widget configuration.
Available widget types: chart, metric, list, table, status, timeline
Available chart types: line, bar, pie, donut, area, scatter
Available data tables: sonic_agents, agent_task_queue, agent_memory, agent_learning_events
Available aggregations: count, sum, avg, min, max

Respond with only valid JSON matching this structure:
{
  "type": "chart|metric|list|table|status|timeline",
  "title": "string",
  "data_source": { "type": "query", "table": "string", "aggregation": "string", "group_by": ["string"] },
  "visualization": { "chart_type": "string" }
}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const config = JSON.parse(jsonMatch[0]);
        return await generateWidget(supabase, config, logger);
      }
    }
  } catch (error) {
    await logger.warn('AI widget generation failed, using fallback', { error: String(error) });
  }

  return parsePromptToWidget(prompt, logger);
}

async function parsePromptToWidget(prompt: string, logger: ServiceLogger): Promise<WidgetConfig> {
  const promptLower = prompt.toLowerCase();

  let type: WidgetConfig['type'] = 'metric';
  let chartType: VisualizationConfig['chart_type'] = 'bar';
  let table = 'sonic_agents';
  let aggregation: DataSource['aggregation'] = 'count';
  let groupBy: string[] = [];

  // Detect widget type
  if (promptLower.includes('chart') || promptLower.includes('graph') || promptLower.includes('trend')) {
    type = 'chart';
  } else if (promptLower.includes('list')) {
    type = 'list';
  } else if (promptLower.includes('table')) {
    type = 'table';
  } else if (promptLower.includes('status')) {
    type = 'status';
  } else if (promptLower.includes('timeline')) {
    type = 'timeline';
  }

  // Detect chart type
  if (promptLower.includes('pie')) chartType = 'pie';
  else if (promptLower.includes('donut')) chartType = 'donut';
  else if (promptLower.includes('line')) chartType = 'line';
  else if (promptLower.includes('area')) chartType = 'area';

  // Detect data source
  if (promptLower.includes('task')) table = 'agent_task_queue';
  else if (promptLower.includes('memory')) table = 'agent_memory';
  else if (promptLower.includes('event') || promptLower.includes('learning')) table = 'agent_learning_events';

  // Detect grouping
  if (promptLower.includes('by sector')) groupBy = ['sector'];
  else if (promptLower.includes('by status')) groupBy = ['status'];
  else if (promptLower.includes('by type')) groupBy = ['task_type'];

  // Detect aggregation
  if (promptLower.includes('average') || promptLower.includes('avg')) aggregation = 'avg';
  else if (promptLower.includes('sum') || promptLower.includes('total')) aggregation = 'sum';

  return {
    id: crypto.randomUUID(),
    type,
    title: prompt.substring(0, 50),
    data_source: {
      type: 'query',
      table,
      aggregation,
      group_by: groupBy.length > 0 ? groupBy : undefined,
    },
    visualization: {
      chart_type: chartType,
      show_legend: true,
      show_labels: true,
      animate: true,
    },
    refresh_interval: 60,
    style: {
      background: '#ffffff',
      border_radius: 12,
      padding: 16,
      shadow: true,
    },
  };
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const request: WidgetRequest = await req.json();

    if (!request.user_id) {
      throw new Error('user_id is required');
    }

    const logger = new ServiceLogger(
      supabase,
      requestId,
      request.user_id,
      null,
      'widget-agent'
    );

    await logger.info(`Processing ${request.action} request`);

    let result: any;

    switch (request.action) {
      case 'generate':
        if (!request.widget_config) throw new Error('widget_config is required');
        const widget = await generateWidget(supabase, request.widget_config, logger);
        result = { success: true, widget };
        break;

      case 'get_data':
        if (!request.widget_config) throw new Error('widget_config is required');
        const fullConfig = await generateWidget(supabase, request.widget_config, logger);
        const data = await getWidgetData(supabase, fullConfig, request.user_id, logger);
        result = { success: true, ...data };
        break;

      case 'suggest':
        const suggestions = await suggestWidgets(supabase, request.user_id, request.context ?? {}, logger);
        result = { success: true, suggestions };
        break;

      case 'create_from_prompt':
        if (!request.prompt) throw new Error('prompt is required');
        const promptWidget = await createFromPrompt(supabase, request.prompt, request.user_id, logger);
        result = { success: true, widget: promptWidget };
        break;

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    const duration = Date.now() - startTime;
    await logger.info('Widget agent operation completed', { duration_ms: duration });

    return new Response(JSON.stringify({
      ...result,
      metadata: {
        request_id: requestId,
        service: 'widget-agent',
        action: request.action,
        processing_time_ms: duration,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Widget Agent] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'WIDGET_AGENT_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: requestId,
      },
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
