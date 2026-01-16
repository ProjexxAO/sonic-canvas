-- Enable realtime for agent_task_queue table
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_task_queue;

-- Enable realtime for agent_notifications table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_notifications;