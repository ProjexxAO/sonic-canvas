-- Fix remaining permissive RLS policies

-- service_logs
DROP POLICY IF EXISTS "Service logs are insertable by authenticated" ON public.service_logs;
CREATE POLICY "Service logs insert with user check"
ON public.service_logs FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- service_metrics
DROP POLICY IF EXISTS "Service metrics are insertable by authenticated" ON public.service_metrics;
CREATE POLICY "Service metrics insert with user check"
ON public.service_metrics FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- user_achievements
DROP POLICY IF EXISTS "System can insert achievements" ON public.user_achievements;
CREATE POLICY "Users receive own achievements"
ON public.user_achievements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- tool_catalog - admin only
DROP POLICY IF EXISTS "Authenticated users can insert tool catalog" ON public.tool_catalog;
CREATE POLICY "Admin tool catalog insert"
ON public.tool_catalog FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- intent_task_mapping - admin only
DROP POLICY IF EXISTS "Authenticated users can insert intent mappings" ON public.intent_task_mapping;

-- veracity_evaluations
DROP POLICY IF EXISTS "Users can create veracity evaluations" ON public.veracity_evaluations;
CREATE POLICY "Veracity evaluations user check"
ON public.veracity_evaluations FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());