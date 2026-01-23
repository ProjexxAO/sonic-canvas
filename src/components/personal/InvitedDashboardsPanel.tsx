// Invited Dashboards Panel - Shows dashboards user has been invited to
// Enables easy transition from Personal Hub to Business/Executive dashboards

import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Briefcase, 
  Users, 
  ExternalLink, 
  Crown, 
  Shield,
  Eye,
  Edit3,
  ChevronRight,
  Sparkles,
  Building2,
  UserCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useCrossHubAccess, type CrossHubGrant, type HubType, type AccessType } from '@/hooks/useCrossHubAccess';
import { useSharedDashboards } from '@/hooks/useSharedDashboards';
import { useAuth } from '@/hooks/useAuth';

interface InvitedDashboardsPanelProps {
  className?: string;
  compact?: boolean;
}

const hubConfig: Record<HubType, { 
  icon: typeof Briefcase; 
  label: string; 
  route: string;
  color: string;
  bgColor: string;
}> = {
  personal: { 
    icon: UserCircle, 
    label: 'Personal Hub', 
    route: '/personal',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  group: { 
    icon: Users, 
    label: 'Group Hub', 
    route: '/group',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  csuite: { 
    icon: Briefcase, 
    label: 'Enterprise Hub', 
    route: '/atlas',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  }
};

const accessIcons: Record<AccessType, typeof Eye> = {
  read: Eye,
  write: Edit3,
  admin: Shield
};

const accessLabels: Record<AccessType, string> = {
  read: 'View',
  write: 'Edit',
  admin: 'Admin'
};

export function InvitedDashboardsPanel({ className, compact = false }: InvitedDashboardsPanelProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { grantedToMe, isLoading: accessLoading } = useCrossHubAccess();
  const { dashboards, isLoading: dashboardsLoading } = useSharedDashboards(user?.id);

  // Filter out personal hub grants (user always has access)
  const hubInvitations = grantedToMe.filter(g => g.sourceHubType !== 'personal');
  
  // Get dashboards where user is invited (not created by them)
  const invitedDashboards = dashboards.filter(d => 
    d.created_by !== user?.id && d.my_role
  );

  const isLoading = accessLoading || dashboardsLoading;
  const hasInvitations = hubInvitations.length > 0 || invitedDashboards.length > 0;

  if (!hasInvitations && !isLoading) {
    return null; // Don't show panel if no invitations
  }

  const handleNavigateToHub = (hubType: HubType) => {
    const config = hubConfig[hubType];
    navigate(config.route);
  };

  const handleNavigateToDashboard = (dashboardId: string) => {
    // Navigate to atlas with dashboard context
    navigate(`/atlas?dashboard=${dashboardId}`);
  };

  const renderHubGrant = (grant: CrossHubGrant) => {
    const config = hubConfig[grant.sourceHubType];
    const AccessIcon = accessIcons[grant.accessType];
    const HubIcon = config.icon;

    return (
      <div
        key={grant.id}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
          theme === 'dark' 
            ? "hover:bg-muted/30 border border-transparent hover:border-border/50" 
            : "hover:bg-muted/50 border border-transparent hover:border-border/30"
        )}
        onClick={() => handleNavigateToHub(grant.sourceHubType)}
      >
        <div className={cn(
          "p-2.5 rounded-xl transition-colors",
          config.bgColor
        )}>
          <HubIcon className={cn("h-5 w-5", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {grant.sourceHubName || config.label}
            </span>
            <Badge 
              variant="secondary" 
              className="text-[9px] font-mono px-1.5 py-0 h-4 flex items-center gap-1"
            >
              <AccessIcon className="h-2.5 w-2.5" />
              {accessLabels[grant.accessType]}
            </Badge>
          </div>
          {grant.grantedByName && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Invited by {grant.grantedByName}
            </p>
          )}
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  const renderSharedDashboard = (dashboard: typeof invitedDashboards[0]) => {
    const roleIcon = dashboard.my_role === 'owner' || dashboard.my_role === 'admin' 
      ? Crown 
      : dashboard.my_role === 'editor' 
        ? Edit3 
        : Eye;
    const RoleIcon = roleIcon;

    return (
      <div
        key={dashboard.id}
        className={cn(
          "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
          theme === 'dark' 
            ? "hover:bg-muted/30 border border-transparent hover:border-border/50" 
            : "hover:bg-muted/50 border border-transparent hover:border-border/30"
        )}
        onClick={() => handleNavigateToDashboard(dashboard.id)}
      >
        <div className={cn(
          "p-2.5 rounded-xl",
          theme === 'dark' ? "bg-primary/20" : "bg-primary/10"
        )}>
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{dashboard.name}</span>
            <Badge 
              variant="outline" 
              className="text-[9px] font-mono px-1.5 py-0 h-4 flex items-center gap-1"
            >
              <RoleIcon className="h-2.5 w-2.5" />
              {dashboard.my_role}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {dashboard.description && (
              <p className="text-[10px] text-muted-foreground truncate">
                {dashboard.description}
              </p>
            )}
            {dashboard.member_count && dashboard.member_count > 1 && (
              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                <Users className="h-2.5 w-2.5" />
                {dashboard.member_count}
              </span>
            )}
          </div>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };

  if (compact) {
    return (
      <Card className={cn(
        "border-0 shadow-lg backdrop-blur-sm overflow-hidden",
        theme === 'dark' ? "bg-card/40" : "bg-white/80",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              "p-1.5 rounded-lg",
              theme === 'dark' ? "bg-primary/20" : "bg-primary/10"
            )}>
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Invited Dashboards
            </span>
            <Badge variant="secondary" className="text-[9px] ml-auto">
              {hubInvitations.length + invitedDashboards.length}
            </Badge>
          </div>
          
          <div className="space-y-1">
            {hubInvitations.slice(0, 2).map(renderHubGrant)}
            {invitedDashboards.slice(0, 2).map(renderSharedDashboard)}
            
            {(hubInvitations.length + invitedDashboards.length) > 4 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs mt-2"
                onClick={() => navigate('/personal?section=invites')}
              >
                View all {hubInvitations.length + invitedDashboards.length} invitations
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-0 shadow-lg backdrop-blur-sm overflow-hidden",
      theme === 'dark' ? "bg-card/40" : "bg-white/80",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 font-semibold">
          <div className={cn(
            "p-1.5 rounded-lg",
            theme === 'dark' ? "bg-primary/20" : "bg-primary/10"
          )}>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          Your Hub Access
          <Badge variant="secondary" className="text-[9px] ml-auto font-mono">
            {hubInvitations.length + invitedDashboards.length} invitations
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className={cn(compact ? "h-[180px]" : "h-[280px]")}>
          {/* Hub Invitations */}
          {hubInvitations.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 px-1 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Hub Access
                </span>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-1">
                {hubInvitations.map(renderHubGrant)}
              </div>
            </div>
          )}
          
          {/* Shared Dashboards */}
          {invitedDashboards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-1 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Shared Dashboards
                </span>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-1">
                {invitedDashboards.map(renderSharedDashboard)}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasInvitations && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ExternalLink className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No invitations yet</p>
              <p className="text-xs text-muted-foreground/70">
                When you're invited to a team or executive dashboard, it will appear here
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Quick Hub Navigation */}
        <div className="pt-4 border-t border-border/50 mt-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Quick Access
          </p>
          <div className="flex gap-2">
            {Object.entries(hubConfig).map(([key, config]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 text-xs gap-1.5",
                  key === 'personal' && "border-blue-500/30 text-blue-500 hover:bg-blue-500/10",
                  key === 'group' && "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10",
                  key === 'csuite' && "border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                )}
                onClick={() => navigate(config.route)}
              >
                <config.icon className="h-3.5 w-3.5" />
                {key === 'csuite' ? 'Enterprise' : key.charAt(0).toUpperCase() + key.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
