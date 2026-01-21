// Atlas Sonic OS - Group Data Hub Page
// Team/Family/Project collaborative workspace

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useGroupHub, GroupRole, GroupHubType, ItemType } from '@/hooks/useGroupHub';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, Plus, ArrowLeft, CheckSquare, FileText, Calendar, 
  Target, Megaphone, BarChart3, Settings, UserPlus, Crown,
  Shield, Eye, MoreVertical, Check, Clock, AlertCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ROLE_CONFIG: Record<GroupRole, { icon: typeof Crown; label: string; color: string }> = {
  owner: { icon: Crown, label: 'Owner', color: 'text-yellow-500' },
  admin: { icon: Shield, label: 'Admin', color: 'text-blue-500' },
  member: { icon: Users, label: 'Member', color: 'text-green-500' },
  viewer: { icon: Eye, label: 'Viewer', color: 'text-muted-foreground' }
};

const HUB_TYPE_CONFIG: Record<GroupHubType, { label: string; description: string }> = {
  team: { label: 'Team', description: 'For work teams and departments' },
  family: { label: 'Family', description: 'For household management' },
  project: { label: 'Project', description: 'For specific projects or initiatives' },
  department: { label: 'Department', description: 'For organizational departments' },
  organization: { label: 'Organization', description: 'For entire organizations' }
};

const ITEM_TYPE_CONFIG: Record<ItemType, { icon: typeof CheckSquare; label: string; color: string }> = {
  task: { icon: CheckSquare, label: 'Task', color: 'text-blue-500' },
  note: { icon: FileText, label: 'Note', color: 'text-purple-500' },
  event: { icon: Calendar, label: 'Event', color: 'text-green-500' },
  goal: { icon: Target, label: 'Goal', color: 'text-orange-500' },
  resource: { icon: FileText, label: 'Resource', color: 'text-cyan-500' },
  announcement: { icon: Megaphone, label: 'Announcement', color: 'text-red-500' },
  poll: { icon: BarChart3, label: 'Poll', color: 'text-pink-500' }
};

export default function GroupHub() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tier, canAccessHub } = useSubscription();
  const {
    groups,
    currentGroup,
    items,
    activity,
    isLoading,
    isAdmin,
    isOwner,
    canManageItems,
    stats,
    selectGroup,
    createGroup,
    createItem,
    completeItem,
    inviteMember,
    updateMemberRole,
    removeMember,
    leaveGroup
  } = useGroupHub();

  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<GroupHubType>('team');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<GroupRole>('member');
  const [newItemType, setNewItemType] = useState<ItemType>('task');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemContent, setNewItemContent] = useState('');

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  // Check tier access
  const hasAccess = canAccessHub('group');

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    const result = await createGroup(newGroupName, newGroupType, newGroupDesc);
    if (result) {
      toast.success('Group created successfully!');
      setShowCreateDialog(false);
      setNewGroupName('');
      setNewGroupDesc('');
      selectGroup(result.id);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    
    const success = await inviteMember(inviteEmail, inviteRole);
    if (success) {
      toast.success('Invitation sent!');
      setShowInviteDialog(false);
      setInviteEmail('');
    }
  };

  const handleCreateItem = async () => {
    if (!newItemTitle.trim()) return;
    
    const result = await createItem(newItemType, newItemTitle, newItemContent);
    if (result) {
      toast.success(`${ITEM_TYPE_CONFIG[newItemType].label} created!`);
      setShowItemDialog(false);
      setNewItemTitle('');
      setNewItemContent('');
    }
  };

  // Upgrade prompt for users without access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>Upgrade to Access Group Hub</CardTitle>
            <CardDescription>
              Group Data Hub is available on Team, Business, and Enterprise plans.
              Collaborate with your team, family, or organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>✓ Create unlimited group workspaces</p>
              <p>✓ Invite team members with role-based access</p>
              <p>✓ Shared tasks, notes, events, and resources</p>
              <p>✓ Real-time collaboration and activity feeds</p>
              <p>✓ Cross-hub data access with admin invitation</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button className="flex-1">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group list view (no group selected)
  if (!currentGroup) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Group Data Hub
                </h1>
                <p className="text-sm text-muted-foreground">
                  Collaborate with teams, families, and organizations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{tier} Plan</Badge>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                      Create a collaborative workspace for your team, family, or project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Group Name</label>
                      <Input
                        placeholder="Enter group name..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Group Type</label>
                      <Select value={newGroupType} onValueChange={(v) => setNewGroupType(v as GroupHubType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(HUB_TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div>
                                <div>{config.label}</div>
                                <div className="text-xs text-muted-foreground">{config.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description (optional)</label>
                      <Textarea
                        placeholder="Describe your group..."
                        value={newGroupDesc}
                        onChange={(e) => setNewGroupDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                      Create Group
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : groups.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Groups Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first group to start collaborating with others.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const RoleIcon = ROLE_CONFIG[group.myRole || 'member'].icon;
                return (
                  <Card 
                    key={group.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => selectGroup(group.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {HUB_TYPE_CONFIG[group.hub_type as GroupHubType]?.label || group.hub_type}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <RoleIcon className={`w-3 h-3 ${ROLE_CONFIG[group.myRole || 'member'].color}`} />
                              <span className="text-xs">{ROLE_CONFIG[group.myRole || 'member'].label}</span>
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {group.member_count} members
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // Group detail view
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => selectGroup('')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                {currentGroup.name}
                {currentGroup.myRole && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {currentGroup.myRole}
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentGroup.member_count} members • {stats.activeItems} active items
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManageItems && (
              <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Item Type</label>
                      <Select value={newItemType} onValueChange={(v) => setNewItemType(v as ItemType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ITEM_TYPE_CONFIG).map(([key, config]) => {
                            const Icon = config.icon;
                            return (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  <Icon className={`w-4 h-4 ${config.color}`} />
                                  {config.label}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        placeholder="Enter title..."
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content (optional)</label>
                      <Textarea
                        placeholder="Add details..."
                        value={newItemContent}
                        onChange={(e) => setNewItemContent(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateItem} disabled={!newItemTitle.trim()}>
                      Create Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {isAdmin && (
              <>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join this group.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          placeholder="Enter email address..."
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as GroupRole)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                            <SelectItem value="member">Member (can add items)</SelectItem>
                            <SelectItem value="admin">Admin (can manage members)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
                      <Button onClick={handleInviteMember} disabled={!inviteEmail.trim()}>
                        Send Invitation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.activeItems}</div>
                  <p className="text-sm text-muted-foreground">Active Items</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.completedItems}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{stats.memberCount}</div>
                  <p className="text-sm text-muted-foreground">Members</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-500">{stats.tasksDue}</div>
                  <p className="text-sm text-muted-foreground">Tasks Due</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {items.slice(0, 10).map((item) => {
                        const config = ITEM_TYPE_CONFIG[item.item_type as ItemType];
                        const Icon = config?.icon || FileText;
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <Icon className={`w-4 h-4 ${config?.color || ''}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(item.created_at), 'MMM d, h:mm a')}
                              </p>
                            </div>
                            {item.status === 'completed' && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        );
                      })}
                      {items.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No items yet
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {activity.slice(0, 10).map((act) => (
                        <div key={act.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              {act.action.replace(/_/g, ' ')}
                              {act.details && typeof act.details === 'object' && 'title' in act.details && (
                                <span className="font-medium"> "{(act.details as { title: string }).title}"</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(act.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))}
                      {activity.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No activity yet
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="space-y-4">
              {items.filter(i => i.item_type === 'task').map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={item.status === 'completed' ? 'text-green-500' : ''}
                        onClick={() => item.status !== 'completed' && completeItem(item.id)}
                      >
                        {item.status === 'completed' ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <p className={`font-medium ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </p>
                        {item.content && (
                          <p className="text-sm text-muted-foreground">{item.content}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {item.priority === 'urgent' && (
                            <Badge variant="destructive" className="text-xs">Urgent</Badge>
                          )}
                          {item.priority === 'high' && (
                            <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-600">High</Badge>
                          )}
                          {item.due_date && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {format(new Date(item.due_date), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {items.filter(i => i.item_type === 'task').length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No tasks yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.filter(i => i.item_type === 'note').map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {item.content || 'No content'}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {items.filter(i => i.item_type === 'note').length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="pt-6 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No notes yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="space-y-4">
              {items.filter(i => i.item_type === 'event').map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        {item.content && (
                          <p className="text-sm text-muted-foreground">{item.content}</p>
                        )}
                        {item.due_date && (
                          <p className="text-sm text-primary mt-1">
                            {format(new Date(item.due_date), 'EEEE, MMMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {items.filter(i => i.item_type === 'event').length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No events yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-2">
              {currentGroup.members?.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role as GroupRole];
                const RoleIcon = roleConfig?.icon || Users;
                return (
                  <Card key={member.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {member.profile?.display_name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {member.profile?.display_name || 'Unknown User'}
                            {member.user_id === user?.id && (
                              <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <RoleIcon className={`w-3 h-3 ${roleConfig?.color}`} />
                            {roleConfig?.label}
                          </p>
                        </div>
                        {isAdmin && member.user_id !== user?.id && member.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'admin')}>
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'member')}>
                                Make Member
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMemberRole(member.id, 'viewer')}>
                                Make Viewer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => removeMember(member.id)}
                              >
                                Remove from Group
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
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="pt-6">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {activity.map((act) => (
                      <div key={act.id} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {act.action.includes('item') ? (
                            <FileText className="w-4 h-4" />
                          ) : act.action.includes('member') ? (
                            <Users className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium capitalize">
                              {act.action.replace(/_/g, ' ')}
                            </span>
                            {act.details && typeof act.details === 'object' && 'title' in act.details && (
                              <span> - {(act.details as { title: string }).title}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(act.created_at), 'MMMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activity.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No activity recorded yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
