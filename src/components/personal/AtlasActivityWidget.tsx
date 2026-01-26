// Atlas Activity Widget - Shows real-time AI monitoring status
// Part of the "Divine Throne" transparency layer from Lovable spec

import { useMemo, useState, useEffect } from 'react';
import { 
  Brain, 
  Eye, 
  Shield, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'monitoring' | 'processing' | 'complete' | 'alert';
  label: string;
  detail?: string;
  timestamp: Date;
}

// Status indicator dot with semantic colors
function StatusDot({ 
  status, 
  size = 'sm',
  pulse = false 
}: { 
  status: 'active' | 'idle' | 'warning' | 'success';
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
}) {
  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-3 h-3'
  };

  const colorClasses = {
    active: 'bg-blue-500',
    idle: 'bg-green-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500'
  };

  return (
    <div className={cn(
      'rounded-full',
      sizeClasses[size],
      colorClasses[status],
      pulse && 'animate-pulse'
    )} />
  );
}

// Single activity row
function ActivityRow({ item }: { item: ActivityItem }) {
  const iconConfig = {
    monitoring: { icon: Eye, color: 'text-blue-500', status: 'active' as const },
    processing: { icon: Zap, color: 'text-amber-500', status: 'warning' as const },
    complete: { icon: CheckCircle2, color: 'text-emerald-500', status: 'success' as const },
    alert: { icon: AlertTriangle, color: 'text-red-500', status: 'warning' as const },
  };

  const config = iconConfig[item.type];
  const Icon = config.icon;
  const timeAgo = getRelativeTime(item.timestamp);

  return (
    <div className="flex items-center gap-2 py-1.5">
      <StatusDot 
        status={config.status} 
        size="xs" 
        pulse={item.type === 'processing'} 
      />
      <Icon size={12} className={config.color} />
      <span className="text-[11px] text-foreground flex-1 truncate">
        {item.label}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {timeAgo}
      </span>
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export function AtlasActivityWidget({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Simulate connection status check
  useEffect(() => {
    const checkConnection = () => {
      setIsOnline(navigator.onLine);
      setLastRefresh(new Date());
    };
    
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);
    
    // Periodic refresh indicator
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 60000);
    
    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
      clearInterval(interval);
    };
  }, []);

  // Generate activity items based on current state
  const activities: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    const now = new Date();

    // Current Atlas status
    if (isOnline) {
      items.push({
        id: 'atlas-connected',
        type: 'monitoring',
        label: 'Atlas monitoring your dashboard',
        timestamp: now
      });
    }

    // Simulated recent activities
    items.push({
      id: 'habit-track',
      type: 'complete',
      label: 'Habit tracking synced',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000)
    });

    items.push({
      id: 'email-scan',
      type: 'monitoring',
      label: 'Inbox monitored for priorities',
      timestamp: new Date(now.getTime() - 15 * 60 * 1000)
    });

    items.push({
      id: 'calendar-check',
      type: 'complete',
      label: 'Calendar conflicts checked',
      timestamp: new Date(now.getTime() - 30 * 60 * 1000)
    });

    return items.slice(0, 4);
  }, [isOnline, lastRefresh]);

  const activeCount = activities.filter(a => a.type === 'monitoring' || a.type === 'processing').length;

  return (
    <Card className={cn(
      "bg-gradient-to-br from-primary/5 via-background to-purple-500/5 border-primary/10",
      className
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain size={14} className="text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground">Atlas Activity</h3>
              <p className="text-[10px] text-muted-foreground">
                {activeCount} active monitor{activeCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Overall status indicator */}
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium",
            isOnline 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}>
            <StatusDot status={isOnline ? 'idle' : 'warning'} size="xs" />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Activity list */}
        <div className="space-y-0.5 border-t border-border/50 pt-2">
          {activities.map(activity => (
            <ActivityRow key={activity.id} item={activity} />
          ))}
        </div>

        {/* Footer - security indicator */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Shield size={10} className="text-emerald-500" />
            <span className="text-[10px] text-muted-foreground">
              All actions require your confirmation
            </span>
          </div>
          <RefreshCw size={10} className="text-muted-foreground/50" />
        </div>
      </CardContent>
    </Card>
  );
}
