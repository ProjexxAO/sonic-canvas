-- Create user_memory_messages table for persistent conversation memory
CREATE TABLE public.user_memory_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id TEXT NOT NULL DEFAULT 'atlas_voice',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_memory_summaries table for conversation summaries
CREATE TABLE public.user_memory_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id TEXT NOT NULL DEFAULT 'atlas_voice',
  summary TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_memory_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_memory_messages
CREATE POLICY "Users can view their own memory messages"
ON public.user_memory_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory messages"
ON public.user_memory_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory messages"
ON public.user_memory_messages
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for user_memory_summaries
CREATE POLICY "Users can view their own memory summaries"
ON public.user_memory_summaries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory summaries"
ON public.user_memory_summaries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory summaries"
ON public.user_memory_summaries
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_memory_messages_user_agent ON public.user_memory_messages(user_id, agent_id);
CREATE INDEX idx_user_memory_messages_created ON public.user_memory_messages(created_at DESC);
CREATE INDEX idx_user_memory_summaries_user_agent ON public.user_memory_summaries(user_id, agent_id);

-- Create trigger for updated_at on summaries
CREATE TRIGGER update_user_memory_summaries_updated_at
BEFORE UPDATE ON public.user_memory_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();