-- =============================================
-- PHASE 1: Agent Memory & Sonic DNA Embedding System
-- =============================================

-- Table: Agent Memory - Stores per-agent learning and interaction history
CREATE TABLE public.agent_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.sonic_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'interaction',
  content TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  embedding VECTOR(1536),
  importance_score NUMERIC(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_memory_type CHECK (memory_type IN ('interaction', 'preference', 'outcome', 'feedback', 'learning'))
);

-- Table: Agent Performance Metrics - Tracks success/failure and optimization data
CREATE TABLE public.agent_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.sonic_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  task_description TEXT,
  success BOOLEAN NOT NULL,
  execution_time_ms INTEGER,
  confidence_score NUMERIC(3,2),
  user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
  error_type TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: Sonic DNA Embeddings - Stores behavioral fingerprints derived from Sonic signatures
CREATE TABLE public.sonic_dna_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.sonic_agents(id) ON DELETE CASCADE UNIQUE,
  sonic_signature JSONB NOT NULL,
  behavioral_embedding VECTOR(256),
  personality_traits JSONB DEFAULT '{}',
  specialization_score JSONB DEFAULT '{}',
  affinity_matrix JSONB DEFAULT '{}',
  last_calibrated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  calibration_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: Agent Relationships - Tracks which agents work well together
CREATE TABLE public.agent_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_a_id UUID NOT NULL REFERENCES public.sonic_agents(id) ON DELETE CASCADE,
  agent_b_id UUID NOT NULL REFERENCES public.sonic_agents(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'collaboration',
  synergy_score NUMERIC(3,2) DEFAULT 0.5,
  interaction_count INTEGER DEFAULT 0,
  success_rate NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_agents CHECK (agent_a_id != agent_b_id),
  CONSTRAINT unique_relationship UNIQUE (agent_a_id, agent_b_id)
);

-- Add new columns to sonic_agents for aggregate metrics
ALTER TABLE public.sonic_agents 
ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_rate NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_confidence NUMERIC(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS specialization_level TEXT DEFAULT 'novice',
ADD COLUMN IF NOT EXISTS learning_velocity NUMERIC(4,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS last_performance_update TIMESTAMP WITH TIME ZONE;

-- Enable RLS on all new tables
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sonic_dna_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_memory
CREATE POLICY "Users can view memory for their agents"
ON public.agent_memory FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create memory for their agents"
ON public.agent_memory FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update memory for their agents"
ON public.agent_memory FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete memory for their agents"
ON public.agent_memory FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for agent_performance
CREATE POLICY "Users can view performance for their agents"
ON public.agent_performance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create performance records for their agents"
ON public.agent_performance FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for sonic_dna_embeddings (linked through sonic_agents ownership)
CREATE POLICY "Users can view DNA embeddings for their agents"
ON public.sonic_dna_embeddings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_agents ua 
    WHERE ua.agent_id = sonic_dna_embeddings.agent_id 
    AND ua.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create DNA embeddings for their agents"
ON public.sonic_dna_embeddings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_agents ua 
    WHERE ua.agent_id = sonic_dna_embeddings.agent_id 
    AND ua.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update DNA embeddings for their agents"
ON public.sonic_dna_embeddings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_agents ua 
    WHERE ua.agent_id = sonic_dna_embeddings.agent_id 
    AND ua.user_id = auth.uid()
  )
);

-- RLS Policies for agent_relationships
CREATE POLICY "Users can view relationships for their agents"
ON public.agent_relationships FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_agents ua 
    WHERE (ua.agent_id = agent_relationships.agent_a_id OR ua.agent_id = agent_relationships.agent_b_id)
    AND ua.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create relationships for their agents"
ON public.agent_relationships FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_agents ua 
    WHERE ua.agent_id = agent_relationships.agent_a_id 
    AND ua.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update relationships for their agents"
ON public.agent_relationships FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_agents ua 
    WHERE (ua.agent_id = agent_relationships.agent_a_id OR ua.agent_id = agent_relationships.agent_b_id)
    AND ua.user_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_agent_memory_agent_id ON public.agent_memory(agent_id);
CREATE INDEX idx_agent_memory_user_id ON public.agent_memory(user_id);
CREATE INDEX idx_agent_memory_type ON public.agent_memory(memory_type);
CREATE INDEX idx_agent_performance_agent_id ON public.agent_performance(agent_id);
CREATE INDEX idx_agent_performance_task_type ON public.agent_performance(task_type);
CREATE INDEX idx_agent_relationships_agents ON public.agent_relationships(agent_a_id, agent_b_id);

-- Function to update agent aggregate metrics after performance record
CREATE OR REPLACE FUNCTION public.update_agent_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sonic_agents
  SET 
    total_tasks_completed = (
      SELECT COUNT(*) FROM public.agent_performance 
      WHERE agent_id = NEW.agent_id
    ),
    success_rate = (
      SELECT COALESCE(AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END), 0)
      FROM public.agent_performance 
      WHERE agent_id = NEW.agent_id
    ),
    avg_confidence = (
      SELECT COALESCE(AVG(confidence_score), 0)
      FROM public.agent_performance 
      WHERE agent_id = NEW.agent_id AND confidence_score IS NOT NULL
    ),
    specialization_level = CASE
      WHEN (SELECT COUNT(*) FROM public.agent_performance WHERE agent_id = NEW.agent_id) >= 100 THEN 'expert'
      WHEN (SELECT COUNT(*) FROM public.agent_performance WHERE agent_id = NEW.agent_id) >= 50 THEN 'proficient'
      WHEN (SELECT COUNT(*) FROM public.agent_performance WHERE agent_id = NEW.agent_id) >= 20 THEN 'competent'
      WHEN (SELECT COUNT(*) FROM public.agent_performance WHERE agent_id = NEW.agent_id) >= 5 THEN 'apprentice'
      ELSE 'novice'
    END,
    last_performance_update = now()
  WHERE id = NEW.agent_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-update metrics
CREATE TRIGGER trigger_update_agent_metrics
AFTER INSERT ON public.agent_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_agent_metrics();

-- Function to calculate Sonic DNA behavioral embedding components
CREATE OR REPLACE FUNCTION public.calculate_sonic_dna_traits(p_sonic_signature JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_waveform TEXT;
  v_frequency NUMERIC;
  v_modulation NUMERIC;
  v_density NUMERIC;
  v_traits JSONB;
BEGIN
  v_waveform := p_sonic_signature->>'waveform';
  v_frequency := COALESCE((p_sonic_signature->>'frequency')::NUMERIC, 440);
  v_modulation := COALESCE((p_sonic_signature->>'modulation')::NUMERIC, 5);
  v_density := COALESCE((p_sonic_signature->>'density')::NUMERIC, 50);
  
  -- Map sonic properties to personality traits
  v_traits := jsonb_build_object(
    'precision', CASE v_waveform
      WHEN 'sine' THEN 0.9
      WHEN 'square' THEN 0.7
      WHEN 'sawtooth' THEN 0.5
      WHEN 'triangle' THEN 0.8
      ELSE 0.5
    END,
    'energy', LEAST(1.0, v_frequency / 600),
    'adaptability', LEAST(1.0, v_modulation / 10),
    'depth', LEAST(1.0, v_density / 100),
    'creativity', CASE v_waveform
      WHEN 'sawtooth' THEN 0.9
      WHEN 'triangle' THEN 0.7
      WHEN 'square' THEN 0.6
      WHEN 'sine' THEN 0.5
      ELSE 0.5
    END,
    'stability', CASE v_waveform
      WHEN 'sine' THEN 0.95
      WHEN 'triangle' THEN 0.85
      WHEN 'square' THEN 0.75
      WHEN 'sawtooth' THEN 0.65
      ELSE 0.7
    END
  );
  
  RETURN v_traits;
END;
$$;

-- Trigger to auto-update sonic_dna_embeddings updated_at
CREATE TRIGGER update_sonic_dna_embeddings_updated_at
BEFORE UPDATE ON public.sonic_dna_embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update agent_relationships updated_at
CREATE TRIGGER update_agent_relationships_updated_at
BEFORE UPDATE ON public.agent_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();