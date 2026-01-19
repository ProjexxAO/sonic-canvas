-- Create shared dashboards table
CREATE TABLE public.shared_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create dashboard members table
CREATE TABLE public.shared_dashboard_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES shared_dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  can_upload BOOLEAN DEFAULT false,
  can_share BOOLEAN DEFAULT false,
  can_comment BOOLEAN DEFAULT true,
  invited_by UUID,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dashboard_id, user_id)
);

-- Create shared items table
CREATE TABLE public.shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES shared_dashboards(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  shared_by UUID NOT NULL,
  note TEXT,
  pin_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create dashboard activity table
CREATE TABLE public.dashboard_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES shared_dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  item_type TEXT,
  item_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.shared_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_dashboard_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_activity ENABLE ROW LEVEL SECURITY;

-- Helper function to check dashboard membership
CREATE OR REPLACE FUNCTION public.is_dashboard_member(_user_id UUID, _dashboard_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_dashboard_members
    WHERE user_id = _user_id AND dashboard_id = _dashboard_id
  )
$$;

-- Helper function to check dashboard admin
CREATE OR REPLACE FUNCTION public.is_dashboard_admin(_user_id UUID, _dashboard_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_dashboard_members
    WHERE user_id = _user_id 
      AND dashboard_id = _dashboard_id 
      AND role IN ('admin', 'owner')
  ) OR EXISTS (
    SELECT 1 FROM public.shared_dashboards
    WHERE id = _dashboard_id AND created_by = _user_id
  )
$$;

-- RLS Policies for shared_dashboards
CREATE POLICY "Users can view dashboards they are members of"
ON public.shared_dashboards FOR SELECT
USING (
  created_by = auth.uid() OR 
  is_dashboard_member(auth.uid(), id) OR
  (visibility = 'workspace' AND workspace_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create dashboards"
ON public.shared_dashboards FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Dashboard admins can update"
ON public.shared_dashboards FOR UPDATE
USING (is_dashboard_admin(auth.uid(), id));

CREATE POLICY "Dashboard creators can delete"
ON public.shared_dashboards FOR DELETE
USING (created_by = auth.uid());

-- RLS Policies for shared_dashboard_members
CREATE POLICY "Members can view other members"
ON public.shared_dashboard_members FOR SELECT
USING (is_dashboard_member(auth.uid(), dashboard_id));

CREATE POLICY "Admins can add members"
ON public.shared_dashboard_members FOR INSERT
WITH CHECK (is_dashboard_admin(auth.uid(), dashboard_id));

CREATE POLICY "Admins can update members"
ON public.shared_dashboard_members FOR UPDATE
USING (is_dashboard_admin(auth.uid(), dashboard_id));

CREATE POLICY "Admins can remove members"
ON public.shared_dashboard_members FOR DELETE
USING (is_dashboard_admin(auth.uid(), dashboard_id) OR user_id = auth.uid());

-- RLS Policies for shared_items
CREATE POLICY "Members can view shared items"
ON public.shared_items FOR SELECT
USING (is_dashboard_member(auth.uid(), dashboard_id));

CREATE POLICY "Contributors can share items"
ON public.shared_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shared_dashboard_members
    WHERE dashboard_id = shared_items.dashboard_id
      AND user_id = auth.uid()
      AND (role IN ('contributor', 'editor', 'admin', 'owner') OR can_share = true)
  )
);

CREATE POLICY "Editors can update shared items"
ON public.shared_items FOR UPDATE
USING (
  shared_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM shared_dashboard_members
    WHERE dashboard_id = shared_items.dashboard_id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin', 'owner')
  )
);

CREATE POLICY "Editors can delete shared items"
ON public.shared_items FOR DELETE
USING (
  shared_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM shared_dashboard_members
    WHERE dashboard_id = shared_items.dashboard_id
      AND user_id = auth.uid()
      AND role IN ('editor', 'admin', 'owner')
  )
);

-- RLS Policies for dashboard_activity
CREATE POLICY "Members can view activity"
ON public.dashboard_activity FOR SELECT
USING (is_dashboard_member(auth.uid(), dashboard_id));

CREATE POLICY "Members can log activity"
ON public.dashboard_activity FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  is_dashboard_member(auth.uid(), dashboard_id)
);

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_items;

-- Add updated_at trigger
CREATE TRIGGER update_shared_dashboards_updated_at
BEFORE UPDATE ON public.shared_dashboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();