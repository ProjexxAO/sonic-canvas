import { useEffect, useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Navigation, 
  Bell, 
  Activity, 
  Trash2, 
  Database, 
  Info,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolActivity {
  tool: string;
  status: 'active' | 'success' | 'error';
  timestamp: Date;
}

interface ToolActivityIndicatorProps {
  activities: ToolActivity[];
}

const toolIcons: Record<string, React.ElementType> = {
  searchAgents: Search,
  synthesizeAgent: Sparkles,
  navigateTo: Navigation,
  showNotification: Bell,
  getSystemStatus: Activity,
  clearResults: Trash2,
  listSectors: Database,
  getAgentDetails: Info,
  system: Activity
};

const toolLabels: Record<string, string> = {
  searchAgents: 'SEARCHING',
  synthesizeAgent: 'SYNTHESIZING',
  navigateTo: 'NAVIGATING',
  showNotification: 'NOTIFYING',
  getSystemStatus: 'STATUS CHECK',
  clearResults: 'CLEARING',
  listSectors: 'LISTING',
  getAgentDetails: 'FETCHING',
  system: 'SYSTEM'
};

export function ToolActivityIndicator({ activities }: ToolActivityIndicatorProps) {
  const [visibleActivities, setVisibleActivities] = useState<ToolActivity[]>([]);
  
  useEffect(() => {
    setVisibleActivities(activities.slice(0, 3));
  }, [activities]);

  if (visibleActivities.length === 0) return null;

  const activeActivity = visibleActivities.find(a => a.status === 'active');

  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      {/* Active Tool Banner */}
      {activeActivity && (
        <div className="mb-2 animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3 bg-card/90 backdrop-blur-md border border-primary/50 rounded-lg neon-border">
            <div className="relative">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <div className="absolute inset-0 w-5 h-5 bg-primary/20 rounded-full animate-ping" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-orbitron text-primary tracking-wider">
                {toolLabels[activeActivity.tool] || activeActivity.tool.toUpperCase()}
              </p>
              <div className="h-1 mt-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary data-stream rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Completions */}
      <div className="flex gap-2 flex-wrap">
        {visibleActivities
          .filter(a => a.status !== 'active')
          .slice(0, 3)
          .map((activity, i) => {
            const Icon = toolIcons[activity.tool] || Activity;
            return (
              <div
                key={`${activity.tool}-${activity.timestamp.getTime()}-${i}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono",
                  "animate-fade-in transition-all duration-300",
                  activity.status === 'success' 
                    ? "bg-success/20 text-success border border-success/30" 
                    : "bg-destructive/20 text-destructive border border-destructive/30"
                )}
              >
                {activity.status === 'success' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                <span>{toolLabels[activity.tool] || activity.tool}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
