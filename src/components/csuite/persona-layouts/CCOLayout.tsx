import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare,
  Shield,
  AlertTriangle,
  FileCheck,
  Scale,
  Book,
  Clock,
  CheckCircle,
  ListChecks
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function CCOLayout({ 
  stats, 
  domainItems,
  onDomainClick,
  onItemClick 
}: PersonaLayoutProps) {
  const documents = domainItems.documents || [];
  const tasks = domainItems.tasks || [];
  const complianceTasks = tasks.slice(0, 4);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Compliance Overview */}
        <Section title="Compliance Dashboard" icon={<CheckSquare size={12} className="text-green-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Policies" 
              value={stats.documents} 
              icon={<FileCheck size={10} className="text-green-500" />}
              color="hsl(142 70% 45%)"
            />
            <MetricCard 
              label="Reviews" 
              value={stats.tasks} 
              icon={<ListChecks size={10} className="text-blue-500" />}
              color="hsl(200 70% 50%)"
            />
            <MetricCard 
              label="Knowledge" 
              value={stats.knowledge} 
              icon={<Book size={10} className="text-purple-500" />}
              color="hsl(280 70% 55%)"
            />
          </div>
        </Section>

        {/* Regulatory Status */}
        <Section title="Regulatory Status" icon={<Scale size={12} className="text-blue-500" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle size={10} className="text-green-500" />
                <span className="text-[9px] font-mono text-green-500">COMPLIANT</span>
              </div>
              <div className="text-sm font-mono text-foreground">All Areas</div>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-1 mb-1">
                <Clock size={10} className="text-blue-500" />
                <span className="text-[9px] font-mono text-blue-500">NEXT AUDIT</span>
              </div>
              <div className="text-sm font-mono text-foreground">Scheduled</div>
            </div>
          </div>
        </Section>

        {/* Ethics & Governance */}
        <Section title="Ethics & Governance" icon={<Shield size={12} className="text-purple-500" />}>
          <div className="space-y-2">
            <button 
              onClick={() => onDomainClick('knowledge')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Policy Documents</span>
                <span className="text-xs font-mono text-primary">{stats.knowledge}</span>
              </div>
            </button>
            <button 
              onClick={() => onDomainClick('documents')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Compliance Records</span>
                <span className="text-xs font-mono text-primary">{stats.documents}</span>
              </div>
            </button>
          </div>
        </Section>

        {/* Compliance Tasks */}
        <Section title="Compliance Tasks" icon={<ListChecks size={12} className="text-primary" />}>
          {complianceTasks.length > 0 ? (
            <div className="space-y-1">
              {complianceTasks.map((item: any) => (
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
                      variant={item.status === 'completed' ? 'default' : 'secondary'} 
                      className="text-[7px] font-mono px-1"
                    >
                      {item.status || 'pending'}
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
              Click to load compliance tasks
            </button>
          )}
        </Section>

        {/* Risk Alerts */}
        <Section title="Compliance Alerts" icon={<AlertTriangle size={12} className="text-yellow-500" />}>
          <div className="text-center p-2">
            <CheckCircle size={20} className="text-green-500 mx-auto mb-1" />
            <div className="text-[10px] text-muted-foreground">No compliance issues detected</div>
          </div>
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">COMPLIANCE</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">REGULATORY</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
