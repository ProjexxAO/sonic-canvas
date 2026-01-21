-- =====================================================
-- GROUP DATA HUB SCHEMA WITH CROSS-HUB ACCESS CONTROL
-- Industry-standard security with admin invitation patterns
-- =====================================================

-- Group role enum for role-based access
CREATE TYPE public.group_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Cross-hub access type for invitation system
CREATE TYPE public.cross_hub_access_type AS ENUM ('read', 'write', 'admin');

-- =====================================================
-- GROUP HUBS (Team/Family/Organization Workspaces)
-- =====================================================
CREATE TABLE public.group_hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  hub_type TEXT NOT NULL DEFAULT 'team' CHECK (hub_type IN ('team', 'family', 'project', 'department', 'organization')),
  
  -- Owner and visibility
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'members', 'organization', 'public')),
  
  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  max_members INTEGER DEFAULT 10,
  member_count INTEGER DEFAULT 1,
  
  -- AI features
  embedding vector(1536),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- GROUP MEMBERS (Role-based access control)
-- =====================================================
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.group_hubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'member',
  
  -- Granular permissions
  can_invite BOOLEAN DEFAULT FALSE,
  can_remove_members BOOLEAN DEFAULT FALSE,
  can_manage_items BOOLEAN DEFAULT TRUE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_export_data BOOLEAN DEFAULT FALSE,
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(group_id, user_id)
);

-- =====================================================
-- GROUP ITEMS (Shared tasks, notes, events, etc.)
-- =====================================================
CREATE TABLE public.group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.group_hubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item type and content (matches personal_items structure)
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'note', 'event', 'goal', 'resource', 'announcement', 'poll')),
  title TEXT NOT NULL,
  content TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  -- Status and priority
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'deleted')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Assignment (for tasks)
  assigned_to UUID[] DEFAULT '{}',
  
  -- Dates
  due_date TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  
  -- AI features
  embedding vector(1536),
  ai_summary TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- GROUP ACTIVITY LOG (Audit trail)
-- =====================================================
CREATE TABLE public.group_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.group_hubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity details
  action TEXT NOT NULL CHECK (action IN (
    'member_joined', 'member_left', 'member_invited', 'member_removed',
    'role_changed', 'item_created', 'item_updated', 'item_deleted', 'item_completed',
    'settings_changed', 'hub_created', 'hub_updated'
  )),
  target_type TEXT, -- 'member', 'item', 'settings'
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- GROUP INVITATIONS (Pending invites)
-- =====================================================
CREATE TABLE public.group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.group_hubs(id) ON DELETE CASCADE,
  
  -- Invitation details
  email TEXT NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id), -- NULL if user doesn't exist yet
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role group_role NOT NULL DEFAULT 'member',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  
  -- Token for email invites
  invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);

-- =====================================================
-- CROSS-HUB ACCESS GRANTS (Admin invitation system)
-- Allows Personal Hub users to access Group/C-Suite data
-- =====================================================
CREATE TABLE public.cross_hub_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who is being granted access
  grantee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Which hub is granting access
  source_hub_type hub_type NOT NULL,
  source_hub_id UUID, -- NULL for personal hub (uses grantee's own data)
  
  -- What type of access
  access_type cross_hub_access_type NOT NULL DEFAULT 'read',
  
  -- Specific domains (NULL = all domains)
  allowed_domains TEXT[] DEFAULT NULL,
  
  -- Who granted access
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate grants
  UNIQUE(grantee_user_id, source_hub_type, source_hub_id)
);

-- =====================================================
-- SECURITY HELPER FUNCTIONS
-- =====================================================

-- Check if user is a group member
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  ) OR EXISTS (
    SELECT 1 FROM public.group_hubs
    WHERE id = _group_id AND owner_id = _user_id
  )
$$;

-- Check if user is a group admin (admin or owner)
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id 
      AND group_id = _group_id
      AND role IN ('admin', 'owner')
  ) OR EXISTS (
    SELECT 1 FROM public.group_hubs
    WHERE id = _group_id AND owner_id = _user_id
  )
$$;

-- Check if user is group owner
CREATE OR REPLACE FUNCTION public.is_group_owner(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_hubs
    WHERE id = _group_id AND owner_id = _user_id
  )
$$;

-- Check cross-hub access permission
CREATE OR REPLACE FUNCTION public.has_cross_hub_access(
  _user_id UUID, 
  _source_hub_type hub_type, 
  _source_hub_id UUID DEFAULT NULL,
  _required_access cross_hub_access_type DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cross_hub_access
    WHERE grantee_user_id = _user_id
      AND source_hub_type = _source_hub_type
      AND (source_hub_id = _source_hub_id OR _source_hub_id IS NULL)
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        access_type = _required_access
        OR (access_type = 'admin')
        OR (access_type = 'write' AND _required_access = 'read')
      )
  )
$$;

-- Get user's effective tier (for cross-hub access validation)
CREATE OR REPLACE FUNCTION public.get_effective_tier(_user_id UUID)
RETURNS subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tier FROM public.subscriptions WHERE user_id = _user_id AND status = 'active'),
    'free'::subscription_tier
  )
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE public.group_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_hub_access ENABLE ROW LEVEL SECURITY;

-- GROUP HUBS POLICIES
CREATE POLICY "Users can view groups they are members of"
  ON public.group_hubs FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR is_group_member(auth.uid(), id)
    OR visibility = 'public'
  );

CREATE POLICY "Users can create groups based on tier"
  ON public.group_hubs FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND get_effective_tier(auth.uid()) IN ('team', 'business', 'enterprise')
  );

CREATE POLICY "Only admins can update groups"
  ON public.group_hubs FOR UPDATE
  USING (is_group_admin(auth.uid(), id));

CREATE POLICY "Only owners can delete groups"
  ON public.group_hubs FOR DELETE
  USING (owner_id = auth.uid());

-- GROUP MEMBERS POLICIES
CREATE POLICY "Members can view other members"
  ON public.group_members FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Admins can add members"
  ON public.group_members FOR INSERT
  WITH CHECK (is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins can update member roles"
  ON public.group_members FOR UPDATE
  USING (is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins can remove members or self-remove"
  ON public.group_members FOR DELETE
  USING (
    is_group_admin(auth.uid(), group_id)
    OR user_id = auth.uid()
  );

-- GROUP ITEMS POLICIES
CREATE POLICY "Members can view group items"
  ON public.group_items FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can create items"
  ON public.group_items FOR INSERT
  WITH CHECK (
    is_group_member(auth.uid(), group_id)
    AND auth.uid() = created_by
  );

CREATE POLICY "Creators and admins can update items"
  ON public.group_items FOR UPDATE
  USING (
    created_by = auth.uid()
    OR is_group_admin(auth.uid(), group_id)
  );

CREATE POLICY "Creators and admins can delete items"
  ON public.group_items FOR DELETE
  USING (
    created_by = auth.uid()
    OR is_group_admin(auth.uid(), group_id)
  );

-- GROUP ACTIVITY POLICIES
CREATE POLICY "Members can view group activity"
  ON public.group_activity FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "System can insert activity"
  ON public.group_activity FOR INSERT
  WITH CHECK (is_group_member(auth.uid(), group_id));

-- GROUP INVITATIONS POLICIES
CREATE POLICY "Admins can view invitations"
  ON public.group_invitations FOR SELECT
  USING (
    is_group_admin(auth.uid(), group_id)
    OR invited_user_id = auth.uid()
  );

CREATE POLICY "Admins can create invitations"
  ON public.group_invitations FOR INSERT
  WITH CHECK (is_group_admin(auth.uid(), group_id));

CREATE POLICY "Admins or invitees can update invitations"
  ON public.group_invitations FOR UPDATE
  USING (
    is_group_admin(auth.uid(), group_id)
    OR invited_user_id = auth.uid()
  );

CREATE POLICY "Admins can delete invitations"
  ON public.group_invitations FOR DELETE
  USING (is_group_admin(auth.uid(), group_id));

-- CROSS-HUB ACCESS POLICIES
CREATE POLICY "Users can view their granted access"
  ON public.cross_hub_access FOR SELECT
  USING (
    grantee_user_id = auth.uid()
    OR granted_by = auth.uid()
  );

CREATE POLICY "Admins can grant cross-hub access"
  ON public.cross_hub_access FOR INSERT
  WITH CHECK (
    auth.uid() = granted_by
    AND (
      -- Personal hub owner can grant access to their data
      (source_hub_type = 'personal' AND source_hub_id IS NULL)
      -- Group admin can grant access
      OR (source_hub_type = 'group' AND is_group_admin(auth.uid(), source_hub_id))
      -- C-Suite admin can grant access
      OR (source_hub_type = 'csuite' AND public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Granters can revoke access"
  ON public.cross_hub_access FOR DELETE
  USING (granted_by = auth.uid());

CREATE POLICY "Granters can update access"
  ON public.cross_hub_access FOR UPDATE
  USING (granted_by = auth.uid());

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Auto-add owner as member when group is created
CREATE OR REPLACE FUNCTION public.auto_add_group_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, can_invite, can_remove_members, can_manage_items, can_view_analytics, can_export_data)
  VALUES (NEW.id, NEW.owner_id, 'owner', true, true, true, true, true)
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created_add_owner
  AFTER INSERT ON public.group_hubs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_group_owner();

-- Update member count when members change
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.group_hubs SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.group_hubs SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_member_change_update_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_group_member_count();

-- Log group activity automatically
CREATE OR REPLACE FUNCTION public.log_group_item_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.group_activity (group_id, user_id, action, target_type, target_id, details)
    VALUES (NEW.group_id, NEW.created_by, 'item_created', 'item', NEW.id, 
      jsonb_build_object('item_type', NEW.item_type, 'title', NEW.title));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      INSERT INTO public.group_activity (group_id, user_id, action, target_type, target_id, details)
      VALUES (NEW.group_id, auth.uid(), 'item_completed', 'item', NEW.id,
        jsonb_build_object('item_type', NEW.item_type, 'title', NEW.title));
    ELSE
      INSERT INTO public.group_activity (group_id, user_id, action, target_type, target_id, details)
      VALUES (NEW.group_id, auth.uid(), 'item_updated', 'item', NEW.id,
        jsonb_build_object('item_type', NEW.item_type, 'title', NEW.title));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.group_activity (group_id, user_id, action, target_type, target_id, details)
    VALUES (OLD.group_id, auth.uid(), 'item_deleted', 'item', OLD.id,
      jsonb_build_object('item_type', OLD.item_type, 'title', OLD.title));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_group_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.group_items
  FOR EACH ROW
  EXECUTE FUNCTION public.log_group_item_activity();

-- Updated_at trigger for all new tables
CREATE TRIGGER update_group_hubs_updated_at
  BEFORE UPDATE ON public.group_hubs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_group_members_updated_at
  BEFORE UPDATE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_group_items_updated_at
  BEFORE UPDATE ON public.group_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_cross_hub_access_updated_at
  BEFORE UPDATE ON public.cross_hub_access
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_group_hubs_owner ON public.group_hubs(owner_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_items_group ON public.group_items(group_id);
CREATE INDEX idx_group_items_created_by ON public.group_items(created_by);
CREATE INDEX idx_group_items_status ON public.group_items(status);
CREATE INDEX idx_group_activity_group ON public.group_activity(group_id);
CREATE INDEX idx_group_activity_created_at ON public.group_activity(created_at DESC);
CREATE INDEX idx_group_invitations_email ON public.group_invitations(email);
CREATE INDEX idx_group_invitations_token ON public.group_invitations(invite_token);
CREATE INDEX idx_cross_hub_access_grantee ON public.cross_hub_access(grantee_user_id);
CREATE INDEX idx_cross_hub_access_source ON public.cross_hub_access(source_hub_type, source_hub_id);

-- Enable realtime for activity feeds
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_items;