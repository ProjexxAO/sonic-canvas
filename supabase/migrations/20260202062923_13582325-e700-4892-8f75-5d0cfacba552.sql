-- Add memory consolidation and crystallization functions for Agent Learning & Memory

-- Function to consolidate low-importance memories into thematic summaries
CREATE OR REPLACE FUNCTION public.consolidate_agent_memories(
  p_agent_id UUID,
  p_threshold NUMERIC DEFAULT 0.3,
  p_min_memories INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_consolidated_count INTEGER := 0;
  v_deleted_count INTEGER;
  v_summary_id UUID;
  v_memory_types TEXT[];
  v_type TEXT;
  v_mem_count INTEGER;
  v_mem_content TEXT;
  v_summary_content TEXT;
BEGIN
  -- Get distinct memory types with low-importance memories
  SELECT ARRAY_AGG(DISTINCT memory_type) INTO v_memory_types
  FROM agent_memory
  WHERE agent_id = p_agent_id
    AND importance_score < p_threshold
    AND memory_type NOT IN ('crystallized', 'received_crystal');

  IF v_memory_types IS NULL THEN
    RETURN jsonb_build_object('consolidated', 0, 'summaries_created', 0);
  END IF;

  -- Process each memory type
  FOREACH v_type IN ARRAY v_memory_types
  LOOP
    -- Check if we have enough memories to consolidate
    SELECT COUNT(*), string_agg(content, '; ' ORDER BY created_at DESC)
    INTO v_mem_count, v_mem_content
    FROM agent_memory
    WHERE agent_id = p_agent_id
      AND memory_type = v_type
      AND importance_score < p_threshold;

    IF v_mem_count >= p_min_memories THEN
      -- Create summary content
      v_summary_content := 'Consolidated ' || v_mem_count || ' ' || v_type || ' memories: ' || 
        LEFT(v_mem_content, 500);

      -- Insert consolidated memory
      INSERT INTO agent_memory (
        agent_id, user_id, memory_type, content, importance_score, context
      )
      SELECT 
        p_agent_id,
        (SELECT user_id FROM agent_memory WHERE agent_id = p_agent_id LIMIT 1),
        v_type,
        v_summary_content,
        0.5,
        jsonb_build_object('consolidated', true, 'source_count', v_mem_count)
      RETURNING id INTO v_summary_id;

      -- Delete the low-importance source memories
      DELETE FROM agent_memory
      WHERE agent_id = p_agent_id
        AND memory_type = v_type
        AND importance_score < p_threshold
        AND id != v_summary_id;

      GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
      v_consolidated_count := v_consolidated_count + v_deleted_count;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'consolidated', v_consolidated_count,
    'summaries_created', array_length(v_memory_types, 1)
  );
END;
$$;

-- Function to crystallize high-value knowledge from top-performing agents
CREATE OR REPLACE FUNCTION public.crystallize_knowledge(
  p_source_agent_id UUID,
  p_target_agent_ids UUID[],
  p_min_importance NUMERIC DEFAULT 0.7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_crystal_count INTEGER := 0;
  v_target_id UUID;
  v_memory RECORD;
BEGIN
  FOR v_memory IN 
    SELECT id, content, context, importance_score, memory_type
    FROM agent_memory
    WHERE agent_id = p_source_agent_id
      AND importance_score >= p_min_importance
      AND memory_type NOT IN ('crystallized', 'received_crystal')
    ORDER BY importance_score DESC
    LIMIT 10
  LOOP
    FOREACH v_target_id IN ARRAY p_target_agent_ids
    LOOP
      INSERT INTO agent_memory (
        agent_id, user_id, memory_type, content, importance_score, context
      )
      SELECT 
        v_target_id,
        (SELECT user_id FROM agent_memory WHERE agent_id = p_source_agent_id LIMIT 1),
        'received_crystal',
        'Knowledge from ' || (SELECT name FROM sonic_agents WHERE id = p_source_agent_id) || ': ' || v_memory.content,
        v_memory.importance_score * 0.8,
        jsonb_build_object(
          'source_agent_id', p_source_agent_id,
          'source_memory_id', v_memory.id,
          'original_type', v_memory.memory_type
        )
      ON CONFLICT DO NOTHING;

      v_crystal_count := v_crystal_count + 1;
    END LOOP;

    UPDATE agent_memory
    SET memory_type = 'crystallized',
        context = context || jsonb_build_object('crystallized_at', now(), 'shared_with', p_target_agent_ids)
    WHERE id = v_memory.id;
  END LOOP;

  RETURN jsonb_build_object(
    'crystals_shared', v_crystal_count,
    'target_agents', array_length(p_target_agent_ids, 1)
  );
END;
$$;

-- Function to perform reflection cycle
CREATE OR REPLACE FUNCTION public.agent_reflection_cycle(
  p_agent_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_success_patterns JSONB;
  v_failure_patterns JSONB;
  v_top_specializations JSONB;
  v_reflection_insight TEXT;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('task_type', task_type, 'success_rate', success_rate, 'count', total_count))
  INTO v_success_patterns
  FROM (
    SELECT task_type, 
           AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) as success_rate,
           COUNT(*) as total_count
    FROM agent_performance
    WHERE agent_id = p_agent_id
      AND created_at > now() - interval '7 days'
    GROUP BY task_type
    HAVING COUNT(*) >= 3
    ORDER BY success_rate DESC
    LIMIT 5
  ) patterns;

  SELECT jsonb_agg(jsonb_build_object('error_type', error_type, 'count', error_count))
  INTO v_failure_patterns
  FROM (
    SELECT error_type, COUNT(*) as error_count
    FROM agent_performance
    WHERE agent_id = p_agent_id
      AND success = false
      AND error_type IS NOT NULL
      AND created_at > now() - interval '7 days'
    GROUP BY error_type
    ORDER BY error_count DESC
    LIMIT 3
  ) failures;

  SELECT jsonb_agg(jsonb_build_object('task_type', task_type, 'score', specialization_score))
  INTO v_top_specializations
  FROM (
    SELECT task_type, specialization_score
    FROM agent_task_scores
    WHERE agent_id = p_agent_id
    ORDER BY specialization_score DESC
    LIMIT 5
  ) specs;

  v_reflection_insight := 'Reflection cycle completed. ';
  
  IF v_success_patterns IS NOT NULL THEN
    v_reflection_insight := v_reflection_insight || 'Top performing areas identified. ';
  END IF;
  
  IF v_failure_patterns IS NOT NULL THEN
    v_reflection_insight := v_reflection_insight || 'Failure patterns detected for improvement. ';
  END IF;

  INSERT INTO agent_learning_events (agent_id, event_type, event_data, impact_score)
  VALUES (
    p_agent_id,
    'memory_consolidated',
    jsonb_build_object(
      'success_patterns', COALESCE(v_success_patterns, '[]'::jsonb),
      'failure_patterns', COALESCE(v_failure_patterns, '[]'::jsonb),
      'specializations', COALESCE(v_top_specializations, '[]'::jsonb),
      'reflection_date', now()
    ),
    0.8
  );

  UPDATE sonic_agents
  SET learning_velocity = LEAST(1.0, COALESCE(learning_velocity, 0.5) + 0.02)
  WHERE id = p_agent_id;

  RETURN jsonb_build_object(
    'success_patterns', COALESCE(v_success_patterns, '[]'::jsonb),
    'failure_patterns', COALESCE(v_failure_patterns, '[]'::jsonb),
    'specializations', COALESCE(v_top_specializations, '[]'::jsonb),
    'insight', v_reflection_insight
  );
END;
$$;

-- Enhanced function for weighted task routing with memory context
CREATE OR REPLACE FUNCTION public.enhanced_task_routing(
  p_task_type TEXT,
  p_query TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  sector TEXT,
  routing_score NUMERIC,
  specialization_score NUMERIC,
  success_rate NUMERIC,
  memory_relevance NUMERIC,
  learning_velocity NUMERIC,
  confidence NUMERIC,
  routing_reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH agent_scores AS (
    SELECT 
      sa.id AS a_id,
      sa.name AS a_name,
      sa.sector::TEXT AS a_sector,
      COALESCE(ats.specialization_score, 0) AS spec_score,
      COALESCE(sa.success_rate, 0) AS succ_rate,
      COALESCE(sa.learning_velocity, 0.5) AS learn_vel,
      CASE 
        WHEN p_query IS NOT NULL THEN
          COALESCE((
            SELECT AVG(importance_score) 
            FROM agent_memory am
            WHERE am.agent_id = sa.id
              AND am.content ILIKE '%' || p_query || '%'
            LIMIT 5
          ), 0)
        ELSE 0
      END AS mem_rel,
      COALESCE((
        SELECT COUNT(*) 
        FROM agent_performance ap
        WHERE ap.agent_id = sa.id
          AND ap.task_type = p_task_type
          AND ap.success = true
          AND ap.created_at > now() - interval '30 days'
      ), 0) AS recent_successes
    FROM sonic_agents sa
    LEFT JOIN agent_task_scores ats ON sa.id = ats.agent_id AND ats.task_type = p_task_type
    WHERE sa.status != 'DORMANT'
  )
  SELECT 
    a.a_id AS agent_id,
    a.a_name AS agent_name,
    a.a_sector AS sector,
    (a.spec_score * 0.4 + 
     a.succ_rate * 0.25 + 
     a.learn_vel * 0.15 + 
     a.mem_rel * 0.10 +
     LEAST(1.0, a.recent_successes::NUMERIC / 10) * 0.10
    ) AS routing_score,
    a.spec_score AS specialization_score,
    a.succ_rate AS success_rate,
    a.mem_rel AS memory_relevance,
    a.learn_vel AS learning_velocity,
    CASE 
      WHEN a.spec_score >= 0.7 AND a.succ_rate >= 0.8 THEN 0.95
      WHEN a.spec_score >= 0.5 AND a.succ_rate >= 0.6 THEN 0.80
      WHEN a.spec_score >= 0.3 THEN 0.65
      ELSE 0.50
    END AS confidence,
    CASE 
      WHEN a.spec_score >= 0.7 THEN 'Expert specialist with proven track record'
      WHEN a.spec_score >= 0.5 THEN 'Experienced with this task type'
      WHEN a.learn_vel >= 0.7 THEN 'Fast learner, adapting quickly'
      ELSE 'General capability, learning in progress'
    END AS routing_reason
  FROM agent_scores a
  ORDER BY routing_score DESC
  LIMIT p_limit;
END;
$$;