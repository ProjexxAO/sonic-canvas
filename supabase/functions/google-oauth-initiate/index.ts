import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    
    if (!GOOGLE_CLIENT_ID) {
      console.error('Missing GOOGLE_CLIENT_ID')
      return new Response(
        JSON.stringify({ error: 'Google OAuth not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub

    // Parse request body
    const body = await req.json().catch(() => ({}))
    const { redirect_uri, scopes, platform } = body

    // Default scopes for Gmail
    const defaultScopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ]

    // Platform-specific scopes
    const platformScopes: Record<string, string[]> = {
      gmail: defaultScopes,
      gdrive: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      calendar: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
    }

    const finalScopes = scopes || platformScopes[platform] || defaultScopes

    // Generate state token for security
    const state = crypto.randomUUID()
    
    // Store state in database for validation
    const { error: stateError } = await supabase
      .from('oauth_states')
      .upsert({
        state,
        user_id: userId,
        platform: platform || 'gmail',
        redirect_uri: redirect_uri || `${SUPABASE_URL}/functions/v1/google-oauth-callback`,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
      })

    if (stateError) {
      console.error('Error storing OAuth state:', stateError)
      // Continue anyway, state validation is a security enhancement
    }

    // Build Google OAuth URL
    const callbackUrl = `${SUPABASE_URL}/functions/v1/google-oauth-callback`
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', finalScopes.join(' '))
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', state)

    console.log(`OAuth initiate for user ${userId}, platform: ${platform || 'gmail'}`)

    return new Response(
      JSON.stringify({ 
        auth_url: authUrl.toString(),
        state,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('OAuth initiate error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to initiate OAuth' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
