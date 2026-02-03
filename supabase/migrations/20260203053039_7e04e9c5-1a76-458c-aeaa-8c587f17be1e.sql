-- Add index for faster agent queries (resolves timeout issues)
CREATE INDEX IF NOT EXISTS idx_sonic_agents_last_active 
ON public.sonic_agents (last_active DESC);

-- Add index for status-based queries
CREATE INDEX IF NOT EXISTS idx_sonic_agents_status 
ON public.sonic_agents (status);

-- Add composite index for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_sonic_agents_dashboard 
ON public.sonic_agents (status, last_active DESC);

-- Add index for user-based queries
CREATE INDEX IF NOT EXISTS idx_sonic_agents_user_id 
ON public.sonic_agents (user_id);

-- Add index for hierarchy tier queries
CREATE INDEX IF NOT EXISTS idx_sonic_agents_hierarchy 
ON public.sonic_agents (hierarchy_tier);