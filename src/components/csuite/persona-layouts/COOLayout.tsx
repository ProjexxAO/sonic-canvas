import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Workflow,
  Target
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function COOLayout({ 
  stats, 
  agents = [],
  domainItems,
  onDomainClick,
  onItemClick 
}: PersonaLayoutProps) {
  const tasks = domainItems.tasks || [];
  const pendingTasks = tasks.filter((t: any) => t.status === 'pending').length;
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const recentTasks = tasks.slice(0, 4);

  const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Operations Overview */}
        <Section title="Operations Dashboard" icon={<Settings size={12} className="text-orange-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Tasks" 
              value={stats.tasks} 
              icon={<CheckCircle size={10} className="text-green-500" />}
              trend="up"
            />
            <MetricCard 
              label="Pending" 
              value={pendingTasks} 
              icon={<Clock size={10} className="text-yellow-500" />}
              color="hsl(45 80% 50%)"
            />
            <MetricCard 
              label="Completed" 
              value={completedTasks} 
              icon={<CheckCircle size={10} className="text-green-500" />}
              color="hsl(142 70% 45%)"
            />
          </div>
        </Section>

        {/* Efficiency Metrics */}
        <Section title="Efficiency Metrics" icon={<TrendingUp size={12} className="text-green-500" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-1 mb-1">
                <BarChart3 size={10} className="text-green-500" />
                <span className="text-[9px] font-mono text-green-500">AGENT UTIL</span>
              </div>
              <div className="text-sm font-mono text-foreground">
                {activeAgents}/{agents.length} Active
              </div>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-1 mb-1">
                <Target size={10} className="text-blue-500" />
                <span className="text-[9px] font-mono text-blue-500">PROCESSES</span>
              </div>
              <div className="text-sm font-mono text-foreground">Optimized</div>
            </div>
          </div>
        </Section>

        {/* Team Performance */}
        <Section title="Resource Allocation" icon={<Users size={12} className="text-secondary" />}>
          <div className="space-y-2">
            <button 
              onClick={() => onDomainClick('tasks')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Active Initiatives</span>
                <span className="text-xs font-mono text-primary">{stats.tasks}</span>
              </div>
            </button>
            <button 
              onClick={() => onDomainClick('events')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Scheduled Events</span>
                <span className="text-xs font-mono text-primary">{stats.events}</span>
              </div>
            </button>
          </div>
        </Section>

        {/* Recent Tasks */}
        <Section title="Priority Items" icon={<Workflow size={12} className="text-primary" />}>
          {recentTasks.length > 0 ? (
            <div className="space-y-1">
              {recentTasks.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-foreground truncate max-w-[70%]">
                      {item.title}
                    </span>
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
              Click to load operational tasks
            </button>
          )}
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">OPERATIONS</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">EFFICIENCY</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
