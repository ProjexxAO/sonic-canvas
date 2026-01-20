-- Dashboard messages for chat
CREATE TABLE public.dashboard_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES public.shared_dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  reply_to_id UUID REFERENCES public.dashboard_messages(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Item comments
CREATE TABLE public.item_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shared_item_id UUID NOT NULL REFERENCES public.shared_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Dashboard notifications
CREATE TABLE public.dashboard_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES public.shared_dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Dashboard files
CREATE TABLE public.dashboard_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES public.shared_dashboards(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dashboard_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dashboard_messages
CREATE POLICY "Members can view dashboard messages"
  ON public.dashboard_messages FOR SELECT
  USING (is_dashboard_member(auth.uid(), dashboard_id));

CREATE POLICY "Members can insert dashboard messages"
  ON public.dashboard_messages FOR INSERT
  WITH CHECK (is_dashboard_member(auth.uid(), dashboard_id) AND auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON public.dashboard_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.dashboard_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for item_comments
CREATE POLICY "Members can view item comments"
  ON public.item_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shared_items si
    WHERE si.id = shared_item_id
    AND is_dashboard_member(auth.uid(), si.dashboard_id)
  ));

CREATE POLICY "Members can insert item comments"
  ON public.item_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.shared_items si
      WHERE si.id = shared_item_id
      AND is_dashboard_member(auth.uid(), si.dashboard_id)
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.item_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.item_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dashboard_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.dashboard_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can create notifications for others"
  ON public.dashboard_notifications FOR INSERT
  WITH CHECK (is_dashboard_member(auth.uid(), dashboard_id));

CREATE POLICY "Users can update their own notifications"
  ON public.dashboard_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.dashboard_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dashboard_files
CREATE POLICY "Members can view dashboard files"
  ON public.dashboard_files FOR SELECT
  USING (is_dashboard_member(auth.uid(), dashboard_id));

CREATE POLICY "Members with upload permission can insert files"
  ON public.dashboard_files FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.shared_dashboard_members sdm
      WHERE sdm.dashboard_id = dashboard_files.dashboard_id
      AND sdm.user_id = auth.uid()
      AND sdm.can_upload = true
    )
  );

CREATE POLICY "Uploaders and admins can delete files"
  ON public.dashboard_files FOR DELETE
  USING (
    auth.uid() = uploaded_by OR
    is_dashboard_admin(auth.uid(), dashboard_id)
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dashboard_notifications;

-- Create storage bucket for dashboard files
INSERT INTO storage.buckets (id, name, public)
VALUES ('dashboard-files', 'dashboard-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Dashboard members can view files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dashboard-files' AND
    EXISTS (
      SELECT 1 FROM public.dashboard_files df
      WHERE df.file_path = name
      AND is_dashboard_member(auth.uid(), df.dashboard_id)
    )
  );

CREATE POLICY "Members with upload permission can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dashboard-files' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "File owners can delete files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dashboard-files' AND
    auth.uid() IS NOT NULL
  );

-- Indexes for performance
CREATE INDEX idx_dashboard_messages_dashboard_id ON public.dashboard_messages(dashboard_id);
CREATE INDEX idx_dashboard_messages_created_at ON public.dashboard_messages(created_at DESC);
CREATE INDEX idx_item_comments_shared_item_id ON public.item_comments(shared_item_id);
CREATE INDEX idx_dashboard_notifications_user_id ON public.dashboard_notifications(user_id);
CREATE INDEX idx_dashboard_notifications_unread ON public.dashboard_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_dashboard_files_dashboard_id ON public.dashboard_files(dashboard_id);