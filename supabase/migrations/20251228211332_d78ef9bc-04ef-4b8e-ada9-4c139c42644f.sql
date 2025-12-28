
-- Create enum for communication platforms
CREATE TYPE communication_platform AS ENUM (
  'internal', 'gmail', 'outlook', 'slack', 'teams', 'whatsapp', 'sms', 'messenger', 'other'
);

-- Create enum for message status
CREATE TYPE message_status AS ENUM (
  'draft', 'pending_approval', 'sent', 'delivered', 'read', 'failed'
);

-- Create enum for channel types
CREATE TYPE channel_type AS ENUM (
  'direct', 'private', 'public', 'announcement'
);

-- Create channels table for internal messaging
CREATE TABLE public.communication_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel_type channel_type NOT NULL DEFAULT 'private',
  created_by UUID NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  avatar_url TEXT,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel members table
CREATE TABLE public.channel_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.communication_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  is_muted BOOLEAN DEFAULT false,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Create unified messages table (works for both internal and external)
CREATE TABLE public.communication_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform communication_platform NOT NULL DEFAULT 'internal',
  channel_id UUID REFERENCES public.communication_channels(id) ON DELETE CASCADE,
  parent_message_id UUID REFERENCES public.communication_messages(id) ON DELETE SET NULL,
  thread_root_id UUID REFERENCES public.communication_messages(id) ON DELETE SET NULL,
  
  -- Content
  subject TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  
  -- External platform fields
  external_id TEXT,
  from_address TEXT,
  to_addresses TEXT[],
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  
  -- Status and metadata
  status message_status NOT NULL DEFAULT 'sent',
  is_incoming BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Atlas draft fields
  drafted_by_atlas BOOLEAN DEFAULT false,
  atlas_draft_context JSONB,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  
  -- Attachments stored as JSON array
  attachments JSONB DEFAULT '[]'::jsonb,
  
  -- Embedding for semantic search
  embedding vector(1536),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.communication_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create message read receipts
CREATE TABLE public.message_read_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.communication_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create platform connections table (for OAuth tokens)
CREATE TABLE public.platform_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform communication_platform NOT NULL,
  account_email TEXT,
  account_name TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_cursor TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, account_email)
);

-- Add indexes for performance
CREATE INDEX idx_communication_messages_user ON public.communication_messages(user_id);
CREATE INDEX idx_communication_messages_channel ON public.communication_messages(channel_id);
CREATE INDEX idx_communication_messages_platform ON public.communication_messages(platform);
CREATE INDEX idx_communication_messages_thread ON public.communication_messages(thread_root_id);
CREATE INDEX idx_communication_messages_status ON public.communication_messages(status);
CREATE INDEX idx_communication_messages_sent_at ON public.communication_messages(sent_at DESC);
CREATE INDEX idx_channel_members_user ON public.channel_members(user_id);
CREATE INDEX idx_platform_connections_user ON public.platform_connections(user_id);

-- Enable RLS on all tables
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communication_channels
CREATE POLICY "Users can view channels they are members of"
ON public.communication_channels FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = id AND user_id = auth.uid())
  OR channel_type = 'public'
  OR created_by = auth.uid()
);

CREATE POLICY "Users can create channels"
ON public.communication_channels FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Channel creators can update their channels"
ON public.communication_channels FOR UPDATE
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.channel_members 
  WHERE channel_id = id AND user_id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Channel creators can delete their channels"
ON public.communication_channels FOR DELETE
USING (auth.uid() = created_by);

-- RLS Policies for channel_members
CREATE POLICY "Users can view members of their channels"
ON public.channel_members FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid())
);

CREATE POLICY "Channel admins can add members"
ON public.channel_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'owner'))
  OR EXISTS (SELECT 1 FROM public.communication_channels cc WHERE cc.id = channel_id AND cc.created_by = auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Channel admins can update members"
ON public.channel_members FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'owner'))
  OR user_id = auth.uid()
);

CREATE POLICY "Channel admins can remove members"
ON public.channel_members FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'owner'))
  OR user_id = auth.uid()
);

-- RLS Policies for communication_messages
CREATE POLICY "Users can view their own messages"
ON public.communication_messages FOR SELECT
USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = communication_messages.channel_id AND user_id = auth.uid())
);

CREATE POLICY "Users can create their own messages"
ON public.communication_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
ON public.communication_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
ON public.communication_messages FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for message_reactions
CREATE POLICY "Users can view reactions on accessible messages"
ON public.message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.communication_messages m
    WHERE m.id = message_id AND (
      m.user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = m.channel_id AND user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can add their own reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for message_read_receipts
CREATE POLICY "Users can view read receipts"
ON public.message_read_receipts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own read receipts"
ON public.message_read_receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for platform_connections
CREATE POLICY "Users can view their own platform connections"
ON public.platform_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own platform connections"
ON public.platform_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platform connections"
ON public.platform_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own platform connections"
ON public.platform_connections FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_communication_channels_updated_at
  BEFORE UPDATE ON public.communication_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communication_messages_updated_at
  BEFORE UPDATE ON public.communication_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_connections_updated_at
  BEFORE UPDATE ON public.platform_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
