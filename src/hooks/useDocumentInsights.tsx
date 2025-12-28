import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LinkedTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  reference_context: string;
  relevance_score: number;
}

export interface LinkedCommunication {
  id: string;
  subject: string;
  from_address: string;
  sent_at: string;
  reference_context: string;
  relevance_score: number;
}

export interface LinkedEvent {
  id: string;
  title: string;
  start_at: string;
  location: string;
  reference_context: string;
  relevance_score: number;
}

export interface LinkedFinancial {
  id: string;
  title: string;
  amount: number;
  status: string;
  reference_context: string;
  relevance_score: number;
}

export interface DocumentInsights {
  tasks: LinkedTask[];
  communications: LinkedCommunication[];
  events: LinkedEvent[];
  financials: LinkedFinancial[];
}

export interface DocumentReference {
  id: string;
  document_id: string;
  document_type: string;
  reference_id: string;
  reference_type: string;
  reference_context: string;
  relevance_score: number;
  is_auto_detected: boolean;
  created_at: string;
}

export function useDocumentInsights() {
  const [insights, setInsights] = useState<DocumentInsights | null>(null);
  const [references, setReferences] = useState<DocumentReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();

  const fetchInsights = useCallback(async (documentId: string, documentType: string = 'knowledge') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_document_insights', {
        p_document_id: documentId,
        p_document_type: documentType
      });

      if (error) throw error;
      setInsights(data as unknown as DocumentInsights);
    } catch (error: any) {
      console.error('Error fetching document insights:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch linked insights',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchReferences = useCallback(async (documentId: string, documentType: string = 'knowledge') => {
    try {
      // Type assertion for new table not yet in generated types
      const query = supabase.from('document_references' as any) as any;
      const { data, error } = await query
        .select('*')
        .eq('document_id', documentId)
        .eq('document_type', documentType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferences(data || []);
    } catch (error: any) {
      console.error('Error fetching references:', error);
    }
  }, []);

  const detectReferences = useCallback(async (documentId: string, documentType: string = 'knowledge', searchText?: string) => {
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.rpc('detect_document_references', {
        p_document_id: documentId,
        p_document_type: documentType,
        p_search_text: searchText || null
      });

      if (error) throw error;

      toast({
        title: 'Detection Complete',
        description: `Found ${data || 0} new linked references`
      });

      // Refresh insights and references
      await Promise.all([
        fetchInsights(documentId, documentType),
        fetchReferences(documentId, documentType)
      ]);

      return data as number;
    } catch (error: any) {
      console.error('Error detecting references:', error);
      toast({
        title: 'Error',
        description: 'Failed to detect references',
        variant: 'destructive'
      });
      return 0;
    } finally {
      setIsDetecting(false);
    }
  }, [toast, fetchInsights, fetchReferences]);

  const addReference = useCallback(async (
    documentId: string,
    documentType: string,
    referenceId: string,
    referenceType: string,
    context?: string
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Type assertion for new table not yet in generated types
      const query = supabase.from('document_references' as any) as any;
      const { error } = await query.insert({
        user_id: userData.user.id,
        document_id: documentId,
        document_type: documentType,
        reference_id: referenceId,
        reference_type: referenceType,
        reference_context: context || 'Manually linked',
        is_auto_detected: false
      });

      if (error) throw error;

      toast({
        title: 'Reference Added',
        description: 'Successfully linked the item'
      });

      await Promise.all([
        fetchInsights(documentId, documentType),
        fetchReferences(documentId, documentType)
      ]);
    } catch (error: any) {
      console.error('Error adding reference:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add reference',
        variant: 'destructive'
      });
    }
  }, [toast, fetchInsights, fetchReferences]);

  const removeReference = useCallback(async (referenceId: string, documentId: string, documentType: string) => {
    try {
      // Type assertion for new table not yet in generated types
      const query = supabase.from('document_references' as any) as any;
      const { error } = await query.delete().eq('id', referenceId);

      if (error) throw error;

      toast({
        title: 'Reference Removed',
        description: 'Successfully unlinked the item'
      });

      await Promise.all([
        fetchInsights(documentId, documentType),
        fetchReferences(documentId, documentType)
      ]);
    } catch (error: any) {
      console.error('Error removing reference:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove reference',
        variant: 'destructive'
      });
    }
  }, [toast, fetchInsights, fetchReferences]);

  const updateReferenceContext = useCallback(async (
    referenceId: string,
    context: string,
    documentId: string,
    documentType: string
  ) => {
    try {
      // Type assertion for new table not yet in generated types
      const query = supabase.from('document_references' as any) as any;
      const { error } = await query
        .update({ reference_context: context })
        .eq('id', referenceId);

      if (error) throw error;

      toast({
        title: 'Context Updated',
        description: 'Reference context has been updated'
      });

      await fetchReferences(documentId, documentType);
    } catch (error: any) {
      console.error('Error updating context:', error);
      toast({
        title: 'Error',
        description: 'Failed to update context',
        variant: 'destructive'
      });
    }
  }, [toast, fetchReferences]);

  const getTotalLinkedCount = useCallback(() => {
    if (!insights) return 0;
    return (
      insights.tasks.length +
      insights.communications.length +
      insights.events.length +
      insights.financials.length
    );
  }, [insights]);

  return {
    insights,
    references,
    isLoading,
    isDetecting,
    fetchInsights,
    fetchReferences,
    detectReferences,
    addReference,
    removeReference,
    updateReferenceContext,
    getTotalLinkedCount
  };
}
