import { useState, useEffect } from 'react';
import { useDocumentVersions, DocumentVersion } from '@/hooks/useDocumentVersions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  History, 
  RotateCcw, 
  GitBranch, 
  Clock, 
  FileText,
  Sparkles,
  FileStack,
  ChevronRight,
  Eye
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface VersionHistoryPanelProps {
  documentId: string;
  documentType: 'knowledge' | 'document' | 'report';
  isOpen: boolean;
  onClose: () => void;
  onVersionRestored?: () => void;
}

export function VersionHistoryPanel({
  documentId,
  documentType,
  isOpen,
  onClose,
  onVersionRestored
}: VersionHistoryPanelProps) {
  const { 
    versions, 
    currentVersion, 
    isLoading, 
    fetchVersions, 
    restoreVersion,
    getVersionDiff 
  } = useDocumentVersions();
  
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<DocumentVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchVersions(documentId, documentType);
    }
  }, [isOpen, documentId, documentType, fetchVersions]);

  const handleRestore = async () => {
    if (!confirmRestore) return;
    
    setIsRestoring(true);
    const newVersionId = await restoreVersion(confirmRestore.id);
    setIsRestoring(false);
    setConfirmRestore(null);
    
    if (newVersionId) {
      fetchVersions(documentId, documentType);
      onVersionRestored?.();
    }
  };

  const getVersionBadges = (version: DocumentVersion) => {
    const badges = [];
    if (version.is_current) {
      badges.push(<Badge key="current" variant="default" className="bg-primary">Current</Badge>);
    }
    if (version.is_enhanced) {
      badges.push(
        <Badge key="enhanced" variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Enhanced
        </Badge>
      );
    }
    if (version.is_summary) {
      badges.push(
        <Badge key="summary" variant="outline" className="gap-1">
          <FileStack className="h-3 w-3" />
          Summary
        </Badge>
      );
    }
    return badges;
  };

  const getDiffFromPrevious = (version: DocumentVersion, index: number) => {
    if (index >= versions.length - 1) return null;
    const previousVersion = versions[index + 1];
    return getVersionDiff(previousVersion.content, version.content);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </SheetTitle>
            <SheetDescription>
              View and restore previous versions of this document
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No version history available</p>
                <p className="text-sm mt-1">Changes will be tracked automatically</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-3 pr-4">
                  {versions.map((version, index) => {
                    const diff = getDiffFromPrevious(version, index);
                    
                    return (
                      <div
                        key={version.id}
                        className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                          selectedVersion?.id === version.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedVersion(
                          selectedVersion?.id === version.id ? null : version
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-medium">
                                v{version.version_number}
                              </span>
                              {getVersionBadges(version)}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {version.title}
                            </p>
                            
                            {version.change_summary && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                {version.change_summary}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span title={format(new Date(version.created_at), 'PPpp')}>
                                {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                              </span>
                              
                              {diff && (
                                <span className="ml-2">
                                  <span className="text-green-500">+{diff.added}</span>
                                  {' / '}
                                  <span className="text-red-500">-{diff.removed}</span>
                                  {' lines'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                            selectedVersion?.id === version.id ? 'rotate-90' : ''
                          }`} />
                        </div>

                        {selectedVersion?.id === version.id && (
                          <div className="mt-4 pt-4 border-t border-border space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewVersion(version);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Preview Content
                            </Button>
                            
                            {!version.is_current && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmRestore(version);
                                }}
                              >
                                <RotateCcw className="h-4 w-4" />
                                Restore This Version
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview Dialog */}
      <Dialog open={!!previewVersion} onOpenChange={() => setPreviewVersion(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewVersion?.title}
              <Badge variant="outline" className="ml-2">
                v{previewVersion?.version_number}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              {previewVersion?.change_summary || 'No change summary available'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[50vh] mt-4">
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/30 rounded-lg">
              {previewVersion?.content ? (
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {previewVersion.content}
                </pre>
              ) : (
                <p className="text-muted-foreground italic">No content available</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={!!confirmRestore} onOpenChange={() => setConfirmRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version?</DialogTitle>
            <DialogDescription>
              This will create a new version based on v{confirmRestore?.version_number}. 
              The current version will be preserved in the history.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="font-medium">{confirmRestore?.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Created {confirmRestore && formatDistanceToNow(new Date(confirmRestore.created_at), { addSuffix: true })}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(null)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? 'Restoring...' : 'Restore Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
