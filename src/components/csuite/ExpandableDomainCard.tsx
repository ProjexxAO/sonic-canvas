import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DomainItem, 
  DomainKey,
  CommunicationItem,
  FinancialItem,
  TaskItem,
  EventItem
} from '@/hooks/useCSuiteData';

interface ExpandableDomainCardProps {
  domainKey: DomainKey;
  label: string;
  icon: React.ElementType;
  color: string;
  count: number;
  items: DomainItem[];
  isLoading: boolean;
  onExpand: () => void;
  onItemClick: (item: DomainItem) => void;
}

export function ExpandableDomainCard({
  domainKey,
  label,
  icon: Icon,
  color,
  count,
  items,
  isLoading,
  onExpand,
  onItemClick,
}: ExpandableDomainCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded && items.length === 0) {
      onExpand();
    }
  };

  const getItemSubtitle = (item: DomainItem): string => {
    switch (domainKey) {
      case 'communications': {
        const comm = item as CommunicationItem;
        return comm.from_address || format(item.date, 'MMM d');
      }
      case 'events': {
        const event = item as EventItem;
        return event.start_at ? format(event.start_at, 'MMM d, h:mm a') : format(item.date, 'MMM d');
      }
      case 'financials': {
        const fin = item as FinancialItem;
        return fin.amount ? `${fin.currency || 'USD'} ${fin.amount.toLocaleString()}` : format(item.date, 'MMM d');
      }
      case 'tasks': {
        const task = item as TaskItem;
        return task.status || format(item.date, 'MMM d');
      }
      default:
        return format(item.date, 'MMM d');
    }
  };

  const getStatusColor = (item: DomainItem): string | undefined => {
    if (domainKey === 'tasks') {
      const task = item as TaskItem;
      switch (task.priority) {
        case 'high': return 'hsl(350 70% 50%)';
        case 'medium': return 'hsl(45 80% 50%)';
        case 'low': return 'hsl(150 70% 45%)';
        default: return undefined;
      }
    }
    return undefined;
  };

  return (
    <div className="rounded bg-background border border-border overflow-hidden transition-all">
      {/* Header - Always visible */}
      <button
        onClick={handleToggle}
        className={cn(
          "w-full p-2 flex items-center justify-between hover:bg-muted/50 transition-colors",
          isExpanded && "border-b border-border"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon size={12} style={{ color }} />
          <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-foreground">{count}</span>
          {isExpanded ? (
            <ChevronUp size={12} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={12} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-out",
          isExpanded ? "max-h-[280px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {isLoading ? (
          <div className="p-4 flex items-center justify-center">
            <Loader2 size={16} className="animate-spin text-primary" />
            <span className="ml-2 text-[10px] text-muted-foreground">Loading...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-[10px] text-muted-foreground">No items yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[250px]">
            <div className="p-1 space-y-0.5">
              {items.map((item) => {
                const statusColor = getStatusColor(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className="w-full p-2 rounded hover:bg-muted/50 transition-colors text-left group"
                  >
                    <div className="flex items-start gap-2">
                      {statusColor && (
                        <div 
                          className="w-1 h-full min-h-[24px] rounded-full flex-shrink-0"
                          style={{ backgroundColor: statusColor }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[9px] text-muted-foreground flex-shrink-0">
                            {getItemSubtitle(item)}
                          </span>
                        </div>
                        {item.preview && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {item.preview}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
