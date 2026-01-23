import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Return the public site key - this is safe to expose
  const siteKey = Deno.env.get("CLOUDFLARE_TURNSTILE_SITE_KEY") || "";

  return new Response(
    JSON.stringify({ siteKey }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
