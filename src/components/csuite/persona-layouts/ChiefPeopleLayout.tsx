import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Users,
  Heart,
  Smile,
  TrendingUp,
  Award,
  Calendar,
  MessageSquare,
  Target,
  Sparkles
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function ChiefPeopleLayout({ 
  stats, 
  agents = [],
  domainItems,
  onDomainClick,
  onItemClick 
}: PersonaLayoutProps) {
  const events = domainItems.events || [];
  const communications = domainItems.communications || [];
  const teamEvents = events.slice(0, 3);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* People Overview */}
        <Section title="People Overview" icon={<Users size={12} className="text-teal-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Team" 
              value={agents.length} 
              icon={<Users size={10} className="text-teal-500" />}
              color="hsl(170 70% 45%)"
            />
            <MetricCard 
              label="Events" 
              value={stats.events} 
              icon={<Calendar size={10} className="text-pink-500" />}
              color="hsl(330 70% 50%)"
            />
            <MetricCard 
              label="Comms" 
              value={stats.communications} 
              icon={<MessageSquare size={10} className="text-blue-500" />}
              color="hsl(200 70% 50%)"
            />
          </div>
        </Section>

        {/* Engagement & Wellbeing */}
        <Section title="Engagement & Wellbeing" icon={<Heart size={12} className="text-red-500" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-1 mb-1">
                <Smile size={10} className="text-green-500" />
                <span className="text-[9px] font-mono text-green-500">ENGAGEMENT</span>
              </div>
              <div className="text-sm font-mono text-foreground">High</div>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-1 mb-1">
                <Heart size={10} className="text-blue-500" />
                <span className="text-[9px] font-mono text-blue-500">WELLBEING</span>
              </div>
              <div className="text-sm font-mono text-foreground">Positive</div>
            </div>
          </div>
        </Section>

        {/* Talent Development */}
        <Section title="Talent Development" icon={<TrendingUp size={12} className="text-purple-500" />}>
          <div className="space-y-2">
            <button 
              onClick={() => onDomainClick('knowledge')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Learning Resources</span>
                <span className="text-xs font-mono text-primary">{stats.knowledge}</span>
              </div>
            </button>
            <button 
              onClick={() => onDomainClick('tasks')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Development Goals</span>
                <span className="text-xs font-mono text-primary">{stats.tasks}</span>
              </div>
            </button>
          </div>
        </Section>

        {/* Team Events */}
        <Section title="Team Events" icon={<Calendar size={12} className="text-primary" />}>
          {teamEvents.length > 0 ? (
            <div className="space-y-1">
              {teamEvents.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="text-[10px] font-mono text-foreground truncate">
                    {item.title}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {item.type || 'team event'}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => onDomainClick('events')}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Click to load team events
            </button>
          )}
        </Section>

        {/* Culture & Recognition */}
        <Section title="Culture Initiatives" icon={<Sparkles size={12} className="text-yellow-500" />}>
          <div className="text-center p-2">
            <Award size={24} className="text-yellow-500 mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground">
              Foster culture and celebrate achievements
            </div>
          </div>
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">PEOPLE</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">CULTURE</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
