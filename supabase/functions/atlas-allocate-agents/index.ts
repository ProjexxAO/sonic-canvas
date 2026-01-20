import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier-to-Agent-Class mapping
const TIER_CLASS_ACCESS: Record<string, string[]> = {
  'free': ['BASIC'],
  'personal': ['BASIC', 'ADVANCED'],
  'pro': ['BASIC', 'ADVANCED', 'ELITE'],
  'team': ['BASIC', 'ADVANCED', 'ELITE'],
  'enterprise': ['BASIC', 'ADVANCED', 'ELITE', 'SINGULARITY'],
};

// Persona-to-Sector mapping (which sectors are most relevant for each persona)
const PERSONA_SECTOR_MAPPING: Record<string, { primary: string[]; secondary: string[] }> = {
  'CEO': {
    primary: ['FINANCE', 'DATA'],
    secondary: ['SECURITY', 'CREATIVE'],
  },
  'CFO': {
    primary: ['FINANCE', 'DATA'],
    secondary: ['SECURITY'],
  },
  'COO': {
    primary: ['DATA', 'UTILITY'],
    secondary: ['SECURITY', 'FINANCE'],
  },
  'CMO': {
    primary: ['CREATIVE', 'DATA'],
    secondary: ['UTILITY'],
  },
  'CTO': {
    primary: ['DATA', 'SECURITY'],
    secondary: ['UTILITY', 'BIOTECH'],
  },
  'CHRO': {
    primary: ['DATA', 'UTILITY'],
    secondary: ['CREATIVE'],
  },
  'CSO': {
    primary: ['SECURITY', 'DATA'],
    secondary: ['FINANCE'],
  },
  'CIO': {
    primary: ['DATA', 'SECURITY'],
    secondary: ['UTILITY'],
  },
  'default': {
    primary: ['DATA', 'UTILITY'],
    secondary: ['FINANCE', 'CREATIVE', 'SECURITY', 'BIOTECH'],
  },
};

// Industry-to-Sector boost mapping
const INDUSTRY_SECTOR_BOOST: Record<string, string[]> = {
  'finance': ['FINANCE', 'SECURITY', 'DATA'],
  'healthcare': ['BIOTECH', 'DATA', 'SECURITY'],
  'technology': ['DATA', 'SECURITY', 'UTILITY'],
  'retail': ['DATA', 'CREATIVE', 'FINANCE'],
  'manufacturing': ['UTILITY', 'DATA', 'FINANCE'],
  'media': ['CREATIVE', 'DATA', 'UTILITY'],
  'consulting': ['DATA', 'FINANCE', 'UTILITY'],
  'pharma': ['BIOTECH', 'DATA', 'SECURITY'],
  'default': ['DATA', 'UTILITY'],
};

interface AllocationRequest {
  userId: string;
  workspaceId?: string;
  persona?: string;
  autoAssign?: boolean;
  limit?: number;
}

interface AllocatedAgent {
  id: string;
  name: string;
  sector: string;
  class: string;
  designation: string;
  description: string | null;
  capabilities: string[] | null;
  relevanceScore: number;
  relevanceReason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { workspaceId, persona, autoAssign = false, limit = 5 }: AllocationRequest = await req.json();
    
    // Use authenticated user's ID instead of accepting it from the request body
    const userId = user.id;

    console.log(`[atlas-allocate] Allocating agents for user ${userId}, persona: ${persona}, workspace: ${workspaceId}`);

    // Use service role for internal queries with validated user context
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get user's organization and tier
    let userTier = 'free';
    let userIndustry = 'default';
    
    // Check if user belongs to an organization
    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('org_id, organizations(plan, industry)')
      .eq('user_id', userId)
      .single();

    if (orgMembership?.organizations) {
      const org = orgMembership.organizations as unknown as { plan: string; industry: string | null };
      userTier = org.plan || 'free';
      userIndustry = org.industry?.toLowerCase() || 'default';
    }

    console.log(`[atlas-allocate] User tier: ${userTier}, industry: ${userIndustry}`);

    // 2. Get user's persona from workspace or profile
    let userPersona = persona || 'default';
    
    if (!persona && workspaceId) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('assigned_persona')
        .eq('user_id', userId)
        .eq('workspace_id', workspaceId)
        .single();
      
      if (membership?.assigned_persona) {
        userPersona = membership.assigned_persona;
      }
    }

    if (userPersona === 'default') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_persona')
        .eq('user_id', userId)
        .single();
      
      if (profile?.preferred_persona) {
        userPersona = profile.preferred_persona;
      }
    }

    console.log(`[atlas-allocate] Using persona: ${userPersona}`);

    // 3. Determine allowed classes based on tier
    const allowedClasses = TIER_CLASS_ACCESS[userTier] || TIER_CLASS_ACCESS['free'];
    
    // 4. Determine relevant sectors based on persona and industry
    const personaMapping = PERSONA_SECTOR_MAPPING[userPersona.toUpperCase()] || PERSONA_SECTOR_MAPPING['default'];
    const industryBoost = INDUSTRY_SECTOR_BOOST[userIndustry] || INDUSTRY_SECTOR_BOOST['default'];
    
    // Combine primary and secondary sectors with weights
    const sectorScores: Record<string, number> = {};
    
    // Primary sectors from persona get highest score
    personaMapping.primary.forEach(sector => {
      sectorScores[sector] = (sectorScores[sector] || 0) + 100;
    });
    
    // Secondary sectors from persona get medium score
    personaMapping.secondary.forEach(sector => {
      sectorScores[sector] = (sectorScores[sector] || 0) + 50;
    });
    
    // Industry boost adds additional score
    industryBoost.forEach((sector, index) => {
      sectorScores[sector] = (sectorScores[sector] || 0) + (30 - index * 5);
    });

    console.log(`[atlas-allocate] Sector scores:`, sectorScores);

    // 5. Query available agents filtered by allowed classes
    const { data: agents, error: agentsError } = await supabase
      .from('sonic_agents')
      .select('id, name, sector, class, designation, description, capabilities, status')
      .in('class', allowedClasses)
      .eq('status', 'ACTIVE')
      .limit(50);

    if (agentsError) {
      console.error('[atlas-allocate] Error fetching agents:', agentsError);
      throw agentsError;
    }

    // Also check for IDLE agents if not enough ACTIVE ones
    let allAgents = agents || [];
    if (allAgents.length < limit) {
      const { data: idleAgents } = await supabase
        .from('sonic_agents')
        .select('id, name, sector, class, designation, description, capabilities, status')
        .in('class', allowedClasses)
        .eq('status', 'IDLE')
        .limit(50 - allAgents.length);
      
      if (idleAgents) {
        allAgents = [...allAgents, ...idleAgents];
      }
    }

    console.log(`[atlas-allocate] Found ${allAgents.length} eligible agents`);

    // 6. Get already assigned agents to avoid duplicates
    const { data: existingAssignments } = await supabase
      .from('user_agents')
      .select('agent_id')
      .eq('user_id', userId);

    const assignedAgentIds = new Set((existingAssignments || []).map(a => a.agent_id));

    // 7. Score and rank agents
    const scoredAgents: AllocatedAgent[] = allAgents
      .filter(agent => !assignedAgentIds.has(agent.id))
      .map(agent => {
        const sectorScore = sectorScores[agent.sector] || 0;
        
        // Class bonus (higher class = more capable but capped by tier)
        const classBonusMap: Record<string, number> = {
          'BASIC': 10,
          'ADVANCED': 20,
          'ELITE': 30,
          'SINGULARITY': 40,
        };
        const classBonus = classBonusMap[agent.class as string] || 0;
        
        const totalScore = sectorScore + classBonus;
        
        // Build relevance reason
        let reason = '';
        if (personaMapping.primary.includes(agent.sector)) {
          reason = `Primary ${userPersona} expertise`;
        } else if (personaMapping.secondary.includes(agent.sector)) {
          reason = `Supports ${userPersona} objectives`;
        } else if (industryBoost.includes(agent.sector)) {
          reason = `${userIndustry} industry specialist`;
        } else {
          reason = 'General capability match';
        }

        return {
          id: agent.id,
          name: agent.name,
          sector: agent.sector,
          class: agent.class,
          designation: agent.designation,
          description: agent.description,
          capabilities: agent.capabilities,
          relevanceScore: totalScore,
          relevanceReason: reason,
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    console.log(`[atlas-allocate] Recommended ${scoredAgents.length} agents`);

    // 8. Auto-assign if requested
    let assignedCount = 0;
    if (autoAssign && scoredAgents.length > 0) {
      const assignments = scoredAgents.map(agent => ({
        user_id: userId,
        agent_id: agent.id,
        assigned_by: null, // System assigned
      }));

      const { error: assignError } = await supabase
        .from('user_agents')
        .upsert(assignments, { onConflict: 'user_id,agent_id' });

      if (assignError) {
        console.error('[atlas-allocate] Error auto-assigning agents:', assignError);
      } else {
        assignedCount = assignments.length;
        console.log(`[atlas-allocate] Auto-assigned ${assignedCount} agents`);
      }
    }

    return new Response(JSON.stringify({
      recommendations: scoredAgents,
      context: {
        tier: userTier,
        allowedClasses,
        persona: userPersona,
        industry: userIndustry,
        primarySectors: personaMapping.primary,
      },
      autoAssigned: autoAssign ? assignedCount : 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[atlas-allocate] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
