import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchQuery {
  query: string;
  category?: string;
  searchMode?: "web" | "academic" | "sec";
  recencyFilter?: "day" | "week" | "month" | "year";
}

interface MetaSearchRequest {
  queries: SearchQuery[];
  aggregateResults?: boolean;
  maxResultsPerQuery?: number;
}

interface SearchResult {
  query: string;
  category?: string;
  answer: string;
  citations: string[];
  searchMode?: string;
}

async function performSearch(
  query: SearchQuery,
  apiKey: string
): Promise<SearchResult> {
  const body: Record<string, unknown> = {
    model: "sonar",
    messages: [
      { 
        role: "system", 
        content: "Be precise and concise. Provide factual, up-to-date information with sources when available. Focus on actionable insights." 
      },
      { role: "user", content: query.query }
    ],
  };

  if (query.searchMode === "academic") {
    body.search_mode = "academic";
  } else if (query.searchMode === "sec") {
    body.search_mode = "sec";
  }

  if (query.recencyFilter) {
    body.search_recency_filter = query.recencyFilter;
  }

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[perplexity-meta-search] API error for query "${query.query}":`, response.status, errorText);
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    query: query.query,
    category: query.category,
    answer: data.choices?.[0]?.message?.content || "No response",
    citations: data.citations || [],
    searchMode: query.searchMode,
  };
}

function aggregateSearchResults(results: SearchResult[]): {
  summary: string;
  categorizedResults: Record<string, SearchResult[]>;
  allCitations: string[];
  keyInsights: string[];
} {
  const categorizedResults: Record<string, SearchResult[]> = {};
  const allCitations: string[] = [];
  const keyInsights: string[] = [];

  for (const result of results) {
    const category = result.category || "general";
    if (!categorizedResults[category]) {
      categorizedResults[category] = [];
    }
    categorizedResults[category].push(result);
    
    // Collect unique citations
    for (const citation of result.citations) {
      if (!allCitations.includes(citation)) {
        allCitations.push(citation);
      }
    }

    // Extract first sentence as key insight
    const firstSentence = result.answer.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 20) {
      keyInsights.push(`[${category}] ${firstSentence.trim()}`);
    }
  }

  const summary = `Meta-search completed across ${results.length} queries in ${Object.keys(categorizedResults).length} categories. Found ${allCitations.length} unique sources.`;

  return {
    summary,
    categorizedResults,
    allCitations,
    keyInsights: keyInsights.slice(0, 10), // Top 10 insights
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { queries, aggregateResults = true, maxResultsPerQuery = 5 }: MetaSearchRequest = await req.json();

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (queries.length > 10) {
      return new Response(
        JSON.stringify({ error: "Maximum 10 queries allowed per request" }),
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

    console.log(`[perplexity-meta-search] Starting meta-search for ${queries.length} queries`);

    // Execute all searches in parallel
    const searchPromises = queries.map(query => 
      performSearch(query, PERPLEXITY_API_KEY).catch(error => ({
        query: query.query,
        category: query.category,
        answer: `Error: ${error.message}`,
        citations: [],
        error: true,
      } as SearchResult & { error?: boolean }))
    );

    const results = await Promise.all(searchPromises);
    const successfulResults = results.filter(r => !('error' in r && r.error));

    console.log(`[perplexity-meta-search] Completed ${successfulResults.length}/${queries.length} searches successfully`);

    if (aggregateResults) {
      const aggregated = aggregateSearchResults(successfulResults);
      return new Response(
        JSON.stringify({
          success: true,
          totalQueries: queries.length,
          successfulQueries: successfulResults.length,
          aggregated,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalQueries: queries.length,
        successfulQueries: successfulResults.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[perplexity-meta-search] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
