-- Create code evolution tracking table
CREATE TABLE public.code_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'agent', -- agent, workflow, capability, function
  entity_id TEXT,
  entity_name TEXT NOT NULL,
  
  -- Sonic Signature for code entities
  sonic_signature JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {complexity_score, dependency_depth, evolution_generation, semantic_hash, capability_vector}
  
  -- Evolution tracking
  evolution_type TEXT NOT NULL DEFAULT 'improvement', -- improvement, new_feature, refactor, optimization
  evolution_status TEXT NOT NULL DEFAULT 'proposed', -- proposed, approved, applied, rejected, rolled_back
  
  -- Source and target code
  source_code TEXT,
  evolved_code TEXT,
  
  -- Analysis results
  improvement_analysis JSONB DEFAULT '{}'::jsonb,
  compatibility_score NUMERIC(5,4) DEFAULT 0,
  performance_impact JSONB DEFAULT '{}'::jsonb,
  risk_assessment JSONB DEFAULT '{}'::jsonb,
  
  -- Integration tracking
  integration_plan JSONB DEFAULT '{}'::jsonb,
  applied_at TIMESTAMPTZ,
  applied_by UUID,
  rollback_available BOOLEAN DEFAULT true,
  rollback_data JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.code_evolutions ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can access
CREATE POLICY "Admins can view code evolutions"
ON public.code_evolutions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert code evolutions"
ON public.code_evolutions
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update code evolutions"
ON public.code_evolutions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete code evolutions"
ON public.code_evolutions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index for efficient queries
CREATE INDEX idx_code_evolutions_user ON public.code_evolutions(user_id);
CREATE INDEX idx_code_evolutions_status ON public.code_evolutions(evolution_status);
CREATE INDEX idx_code_evolutions_entity ON public.code_evolutions(entity_type, entity_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_evolutions;