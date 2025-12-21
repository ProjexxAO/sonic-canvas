
-- Create organization plan enum
CREATE TYPE public.org_plan AS ENUM ('free', 'personal', 'pro', 'team', 'enterprise');

-- Create compliance mode enum
CREATE TYPE public.compliance_mode AS ENUM ('standard', 'gdpr', 'hipaa', 'enterprise');

-- Create workspace type enum
CREATE TYPE public.workspace_type AS ENUM ('personal', 'team', 'department', 'client', 'project');

-- Create workspace role enum
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Create user status enum
CREATE TYPE public.user_status AS ENUM ('active', 'invited', 'disabled');

-- Create insight cadence enum
CREATE TYPE public.insight_cadence AS ENUM ('daily', 'weekly', 'monthly', 'manual');

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size INTEGER,
  owner_user_id UUID NOT NULL,
  plan org_plan NOT NULL DEFAULT 'free',
  sso_enabled BOOLEAN NOT NULL DEFAULT false,
  data_retention_days INTEGER NOT NULL DEFAULT 365,
  compliance_mode compliance_mode NOT NULL DEFAULT 'standard',
  workspace_visibility TEXT NOT NULL DEFAULT 'restricted',
  orchestrator_tenant_id TEXT,
  agent_cluster_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type workspace_type NOT NULL DEFAULT 'personal',
  created_by UUID NOT NULL,
  agent_cluster_id TEXT,
  default_persona TEXT,
  insight_cadence insight_cadence NOT NULL DEFAULT 'weekly',
  data_scope TEXT NOT NULL DEFAULT 'full',
  visibility TEXT NOT NULL DEFAULT 'private',
  data_domains_enabled TEXT[] DEFAULT ARRAY['communications', 'documents', 'events', 'financials', 'tasks', 'knowledge'],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workspace members table
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role workspace_role NOT NULL DEFAULT 'viewer',
  assigned_persona TEXT,
  assigned_agent_cluster_id TEXT,
  
  -- Permissions
  can_view_data BOOLEAN NOT NULL DEFAULT true,
  can_manage_connectors BOOLEAN NOT NULL DEFAULT false,
  can_manage_personas BOOLEAN NOT NULL DEFAULT false,
  can_manage_members BOOLEAN NOT NULL DEFAULT false,
  can_export_reports BOOLEAN NOT NULL DEFAULT false,
  can_delete_workspace BOOLEAN NOT NULL DEFAULT false,
  can_spawn_agents BOOLEAN NOT NULL DEFAULT false,
  can_merge_agents BOOLEAN NOT NULL DEFAULT false,
  can_retire_agents BOOLEAN NOT NULL DEFAULT false,
  can_issue_voice_commands BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(workspace_id, user_id)
);

-- Organization members table (for org-level membership)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(org_id, user_id)
);

-- Extend profiles table with Atlas-specific fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS atlas_voice_profile_id TEXT,
ADD COLUMN IF NOT EXISTS atlas_agent_profile_id TEXT,
ADD COLUMN IF NOT EXISTS preferred_persona TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is org member
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND org_id = _org_id
  ) OR EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _org_id AND owner_user_id = _user_id
  )
$$;

-- Helper function: Check if user is workspace member
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

-- Helper function: Check workspace permission
CREATE OR REPLACE FUNCTION public.has_workspace_permission(_user_id UUID, _workspace_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _permission
    WHEN 'can_view_data' THEN can_view_data
    WHEN 'can_manage_connectors' THEN can_manage_connectors
    WHEN 'can_manage_personas' THEN can_manage_personas
    WHEN 'can_manage_members' THEN can_manage_members
    WHEN 'can_export_reports' THEN can_export_reports
    WHEN 'can_delete_workspace' THEN can_delete_workspace
    WHEN 'can_spawn_agents' THEN can_spawn_agents
    WHEN 'can_merge_agents' THEN can_merge_agents
    WHEN 'can_retire_agents' THEN can_retire_agents
    WHEN 'can_issue_voice_commands' THEN can_issue_voice_commands
    ELSE false
  END
  FROM public.workspace_members
  WHERE user_id = _user_id AND workspace_id = _workspace_id
$$;

-- Organizations policies
CREATE POLICY "Users can view orgs they belong to"
ON public.organizations FOR SELECT
USING (public.is_org_member(auth.uid(), id) OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Org owners can update their org"
ON public.organizations FOR UPDATE
USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can create orgs"
ON public.organizations FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Org owners can delete their org"
ON public.organizations FOR DELETE
USING (owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

-- Workspaces policies
CREATE POLICY "Users can view workspaces they belong to"
ON public.workspaces FOR SELECT
USING (
  public.is_workspace_member(auth.uid(), id) 
  OR created_by = auth.uid()
  OR public.has_role(auth.uid(), 'superadmin')
);

CREATE POLICY "Workspace creators can update"
ON public.workspaces FOR UPDATE
USING (
  created_by = auth.uid() 
  OR public.has_workspace_permission(auth.uid(), id, 'can_manage_members')
  OR public.has_role(auth.uid(), 'superadmin')
);

CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Workspace owners can delete"
ON public.workspaces FOR DELETE
USING (
  created_by = auth.uid()
  OR public.has_workspace_permission(auth.uid(), id, 'can_delete_workspace')
  OR public.has_role(auth.uid(), 'superadmin')
);

-- Workspace members policies
CREATE POLICY "Members can view workspace members"
ON public.workspace_members FOR SELECT
USING (
  public.is_workspace_member(auth.uid(), workspace_id)
  OR public.has_role(auth.uid(), 'superadmin')
);

CREATE POLICY "Workspace admins can manage members"
ON public.workspace_members FOR INSERT
WITH CHECK (
  public.has_workspace_permission(auth.uid(), workspace_id, 'can_manage_members')
  OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND created_by = auth.uid())
  OR public.has_role(auth.uid(), 'superadmin')
);

CREATE POLICY "Workspace admins can update members"
ON public.workspace_members FOR UPDATE
USING (
  public.has_workspace_permission(auth.uid(), workspace_id, 'can_manage_members')
  OR public.has_role(auth.uid(), 'superadmin')
);

CREATE POLICY "Workspace admins can remove members"
ON public.workspace_members FOR DELETE
USING (
  public.has_workspace_permission(auth.uid(), workspace_id, 'can_manage_members')
  OR user_id = auth.uid()
  OR public.has_role(auth.uid(), 'superadmin')
);

-- Organization members policies
CREATE POLICY "Org members can view other members"
ON public.organization_members FOR SELECT
USING (public.is_org_member(auth.uid(), org_id) OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Org owners can manage members"
ON public.organization_members FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id AND owner_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'superadmin')
);

-- Indexes for performance
CREATE INDEX idx_organizations_owner ON public.organizations(owner_user_id);
CREATE INDEX idx_workspaces_org ON public.workspaces(org_id);
CREATE INDEX idx_workspaces_creator ON public.workspaces(created_by);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX idx_organization_members_org ON public.organization_members(org_id);
CREATE INDEX idx_organization_members_user ON public.organization_members(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_csuite_updated_at();

CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.update_csuite_updated_at();

CREATE TRIGGER update_workspace_members_updated_at
BEFORE UPDATE ON public.workspace_members
FOR EACH ROW EXECUTE FUNCTION public.update_csuite_updated_at();

-- Function to auto-create personal workspace for new users
CREATE OR REPLACE FUNCTION public.create_personal_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create personal workspace
  INSERT INTO public.workspaces (name, type, created_by, visibility)
  VALUES ('Personal Workspace', 'personal', NEW.user_id, 'private');
  
  -- Add user as owner member
  INSERT INTO public.workspace_members (workspace_id, user_id, role, can_view_data, can_manage_connectors, can_manage_personas, can_manage_members, can_export_reports, can_delete_workspace, can_spawn_agents, can_merge_agents, can_retire_agents, can_issue_voice_commands)
  SELECT id, NEW.user_id, 'owner', true, true, true, true, true, true, true, true, true, true
  FROM public.workspaces WHERE created_by = NEW.user_id AND type = 'personal';
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create personal workspace on profile creation
CREATE TRIGGER on_profile_created_create_workspace
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.create_personal_workspace();
