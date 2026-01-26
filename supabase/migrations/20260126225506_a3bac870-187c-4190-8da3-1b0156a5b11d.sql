-- Fix 1: Drop the existing function first, then recreate the view properly
DROP FUNCTION IF EXISTS public.get_routing_tier_stats();
DROP VIEW IF EXISTS public.tiered_routing_statistics;

-- Recreate view WITHOUT security_barrier (which was causing the SECURITY DEFINER warning)
CREATE VIEW public.tiered_routing_statistics 
WITH (security_invoker = on) AS
SELECT 
  itm.task_type,
  COUNT(DISTINCT ats.agent_id) as total_specialists,
  ROUND(AVG(ats.specialization_score)::numeric, 3) as avg_specialization,
  BOOL_OR(ats.specialization_score >= 0.7) as can_tier1_route,
  CASE 
    WHEN BOOL_OR(ats.specialization_score >= 0.7) THEN 'tier1'
    WHEN COUNT(DISTINCT ats.agent_id) > 0 THEN 'tier2'
    ELSE 'tier3'
  END as recommended_tier
FROM intent_task_mapping itm
LEFT JOIN agent_task_scores ats ON ats.task_type = itm.task_type
GROUP BY itm.task_type;

-- Recreate helper function with SECURITY INVOKER (safe)
CREATE OR REPLACE FUNCTION public.get_routing_tier_stats()
RETURNS TABLE(
  task_type TEXT,
  total_specialists BIGINT,
  avg_specialization NUMERIC,
  can_tier1_route BOOLEAN,
  recommended_tier TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    task_type::TEXT,
    total_specialists,
    avg_specialization,
    can_tier1_route,
    recommended_tier::TEXT
  FROM public.tiered_routing_statistics;
$$;

-- Fix 2: Tighten overly permissive RLS policies to require authentication
DROP POLICY IF EXISTS "Anyone can insert tool catalog" ON public.tool_catalog;
DROP POLICY IF EXISTS "Authenticated users can insert tool catalog" ON public.tool_catalog;
CREATE POLICY "Authenticated users can insert tool catalog" 
  ON public.tool_catalog 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert intent mappings" ON public.intent_task_mapping;
DROP POLICY IF EXISTS "Authenticated users can insert intent mappings" ON public.intent_task_mapping;
CREATE POLICY "Authenticated users can insert intent mappings" 
  ON public.intent_task_mapping 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);