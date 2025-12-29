import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, campaignData, existingCampaigns } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "recommendations") {
      systemPrompt = `You are a marketing optimization expert. Analyze the campaign performance data and provide actionable recommendations.

You must respond with valid JSON matching this structure:
{
  "recommendations": [
    {
      "priority": "high" | "medium" | "low",
      "title": "Short recommendation title",
      "description": "Detailed explanation and action steps",
      "expectedImpact": "Expected improvement or result"
    }
  ],
  "insights": {
    "topPerformer": "Campaign name or type that's performing best",
    "needsAttention": "Campaign name or type that needs improvement",
    "overallHealth": "good" | "average" | "needs_work",
    "summary": "Brief overall assessment"
  }
}`;

      userPrompt = `Analyze these marketing campaigns and provide optimization recommendations:

${JSON.stringify(existingCampaigns, null, 2)}

Focus on:
1. Which campaigns should get more budget?
2. What's underperforming and why?
3. Quick wins that can improve results`;

    } else if (action === "generate") {
      systemPrompt = `You are a marketing campaign strategist. Create a detailed AI-powered marketing campaign based on the provided inputs.

You must respond with valid JSON matching this structure:
{
  "campaign": {
    "name": "Campaign name",
    "type": "email" | "social" | "ads" | "content",
    "status": "draft",
    "strategy": {
      "overview": "Campaign strategy overview",
      "channels": ["list of channels to use"],
      "messaging": "Key messaging approach",
      "contentIdeas": ["content idea 1", "content idea 2", "content idea 3"]
    },
    "timeline": {
      "duration": "Recommended duration",
      "phases": [
        {"name": "Phase name", "duration": "Duration", "activities": ["activity1", "activity2"]}
      ]
    },
    "budgetAllocation": {
      "creative": number (percentage),
      "distribution": number (percentage),
      "tools": number (percentage)
    },
    "expectedResults": {
      "reach": "Expected reach estimate",
      "conversions": "Expected conversions estimate",
      "roi": "Expected ROI estimate"
    },
    "kpis": ["KPI 1", "KPI 2", "KPI 3"]
  }
}`;

      userPrompt = `Create a marketing campaign with these specifications:

Name: ${campaignData.name}
Goal: ${campaignData.goal}
Budget: $${campaignData.budget}
Target Audience: ${campaignData.audience}
Template Type: ${campaignData.template || "general"}

Generate a comprehensive campaign strategy.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let result;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse results");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("entrepreneur-growth-optimizer error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
