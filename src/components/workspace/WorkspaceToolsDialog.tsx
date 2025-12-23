import { useState } from 'react';
import { Settings2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ToolPermissionManager } from './ToolPermissionManager';
import { useToolPermissions } from '@/hooks/useToolPermissions';
import { useAuth } from '@/hooks/useAuth';

export function WorkspaceToolsDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { sections, loading, saving, savePermissions } = useToolPermissions();

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Tool Permissions"
        >
          <Settings2 size={18} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary flex items-center gap-2">
            Tool Permissions
            {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </DialogTitle>
          <DialogDescription>
            Drag and drop tools between sections to manage permissions. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ToolPermissionManager
            userName={userName}
            userRole="Workspace Member"
            sections={sections}
            onSectionsChange={savePermissions}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
