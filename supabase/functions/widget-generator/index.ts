import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateWidgetRequest {
  prompt: string;
  userId: string;
  availableDataSources: string[];
  existingWidgets?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId, availableDataSources, existingWidgets } = await req.json() as GenerateWidgetRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Atlas, an AI orchestrator that helps users create custom dashboard widgets. 
You analyze user requests and generate widget configurations that can display data, provide AI assistance, or automate actions.

Available data sources the user has connected: ${availableDataSources.join(', ') || 'none yet'}
${existingWidgets?.length ? `User's existing widgets: ${existingWidgets.join(', ')}` : ''}

Your task is to:
1. Understand what the user wants to track, visualize, or automate
2. Determine the best widget type and configuration
3. Identify which data sources to connect
4. Suggest AI capabilities if the widget would benefit from them
5. Recommend agents from the orchestration system if needed

Be creative but practical. Focus on actionable, useful widgets.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_widget",
              description: "Create a custom dashboard widget based on user requirements",
              parameters: {
                type: "object",
                properties: {
                  name: { 
                    type: "string", 
                    description: "Short, descriptive widget name (2-4 words)" 
                  },
                  description: { 
                    type: "string", 
                    description: "Brief description of what the widget does" 
                  },
                  widget_type: { 
                    type: "string", 
                    enum: ["data-display", "ai-assistant", "automation", "hybrid"],
                    description: "The primary type of widget"
                  },
                  display_type: {
                    type: "string",
                    enum: ["chart", "list", "metric", "card", "timeline", "kanban"],
                    description: "How to display the data"
                  },
                  chart_type: {
                    type: "string",
                    enum: ["bar", "line", "pie", "area", "radial"],
                    description: "Type of chart if display_type is chart"
                  },
                  data_sources: {
                    type: "array",
                    items: { 
                      type: "string",
                      enum: ["tasks", "goals", "habits", "finance", "calendar", "email", "documents", "photos", "custom-api"]
                    },
                    description: "Data sources to connect"
                  },
                  ai_enabled: {
                    type: "boolean",
                    description: "Whether to enable AI capabilities"
                  },
                  ai_capabilities: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of AI capabilities (e.g., 'summarize', 'predict', 'suggest', 'analyze')"
                  },
                  ai_prompt: {
                    type: "string",
                    description: "System prompt for AI-powered widgets"
                  },
                  agents: {
                    type: "array",
                    items: { type: "string" },
                    description: "Agent types to orchestrate (e.g., 'financial-analyst', 'task-optimizer', 'wellness-coach')"
                  },
                  aggregation: {
                    type: "string",
                    enum: ["sum", "count", "average", "min", "max"],
                    description: "How to aggregate data"
                  },
                  col_span: {
                    type: "number",
                    description: "Widget width (1-6 columns)"
                  },
                  icon: {
                    type: "string",
                    description: "Lucide icon name for the widget"
                  },
                  color: {
                    type: "string",
                    description: "Accent color (e.g., 'blue', 'green', 'purple')"
                  },
                  refresh_interval: {
                    type: "number",
                    description: "Auto-refresh interval in seconds (0 for manual)"
                  },
                  explanation: {
                    type: "string",
                    description: "Brief explanation of why this widget design was chosen"
                  }
                },
                required: ["name", "description", "widget_type", "data_sources", "col_span", "explanation"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_widget" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "create_widget") {
      throw new Error("Failed to generate widget configuration");
    }

    const widgetConfig = JSON.parse(toolCall.function.arguments);

    // Transform to our widget schema
    const widget = {
      name: widgetConfig.name,
      description: widgetConfig.description,
      widget_type: widgetConfig.widget_type,
      config: {
        displayType: widgetConfig.display_type || 'card',
        chartType: widgetConfig.chart_type,
        aggregation: widgetConfig.aggregation,
        refreshInterval: widgetConfig.refresh_interval || 0,
      },
      data_sources: widgetConfig.data_sources,
      ai_capabilities: {
        enabled: widgetConfig.ai_enabled || false,
        systemPrompt: widgetConfig.ai_prompt,
        capabilities: widgetConfig.ai_capabilities || [],
        agents: widgetConfig.agents || [],
      },
      layout: {
        colSpan: Math.min(Math.max(widgetConfig.col_span || 2, 1), 6),
      },
      style: {
        icon: widgetConfig.icon,
        color: widgetConfig.color,
      },
      explanation: widgetConfig.explanation,
      agent_chain: widgetConfig.agents || [],
    };

    return new Response(JSON.stringify({ widget, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Widget generator error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
