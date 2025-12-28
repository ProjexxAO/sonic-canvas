-- Function to get linked insights for a document
CREATE OR REPLACE FUNCTION public.get_document_insights(
  p_document_id UUID,
  p_document_type TEXT DEFAULT 'knowledge'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'tasks', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id,
        'title', t.title,
        'status', t.status,
        'priority', t.priority,
        'reference_context', dr.reference_context,
        'relevance_score', dr.relevance_score
      ))
      FROM document_references dr
      JOIN csuite_tasks t ON t.id = dr.reference_id
      WHERE dr.document_id = p_document_id
        AND dr.document_type = p_document_type
        AND dr.reference_type = 'task'
        AND dr.user_id = v_user_id
    ), '[]'::jsonb),
    'communications', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id,
        'subject', c.subject,
        'from_address', c.from_address,
        'sent_at', c.sent_at,
        'reference_context', dr.reference_context,
        'relevance_score', dr.relevance_score
      ))
      FROM document_references dr
      JOIN csuite_communications c ON c.id = dr.reference_id
      WHERE dr.document_id = p_document_id
        AND dr.document_type = p_document_type
        AND dr.reference_type = 'communication'
        AND dr.user_id = v_user_id
    ), '[]'::jsonb),
    'events', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', e.id,
        'title', e.title,
        'start_at', e.start_at,
        'location', e.location,
        'reference_context', dr.reference_context,
        'relevance_score', dr.relevance_score
      ))
      FROM document_references dr
      JOIN csuite_events e ON e.id = dr.reference_id
      WHERE dr.document_id = p_document_id
        AND dr.document_type = p_document_type
        AND dr.reference_type = 'event'
        AND dr.user_id = v_user_id
    ), '[]'::jsonb),
    'financials', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', f.id,
        'title', f.title,
        'amount', f.amount,
        'status', f.status,
        'reference_context', dr.reference_context,
        'relevance_score', dr.relevance_score
      ))
      FROM document_references dr
      JOIN csuite_financials f ON f.id = dr.reference_id
      WHERE dr.document_id = p_document_id
        AND dr.document_type = p_document_type
        AND dr.reference_type = 'financial'
        AND dr.user_id = v_user_id
    ), '[]'::jsonb)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to auto-detect potential document references based on content matching
CREATE OR REPLACE FUNCTION public.detect_document_references(
  p_document_id UUID,
  p_document_type TEXT DEFAULT 'knowledge',
  p_search_text TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_search_text TEXT;
  v_total_count INTEGER := 0;
BEGIN
  -- Get document title for search if not provided
  IF p_search_text IS NULL THEN
    IF p_document_type = 'knowledge' THEN
      SELECT title INTO v_search_text FROM csuite_knowledge WHERE id = p_document_id AND user_id = v_user_id;
    ELSE
      SELECT title INTO v_search_text FROM csuite_documents WHERE id = p_document_id AND user_id = v_user_id;
    END IF;
  ELSE
    v_search_text := p_search_text;
  END IF;

  -- Find and insert matching tasks
  WITH inserted AS (
    INSERT INTO document_references (user_id, document_id, document_type, reference_id, reference_type, reference_context, is_auto_detected)
    SELECT v_user_id, p_document_id, p_document_type, t.id, 'task', 
           'Title or description contains related keywords', true
    FROM csuite_tasks t
    WHERE t.user_id = v_user_id
      AND (t.title ILIKE '%' || v_search_text || '%' OR t.description ILIKE '%' || v_search_text || '%')
    ON CONFLICT (document_id, document_type, reference_id, reference_type) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_total_count FROM inserted;

  -- Find and insert matching communications
  WITH inserted AS (
    INSERT INTO document_references (user_id, document_id, document_type, reference_id, reference_type, reference_context, is_auto_detected)
    SELECT v_user_id, p_document_id, p_document_type, c.id, 'communication',
           'Subject or content contains related keywords', true
    FROM csuite_communications c
    WHERE c.user_id = v_user_id
      AND (c.subject ILIKE '%' || v_search_text || '%' OR c.content ILIKE '%' || v_search_text || '%')
    ON CONFLICT (document_id, document_type, reference_id, reference_type) DO NOTHING
    RETURNING 1
  )
  SELECT v_total_count + COUNT(*) INTO v_total_count FROM inserted;

  -- Find and insert matching events
  WITH inserted AS (
    INSERT INTO document_references (user_id, document_id, document_type, reference_id, reference_type, reference_context, is_auto_detected)
    SELECT v_user_id, p_document_id, p_document_type, e.id, 'event',
           'Title or description contains related keywords', true
    FROM csuite_events e
    WHERE e.user_id = v_user_id
      AND (e.title ILIKE '%' || v_search_text || '%' OR e.description ILIKE '%' || v_search_text || '%')
    ON CONFLICT (document_id, document_type, reference_id, reference_type) DO NOTHING
    RETURNING 1
  )
  SELECT v_total_count + COUNT(*) INTO v_total_count FROM inserted;

  RETURN v_total_count;
END;
$$;