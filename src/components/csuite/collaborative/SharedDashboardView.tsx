import { useState } from 'react';
import { 
  Users, 
  Activity, 
  Pin, 
  MessageSquare, 
  Upload, 
  Share2, 
  FileText, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  Mail,
  MoreVertical,
  Trash2,
  UserPlus,
  Settings,
  Clock
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  SharedDashboard, 
  DashboardMember, 
  SharedItem, 
  DashboardActivity as ActivityType,
  ActiveViewer 
} from '@/hooks/useSharedDashboards';
import { DashboardMemberManager } from './DashboardMemberManager';
import { formatDistanceToNow } from 'date-fns';

interface SharedDashboardViewProps {
  dashboard: SharedDashboard;
  members: DashboardMember[];
  sharedItems: SharedItem[];
  activities: ActivityType[];
  activeViewers: ActiveViewer[];
  permissions: {
    canView: boolean;
    canUpload: boolean;
    canShare: boolean;
    canComment: boolean;
    canManage: boolean;
  };
  onUnshareItem: (sharedItemId: string) => Promise<boolean>;
  onTogglePin: (sharedItemId: string, position: number | null) => Promise<boolean>;
  onInviteMember: (userId: string, role: DashboardMember['role']) => Promise<boolean>;
  onUpdateMember: (memberId: string, role: DashboardMember['role']) => Promise<boolean>;
  onRemoveMember: (memberId: string) => Promise<boolean>;
  onItemClick?: (itemType: string, itemId: string) => void;
}

const ITEM_TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  document: { icon: FileText, label: 'Document', color: 'text-purple-500' },
  task: { icon: CheckSquare, label: 'Task', color: 'text-red-500' },
  event: { icon: Calendar, label: 'Event', color: 'text-green-500' },
  financial: { icon: DollarSign, label: 'Financial', color: 'text-yellow-500' },
  knowledge: { icon: BookOpen, label: 'Knowledge', color: 'text-blue-500' },
  communication: { icon: Mail, label: 'Communication', color: 'text-cyan-500' },
  message: { icon: MessageSquare, label: 'Message', color: 'text-indigo-500' },
};

const ACTION_CONFIG: Record<string, { label: string; icon: typeof Activity }> = {
  shared_item: { label: 'shared an item', icon: Share2 },
  uploaded: { label: 'uploaded a file', icon: Upload },
  commented: { label: 'commented', icon: MessageSquare },
  joined: { label: 'joined the dashboard', icon: UserPlus },
  left: { label: 'left the dashboard', icon: Users },
  updated: { label: 'updated settings', icon: Settings },
  mentioned: { label: 'mentioned someone', icon: MessageSquare },
};

export function SharedDashboardView({
  dashboard,
  members,
  sharedItems,
  activities,
  activeViewers,
  permissions,
  onUnshareItem,
  onTogglePin,
  onInviteMember,
  onUpdateMember,
  onRemoveMember,
  onItemClick,
}: SharedDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'activity' | 'members'>('items');
  const [memberManagerOpen, setMemberManagerOpen] = useState(false);

  const pinnedItems = sharedItems.filter(item => item.pin_position !== null);
  const unpinnedItems = sharedItems.filter(item => item.pin_position === null);

  return (
    <div className="h-full flex flex-col">
      {/* Dashboard Header */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <span className="text-xs font-mono font-medium">{dashboard.name}</span>
          </div>
          
          {/* Active Viewers */}
          <div className="flex items-center gap-1">
            {activeViewers.slice(0, 5).map((viewer) => (
              <Avatar key={viewer.user_id} className="h-5 w-5 border-2 border-green-500">
                <AvatarImage src={viewer.avatar_url} />
                <AvatarFallback className="text-[8px]">
                  {viewer.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {activeViewers.length > 5 && (
              <Badge variant="secondary" className="text-[8px] h-5">
                +{activeViewers.length - 5}
              </Badge>
            )}
            
            {permissions.canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => setMemberManagerOpen(true)}
              >
                <UserPlus size={10} className="mr-1" />
                Invite
              </Button>
            )}
          </div>
        </div>
        
        {dashboard.description && (
          <p className="text-[10px] text-muted-foreground mt-1">{dashboard.description}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="px-2 py-1 justify-start bg-transparent border-b border-border rounded-none h-8">
          <TabsTrigger 
            value="items" 
            className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Share2 size={10} className="mr-1" />
            Shared ({sharedItems.length})
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Activity size={10} className="mr-1" />
            Activity
          </TabsTrigger>
          <TabsTrigger 
            value="members" 
            className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
          >
            <Users size={10} className="mr-1" />
            Members ({members.length})
          </TabsTrigger>
        </TabsList>

        {/* Shared Items Tab */}
        <TabsContent value="items" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-3">
              {sharedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No items shared yet</p>
                  <p className="text-[10px] mt-1">Share documents, tasks, or data from your personal view</p>
                </div>
              ) : (
                <>
                  {/* Pinned Items */}
                  {pinnedItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <Pin size={10} className="text-primary" />
                        <span className="text-[9px] font-mono text-muted-foreground">PINNED</span>
                      </div>
                      <div className="space-y-1">
                        {pinnedItems.map((item) => (
                          <SharedItemCard
                            key={item.id}
                            item={item}
                            permissions={permissions}
                            onRemove={() => onUnshareItem(item.id)}
                            onTogglePin={() => onTogglePin(item.id, null)}
                            onClick={() => onItemClick?.(item.item_type, item.item_id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Items */}
                  {unpinnedItems.length > 0 && (
                    <div>
                      {pinnedItems.length > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Share2 size={10} className="text-muted-foreground" />
                          <span className="text-[9px] font-mono text-muted-foreground">ALL ITEMS</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        {unpinnedItems.map((item) => (
                          <SharedItemCard
                            key={item.id}
                            item={item}
                            permissions={permissions}
                            onRemove={() => onUnshareItem(item.id)}
                            onTogglePin={() => onTogglePin(item.id, pinnedItems.length + 1)}
                            onClick={() => onItemClick?.(item.item_type, item.item_id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No activity yet</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} members={members} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {members.map((member) => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  canManage={permissions.canManage}
                  onUpdateRole={(role) => onUpdateMember(member.id, role)}
                  onRemove={() => onRemoveMember(member.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Member Manager Dialog */}
      <DashboardMemberManager
        open={memberManagerOpen}
        onOpenChange={setMemberManagerOpen}
        members={members}
        onInvite={onInviteMember}
        onUpdateRole={onUpdateMember}
        onRemove={onRemoveMember}
      />
    </div>
  );
}

// Sub-components
function SharedItemCard({ 
  item, 
  permissions,
  onRemove, 
  onTogglePin,
  onClick 
}: { 
  item: SharedItem; 
  permissions: SharedDashboardViewProps['permissions'];
  onRemove: () => void;
  onTogglePin: () => void;
  onClick?: () => void;
}) {
  const config = ITEM_TYPE_CONFIG[item.item_type] || ITEM_TYPE_CONFIG.document;
  const Icon = config.icon;
  const isPinned = item.pin_position !== null;

  return (
    <div 
      className="p-2 rounded bg-background border border-border hover:border-primary/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <Icon size={14} className={config.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[8px] font-mono">
              {config.label}
            </Badge>
            {isPinned && <Pin size={8} className="text-primary" />}
          </div>
          {item.note && (
            <p className="text-[10px] text-muted-foreground mt-1 truncate">{item.note}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Clock size={8} className="text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        
        {(permissions.canShare || permissions.canManage) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(); }}>
                <Pin size={12} className="mr-2" />
                {isPinned ? 'Unpin' : 'Pin to Top'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-destructive">
                <Trash2 size={12} className="mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

function ActivityCard({ activity, members }: { activity: ActivityType; members: DashboardMember[] }) {
  const member = members.find(m => m.user_id === activity.user_id);
  const actionConfig = ACTION_CONFIG[activity.action] || ACTION_CONFIG.updated;
  const Icon = actionConfig.icon;

  return (
    <div className="flex items-start gap-2 p-2 rounded bg-muted/20">
      <Icon size={12} className="text-muted-foreground mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px]">
          <span className="font-medium">{member?.display_name || 'Unknown'}</span>
          {' '}
          <span className="text-muted-foreground">{actionConfig.label}</span>
        </p>
        <span className="text-[9px] text-muted-foreground">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function MemberCard({ 
  member, 
  canManage,
  onUpdateRole,
  onRemove 
}: { 
  member: DashboardMember;
  canManage: boolean;
  onUpdateRole: (role: DashboardMember['role']) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
      <Avatar className="h-6 w-6">
        <AvatarImage src={member.avatar_url} />
        <AvatarFallback className="text-[8px]">
          {(member.display_name || 'U').slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{member.display_name || 'Unknown User'}</p>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[8px] capitalize">{member.role}</Badge>
          {member.can_upload && <Badge variant="outline" className="text-[7px]">Upload</Badge>}
          {member.can_share && <Badge variant="outline" className="text-[7px]">Share</Badge>}
        </div>
      </div>
      
      {canManage && member.role !== 'owner' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onUpdateRole('admin')}>Make Admin</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateRole('editor')}>Make Editor</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateRole('contributor')}>Make Contributor</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateRole('viewer')}>Make Viewer</DropdownMenuItem>
            <DropdownMenuItem onClick={onRemove} className="text-destructive">Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
