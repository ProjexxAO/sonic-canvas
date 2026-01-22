-- Add INSERT policy for subscriptions table
CREATE POLICY "Users can insert own subscription" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for completeness
CREATE POLICY "Users can delete own subscription" 
ON public.subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);