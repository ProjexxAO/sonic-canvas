import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserPhoto {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  category: string;
  tags: string[];
  ai_tags: string[];
  is_favorite: boolean;
  shared_to: string[];
  share_history: any[];
  taken_at: string | null;
  location: any | null;
  is_archived: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PhotoAlbum {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_photo_id: string | null;
  is_smart: boolean;
  smart_filter: any | null;
  created_at: string;
  updated_at: string;
}

// Default categories for auto-organization
export const PHOTO_CATEGORIES = [
  { id: 'all', label: 'All Photos', icon: 'Grid' },
  { id: 'favorites', label: 'Favorites', icon: 'Heart' },
  { id: 'recent', label: 'Recent', icon: 'Clock' },
  { id: 'people', label: 'People', icon: 'Users' },
  { id: 'places', label: 'Places', icon: 'MapPin' },
  { id: 'nature', label: 'Nature', icon: 'Leaf' },
  { id: 'food', label: 'Food', icon: 'Utensils' },
  { id: 'documents', label: 'Documents', icon: 'FileText' },
  { id: 'screenshots', label: 'Screenshots', icon: 'Monitor' },
  { id: 'selfies', label: 'Selfies', icon: 'Camera' },
  { id: 'uncategorized', label: 'Uncategorized', icon: 'Folder' },
] as const;

export const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: 'hsl(340 75% 55%)' },
  { id: 'facebook', label: 'Facebook', color: 'hsl(220 70% 50%)' },
  { id: 'twitter', label: 'X / Twitter', color: 'hsl(200 90% 45%)' },
  { id: 'linkedin', label: 'LinkedIn', color: 'hsl(210 80% 45%)' },
  { id: 'pinterest', label: 'Pinterest', color: 'hsl(350 70% 50%)' },
] as const;

export function useUserPhotos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPhotos = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_photos')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
    } else {
      setPhotos(data as UserPhoto[]);
    }
    setIsLoading(false);
  }, [user?.id]);

  const fetchAlbums = useCallback(async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('photo_albums')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching albums:', error);
    } else {
      setAlbums(data as PhotoAlbum[]);
    }
  }, [user?.id]);

  const uploadPhoto = async (file: File): Promise<UserPhoto | null> => {
    if (!user?.id) return null;

    setIsUploading(true);
    
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Auto-categorize based on file type/name
      let category = 'uncategorized';
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('screenshot')) category = 'screenshots';
      else if (lowerName.includes('selfie')) category = 'selfies';
      else if (file.type.includes('pdf') || file.type.includes('document')) category = 'documents';

      // Create photo record
      const { data, error } = await supabase
        .from('user_photos')
        .insert({
          user_id: user.id,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          category,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Photo uploaded successfully');
      await fetchPhotos();
      return data as UserPhoto;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultiplePhotos = async (files: FileList): Promise<number> => {
    let successCount = 0;
    for (const file of Array.from(files)) {
      const result = await uploadPhoto(file);
      if (result) successCount++;
    }
    return successCount;
  };

  const updatePhoto = async (id: string, updates: Partial<UserPhoto>): Promise<boolean> => {
    const { error } = await supabase
      .from('user_photos')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update photo');
      return false;
    }

    await fetchPhotos();
    return true;
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    return updatePhoto(id, { is_favorite: !isFavorite });
  };

  const setCategory = async (id: string, category: string) => {
    return updatePhoto(id, { category });
  };

  const addTags = async (id: string, newTags: string[]) => {
    const photo = photos.find(p => p.id === id);
    if (!photo) return false;
    
    const tags = [...new Set([...photo.tags, ...newTags])];
    return updatePhoto(id, { tags });
  };

  const deletePhoto = async (id: string): Promise<boolean> => {
    // Soft delete
    const { error } = await supabase
      .from('user_photos')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete photo');
      return false;
    }

    toast.success('Photo deleted');
    await fetchPhotos();
    return true;
  };

  const shareToSocial = async (photoId: string, platform: string): Promise<boolean> => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return false;

    // Get public URL for sharing
    const { data: urlData } = supabase.storage
      .from('user-photos')
      .getPublicUrl(photo.file_path);

    // Update share history
    const shareHistory = [...(photo.share_history || []), {
      platform,
      shared_at: new Date().toISOString(),
      url: urlData.publicUrl,
    }];

    const sharedTo = [...new Set([...photo.shared_to, platform])];

    const success = await updatePhoto(photoId, { shared_to: sharedTo, share_history: shareHistory });
    
    if (success) {
      // Open share URL (in a real implementation, this would use platform APIs)
      const shareUrl = getSocialShareUrl(platform, urlData.publicUrl, photo.file_name);
      window.open(shareUrl, '_blank');
      toast.success(`Preparing to share to ${platform}`);
    }

    return success;
  };

  const getPhotoUrl = (photo: UserPhoto): string => {
    const { data } = supabase.storage
      .from('user-photos')
      .getPublicUrl(photo.file_path);
    return data.publicUrl;
  };

  const getPhotosByCategory = (category: string): UserPhoto[] => {
    if (category === 'all') return photos;
    if (category === 'favorites') return photos.filter(p => p.is_favorite);
    if (category === 'recent') return photos.slice(0, 20);
    return photos.filter(p => p.category === category);
  };

  const createAlbum = async (name: string, description?: string): Promise<PhotoAlbum | null> => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('photo_albums')
      .insert({
        user_id: user.id,
        name,
        description,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create album');
      return null;
    }

    toast.success('Album created');
    await fetchAlbums();
    return data as PhotoAlbum;
  };

  useEffect(() => {
    if (user?.id) {
      fetchPhotos();
      fetchAlbums();
    }
  }, [user?.id, fetchPhotos, fetchAlbums]);

  // Stats
  const stats = {
    total: photos.length,
    favorites: photos.filter(p => p.is_favorite).length,
    categories: [...new Set(photos.map(p => p.category))].length,
    shared: photos.filter(p => p.shared_to.length > 0).length,
  };

  return {
    photos,
    albums,
    isLoading,
    isUploading,
    stats,
    uploadPhoto,
    uploadMultiplePhotos,
    updatePhoto,
    toggleFavorite,
    setCategory,
    addTags,
    deletePhoto,
    shareToSocial,
    getPhotoUrl,
    getPhotosByCategory,
    createAlbum,
    refetch: fetchPhotos,
  };
}

// Helper to generate social share URLs
function getSocialShareUrl(platform: string, imageUrl: string, title: string): string {
  const encodedUrl = encodeURIComponent(imageUrl);
  const encodedTitle = encodeURIComponent(title);

  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case 'pinterest':
      return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedUrl}&description=${encodedTitle}`;
    case 'instagram':
      // Instagram doesn't support direct URL sharing, open profile instead
      return 'https://instagram.com';
    default:
      return imageUrl;
  }
}
