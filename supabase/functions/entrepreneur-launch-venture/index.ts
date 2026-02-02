import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============ AUTHENTICATION CHECK ============
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[entrepreneur-launch-venture] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('[entrepreneur-launch-venture] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ============ END AUTHENTICATION CHECK ============

    const ventureData = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[entrepreneur-launch-venture] Processing request for user ${user.id}`);

    const systemPrompt = `You are an expert business strategist and startup advisor. Generate a comprehensive business plan based on the venture details provided.

You must respond with valid JSON matching this structure:
{
  "businessPlan": {
    "executiveSummary": "A compelling 2-3 paragraph executive summary",
    "problemSolution": {
      "problem": "Refined problem statement",
      "solution": "Detailed solution description",
      "valueProposition": "Clear value proposition statement"
    },
    "marketAnalysis": {
      "targetMarket": "Detailed target market description",
      "marketSize": "Market size analysis with TAM/SAM/SOM",
      "trends": ["trend1", "trend2", "trend3"],
      "competitiveLandscape": "Analysis of competition"
    },
    "businessModel": {
      "revenueStreams": ["stream1", "stream2"],
      "pricingStrategy": "Recommended pricing approach",
      "costStructure": "Key cost categories and estimates",
      "unitEconomics": "Basic unit economics if applicable"
    },
    "goToMarket": {
      "launchStrategy": "How to launch the product/service",
      "channels": ["channel1", "channel2", "channel3"],
      "earlyAdopters": "Who to target first and how",
      "partnerships": "Potential strategic partnerships"
    },
    "roadmap": {
      "phase1": {
        "name": "Phase name (e.g., MVP)",
        "duration": "Duration",
        "milestones": ["milestone1", "milestone2", "milestone3"],
        "budget": "Estimated budget"
      },
      "phase2": {
        "name": "Phase name (e.g., Growth)",
        "duration": "Duration",
        "milestones": ["milestone1", "milestone2", "milestone3"],
        "budget": "Estimated budget"
      },
      "phase3": {
        "name": "Phase name (e.g., Scale)",
        "duration": "Duration",
        "milestones": ["milestone1", "milestone2", "milestone3"],
        "budget": "Estimated budget"
      }
    },
    "financialProjections": {
      "year1Revenue": "Estimated first year revenue",
      "year2Revenue": "Estimated second year revenue",
      "breakeven": "Estimated time to breakeven",
      "fundingNeeded": "Recommended initial funding"
    },
    "risksAndMitigation": [
      {"risk": "Risk description", "mitigation": "Mitigation strategy"},
      {"risk": "Risk description", "mitigation": "Mitigation strategy"}
    ],
    "nextSteps": ["Immediate action 1", "Immediate action 2", "Immediate action 3"]
  },
  "score": {
    "overall": number (0-100),
    "market": number (0-100),
    "execution": number (0-100),
    "financials": number (0-100)
  }
}`;

    const userPrompt = `Generate a comprehensive business plan for this venture:

Venture Name: ${ventureData.name}
Tagline: ${ventureData.tagline}

Problem Statement: ${ventureData.problem}
Proposed Solution: ${ventureData.solution}

Target Audience: ${ventureData.targetAudience}
Market Size: ${ventureData.marketSize}
Key Competitors: ${ventureData.competitors}
Unique Value: ${ventureData.uniqueValue}

Revenue Streams: ${ventureData.revenueStreams}
Pricing Strategy: ${ventureData.pricing}
Initial Costs: ${ventureData.initialCosts}

Key Milestones: ${ventureData.milestones}
Timeline: ${ventureData.timeline}
Required Resources: ${ventureData.resources}

Provide a thorough, actionable business plan with realistic projections and specific recommendations.`;

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
      throw new Error("Failed to parse business plan");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("entrepreneur-launch-venture error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
