import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Exporting agents for user: ${user.id}`)

    // Fetch all agents for this user in batches
    const batchSize = 1000
    let allAgents: any[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from('sonic_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: true })
        .range(offset, offset + batchSize - 1)

      if (error) {
        console.error('Fetch error:', error)
        throw error
      }

      if (data && data.length > 0) {
        allAgents = [...allAgents, ...data]
        offset += batchSize
        console.log(`Fetched ${allAgents.length} agents so far...`)
        hasMore = data.length === batchSize
      } else {
        hasMore = false
      }
    }

    console.log(`Total agents fetched: ${allAgents.length}`)

    // Generate CSV
    const headers = [
      'id', 'name', 'designation', 'sector', 'status', 'class', 'waveform',
      'frequency', 'modulation', 'density', 'color', 'cycles', 'efficiency',
      'stability', 'created_at', 'last_active', 'linked_agents', 'code_artifact'
    ]

    // Escape and sanitize CSV values to prevent formula injection attacks
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return ''
      let str = String(value)
      
      // Prevent formula injection by prefixing dangerous characters with single quote
      // This neutralizes formulas when opened in Excel, Google Sheets, etc.
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str
      }
      
      // Escape quotes and wrap in quotes if needed
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvRows = [
      headers.join(','),
      ...allAgents.map(agent => [
        escapeCSV(agent.id),
        escapeCSV(agent.name),
        escapeCSV(agent.designation),
        escapeCSV(agent.sector),
        escapeCSV(agent.status),
        escapeCSV(agent.class),
        escapeCSV(agent.waveform),
        escapeCSV(agent.frequency),
        escapeCSV(agent.modulation),
        escapeCSV(agent.density),
        escapeCSV(agent.color),
        escapeCSV(agent.cycles),
        escapeCSV(agent.efficiency),
        escapeCSV(agent.stability),
        escapeCSV(agent.created_at),
        escapeCSV(agent.last_active),
        escapeCSV(agent.linked_agents ? JSON.stringify(agent.linked_agents) : ''),
        escapeCSV(agent.code_artifact)
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="sonic_agents_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})