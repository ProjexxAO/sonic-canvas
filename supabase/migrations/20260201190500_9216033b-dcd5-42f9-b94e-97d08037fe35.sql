-- Atlas OS Performance Indexes & Cleanup Function

-- Memory cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_agent_memory()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.agent_memory 
  WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Performance indexes for large tables
CREATE INDEX IF NOT EXISTS idx_agent_memory_user_agent ON public.agent_memory(user_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type_importance ON public.agent_memory(memory_type, importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_learning_events_agent_type ON public.agent_learning_events(agent_id, event_type);
CREATE INDEX IF NOT EXISTS idx_relationships_pair ON public.agent_relationships(agent_a_id, agent_b_id);
CREATE INDEX IF NOT EXISTS idx_sonic_agents_hierarchy_status ON public.sonic_agents(hierarchy_tier, status);
CREATE INDEX IF NOT EXISTS idx_conversations_session_recent ON public.atlas_conversations(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.agent_notifications(user_id, is_dismissed, created_at DESC) WHERE is_dismissed = false;