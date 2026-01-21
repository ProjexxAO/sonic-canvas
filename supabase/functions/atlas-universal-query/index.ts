import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UniversalSearchResult {
  id: string;
  hubType: 'personal' | 'group' | 'csuite';
  hubId?: string;
  itemType: string;
  title: string;
  content?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  source: 'personal' | 'group' | 'csuite';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, query, accessibleHubs } = await req.json();
    console.log(`Atlas Universal Query - User: ${userId}, Query: ${query}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather data from all accessible hubs
    const allData: UniversalSearchResult[] = [];
    const hubContexts: string[] = [];

    // Search Personal Hub
    if (accessibleHubs.includes('personal')) {
      const { data: personalItems } = await supabase
        .from('personal_items')
        .select('id, item_type, title, content, metadata, created_at, tags, status, priority, due_date')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: personalGoals } = await supabase
        .from('personal_goals')
        .select('id, title, description, category, status, target_value, current_value, created_at')
        .eq('user_id', userId)
        .limit(20);

      const { data: personalHabits } = await supabase
        .from('personal_habits')
        .select('id, name, description, frequency, current_streak, is_active, created_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(20);

      // Transform and add to results
      (personalItems || []).forEach((item: any) => {
        allData.push({
          id: item.id,
          hubType: 'personal',
          itemType: item.item_type,
          title: item.title,
          content: item.content,
          metadata: { ...item.metadata, status: item.status, priority: item.priority, tags: item.tags, dueDate: item.due_date },
          createdAt: item.created_at,
          source: 'personal',
        });
      });

      (personalGoals || []).forEach((goal: any) => {
        allData.push({
          id: goal.id,
          hubType: 'personal',
          itemType: 'goal',
          title: goal.title,
          content: goal.description,
          metadata: { category: goal.category, status: goal.status, progress: goal.target_value ? (goal.current_value / goal.target_value * 100) : 0 },
          createdAt: goal.created_at,
          source: 'personal',
        });
      });

      (personalHabits || []).forEach((habit: any) => {
        allData.push({
          id: habit.id,
          hubType: 'personal',
          itemType: 'habit',
          title: habit.name,
          content: habit.description,
          metadata: { frequency: habit.frequency, streak: habit.current_streak },
          createdAt: habit.created_at,
          source: 'personal',
        });
      });

      hubContexts.push(`Personal Hub: ${personalItems?.length || 0} items, ${personalGoals?.length || 0} goals, ${personalHabits?.length || 0} habits`);
    }

    // Search Group Hub
    if (accessibleHubs.includes('group')) {
      // Get user's groups
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, role, group_hubs!inner(id, name, description)')
        .eq('user_id', userId);

      if (memberships?.length) {
        const groupIds = memberships.map((m: any) => m.group_id);
        const groupMap = new Map(memberships.map((m: any) => [m.group_id, m.group_hubs?.name || 'Unknown']));

        const { data: groupItems } = await supabase
          .from('group_items')
          .select('id, group_id, item_type, title, content, metadata, status, priority, due_date, created_at')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false })
          .limit(50);

        (groupItems || []).forEach((item: any) => {
          allData.push({
            id: item.id,
            hubType: 'group',
            hubId: item.group_id,
            itemType: item.item_type,
            title: item.title,
            content: item.content,
            metadata: { ...item.metadata, groupName: groupMap.get(item.group_id), status: item.status, priority: item.priority },
            createdAt: item.created_at,
            source: 'group',
          });
        });

        hubContexts.push(`Group Hub: ${memberships.length} groups, ${groupItems?.length || 0} shared items`);
      }
    }

    // Search C-Suite Hub
    if (accessibleHubs.includes('csuite')) {
      const csuiteData: Record<string, any[]> = {};
      
      const tables = [
        { name: 'csuite_tasks', type: 'task' },
        { name: 'csuite_events', type: 'event' },
        { name: 'csuite_documents', type: 'document' },
        { name: 'csuite_communications', type: 'communication' },
        { name: 'csuite_financials', type: 'financial' },
        { name: 'csuite_knowledge', type: 'knowledge' },
      ];

      for (const table of tables) {
        const { data } = await supabase
          .from(table.name)
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        csuiteData[table.type] = data || [];

        (data || []).forEach((item: any) => {
          allData.push({
            id: item.id,
            hubType: 'csuite',
            itemType: table.type,
            title: item.title,
            content: item.content || item.description,
            metadata: item.metadata,
            createdAt: item.created_at,
            source: 'csuite',
          });
        });
      }

      const totalCsuite = Object.values(csuiteData).reduce((sum, arr) => sum + arr.length, 0);
      hubContexts.push(`C-Suite Hub: ${totalCsuite} items across ${tables.length} domains`);
    }

    // Build context for AI
    const dataContext = allData
      .slice(0, 100) // Limit to prevent token overflow
      .map(item => {
        const hubLabel = item.hubType === 'group' && item.metadata?.groupName 
          ? `${item.hubType}:${item.metadata.groupName}` 
          : item.hubType;
        return `[${hubLabel}/${item.itemType}] ${item.title}${item.content ? `: ${item.content.substring(0, 200)}` : ''}`;
      })
      .join('\n');

    // Use AI to answer the query
    const systemPrompt = `You are Atlas, an intelligent AI assistant with access to the user's data across multiple hubs:
${hubContexts.join('\n')}

You have comprehensive access to search and analyze data across:
- Personal Hub: Tasks, notes, goals, habits, events
- Group Hub: Shared team tasks, notes, resources
- C-Suite Hub: Enterprise data including communications, documents, financials, knowledge

When answering questions:
1. Search across all available data to find relevant information
2. Cite specific items when referencing data
3. Provide actionable insights and recommendations
4. Be concise but thorough
5. If no relevant data exists, say so clearly`;

    const userPrompt = `User Query: ${query}

Available Data:
${dataContext}

Based on the user's data across all accessible hubs, please answer their question. Reference specific items when relevant.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    // Find relevant sources based on query keywords
    const queryLower = query.toLowerCase();
    const relevantSources = allData
      .filter(item => {
        const titleMatch = item.title.toLowerCase().includes(queryLower);
        const contentMatch = item.content?.toLowerCase().includes(queryLower);
        return titleMatch || contentMatch;
      })
      .slice(0, 10);

    console.log(`Atlas Universal Query completed - Found ${allData.length} items, returned ${relevantSources.length} sources`);

    return new Response(JSON.stringify({
      answer,
      sources: relevantSources,
      hubSummary: hubContexts,
      totalItemsSearched: allData.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Atlas Universal Query error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Query failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
