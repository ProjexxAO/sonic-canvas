// Group Hub - Uses unified AtlasHubLayout for consistent experience
// The solar system visualization with central Atlas orb for group collaboration

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useGroupHub, GroupRole, GroupHubType } from '@/hooks/useGroupHub';
import { AtlasErrorBoundary } from '@/pages/Atlas';
import { AtlasHubLayout } from '@/components/atlas/AtlasHubLayout';
import { TierBadge } from '@/components/subscription/TierBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, ArrowLeft, Crown, Shield, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
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

function GroupHubPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tier, canAccessHub } = useSubscription();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme ?? 'dark';
  const {
    groups,
    currentGroup,
    isLoading,
    selectGroup,
    createGroup,
  } = useGroupHub();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<GroupHubType>('team');
  const [newGroupDesc, setNewGroupDesc] = useState('');

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

  // Upgrade prompt for users without access
  if (!hasAccess) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-4",
        theme === 'dark' 
          ? "bg-[hsl(240_10%_4%)]" 
          : "bg-gradient-to-br from-[hsl(220_25%_97%)] via-[hsl(220_20%_95%)] to-[hsl(220_30%_92%)]"
      )}>
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
              <Button variant="outline" onClick={() => navigate('/personal')} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Personal Hub
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

  // Group list view (no group selected) - show selection screen
  if (!currentGroup) {
    return (
      <div className={cn(
        "min-h-screen",
        theme === 'dark' 
          ? "bg-[hsl(240_10%_4%)]" 
          : "bg-gradient-to-br from-[hsl(220_25%_97%)] via-[hsl(220_20%_95%)] to-[hsl(220_30%_92%)]"
      )}>
        <header className={cn(
          "border-b backdrop-blur-xl sticky top-0 z-10",
          theme === 'dark' 
            ? "bg-[hsl(240_10%_6%/0.8)] border-border/50" 
            : "bg-white/70 border-border/30 shadow-sm"
        )}>
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/personal')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Group Hub
                </h1>
                <p className="text-xs text-muted-foreground">
                  Collaborate with teams, families, and organizations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TierBadge tier={tier} />
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
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

        <main className="container mx-auto px-6 py-8">
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

  // Group selected - use unified AtlasHubLayout
  return (
    <AtlasHubLayout
      hubType="group"
      hubTitle={currentGroup.name}
      hubSubtitle={`${HUB_TYPE_CONFIG[currentGroup.hub_type as GroupHubType]?.label || 'Group'} • ${currentGroup.member_count} members`}
      groupId={currentGroup.id}
    />
  );
}

export default function GroupHub() {
  return (
    <AtlasErrorBoundary>
      <GroupHubPage />
    </AtlasErrorBoundary>
  );
}
