// PhotoGalleryView - Full photo management with upload from mobile/desktop
// Supports drag-drop, file picker, mobile camera, and gallery display

import { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Camera, 
  Heart, 
  Trash2, 
  Share2, 
  MoreVertical,
  Grid,
  List,
  Loader2,
  X,
  Plus,
  FolderPlus,
  Star,
  Download,
  ZoomIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useUserPhotos, PHOTO_CATEGORIES, SOCIAL_PLATFORMS, UserPhoto } from '@/hooks/useUserPhotos';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PhotoGalleryViewProps {
  compact?: boolean;
}

export function PhotoGalleryView({ compact = false }: PhotoGalleryViewProps) {
  const { 
    photos, 
    isLoading, 
    isUploading,
    stats,
    uploadPhoto,
    uploadMultiplePhotos,
    toggleFavorite,
    deletePhoto,
    shareToSocial,
    getPhotoUrl,
    getPhotosByCategory,
    createAlbum
  } = useUserPhotos();

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UserPhoto | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const displayedPhotos = getPhotosByCategory(selectedCategory);

  // Handle file drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => 
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    
    if (files.length === 0) {
      toast.error('Please drop image or video files');
      return;
    }

    setUploadProgress(0);
    let uploaded = 0;
    
    for (const file of files) {
      await uploadPhoto(file);
      uploaded++;
      setUploadProgress((uploaded / files.length) * 100);
    }
    
    setUploadProgress(0);
    toast.success(`${uploaded} photo${uploaded > 1 ? 's' : ''} uploaded`);
  }, [uploadPhoto]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress(0);
    let uploaded = 0;
    
    for (const file of Array.from(files)) {
      await uploadPhoto(file);
      uploaded++;
      setUploadProgress((uploaded / files.length) * 100);
    }
    
    setUploadProgress(0);
    e.target.value = '';
    toast.success(`${uploaded} photo${uploaded > 1 ? 's' : ''} uploaded`);
  };

  // Handle photo actions
  const handleToggleFavorite = async (photo: UserPhoto) => {
    await toggleFavorite(photo.id, photo.is_favorite);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deletePhoto(deleteConfirm.id);
    setDeleteConfirm(null);
    setSelectedPhoto(null);
  };

  const handleShare = async (photo: UserPhoto, platform: string) => {
    await shareToSocial(photo.id, platform);
  };

  const handleDownload = (photo: UserPhoto) => {
    const url = getPhotoUrl(photo);
    const link = document.createElement('a');
    link.href = url;
    link.download = photo.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compact view for dashboard widget
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Upload button */}
        <Button 
          variant="outline" 
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Add Photos
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Recent photos grid */}
        <div className="grid grid-cols-3 gap-2">
          {photos.slice(0, 6).map((photo) => (
            <div
              key={photo.id}
              className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity relative group"
              onClick={() => {
                setSelectedPhoto(photo);
                setShowLightbox(true);
              }}
            >
              <img
                src={getPhotoUrl(photo)}
                alt={photo.file_name}
                className="w-full h-full object-cover"
              />
              {photo.is_favorite && (
                <Heart size={12} className="absolute top-1 right-1 text-red-500 fill-red-500" />
              )}
            </div>
          ))}
        </div>
        
        {photos.length === 0 && !isLoading && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No photos yet. Upload some!
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary">{stats.total} photos</Badge>
          <Badge variant="outline" className="gap-1">
            <Heart size={12} className="text-red-500" />
            {stats.favorites}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => createAlbum('New Album')}
          >
            <FolderPlus size={16} className="mr-2" />
            New Album
          </Button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center transition-all',
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50',
          isUploading && 'pointer-events-none opacity-50'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
            <Progress value={uploadProgress} className="max-w-xs mx-auto" />
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-3">
              Drag and drop photos here, or
            </p>
            <div className="flex items-center justify-center gap-3">
              {/* File picker - works on all devices */}
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={16} className="mr-2" />
                Browse Files
              </Button>
              
              {/* Camera - mobile only (capture attribute) */}
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={16} className="mr-2" />
                Take Photo
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Camera input with capture for mobile */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}
      </div>

      {/* Category Filters */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {PHOTO_CATEGORIES.slice(0, 8).map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="flex-shrink-0"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Photo Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : displayedPhotos.length > 0 ? (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
            : 'space-y-2'
        )}>
          {displayedPhotos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              viewMode={viewMode}
              photoUrl={getPhotoUrl(photo)}
              onSelect={() => {
                setSelectedPhoto(photo);
                setShowLightbox(true);
              }}
              onFavorite={() => handleToggleFavorite(photo)}
              onDelete={() => setDeleteConfirm(photo)}
              onDownload={() => handleDownload(photo)}
              onShare={(platform) => handleShare(photo, platform)}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-pink-500/5 border-pink-500/20">
          <CardContent className="p-12 text-center">
            <ImageIcon size={48} className="text-pink-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No photos yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload photos from your device or take new ones
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} className="mr-2" />
              Upload Photos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-4xl p-0">
          {selectedPhoto && (
            <div className="relative">
              <img
                src={getPhotoUrl(selectedPhoto)}
                alt={selectedPhoto.file_name}
                className="w-full max-h-[80vh] object-contain bg-black"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="font-medium">{selectedPhoto.file_name}</p>
                    <p className="text-sm text-white/70">
                      {format(new Date(selectedPhoto.created_at), 'PPP')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => handleToggleFavorite(selectedPhoto)}
                    >
                      <Heart 
                        size={20} 
                        className={selectedPhoto.is_favorite ? 'fill-red-500 text-red-500' : ''} 
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => handleDownload(selectedPhoto)}
                    >
                      <Download size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20 text-red-400"
                      onClick={() => setDeleteConfirm(selectedPhoto)}
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.file_name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Individual Photo Card Component
function PhotoCard({
  photo,
  viewMode,
  photoUrl,
  onSelect,
  onFavorite,
  onDelete,
  onDownload,
  onShare,
}: {
  photo: UserPhoto;
  viewMode: 'grid' | 'list';
  photoUrl: string;
  onSelect: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onShare: (platform: string) => void;
}) {
  if (viewMode === 'list') {
    return (
      <Card className="hover:bg-accent/50 transition-colors">
        <CardContent className="p-3 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-lg overflow-hidden bg-muted cursor-pointer flex-shrink-0"
            onClick={onSelect}
          >
            <img
              src={photoUrl}
              alt={photo.file_name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{photo.file_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{format(new Date(photo.created_at), 'MMM d, yyyy')}</span>
              <span>•</span>
              <Badge variant="outline" className="text-[10px]">{photo.category}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onFavorite}>
              <Heart 
                size={16} 
                className={photo.is_favorite ? 'fill-red-500 text-red-500' : ''} 
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDownload}>
                  <Download size={14} className="mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSelect}>
                  <ZoomIn size={14} className="mr-2" />
                  View Full
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {SOCIAL_PLATFORMS.map((platform) => (
                  <DropdownMenuItem 
                    key={platform.id}
                    onClick={() => onShare(platform.id)}
                  >
                    <Share2 size={14} className="mr-2" />
                    Share to {platform.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="group relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer">
      <img
        src={photoUrl}
        alt={photo.file_name}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
        onClick={onSelect}
      />
      
      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite();
            }}
          >
            <Heart size={14} className={photo.is_favorite ? 'fill-red-500 text-red-500' : ''} />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <ZoomIn size={14} />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      
      {/* Favorite indicator */}
      {photo.is_favorite && (
        <div className="absolute top-2 right-2">
          <Heart size={16} className="text-red-500 fill-red-500 drop-shadow-lg" />
        </div>
      )}
      
      {/* Category badge */}
      {photo.category !== 'uncategorized' && (
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-none">
            {photo.category}
          </Badge>
        </div>
      )}
    </div>
  );
}

export default PhotoGalleryView;
