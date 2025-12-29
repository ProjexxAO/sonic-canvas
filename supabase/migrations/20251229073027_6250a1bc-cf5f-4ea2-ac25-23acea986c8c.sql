-- Create security definer function to check if user is a channel member
CREATE OR REPLACE FUNCTION public.is_channel_member(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.channel_members
    WHERE user_id = _user_id
      AND channel_id = _channel_id
  )
$$;

-- Create security definer function to check if user is channel admin/owner
CREATE OR REPLACE FUNCTION public.is_channel_admin(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.channel_members
    WHERE user_id = _user_id
      AND channel_id = _channel_id
      AND role IN ('admin', 'owner')
  )
$$;

-- Create security definer function to check if user created the channel
CREATE OR REPLACE FUNCTION public.is_channel_creator(_user_id uuid, _channel_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.communication_channels
    WHERE id = _channel_id
      AND created_by = _user_id
  )
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view members of their channels" ON public.channel_members;
DROP POLICY IF EXISTS "Channel admins can add members" ON public.channel_members;
DROP POLICY IF EXISTS "Channel admins can update members" ON public.channel_members;
DROP POLICY IF EXISTS "Channel admins can remove members" ON public.channel_members;

-- Create new policies using security definer functions
CREATE POLICY "Users can view members of their channels"
ON public.channel_members
FOR SELECT
USING (
  public.is_channel_member(auth.uid(), channel_id)
);

CREATE POLICY "Channel admins can add members"
ON public.channel_members
FOR INSERT
WITH CHECK (
  public.is_channel_admin(auth.uid(), channel_id)
  OR public.is_channel_creator(auth.uid(), channel_id)
  OR user_id = auth.uid()
);

CREATE POLICY "Channel admins can update members"
ON public.channel_members
FOR UPDATE
USING (
  public.is_channel_admin(auth.uid(), channel_id)
  OR user_id = auth.uid()
);

CREATE POLICY "Channel admins can remove members"
ON public.channel_members
FOR DELETE
USING (
  public.is_channel_admin(auth.uid(), channel_id)
  OR user_id = auth.uid()
);