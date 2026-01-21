// Hub Quick Access - Compact links to Group and C-Suite hubs
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useCrossHubAccess } from '@/hooks/useCrossHubAccess';
import { useSharedDashboards } from '@/hooks/useSharedDashboards';
import { useAuth } from '@/hooks/useAuth';

interface HubQuickAccessProps {
  className?: string;
}

export function HubQuickAccess({ className }: HubQuickAccessProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { grantedToMe, isLoading: accessLoading } = useCrossHubAccess();
  const { dashboards, isLoading: dashboardsLoading } = useSharedDashboards(user?.id);

  // Filter hub invitations (exclude personal)
  const hubInvitations = grantedToMe.filter(g => g.sourceHubType !== 'personal');
  
  // Get dashboards where user is invited
  const invitedDashboards = dashboards.filter(d => 
    d.created_by !== user?.id && d.my_role
  );

  const totalInvites = hubInvitations.length + invitedDashboards.length;
  const isLoading = accessLoading || dashboardsLoading;

  // Get count by hub type
  const groupCount = hubInvitations.filter(g => g.sourceHubType === 'group').length;
  const csuiteCount = hubInvitations.filter(g => g.sourceHubType === 'csuite').length + invitedDashboards.length;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        {/* Group Hub Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 text-[10px] font-mono relative",
                groupCount > 0 ? "text-emerald-500" : "text-muted-foreground"
              )}
              onClick={() => navigate('/group')}
            >
              <Users size={12} className="mr-1" />
              Group
              {groupCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-1 text-[8px] px-1 py-0 h-3.5 bg-emerald-500/20 text-emerald-500"
                >
                  {groupCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {groupCount > 0 
              ? `${groupCount} group hub${groupCount > 1 ? 's' : ''} available`
              : 'No group hub invitations'
            }
          </TooltipContent>
        </Tooltip>

        {/* C-Suite Hub Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 text-[10px] font-mono relative",
                csuiteCount > 0 ? "text-purple-500" : "text-muted-foreground"
              )}
              onClick={() => navigate('/atlas')}
            >
              <Briefcase size={12} className="mr-1" />
              Executive
              {csuiteCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-1 text-[8px] px-1 py-0 h-3.5 bg-purple-500/20 text-purple-500"
                >
                  {csuiteCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {csuiteCount > 0 
              ? `${csuiteCount} executive dashboard${csuiteCount > 1 ? 's' : ''} available`
              : 'No executive dashboard invitations'
            }
          </TooltipContent>
        </Tooltip>

        {/* View All Link */}
        {totalInvites > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigate('/personal?section=invites')}
              >
                <ChevronRight size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              View all {totalInvites} invitations
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
