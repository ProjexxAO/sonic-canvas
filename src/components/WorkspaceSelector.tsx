// Atlas Sonic OS - Workspace Selector Component

import { useState } from 'react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Users, 
  Building2, 
  Briefcase, 
  FolderKanban,
  Plus,
  ChevronDown,
  Loader2
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type WorkspaceType = Database['public']['Enums']['workspace_type'];

const workspaceTypeConfig: Record<WorkspaceType, { icon: typeof User; label: string; color: string }> = {
  personal: { icon: User, label: 'Personal', color: 'text-primary' },
  team: { icon: Users, label: 'Team', color: 'text-secondary' },
  department: { icon: Building2, label: 'Department', color: 'text-accent' },
  client: { icon: Briefcase, label: 'Client', color: 'text-success' },
  project: { icon: FolderKanban, label: 'Project', color: 'text-warning' },
};

interface WorkspaceSelectorProps {
  compact?: boolean;
}

export default function WorkspaceSelector({ compact = false }: WorkspaceSelectorProps) {
  const { workspaces, currentWorkspace, loading, selectWorkspace, createWorkspace } = useWorkspaces();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceType, setNewWorkspaceType] = useState<WorkspaceType>('team');
  const [creating, setCreating] = useState(false);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    setCreating(true);
    const result = await createWorkspace(newWorkspaceName.trim(), newWorkspaceType);
    setCreating(false);
    
    if (result) {
      setShowCreateDialog(false);
      setNewWorkspaceName('');
      setNewWorkspaceType('team');
    }
  };

  const handleValueChange = (value: string) => {
    if (value === 'create-new') {
      setShowCreateDialog(true);
    } else {
      selectWorkspace(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  const CurrentIcon = currentWorkspace 
    ? workspaceTypeConfig[currentWorkspace.type].icon 
    : User;

  // Group workspaces by type
  const personalWorkspaces = workspaces.filter(ws => ws.type === 'personal');
  const teamWorkspaces = workspaces.filter(ws => ws.type === 'team');
  const otherWorkspaces = workspaces.filter(ws => !['personal', 'team'].includes(ws.type));

  return (
    <>
      <Select value={currentWorkspace?.id || ''} onValueChange={handleValueChange}>
        <SelectTrigger 
          className={`
            ${compact ? 'w-[180px]' : 'w-[240px]'} 
            bg-card/80 border-border hover:bg-card
            focus:ring-primary/50
          `}
        >
          <div className="flex items-center gap-2 truncate">
            {currentWorkspace && (
              <>
                <CurrentIcon 
                  size={16} 
                  className={workspaceTypeConfig[currentWorkspace.type].color} 
                />
                <span className="truncate text-foreground">
                  {compact ? currentWorkspace.name.slice(0, 15) : currentWorkspace.name}
                  {compact && currentWorkspace.name.length > 15 && '...'}
                </span>
              </>
            )}
            {!currentWorkspace && (
              <span className="text-muted-foreground">Select workspace</span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card border-border z-50">
          {personalWorkspaces.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-muted-foreground text-xs tracking-wider">
                PERSONAL
              </SelectLabel>
              {personalWorkspaces.map(ws => {
                const Icon = workspaceTypeConfig[ws.type].icon;
                return (
                  <SelectItem 
                    key={ws.id} 
                    value={ws.id}
                    className="focus:bg-primary/10"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={workspaceTypeConfig[ws.type].color} />
                      <span>{ws.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {ws.role}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectGroup>
          )}

          {teamWorkspaces.length > 0 && (
            <>
              {personalWorkspaces.length > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel className="text-muted-foreground text-xs tracking-wider">
                  TEAM
                </SelectLabel>
                {teamWorkspaces.map(ws => {
                  const Icon = workspaceTypeConfig[ws.type].icon;
                  return (
                    <SelectItem 
                      key={ws.id} 
                      value={ws.id}
                      className="focus:bg-primary/10"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={workspaceTypeConfig[ws.type].color} />
                        <span>{ws.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {ws.role}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </>
          )}

          {otherWorkspaces.length > 0 && (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-muted-foreground text-xs tracking-wider">
                  OTHER
                </SelectLabel>
                {otherWorkspaces.map(ws => {
                  const Icon = workspaceTypeConfig[ws.type].icon;
                  return (
                    <SelectItem 
                      key={ws.id} 
                      value={ws.id}
                      className="focus:bg-primary/10"
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={workspaceTypeConfig[ws.type].color} />
                        <span>{ws.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {ws.role}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </>
          )}

          <SelectSeparator />
          <SelectItem value="create-new" className="focus:bg-primary/10">
            <div className="flex items-center gap-2 text-primary">
              <Plus size={14} />
              <span>Create Workspace</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Workspace</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new workspace to organize your agents and data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name" className="text-foreground">Name</Label>
              <Input
                id="workspace-name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="My Workspace"
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-foreground">Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(workspaceTypeConfig) as [WorkspaceType, typeof workspaceTypeConfig[WorkspaceType]][])
                  .filter(([type]) => type !== 'personal')
                  .map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewWorkspaceType(type)}
                        className={`
                          flex items-center gap-2 p-3 rounded-md border transition-all
                          ${newWorkspaceType === type 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <Icon size={18} className={config.color} />
                        <span className="text-sm text-foreground">{config.label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              className="border-border"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim() || creating}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Workspace'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
