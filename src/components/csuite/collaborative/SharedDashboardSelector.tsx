import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Plus, ChevronDown, User, Crown, Eye, Edit, Shield, Trash2, Briefcase } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SharedDashboard } from '@/hooks/useSharedDashboards';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SharedDashboardSelectorProps {
  dashboards: SharedDashboard[];
  currentDashboard: SharedDashboard | null;
  onSelect: (dashboardId: string | null) => void;
  onCreate: (name: string, description?: string, workspaceId?: string, visibility?: 'private' | 'workspace') => Promise<any>;
  onDelete?: (dashboardId: string) => Promise<boolean>;
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
  onDelete,
  isLoading,
}: SharedDashboardSelectorProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<SharedDashboard | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPath = location.pathname;

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

  const handleDeleteClick = (e: React.MouseEvent, dashboard: SharedDashboard) => {
    e.stopPropagation();
    setDashboardToDelete(dashboard);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!dashboardToDelete || !onDelete) return;
    
    setIsDeleting(true);
    const success = await onDelete(dashboardToDelete.id);
    setIsDeleting(false);
    
    if (success) {
      setDeleteDialogOpen(false);
      setDashboardToDelete(null);
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
          {/* Data Hub Navigation */}
          <div className="px-2 py-1.5 text-[9px] font-mono text-muted-foreground">
            DATA HUBS
          </div>
          
          <DropdownMenuItem 
            onClick={() => onSelect(null)}
            className="flex items-center gap-2"
          >
            <User size={12} />
            <span className="flex-1">Personal View</span>
            {!currentDashboard && currentPath === '/atlas' && (
              <Badge variant="default" className="text-[8px]">Active</Badge>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/personal')}
            className="flex items-center gap-2"
          >
            <User size={12} className="text-blue-500" />
            <span className="flex-1">Personal Hub</span>
            {currentPath === '/personal' && (
              <Badge variant="default" className="text-[8px]">Active</Badge>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/group')}
            className="flex items-center gap-2"
          >
            <Users size={12} className="text-green-500" />
            <span className="flex-1">Group Hub</span>
            {currentPath === '/group' && (
              <Badge variant="default" className="text-[8px]">Active</Badge>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/atlas')}
            className="flex items-center gap-2"
          >
            <Briefcase size={12} className="text-purple-500" />
            <span className="flex-1">C-Suite Hub</span>
            {currentPath === '/atlas' && currentDashboard && (
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
              const canDelete = onDelete && ['owner', 'admin'].includes(dashboard.my_role || '');
              
              return (
                <DropdownMenuItem
                  key={dashboard.id}
                  onClick={() => onSelect(dashboard.id)}
                  className="flex items-center gap-2 group"
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
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteClick(e, dashboard)}
                      >
                        <Trash2 size={10} />
                      </Button>
                    )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{dashboardToDelete?.name}"? This will permanently remove the dashboard and all shared items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Dashboard'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
