-- Create enum for governance levels
CREATE TYPE public.governance_level AS ENUM ('persona', 'industry', 'workspace', 'user', 'agent');

-- Create enum for tool permission status
CREATE TYPE public.tool_permission_status AS ENUM ('allowed', 'blocked', 'preferred');

-- Create tool_governance table for storing rules at each hierarchy level
CREATE TABLE public.tool_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level governance_level NOT NULL,
  level_id TEXT NOT NULL, -- persona name, industry name, workspace_id, user_id, or agent_id
  tool_id TEXT NOT NULL REFERENCES public.tool_catalog(tool_id) ON DELETE CASCADE,
  status tool_permission_status NOT NULL DEFAULT 'allowed',
  boost INTEGER DEFAULT 0, -- priority boost for preferred tools
  reason TEXT, -- explanation for the rule
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(level, level_id, tool_id)
);

-- Enable RLS
ALTER TABLE public.tool_governance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view governance rules"
ON public.tool_governance
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage governance rules"
ON public.tool_governance
FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Workspace admins can manage workspace-level rules"
ON public.tool_governance
FOR ALL
USING (
  level = 'workspace' 
  AND has_workspace_permission(auth.uid(), level_id::uuid, 'can_manage_members')
)
WITH CHECK (
  level = 'workspace' 
  AND has_workspace_permission(auth.uid(), level_id::uuid, 'can_manage_members')
);

-- Create trigger for updated_at
CREATE TRIGGER update_tool_governance_updated_at
BEFORE UPDATE ON public.tool_governance
FOR EACH ROW
EXECUTE FUNCTION public.update_csuite_updated_at();

-- RPC function to compute final tool permissions for an agent
CREATE OR REPLACE FUNCTION public.compute_agent_tool_permissions(
  _agent_id UUID,
  _user_id UUID DEFAULT NULL,
  _workspace_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tool_id TEXT,
  tool_name TEXT,
  final_status tool_permission_status,
  effective_boost INTEGER,
  source_level governance_level,
  source_reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _persona TEXT;
  _industry TEXT;
BEGIN
  -- Get agent's persona and industry (sector)
  SELECT 
    COALESCE(sa.description, 'default') AS persona,
    sa.sector::TEXT AS industry
  INTO _persona, _industry
  FROM sonic_agents sa
  WHERE sa.id = _agent_id;

  -- Return computed permissions with hierarchy resolution
  -- Priority: Agent > User > Workspace > Industry > Persona
  -- Preferred always beats Blocked at the same level
  RETURN QUERY
  WITH all_rules AS (
    -- Persona level (lowest priority = 1)
    SELECT 
      tg.tool_id,
      tg.status,
      tg.boost,
      tg.level,
      tg.reason,
      1 AS priority,
      CASE tg.status WHEN 'preferred' THEN 1 ELSE 0 END AS prefer_boost
    FROM tool_governance tg
    WHERE tg.level = 'persona' AND tg.level_id = _persona
    
    UNION ALL
    
    -- Industry level (priority = 2)
    SELECT 
      tg.tool_id,
      tg.status,
      tg.boost,
      tg.level,
      tg.reason,
      2 AS priority,
      CASE tg.status WHEN 'preferred' THEN 1 ELSE 0 END AS prefer_boost
    FROM tool_governance tg
    WHERE tg.level = 'industry' AND tg.level_id = _industry
    
    UNION ALL
    
    -- Workspace level (priority = 3)
    SELECT 
      tg.tool_id,
      tg.status,
      tg.boost,
      tg.level,
      tg.reason,
      3 AS priority,
      CASE tg.status WHEN 'preferred' THEN 1 ELSE 0 END AS prefer_boost
    FROM tool_governance tg
    WHERE tg.level = 'workspace' 
      AND _workspace_id IS NOT NULL 
      AND tg.level_id = _workspace_id::TEXT
    
    UNION ALL
    
    -- User level (priority = 4)
    SELECT 
      tg.tool_id,
      tg.status,
      tg.boost,
      tg.level,
      tg.reason,
      4 AS priority,
      CASE tg.status WHEN 'preferred' THEN 1 ELSE 0 END AS prefer_boost
    FROM tool_governance tg
    WHERE tg.level = 'user' 
      AND _user_id IS NOT NULL 
      AND tg.level_id = _user_id::TEXT
    
    UNION ALL
    
    -- Agent level (highest priority = 5)
    SELECT 
      tg.tool_id,
      tg.status,
      tg.boost,
      tg.level,
      tg.reason,
      5 AS priority,
      CASE tg.status WHEN 'preferred' THEN 1 ELSE 0 END AS prefer_boost
    FROM tool_governance tg
    WHERE tg.level = 'agent' AND tg.level_id = _agent_id::TEXT
  ),
  ranked_rules AS (
    SELECT 
      ar.*,
      ROW_NUMBER() OVER (
        PARTITION BY ar.tool_id 
        ORDER BY ar.priority DESC, ar.prefer_boost DESC
      ) AS rn
    FROM all_rules ar
  ),
  final_rules AS (
    SELECT * FROM ranked_rules WHERE rn = 1
  )
  SELECT 
    tc.tool_id,
    tc.name AS tool_name,
    COALESCE(fr.status, 'allowed'::tool_permission_status) AS final_status,
    COALESCE(fr.boost, 0) AS effective_boost,
    fr.level AS source_level,
    fr.reason AS source_reason
  FROM tool_catalog tc
  LEFT JOIN final_rules fr ON tc.tool_id = fr.tool_id
  ORDER BY 
    CASE COALESCE(fr.status, 'allowed'::tool_permission_status)
      WHEN 'preferred' THEN 1
      WHEN 'allowed' THEN 2
      WHEN 'blocked' THEN 3
    END,
    COALESCE(fr.boost, 0) DESC,
    tc.name;
END;
$$;

-- RPC to get governance rules for a specific level
CREATE OR REPLACE FUNCTION public.get_governance_rules_by_level(
  _level governance_level,
  _level_id TEXT
)
RETURNS TABLE (
  id UUID,
  tool_id TEXT,
  tool_name TEXT,
  status tool_permission_status,
  boost INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tg.id,
    tg.tool_id,
    tc.name AS tool_name,
    tg.status,
    tg.boost,
    tg.reason,
    tg.created_at
  FROM tool_governance tg
  JOIN tool_catalog tc ON tc.tool_id = tg.tool_id
  WHERE tg.level = _level AND tg.level_id = _level_id
  ORDER BY tc.name;
$$;