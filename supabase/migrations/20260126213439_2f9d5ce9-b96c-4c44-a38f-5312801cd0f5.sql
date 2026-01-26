-- Drop and recreate the promote function with fixed logic
CREATE OR REPLACE FUNCTION public.promote_to_seraphim(p_count INTEGER DEFAULT 24)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promoted INTEGER := 0;
  v_domains TEXT[] := ARRAY[
    'Finance', 'Legal', 'Technology', 'Healthcare', 'Operations',
    'Marketing', 'Security', 'Research', 'Analytics', 'Creative',
    'Communications', 'Strategy', 'Compliance', 'Innovation', 'Data',
    'Automation', 'Intelligence', 'Integration', 'Optimization', 'Architecture',
    'Governance', 'Risk', 'Quality', 'Performance'
  ];
BEGIN
  -- Reset all to worker first
  UPDATE sonic_agents SET hierarchy_tier = 'worker', seraphim_id = NULL, worker_pool_size = 0;
  
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
  
  -- Assign next 144,000 as workers, rest as reserve
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
  
  -- Assign workers to Seraphim using modulo distribution
  WITH numbered_workers AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) - 1 as worker_num
    FROM sonic_agents
    WHERE hierarchy_tier = 'worker'
  ),
  numbered_seraphim AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY promoted_at) - 1 as seraph_num
    FROM sonic_agents
    WHERE hierarchy_tier = 'seraphim'
  )
  UPDATE sonic_agents sa
  SET seraphim_id = (
    SELECT ns.id 
    FROM numbered_seraphim ns 
    WHERE ns.seraph_num = (nw.worker_num % 24)
  )
  FROM numbered_workers nw
  WHERE sa.id = nw.id;
  
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