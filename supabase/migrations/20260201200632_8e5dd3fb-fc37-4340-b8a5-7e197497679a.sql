-- Fix last permissive RLS policy on knowledge_discoveries
-- This table has no user_id column, so we restrict to admins for system-generated content

DROP POLICY IF EXISTS "Service can insert discoveries" ON public.knowledge_discoveries;
CREATE POLICY "Admin insert discoveries"
ON public.knowledge_discoveries FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));