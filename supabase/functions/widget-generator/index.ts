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

// Complete life domain coverage
const ALL_DATA_SOURCES = [
  // Core productivity
  "tasks", "goals", "habits", "calendar", "email", "documents", "notes",
  // Finance & commerce
  "finance", "banking", "investments", "shopping", "subscriptions", "expenses",
  // Health & wellness
  "health", "fitness", "nutrition", "sleep", "meditation", "mental-health",
  // Social & relationships
  "contacts", "relationships", "social-media", "messages",
  // Entertainment & leisure
  "entertainment", "music", "movies", "books", "podcasts", "gaming",
  // Travel & transportation
  "travel", "flights", "hotels", "transportation", "maps",
  // Home & lifestyle
  "home", "smart-home", "groceries", "recipes", "pets", "plants",
  // Learning & development
  "learning", "courses", "skills", "languages", "certifications",
  // Work & career
  "work", "meetings", "projects", "clients", "networking",
  // Media & files
  "photos", "videos", "files", "cloud-storage",
  // External integrations
  "custom-api", "webhooks", "iot-devices", "external-services"
];

// Agent types that can be orchestrated for each domain
const DOMAIN_AGENTS: Record<string, string[]> = {
  // Productivity agents
  "tasks": ["task-optimizer", "priority-analyzer", "deadline-tracker"],
  "goals": ["goal-coach", "milestone-tracker", "accountability-partner"],
  "habits": ["habit-coach", "streak-keeper", "behavior-analyst"],
  "calendar": ["schedule-optimizer", "meeting-coordinator", "time-analyst"],
  
  // Finance agents
  "finance": ["financial-advisor", "budget-analyst", "expense-tracker"],
  "banking": ["account-monitor", "fraud-detector", "balance-tracker"],
  "investments": ["portfolio-manager", "market-analyst", "risk-assessor"],
  "shopping": ["deal-finder", "price-tracker", "purchase-advisor"],
  
  // Health agents
  "health": ["health-monitor", "symptom-tracker", "wellness-coach"],
  "fitness": ["fitness-coach", "workout-planner", "performance-tracker"],
  "nutrition": ["nutrition-advisor", "meal-planner", "calorie-tracker"],
  "sleep": ["sleep-analyst", "circadian-optimizer", "rest-coach"],
  "meditation": ["mindfulness-guide", "stress-reducer", "focus-coach"],
  
  // Social agents
  "contacts": ["contact-manager", "relationship-tracker", "network-analyzer"],
  "relationships": ["relationship-coach", "connection-reminder", "social-planner"],
  "social-media": ["social-curator", "engagement-tracker", "content-scheduler"],
  
  // Entertainment agents
  "entertainment": ["entertainment-curator", "recommendation-engine"],
  "music": ["music-curator", "playlist-generator", "discovery-agent"],
  "movies": ["movie-recommender", "watchlist-manager"],
  "books": ["reading-advisor", "book-recommender", "reading-tracker"],
  
  // Travel agents
  "travel": ["travel-planner", "itinerary-builder", "destination-advisor"],
  "flights": ["flight-tracker", "deal-hunter", "booking-optimizer"],
  "hotels": ["accommodation-finder", "review-analyzer"],
  
  // Home agents
  "home": ["home-manager", "maintenance-tracker", "inventory-keeper"],
  "smart-home": ["device-controller", "automation-builder", "energy-optimizer"],
  "groceries": ["grocery-planner", "list-manager", "stock-tracker"],
  "recipes": ["recipe-curator", "meal-suggester", "cooking-assistant"],
  "pets": ["pet-care-tracker", "vet-reminder", "feeding-scheduler"],
  
  // Learning agents
  "learning": ["learning-coach", "study-planner", "knowledge-tracker"],
  "courses": ["course-recommender", "progress-tracker", "certification-planner"],
  "skills": ["skill-assessor", "development-coach", "practice-scheduler"],
  
  // Work agents
  "work": ["productivity-coach", "focus-optimizer", "work-life-balancer"],
  "meetings": ["meeting-summarizer", "action-item-tracker", "agenda-preparer"],
  "projects": ["project-manager", "milestone-tracker", "team-coordinator"],
  "clients": ["client-manager", "communication-tracker", "opportunity-spotter"],
  
  // General
  "default": ["general-assistant", "data-analyzer", "insight-generator"]
};

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

    const systemPrompt = `You are Atlas, a universal AI orchestrator with command of 144,000 specialized agents. Users can create widgets to manage ANY aspect of their lives through their Personal Dashboard.

The Personal Dashboard is the user's LIFE OPERATING SYSTEM. They should be able to:
- Track and manage ANYTHING (health, finances, relationships, travel, learning, entertainment, home, work...)
- Automate ANY process they can describe
- Monitor ANY data source
- Get AI assistance for ANY life domain

Available data sources: ${ALL_DATA_SOURCES.join(', ')}
User's connected sources: ${availableDataSources.join(', ') || 'starting fresh'}
${existingWidgets?.length ? `Existing widgets: ${existingWidgets.join(', ')}` : ''}

YOUR MISSION:
1. Understand EXACTLY what the user wants to manage, track, or automate
2. Create a widget that genuinely helps them with that aspect of their life
3. Connect relevant data sources (even if not yet connected - we'll prompt for connection)
4. Assign appropriate AI agents from your 144,000 agent fleet
5. Enable automation capabilities for background processing

THINK EXPANSIVELY - if a user says "help me plan my vacation", create a travel-focused widget with flight, hotel, budget, and itinerary capabilities. If they say "track my workouts", create a comprehensive fitness widget.

BE PROACTIVE - suggest additional capabilities that would make the widget more useful.`;

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
              description: "Create a custom dashboard widget for any life domain",
              parameters: {
                type: "object",
                properties: {
                  name: { 
                    type: "string", 
                    description: "Short, descriptive widget name (2-5 words)" 
                  },
                  description: { 
                    type: "string", 
                    description: "What this widget helps the user accomplish" 
                  },
                  widget_type: { 
                    type: "string", 
                    enum: ["data-display", "ai-assistant", "automation", "hybrid"],
                    description: "Primary widget type. Use 'hybrid' for interactive widgets with AI and automation."
                  },
                  display_type: {
                    type: "string",
                    enum: ["chart", "list", "metric", "card", "timeline", "kanban", "calendar", "map", "dashboard"],
                    description: "Visual layout type"
                  },
                  chart_type: {
                    type: "string",
                    enum: ["bar", "line", "pie", "area", "radial", "scatter", "heatmap"],
                    description: "Chart style if display_type is chart"
                  },
                  data_sources: {
                    type: "array",
                    items: { 
                      type: "string",
                      enum: ALL_DATA_SOURCES
                    },
                    description: "All relevant data domains for this widget"
                  },
                  ai_enabled: {
                    type: "boolean",
                    description: "Enable AI agent capabilities"
                  },
                  ai_capabilities: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific AI capabilities: analyze, predict, recommend, summarize, plan, track, alert, automate, coach, optimize"
                  },
                  ai_prompt: {
                    type: "string",
                    description: "Detailed system prompt for the widget's AI personality and capabilities"
                  },
                  agents: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific agents to assign from the 144k fleet"
                  },
                  automation_triggers: {
                    type: "array",
                    items: { type: "string" },
                    description: "Events that trigger automated actions (e.g., 'new_email', 'low_balance', 'missed_workout')"
                  },
                  automation_actions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Actions the widget can perform automatically"
                  },
                  aggregation: {
                    type: "string",
                    enum: ["sum", "count", "average", "min", "max", "trend", "comparison"],
                    description: "Data aggregation method"
                  },
                  col_span: {
                    type: "number",
                    description: "Widget width (1-6 columns, 4+ for complex widgets)"
                  },
                  row_span: {
                    type: "number",
                    description: "Widget height in rows (1-4)"
                  },
                  icon: {
                    type: "string",
                    description: "Lucide icon name"
                  },
                  color: {
                    type: "string",
                    enum: ["blue", "green", "purple", "orange", "pink", "cyan", "yellow", "red", "emerald", "indigo"],
                    description: "Accent color"
                  },
                  refresh_interval: {
                    type: "number",
                    description: "Auto-refresh in seconds (0=manual, 60=minute, 300=5min, 3600=hour)"
                  },
                  quick_actions: {
                    type: "array",
                    items: { type: "string" },
                    description: "One-click actions available in the widget"
                  },
                  explanation: {
                    type: "string",
                    description: "How this widget will help the user manage this aspect of their life"
                  }
                },
                required: ["name", "description", "widget_type", "data_sources", "ai_enabled", "col_span", "explanation"],
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
    
    // Enrich agents based on data sources if not specified
    let agents = widgetConfig.agents || [];
    if (agents.length === 0 && widgetConfig.data_sources?.length > 0) {
      for (const source of widgetConfig.data_sources.slice(0, 3)) {
        const domainAgents = DOMAIN_AGENTS[source] || DOMAIN_AGENTS.default;
        agents.push(...domainAgents.slice(0, 2));
      }
    }

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
        automationTriggers: widgetConfig.automation_triggers || [],
        automationActions: widgetConfig.automation_actions || [],
        quickActions: widgetConfig.quick_actions || [],
      },
      data_sources: widgetConfig.data_sources,
      ai_capabilities: {
        enabled: widgetConfig.ai_enabled !== false, // Default to enabled
        systemPrompt: widgetConfig.ai_prompt,
        capabilities: widgetConfig.ai_capabilities || [],
        agents: agents,
      },
      layout: {
        colSpan: Math.min(Math.max(widgetConfig.col_span || 2, 1), 6),
        rowSpan: widgetConfig.row_span || 1,
      },
      style: {
        icon: widgetConfig.icon,
        color: widgetConfig.color,
      },
      explanation: widgetConfig.explanation,
      agent_chain: agents,
    };

    console.log(`Generated widget "${widget.name}" with ${agents.length} agents for domains: ${widgetConfig.data_sources?.join(', ')}`);

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
