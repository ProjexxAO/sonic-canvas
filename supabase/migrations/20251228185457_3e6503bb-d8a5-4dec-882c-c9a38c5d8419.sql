-- Enable realtime for profiles table to sync persona changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;