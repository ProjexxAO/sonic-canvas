-- Create hierarchy tier enum for the divine agent structure
CREATE TYPE public.hierarchy_tier AS ENUM ('seraphim', 'worker', 'reserve');

-- Add hierarchy columns to sonic_agents
ALTER TABLE public.sonic_agents 
ADD COLUMN hierarchy_tier hierarchy_tier DEFAULT 'worker',
ADD COLUMN seraphim_id UUID REFERENCES public.sonic_agents(id),
ADD COLUMN worker_pool_size INTEGER DEFAULT 0,
ADD COLUMN promoted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN domain_specialty TEXT;

-- Create index for efficient hierarchy queries
CREATE INDEX idx_sonic_agents_hierarchy ON public.sonic_agents(hierarchy_tier);
CREATE INDEX idx_sonic_agents_seraphim ON public.sonic_agents(seraphim_id) WHERE seraphim_id IS NOT NULL;

-- Function to promote top agents to Seraphim
CREATE OR REPLACE FUNCTION public.promote_to_seraphim(p_count INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promoted INTEGER := 0;
  v_seraphim_id UUID;
  v_domain TEXT;
  v_domains TEXT[] := ARRAY[
    'Finance', 'Legal', 'Technology', 'Healthcare', 'Operations',
    'Marketing', 'Security', 'Research', 'Analytics', 'Creative',
    'Communications', 'Strategy', 'Compliance', 'Innovation', 'Data',
    'Automation', 'Intelligence', 'Integration', 'Optimization', 'Architecture',
    'Governance', 'Risk', 'Quality', 'Performance'
  ];
BEGIN
  -- Reset all to worker first
  UPDATE sonic_agents SET hierarchy_tier = 'worker', seraphim_id = NULL;
  
  -- Promote top performers to Seraphim (24 elders)
  WITH top_agents AS (
    SELECT id, ROW_NUMBER() OVER (
      ORDER BY 
        COALESCE(success_rate, 0) DESC,
        COALESCE(learning_velocity, 0) DESC,
        COALESCE(total_tasks_completed, 0) DESC
    ) as rank
    FROM sonic_agents
    WHERE status != 'DORMANT'
    LIMIT p_count
  )
  UPDATE sonic_agents sa
  SET 
    hierarchy_tier = 'seraphim',
    promoted_at = now(),
    domain_specialty = v_domains[ta.rank]
  FROM top_agents ta
  WHERE sa.id = ta.id;
  
  GET DIAGNOSTICS v_promoted = ROW_COUNT;
  
  -- Assign next 144,000 as workers
  WITH ranked_workers AS (
    SELECT id, ROW_NUMBER() OVER (
      ORDER BY 
        COALESCE(success_rate, 0) DESC,
        COALESCE(learning_velocity, 0) DESC
    ) as rank
    FROM sonic_agents
    WHERE hierarchy_tier != 'seraphim'
  )
  UPDATE sonic_agents sa
  SET hierarchy_tier = CASE 
    WHEN rw.rank <= 144000 THEN 'worker'::hierarchy_tier
    ELSE 'reserve'::hierarchy_tier
  END
  FROM ranked_workers rw
  WHERE sa.id = rw.id;
  
  -- Assign workers to Seraphim (6,000 each)
  WITH seraphim_list AS (
    SELECT id, domain_specialty, ROW_NUMBER() OVER (ORDER BY promoted_at) as seraph_num
    FROM sonic_agents
    WHERE hierarchy_tier = 'seraphim'
  ),
  worker_assignments AS (
    SELECT 
      w.id as worker_id,
      s.id as seraph_id,
      ((ROW_NUMBER() OVER (ORDER BY w.id) - 1) % 24) + 1 as seraph_num
    FROM sonic_agents w
    CROSS JOIN seraphim_list s
    WHERE w.hierarchy_tier = 'worker'
      AND s.seraph_num = ((ROW_NUMBER() OVER (ORDER BY w.id) - 1) % 24) + 1
  )
  UPDATE sonic_agents sa
  SET seraphim_id = wa.seraph_id
  FROM worker_assignments wa
  WHERE sa.id = wa.worker_id;
  
  -- Update worker pool sizes for each Seraphim
  UPDATE sonic_agents sa
  SET worker_pool_size = (
    SELECT COUNT(*) FROM sonic_agents 
    WHERE seraphim_id = sa.id
  )
  WHERE sa.hierarchy_tier = 'seraphim';
  
  RETURN v_promoted;
END;
$$;

-- Function to get Seraphim overview
CREATE OR REPLACE FUNCTION public.get_seraphim_overview()
RETURNS TABLE(
  seraphim_id UUID,
  seraphim_name TEXT,
  domain_specialty TEXT,
  worker_count BIGINT,
  avg_worker_success NUMERIC,
  total_pool_tasks BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id as seraphim_id,
    s.name as seraphim_name,
    s.domain_specialty,
    COUNT(w.id) as worker_count,
    AVG(w.success_rate) as avg_worker_success,
    SUM(w.total_tasks_completed) as total_pool_tasks
  FROM sonic_agents s
  LEFT JOIN sonic_agents w ON w.seraphim_id = s.id
  WHERE s.hierarchy_tier = 'seraphim'
  GROUP BY s.id, s.name, s.domain_specialty
  ORDER BY s.domain_specialty;
$$;

-- Function to route task to appropriate Seraphim
CREATE OR REPLACE FUNCTION public.route_task_to_seraphim(p_task_type TEXT, p_domain TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seraphim_id UUID;
BEGIN
  -- Find best Seraphim for this task based on domain or worker specializations
  SELECT s.id INTO v_seraphim_id
  FROM sonic_agents s
  WHERE s.hierarchy_tier = 'seraphim'
    AND (
      p_domain IS NULL 
      OR s.domain_specialty ILIKE '%' || p_domain || '%'
      OR EXISTS (
        SELECT 1 FROM sonic_agents w
        JOIN agent_task_scores ats ON ats.agent_id = w.id
        WHERE w.seraphim_id = s.id
          AND ats.task_type = p_task_type
          AND ats.specialization_score > 0.6
      )
    )
  ORDER BY 
    s.worker_pool_size DESC,
    s.success_rate DESC
  LIMIT 1;
  
  -- Fallback to any Seraphim if no domain match
  IF v_seraphim_id IS NULL THEN
    SELECT id INTO v_seraphim_id
    FROM sonic_agents
    WHERE hierarchy_tier = 'seraphim'
    ORDER BY worker_pool_size DESC
    LIMIT 1;
  END IF;
  
  RETURN v_seraphim_id;
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN public.sonic_agents.hierarchy_tier IS 'Divine hierarchy: seraphim (24 elders), worker (144,000 active), reserve (standby pool)';
COMMENT ON COLUMN public.sonic_agents.seraphim_id IS 'The Seraphim elder this worker reports to';
COMMENT ON COLUMN public.sonic_agents.worker_pool_size IS 'Number of workers under this Seraphim (only for seraphim tier)';
COMMENT ON COLUMN public.sonic_agents.domain_specialty IS 'Primary domain this Seraphim governs';