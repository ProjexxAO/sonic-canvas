import { 
  Mail, 
  FileText, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  BookOpen,
  ArrowLeft,
  Search,
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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
import { EventsCalendarView } from './EventsCalendarView';
import { TasksKanbanView } from './TasksKanbanView';

interface FullScreenDomainViewProps {
  domainKey: DomainKey;
  items: DomainItem[];
  isLoading: boolean;
  onBack: () => void;
  onItemClick: (item: DomainItem) => void;
  onRefresh?: () => void;
}

const DOMAIN_CONFIG: Record<DomainKey, { label: string; icon: typeof Mail; color: string }> = {
  communications: { label: 'Communications', icon: Mail, color: 'hsl(200 70% 50%)' },
  documents: { label: 'Documents', icon: FileText, color: 'hsl(280 70% 50%)' },
  events: { label: 'Events', icon: Calendar, color: 'hsl(150 70% 45%)' },
  financials: { label: 'Financials', icon: DollarSign, color: 'hsl(45 80% 50%)' },
  tasks: { label: 'Tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)' },
  knowledge: { label: 'Knowledge', icon: BookOpen, color: 'hsl(220 70% 55%)' },
};

export function FullScreenDomainView({
  domainKey,
  items,
  isLoading,
  onBack,
  onItemClick,
  onRefresh,
}: FullScreenDomainViewProps) {
  // Use specialized view for Events
  if (domainKey === 'events') {
    return (
      <EventsCalendarView
        items={items as EventItem[]}
        isLoading={isLoading}
        onBack={onBack}
        onItemClick={(item) => onItemClick(item)}
        onRefresh={onRefresh}
      />
    );
  }

  // Use specialized view for Tasks
  if (domainKey === 'tasks') {
    return (
      <TasksKanbanView
        items={items as TaskItem[]}
        isLoading={isLoading}
        onBack={onBack}
        onItemClick={(item) => onItemClick(item)}
        onRefresh={onRefresh}
      />
    );
  }

  // Generic full-screen view for other domains
  return (
    <GenericDomainFullScreen
      domainKey={domainKey}
      items={items}
      isLoading={isLoading}
      onBack={onBack}
      onItemClick={onItemClick}
    />
  );
}

function GenericDomainFullScreen({
  domainKey,
  items,
  isLoading,
  onBack,
  onItemClick,
}: FullScreenDomainViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const config = DOMAIN_CONFIG[domainKey];
  const Icon = config.icon;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      (item.preview && item.preview.toLowerCase().includes(query)) ||
      item.type.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const getItemDetails = (item: DomainItem) => {
    switch (domainKey) {
      case 'communications': {
        const comm = item as CommunicationItem;
        return {
          subtitle: comm.from_address || '',
          badge: comm.type,
          extra: comm.to_addresses?.join(', '),
        };
      }
      case 'financials': {
        const fin = item as FinancialItem;
        return {
          subtitle: fin.amount ? `${fin.currency || 'USD'} ${fin.amount.toLocaleString()}` : '',
          badge: fin.status || fin.type,
          extra: fin.category,
        };
      }
      case 'tasks': {
        const task = item as TaskItem;
        return {
          subtitle: task.assigned_to || '',
          badge: task.status,
          priority: task.priority,
          extra: task.due_date ? format(task.due_date, 'MMM d') : undefined,
        };
      }
      case 'documents': {
        return {
          subtitle: item.type,
          badge: item.type,
          extra: undefined,
        };
      }
      case 'knowledge': {
        return {
          subtitle: item.type,
          badge: item.type,
          extra: undefined,
        };
      }
      default:
        return { subtitle: '', badge: item.type, extra: undefined };
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
        </Button>
        <div 
          className="p-2 rounded"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <Icon size={16} style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
          <p className="text-[10px] text-muted-foreground">
            {filteredItems.length} of {items.length} items
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('list')}
          >
            <List size={14} />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={14} />
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-3 py-2 border-b border-border bg-card/50 flex gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search ${config.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs font-mono bg-background"
          />
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Filter size={12} className="mr-1" />
          Filters
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Icon size={48} className="text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `No ${config.label.toLowerCase()} matching "${searchQuery}"` : `No ${config.label.toLowerCase()} found`}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-3 grid grid-cols-2 gap-2">
            {filteredItems.map(item => {
              const details = getItemDetails(item);
              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="p-3 rounded-lg bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Icon size={14} style={{ color: config.color }} className="mt-0.5" />
                    <span className="text-xs font-medium text-foreground line-clamp-2 flex-1">{item.title}</span>
                  </div>
                  {item.preview && (
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{item.preview}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">{format(item.date, 'MMM d')}</span>
                    <Badge variant="outline" className="text-[8px]">{details.badge}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredItems.map(item => {
              const details = getItemDetails(item);
              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full p-3 rounded-lg bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded"
                      style={{ backgroundColor: `${config.color}15` }}
                    >
                      <Icon size={14} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-foreground line-clamp-1">{item.title}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {domainKey === 'tasks' && details.priority && (
                            <span className={`text-[9px] font-mono ${getPriorityColor(details.priority)}`}>
                              {details.priority?.toUpperCase()}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-[8px]">{details.badge}</Badge>
                        </div>
                      </div>
                      {details.subtitle && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{details.subtitle}</p>
                      )}
                      {item.preview && (
                        <p className="text-[10px] text-muted-foreground/70 line-clamp-2 mt-1">{item.preview}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] text-muted-foreground">{format(item.date, 'MMM d, yyyy')}</span>
                        {details.extra && (
                          <span className="text-[9px] text-muted-foreground truncate">{details.extra}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
