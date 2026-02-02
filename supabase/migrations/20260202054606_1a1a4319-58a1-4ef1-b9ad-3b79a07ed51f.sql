-- Fix error-level security issues

-- 1. Fix intent_task_mapping: Add admin-only INSERT policy (currently missing)
CREATE POLICY "Admins can insert intent mappings"
ON public.intent_task_mapping
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'superadmin')
  )
);

-- 2. Fix user-photos storage bucket: Make private to enforce RLS
UPDATE storage.buckets 
SET public = false 
WHERE id = 'user-photos';