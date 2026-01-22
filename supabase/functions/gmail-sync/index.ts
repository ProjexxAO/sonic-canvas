import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ body?: { data?: string } }>;
  };
  internalDate: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    // Get Gmail connector with access token
    const { data: connector, error: connectorError } = await supabase
      .from('csuite_connectors')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'gmail')
      .eq('status', 'connected')
      .single()

    if (connectorError || !connector) {
      return new Response(
        JSON.stringify({ error: 'Gmail not connected', code: 'NOT_CONNECTED' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let accessToken = connector.access_token_encrypted

    // Check if token is expired and refresh if needed
    if (connector.token_expires_at && new Date(connector.token_expires_at) < new Date()) {
      console.log('Token expired, attempting refresh...')
      
      const refreshToken = connector.refresh_token_encrypted
      if (!refreshToken) {
        return new Response(
          JSON.stringify({ error: 'Token expired and no refresh token', code: 'TOKEN_EXPIRED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      const refreshData = await refreshResponse.json()

      if (!refreshResponse.ok || refreshData.error) {
        console.error('Token refresh failed:', refreshData)
        return new Response(
          JSON.stringify({ error: 'Failed to refresh token', code: 'REFRESH_FAILED' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      accessToken = refreshData.access_token

      // Update the stored token
      await supabase
        .from('csuite_connectors')
        .update({
          access_token_encrypted: refreshData.access_token,
          token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('id', connector.id)
    }

    // Fetch messages from Gmail API
    console.log('Fetching messages from Gmail API...')
    
    const messagesResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&labelIds=INBOX',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text()
      console.error('Gmail API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch messages from Gmail' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const messagesData = await messagesResponse.json()
    const messageIds = messagesData.messages?.slice(0, 20) || []

    // Fetch full message details for each message
    const messages: any[] = []
    
    for (const msg of messageIds) {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (msgResponse.ok) {
        const msgData: GmailMessage = await msgResponse.json()
        
        const getHeader = (name: string) => 
          msgData.payload.headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''
        
        messages.push({
          id: msgData.id,
          threadId: msgData.threadId,
          from: getHeader('From'),
          to: getHeader('To'),
          subject: getHeader('Subject'),
          snippet: msgData.snippet,
          date: getHeader('Date'),
          internalDate: msgData.internalDate,
        })
      }
    }

    // Store messages in csuite_communications
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    for (const msg of messages) {
      // Check if message already exists
      const { data: existing } = await adminClient
        .from('csuite_communications')
        .select('id')
        .eq('source_id', msg.id)
        .eq('user_id', userId)
        .single()

      if (!existing) {
        await adminClient
          .from('csuite_communications')
          .insert({
            user_id: userId,
            source: 'gmail',
            source_id: msg.id,
            type: 'email',
            from_address: msg.from,
            to_addresses: [msg.to],
            subject: msg.subject,
            content: msg.snippet,
            sent_at: new Date(parseInt(msg.internalDate)).toISOString(),
            metadata: {
              thread_id: msg.threadId,
              synced_at: new Date().toISOString(),
            },
          })
      }
    }

    // Update connector last sync time
    await supabase
      .from('csuite_connectors')
      .update({
        last_sync_at: new Date().toISOString(),
        metadata: {
          ...connector.metadata,
          items_synced: (connector.metadata?.items_synced || 0) + messages.length,
          last_sync_count: messages.length,
        },
      })
      .eq('id', connector.id)

    console.log(`Successfully synced ${messages.length} messages for user ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: messages.length,
        messages: messages.slice(0, 10), // Return preview of first 10
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Gmail sync error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to sync Gmail' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
