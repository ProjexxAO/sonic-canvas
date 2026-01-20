-- Email Tracking & Analytics table
CREATE TABLE public.email_tracking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.communication_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam', 'unsubscribed')),
  recipient_email TEXT,
  link_url TEXT,
  link_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  geo_location JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email tracking aggregates for quick analytics
CREATE TABLE public.email_tracking_aggregates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('day', 'week', 'month')),
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,
  unique_opens INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2),
  click_rate NUMERIC(5,2),
  bounce_rate NUMERIC(5,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mail merge campaigns table
CREATE TABLE public.mail_merge_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  body_html_template TEXT,
  from_address TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'paused', 'completed', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  platform TEXT DEFAULT 'internal',
  merge_fields TEXT[],
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mail merge recipients
CREATE TABLE public.mail_merge_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.mail_merge_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  merge_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed')),
  message_id UUID REFERENCES public.communication_messages(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  tracking_events JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Zapier/Webhook integrations
CREATE TABLE public.automation_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  webhook_url TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'zapier' CHECK (provider IN ('zapier', 'make', 'n8n', 'custom')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('email_received', 'email_sent', 'contact_added', 'campaign_completed', 'tracking_event', 'custom')),
  trigger_conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  headers JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sync jobs for background processing
CREATE TABLE public.email_sync_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform_connection_id UUID REFERENCES public.platform_connections(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('full_sync', 'incremental_sync', 'send_pending', 'tracking_update')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  sync_cursor TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_merge_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_merge_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sync_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_tracking_events
CREATE POLICY "Users can view their own tracking events"
  ON public.email_tracking_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking events"
  ON public.email_tracking_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for email_tracking_aggregates
CREATE POLICY "Users can view their own tracking aggregates"
  ON public.email_tracking_aggregates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tracking aggregates"
  ON public.email_tracking_aggregates FOR ALL
  USING (auth.uid() = user_id);

-- RLS policies for mail_merge_campaigns
CREATE POLICY "Users can view their own campaigns"
  ON public.mail_merge_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own campaigns"
  ON public.mail_merge_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- RLS policies for mail_merge_recipients
CREATE POLICY "Users can view recipients of their campaigns"
  ON public.mail_merge_recipients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.mail_merge_campaigns c
    WHERE c.id = campaign_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage recipients of their campaigns"
  ON public.mail_merge_recipients FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.mail_merge_campaigns c
    WHERE c.id = campaign_id AND c.user_id = auth.uid()
  ));

-- RLS policies for automation_webhooks
CREATE POLICY "Users can view their own webhooks"
  ON public.automation_webhooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own webhooks"
  ON public.automation_webhooks FOR ALL
  USING (auth.uid() = user_id);

-- RLS policies for email_sync_jobs
CREATE POLICY "Users can view their own sync jobs"
  ON public.email_sync_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sync jobs"
  ON public.email_sync_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_email_tracking_events_message ON public.email_tracking_events(message_id);
CREATE INDEX idx_email_tracking_events_user_type ON public.email_tracking_events(user_id, event_type);
CREATE INDEX idx_email_tracking_events_created ON public.email_tracking_events(created_at DESC);

CREATE INDEX idx_email_tracking_aggregates_user_period ON public.email_tracking_aggregates(user_id, period_type, period_start);

CREATE INDEX idx_mail_merge_campaigns_user_status ON public.mail_merge_campaigns(user_id, status);
CREATE INDEX idx_mail_merge_recipients_campaign ON public.mail_merge_recipients(campaign_id, status);

CREATE INDEX idx_automation_webhooks_user_active ON public.automation_webhooks(user_id, is_active);
CREATE INDEX idx_automation_webhooks_trigger ON public.automation_webhooks(trigger_type, is_active);

CREATE INDEX idx_email_sync_jobs_status ON public.email_sync_jobs(status, scheduled_at);
CREATE INDEX idx_email_sync_jobs_user ON public.email_sync_jobs(user_id, platform);

-- Trigger for updated_at
CREATE TRIGGER update_email_tracking_aggregates_updated_at
  BEFORE UPDATE ON public.email_tracking_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mail_merge_campaigns_updated_at
  BEFORE UPDATE ON public.mail_merge_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mail_merge_recipients_updated_at
  BEFORE UPDATE ON public.mail_merge_recipients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_webhooks_updated_at
  BEFORE UPDATE ON public.automation_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_sync_jobs_updated_at
  BEFORE UPDATE ON public.email_sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();