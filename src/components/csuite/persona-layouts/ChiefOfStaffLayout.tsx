import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase,
  Users,
  Calendar,
  FileText,
  Target,
  Clock,
  CheckCircle,
  ArrowRight,
  Layers
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function ChiefOfStaffLayout({ 
  stats, 
  agents = [],
  domainItems,
  onDomainClick,
  onItemClick 
}: PersonaLayoutProps) {
  const tasks = domainItems.tasks || [];
  const events = domainItems.events || [];
  const priorityTasks = tasks.slice(0, 3);
  const upcomingEvents = events.slice(0, 3);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Cross-Functional Overview */}
        <Section title="Cross-Functional View" icon={<Layers size={12} className="text-indigo-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Tasks" 
              value={stats.tasks} 
              icon={<CheckCircle size={10} className="text-green-500" />}
              color="hsl(142 70% 45%)"
            />
            <MetricCard 
              label="Events" 
              value={stats.events} 
              icon={<Calendar size={10} className="text-blue-500" />}
              color="hsl(200 70% 50%)"
            />
            <MetricCard 
              label="Agents" 
              value={agents.length} 
              icon={<Users size={10} className="text-purple-500" />}
              color="hsl(280 70% 55%)"
            />
          </div>
        </Section>

        {/* Executive Priorities */}
        <Section title="Executive Priorities" icon={<Target size={12} className="text-red-500" />}>
          {priorityTasks.length > 0 ? (
            <div className="space-y-1">
              {priorityTasks.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <ArrowRight size={8} className="text-primary" />
                      <span className="text-[10px] font-mono text-foreground truncate max-w-[70%]">
                        {item.title}
                      </span>
                    </div>
                    <Badge 
                      variant={item.priority === 'high' ? 'destructive' : 'secondary'} 
                      className="text-[7px] font-mono px-1"
                    >
                      {item.priority || 'medium'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => onDomainClick('tasks')}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Click to load priorities
            </button>
          )}
        </Section>

        {/* Organizational Alignment */}
        <Section title="Organizational Alignment" icon={<Users size={12} className="text-secondary" />}>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => onDomainClick('communications')}
              className="text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="text-[9px] font-mono text-muted-foreground mb-1">COMMS</div>
              <div className="text-sm font-mono text-foreground">{stats.communications}</div>
            </button>
            <button 
              onClick={() => onDomainClick('documents')}
              className="text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="text-[9px] font-mono text-muted-foreground mb-1">DOCS</div>
              <div className="text-sm font-mono text-foreground">{stats.documents}</div>
            </button>
          </div>
        </Section>

        {/* Upcoming Schedule */}
        <Section title="Upcoming Schedule" icon={<Clock size={12} className="text-yellow-500" />}>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-1">
              {upcomingEvents.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="text-[10px] font-mono text-foreground truncate">
                    {item.title}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {item.type || 'meeting'}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => onDomainClick('events')}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Click to load schedule
            </button>
          )}
        </Section>

        {/* Action Items */}
        <Section title="Action Items" icon={<FileText size={12} className="text-primary" />}>
          <div className="space-y-1">
            <button 
              onClick={() => onDomainClick('tasks')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Pending Actions</span>
                <span className="text-xs font-mono text-primary">{stats.tasks}</span>
              </div>
            </button>
          </div>
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">CROSS-FUNC</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">ALIGNMENT</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
