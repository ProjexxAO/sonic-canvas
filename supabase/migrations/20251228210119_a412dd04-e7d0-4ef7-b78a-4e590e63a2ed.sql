-- =============================================
-- 1. USER UI PREFERENCES TABLE
-- =============================================
CREATE TABLE public.user_ui_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Layout preferences
  layout_config JSONB DEFAULT '{
    "sidebar_collapsed": false,
    "dashboard_card_order": ["communications", "documents", "events", "financials", "tasks", "knowledge"],
    "hidden_sections": [],
    "panel_sizes": {}
  }'::jsonb,
  
  -- Theme preferences
  theme_config JSONB DEFAULT '{
    "mode": "system",
    "density": "comfortable",
    "font_size": "medium",
    "accent_color": null,
    "animations_enabled": true
  }'::jsonb,
  
  -- Default view preferences
  defaults_config JSONB DEFAULT '{
    "default_tab": "command",
    "default_view_mode": "list",
    "saved_filters": {},
    "default_sort_orders": {},
    "pinned_items": []
  }'::jsonb,
  
  -- Quick access / shortcuts
  shortcuts_config JSONB DEFAULT '{
    "pinned_agents": [],
    "favorite_reports": [],
    "quick_actions": []
  }'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_ui_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view/manage their own preferences
CREATE POLICY "Users can view their own UI preferences"
  ON public.user_ui_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own UI preferences"
  ON public.user_ui_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own UI preferences"
  ON public.user_ui_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- 2. AGENT ORCHESTRATION TABLES
-- =============================================

-- Agent task queue for orchestration
CREATE TABLE public.agent_task_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Task details
  task_type TEXT NOT NULL, -- 'automation', 'notification', 'analysis', 'assistance', 'background'
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Agent assignment
  assigned_agents UUID[] DEFAULT '{}',
  orchestration_mode TEXT DEFAULT 'hybrid', -- 'automatic', 'user_directed', 'hybrid', 'autonomous'
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'awaiting_approval', 'completed', 'failed', 'cancelled'
  progress INTEGER DEFAULT 0, -- 0-100
  
  -- Results and context
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  agent_suggestions JSONB DEFAULT '[]', -- suggestions for user to approve/modify
  
  -- Timing
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_task_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON public.agent_task_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
  ON public.agent_task_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.agent_task_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.agent_task_queue FOR DELETE
  USING (auth.uid() = user_id);

-- Agent notifications for proactive alerts
CREATE TABLE public.agent_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Notification details
  notification_type TEXT NOT NULL, -- 'alert', 'recommendation', 'update', 'reminder', 'insight'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Source agent
  source_agent_id UUID,
  source_agent_name TEXT,
  
  -- Action items
  action_items JSONB DEFAULT '[]', -- [{ label, action_type, action_data }]
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  is_actioned BOOLEAN DEFAULT false,
  
  -- Context
  related_entity_type TEXT, -- 'task', 'document', 'financial', 'event', etc.
  related_entity_id UUID,
  metadata JSONB DEFAULT '{}',
  
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.agent_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.agent_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.agent_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.agent_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Agent capability registry (what each agent can do)
CREATE TABLE public.agent_capabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.sonic_agents(id) ON DELETE CASCADE,
  
  -- Capability definition
  capability_name TEXT NOT NULL,
  capability_type TEXT NOT NULL, -- 'automation', 'analysis', 'notification', 'integration', 'processing'
  description TEXT,
  
  -- Trigger conditions
  trigger_conditions JSONB DEFAULT '{}', -- when this capability should be invoked
  
  -- Permissions and constraints
  requires_approval BOOLEAN DEFAULT false,
  max_autonomous_actions INTEGER DEFAULT 10,
  cooldown_seconds INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_invoked_at TIMESTAMP WITH TIME ZONE,
  invocation_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(agent_id, capability_name)
);

ALTER TABLE public.agent_capabilities ENABLE ROW LEVEL SECURITY;

-- Anyone can view capabilities (for agent selection)
CREATE POLICY "Authenticated users can view agent capabilities"
  ON public.agent_capabilities FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only superadmins can manage capabilities
CREATE POLICY "Superadmins can manage agent capabilities"
  ON public.agent_capabilities FOR ALL
  USING (has_role(auth.uid(), 'superadmin'))
  WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- Trigger for updated_at
CREATE TRIGGER update_user_ui_preferences_updated_at
  BEFORE UPDATE ON public.user_ui_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_task_queue_updated_at
  BEFORE UPDATE ON public.agent_task_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_capabilities_updated_at
  BEFORE UPDATE ON public.agent_capabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_user_ui_preferences_user_id ON public.user_ui_preferences(user_id);
CREATE INDEX idx_agent_task_queue_user_status ON public.agent_task_queue(user_id, status);
CREATE INDEX idx_agent_task_queue_scheduled ON public.agent_task_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_agent_notifications_user_unread ON public.agent_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_agent_capabilities_agent_id ON public.agent_capabilities(agent_id);