-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create atlas_workflows table for automated workflows
CREATE TABLE public.atlas_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create atlas_workflow_runs table for execution history
CREATE TABLE public.atlas_workflow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.atlas_workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  trigger_data JSONB DEFAULT '{}'::jsonb,
  result_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.atlas_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_workflow_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for atlas_workflows
CREATE POLICY "Users can view their own workflows" 
  ON public.atlas_workflows FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows" 
  ON public.atlas_workflows FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows" 
  ON public.atlas_workflows FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows" 
  ON public.atlas_workflows FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for atlas_workflow_runs
CREATE POLICY "Users can view their own workflow runs" 
  ON public.atlas_workflow_runs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflow runs" 
  ON public.atlas_workflow_runs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_atlas_workflows_updated_at
  BEFORE UPDATE ON public.atlas_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();