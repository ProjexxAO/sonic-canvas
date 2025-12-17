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
  XCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionLog {
  id: string;
  timestamp: Date;
  action: string;
  params: Record<string, unknown>;
  result: string;
  status: 'success' | 'error' | 'pending';
}

interface ActionLogItemProps {
  log: ActionLog;
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

export function ActionLogItem({ log }: ActionLogItemProps) {
  const Icon = toolIcons[log.action] || Activity;
  
  return (
    <div 
      className={cn(
        "group p-2 rounded-lg transition-all duration-200",
        "border border-transparent hover:border-border/50",
        log.status === 'pending' && "animate-pulse"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Status Icon */}
        <div className={cn(
          "p-1.5 rounded-md flex-shrink-0",
          log.status === 'success' && "bg-success/10 text-success",
          log.status === 'error' && "bg-destructive/10 text-destructive",
          log.status === 'pending' && "bg-secondary/10 text-secondary"
        )}>
          {log.status === 'pending' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : log.status === 'success' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Icon className={cn(
                "w-3 h-3",
                log.status === 'success' && "text-primary",
                log.status === 'error' && "text-destructive",
                log.status === 'pending' && "text-secondary"
              )} />
              <span className="text-[11px] font-mono text-foreground font-medium">
                {log.action}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          
          {/* Result */}
          <p className={cn(
            "text-[10px] mt-0.5 truncate",
            log.status === 'success' && "text-muted-foreground",
            log.status === 'error' && "text-destructive/80",
            log.status === 'pending' && "text-secondary/80"
          )}>
            <ChevronRight className="w-2.5 h-2.5 inline mr-0.5" />
            {log.result}
          </p>
          
          {/* Params (on hover) */}
          {Object.keys(log.params).length > 0 && (
            <div className="hidden group-hover:block mt-1 text-[9px] text-muted-foreground/60 font-mono">
              {JSON.stringify(log.params).slice(0, 60)}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
