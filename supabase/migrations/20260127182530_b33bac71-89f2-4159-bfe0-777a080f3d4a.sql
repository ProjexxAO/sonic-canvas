-- Add index on last_active for efficient dashboard agent queries
CREATE INDEX IF NOT EXISTS idx_sonic_agents_last_active 
ON public.sonic_agents (last_active DESC NULLS LAST);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_sonic_agents_status_last_active 
ON public.sonic_agents (status, last_active DESC NULLS LAST);