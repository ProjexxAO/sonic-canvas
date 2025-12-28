import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DocumentVersion {
  id: string;
  document_id: string;
  document_type: 'knowledge' | 'document' | 'report';
  version_number: string;
  title: string;
  content: string | null;
  change_summary: string | null;
  changed_by: string | null;
  is_current: boolean;
  is_enhanced: boolean;
  is_summary: boolean;
  parent_version_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateVersionParams {
  documentId: string;
  documentType: 'knowledge' | 'document' | 'report';
  title: string;
  content: string | null;
  changeSummary?: string;
  isEnhanced?: boolean;
  isSummary?: boolean;
  metadata?: Record<string, unknown>;
}

export function useDocumentVersions() {
  const { user } = useAuth();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(null);

  const fetchVersions = useCallback(async (documentId: string, documentType: string) => {
    if (!user) return [];
    
    setIsLoading(true);
    try {
      const { data, error } = await (supabase
        .from('document_versions' as any)
        .select('*')
        .eq('document_id', documentId)
        .eq('document_type', documentType)
        .order('created_at', { ascending: false })) as { data: any[]; error: any };

      if (error) throw error;
      
      const typedData = (data || []) as DocumentVersion[];
      setVersions(typedData);
      
      const current = typedData.find(v => v.is_current);
      setCurrentVersion(current || null);
      
      return typedData;
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load version history');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createVersion = useCallback(async (params: CreateVersionParams): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to create versions');
      return null;
    }

    try {
      // Get current version count
      let versionCount = 1;
      if (params.documentType === 'knowledge') {
        const { data } = await supabase
          .from('csuite_knowledge')
          .select('version_count')
          .eq('id', params.documentId)
          .single();
        versionCount = (data?.version_count || 0) + 1;
      } else if (params.documentType === 'document') {
        const { data } = await supabase
          .from('csuite_documents')
          .select('version_count')
          .eq('id', params.documentId)
          .single();
        versionCount = (data?.version_count || 0) + 1;
      }

      const versionNumber = `1.${versionCount}`;

      // Mark previous current as not current
      await (supabase
        .from('document_versions' as any)
        .update({ is_current: false })
        .eq('document_id', params.documentId)
        .eq('is_current', true));

      // Get previous current version id
      const { data: prevVersions } = await (supabase
        .from('document_versions' as any)
        .select('id')
        .eq('document_id', params.documentId)
        .order('created_at', { ascending: false })
        .limit(1)) as { data: any[] };

      const parentVersionId = prevVersions?.[0]?.id || null;

      // Insert new version using type assertion for new table
      const insertData = {
        document_id: params.documentId,
        document_type: params.documentType,
        version_number: versionNumber,
        title: params.title,
        content: params.content,
        change_summary: params.changeSummary || null,
        changed_by: user.id,
        is_current: true,
        is_enhanced: params.isEnhanced || false,
        is_summary: params.isSummary || false,
        parent_version_id: parentVersionId,
        metadata: params.metadata || {}
      };

      const { data: newVersion, error } = await (supabase
        .from('document_versions' as any)
        .insert(insertData)
        .select()
        .single()) as { data: any; error: any };

      if (error) throw error;

      // Update source document
      if (params.documentType === 'knowledge') {
        await supabase
          .from('csuite_knowledge')
          .update({
            current_version_id: newVersion.id,
            version_count: versionCount,
            version: versionNumber,
            last_versioned_at: new Date().toISOString()
          })
          .eq('id', params.documentId);
      } else if (params.documentType === 'document') {
        await supabase
          .from('csuite_documents')
          .update({
            current_version_id: newVersion.id,
            version_count: versionCount,
            version: versionNumber,
            last_versioned_at: new Date().toISOString()
          })
          .eq('id', params.documentId);
      }

      toast.success(`Version ${versionNumber} created`);
      return newVersion.id;
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Failed to create version');
      return null;
    }
  }, [user]);

  const restoreVersion = useCallback(async (versionId: string): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to restore versions');
      return null;
    }

    try {
      // Get the version to restore
      const { data: versionToRestore, error: fetchError } = await (supabase
        .from('document_versions' as any)
        .select('*')
        .eq('id', versionId)
        .single()) as { data: any; error: any };

      if (fetchError || !versionToRestore) throw fetchError || new Error('Version not found');

      // Create a new version from the restored content
      const newVersionId = await createVersion({
        documentId: versionToRestore.document_id,
        documentType: versionToRestore.document_type as 'knowledge' | 'document' | 'report',
        title: versionToRestore.title,
        content: versionToRestore.content,
        changeSummary: `Restored from version ${versionToRestore.version_number}`,
        isEnhanced: versionToRestore.is_enhanced,
        isSummary: versionToRestore.is_summary,
        metadata: versionToRestore.metadata as Record<string, unknown>
      });

      if (newVersionId) {
        toast.success(`Restored to version ${versionToRestore.version_number}`);
      }

      return newVersionId;
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Failed to restore version');
      return null;
    }
  }, [user, createVersion]);

  const compareVersions = useCallback((version1: DocumentVersion, version2: DocumentVersion) => {
    return {
      titleChanged: version1.title !== version2.title,
      contentChanged: version1.content !== version2.content,
      v1: version1,
      v2: version2
    };
  }, []);

  const getVersionDiff = useCallback((oldContent: string | null, newContent: string | null) => {
    const oldLines = (oldContent || '').split('\n');
    const newLines = (newContent || '').split('\n');
    
    return {
      added: newLines.filter(line => !oldLines.includes(line)).length,
      removed: oldLines.filter(line => !newLines.includes(line)).length,
      oldLineCount: oldLines.length,
      newLineCount: newLines.length
    };
  }, []);

  return {
    versions,
    currentVersion,
    isLoading,
    fetchVersions,
    createVersion,
    restoreVersion,
    compareVersions,
    getVersionDiff
  };
}
