import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Megaphone,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Share2,
  Heart,
  Eye,
  Mail
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function CMOLayout({ 
  stats, 
  domainItems,
  onDomainClick,
  onItemClick 
}: PersonaLayoutProps) {
  const communications = domainItems.communications || [];
  const recentComms = communications.slice(0, 4);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Marketing Performance Dashboard */}
        <Section title="Marketing Overview" icon={<Megaphone size={12} className="text-pink-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Campaigns" 
              value={stats.communications} 
              icon={<Mail size={10} className="text-pink-500" />}
              color="hsl(330 70% 50%)"
            />
            <MetricCard 
              label="Content" 
              value={stats.documents} 
              icon={<Eye size={10} className="text-purple-500" />}
              color="hsl(280 70% 50%)"
            />
            <MetricCard 
              label="Events" 
              value={stats.events} 
              icon={<Target size={10} className="text-blue-500" />}
              color="hsl(200 70% 50%)"
            />
          </div>
        </Section>

        {/* Brand & Engagement */}
        <Section title="Brand Health" icon={<Heart size={12} className="text-red-500" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={10} className="text-green-500" />
                <span className="text-[9px] font-mono text-green-500">ENGAGEMENT</span>
              </div>
              <div className="text-sm font-mono text-foreground">Growing</div>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-1 mb-1">
                <Share2 size={10} className="text-blue-500" />
                <span className="text-[9px] font-mono text-blue-500">REACH</span>
              </div>
              <div className="text-sm font-mono text-foreground">Expanding</div>
            </div>
          </div>
        </Section>

        {/* Customer Insights */}
        <Section title="Customer Insights" icon={<Users size={12} className="text-secondary" />}>
          <div className="space-y-2">
            <button 
              onClick={() => onDomainClick('communications')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Customer Communications</span>
                <span className="text-xs font-mono text-primary">{stats.communications}</span>
              </div>
            </button>
            <button 
              onClick={() => onDomainClick('knowledge')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Market Research</span>
                <span className="text-xs font-mono text-primary">{stats.knowledge}</span>
              </div>
            </button>
          </div>
        </Section>

        {/* Recent Communications */}
        <Section title="Recent Campaigns" icon={<BarChart3 size={12} className="text-primary" />}>
          {recentComms.length > 0 ? (
            <div className="space-y-1">
              {recentComms.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="text-[10px] font-mono text-foreground truncate">
                    {item.subject || item.title}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {item.type || 'communication'}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => onDomainClick('communications')}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Click to load campaign data
            </button>
          )}
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">BRAND MANAGEMENT</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">CAMPAIGNS</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
