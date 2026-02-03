// GroupMemberDialog - Dialog for inviting members and managing roles

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserPlus,
  Crown,
  Shield,
  Eye,
  User,
  Loader2,
  Mail,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GroupRole, GroupMemberWithProfile } from '@/hooks/useGroupHub';

interface GroupMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'invite' | 'edit';
  member?: GroupMemberWithProfile | null;
  currentUserRole?: GroupRole;
  onInvite?: (email: string, role: GroupRole) => Promise<boolean>;
  onUpdateRole?: (memberId: string, role: GroupRole) => Promise<boolean>;
  onRemove?: (memberId: string) => Promise<boolean>;
}

const roleConfig: Record<GroupRole, { icon: typeof Crown; label: string; description: string; color: string }> = {
  owner: { 
    icon: Crown, 
    label: 'Owner', 
    description: 'Full control over the group',
    color: 'hsl(45 80% 50%)' 
  },
  admin: { 
    icon: Shield, 
    label: 'Admin', 
    description: 'Manage members and items',
    color: 'hsl(200 70% 50%)' 
  },
  member: { 
    icon: User, 
    label: 'Member', 
    description: 'Create and edit items',
    color: 'hsl(150 70% 45%)' 
  },
  viewer: { 
    icon: Eye, 
    label: 'Viewer', 
    description: 'View only access',
    color: 'hsl(0 0% 50%)' 
  },
};

export function GroupMemberDialog({
  open,
  onOpenChange,
  mode,
  member,
  currentUserRole,
  onInvite,
  onUpdateRole,
  onRemove
}: GroupMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<GroupRole>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setEmail('');
      setSelectedRole(member?.role as GroupRole || 'member');
      setShowRemoveConfirm(false);
      setInviteSuccess(false);
    }
  }, [open, member]);

  const canEditRole = (targetRole: GroupRole): boolean => {
    if (!currentUserRole) return false;
    if (currentUserRole === 'owner') return targetRole !== 'owner';
    if (currentUserRole === 'admin') return targetRole !== 'owner' && targetRole !== 'admin';
    return false;
  };

  const handleInvite = async () => {
    if (!email.trim() || !onInvite) return;
    
    setIsLoading(true);
    try {
      const success = await onInvite(email.trim(), selectedRole);
      if (success) {
        setInviteSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!member || !onUpdateRole) return;
    
    setIsLoading(true);
    try {
      const success = await onUpdateRole(member.id, selectedRole);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!member || !onRemove) return;
    
    setIsLoading(true);
    try {
      const success = await onRemove(member.id);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const memberName = member?.profile?.display_name || member?.profile?.operator_handle || 'Member';
  const memberInitials = memberName.slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {mode === 'invite' ? (
                <UserPlus size={18} className="text-primary" />
              ) : (
                <Users size={18} className="text-primary" />
              )}
            </div>
            {mode === 'invite' ? 'Invite Member' : 'Manage Member'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'invite' 
              ? 'Send an invitation to join this group'
              : `Update ${memberName}'s role or remove from group`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {mode === 'invite' ? (
            <>
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['admin', 'member', 'viewer'] as GroupRole[]).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          "flex flex-col items-start p-3 rounded-lg border transition-all text-left",
                          selectedRole === role
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} style={{ color: config.color }} />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{config.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Success State */}
              {inviteSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Check size={18} className="text-green-500" />
                  <span className="text-sm text-green-700 dark:text-green-400">
                    Invitation sent successfully!
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Member Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {memberInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{memberName}</p>
                  <p className="text-sm text-muted-foreground">
                    Current role: {roleConfig[member?.role as GroupRole || 'member'].label}
                  </p>
                </div>
              </div>

              {/* Role Update */}
              <div className="space-y-2">
                <Label>Change Role</Label>
                <Select 
                  value={selectedRole} 
                  onValueChange={(v) => setSelectedRole(v as GroupRole)}
                  disabled={!canEditRole(member?.role as GroupRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['admin', 'member', 'viewer'] as GroupRole[]).map((role) => {
                      const config = roleConfig[role];
                      const Icon = config.icon;
                      return (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <Icon size={14} style={{ color: config.color }} />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === 'edit' && onRemove && member?.role !== 'owner' && (
            <>
              {showRemoveConfirm ? (
                <div className="flex items-center gap-2 mr-auto">
                  <span className="text-sm text-destructive">Remove from group?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Yes, Remove'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRemoveConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive mr-auto"
                  onClick={() => setShowRemoveConfirm(true)}
                >
                  Remove Member
                </Button>
              )}
            </>
          )}
          
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          {mode === 'invite' ? (
            <Button 
              type="button"
              onClick={handleInvite} 
              disabled={!email.trim() || isLoading || inviteSuccess}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={handleUpdateRole} 
              disabled={selectedRole === member?.role || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GroupMemberDialog;
