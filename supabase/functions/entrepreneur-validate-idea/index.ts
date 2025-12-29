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
    const { name, description, targetAudience, problem } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a business idea validation expert. Analyze the business idea provided and return a structured validation assessment. Be realistic, balanced, and provide actionable insights.

You must respond with valid JSON matching this exact structure:
{
  "overallScore": number (0-100),
  "results": [
    {
      "category": "Market Demand",
      "score": number (0-100),
      "status": "strong" | "moderate" | "weak",
      "insights": ["insight1", "insight2", "insight3"]
    },
    {
      "category": "Competition Analysis", 
      "score": number (0-100),
      "status": "strong" | "moderate" | "weak",
      "insights": ["insight1", "insight2", "insight3"]
    },
    {
      "category": "Revenue Potential",
      "score": number (0-100),
      "status": "strong" | "moderate" | "weak", 
      "insights": ["insight1", "insight2", "insight3"]
    },
    {
      "category": "Target Audience",
      "score": number (0-100),
      "status": "strong" | "moderate" | "weak",
      "insights": ["insight1", "insight2", "insight3"]
    },
    {
      "category": "Execution Feasibility",
      "score": number (0-100),
      "status": "strong" | "moderate" | "weak",
      "insights": ["insight1", "insight2", "insight3"]
    }
  ],
  "summary": "Brief overall assessment of the idea"
}

Score guidelines:
- 70-100: strong
- 40-69: moderate  
- 0-39: weak`;

    const userPrompt = `Analyze this business idea:

Name: ${name}
Description: ${description}
Target Audience: ${targetAudience}
Problem Being Solved: ${problem}

Provide a thorough validation assessment with specific, actionable insights for each category.`;

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
    
    // Parse the JSON from the response
    let validationResult;
    try {
      // Try to extract JSON from the content (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      validationResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse validation results");
    }

    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("entrepreneur-validate-idea error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
