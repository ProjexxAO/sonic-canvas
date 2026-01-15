-- Add policy allowing users with admin/superadmin roles to view all user_roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'superadmin') OR 
    public.has_role(auth.uid(), 'admin')
  );