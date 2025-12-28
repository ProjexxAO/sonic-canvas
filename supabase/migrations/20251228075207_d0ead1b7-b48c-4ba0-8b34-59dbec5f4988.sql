-- Create persona_permissions table to control what data domains each persona can access
CREATE TABLE public.persona_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(persona_id, domain)
);

-- Enable RLS
ALTER TABLE public.persona_permissions ENABLE ROW LEVEL SECURITY;

-- Superadmins can do everything
CREATE POLICY "Superadmins can manage persona permissions"
ON public.persona_permissions
FOR ALL
USING (has_role(auth.uid(), 'superadmin'))
WITH CHECK (has_role(auth.uid(), 'superadmin'));

-- All authenticated users can view permissions
CREATE POLICY "Authenticated users can view persona permissions"
ON public.persona_permissions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger to update updated_at
CREATE TRIGGER update_persona_permissions_updated_at
  BEFORE UPDATE ON public.persona_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default permissions for all personas and domains
INSERT INTO public.persona_permissions (persona_id, domain, can_view, can_create, can_edit, can_delete)
VALUES
  -- CEO - full access to all
  ('ceo', 'communications', true, true, true, true),
  ('ceo', 'documents', true, true, true, true),
  ('ceo', 'events', true, true, true, true),
  ('ceo', 'financials', true, true, true, true),
  ('ceo', 'tasks', true, true, true, true),
  ('ceo', 'knowledge', true, true, true, true),
  
  -- CFO - focus on financials
  ('cfo', 'communications', true, false, false, false),
  ('cfo', 'documents', true, true, true, false),
  ('cfo', 'events', true, false, false, false),
  ('cfo', 'financials', true, true, true, true),
  ('cfo', 'tasks', true, true, true, false),
  ('cfo', 'knowledge', true, true, false, false),
  
  -- CMO - focus on communications
  ('cmo', 'communications', true, true, true, true),
  ('cmo', 'documents', true, true, true, false),
  ('cmo', 'events', true, true, true, false),
  ('cmo', 'financials', true, false, false, false),
  ('cmo', 'tasks', true, true, true, false),
  ('cmo', 'knowledge', true, true, true, false),
  
  -- CTO - focus on technical
  ('cto', 'communications', true, true, false, false),
  ('cto', 'documents', true, true, true, true),
  ('cto', 'events', true, true, false, false),
  ('cto', 'financials', true, false, false, false),
  ('cto', 'tasks', true, true, true, true),
  ('cto', 'knowledge', true, true, true, true),
  
  -- COO - operations focus
  ('coo', 'communications', true, true, true, false),
  ('coo', 'documents', true, true, true, true),
  ('coo', 'events', true, true, true, true),
  ('coo', 'financials', true, true, false, false),
  ('coo', 'tasks', true, true, true, true),
  ('coo', 'knowledge', true, true, true, false),
  
  -- CHRO - people focus
  ('chro', 'communications', true, true, true, false),
  ('chro', 'documents', true, true, true, false),
  ('chro', 'events', true, true, true, false),
  ('chro', 'financials', false, false, false, false),
  ('chro', 'tasks', true, true, true, false),
  ('chro', 'knowledge', true, true, true, false),
  
  -- CRO - revenue focus
  ('cro', 'communications', true, true, true, false),
  ('cro', 'documents', true, true, false, false),
  ('cro', 'events', true, true, true, false),
  ('cro', 'financials', true, true, false, false),
  ('cro', 'tasks', true, true, true, false),
  ('cro', 'knowledge', true, true, false, false),
  
  -- CLO - legal focus
  ('clo', 'communications', true, false, false, false),
  ('clo', 'documents', true, true, true, true),
  ('clo', 'events', true, false, false, false),
  ('clo', 'financials', true, false, false, false),
  ('clo', 'tasks', true, true, true, false),
  ('clo', 'knowledge', true, true, true, true),
  
  -- CISO - security focus
  ('ciso', 'communications', true, false, false, false),
  ('ciso', 'documents', true, true, true, false),
  ('ciso', 'events', true, false, false, false),
  ('ciso', 'financials', false, false, false, false),
  ('ciso', 'tasks', true, true, true, false),
  ('ciso', 'knowledge', true, true, true, true),
  
  -- CCO - compliance focus
  ('cco', 'communications', true, false, false, false),
  ('cco', 'documents', true, true, true, true),
  ('cco', 'events', true, false, false, false),
  ('cco', 'financials', true, false, false, false),
  ('cco', 'tasks', true, true, true, false),
  ('cco', 'knowledge', true, true, true, true),
  
  -- Chief of Staff - cross-functional
  ('chief_of_staff', 'communications', true, true, true, false),
  ('chief_of_staff', 'documents', true, true, true, false),
  ('chief_of_staff', 'events', true, true, true, true),
  ('chief_of_staff', 'financials', true, false, false, false),
  ('chief_of_staff', 'tasks', true, true, true, true),
  ('chief_of_staff', 'knowledge', true, true, true, false),
  
  -- Chief People Officer
  ('chief_people', 'communications', true, true, true, false),
  ('chief_people', 'documents', true, true, true, false),
  ('chief_people', 'events', true, true, true, false),
  ('chief_people', 'financials', false, false, false, false),
  ('chief_people', 'tasks', true, true, true, false),
  ('chief_people', 'knowledge', true, true, true, false),
  
  -- Admin - full access
  ('admin', 'communications', true, true, true, true),
  ('admin', 'documents', true, true, true, true),
  ('admin', 'events', true, true, true, true),
  ('admin', 'financials', true, true, true, true),
  ('admin', 'tasks', true, true, true, true),
  ('admin', 'knowledge', true, true, true, true);