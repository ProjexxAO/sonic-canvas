-- Create enum for agent sectors
CREATE TYPE public.agent_sector AS ENUM ('FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY');

-- Create enum for agent status
CREATE TYPE public.agent_status AS ENUM ('IDLE', 'ACTIVE', 'PROCESSING', 'ERROR', 'DORMANT');

-- Create enum for agent class
CREATE TYPE public.agent_class AS ENUM ('BASIC', 'ADVANCED', 'ELITE', 'SINGULARITY');

-- Create enum for waveform types
CREATE TYPE public.waveform_type AS ENUM ('sine', 'square', 'sawtooth', 'triangle');

-- Create sonic_agents table
CREATE TABLE public.sonic_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  sector agent_sector NOT NULL DEFAULT 'DATA',
  status agent_status NOT NULL DEFAULT 'IDLE',
  class agent_class NOT NULL DEFAULT 'BASIC',
  -- Sonic DNA fields
  waveform waveform_type NOT NULL DEFAULT 'sine',
  frequency DECIMAL NOT NULL DEFAULT 440,
  color TEXT NOT NULL DEFAULT '#00ffd5',
  modulation DECIMAL NOT NULL DEFAULT 5,
  density DECIMAL NOT NULL DEFAULT 50,
  -- Code artifact
  code_artifact TEXT,
  -- Metrics
  cycles INTEGER NOT NULL DEFAULT 0,
  efficiency DECIMAL NOT NULL DEFAULT 75,
  stability DECIMAL NOT NULL DEFAULT 85,
  -- Linked agents (stored as array of UUIDs)
  linked_agents UUID[] DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sonic_agents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own agents
CREATE POLICY "Users can view their own agents" 
ON public.sonic_agents 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own agents
CREATE POLICY "Users can create their own agents" 
ON public.sonic_agents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own agents
CREATE POLICY "Users can update their own agents" 
ON public.sonic_agents 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own agents
CREATE POLICY "Users can delete their own agents" 
ON public.sonic_agents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  operator_handle TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, operator_handle)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Operator'),
    CONCAT('OP-', UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8)))
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create index for faster queries
CREATE INDEX idx_sonic_agents_user_id ON public.sonic_agents(user_id);
CREATE INDEX idx_sonic_agents_sector ON public.sonic_agents(sector);
CREATE INDEX idx_sonic_agents_status ON public.sonic_agents(status);

-- Enable realtime for sonic_agents
ALTER PUBLICATION supabase_realtime ADD TABLE public.sonic_agents;