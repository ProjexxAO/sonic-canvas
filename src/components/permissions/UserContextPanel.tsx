import { User, Radio, Briefcase, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useWorkspaces } from '@/hooks/useWorkspaces';

interface UserContextPanelProps {
  userId?: string;
}

export function UserContextPanel({ userId }: UserContextPanelProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaces();

  // For now, show current user context
  // Later can fetch specific user data based on userId
  const displayName = user?.email?.split('@')[0] || 'Unknown User';
  const operatorHandle = 'Ω-UNASSIGNED';

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Workspace */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{currentWorkspace?.name || 'No Workspace'}</span>
          </div>

          {/* Sonic Signature */}
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-500 animate-pulse" />
            <Badge variant="outline" className="font-mono text-cyan-500 border-cyan-500/30 bg-cyan-500/5">
              {operatorHandle}
            </Badge>
          </div>

          {/* Agent Selector (placeholder for multi-agent support) */}
          <div className="flex items-center gap-2 ml-auto">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Select defaultValue="current">
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Agent Context</SelectItem>
                <SelectItem value="all">All Agents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
