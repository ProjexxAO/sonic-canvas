-- Create workspace tool permissions table
CREATE TABLE public.workspace_tool_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tool_id text NOT NULL,
  section text NOT NULL CHECK (section IN ('allowed', 'blocked', 'preferred', 'available')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id, tool_id)
);

-- Enable RLS
ALTER TABLE public.workspace_tool_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tool permissions"
ON public.workspace_tool_permissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tool permissions"
ON public.workspace_tool_permissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tool permissions"
ON public.workspace_tool_permissions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tool permissions"
ON public.workspace_tool_permissions
FOR DELETE
USING (auth.uid() = user_id);

-- Workspace admins can manage all permissions in their workspace
CREATE POLICY "Workspace admins can manage tool permissions"
ON public.workspace_tool_permissions
FOR ALL
USING (
  has_workspace_permission(auth.uid(), workspace_id, 'can_manage_members')
  OR has_role(auth.uid(), 'superadmin')
);

-- Create tool catalog table for available tools
CREATE TABLE public.tool_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'tool',
  category text,
  auto_invokable boolean DEFAULT false,
  capabilities text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS (readable by all authenticated users)
ALTER TABLE public.tool_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tool catalog"
ON public.tool_catalog
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage tool catalog"
ON public.tool_catalog
FOR ALL
USING (has_role(auth.uid(), 'superadmin'));

-- Insert sample tools
INSERT INTO public.tool_catalog (tool_id, name, description, icon, category, auto_invokable) VALUES
  ('market_trend_analyzer', 'Market Trend Analyzer', 'Detects market trends and competitive signals.', 'chart-line', 'Marketing', true),
  ('forecasting_engine', 'Forecasting Engine', 'Predicts future trends using ML models.', 'trending-up', 'Data Science', true),
  ('contract_risk_analyzer', 'Contract Risk Analyzer', 'Analyzes contracts for legal risks.', 'shield-alert', 'Legal', false),
  ('supply_chain_map', 'Supply Chain Map', 'Visualizes supply chain dependencies.', 'route', 'Operations', false),
  ('customer_sentiment_monitor', 'Customer Sentiment Monitor', 'Tracks customer sentiment in real-time.', 'message-circle', 'Support', true),
  ('financial_model_builder', 'Financial Model Builder', 'Builds scenario-based financial models.', 'calculator', 'Finance', false);