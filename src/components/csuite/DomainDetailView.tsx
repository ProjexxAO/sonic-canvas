import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  ArrowLeft,
  Mail, 
  FileText, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  BookOpen,
  Loader2,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  DomainItem, 
  DomainKey,
  CommunicationItem,
  FinancialItem,
  TaskItem,
  EventItem
} from '@/hooks/useCSuiteData';

interface DomainDetailViewProps {
  domainKey: DomainKey;
  label: string;
  color: string;
  items: DomainItem[];
  isLoading: boolean;
  onBack: () => void;
  onItemClick: (item: DomainItem) => void;
}

const DOMAIN_ICONS: Record<DomainKey, typeof Mail> = {
  communications: Mail,
  documents: FileText,
  events: Calendar,
  financials: DollarSign,
  tasks: CheckSquare,
  knowledge: BookOpen,
};

export function DomainDetailView({
  domainKey,
  label,
  color,
  items,
  isLoading,
  onBack,
  onItemClick,
}: DomainDetailViewProps) {
  const Icon = DOMAIN_ICONS[domainKey];
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase().trim();
    return items.filter(item => 
      item.title.toLowerCase().includes(query) ||
      (item.preview && item.preview.toLowerCase().includes(query)) ||
      item.type.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

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

  const getStatusBadge = (item: DomainItem) => {
    if (domainKey === 'tasks') {
      const task = item as TaskItem;
      if (task.priority) {
        return (
          <Badge 
            variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
            className="text-[9px] px-1.5 py-0"
          >
            {task.priority}
          </Badge>
        );
      }
    }
    if (domainKey === 'financials') {
      const fin = item as FinancialItem;
      if (fin.status) {
        return (
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
            {fin.status}
          </Badge>
        );
      }
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col animate-slide-up-fade"
      style={{ 
        animationDuration: '0.35s',
        animationFillMode: 'both',
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onBack}
        >
          <ArrowLeft size={14} />
        </Button>
        <div 
          className="p-1.5 rounded"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={14} style={{ color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-mono text-foreground">{label}</h3>
          <p className="text-[10px] text-muted-foreground">
            {filteredItems.length === items.length 
              ? `${items.length} items` 
              : `${filteredItems.length} of ${items.length} items`}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      {items.length > 0 && (
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 pr-7 text-[11px] font-mono bg-background"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5"
                onClick={() => setSearchQuery('')}
              >
                <X size={10} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-primary" />
            <span className="ml-2 text-xs text-muted-foreground">Loading {label.toLowerCase()}...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Icon size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground">No {label.toLowerCase()} yet</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Connect a data source or upload files to get started
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search size={24} className="text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground">No results for "{searchQuery}"</p>
            <Button
              variant="link"
              size="sm"
              className="text-[10px] text-primary mt-1 h-auto p-0"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className="w-full p-3 rounded-lg bg-background border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(item)}
                    <span className="text-[9px] text-muted-foreground">
                      {getItemSubtitle(item)}
                    </span>
                  </div>
                </div>
                {item.preview && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {item.preview}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] text-muted-foreground/70">
                    {format(item.date, 'MMM d, yyyy')}
                  </span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0">
                    {item.type}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
