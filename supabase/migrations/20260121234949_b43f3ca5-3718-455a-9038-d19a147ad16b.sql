-- Create table for user dashboard preferences
CREATE TABLE IF NOT EXISTS public.user_dashboard_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  widget_order TEXT[] DEFAULT ARRAY[]::TEXT[],
  selected_shortcuts TEXT[] DEFAULT ARRAY['tasks', 'goals', 'habits', 'email', 'photos', 'finance']::TEXT[],
  columns INTEGER DEFAULT 2,
  layout_preset TEXT DEFAULT 'default',
  atlas_filter JSONB DEFAULT '{"priority": "smart"}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own dashboard preferences"
  ON public.user_dashboard_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard preferences"
  ON public.user_dashboard_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard preferences"
  ON public.user_dashboard_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_dashboard_preferences_updated_at
  BEFORE UPDATE ON public.user_dashboard_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();