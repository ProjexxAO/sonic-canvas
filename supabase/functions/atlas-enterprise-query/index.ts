import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnterpriseQueryRequest {
  action: 'query' | 'correlate' | 'analyze' | 'recommend' | 'workflow_trigger';
  userId: string;
  query?: string;
  domains?: string[];
  personaId?: string; // User's assigned persona for permission filtering
  agentContext?: {
    agentIds?: string[];
    sector?: string;
    capabilities?: string[];
  };
  workflowId?: string;
  options?: {
    depth?: 'brief' | 'standard' | 'detailed';
    includeAgents?: boolean;
    timeRange?: 'day' | 'week' | 'month' | 'all';
  };
}

interface PersonaPermission {
  domain: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface DomainData {
  domain: string;
  count: number;
  items: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: EnterpriseQueryRequest = await req.json();
    const { action, userId, query, domains, personaId, agentContext, workflowId, options } = request;

    console.log(`[Atlas Enterprise] Action: ${action}, User: ${userId}, Persona: ${personaId}, Query: ${query}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch persona permissions to filter accessible domains
    const fetchPersonaPermissions = async (): Promise<PersonaPermission[]> => {
      if (!personaId) return [];
      
      const { data, error } = await supabase
        .from('persona_permissions')
        .select('domain, can_view, can_create, can_edit, can_delete')
        .eq('persona_id', personaId);
      
      if (error) {
        console.error('[Atlas Enterprise] Error fetching persona permissions:', error);
        return [];
      }
      
      return data || [];
    };

    // Get allowed domains based on persona permissions
    const getAccessibleDomains = (permissions: PersonaPermission[], requestedDomains?: string[]): string[] => {
      const allDomains = ['communications', 'documents', 'events', 'financials', 'tasks', 'knowledge'];
      const targetDomains = requestedDomains?.length ? requestedDomains : allDomains;
      
      // If no persona, default to all domains (for users without persona assignment)
      if (!personaId || permissions.length === 0) {
        return targetDomains;
      }
      
      // Filter to only domains where can_view is true, or domain has no explicit restriction
      return targetDomains.filter(domain => {
        const perm = permissions.find(p => p.domain === domain);
        // If no explicit permission set, default to allowed
        return perm ? perm.can_view : true;
      });
    };

    // Get restricted domains for user awareness
    const getRestrictedDomains = (permissions: PersonaPermission[]): string[] => {
      return permissions.filter(p => !p.can_view).map(p => p.domain);
    };

    // Calculate time range filter
    const getTimeFilter = () => {
      const now = new Date();
      switch (options?.timeRange) {
        case 'day': return new Date(now.setDate(now.getDate() - 1)).toISOString();
        case 'week': return new Date(now.setDate(now.getDate() - 7)).toISOString();
        case 'month': return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        default: return null;
      }
    };
    const timeFilter = getTimeFilter();

    // Fetch C-Suite data from specified domains
    const fetchDomainData = async (domainList: string[] = ['communications', 'documents', 'events', 'financials', 'tasks', 'knowledge']): Promise<DomainData[]> => {
      const limit = options?.depth === 'detailed' ? 25 : options?.depth === 'brief' ? 5 : 15;
      const results: DomainData[] = [];

      for (const domain of domainList) {
        let query = supabase.from(`csuite_${domain}`).select('*').eq('user_id', userId).limit(limit);
        
        if (timeFilter) {
          const dateColumn = domain === 'communications' ? 'sent_at' : 
                            domain === 'events' ? 'start_at' : 
                            domain === 'financials' ? 'transaction_date' : 'created_at';
          query = query.gte(dateColumn, timeFilter);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (!error && data) {
          results.push({ domain, count: data.length, items: data });
        }
      }

      return results;
    };

    // Fetch relevant agents if requested
    const fetchAgentContext = async () => {
      if (!options?.includeAgents) return null;

      let agentQuery = supabase.from('sonic_agents').select('id, name, sector, status, description, capabilities');
      
      if (agentContext?.agentIds?.length) {
        agentQuery = agentQuery.in('id', agentContext.agentIds);
      } else if (agentContext?.sector) {
        agentQuery = agentQuery.eq('sector', agentContext.sector);
      }

      // Get user's assigned agents
      const { data: userAgents } = await supabase
        .from('user_agents')
        .select('agent_id')
        .eq('user_id', userId);

      const agentIds = userAgents?.map(ua => ua.agent_id) || [];
      
      if (agentIds.length > 0) {
        agentQuery = agentQuery.in('id', agentIds);
      }

      const { data: agents } = await agentQuery.limit(10);
      return agents;
    };

    // Handle different actions
    if (action === 'query') {
      // Fetch persona permissions first
      const personaPermissions = await fetchPersonaPermissions();
      const accessibleDomains = getAccessibleDomains(personaPermissions, domains);
      const restrictedDomains = getRestrictedDomains(personaPermissions);
      
      console.log(`[Atlas Enterprise] Accessible domains: ${accessibleDomains.join(', ')}`);
      if (restrictedDomains.length > 0) {
        console.log(`[Atlas Enterprise] Restricted domains: ${restrictedDomains.join(', ')}`);
      }

      // Natural language query across accessible enterprise data only
      const [domainData, agents] = await Promise.all([
        fetchDomainData(accessibleDomains),
        fetchAgentContext()
      ]);

      // Build comprehensive context
      const contextParts: string[] = [];
      
      // Add persona context for AI awareness
      if (personaId) {
        contextParts.push(`USER CONTEXT: This user has the "${personaId}" persona with access to: ${accessibleDomains.join(', ')}.${restrictedDomains.length > 0 ? ` Restricted from: ${restrictedDomains.join(', ')}.` : ''}`);
      }
      
      for (const dd of domainData) {
        if (dd.items.length > 0) {
          const itemSummary = dd.items.map(item => {
            const title = item.title || item.subject || item.name || 'Untitled';
            const content = item.content || item.description || '';
            return `- ${title}: ${content.slice(0, 150)}`;
          }).join('\n');
          contextParts.push(`${dd.domain.toUpperCase()} (${dd.count} items):\n${itemSummary}`);
        }
      }

      if (agents?.length) {
        const agentSummary = agents.map(a => 
          `- ${a.name} [${a.sector}/${a.status}]: ${a.description || 'No description'}`
        ).join('\n');
        contextParts.push(`AVAILABLE AGENTS (${agents.length}):\n${agentSummary}`);
      }

      const context = contextParts.join('\n\n');

      // Use AI to answer the query
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: `You are Atlas, an enterprise AI assistant with access to organizational data and AI agents.

You are aware of the user's persona and their data access permissions.
IMPORTANT: Only provide information from the domains the user has access to.
If the user asks about data from restricted domains, politely explain they don't have access to that information based on their current persona permissions.

Provide comprehensive, actionable answers based on the available data.
Reference specific data points when relevant.
Suggest which agents could help with follow-up actions when applicable.
Format responses clearly with sections if the answer is complex.` 
            },
            { role: 'user', content: `Query: ${query}\n\nAvailable Enterprise Data:\n${context}` },
          ],
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        throw new Error('AI query failed');
      }

      const aiData = await aiResponse.json();
      const answer = aiData.choices?.[0]?.message?.content || 'Unable to generate response';

      return new Response(JSON.stringify({
        answer,
        dataContext: {
          domains: domainData.map(d => ({ domain: d.domain, count: d.count })),
          accessibleDomains,
          restrictedDomains,
          agentCount: agents?.length || 0,
          timeRange: options?.timeRange || 'all'
        },
        agents: agents?.slice(0, 5) || [],
        personaId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'correlate') {
      // Fetch persona permissions and filter domains
      const personaPermissions = await fetchPersonaPermissions();
      const accessibleDomains = getAccessibleDomains(personaPermissions, domains);
      
      // Find correlations between accessible domains only
      const domainData = await fetchDomainData(accessibleDomains);
      
      const correlationContext = domainData.map(dd => ({
        domain: dd.domain,
        items: dd.items.map(item => ({
          id: item.id,
          title: item.title || item.subject || item.name,
          content: (item.content || item.description || '').slice(0, 200),
          date: item.created_at || item.sent_at || item.start_at,
          metadata: item.metadata
        }))
      }));

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: `You are Atlas, an enterprise data correlation engine.
              
Analyze the data across domains and identify:
1. Cross-domain patterns and relationships
2. Timeline correlations (events that happened close together)
3. Entity correlations (same people, projects, or topics)
4. Potential causal relationships

Respond with JSON:
{
  "correlations": [
    {
      "type": "pattern|timeline|entity|causal",
      "domains": ["domain1", "domain2"],
      "description": "Description of the correlation",
      "confidence": "high|medium|low",
      "items": ["item_id_1", "item_id_2"]
    }
  ],
  "insights": ["Key insight 1", "Key insight 2"],
  "recommendations": ["Recommendation 1"]
}` 
            },
            { role: 'user', content: `Find correlations in this enterprise data:\n${JSON.stringify(correlationContext, null, 2)}` },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!aiResponse.ok) throw new Error('Correlation analysis failed');

      const aiData = await aiResponse.json();
      let result;
      try {
        result = JSON.parse(aiData.choices[0].message.content);
      } catch {
        result = { correlations: [], insights: [], recommendations: [] };
      }

      return new Response(JSON.stringify({
        ...result,
        analyzedDomains: domainData.map(d => d.domain),
        totalItems: domainData.reduce((sum, d) => sum + d.count, 0)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'analyze') {
      // Fetch persona permissions and filter domains
      const personaPermissions = await fetchPersonaPermissions();
      const accessibleDomains = getAccessibleDomains(personaPermissions, domains);
      
      // Deep analysis with agent recommendations - only accessible domains
      const [domainData, agents] = await Promise.all([
        fetchDomainData(accessibleDomains),
        fetchAgentContext()
      ]);

      const analysisContext = {
        domains: domainData,
        agents: agents || [],
        query: query || 'Provide comprehensive analysis'
      };

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { 
              role: 'system', 
              content: `You are Atlas, an enterprise-grade AI analysis engine.

Provide comprehensive analysis including:
1. Executive Summary
2. Key Findings by Domain
3. Risk Assessment
4. Opportunities Identified
5. Agent Deployment Recommendations (which agents to use for what)
6. Action Items with Priority

Respond with JSON:
{
  "executiveSummary": "2-3 sentence overview",
  "findings": [
    {"domain": "domain", "finding": "description", "severity": "high|medium|low", "evidence": "data reference"}
  ],
  "risks": [
    {"risk": "description", "probability": "high|medium|low", "impact": "high|medium|low", "mitigation": "suggestion"}
  ],
  "opportunities": [
    {"opportunity": "description", "potential": "high|medium|low", "requiredAction": "next step"}
  ],
  "agentRecommendations": [
    {"agentName": "name", "task": "what to assign", "priority": "high|medium|low"}
  ],
  "actionItems": [
    {"action": "description", "owner": "suggested owner", "deadline": "suggested timeline", "priority": "high|medium|low"}
  ]
}` 
            },
            { role: 'user', content: `Analyze:\n${JSON.stringify(analysisContext, null, 2)}` },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!aiResponse.ok) throw new Error('Analysis failed');

      const aiData = await aiResponse.json();
      let analysis;
      try {
        analysis = JSON.parse(aiData.choices[0].message.content);
      } catch {
        analysis = { executiveSummary: 'Analysis failed to parse', findings: [], risks: [], opportunities: [], agentRecommendations: [], actionItems: [] };
      }

      return new Response(JSON.stringify({
        ...analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          domainsAnalyzed: domainData.map(d => d.domain),
          totalDataPoints: domainData.reduce((sum, d) => sum + d.count, 0),
          agentsAvailable: agents?.length || 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'recommend') {
      // Fetch persona permissions and filter domains
      const personaPermissions = await fetchPersonaPermissions();
      const accessibleDomains = getAccessibleDomains(personaPermissions);
      
      // Get strategic recommendations from accessible domains only
      const domainData = await fetchDomainData(accessibleDomains);
      
      const contextSummary = domainData.map(dd => ({
        domain: dd.domain,
        count: dd.count,
        recentItems: dd.items.slice(0, 5).map(item => ({
          title: item.title || item.subject || item.name,
          status: item.status,
          priority: item.priority,
          date: item.created_at || item.sent_at
        }))
      }));

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { 
              role: 'system', 
              content: `You are Atlas, providing strategic recommendations for enterprise operations.

Based on the organizational data, provide:
1. Immediate actions (next 24-48 hours)
2. Short-term improvements (next 1-2 weeks)
3. Strategic initiatives (next quarter)
4. Resource optimization suggestions

Respond with JSON:
{
  "immediate": [{"action": "description", "rationale": "why now", "impact": "expected outcome"}],
  "shortTerm": [{"action": "description", "timeline": "specific timeframe", "resources": "what's needed"}],
  "strategic": [{"initiative": "description", "goal": "objective", "kpis": ["metric1", "metric2"]}],
  "optimization": [{"area": "focus area", "suggestion": "what to do", "benefit": "expected benefit"}]
}` 
            },
            { role: 'user', content: `${query ? `Focus: ${query}\n\n` : ''}Enterprise data summary:\n${JSON.stringify(contextSummary, null, 2)}` },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!aiResponse.ok) throw new Error('Recommendation generation failed');

      const aiData = await aiResponse.json();
      let recommendations;
      try {
        recommendations = JSON.parse(aiData.choices[0].message.content);
      } catch {
        recommendations = { immediate: [], shortTerm: [], strategic: [], optimization: [] };
      }

      return new Response(JSON.stringify({
        ...recommendations,
        generatedAt: new Date().toISOString(),
        basedOn: domainData.map(d => ({ domain: d.domain, itemCount: d.count }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'workflow_trigger') {
      // Execute a workflow with enterprise context
      if (!workflowId) {
        return new Response(JSON.stringify({ error: 'workflowId required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get the workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('atlas_workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('user_id', userId)
        .single();

      if (workflowError || !workflow) {
        return new Response(JSON.stringify({ error: 'Workflow not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Fetch enterprise context for the workflow
      const domainData = await fetchDomainData();
      
      // Create workflow run
      const { data: run, error: runError } = await supabase
        .from('atlas_workflow_runs')
        .insert({
          workflow_id: workflowId,
          user_id: userId,
          status: 'running',
          trigger_data: {
            source: 'enterprise_query',
            query,
            domainContext: domainData.map(d => ({ domain: d.domain, count: d.count }))
          }
        })
        .select()
        .single();

      if (runError) throw runError;

      // Execute workflow action with enterprise context
      const actionConfig = workflow.action_config as any;
      let result: any = { status: 'completed' };

      try {
        if (workflow.action_type === 'generate_summary') {
          // Generate summary using enterprise data
          const summaryResponse = await fetch(`${supabaseUrl}/functions/v1/atlas-generate-summary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, requirements: actionConfig?.requirements })
          });
          result = await summaryResponse.json();
        } else if (workflow.action_type === 'create_task') {
          // Create task based on enterprise analysis
          const { data: task, error: taskError } = await supabase
            .from('csuite_tasks')
            .insert({
              user_id: userId,
              title: actionConfig?.title || 'Auto-generated task',
              description: actionConfig?.description || query,
              priority: actionConfig?.priority || 'medium',
              source: 'atlas_workflow',
              status: 'pending'
            })
            .select()
            .single();
          
          if (taskError) throw taskError;
          result = { taskCreated: task };
        }

        // Update workflow run as completed
        await supabase
          .from('atlas_workflow_runs')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString(),
            result_data: result 
          })
          .eq('id', run.id);

        // Update workflow stats
        await supabase
          .from('atlas_workflows')
          .update({ 
            last_triggered_at: new Date().toISOString(),
            trigger_count: (workflow.trigger_count || 0) + 1
          })
          .eq('id', workflowId);

      } catch (execError) {
        await supabase
          .from('atlas_workflow_runs')
          .update({ 
            status: 'failed', 
            completed_at: new Date().toISOString(),
            error_message: execError instanceof Error ? execError.message : 'Unknown error'
          })
          .eq('id', run.id);
        
        throw execError;
      }

      return new Response(JSON.stringify({
        workflowId,
        runId: run.id,
        status: 'completed',
        result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Atlas Enterprise] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
