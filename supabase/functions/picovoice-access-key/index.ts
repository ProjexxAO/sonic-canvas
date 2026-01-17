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
    const PICOVOICE_ACCESS_KEY = Deno.env.get("PICOVOICE_ACCESS_KEY");
    
    if (!PICOVOICE_ACCESS_KEY) {
      console.error("[picovoice-access-key] PICOVOICE_ACCESS_KEY not set");
      return new Response(
        JSON.stringify({ error: "Picovoice access key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ accessKey: PICOVOICE_ACCESS_KEY }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[picovoice-access-key] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
