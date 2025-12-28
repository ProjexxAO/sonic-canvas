import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';
import { Shield, Users, Activity, Server, AlertTriangle, Database, Cpu, Lock, BarChart3, Zap, Mail, FileText, Calendar, DollarSign, CheckSquare, BookOpen } from 'lucide-react';
import { DomainKey } from '@/hooks/useCSuiteData';

const DOMAIN_CONFIG: { key: DomainKey; label: string; icon: typeof Mail; color: string }[] = [
  { key: 'communications', label: 'Communications', icon: Mail, color: 'hsl(200 70% 50%)' },
  { key: 'documents', label: 'Documents', icon: FileText, color: 'hsl(280 70% 50%)' },
  { key: 'events', label: 'Events', icon: Calendar, color: 'hsl(150 70% 45%)' },
  { key: 'financials', label: 'Financials', icon: DollarSign, color: 'hsl(45 80% 50%)' },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)' },
  { key: 'knowledge', label: 'Knowledge', icon: BookOpen, color: 'hsl(220 70% 55%)' },
];

export function AdminLayout({ stats, domainItems, agents, onDomainClick }: PersonaLayoutProps) {
  const activeAgents = agents?.filter(a => a.status === 'ACTIVE').length || 0;
  const totalAgents = agents?.length || 0;
  const processingAgents = agents?.filter(a => a.status === 'PROCESSING').length || 0;
  const errorAgents = agents?.filter(a => a.status === 'ERROR').length || 0;
  
  const totalDataItems = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3 p-2">
      {/* System Health Overview */}
      <Section title="System Health" icon={<Server size={12} className="text-primary" />}>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Total Agents"
            value={totalAgents}
            icon={<Cpu size={10} className="text-primary" />}
            trend={activeAgents > 0 ? 'up' : 'neutral'}
          />
          <MetricCard
            label="Active Agents"
            value={activeAgents}
            icon={<Activity size={10} style={{ color: 'hsl(142 70% 45%)' }} />}
            color="hsl(142 70% 45%)"
          />
          <MetricCard
            label="Processing"
            value={processingAgents}
            icon={<Zap size={10} style={{ color: 'hsl(45 80% 50%)' }} />}
            color="hsl(45 80% 50%)"
          />
          <MetricCard
            label="Errors"
            value={errorAgents}
            icon={<AlertTriangle size={10} style={{ color: errorAgents > 0 ? 'hsl(0 70% 50%)' : undefined }} />}
            color={errorAgents > 0 ? "hsl(0 70% 50%)" : undefined}
            trend={errorAgents > 0 ? 'down' : 'neutral'}
          />
        </div>
      </Section>

      {/* Data Overview */}
      <Section title="Platform Data" icon={<Database size={12} className="text-secondary" />}>
        <div className="grid grid-cols-2 gap-2">
          {DOMAIN_CONFIG.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => onDomainClick(key)}
              className="p-2 rounded bg-muted/30 border border-border hover:border-primary/40 transition-all text-left group"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={10} style={{ color }} />
                <span className="text-[9px] font-mono text-muted-foreground">{label}</span>
              </div>
              <span className="text-sm font-mono text-foreground group-hover:text-primary">{stats[key]}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 p-2 rounded bg-muted/30 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground">TOTAL DATA ITEMS</span>
            <span className="text-sm font-mono text-primary">{totalDataItems}</span>
          </div>
        </div>
      </Section>

      {/* Security & Access */}
      <Section title="Security Monitoring" icon={<Shield size={12} className="text-green-500" />}>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Access Control"
            value="Active"
            icon={<Lock size={10} className="text-green-500" />}
            color="hsl(142 70% 45%)"
          />
          <MetricCard
            label="RLS Policies"
            value="Enabled"
            icon={<Shield size={10} className="text-green-500" />}
            color="hsl(142 70% 45%)"
          />
        </div>
      </Section>

      {/* Agent Fleet */}
      <Section title="Agent Fleet Status" icon={<Users size={12} className="text-primary" />}>
        <div className="space-y-1">
          {agents?.slice(0, 5).map((agent: any) => (
            <div key={agent.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: agent.status === 'ACTIVE' ? 'hsl(142 70% 45%)' : 
                                    agent.status === 'PROCESSING' ? 'hsl(45 80% 50%)' :
                                    agent.status === 'ERROR' ? 'hsl(0 70% 50%)' : 'hsl(var(--muted-foreground))'
                  }}
                />
                <span className="text-[10px] font-mono text-foreground">{agent.name}</span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground uppercase">{agent.status}</span>
            </div>
          ))}
          {(!agents || agents.length === 0) && (
            <div className="text-[10px] text-muted-foreground text-center py-2">
              No agents assigned
            </div>
          )}
        </div>
      </Section>

      {/* Analytics */}
      <Section title="Platform Analytics" icon={<BarChart3 size={12} className="text-primary" />}>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-muted/30 border border-border text-center">
            <div className="text-lg font-mono text-primary">{Math.round((activeAgents / Math.max(totalAgents, 1)) * 100)}%</div>
            <div className="text-[9px] text-muted-foreground">Agent Uptime</div>
          </div>
          <div className="p-2 rounded bg-muted/30 border border-border text-center">
            <div className="text-lg font-mono text-secondary">{totalDataItems}</div>
            <div className="text-[9px] text-muted-foreground">Data Volume</div>
          </div>
        </div>
      </Section>
    </div>
  );
}
