import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  Activity,
  Server,
  CheckCircle,
  XCircle,
  FileWarning
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function CISOLayout({ 
  stats, 
  agents = [],
  domainItems,
  onDomainClick,
  enterpriseData 
}: PersonaLayoutProps) {
  const documents = domainItems.documents || [];
  const securityDocs = documents.slice(0, 3);
  
  const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Security Posture */}
        <Section title="Security Posture" icon={<Shield size={12} className="text-red-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Systems" 
              value={agents.length} 
              icon={<Server size={10} className="text-green-500" />}
              color="hsl(142 70% 45%)"
            />
            <MetricCard 
              label="Active" 
              value={activeAgents} 
              icon={<Activity size={10} className="text-blue-500" />}
              color="hsl(200 70% 50%)"
            />
            <MetricCard 
              label="Policies" 
              value={stats.knowledge} 
              icon={<Lock size={10} className="text-purple-500" />}
              color="hsl(280 70% 55%)"
            />
          </div>
        </Section>

        {/* Threat Status */}
        <Section title="Threat Status" icon={<Eye size={12} className="text-yellow-500" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle size={10} className="text-green-500" />
                <span className="text-[9px] font-mono text-green-500">STATUS</span>
              </div>
              <div className="text-sm font-mono text-foreground">Secure</div>
            </div>
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-1 mb-1">
                <XCircle size={10} className="text-green-500" />
                <span className="text-[9px] font-mono text-green-500">THREATS</span>
              </div>
              <div className="text-sm font-mono text-foreground">0 Active</div>
            </div>
          </div>
        </Section>

        {/* Risk Assessment */}
        <Section title="Risk Assessment" icon={<AlertTriangle size={12} className="text-orange-500" />}>
          {enterpriseData?.lastAnalysis?.risks && enterpriseData.lastAnalysis.risks.length > 0 ? (
            <div className="space-y-1">
              {enterpriseData.lastAnalysis.risks.slice(0, 3).map((risk: any, i: number) => (
                <div key={i} className="flex items-start gap-1 text-[10px] p-1 rounded bg-yellow-500/10">
                  <AlertTriangle size={8} className="text-yellow-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/80">{risk.risk?.slice(0, 45) || 'Risk identified'}...</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-2">
              <CheckCircle size={20} className="text-green-500 mx-auto mb-1" />
              <div className="text-[10px] text-muted-foreground">No critical risks detected</div>
            </div>
          )}
        </Section>

        {/* Compliance & Policies */}
        <Section title="Security Policies" icon={<FileWarning size={12} className="text-primary" />}>
          {securityDocs.length > 0 ? (
            <div className="space-y-1">
              {securityDocs.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onDomainClick('documents')}
                  className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="text-[10px] font-mono text-foreground truncate">
                    {item.title}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => onDomainClick('documents')}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Click to load security policies
            </button>
          )}
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">SECURITY</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">RISK</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
