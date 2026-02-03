// Fullscreen Group Detailed Dashboard - Shows all group data with full CRUD
// Displays: Members, Tasks, Events, Files, Chat with create/edit/delete capabilities

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { 
  X,
  Users,
  MessageSquare,
  Calendar,
  CheckSquare,
  FileText,
  Sun,
  Moon,
  Sunrise,
  Activity,
  Crown,
  Shield,
  Eye,
  Sparkles,
  Mic,
  Plus,
  UserPlus,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAtlasSafe } from '@/contexts/AtlasContext';
import { useAuth } from '@/hooks/useAuth';
import { useGroupHub, GroupItem, GroupMemberWithProfile, ItemType, ItemPriority } from '@/hooks/useGroupHub';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { GroupItemDialog } from './GroupItemDialog';
import { GroupMemberDialog } from './GroupMemberDialog';
import { GroupItemCard } from './GroupItemCard';
import { toast } from 'sonner';

export type GroupSection = 'members' | 'tasks' | 'events' | 'files' | 'chat' | 'activity';

interface FullscreenGroupDetailedDashboardProps {
  userId: string | undefined;
  groupId?: string;
  groupName?: string;
  memberCount?: number;
  initialSection?: GroupSection;
  onClose: () => void;
}

// Role config for display
const roleConfig: Record<string, { icon: typeof Crown; color: string }> = {
  owner: { icon: Crown, color: 'hsl(45 80% 50%)' },
  admin: { icon: Shield, color: 'hsl(200 70% 50%)' },
  member: { icon: Users, color: 'hsl(150 70% 45%)' },
  viewer: { icon: Eye, color: 'hsl(0 0% 50%)' },
};

// Get time-based greeting
function getGreeting(): { text: string; icon: typeof Sun; period: 'morning' | 'afternoon' | 'evening' } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise, period: 'morning' };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun, period: 'afternoon' };
  return { text: 'Good evening', icon: Moon, period: 'evening' };
}

export function FullscreenGroupDetailedDashboard({ 
  userId,
  groupId,
  groupName = 'Group',
  memberCount = 0,
  initialSection,
  onClose 
}: FullscreenGroupDetailedDashboardProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const atlas = useAtlasSafe();
  
  // Group hub data
  const {
    currentGroup,
    items,
    selectGroup,
    createItem,
    updateItem,
    completeItem,
    deleteItem,
    inviteMember,
    updateMemberRole,
    removeMember,
    isAdmin,
    canManageItems,
    getItemsByType,
    stats
  } = useGroupHub();

  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  
  // Dialog states
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroupItem | null>(null);
  const [editingMember, setEditingMember] = useState<GroupMemberWithProfile | null>(null);
  const [memberDialogMode, setMemberDialogMode] = useState<'invite' | 'edit'>('invite');
  const [defaultItemType, setDefaultItemType] = useState<ItemType>('task');
  
  // Refs for scrolling to sections
  const sectionRefs = {
    members: useRef<HTMLDivElement>(null),
    tasks: useRef<HTMLDivElement>(null),
    events: useRef<HTMLDivElement>(null),
    files: useRef<HTMLDivElement>(null),
    chat: useRef<HTMLDivElement>(null),
    activity: useRef<HTMLDivElement>(null),
  };

  // Load group data when component mounts
  useEffect(() => {
    if (groupId) {
      selectGroup(groupId);
    }
  }, [groupId, selectGroup]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Scroll to initial section when component mounts
  useEffect(() => {
    if (initialSection && sectionRefs[initialSection]?.current) {
      setTimeout(() => {
        sectionRefs[initialSection]?.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [initialSection]);

  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.email?.split('@')[0] || 'there';
  
  const handleAtlasActivate = useCallback(() => {
    if (atlas) {
      if (atlas.isConnected) {
        atlas.stopConversation();
      } else {
        atlas.startConversation();
      }
    }
  }, [atlas]);

  // Get items by type
  const tasks = useMemo(() => getItemsByType('task'), [getItemsByType]);
  const events = useMemo(() => getItemsByType('event'), [getItemsByType]);
  const notes = useMemo(() => getItemsByType('note'), [getItemsByType]);
  const announcements = useMemo(() => getItemsByType('announcement'), [getItemsByType]);

  // Item CRUD handlers
  const handleCreateItem = (type: ItemType) => {
    setEditingItem(null);
    setDefaultItemType(type);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: GroupItem) => {
    setEditingItem(item);
    setDefaultItemType(item.item_type as ItemType);
    setItemDialogOpen(true);
  };

  const handleSaveItem = async (data: {
    itemType: ItemType;
    title: string;
    content?: string;
    priority?: ItemPriority;
    dueDate?: Date;
    tags?: string[];
  }): Promise<boolean> => {
    try {
      if (editingItem) {
        // Update existing item
        const success = await updateItem(editingItem.id, {
          title: data.title,
          content: data.content,
          priority: data.priority,
          due_date: data.dueDate?.toISOString(),
          tags: data.tags
        });
        if (success) {
          toast.success('Item updated successfully');
          return true;
        }
      } else {
        // Create new item
        const result = await createItem(
          data.itemType,
          data.title,
          data.content,
          {
            priority: data.priority,
            dueDate: data.dueDate,
            tags: data.tags
          }
        );
        if (result) {
          toast.success(`${data.itemType.charAt(0).toUpperCase() + data.itemType.slice(1)} created`);
          return true;
        }
      }
      return false;
    } catch (error) {
      toast.error('Failed to save item');
      return false;
    }
  };

  const handleDeleteItem = async (itemId: string): Promise<boolean> => {
    try {
      const success = await deleteItem(itemId);
      if (success) {
        toast.success('Item deleted');
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Failed to delete item');
      return false;
    }
  };

  const handleCompleteItem = async (itemId: string) => {
    try {
      await completeItem(itemId);
      toast.success('Task completed!');
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  // Member handlers
  const handleInviteMember = () => {
    setEditingMember(null);
    setMemberDialogMode('invite');
    setMemberDialogOpen(true);
  };

  const handleEditMember = (member: GroupMemberWithProfile) => {
    setEditingMember(member);
    setMemberDialogMode('edit');
    setMemberDialogOpen(true);
  };

  const handleInvite = async (email: string, role: string): Promise<boolean> => {
    try {
      const success = await inviteMember(email, role as any);
      if (success) {
        toast.success('Invitation sent!');
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Failed to send invitation');
      return false;
    }
  };

  const handleUpdateRole = async (memberId: string, role: string): Promise<boolean> => {
    try {
      const success = await updateMemberRole(memberId, role as any);
      if (success) {
        toast.success('Role updated');
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Failed to update role');
      return false;
    }
  };

  const handleRemoveMember = async (memberId: string): Promise<boolean> => {
    try {
      const success = await removeMember(memberId);
      if (success) {
        toast.success('Member removed');
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Failed to remove member');
      return false;
    }
  };

  const members = currentGroup?.members || [];
  const actualMemberCount = members.length || memberCount;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] bg-background overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
            <Users size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {currentGroup?.name || groupName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {actualMemberCount} members • {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClose} 
          className="h-10 px-4 rounded-xl gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
        >
          <X size={18} className="text-primary" />
          <span className="text-sm font-medium text-primary">Close</span>
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Group Overview */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Group Overview</h2>
                <p className="text-sm text-muted-foreground">Your team at a glance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-card/50">
                <CardContent className="p-4 text-center">
                  <Users size={24} className="mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{actualMemberCount}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4 text-center">
                  <CheckSquare size={24} className="mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{stats.activeItems}</p>
                  <p className="text-xs text-muted-foreground">Active Tasks</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4 text-center">
                  <Calendar size={24} className="mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{events.length}</p>
                  <p className="text-xs text-muted-foreground">Upcoming Events</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4 text-center">
                  <FileText size={24} className="mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{notes.length}</p>
                  <p className="text-xs text-muted-foreground">Shared Notes</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Members Section */}
          <section ref={sectionRefs.members}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users size={20} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Members</h2>
                <p className="text-sm text-muted-foreground">Team members and roles</p>
              </div>
              <Badge variant="secondary">{actualMemberCount}</Badge>
              {isAdmin && (
                <Button size="sm" onClick={handleInviteMember} className="gap-2">
                  <UserPlus size={16} />
                  Invite
                </Button>
              )}
            </div>
            
            {members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((member) => {
                  const role = roleConfig[member.role || 'member'];
                  const RoleIcon = role.icon;
                  const name = member.profile?.display_name || member.profile?.operator_handle || 'Member';
                  const initials = name.slice(0, 2).toUpperCase();
                  
                  return (
                    <Card key={member.id} className="bg-card/50 hover:bg-card/80 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <RoleIcon size={12} style={{ color: role.color }} />
                              <span className="capitalize">{member.role}</span>
                            </div>
                          </div>
                          {isAdmin && member.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditMember(member)}>
                                  <Edit size={14} className="mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <Users size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Manage your team</h3>
                  <p className="text-muted-foreground mb-4">Invite members and assign roles</p>
                  {isAdmin && (
                    <Button onClick={handleInviteMember} className="gap-2">
                      <UserPlus size={16} />
                      Invite First Member
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Tasks Section */}
          <section ref={sectionRefs.tasks}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckSquare size={20} className="text-green-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Tasks</h2>
                <p className="text-sm text-muted-foreground">Shared action items</p>
              </div>
              {canManageItems && (
                <Button size="sm" onClick={() => handleCreateItem('task')} className="gap-2">
                  <Plus size={16} />
                  Add Task
                </Button>
              )}
            </div>
            
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <GroupItemCard
                    key={task.id}
                    item={task}
                    canEdit={canManageItems}
                    onEdit={handleEditItem}
                    onComplete={handleCompleteItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-8 text-center">
                  <CheckSquare size={40} className="mx-auto mb-3 text-green-500" />
                  <h3 className="text-lg font-semibold">No tasks yet</h3>
                  <p className="text-muted-foreground mb-4">Create tasks to track team progress</p>
                  {canManageItems && (
                    <Button onClick={() => handleCreateItem('task')} className="gap-2">
                      <Plus size={16} />
                      Create First Task
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Events Section */}
          <section ref={sectionRefs.events}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Calendar size={20} className="text-purple-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Events</h2>
                <p className="text-sm text-muted-foreground">Team meetings and events</p>
              </div>
              {canManageItems && (
                <Button size="sm" onClick={() => handleCreateItem('event')} className="gap-2">
                  <Plus size={16} />
                  Add Event
                </Button>
              )}
            </div>
            
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.map((event) => (
                  <GroupItemCard
                    key={event.id}
                    item={event}
                    canEdit={canManageItems}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-purple-500/5 border-purple-500/20">
                <CardContent className="p-8 text-center">
                  <Calendar size={40} className="mx-auto mb-3 text-purple-500" />
                  <h3 className="text-lg font-semibold">No events scheduled</h3>
                  <p className="text-muted-foreground mb-4">Schedule team meetings and events</p>
                  {canManageItems && (
                    <Button onClick={() => handleCreateItem('event')} className="gap-2">
                      <Plus size={16} />
                      Schedule First Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Notes Section */}
          <section ref={sectionRefs.files}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <FileText size={20} className="text-yellow-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Notes & Files</h2>
                <p className="text-sm text-muted-foreground">Shared notes and resources</p>
              </div>
              {canManageItems && (
                <Button size="sm" onClick={() => handleCreateItem('note')} className="gap-2">
                  <Plus size={16} />
                  Add Note
                </Button>
              )}
            </div>
            
            {notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((note) => (
                  <GroupItemCard
                    key={note.id}
                    item={note}
                    canEdit={canManageItems}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-8 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-yellow-500" />
                  <h3 className="text-lg font-semibold">No notes yet</h3>
                  <p className="text-muted-foreground mb-4">Share notes and resources with your team</p>
                  {canManageItems && (
                    <Button onClick={() => handleCreateItem('note')} className="gap-2">
                      <Plus size={16} />
                      Create First Note
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Recent Activity */}
          <section ref={sectionRefs.activity}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">What's happening in the group</p>
              </div>
            </div>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <Activity size={40} className="mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold">Welcome to {currentGroup?.name || groupName}!</h3>
                <p className="text-muted-foreground">Activity will appear here as your team collaborates</p>
              </CardContent>
            </Card>
          </section>

        </div>
      </ScrollArea>

      {/* Floating Atlas Orb */}
      {atlas && (
        <button
          onClick={handleAtlasActivate}
          className={cn(
            "fixed bottom-6 right-6 w-14 h-14 rounded-full overflow-hidden transition-all duration-300",
            "shadow-lg hover:scale-105 active:scale-95"
          )}
          style={{
            boxShadow: atlas.isConnected 
              ? `0 0 ${15 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 25}px hsl(var(--primary) / 0.5)`
              : `0 0 10px hsl(var(--primary) / 0.3)`
          }}
        >
          {/* Nebula background */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(ellipse at 30% 30%, 
                hsl(200 80% 60% / 0.8) 0%,
                hsl(220 70% 50% / 0.6) 30%,
                hsl(240 60% 40% / 0.8) 60%,
                hsl(260 50% 30%) 100%)`
            }}
          />
          
          {/* Spinning animation when active */}
          {atlas.isConnected && (
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent, hsl(var(--primary) / 0.3), transparent)`,
                animation: atlas.isSpeaking ? 'spin 1s linear infinite' : 'spin 3s linear infinite'
              }}
            />
          )}
          
          {/* Core */}
          <div className="absolute inset-2 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
            {atlas.isConnected ? (
              <Mic size={20} className="text-white" />
            ) : (
              <Sparkles size={20} className="text-white" />
            )}
          </div>
          
          {/* Active indicator */}
          {atlas.isConnected && atlas.isSpeaking && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
          )}
        </button>
      )}

      {/* Item Dialog */}
      <GroupItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editingItem}
        defaultType={defaultItemType}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      {/* Member Dialog */}
      <GroupMemberDialog
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        mode={memberDialogMode}
        member={editingMember}
        currentUserRole={currentGroup?.myRole}
        onInvite={handleInvite}
        onUpdateRole={handleUpdateRole}
        onRemove={handleRemoveMember}
      />
    </div>,
    document.body
  );
}

export default FullscreenGroupDetailedDashboard;
