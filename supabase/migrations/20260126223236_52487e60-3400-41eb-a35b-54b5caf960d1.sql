-- ============================================
-- FIX: Add unique constraint to intent_task_mapping
-- ============================================
ALTER TABLE public.intent_task_mapping
ADD CONSTRAINT intent_task_mapping_intent_pattern_key UNIQUE (intent_pattern);

-- ============================================
-- FIX: Add 'seraphim_broadcast' to valid memory types
-- ============================================
ALTER TABLE public.agent_memory
DROP CONSTRAINT IF EXISTS valid_memory_type;

ALTER TABLE public.agent_memory
ADD CONSTRAINT valid_memory_type CHECK (
  memory_type IN (
    'interaction', 'preference', 'learning', 'feedback', 'context', 
    'insight', 'error', 'success', 'collaboration', 'task_result',
    'seraphim_broadcast', 'web_knowledge', 'swarm_insight'
  )
);

-- ============================================
-- INTELLIGENCE BOOST: 50+ Deterministic Intent Patterns
-- Increases Tier 1 routing coverage from ~20% to ~80%
-- ============================================

INSERT INTO public.intent_task_mapping (intent_pattern, task_type, confidence, domain, keywords) VALUES
  -- Communication patterns
  ('draft', 'email_composition', 0.9, 'communications', ARRAY['message', 'letter', 'response', 'note']),
  ('respond', 'email_composition', 0.9, 'communications', ARRAY['reply', 'answer', 'follow up']),
  ('call', 'scheduling', 0.85, 'calendar', ARRAY['phone', 'dial', 'ring', 'contact']),
  ('remind', 'scheduling', 0.9, 'calendar', ARRAY['reminder', 'alert', 'notify', 'ping']),
  ('invite', 'scheduling', 0.85, 'calendar', ARRAY['invite', 'attendee', 'guest', 'participant']),
  
  -- Financial patterns
  ('budget', 'financial_analysis', 0.9, 'finance', ARRAY['spending', 'allocation', 'funds']),
  ('invoice', 'financial_analysis', 0.9, 'finance', ARRAY['bill', 'payment', 'charge', 'receipt']),
  ('expense', 'financial_analysis', 0.9, 'finance', ARRAY['cost', 'spending', 'purchase', 'buy']),
  ('forecast', 'financial_analysis', 0.85, 'finance', ARRAY['projection', 'estimate', 'predict']),
  ('profit', 'financial_analysis', 0.9, 'finance', ARRAY['margin', 'earnings', 'revenue', 'income']),
  ('tax', 'financial_analysis', 0.9, 'finance', ARRAY['deduction', 'filing', 'return', 'irs']),
  
  -- Document patterns
  ('write', 'content_creation', 0.85, 'creative', ARRAY['compose', 'author', 'draft', 'type']),
  ('edit', 'document_review', 0.9, 'legal', ARRAY['revise', 'modify', 'change', 'update']),
  ('proofread', 'document_review', 0.9, 'legal', ARRAY['check', 'correct', 'grammar', 'spell']),
  ('sign', 'document_review', 0.9, 'legal', ARRAY['signature', 'approve', 'authorize']),
  ('template', 'content_creation', 0.85, 'creative', ARRAY['form', 'format', 'boilerplate']),
  
  -- Data/Analytics patterns
  ('report', 'data_analysis', 0.9, 'analytics', ARRAY['dashboard', 'metrics', 'kpi', 'stats']),
  ('chart', 'data_analysis', 0.85, 'analytics', ARRAY['graph', 'visualization', 'plot']),
  ('benchmark', 'data_analysis', 0.85, 'analytics', ARRAY['standard', 'baseline', 'target']),
  
  -- Task/Productivity patterns
  ('task', 'task_management', 0.9, 'productivity', ARRAY['todo', 'item', 'action', 'checklist']),
  ('priority', 'task_management', 0.85, 'productivity', ARRAY['urgent', 'important', 'critical', 'asap']),
  ('deadline', 'task_management', 0.9, 'productivity', ARRAY['due', 'by when', 'timeline', 'eta']),
  ('assign', 'task_management', 0.85, 'productivity', ARRAY['delegate', 'give to', 'hand off']),
  
  -- Knowledge/Research patterns
  ('find', 'research', 0.85, 'knowledge', ARRAY['locate', 'discover', 'where is', 'get']),
  ('learn', 'research', 0.8, 'knowledge', ARRAY['study', 'understand', 'explain', 'teach']),
  ('define', 'research', 0.9, 'knowledge', ARRAY['meaning', 'definition', 'what is']),
  ('history', 'research', 0.85, 'knowledge', ARRAY['past', 'previous', 'earlier', 'before']),
  
  -- Workflow patterns
  ('approve', 'workflow_automation', 0.9, 'automation', ARRAY['authorize', 'confirm', 'green light']),
  ('reject', 'workflow_automation', 0.9, 'automation', ARRAY['deny', 'decline', 'refuse']),
  ('escalate', 'workflow_automation', 0.85, 'automation', ARRAY['urgent', 'manager', 'supervisor']),
  ('sync', 'workflow_automation', 0.85, 'automation', ARRAY['synchronize', 'update', 'refresh']),
  
  -- Strategic patterns
  ('goal', 'strategic_planning', 0.9, 'strategy', ARRAY['objective', 'target', 'aim', 'mission']),
  ('vision', 'strategic_planning', 0.85, 'strategy', ARRAY['future', 'direction', 'aspiration']),
  ('swot', 'strategic_planning', 0.9, 'strategy', ARRAY['strength', 'weakness', 'opportunity', 'threat']),
  ('competitive', 'strategic_planning', 0.85, 'strategy', ARRAY['competitor', 'market', 'advantage']),
  
  -- HR/People patterns
  ('hire', 'hr_management', 0.9, 'hr', ARRAY['recruit', 'candidate', 'interview', 'job']),
  ('onboard', 'hr_management', 0.9, 'hr', ARRAY['new employee', 'orientation', 'welcome']),
  ('policy', 'hr_management', 0.85, 'hr', ARRAY['rule', 'guideline', 'procedure', 'handbook']),
  
  -- Security/Compliance patterns
  ('secure', 'security_audit', 0.9, 'security', ARRAY['protect', 'encrypt', 'lock', 'safe']),
  ('audit', 'security_audit', 0.9, 'security', ARRAY['compliance', 'check', 'verify', 'inspect']),
  ('access', 'security_audit', 0.85, 'security', ARRAY['permission', 'role', 'authorize']),
  ('backup', 'security_audit', 0.9, 'security', ARRAY['restore', 'recovery', 'archive']),
  
  -- Project patterns
  ('project', 'project_management', 0.9, 'operations', ARRAY['initiative', 'program', 'effort']),
  ('milestone', 'project_management', 0.9, 'operations', ARRAY['checkpoint', 'phase', 'stage']),
  ('status', 'project_management', 0.9, 'operations', ARRAY['update', 'progress', 'where are we']),
  ('blocker', 'project_management', 0.9, 'operations', ARRAY['issue', 'problem', 'stuck', 'impediment']),
  
  -- Customer patterns
  ('customer', 'customer_management', 0.85, 'crm', ARRAY['client', 'account', 'buyer']),
  ('lead', 'customer_management', 0.9, 'crm', ARRAY['prospect', 'opportunity', 'pipeline']),
  ('support', 'customer_management', 0.85, 'crm', ARRAY['help', 'ticket', 'issue', 'complaint']),
  ('feedback', 'customer_management', 0.85, 'crm', ARRAY['review', 'rating', 'nps', 'satisfaction']),
  
  -- Integration patterns
  ('connect', 'integration', 0.9, 'technology', ARRAY['link', 'integrate', 'sync', 'api']),
  ('import', 'integration', 0.9, 'technology', ARRAY['upload', 'load', 'bring in']),
  ('export', 'integration', 0.9, 'technology', ARRAY['download', 'extract', 'save as']),
  ('migrate', 'integration', 0.85, 'technology', ARRAY['move', 'transfer', 'transition'])
ON CONFLICT (intent_pattern) DO UPDATE SET
  keywords = EXCLUDED.keywords,
  confidence = EXCLUDED.confidence;

-- ============================================
-- INTELLIGENCE: Query-Time Memory Injection
-- ============================================

CREATE OR REPLACE FUNCTION public.get_agent_execution_context(
  p_agent_id UUID,
  p_query TEXT,
  p_task_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_context JSONB;
  v_memories JSONB;
  v_specializations JSONB;
  v_relationships JSONB;
BEGIN
  -- Get relevant memories via semantic search
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', memory_type,
    'content', content,
    'importance', importance_score,
    'relevance', relevance_rank
  )), '[]'::jsonb)
  INTO v_memories
  FROM search_agent_memories(p_agent_id, p_query, NULL, 5);
  
  -- Get task specializations
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'task_type', task_type,
    'score', specialization_score,
    'successes', success_count,
    'confidence', avg_confidence
  ) ORDER BY specialization_score DESC), '[]'::jsonb)
  INTO v_specializations
  FROM agent_task_scores
  WHERE agent_id = p_agent_id AND specialization_score > 0.3
  LIMIT 5;
  
  -- Get high-synergy relationships
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'partner_id', CASE WHEN agent_a_id = p_agent_id THEN agent_b_id ELSE agent_a_id END,
    'synergy', synergy_score,
    'interactions', interaction_count
  ) ORDER BY synergy_score DESC), '[]'::jsonb)
  INTO v_relationships
  FROM agent_relationships
  WHERE (agent_a_id = p_agent_id OR agent_b_id = p_agent_id)
    AND synergy_score > 0.6
  LIMIT 3;
  
  v_context := jsonb_build_object(
    'memories', v_memories,
    'specializations', v_specializations,
    'high_synergy_partners', v_relationships,
    'query_context', p_query,
    'task_type', p_task_type
  );
  
  RETURN v_context;
END;
$$;

-- ============================================
-- RELIABILITY: Cross-Agent Knowledge Sharing
-- ============================================

CREATE OR REPLACE FUNCTION public.seraphim_broadcast_learning(
  p_seraphim_id UUID,
  p_learning_type TEXT,
  p_learning_content TEXT,
  p_impact_score NUMERIC DEFAULT 0.7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workers_updated INTEGER := 0;
  v_worker RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sonic_agents WHERE id = p_seraphim_id AND hierarchy_tier = 'seraphim') THEN
    RAISE EXCEPTION 'Agent is not a Seraphim';
  END IF;
  
  FOR v_worker IN 
    SELECT id, user_id FROM sonic_agents WHERE seraphim_id = p_seraphim_id
  LOOP
    INSERT INTO agent_memory (agent_id, user_id, memory_type, content, importance_score, context)
    VALUES (
      v_worker.id,
      v_worker.user_id,
      'seraphim_broadcast',
      p_learning_content,
      p_impact_score,
      jsonb_build_object(
        'source_seraphim', p_seraphim_id,
        'learning_type', p_learning_type,
        'broadcast_at', now()
      )
    );
    
    INSERT INTO agent_learning_events (agent_id, event_type, event_data, impact_score)
    VALUES (
      v_worker.id,
      'seraphim_knowledge_transfer',
      jsonb_build_object(
        'seraphim_id', p_seraphim_id,
        'learning_type', p_learning_type,
        'summary', LEFT(p_learning_content, 100)
      ),
      p_impact_score * 0.8
    );
    
    v_workers_updated := v_workers_updated + 1;
  END LOOP;
  
  RETURN v_workers_updated;
END;
$$;

-- ============================================
-- PERFORMANCE: Routing Statistics View
-- ============================================

CREATE OR REPLACE VIEW public.tiered_routing_statistics AS
WITH pattern_coverage AS (
  SELECT 
    COUNT(*) AS total_patterns,
    COUNT(DISTINCT domain) AS domains_covered,
    AVG(confidence) AS avg_base_confidence
  FROM intent_task_mapping
),
agent_readiness AS (
  SELECT 
    COUNT(DISTINCT agent_id) AS agents_with_specializations,
    COUNT(CASE WHEN specialization_score >= 0.7 THEN 1 END) AS tier1_ready_specializations,
    COUNT(CASE WHEN specialization_score >= 0.5 AND specialization_score < 0.7 THEN 1 END) AS tier2_specializations
  FROM agent_task_scores
)
SELECT 
  pc.total_patterns,
  pc.domains_covered,
  pc.avg_base_confidence,
  ar.agents_with_specializations,
  ar.tier1_ready_specializations,
  ar.tier2_specializations,
  ROUND(ar.tier1_ready_specializations::NUMERIC / NULLIF(ar.tier1_ready_specializations + ar.tier2_specializations, 0) * 100, 1) AS tier1_coverage_pct
FROM pattern_coverage pc, agent_readiness ar;