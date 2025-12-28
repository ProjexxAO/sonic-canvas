import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Heart,
  TrendingUp,
  UserPlus,
  Award,
  Calendar,
  BarChart3,
  Smile,
  Target
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function CHROLayout({ 
  stats, 
  agents = [],
  domainItems,
  onDomainClick,
  onItemClick 
}: PersonaLayoutProps) {
  const events = domainItems.events || [];
  const upcomingEvents = events.slice(0, 4);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Workforce Overview */}
        <Section title="Workforce Analytics" icon={<Users size={12} className="text-indigo-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Team Size" 
              value={agents.length} 
              icon={<Users size={10} className="text-indigo-500" />}
              color="hsl(240 70% 55%)"
            />
            <MetricCard 
              label="Events" 
              value={stats.events} 
              icon={<Calendar size={10} className="text-green-500" />}
              color="hsl(142 70% 45%)"
            />
            <MetricCard 
              label="Comms" 
              value={stats.communications} 
              icon={<Heart size={10} className="text-pink-500" />}
              color="hsl(330 70% 50%)"
            />
          </div>
        </Section>

        {/* Culture & Engagement */}
        <Section title="Culture & Engagement" icon={<Heart size={12} className="text-pink-500" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-1 mb-1">
                <Smile size={10} className="text-green-500" />
                <span className="text-[9px] font-mono text-green-500">MORALE</span>
              </div>
              <div className="text-sm font-mono text-foreground">Healthy</div>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={10} className="text-blue-500" />
                <span className="text-[9px] font-mono text-blue-500">RETENTION</span>
              </div>
              <div className="text-sm font-mono text-foreground">Stable</div>
            </div>
          </div>
        </Section>

        {/* Talent Management */}
        <Section title="Talent Pipeline" icon={<UserPlus size={12} className="text-secondary" />}>
          <div className="space-y-2">
            <button 
              onClick={() => onDomainClick('tasks')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">HR Initiatives</span>
                <span className="text-xs font-mono text-primary">{stats.tasks}</span>
              </div>
            </button>
            <button 
              onClick={() => onDomainClick('knowledge')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Training Resources</span>
                <span className="text-xs font-mono text-primary">{stats.knowledge}</span>
              </div>
            </button>
          </div>
        </Section>

        {/* Upcoming HR Events */}
        <Section title="Upcoming Events" icon={<Calendar size={12} className="text-primary" />}>
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
                    {item.type || 'event'}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => onDomainClick('events')}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Click to load HR events
            </button>
          )}
        </Section>

        {/* Performance & Recognition */}
        <Section title="Recognition" icon={<Award size={12} className="text-yellow-500" />}>
          <div className="text-center p-2">
            <Award size={24} className="text-yellow-500 mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground">
              Track employee achievements and milestones
            </div>
          </div>
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">WORKFORCE</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">CULTURE</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
