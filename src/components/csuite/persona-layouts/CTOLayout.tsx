import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu,
  Code,
  Database,
  Shield,
  Zap,
  GitBranch,
  Server,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function CTOLayout({ 
  stats, 
  agents = [],
  domainItems,
  onDomainClick,
  enterpriseData 
}: PersonaLayoutProps) {
  const documents = domainItems.documents || [];
  const techDocs = documents.filter((d: any) => 
    d.type?.includes('technical') || d.title?.toLowerCase().includes('tech')
  ).slice(0, 3);
  
  const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;
  const processingAgents = agents.filter(a => a.status === 'PROCESSING').length;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Technology Overview */}
        <Section title="Tech Stack Status" icon={<Cpu size={12} className="text-cyan-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Active Agents" 
              value={activeAgents} 
              icon={<Activity size={10} className="text-green-500" />}
              color="hsl(142 70% 45%)"
            />
            <MetricCard 
              label="Processing" 
              value={processingAgents} 
              icon={<Zap size={10} className="text-yellow-500" />}
              color="hsl(45 80% 50%)"
            />
            <MetricCard 
              label="Total Agents" 
              value={agents.length} 
              icon={<Server size={10} className="text-cyan-500" />}
              color="hsl(180 70% 45%)"
            />
          </div>
        </Section>

        {/* Infrastructure Status */}
        <Section title="Infrastructure" icon={<Server size={12} className="text-blue-500" />}>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2">
                <Database size={10} className="text-green-500" />
                <span className="text-[10px] font-mono">Data Systems</span>
              </div>
              <Badge variant="outline" className="text-[8px] font-mono text-green-500 border-green-500/50">
                OPERATIONAL
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2">
                <Shield size={10} className="text-green-500" />
                <span className="text-[10px] font-mono">Security</span>
              </div>
              <Badge variant="outline" className="text-[8px] font-mono text-green-500 border-green-500/50">
                SECURED
              </Badge>
            </div>
          </div>
        </Section>

        {/* Development Velocity */}
        <Section title="Development" icon={<Code size={12} className="text-purple-500" />}>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => onDomainClick('documents')}
              className="text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1 mb-1">
                <GitBranch size={10} className="text-purple-500" />
                <span className="text-[9px] font-mono text-muted-foreground">TECH DOCS</span>
              </div>
              <div className="text-sm font-mono text-purple-500">{stats.documents}</div>
            </button>
            <button 
              onClick={() => onDomainClick('tasks')}
              className="text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1 mb-1">
                <Zap size={10} className="text-yellow-500" />
                <span className="text-[9px] font-mono text-muted-foreground">TECH TASKS</span>
              </div>
              <div className="text-sm font-mono text-yellow-500">{stats.tasks}</div>
            </button>
          </div>
        </Section>

        {/* Technical Debt / Issues */}
        {enterpriseData?.lastAnalysis?.risks && (
          <Section title="Technical Concerns" icon={<AlertTriangle size={12} className="text-yellow-500" />}>
            <div className="space-y-1">
              {enterpriseData.lastAnalysis.risks.slice(0, 2).map((risk: any, i: number) => (
                <div key={i} className="flex items-start gap-1 text-[10px]">
                  <AlertTriangle size={8} className="text-yellow-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/80">{risk.risk?.slice(0, 40) || 'Issue identified'}...</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">TECH STRATEGY</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">INNOVATION</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
