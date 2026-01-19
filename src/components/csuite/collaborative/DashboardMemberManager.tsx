import { useState, useEffect } from 'react';
import { UserPlus, Search, Crown, Shield, Edit, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardMember } from '@/hooks/useSharedDashboards';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMemberManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: DashboardMember[];
  onInvite: (userId: string, role: DashboardMember['role']) => Promise<boolean>;
  onUpdateRole: (memberId: string, role: DashboardMember['role']) => Promise<boolean>;
  onRemove: (memberId: string) => Promise<boolean>;
}

interface UserSearchResult {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  operator_handle: string | null;
}

const ROLE_OPTIONS: { value: DashboardMember['role']; label: string; icon: typeof Eye; description: string }[] = [
  { value: 'viewer', label: 'Viewer', icon: Eye, description: 'Can view shared items' },
  { value: 'contributor', label: 'Contributor', icon: Edit, description: 'Can share items and comment' },
  { value: 'editor', label: 'Editor', icon: Edit, description: 'Can edit and manage items' },
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Can manage members' },
];

export function DashboardMemberManager({
  open,
  onOpenChange,
  members,
  onInvite,
  onUpdateRole,
  onRemove,
}: DashboardMemberManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<DashboardMember['role']>('viewer');
  const [isInviting, setIsInviting] = useState(false);

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, operator_handle')
          .or(`display_name.ilike.%${searchQuery}%,operator_handle.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;

        // Filter out existing members
        const existingUserIds = members.map(m => m.user_id);
        const filtered = (data || []).filter(u => !existingUserIds.includes(u.user_id));
        
        setSearchResults(filtered);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, members]);

  const handleInvite = async (userId: string) => {
    setIsInviting(true);
    const success = await onInvite(userId, selectedRole);
    setIsInviting(false);
    
    if (success) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={16} className="text-primary" />
            Manage Dashboard Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invite Section */}
          <div className="space-y-3">
            <Label>Invite Members</Label>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or handle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as DashboardMember['role'])}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon size={12} />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Results */}
            {(isSearching || searchResults.length > 0) && (
              <div className="border border-border rounded-md max-h-48 overflow-hidden">
                {isSearching ? (
                  <div className="p-3 text-center">
                    <Loader2 size={16} className="animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : (
                  <ScrollArea className="max-h-48">
                    {searchResults.map((user) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(user.display_name || 'U').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.display_name || 'Unknown'}</p>
                            {user.operator_handle && (
                              <p className="text-[10px] text-muted-foreground">{user.operator_handle}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleInvite(user.user_id)}
                          disabled={isInviting}
                        >
                          {isInviting ? <Loader2 size={12} className="animate-spin" /> : 'Invite'}
                        </Button>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>
            )}

            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="text-[10px] text-muted-foreground">Type at least 2 characters to search</p>
            )}

            {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
              <p className="text-[10px] text-muted-foreground">No users found</p>
            )}
          </div>

          {/* Current Members */}
          <div className="space-y-3">
            <Label>Current Members ({members.length})</Label>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="text-[10px]">
                          {(member.display_name || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.display_name || 'Unknown'}</p>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant={member.role === 'owner' ? 'default' : 'secondary'} 
                            className="text-[8px] capitalize"
                          >
                            {member.role === 'owner' && <Crown size={8} className="mr-0.5" />}
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {member.role !== 'owner' && (
                      <div className="flex items-center gap-1">
                        <Select 
                          value={member.role} 
                          onValueChange={(v) => onUpdateRole(member.id, v as DashboardMember['role'])}
                        >
                          <SelectTrigger className="h-7 w-[100px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => onRemove(member.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Role Descriptions */}
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] font-mono text-muted-foreground mb-2">ROLE PERMISSIONS</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((role) => (
                <div key={role.value} className="flex items-start gap-1.5">
                  <role.icon size={10} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-[10px] font-medium">{role.label}</p>
                    <p className="text-[9px] text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
