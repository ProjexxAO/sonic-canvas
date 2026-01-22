-- Custom widgets table to store user-created widget definitions
CREATE TABLE public.custom_widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  widget_type TEXT NOT NULL DEFAULT 'data-display',
  config JSONB NOT NULL DEFAULT '{}',
  data_sources TEXT[] DEFAULT '{}',
  ai_capabilities JSONB DEFAULT '{}',
  layout JSONB DEFAULT '{"colSpan": 2, "rowSpan": 1}',
  style JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by_atlas BOOLEAN DEFAULT true,
  generation_prompt TEXT,
  agent_chain TEXT[],
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_widgets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own custom widgets"
  ON public.custom_widgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom widgets"
  ON public.custom_widgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom widgets"
  ON public.custom_widgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom widgets"
  ON public.custom_widgets FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_widgets_updated_at
  BEFORE UPDATE ON public.custom_widgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();