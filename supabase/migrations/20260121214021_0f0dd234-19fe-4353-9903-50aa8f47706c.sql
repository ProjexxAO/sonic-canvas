-- Create storage bucket for user photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create user_photos table for metadata and categorization
CREATE TABLE IF NOT EXISTS public.user_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  
  -- Smart categorization
  category TEXT DEFAULT 'uncategorized',
  tags TEXT[] DEFAULT '{}',
  ai_tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  
  -- Social sharing
  shared_to TEXT[] DEFAULT '{}', -- e.g., ['instagram', 'facebook']
  share_history JSONB DEFAULT '[]',
  
  -- Metadata
  taken_at TIMESTAMP WITH TIME ZONE,
  location JSONB,
  exif_data JSONB,
  
  -- Status
  is_archived BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_photos
CREATE POLICY "Users can view their own photos"
  ON public.user_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos"
  ON public.user_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
  ON public.user_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON public.user_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for user-photos bucket
CREATE POLICY "Users can view their own photo files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own photo files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own photo files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photo files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create photo_albums table for user-created albums
CREATE TABLE IF NOT EXISTS public.photo_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_id UUID REFERENCES public.user_photos(id) ON DELETE SET NULL,
  is_smart BOOLEAN DEFAULT false,
  smart_filter JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for albums
ALTER TABLE public.photo_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own albums"
  ON public.photo_albums FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON public.user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_category ON public.user_photos(category);
CREATE INDEX IF NOT EXISTS idx_user_photos_tags ON public.user_photos USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_photos_created_at ON public.user_photos(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_user_photos_updated_at
  BEFORE UPDATE ON public.user_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();