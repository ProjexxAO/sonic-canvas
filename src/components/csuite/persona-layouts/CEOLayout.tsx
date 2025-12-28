import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Briefcase,
  BarChart3,
  DollarSign,
  Activity
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function CEOLayout({ 
  stats, 
  agents = [], 
  enterpriseData,
  onDomainClick 
}: PersonaLayoutProps) {
  const totalItems = Object.values(stats).reduce((a, b) => a + b, 0);
  const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Strategic Overview */}
        <Section title="Strategic Overview" icon={<Globe size={12} className="text-primary" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Data Points" 
              value={totalItems} 
              icon={<BarChart3 size={10} className="text-primary" />}
              trend="up"
            />
            <MetricCard 
              label="Active Agents" 
              value={activeAgents} 
              icon={<Activity size={10} className="text-green-500" />}
              color="hsl(142 70% 45%)"
            />
            <MetricCard 
              label="Team Size" 
              value={agents.length} 
              icon={<Users size={10} className="text-secondary" />}
              color="hsl(var(--secondary))"
            />
          </div>
        </Section>

        {/* Key Performance Indicators */}
        <Section title="Key Metrics" icon={<Target size={12} className="text-primary" />}>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => onDomainClick('financials')}
              className="text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign size={10} className="text-yellow-500" />
                <span className="text-[9px] font-mono text-muted-foreground">FINANCIALS</span>
              </div>
              <div className="text-lg font-mono text-yellow-500">{stats.financials}</div>
            </button>
            <button 
              onClick={() => onDomainClick('tasks')}
              className="text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Briefcase size={10} className="text-blue-500" />
                <span className="text-[9px] font-mono text-muted-foreground">INITIATIVES</span>
              </div>
              <div className="text-lg font-mono text-blue-500">{stats.tasks}</div>
            </button>
          </div>
        </Section>

        {/* Cross-Department Summary */}
        <Section title="Department Overview" icon={<Users size={12} className="text-secondary" />}>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Communications</span>
              <span className="font-mono text-foreground">{stats.communications}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Documents</span>
              <span className="font-mono text-foreground">{stats.documents}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Events</span>
              <span className="font-mono text-foreground">{stats.events}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Knowledge Base</span>
              <span className="font-mono text-foreground">{stats.knowledge}</span>
            </div>
          </div>
        </Section>

        {/* Risk & Opportunities */}
        {enterpriseData?.lastAnalysis && (
          <Section title="Risks & Opportunities" icon={<AlertTriangle size={12} className="text-yellow-500" />}>
            <div className="space-y-1">
              {enterpriseData.lastAnalysis.risks?.slice(0, 2).map((risk: any, i: number) => (
                <div key={i} className="flex items-start gap-1 text-[10px]">
                  <AlertTriangle size={8} className="text-yellow-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/80">{risk.risk?.slice(0, 50) || 'Risk identified'}...</span>
                </div>
              ))}
              {enterpriseData.lastAnalysis.opportunities?.slice(0, 2).map((opp: any, i: number) => (
                <div key={i} className="flex items-start gap-1 text-[10px]">
                  <TrendingUp size={8} className="text-green-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/80">{opp.slice(0, 50)}...</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Market Position Badge */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">STRATEGIC FOCUS</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">LEADERSHIP VIEW</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
