import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  connectorId: string;
  platform: string;
  syncType: 'full' | 'incremental';
}

interface SyncResult {
  success: boolean;
  itemsSynced: number;
  newItems: number;
  updatedItems: number;
  errors: string[];
  syncDuration: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { connectorId, platform, syncType }: SyncRequest = await req.json();

    console.log(`[data-connector-sync] Starting ${syncType} sync for ${platform} (connector: ${connectorId})`);

    const startTime = Date.now();

    // Get connector details
    const { data: connector, error: connectorError } = await supabase
      .from('csuite_connectors')
      .select('*')
      .eq('id', connectorId)
      .eq('user_id', user.id)
      .single();

    if (connectorError || !connector) {
      console.error('[data-connector-sync] Connector not found:', connectorError);
      return new Response(
        JSON.stringify({ error: 'Connector not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update connector status to syncing
    await supabase
      .from('csuite_connectors')
      .update({ status: 'syncing' })
      .eq('id', connectorId);

    // Simulate sync based on platform
    // In production, this would call actual APIs
    const result = await simulateSync(platform, syncType, connector);

    // Store synced data based on platform type
    if (platform === 'gmail' || platform === 'outlook') {
      // Create sample communications
      const sampleComms = generateSampleCommunications(user.id, platform, result.newItems);
      if (sampleComms.length > 0) {
        await supabase.from('csuite_communications').insert(sampleComms);
      }
    } else if (platform === 'gdrive' || platform === 'dropbox') {
      // Create sample documents
      const sampleDocs = generateSampleDocuments(user.id, platform, result.newItems);
      if (sampleDocs.length > 0) {
        await supabase.from('csuite_documents').insert(sampleDocs);
      }
    } else if (platform === 'calendar') {
      // Create sample events
      const sampleEvents = generateSampleEvents(user.id, result.newItems);
      if (sampleEvents.length > 0) {
        await supabase.from('csuite_events').insert(sampleEvents);
      }
    }

    const syncDuration = Date.now() - startTime;

    // Update connector with sync results
    const previousItemsSynced = connector.metadata?.items_synced || 0;
    await supabase
      .from('csuite_connectors')
      .update({
        status: 'connected',
        last_sync_at: new Date().toISOString(),
        metadata: {
          ...connector.metadata,
          items_synced: previousItemsSynced + result.itemsSynced,
          last_sync_duration: syncDuration,
          last_sync_result: {
            newItems: result.newItems,
            updatedItems: result.updatedItems,
            errors: result.errors
          }
        }
      })
      .eq('id', connectorId);

    console.log(`[data-connector-sync] Sync completed: ${result.itemsSynced} items in ${syncDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        itemsSynced: result.itemsSynced,
        newItems: result.newItems,
        updatedItems: result.updatedItems,
        syncDuration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[data-connector-sync] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function simulateSync(
  platform: string, 
  syncType: string, 
  connector: any
): Promise<SyncResult> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const isFullSync = syncType === 'full';
  const baseItems = isFullSync ? 50 : 10;
  const variance = Math.floor(Math.random() * 20);

  return {
    success: true,
    itemsSynced: baseItems + variance,
    newItems: Math.floor((baseItems + variance) * 0.7),
    updatedItems: Math.floor((baseItems + variance) * 0.3),
    errors: [],
    syncDuration: 0 // Will be calculated by caller
  };
}

function generateSampleCommunications(userId: string, platform: string, count: number) {
  const subjects = [
    'Q4 Financial Review',
    'Team Meeting Follow-up',
    'Project Update Required',
    'Budget Approval Request',
    'Weekly Status Report',
    'Partnership Opportunity',
    'Customer Feedback Summary',
    'Action Items from Board Meeting'
  ];

  const senders = [
    'john.smith@company.com',
    'sarah.johnson@partner.com',
    'mike.chen@vendor.com',
    'lisa.brown@client.com'
  ];

  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    user_id: userId,
    type: 'email',
    source: platform,
    subject: subjects[i % subjects.length],
    from_address: senders[i % senders.length],
    to_addresses: ['user@example.com'],
    content: `This is a synced email from ${platform}. Important information regarding ${subjects[i % subjects.length].toLowerCase()}.`,
    sent_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { synced_from: platform, sync_time: new Date().toISOString() }
  }));
}

function generateSampleDocuments(userId: string, platform: string, count: number) {
  const titles = [
    'Q4 Business Plan.pdf',
    'Financial Projections 2024.xlsx',
    'Marketing Strategy.docx',
    'Product Roadmap.pptx',
    'Team Structure.pdf',
    'Investor Deck.pptx',
    'Meeting Notes.docx',
    'Contract Draft.pdf'
  ];

  const types = ['pdf', 'spreadsheet', 'document', 'presentation'];

  return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
    user_id: userId,
    source: platform,
    title: titles[i % titles.length],
    type: types[i % types.length],
    file_path: `/${platform}/${titles[i % titles.length]}`,
    file_size: Math.floor(Math.random() * 5000000),
    mime_type: 'application/pdf',
    content: `Document content from ${platform}`,
    metadata: { synced_from: platform, sync_time: new Date().toISOString() }
  }));
}

function generateSampleEvents(userId: string, count: number) {
  const titles = [
    'Board Meeting',
    'Weekly Team Standup',
    'Client Presentation',
    'Strategy Review',
    'Budget Planning',
    'Quarterly Review',
    'Product Demo',
    '1:1 with Manager'
  ];

  const now = Date.now();
  
  return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
    user_id: userId,
    source: 'calendar',
    title: titles[i % titles.length],
    type: 'meeting',
    start_at: new Date(now + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
    end_at: new Date(now + (i + 1) * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    location: 'Conference Room A',
    attendees: ['team@company.com'],
    description: `Scheduled event: ${titles[i % titles.length]}`,
    metadata: { synced_from: 'calendar', sync_time: new Date().toISOString() }
  }));
}
