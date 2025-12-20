-- ===== C-SUITE DATA ORCHESTRATION SCHEMA =====

-- 1. Communications Table (emails, messages, transcripts)
CREATE TABLE public.csuite_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'gmail', 'outlook', 'upload', 'manual'
  source_id TEXT, -- external ID from source system
  type TEXT NOT NULL DEFAULT 'email', -- 'email', 'message', 'transcript'
  subject TEXT,
  content TEXT,
  from_address TEXT,
  to_addresses TEXT[],
  cc_addresses TEXT[],
  sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Documents Table (PDFs, spreadsheets, notes)
CREATE TABLE public.csuite_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'gdrive', 'dropbox', 'upload', 'manual'
  source_id TEXT, -- external ID from source system
  type TEXT NOT NULL DEFAULT 'document', -- 'pdf', 'spreadsheet', 'note', 'presentation'
  title TEXT NOT NULL,
  content TEXT, -- extracted text content
  file_path TEXT, -- storage bucket path
  file_size INTEGER,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Events Table (meetings, deadlines, milestones)
CREATE TABLE public.csuite_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'gcalendar', 'outlook', 'manual'
  source_id TEXT,
  type TEXT NOT NULL DEFAULT 'meeting', -- 'meeting', 'deadline', 'milestone', 'reminder'
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  attendees TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Financials Table (invoices, expenses, revenue)
CREATE TABLE public.csuite_financials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'quickbooks', 'xero', 'upload', 'manual'
  source_id TEXT,
  type TEXT NOT NULL DEFAULT 'transaction', -- 'invoice', 'expense', 'revenue', 'transaction'
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(15, 2),
  currency TEXT DEFAULT 'USD',
  category TEXT,
  counterparty TEXT, -- vendor, client, etc.
  transaction_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tasks Table (todos, reminders, project items)
CREATE TABLE public.csuite_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'asana', 'trello', 'manual'
  source_id TEXT,
  type TEXT NOT NULL DEFAULT 'task', -- 'task', 'reminder', 'project_item', 'subtask'
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to TEXT,
  project TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Knowledge Table (policies, SOPs, manuals)
CREATE TABLE public.csuite_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'confluence', 'notion', 'upload', 'manual'
  source_id TEXT,
  type TEXT NOT NULL DEFAULT 'article', -- 'policy', 'sop', 'manual', 'article', 'faq'
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT[],
  version TEXT DEFAULT '1.0',
  effective_date DATE,
  expiry_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Data Connectors Table (OAuth connections)
CREATE TABLE public.csuite_connectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'gmail', 'gdrive', 'outlook', 'dropbox', etc.
  status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected', 'syncing', 'error'
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_cursor TEXT, -- pagination/sync cursor for incremental sync
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- 8. C-Suite Reports Table (generated insights/briefings)
CREATE TABLE public.csuite_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  persona TEXT NOT NULL, -- 'ceo', 'cfo', 'coo', 'chief_of_staff'
  type TEXT NOT NULL DEFAULT 'briefing', -- 'briefing', 'summary', 'analysis', 'deck'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data_sources TEXT[], -- which tables/domains were used
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.csuite_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csuite_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csuite_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csuite_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csuite_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csuite_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csuite_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csuite_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view their own communications" ON public.csuite_communications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own communications" ON public.csuite_communications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own communications" ON public.csuite_communications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own communications" ON public.csuite_communications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own documents" ON public.csuite_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own documents" ON public.csuite_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.csuite_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.csuite_documents FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own events" ON public.csuite_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own events" ON public.csuite_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON public.csuite_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON public.csuite_events FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own financials" ON public.csuite_financials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own financials" ON public.csuite_financials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own financials" ON public.csuite_financials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own financials" ON public.csuite_financials FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own tasks" ON public.csuite_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.csuite_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.csuite_tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.csuite_tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own knowledge" ON public.csuite_knowledge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own knowledge" ON public.csuite_knowledge FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own knowledge" ON public.csuite_knowledge FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own knowledge" ON public.csuite_knowledge FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own connectors" ON public.csuite_connectors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own connectors" ON public.csuite_connectors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own connectors" ON public.csuite_connectors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own connectors" ON public.csuite_connectors FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports" ON public.csuite_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own reports" ON public.csuite_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reports" ON public.csuite_reports FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('csuite-documents', 'csuite-documents', false);

-- Storage policies
CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT USING (bucket_id = 'csuite-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'csuite-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE USING (bucket_id = 'csuite-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING (bucket_id = 'csuite-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better query performance
CREATE INDEX idx_csuite_communications_user_id ON public.csuite_communications(user_id);
CREATE INDEX idx_csuite_documents_user_id ON public.csuite_documents(user_id);
CREATE INDEX idx_csuite_events_user_id ON public.csuite_events(user_id);
CREATE INDEX idx_csuite_financials_user_id ON public.csuite_financials(user_id);
CREATE INDEX idx_csuite_tasks_user_id ON public.csuite_tasks(user_id);
CREATE INDEX idx_csuite_knowledge_user_id ON public.csuite_knowledge(user_id);
CREATE INDEX idx_csuite_connectors_user_id ON public.csuite_connectors(user_id);
CREATE INDEX idx_csuite_reports_user_id ON public.csuite_reports(user_id);

-- Updated at triggers
CREATE OR REPLACE FUNCTION public.update_csuite_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_csuite_communications_updated_at BEFORE UPDATE ON public.csuite_communications FOR EACH ROW EXECUTE FUNCTION public.update_csuite_updated_at();
CREATE TRIGGER update_csuite_documents_updated_at BEFORE UPDATE ON public.csuite_documents FOR EACH ROW EXECUTE FUNCTION public.update_csuite_updated_at();
CREATE TRIGGER update_csuite_events_updated_at BEFORE UPDATE ON public.csuite_events FOR EACH ROW EXECUTE FUNCTION public.update_csuite_updated_at();
CREATE TRIGGER update_csuite_financials_updated_at BEFORE UPDATE ON public.csuite_financials FOR EACH ROW EXECUTE FUNCTION public.update_csuite_updated_at();
CREATE TRIGGER update_csuite_tasks_updated_at BEFORE UPDATE ON public.csuite_tasks FOR EACH ROW EXECUTE FUNCTION public.update_csuite_updated_at();
CREATE TRIGGER update_csuite_knowledge_updated_at BEFORE UPDATE ON public.csuite_knowledge FOR EACH ROW EXECUTE FUNCTION public.update_csuite_updated_at();