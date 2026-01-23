// Widget Update Checker - Research and apply best practices to widgets
// Uses AI to analyze widget configurations and suggest improvements

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WidgetUpdateRequest {
  action: 'check_updates' | 'apply_best_practices' | 'research_improvements' | 'safe_migrate';
  widgetId?: string;
  widgetType?: string;
  userId?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, widgetId, widgetType, userId, category } = await req.json() as WidgetUpdateRequest;

    switch (action) {
      case 'check_updates': {
        if (!widgetId || !userId) {
          return new Response(JSON.stringify({ error: 'Missing widgetId or userId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get the widget
        const { data: widget, error: widgetError } = await supabase
          .from('custom_widgets')
          .select('*')
          .eq('id', widgetId)
          .eq('user_id', userId)
          .single();

        if (widgetError || !widget) {
          return new Response(JSON.stringify({ error: 'Widget not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check for updates in registry
        const { data: registry } = await supabase
          .from('widget_update_registry')
          .select('*')
          .eq('widget_type', widget.widget_type)
          .order('latest_version', { ascending: false })
          .limit(1)
          .maybeSingle();

        const updateAvailable = registry && registry.latest_version > widget.version;

        // Update widget's check timestamp
        await supabase
          .from('custom_widgets')
          .update({
            last_update_check: new Date().toISOString(),
            update_available: updateAvailable,
            update_version: registry?.latest_version || widget.version,
          })
          .eq('id', widgetId);

        return new Response(JSON.stringify({
          updateAvailable,
          currentVersion: widget.version,
          latestVersion: registry?.latest_version || widget.version,
          improvements: registry?.improvements || [],
          breakingChanges: registry?.breaking_changes || false,
          securityNotes: registry?.security_notes,
          bestPractices: registry?.best_practices,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'research_improvements': {
        // Use AI to research best practices for widget type
        if (!widgetType || !category) {
          return new Response(JSON.stringify({ error: 'Missing widgetType or category' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
        if (!lovableApiKey) {
          return new Response(JSON.stringify({ error: 'AI service not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const researchPrompt = `Research the best practices for building a ${widgetType} widget in the ${category} domain for a personal dashboard application.

Focus on:
1. Data visualization best practices
2. User interaction patterns
3. Performance optimization
4. Accessibility requirements
5. Security considerations for user data
6. Mobile responsiveness

Return a JSON object with:
{
  "best_practices": {
    "visualization": ["practice1", "practice2"],
    "interaction": ["practice1", "practice2"],
    "performance": ["practice1", "practice2"],
    "accessibility": ["practice1", "practice2"],
    "security": ["practice1", "practice2"],
    "mobile": ["practice1", "practice2"]
  },
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "security_notes": "Key security considerations",
  "performance_tips": ["tip1", "tip2"]
}`;

        const aiResponse = await fetch('https://api.lovable.dev/api/chat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: researchPrompt }],
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
          }),
        });

        if (!aiResponse.ok) {
          throw new Error('AI research failed');
        }

        const aiData = await aiResponse.json();
        const researchResult = JSON.parse(aiData.choices[0].message.content);

        // Store in registry for future reference
        const { data: existingRegistry } = await supabase
          .from('widget_update_registry')
          .select('id, latest_version')
          .eq('widget_type', widgetType)
          .eq('category', category)
          .maybeSingle();

        const newVersion = (existingRegistry?.latest_version || 0) + 1;

        if (existingRegistry) {
          await supabase
            .from('widget_update_registry')
            .update({
              latest_version: newVersion,
              improvements: researchResult.improvements,
              best_practices: researchResult.best_practices,
              security_notes: researchResult.security_notes,
              performance_tips: researchResult.performance_tips,
              last_researched_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingRegistry.id);
        } else {
          await supabase
            .from('widget_update_registry')
            .insert({
              widget_type: widgetType,
              category,
              latest_version: newVersion,
              improvements: researchResult.improvements,
              best_practices: researchResult.best_practices,
              security_notes: researchResult.security_notes,
              performance_tips: researchResult.performance_tips,
            });
        }

        return new Response(JSON.stringify({
          success: true,
          version: newVersion,
          research: researchResult,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'safe_migrate': {
        if (!widgetId || !userId) {
          return new Response(JSON.stringify({ error: 'Missing widgetId or userId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get widget and registry
        const { data: widget } = await supabase
          .from('custom_widgets')
          .select('*')
          .eq('id', widgetId)
          .eq('user_id', userId)
          .single();

        if (!widget) {
          return new Response(JSON.stringify({ error: 'Widget not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: registry } = await supabase
          .from('widget_update_registry')
          .select('*')
          .eq('widget_type', widget.widget_type)
          .order('latest_version', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!registry || registry.latest_version <= widget.version) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Widget is already up to date' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Step 1: Create backup
        const { data: backup, error: backupError } = await supabase
          .from('widget_versions')
          .insert({
            widget_id: widgetId,
            user_id: userId,
            version_number: widget.version,
            config: widget.config,
            ai_capabilities: widget.ai_capabilities,
            data_sources: widget.data_sources,
            style: widget.style,
            layout: widget.layout,
            agent_chain: widget.agent_chain,
            generation_prompt: widget.generation_prompt,
            is_current: false,
            created_by: 'auto-update',
            change_summary: `Pre-migration backup v${widget.version} → v${registry.latest_version}`,
            rollback_available: true,
          })
          .select()
          .single();

        if (backupError) {
          return new Response(JSON.stringify({ 
            error: 'Failed to create backup', 
            details: backupError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Step 2: Apply migration (preserve user data, update configuration)
        const enhancedConfig = {
          ...widget.config,
          _migrated_from: widget.version,
          _migrated_at: new Date().toISOString(),
          _best_practices_applied: true,
        };

        const enhancedAICapabilities = {
          ...widget.ai_capabilities,
          bestPractices: registry.best_practices,
        };

        const { error: updateError } = await supabase
          .from('custom_widgets')
          .update({
            version: registry.latest_version,
            config: enhancedConfig,
            ai_capabilities: enhancedAICapabilities,
            update_available: false,
            last_update_check: new Date().toISOString(),
            security_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', widgetId);

        if (updateError) {
          // Rollback - restore from backup
          await supabase
            .from('custom_widgets')
            .update({
              version: widget.version,
              config: widget.config,
              ai_capabilities: widget.ai_capabilities,
            })
            .eq('id', widgetId);

          return new Response(JSON.stringify({ 
            error: 'Migration failed, rolled back', 
            details: updateError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Step 3: Create new version record
        await supabase
          .from('widget_versions')
          .insert({
            widget_id: widgetId,
            user_id: userId,
            version_number: registry.latest_version,
            version_name: registry.version_name,
            config: enhancedConfig,
            ai_capabilities: enhancedAICapabilities,
            data_sources: widget.data_sources,
            style: widget.style,
            layout: widget.layout,
            agent_chain: widget.agent_chain,
            generation_prompt: widget.generation_prompt,
            is_current: true,
            created_by: 'auto-update',
            change_summary: `Migrated to v${registry.latest_version} with best practices`,
            rollback_available: true,
          });

        return new Response(JSON.stringify({
          success: true,
          previousVersion: widget.version,
          newVersion: registry.latest_version,
          backupId: backup.id,
          improvements: registry.improvements,
          message: 'Widget safely migrated with backup created',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Widget update checker error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
