-- Fix 1: Change search_agents_by_embedding to SECURITY INVOKER to respect RLS
CREATE OR REPLACE FUNCTION search_agents_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  sector text,
  description text,
  capabilities text[],
  code_artifact text,
  similarity float
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.name,
    sa.sector::text,
    sa.description,
    sa.capabilities,
    sa.code_artifact,
    1 - (sa.embedding <=> query_embedding) as similarity
  FROM sonic_agents sa
  WHERE sa.embedding IS NOT NULL
    AND 1 - (sa.embedding <=> query_embedding) > match_threshold
  ORDER BY sa.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fix 2: Add write policies for regular users on sonic_agents

-- Allow users to create agents (they will own them)
CREATE POLICY "Users can create agents"
ON public.sonic_agents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Allow users to update agents assigned to them
CREATE POLICY "Users can update assigned agents"
ON public.sonic_agents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_agents
    WHERE user_agents.agent_id = sonic_agents.id
      AND user_agents.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_agents
    WHERE user_agents.agent_id = sonic_agents.id
      AND user_agents.user_id = auth.uid()
  )
);

-- Allow users to delete agents assigned to them
CREATE POLICY "Users can delete assigned agents"
ON public.sonic_agents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_agents
    WHERE user_agents.agent_id = sonic_agents.id
      AND user_agents.user_id = auth.uid()
  )
);

-- Fix 3: Add trigger to auto-assign created agents to the creator
CREATE OR REPLACE FUNCTION auto_assign_agent_to_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_agents (user_id, agent_id, assigned_by)
  VALUES (NEW.user_id, NEW.id, NEW.user_id)
  ON CONFLICT (user_id, agent_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-assignment
DROP TRIGGER IF EXISTS on_agent_created ON public.sonic_agents;
CREATE TRIGGER on_agent_created
  AFTER INSERT ON public.sonic_agents
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_agent_to_creator();