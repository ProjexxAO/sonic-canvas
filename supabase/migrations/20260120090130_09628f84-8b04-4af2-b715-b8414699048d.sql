-- Create knowledge discoveries table
CREATE TABLE public.knowledge_discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  detailed_content TEXT,
  source_query TEXT,
  confidence_score NUMERIC DEFAULT 0.8,
  application_areas TEXT[] DEFAULT '{}',
  is_applied BOOLEAN DEFAULT false,
  applied_to TEXT[],
  applied_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_discoveries ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read discoveries (shared knowledge)
CREATE POLICY "Anyone can view discoveries" 
ON public.knowledge_discoveries 
FOR SELECT 
USING (true);

-- Only system can insert (via edge function with service role)
CREATE POLICY "Service can insert discoveries" 
ON public.knowledge_discoveries 
FOR INSERT 
WITH CHECK (true);

-- Index for efficient queries
CREATE INDEX idx_knowledge_discoveries_domain ON public.knowledge_discoveries(domain);
CREATE INDEX idx_knowledge_discoveries_applied ON public.knowledge_discoveries(is_applied);
CREATE INDEX idx_knowledge_discoveries_created ON public.knowledge_discoveries(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_discoveries;