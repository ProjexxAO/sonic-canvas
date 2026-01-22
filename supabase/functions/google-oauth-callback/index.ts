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
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Missing Google OAuth credentials')
      return redirectWithError('OAuth not configured')
    }

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      console.error('OAuth error from Google:', error)
      return redirectWithError(error)
    }

    if (!code || !state) {
      console.error('Missing code or state')
      return redirectWithError('Missing authorization code')
    }

    // Create admin client to validate state
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate state and get user info
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .single()

    if (stateError || !stateData) {
      console.error('Invalid or expired state:', stateError)
      return redirectWithError('Invalid or expired session')
    }

    // Check if state is expired
    if (new Date(stateData.expires_at) < new Date()) {
      console.error('State expired')
      await supabase.from('oauth_states').delete().eq('state', state)
      return redirectWithError('Session expired')
    }

    const userId = stateData.user_id
    const platform = stateData.platform

    // Exchange code for tokens
    const callbackUrl = `${SUPABASE_URL}/functions/v1/google-oauth-callback`
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      console.error('Token exchange failed:', tokenData)
      return redirectWithError('Failed to exchange token')
    }

    console.log('Token exchange successful for user:', userId)

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const userInfo = await userInfoResponse.json()
    console.log('Google user info:', userInfo.email)

    // Store or update connector with tokens
    const { error: connectorError } = await supabase
      .from('csuite_connectors')
      .upsert({
        user_id: userId,
        provider: platform,
        status: 'connected',
        access_token_encrypted: tokenData.access_token, // In production, encrypt this
        refresh_token_encrypted: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        last_sync_at: null,
        metadata: {
          account_email: userInfo.email,
          account_name: userInfo.name || userInfo.email.split('@')[0],
          picture: userInfo.picture,
          sync_frequency: 'hourly',
          items_synced: 0,
          connected_at: new Date().toISOString(),
          oauth_connected: true,
        },
      }, {
        onConflict: 'user_id,provider',
      })

    if (connectorError) {
      console.error('Error storing connector:', connectorError)
      return redirectWithError('Failed to save connection')
    }

    // Clean up state
    await supabase.from('oauth_states').delete().eq('state', state)

    console.log(`Successfully connected ${platform} for user ${userId}`)

    // Redirect back to the app with success
    const appUrl = getAppUrl()
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${appUrl}/personal?oauth=success&platform=${platform}`,
      },
    })

  } catch (error) {
    console.error('OAuth callback error:', error)
    return redirectWithError('An unexpected error occurred')
  }
})

function getAppUrl(): string {
  // Get the app URL from environment or use a default
  const siteUrl = Deno.env.get('SITE_URL')
  if (siteUrl) return siteUrl
  
  // Fallback to Lovable preview URL pattern
  const projectId = Deno.env.get('SUPABASE_URL')?.match(/https:\/\/([^.]+)/)?.[1]
  if (projectId) {
    return `https://id-preview--f378acef-59f7-4c9a-94bf-0d8d1ad8b85a.lovable.app`
  }
  
  return 'http://localhost:5173'
}

function redirectWithError(message: string): Response {
  const appUrl = getAppUrl()
  return new Response(null, {
    status: 302,
    headers: {
      'Location': `${appUrl}/personal?oauth=error&message=${encodeURIComponent(message)}`,
    },
  })
}
