import { useState } from 'react';
import { Users, Plus, ChevronDown, User, Crown, Eye, Edit, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SharedDashboard } from '@/hooks/useSharedDashboards';

interface SharedDashboardSelectorProps {
  dashboards: SharedDashboard[];
  currentDashboard: SharedDashboard | null;
  onSelect: (dashboardId: string | null) => void;
  onCreate: (name: string, description?: string, workspaceId?: string, visibility?: 'private' | 'workspace') => Promise<any>;
  isLoading?: boolean;
}

const ROLE_ICONS: Record<string, typeof User> = {
  owner: Crown,
  admin: Shield,
  editor: Edit,
  contributor: Edit,
  viewer: Eye,
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'text-yellow-500',
  admin: 'text-purple-500',
  editor: 'text-blue-500',
  contributor: 'text-green-500',
  viewer: 'text-muted-foreground',
};

export function SharedDashboardSelector({
  dashboards,
  currentDashboard,
  onSelect,
  onCreate,
  isLoading,
}: SharedDashboardSelectorProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    
    setIsCreating(true);
    const dashboard = await onCreate(newName.trim(), newDescription.trim() || undefined);
    setIsCreating(false);
    
    if (dashboard) {
      setCreateDialogOpen(false);
      setNewName('');
      setNewDescription('');
      onSelect(dashboard.id);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] font-mono gap-1.5"
            disabled={isLoading}
          >
            <Users size={10} />
            {currentDashboard ? (
              <>
                <span className="max-w-[100px] truncate">{currentDashboard.name}</span>
                <Badge variant="secondary" className="text-[8px] px-1">
                  {currentDashboard.member_count}
                </Badge>
              </>
            ) : (
              'Personal View'
            )}
            <ChevronDown size={10} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuItem 
            onClick={() => onSelect(null)}
            className="flex items-center gap-2"
          >
            <User size={12} />
            <span className="flex-1">Personal View</span>
            {!currentDashboard && (
              <Badge variant="default" className="text-[8px]">Active</Badge>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1.5 text-[9px] font-mono text-muted-foreground">
            SHARED DASHBOARDS
          </div>
          
          {dashboards.length === 0 ? (
            <div className="px-2 py-3 text-center text-[10px] text-muted-foreground">
              No shared dashboards yet
            </div>
          ) : (
            dashboards.map((dashboard) => {
              const RoleIcon = ROLE_ICONS[dashboard.my_role || 'viewer'] || User;
              const roleColor = ROLE_COLORS[dashboard.my_role || 'viewer'];
              
              return (
                <DropdownMenuItem
                  key={dashboard.id}
                  onClick={() => onSelect(dashboard.id)}
                  className="flex items-center gap-2"
                >
                  <Users size={12} className="text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate">{dashboard.name}</div>
                    {dashboard.description && (
                      <div className="text-[9px] text-muted-foreground truncate">
                        {dashboard.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <RoleIcon size={10} className={roleColor} />
                    <Badge variant="secondary" className="text-[8px] px-1">
                      {dashboard.member_count}
                    </Badge>
                  </div>
                  {currentDashboard?.id === dashboard.id && (
                    <Badge variant="default" className="text-[8px]">Active</Badge>
                  )}
                </DropdownMenuItem>
              );
            })
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2 text-primary"
          >
            <Plus size={12} />
            <span>Create Dashboard</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Dashboard Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Create Shared Dashboard
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dashboard Name</Label>
              <Input
                id="name"
                placeholder="e.g., Q1 Planning Board"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What is this dashboard for?"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Dashboard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
