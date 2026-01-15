import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ELEVENLABS_AGENT_ID = "agent_7501kbh21cg1eht9xtjw6kvkpm4m";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      console.error("[elevenlabs-conversation-token] ELEVENLABS_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[elevenlabs-conversation-token] Fetching signed URL for agent:", ELEVENLABS_AGENT_ID);

    // Use the signed URL endpoint for WebSocket connections
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${ELEVENLABS_AGENT_ID}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[elevenlabs-conversation-token] ElevenLabs API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("[elevenlabs-conversation-token] Successfully obtained signed URL:", data.signed_url ? "present" : "missing");

    if (!data.signed_url) {
      console.error("[elevenlabs-conversation-token] No signed_url in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No signed URL returned from ElevenLabs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return with signed_url property to match what the frontend expects
    return new Response(JSON.stringify({ signed_url: data.signed_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[elevenlabs-conversation-token] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
