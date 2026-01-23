-- Widget Version History - Track all widget versions for safe updates and rollback
CREATE TABLE public.widget_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  version_name TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  ai_capabilities JSONB,
  data_sources TEXT[],
  style JSONB,
  layout JSONB,
  agent_chain TEXT[],
  generation_prompt TEXT,
  
  -- Metadata
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'user', -- 'user', 'atlas', 'auto-update'
  change_summary TEXT,
  
  -- Data integrity
  data_snapshot JSONB, -- Stores widget-specific user data at version time
  rollback_available BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.widget_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their widget versions"
ON public.widget_versions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create widget versions"
ON public.widget_versions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their widget versions"
ON public.widget_versions FOR UPDATE
USING (auth.uid() = user_id);

-- Widget Update Registry - Track available updates and best practices
CREATE TABLE public.widget_update_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_type TEXT NOT NULL,
  category TEXT NOT NULL, -- 'finance', 'health', 'productivity', etc.
  latest_version INTEGER NOT NULL DEFAULT 1,
  version_name TEXT,
  
  -- Update metadata
  improvements JSONB, -- List of improvements in this version
  required_data_sources TEXT[],
  new_capabilities TEXT[],
  deprecated_features TEXT[],
  
  -- Best practices from research
  best_practices JSONB,
  security_notes TEXT,
  performance_tips TEXT[],
  
  -- Compatibility
  min_compatible_version INTEGER DEFAULT 1,
  breaking_changes BOOLEAN DEFAULT false,
  migration_script JSONB, -- Instructions for safe migration
  
  -- Source
  source_url TEXT,
  last_researched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (readable by all authenticated users)
ALTER TABLE public.widget_update_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read update registry"
ON public.widget_update_registry FOR SELECT
TO authenticated
USING (true);

-- Add update tracking columns to custom_widgets
ALTER TABLE public.custom_widgets 
ADD COLUMN IF NOT EXISTS last_update_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS update_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS update_version INTEGER,
ADD COLUMN IF NOT EXISTS auto_update BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_hash TEXT,
ADD COLUMN IF NOT EXISTS security_verified BOOLEAN DEFAULT true;

-- Index for efficient version lookups
CREATE INDEX idx_widget_versions_widget_id ON public.widget_versions(widget_id);
CREATE INDEX idx_widget_versions_user_current ON public.widget_versions(user_id, is_current);
CREATE INDEX idx_update_registry_type ON public.widget_update_registry(widget_type, category);

-- Function to create version snapshot before update
CREATE OR REPLACE FUNCTION public.create_widget_version_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create snapshot if version is incrementing
  IF NEW.version > OLD.version THEN
    INSERT INTO public.widget_versions (
      widget_id,
      user_id,
      version_number,
      config,
      ai_capabilities,
      data_sources,
      style,
      layout,
      agent_chain,
      generation_prompt,
      is_current,
      created_by,
      change_summary
    ) VALUES (
      OLD.id,
      OLD.user_id,
      OLD.version,
      OLD.config,
      OLD.ai_capabilities,
      OLD.data_sources,
      OLD.style,
      OLD.layout,
      OLD.agent_chain,
      OLD.generation_prompt,
      false,
      'auto-update',
      'Pre-update snapshot'
    );
    
    -- Mark new version as current
    UPDATE public.widget_versions 
    SET is_current = true 
    WHERE widget_id = NEW.id AND version_number = NEW.version;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-snapshot on version change
CREATE TRIGGER widget_version_snapshot_trigger
AFTER UPDATE ON public.custom_widgets
FOR EACH ROW
WHEN (NEW.version > OLD.version)
EXECUTE FUNCTION public.create_widget_version_snapshot();