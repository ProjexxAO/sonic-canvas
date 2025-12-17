-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create user_agents junction table (which agents a user has access to)
CREATE TABLE public.user_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    agent_id uuid REFERENCES public.sonic_agents(id) ON DELETE CASCADE NOT NULL,
    assigned_at timestamp with time zone NOT NULL DEFAULT now(),
    assigned_by uuid, -- who assigned this agent (Atlas or superadmin)
    UNIQUE (user_id, agent_id)
);

-- Enable RLS on user_agents
ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles: superadmins can see all, users see their own
CREATE POLICY "Superadmins can do everything on user_roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS for user_agents: superadmins can do everything, users see their own assignments
CREATE POLICY "Superadmins can do everything on user_agents"
ON public.user_agents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can view their own agent assignments"
ON public.user_agents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Update sonic_agents RLS: superadmins see all, users see only assigned agents
DROP POLICY IF EXISTS "Users can view their own agents" ON public.sonic_agents;
DROP POLICY IF EXISTS "Users can create their own agents" ON public.sonic_agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON public.sonic_agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON public.sonic_agents;

-- Superadmin full access to all agents
CREATE POLICY "Superadmins have full access to all agents"
ON public.sonic_agents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Users can only view agents assigned to them
CREATE POLICY "Users can view assigned agents"
ON public.sonic_agents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_agents
    WHERE user_agents.agent_id = sonic_agents.id
      AND user_agents.user_id = auth.uid()
  )
);