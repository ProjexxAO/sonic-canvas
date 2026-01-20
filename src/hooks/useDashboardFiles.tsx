import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardFile {
  id: string;
  dashboard_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  created_at: string;
  uploader_name?: string;
  uploader_avatar?: string;
  download_url?: string;
}

export function useDashboardFiles(dashboardId: string | null, userId: string | undefined) {
  const [files, setFiles] = useState<DashboardFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchFiles = useCallback(async () => {
    if (!dashboardId || !userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dashboard_files')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch uploader profiles
      const uploaderIds = [...new Set((data || []).map(f => f.uploaded_by))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', uploaderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get download URLs
      const enrichedFiles = await Promise.all(
        (data || []).map(async file => {
          const { data: urlData } = await supabase.storage
            .from('dashboard-files')
            .createSignedUrl(file.file_path, 3600);

          return {
            ...file,
            uploader_name: profileMap.get(file.uploaded_by)?.display_name || 'Unknown',
            uploader_avatar: profileMap.get(file.uploaded_by)?.avatar_url,
            download_url: urlData?.signedUrl,
          };
        })
      );

      setFiles(enrichedFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dashboardId, userId]);

  const uploadFile = async (file: File, description?: string) => {
    if (!dashboardId || !userId) return null;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${dashboardId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('dashboard-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Create file record
      const { data, error: dbError } = await supabase
        .from('dashboard_files')
        .insert({
          dashboard_id: dashboardId,
          uploaded_by: userId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          description,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if db insert fails
        await supabase.storage.from('dashboard-files').remove([fileName]);
        throw dbError;
      }

      setUploadProgress(100);

      // Create notification for dashboard members
      const { data: members } = await supabase
        .from('shared_dashboard_members')
        .select('user_id')
        .eq('dashboard_id', dashboardId)
        .neq('user_id', userId);

      if (members?.length) {
        const notifications = members.map(m => ({
          dashboard_id: dashboardId,
          user_id: m.user_id,
          actor_id: userId,
          notification_type: 'file_upload',
          title: 'New file uploaded',
          message: file.name,
          reference_id: data.id,
          reference_type: 'file',
        }));

        await supabase.from('dashboard_notifications').insert(notifications);
      }

      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    if (!userId) return false;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('dashboard-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('dashboard_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== fileId));
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  };

  const downloadFile = async (file: DashboardFile) => {
    if (!file.download_url) {
      const { data } = await supabase.storage
        .from('dashboard-files')
        .createSignedUrl(file.file_path, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } else {
      window.open(file.download_url, '_blank');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    isLoading,
    isUploading,
    uploadProgress,
    uploadFile,
    deleteFile,
    downloadFile,
    refetch: fetchFiles,
  };
}
