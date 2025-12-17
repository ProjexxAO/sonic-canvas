-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding and searchable fields to sonic_agents
ALTER TABLE public.sonic_agents 
ADD COLUMN IF NOT EXISTS embedding vector(1536),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS capabilities TEXT[];

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_sonic_agents_embedding 
ON public.sonic_agents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to search agents by embedding similarity
CREATE OR REPLACE FUNCTION search_agents_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  sector text,
  description text,
  capabilities text[],
  code_artifact text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.name,
    sa.sector::text,
    sa.description,
    sa.capabilities,
    sa.code_artifact,
    1 - (sa.embedding <=> query_embedding) as similarity
  FROM sonic_agents sa
  WHERE sa.embedding IS NOT NULL
    AND 1 - (sa.embedding <=> query_embedding) > match_threshold
  ORDER BY sa.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;