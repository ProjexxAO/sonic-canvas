import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Handshake,
  LineChart,
  Trophy,
  ArrowUpRight
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function CROLayout({ 
  stats, 
  domainItems,
  onDomainClick,
  onItemClick 
}: PersonaLayoutProps) {
  const financials = domainItems.financials || [];
  const communications = domainItems.communications || [];
  const recentDeals = financials.slice(0, 3);
  const recentOutreach = communications.slice(0, 3);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Revenue Overview */}
        <Section title="Revenue Dashboard" icon={<TrendingUp size={12} className="text-green-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Pipeline" 
              value={stats.financials} 
              icon={<DollarSign size={10} className="text-green-500" />}
              color="hsl(142 70% 45%)"
              trend="up"
            />
            <MetricCard 
              label="Outreach" 
              value={stats.communications} 
              icon={<Users size={10} className="text-blue-500" />}
              color="hsl(200 70% 50%)"
            />
            <MetricCard 
              label="Meetings" 
              value={stats.events} 
              icon={<Handshake size={10} className="text-yellow-500" />}
              color="hsl(45 80% 50%)"
            />
          </div>
        </Section>

        {/* Sales Performance */}
        <Section title="Sales Performance" icon={<LineChart size={12} className="text-blue-500" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-1 mb-1">
                <ArrowUpRight size={10} className="text-green-500" />
                <span className="text-[9px] font-mono text-green-500">GROWTH</span>
              </div>
              <div className="text-sm font-mono text-foreground">On Track</div>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-1 mb-1">
                <Target size={10} className="text-blue-500" />
                <span className="text-[9px] font-mono text-blue-500">QUOTA</span>
              </div>
              <div className="text-sm font-mono text-foreground">85%</div>
            </div>
          </div>
        </Section>

        {/* Pipeline */}
        <Section title="Pipeline Activity" icon={<BarChart3 size={12} className="text-primary" />}>
          {recentDeals.length > 0 ? (
            <div className="space-y-1">
              {recentDeals.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-foreground truncate max-w-[65%]">
                      {item.title}
                    </span>
                    {item.amount && (
                      <span className="text-[10px] font-mono text-green-500">
                        ${item.amount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => onDomainClick('financials')}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Click to load pipeline data
            </button>
          )}
        </Section>

        {/* Customer Success */}
        <Section title="Customer Success" icon={<Trophy size={12} className="text-yellow-500" />}>
          <div className="space-y-2">
            <button 
              onClick={() => onDomainClick('communications')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Client Communications</span>
                <span className="text-xs font-mono text-primary">{stats.communications}</span>
              </div>
            </button>
            <button 
              onClick={() => onDomainClick('tasks')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Follow-up Tasks</span>
                <span className="text-xs font-mono text-primary">{stats.tasks}</span>
              </div>
            </button>
          </div>
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">REVENUE</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">PIPELINE</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
