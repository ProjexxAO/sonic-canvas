import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentRow {
  id?: string
  name: string
  designation: string
  sector: string
  status: string
  class: string
  waveform: string
  frequency: number
  modulation: number
  density: number
  color: string
  cycles: number
  efficiency: number
  stability: number
  code_artifact?: string
}

function parseCSV(csvText: string): AgentRow[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const agents: AgentRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    
    // Handle CSV parsing with quoted fields
    const values: string[] = []
    let current = ''
    let inQuotes = false
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    agents.push({
      id: row.id || undefined,
      name: row.name || 'Imported Agent',
      designation: row.designation || `IMP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      sector: mapSector(row.sector),
      status: mapStatus(row.status),
      class: mapClass(row.class),
      waveform: mapWaveform(row.waveform),
      frequency: parseFloat(row.frequency) || 440,
      modulation: parseFloat(row.modulation) || 5,
      density: parseFloat(row.density) || 50,
      color: row.color || '#00ffd5',
      cycles: parseInt(row.cycles) || 0,
      efficiency: parseFloat(row.efficiency) || 75,
      stability: parseFloat(row.stability) || 85,
      code_artifact: row.code_artifact || undefined,
    })
  }
  
  return agents
}

function mapSector(sector: string): string {
  const valid = ['FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY']
  const upper = (sector || '').toUpperCase()
  return valid.includes(upper) ? upper : 'DATA'
}

function mapStatus(status: string): string {
  const valid = ['IDLE', 'ACTIVE', 'PROCESSING', 'ERROR', 'DORMANT']
  const upper = (status || '').toUpperCase()
  return valid.includes(upper) ? upper : 'IDLE'
}

function mapClass(cls: string): string {
  const valid = ['BASIC', 'ADVANCED', 'ELITE', 'SINGULARITY']
  const upper = (cls || '').toUpperCase()
  return valid.includes(upper) ? upper : 'BASIC'
}

function mapWaveform(waveform: string): string {
  const valid = ['sine', 'square', 'triangle', 'sawtooth']
  const lower = (waveform || '').toLowerCase()
  return valid.includes(lower) ? lower : 'sine'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const csvData: string | undefined = body?.csvData
    const agentsFromClient: AgentRow[] | undefined = body?.agents

    // Mode A: client sends already-parsed agents (used to avoid huge payloads)
    if (Array.isArray(agentsFromClient)) {
      if (agentsFromClient.length === 0) {
        return new Response(JSON.stringify({ error: 'No agents provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const insertData = agentsFromClient.map(agent => ({
        user_id: user.id,
        name: agent.name,
        designation: agent.designation,
        sector: mapSector(agent.sector),
        status: mapStatus(agent.status),
        class: mapClass(agent.class),
        waveform: mapWaveform(agent.waveform),
        frequency: agent.frequency,
        modulation: agent.modulation,
        density: agent.density,
        color: agent.color,
        cycles: agent.cycles,
        efficiency: agent.efficiency,
        stability: agent.stability,
        code_artifact: agent.code_artifact,
      }))

      console.log(`Batch import (pre-parsed) for user ${user.id}: ${insertData.length} agents`)

      const { data, error } = await supabase
        .from('sonic_agents')
        .insert(insertData)
        .select('id')

      if (error) {
        console.error('Batch import (pre-parsed) error:', error.message)
        return new Response(JSON.stringify({
          success: false,
          totalParsed: agentsFromClient.length,
          totalInserted: 0,
          totalErrors: agentsFromClient.length,
          errors: [error.message],
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        success: true,
        totalParsed: agentsFromClient.length,
        totalInserted: data?.length || 0,
        totalErrors: 0,
        errors: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mode B: client sends raw CSV
    if (!csvData) {
      return new Response(JSON.stringify({ error: 'No CSV data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Starting bulk import for user ${user.id}`)
    
    const agents = parseCSV(csvData)
    console.log(`Parsed ${agents.length} agents from CSV`)

    if (agents.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid agents found in CSV' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Process in batches of 500 for better performance
    const BATCH_SIZE = 500
    let totalInserted = 0
    let totalErrors = 0
    const errors: string[] = []

    for (let i = 0; i < agents.length; i += BATCH_SIZE) {
      const batch = agents.slice(i, i + BATCH_SIZE)
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1
      const totalBatches = Math.ceil(agents.length / BATCH_SIZE)
      
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} agents)`)

      const insertData = batch.map(agent => ({
        user_id: user.id,
        name: agent.name,
        designation: agent.designation,
        sector: agent.sector,
        status: agent.status,
        class: agent.class,
        waveform: agent.waveform,
        frequency: agent.frequency,
        modulation: agent.modulation,
        density: agent.density,
        color: agent.color,
        cycles: agent.cycles,
        efficiency: agent.efficiency,
        stability: agent.stability,
        code_artifact: agent.code_artifact,
      }))

      const { data, error } = await supabase
        .from('sonic_agents')
        .insert(insertData)
        .select('id')

      if (error) {
        console.error(`Batch ${batchNumber} error:`, error.message)
        errors.push(`Batch ${batchNumber}: ${error.message}`)
        totalErrors += batch.length
      } else {
        totalInserted += data?.length || 0
      }
    }

    console.log(`Import complete: ${totalInserted} inserted, ${totalErrors} errors`)

    return new Response(JSON.stringify({
      success: true,
      totalParsed: agents.length,
      totalInserted,
      totalErrors,
      errors: errors.slice(0, 10), // Return first 10 errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Bulk import error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
