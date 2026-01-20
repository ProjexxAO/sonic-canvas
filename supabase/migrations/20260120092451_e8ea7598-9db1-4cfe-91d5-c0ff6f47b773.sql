-- Create veracity evaluations table for storing plausibility assessments
CREATE TABLE public.veracity_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  statement TEXT NOT NULL,
  context TEXT,
  veracity_score NUMERIC(4,2) CHECK (veracity_score >= 0 AND veracity_score <= 1),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high', 'very_high')),
  plausibility_factors JSONB DEFAULT '[]'::jsonb,
  supporting_evidence JSONB DEFAULT '[]'::jsonb,
  contradicting_evidence JSONB DEFAULT '[]'::jsonb,
  knowledge_alignment_score NUMERIC(4,2),
  contextual_fit_score NUMERIC(4,2),
  source_reliability_score NUMERIC(4,2),
  citations TEXT[] DEFAULT '{}',
  evaluation_summary TEXT,
  related_discovery_id UUID REFERENCES public.knowledge_discoveries(id) ON DELETE SET NULL,
  evaluated_by TEXT DEFAULT 'system',
  user_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.veracity_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all veracity evaluations" 
ON public.veracity_evaluations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create veracity evaluations" 
ON public.veracity_evaluations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own evaluations" 
ON public.veracity_evaluations 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Index for faster lookups
CREATE INDEX idx_veracity_evaluations_score ON public.veracity_evaluations(veracity_score);
CREATE INDEX idx_veracity_evaluations_created ON public.veracity_evaluations(created_at DESC);
CREATE INDEX idx_veracity_evaluations_discovery ON public.veracity_evaluations(related_discovery_id);

-- Trigger for updated_at
CREATE TRIGGER update_veracity_evaluations_updated_at
BEFORE UPDATE ON public.veracity_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();