-- Tiered Intelligence: Deterministic Task Routing (Tier 1)
-- This enables instant agent selection without LLM calls

-- Create a function for instant deterministic routing
CREATE OR REPLACE FUNCTION public.tier1_deterministic_route(
  p_task_type TEXT,
  p_query TEXT DEFAULT NULL,
  p_confidence_threshold NUMERIC DEFAULT 0.7,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  sector TEXT,
  hierarchy_tier hierarchy_tier,
  seraphim_id UUID,
  specialization_score NUMERIC,
  success_rate NUMERIC,
  confidence NUMERIC,
  routing_reason TEXT,
  requires_llm_fallback BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_specialists BOOLEAN := FALSE;
  v_best_score NUMERIC := 0;
BEGIN
  -- Check if we have high-confidence specialists for this task type
  SELECT 
    EXISTS(
      SELECT 1 FROM agent_task_scores ats
      WHERE ats.task_type = p_task_type
        AND ats.specialization_score >= p_confidence_threshold
    ),
    COALESCE(MAX(ats.specialization_score), 0)
  INTO v_has_specialists, v_best_score
  FROM agent_task_scores ats
  WHERE ats.task_type = p_task_type;

  -- If we have proven specialists, return them (no LLM needed)
  IF v_has_specialists AND v_best_score >= p_confidence_threshold THEN
    RETURN QUERY
    SELECT 
      sa.id AS agent_id,
      sa.name AS agent_name,
      sa.sector::TEXT AS sector,
      sa.hierarchy_tier,
      sa.seraphim_id,
      COALESCE(ats.specialization_score, 0) AS specialization_score,
      COALESCE(sa.success_rate, 0) AS success_rate,
      LEAST(1.0, (COALESCE(ats.specialization_score, 0) * 0.7 + COALESCE(sa.success_rate, 0) * 0.3)) AS confidence,
      'Tier 1: Deterministic routing via proven specialization' AS routing_reason,
      FALSE AS requires_llm_fallback
    FROM sonic_agents sa
    JOIN agent_task_scores ats ON ats.agent_id = sa.id
    WHERE ats.task_type = p_task_type
      AND ats.specialization_score >= p_confidence_threshold
      AND sa.status != 'DORMANT'
    ORDER BY ats.specialization_score DESC, sa.success_rate DESC
    LIMIT p_limit;
  ELSE
    -- No high-confidence specialists - return top performers with LLM fallback flag
    RETURN QUERY
    SELECT 
      sa.id AS agent_id,
      sa.name AS agent_name,
      sa.sector::TEXT AS sector,
      sa.hierarchy_tier,
      sa.seraphim_id,
      COALESCE(ats.specialization_score, 0) AS specialization_score,
      COALESCE(sa.success_rate, 0) AS success_rate,
      COALESCE(ats.specialization_score, sa.success_rate * 0.5, 0.3) AS confidence,
      CASE 
        WHEN v_best_score > 0 THEN 'Tier 2: Partial match - LLM refinement recommended'
        ELSE 'Tier 3: Novel task type - LLM required for routing'
      END AS routing_reason,
      TRUE AS requires_llm_fallback
    FROM sonic_agents sa
    LEFT JOIN agent_task_scores ats ON ats.agent_id = sa.id AND ats.task_type = p_task_type
    WHERE sa.status != 'DORMANT'
    ORDER BY 
      COALESCE(ats.specialization_score, 0) DESC,
      sa.success_rate DESC,
      sa.learning_velocity DESC
    LIMIT p_limit;
  END IF;
END;
$$;

-- Create a function to get routing statistics (for monitoring tier usage)
CREATE OR REPLACE FUNCTION public.get_routing_tier_stats()
RETURNS TABLE(
  task_type TEXT,
  total_specialists INTEGER,
  avg_specialization NUMERIC,
  can_tier1_route BOOLEAN,
  recommended_tier TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ats.task_type,
    COUNT(*)::INTEGER AS total_specialists,
    AVG(ats.specialization_score) AS avg_specialization,
    MAX(ats.specialization_score) >= 0.7 AS can_tier1_route,
    CASE 
      WHEN MAX(ats.specialization_score) >= 0.7 THEN 'Tier 1 (Instant)'
      WHEN MAX(ats.specialization_score) >= 0.4 THEN 'Tier 2 (Fast)'
      ELSE 'Tier 3 (LLM)'
    END AS recommended_tier
  FROM agent_task_scores ats
  GROUP BY ats.task_type
  ORDER BY avg_specialization DESC;
$$;

-- Create intent-to-task-type mapping table for deterministic intent parsing
CREATE TABLE IF NOT EXISTS public.intent_task_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_pattern TEXT NOT NULL,
  task_type TEXT NOT NULL,
  confidence NUMERIC DEFAULT 0.8,
  domain TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.intent_task_mapping ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read (system table)
CREATE POLICY "Anyone can read intent mappings"
  ON public.intent_task_mapping FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage intent mappings"
  ON public.intent_task_mapping FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Seed common intent patterns for Tier 1 routing
INSERT INTO public.intent_task_mapping (intent_pattern, task_type, confidence, domain, keywords) VALUES
  ('schedule', 'scheduling', 0.9, 'calendar', ARRAY['meeting', 'appointment', 'book', 'reserve']),
  ('email', 'email_composition', 0.9, 'communications', ARRAY['send', 'write', 'compose', 'reply']),
  ('analyze', 'data_analysis', 0.85, 'analytics', ARRAY['report', 'insight', 'trend', 'pattern']),
  ('research', 'research', 0.85, 'knowledge', ARRAY['find', 'look up', 'search', 'investigate']),
  ('summarize', 'summarization', 0.9, 'knowledge', ARRAY['brief', 'overview', 'digest', 'recap']),
  ('calculate', 'financial_analysis', 0.9, 'finance', ARRAY['budget', 'expense', 'revenue', 'cost']),
  ('create', 'content_creation', 0.8, 'creative', ARRAY['design', 'generate', 'make', 'build']),
  ('review', 'document_review', 0.85, 'legal', ARRAY['contract', 'agreement', 'terms', 'policy']),
  ('plan', 'strategic_planning', 0.85, 'strategy', ARRAY['roadmap', 'strategy', 'goal', 'objective']),
  ('automate', 'workflow_automation', 0.9, 'automation', ARRAY['workflow', 'trigger', 'process', 'routine']),
  ('monitor', 'monitoring', 0.85, 'operations', ARRAY['track', 'watch', 'alert', 'notify']),
  ('optimize', 'optimization', 0.85, 'performance', ARRAY['improve', 'enhance', 'boost', 'streamline'])
ON CONFLICT DO NOTHING;

-- Function to parse intent deterministically (Tier 1 intent parsing)
CREATE OR REPLACE FUNCTION public.tier1_parse_intent(p_query TEXT)
RETURNS TABLE(
  task_type TEXT,
  domain TEXT,
  confidence NUMERIC,
  matched_pattern TEXT,
  requires_llm BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_query_lower TEXT := LOWER(p_query);
  v_best_match RECORD;
  v_keyword_matches INTEGER;
BEGIN
  -- Find best matching intent pattern
  SELECT 
    itm.task_type,
    itm.domain,
    itm.confidence,
    itm.intent_pattern,
    (SELECT COUNT(*) FROM unnest(itm.keywords) kw WHERE v_query_lower LIKE '%' || kw || '%') AS keyword_hits
  INTO v_best_match
  FROM intent_task_mapping itm
  WHERE v_query_lower LIKE '%' || itm.intent_pattern || '%'
     OR EXISTS (SELECT 1 FROM unnest(itm.keywords) kw WHERE v_query_lower LIKE '%' || kw || '%')
  ORDER BY 
    (CASE WHEN v_query_lower LIKE '%' || itm.intent_pattern || '%' THEN 1 ELSE 0 END) DESC,
    (SELECT COUNT(*) FROM unnest(itm.keywords) kw WHERE v_query_lower LIKE '%' || kw || '%') DESC,
    itm.confidence DESC
  LIMIT 1;

  IF v_best_match IS NOT NULL AND (v_best_match.keyword_hits > 0 OR v_query_lower LIKE '%' || v_best_match.intent_pattern || '%') THEN
    RETURN QUERY SELECT 
      v_best_match.task_type,
      v_best_match.domain,
      LEAST(1.0, v_best_match.confidence + (v_best_match.keyword_hits * 0.05)),
      v_best_match.intent_pattern,
      FALSE;
  ELSE
    RETURN QUERY SELECT 
      'unknown'::TEXT,
      NULL::TEXT,
      0.0::NUMERIC,
      NULL::TEXT,
      TRUE;
  END IF;
END;
$$;

-- Simple btree indexes instead of GIN for pattern lookup
CREATE INDEX IF NOT EXISTS idx_intent_pattern ON intent_task_mapping(intent_pattern);
CREATE INDEX IF NOT EXISTS idx_intent_task_type ON intent_task_mapping(task_type);

COMMENT ON FUNCTION tier1_deterministic_route IS 'Tier 1 Instant Routing: Returns agents without LLM if confidence threshold met';
COMMENT ON FUNCTION tier1_parse_intent IS 'Tier 1 Intent Parsing: Deterministic intent detection without LLM';
COMMENT ON TABLE intent_task_mapping IS 'Pattern-to-task mapping for deterministic intent routing';