import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const {
      query,
      mode = "search",
      sources,
      site,
      top_k = 5,
      json_mode = false,
      followups = false
    } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing required field: query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      console.error("[perplexity-meta-search] PERPLEXITY_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Perplexity API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Perplexity meta-search prompt
    const prompt: string[] = [];
    prompt.push(`Primary query: ${query}`);

    if (site) prompt.push(`Restrict results to domain: ${site}`);
    if (sources) prompt.push(`Preferred sources: ${sources}`);

    if (mode === "deep") prompt.push("Perform deep research with multi-hop reasoning.");
    if (mode === "multi") prompt.push("Break the query into sub-questions and search each.");
    if (mode === "extract") prompt.push("Return structured JSON with key insights.");
    if (mode === "citations") prompt.push("Include citations for every claim.");

    if (json_mode) prompt.push("Respond ONLY in valid JSON.");
    if (followups) prompt.push("Generate 3 follow-up questions.");

    const finalPrompt = prompt.join("\n");

    console.log(`[perplexity-meta-search] Mode: ${mode}, Query: ${query.substring(0, 100)}...`);

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "user",
            content: finalPrompt
          }
        ],
        max_tokens: 4096,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[perplexity-meta-search] API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Perplexity API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("[perplexity-meta-search] Search completed successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[perplexity-meta-search] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
