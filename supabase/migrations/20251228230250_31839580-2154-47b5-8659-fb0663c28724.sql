-- Create document_versions table to track historical versions
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'knowledge', -- 'knowledge', 'document', 'report'
  version_number TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  change_summary TEXT,
  changed_by UUID,
  is_current BOOLEAN NOT NULL DEFAULT false,
  is_enhanced BOOLEAN NOT NULL DEFAULT false,
  is_summary BOOLEAN NOT NULL DEFAULT false,
  parent_version_id UUID REFERENCES public.document_versions(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add version tracking fields to csuite_knowledge
ALTER TABLE public.csuite_knowledge 
ADD COLUMN IF NOT EXISTS current_version_id UUID,
ADD COLUMN IF NOT EXISTS version_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_versioned_at TIMESTAMP WITH TIME ZONE;

-- Add version tracking fields to csuite_documents
ALTER TABLE public.csuite_documents 
ADD COLUMN IF NOT EXISTS current_version_id UUID,
ADD COLUMN IF NOT EXISTS version_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_versioned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';

-- Enable RLS on document_versions
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_versions
CREATE POLICY "Users can view versions of their documents"
ON public.document_versions FOR SELECT
USING (
  changed_by = auth.uid() OR
  (document_type = 'knowledge' AND EXISTS (
    SELECT 1 FROM csuite_knowledge WHERE id = document_id AND user_id = auth.uid()
  )) OR
  (document_type = 'document' AND EXISTS (
    SELECT 1 FROM csuite_documents WHERE id = document_id AND user_id = auth.uid()
  ))
);

CREATE POLICY "Users can create versions of their documents"
ON public.document_versions FOR INSERT
WITH CHECK (
  changed_by = auth.uid() OR
  (document_type = 'knowledge' AND EXISTS (
    SELECT 1 FROM csuite_knowledge WHERE id = document_id AND user_id = auth.uid()
  )) OR
  (document_type = 'document' AND EXISTS (
    SELECT 1 FROM csuite_documents WHERE id = document_id AND user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update versions of their documents"
ON public.document_versions FOR UPDATE
USING (
  changed_by = auth.uid() OR
  (document_type = 'knowledge' AND EXISTS (
    SELECT 1 FROM csuite_knowledge WHERE id = document_id AND user_id = auth.uid()
  )) OR
  (document_type = 'document' AND EXISTS (
    SELECT 1 FROM csuite_documents WHERE id = document_id AND user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete versions of their documents"
ON public.document_versions FOR DELETE
USING (
  changed_by = auth.uid() OR
  (document_type = 'knowledge' AND EXISTS (
    SELECT 1 FROM csuite_knowledge WHERE id = document_id AND user_id = auth.uid()
  )) OR
  (document_type = 'document' AND EXISTS (
    SELECT 1 FROM csuite_documents WHERE id = document_id AND user_id = auth.uid()
  ))
);

-- Create indexes for performance
CREATE INDEX idx_document_versions_document ON public.document_versions(document_id, document_type);
CREATE INDEX idx_document_versions_current ON public.document_versions(document_id, is_current) WHERE is_current = true;
CREATE INDEX idx_document_versions_created ON public.document_versions(created_at DESC);

-- Function to create a new version
CREATE OR REPLACE FUNCTION public.create_document_version(
  p_document_id UUID,
  p_document_type TEXT,
  p_title TEXT,
  p_content TEXT,
  p_change_summary TEXT DEFAULT NULL,
  p_is_enhanced BOOLEAN DEFAULT false,
  p_is_summary BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_version_id UUID;
  v_current_version_id UUID;
  v_version_count INTEGER;
  v_new_version_number TEXT;
BEGIN
  -- Get current version info
  SELECT current_version_id, version_count 
  INTO v_current_version_id, v_version_count
  FROM (
    SELECT current_version_id, version_count FROM csuite_knowledge WHERE id = p_document_id AND p_document_type = 'knowledge'
    UNION ALL
    SELECT current_version_id, version_count FROM csuite_documents WHERE id = p_document_id AND p_document_type = 'document'
  ) combined
  LIMIT 1;

  -- Calculate new version number
  v_version_count := COALESCE(v_version_count, 0) + 1;
  v_new_version_number := '1.' || v_version_count::TEXT;

  -- Mark previous current version as not current
  UPDATE document_versions 
  SET is_current = false 
  WHERE document_id = p_document_id AND is_current = true;

  -- Insert new version
  INSERT INTO document_versions (
    document_id, document_type, version_number, title, content,
    change_summary, changed_by, is_current, is_enhanced, is_summary,
    parent_version_id, metadata
  ) VALUES (
    p_document_id, p_document_type, v_new_version_number, p_title, p_content,
    p_change_summary, auth.uid(), true, p_is_enhanced, p_is_summary,
    v_current_version_id, p_metadata
  ) RETURNING id INTO v_new_version_id;

  -- Update source document
  IF p_document_type = 'knowledge' THEN
    UPDATE csuite_knowledge 
    SET current_version_id = v_new_version_id,
        version_count = v_version_count,
        version = v_new_version_number,
        last_versioned_at = now(),
        updated_at = now()
    WHERE id = p_document_id AND user_id = auth.uid();
  ELSIF p_document_type = 'document' THEN
    UPDATE csuite_documents 
    SET current_version_id = v_new_version_id,
        version_count = v_version_count,
        version = v_new_version_number,
        last_versioned_at = now(),
        updated_at = now()
    WHERE id = p_document_id AND user_id = auth.uid();
  END IF;

  RETURN v_new_version_id;
END;
$$;

-- Function to restore a previous version
CREATE OR REPLACE FUNCTION public.restore_document_version(
  p_version_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_version RECORD;
  v_new_version_id UUID;
BEGIN
  -- Get version to restore
  SELECT * INTO v_version FROM document_versions WHERE id = p_version_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found';
  END IF;

  -- Create new version from restored content
  v_new_version_id := create_document_version(
    v_version.document_id,
    v_version.document_type,
    v_version.title,
    v_version.content,
    'Restored from version ' || v_version.version_number,
    v_version.is_enhanced,
    v_version.is_summary,
    v_version.metadata
  );

  RETURN v_new_version_id;
END;
$$;