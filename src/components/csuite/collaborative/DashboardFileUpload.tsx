import React, { useState, useCallback } from 'react';
import { useDashboardFiles, DashboardFile } from '@/hooks/useDashboardFiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Upload, File, FileText, Image, FileVideo, FileAudio, Download, Trash2, MoreVertical, Loader2, CloudUpload } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DashboardFileUploadProps {
  dashboardId: string;
  userId: string;
  canUpload: boolean;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  'image': Image,
  'video': FileVideo,
  'audio': FileAudio,
  'text': FileText,
  'application/pdf': FileText,
  'default': File,
};

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return FILE_ICONS.default;
  
  for (const [key, icon] of Object.entries(FILE_ICONS)) {
    if (mimeType.startsWith(key)) return icon;
  }
  return FILE_ICONS.default;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return 'Unknown size';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function DashboardFileUpload({ dashboardId, userId, canUpload }: DashboardFileUploadProps) {
  const { files, isLoading, isUploading, uploadProgress, uploadFile, deleteFile, downloadFile } = useDashboardFiles(dashboardId, userId);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DashboardFile | null>(null);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!canUpload) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      await uploadFile(file);
    }
  }, [canUpload, uploadFile]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    for (const file of selectedFiles) {
      await uploadFile(file);
    }
    e.target.value = '';
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    await deleteFile(deleteDialog.id, deleteDialog.file_path);
    setDeleteDialog(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUpload && (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onDragOver={e => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-4">
              <CloudUpload className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
              <Progress value={uploadProgress} className="max-w-xs mx-auto" />
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Drag and drop files here, or click to select
              </p>
              <Input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild variant="secondary">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select Files
                </label>
              </Button>
            </>
          )}
        </div>
      )}

      {/* File List */}
      <div className="space-y-2">
        {files.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No files uploaded yet
          </div>
        ) : (
          files.map(file => {
            const Icon = getFileIcon(file.mime_type);
            
            return (
              <Card key={file.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={file.uploader_avatar} />
                        <AvatarFallback className="text-[8px]">
                          {file.uploader_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{file.uploader_name}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => downloadFile(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      {(file.uploaded_by === userId) && (
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog(file)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
