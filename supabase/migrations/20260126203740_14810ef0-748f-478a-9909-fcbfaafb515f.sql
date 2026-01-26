-- Phase 2: Advanced Learning System
-- Add specialization scoring and semantic capabilities

-- Add task type specialization tracking to sonic_agents
ALTER TABLE public.sonic_agents 
ADD COLUMN IF NOT EXISTS task_specializations JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS preferred_task_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS learning_velocity NUMERIC DEFAULT 0.5;

-- Create agent task specialization scores table for detailed tracking
CREATE TABLE IF NOT EXISTS public.agent_task_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.sonic_agents(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_execution_time_ms BIGINT DEFAULT 0,
  avg_confidence NUMERIC DEFAULT 0,
  avg_user_satisfaction NUMERIC DEFAULT 0,
  specialization_score NUMERIC DEFAULT 0,
  last_performed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, task_type)
);

-- Create semantic memory index for vector similarity search
-- Note: Using text-based semantic search since we have embedding column in agent_memory
CREATE INDEX IF NOT EXISTS idx_agent_memory_content_search 
ON public.agent_memory USING gin(to_tsvector('english', content));

-- Create agent learning events table for tracking learning progression
CREATE TABLE IF NOT EXISTS public.agent_learning_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.sonic_agents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'skill_gained', 'specialization_up', 'relationship_formed', 'memory_consolidated'
  event_data JSONB DEFAULT '{}'::JSONB,
  impact_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to calculate and update task specialization scores
CREATE OR REPLACE FUNCTION public.update_task_specialization_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID;
  v_task_type TEXT;
  v_new_score NUMERIC;
  v_learning_velocity NUMERIC;
BEGIN
  v_agent_id := NEW.agent_id;
  v_task_type := NEW.task_type;
  
  -- Get agent's learning velocity
  SELECT COALESCE(learning_velocity, 0.5) INTO v_learning_velocity
  FROM sonic_agents WHERE id = v_agent_id;
  
  -- Upsert task score record
  INSERT INTO agent_task_scores (agent_id, task_type, success_count, failure_count, 
    total_execution_time_ms, avg_confidence, avg_user_satisfaction, last_performed_at)
  VALUES (
    v_agent_id, 
    v_task_type,
    CASE WHEN NEW.success THEN 1 ELSE 0 END,
    CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    COALESCE(NEW.execution_time_ms, 0),
    COALESCE(NEW.confidence_score, 0),
    COALESCE(NEW.user_satisfaction, 0),
    now()
  )
  ON CONFLICT (agent_id, task_type) DO UPDATE SET
    success_count = agent_task_scores.success_count + CASE WHEN NEW.success THEN 1 ELSE 0 END,
    failure_count = agent_task_scores.failure_count + CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
    total_execution_time_ms = agent_task_scores.total_execution_time_ms + COALESCE(NEW.execution_time_ms, 0),
    avg_confidence = (agent_task_scores.avg_confidence * (agent_task_scores.success_count + agent_task_scores.failure_count) + COALESCE(NEW.confidence_score, 0)) 
                     / NULLIF(agent_task_scores.success_count + agent_task_scores.failure_count + 1, 0),
    avg_user_satisfaction = CASE 
      WHEN NEW.user_satisfaction IS NOT NULL THEN
        (agent_task_scores.avg_user_satisfaction * (agent_task_scores.success_count + agent_task_scores.failure_count) + NEW.user_satisfaction) 
        / NULLIF(agent_task_scores.success_count + agent_task_scores.failure_count + 1, 0)
      ELSE agent_task_scores.avg_user_satisfaction
    END,
    last_performed_at = now(),
    updated_at = now();
  
  -- Calculate new specialization score
  SELECT 
    LEAST(1.0, (
      (success_count::NUMERIC / NULLIF(success_count + failure_count, 0)) * 0.4 +  -- Success rate weight
      LEAST(1.0, (success_count + failure_count)::NUMERIC / 50) * 0.3 +  -- Experience weight (caps at 50 tasks)
      avg_confidence * 0.2 +  -- Confidence weight
      COALESCE(avg_user_satisfaction, 0.5) * 0.1  -- User satisfaction weight
    ) * (1 + v_learning_velocity * 0.2))  -- Learning velocity boost
  INTO v_new_score
  FROM agent_task_scores
  WHERE agent_id = v_agent_id AND task_type = v_task_type;
  
  -- Update specialization score
  UPDATE agent_task_scores 
  SET specialization_score = COALESCE(v_new_score, 0)
  WHERE agent_id = v_agent_id AND task_type = v_task_type;
  
  -- Update agent's task_specializations JSONB and preferred_task_types
  UPDATE sonic_agents
  SET 
    task_specializations = (
      SELECT jsonb_object_agg(task_type, specialization_score)
      FROM agent_task_scores
      WHERE agent_id = v_agent_id AND specialization_score > 0
    ),
    preferred_task_types = (
      SELECT array_agg(task_type ORDER BY specialization_score DESC)
      FROM agent_task_scores
      WHERE agent_id = v_agent_id AND specialization_score >= 0.6
      LIMIT 5
    )
  WHERE id = v_agent_id;
  
  -- Log learning event if significant specialization gained
  IF v_new_score >= 0.7 THEN
    INSERT INTO agent_learning_events (agent_id, event_type, event_data, impact_score)
    VALUES (
      v_agent_id, 
      'specialization_up',
      jsonb_build_object('task_type', v_task_type, 'new_score', v_new_score),
      v_new_score
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update specialization after performance records
DROP TRIGGER IF EXISTS update_specialization_on_performance ON public.agent_performance;
CREATE TRIGGER update_specialization_on_performance
  AFTER INSERT ON public.agent_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_specialization_score();

-- Function to find best agents for a task type
CREATE OR REPLACE FUNCTION public.find_best_agents_for_task(
  p_task_type TEXT,
  p_sector TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  sector TEXT,
  specialization_score NUMERIC,
  success_rate NUMERIC,
  total_tasks INTEGER,
  avg_confidence NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id AS agent_id,
    sa.name AS agent_name,
    sa.sector::TEXT AS sector,
    COALESCE(ats.specialization_score, 0) AS specialization_score,
    COALESCE(sa.success_rate, 0) AS success_rate,
    COALESCE(ats.success_count + ats.failure_count, 0) AS total_tasks,
    COALESCE(ats.avg_confidence, 0) AS avg_confidence
  FROM sonic_agents sa
  LEFT JOIN agent_task_scores ats ON sa.id = ats.agent_id AND ats.task_type = p_task_type
  WHERE 
    sa.status != 'DORMANT'
    AND (p_sector IS NULL OR sa.sector::TEXT = p_sector)
  ORDER BY 
    COALESCE(ats.specialization_score, 0) DESC,
    COALESCE(sa.success_rate, 0) DESC,
    COALESCE(sa.total_tasks_completed, 0) DESC
  LIMIT p_limit;
END;
$$;

-- Function to search agent memories semantically
CREATE OR REPLACE FUNCTION public.search_agent_memories(
  p_agent_id UUID,
  p_search_query TEXT,
  p_memory_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  memory_type TEXT,
  content TEXT,
  importance_score NUMERIC,
  created_at TIMESTAMPTZ,
  relevance_rank REAL
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.id,
    am.memory_type,
    am.content,
    am.importance_score::NUMERIC,
    am.created_at,
    ts_rank(to_tsvector('english', am.content), plainto_tsquery('english', p_search_query)) AS relevance_rank
  FROM agent_memory am
  WHERE 
    am.agent_id = p_agent_id
    AND (p_memory_type IS NULL OR am.memory_type = p_memory_type)
    AND to_tsvector('english', am.content) @@ plainto_tsquery('english', p_search_query)
  ORDER BY 
    relevance_rank DESC,
    am.importance_score DESC,
    am.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.agent_task_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_learning_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_task_scores (read via agent ownership)
CREATE POLICY "Users can view task scores for their agents"
  ON public.agent_task_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_agents ua
      WHERE ua.agent_id = agent_task_scores.agent_id
      AND ua.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'superadmin')
  );

-- RLS policies for agent_learning_events
CREATE POLICY "Users can view learning events for their agents"
  ON public.agent_learning_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_agents ua
      WHERE ua.agent_id = agent_learning_events.agent_id
      AND ua.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'superadmin')
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_task_scores_agent ON public.agent_task_scores(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_task_scores_type ON public.agent_task_scores(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_task_scores_score ON public.agent_task_scores(specialization_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_learning_events_agent ON public.agent_learning_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_learning_events_type ON public.agent_learning_events(event_type);