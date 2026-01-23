-- Fix the overly permissive audit log insert policy - restrict to authenticated users inserting their own logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.verification_audit_log;

CREATE POLICY "Authenticated users can insert own audit logs"
ON public.verification_audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);