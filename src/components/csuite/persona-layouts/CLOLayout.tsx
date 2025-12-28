import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Scale,
  FileText,
  Shield,
  AlertTriangle,
  Briefcase,
  CheckCircle,
  Clock,
  Book,
  Gavel
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function CLOLayout({ 
  stats, 
  domainItems,
  onDomainClick,
  onItemClick 
}: PersonaLayoutProps) {
  const documents = domainItems.documents || [];
  const legalDocs = documents.slice(0, 4);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Legal Overview */}
        <Section title="Legal Dashboard" icon={<Scale size={12} className="text-purple-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Contracts" 
              value={stats.documents} 
              icon={<FileText size={10} className="text-purple-500" />}
              color="hsl(280 70% 55%)"
            />
            <MetricCard 
              label="Tasks" 
              value={stats.tasks} 
              icon={<Briefcase size={10} className="text-blue-500" />}
              color="hsl(200 70% 50%)"
            />
            <MetricCard 
              label="Knowledge" 
              value={stats.knowledge} 
              icon={<Book size={10} className="text-green-500" />}
              color="hsl(142 70% 45%)"
            />
          </div>
        </Section>

        {/* Compliance Status */}
        <Section title="Compliance Status" icon={<Shield size={12} className="text-green-500" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-1 mb-1">
                <CheckCircle size={10} className="text-green-500" />
                <span className="text-[9px] font-mono text-green-500">COMPLIANT</span>
              </div>
              <div className="text-sm font-mono text-foreground">All Clear</div>
            </div>
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-1 mb-1">
                <Clock size={10} className="text-blue-500" />
                <span className="text-[9px] font-mono text-blue-500">PENDING</span>
              </div>
              <div className="text-sm font-mono text-foreground">0 Reviews</div>
            </div>
          </div>
        </Section>

        {/* Contracts & Documents */}
        <Section title="Legal Documents" icon={<FileText size={12} className="text-primary" />}>
          {legalDocs.length > 0 ? (
            <div className="space-y-1">
              {legalDocs.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-foreground truncate max-w-[70%]">
                      {item.title}
                    </span>
                    <Badge variant="secondary" className="text-[7px] font-mono px-1">
                      {item.type || 'document'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => onDomainClick('documents')}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Click to load legal documents
            </button>
          )}
        </Section>

        {/* Risk & Litigation */}
        <Section title="Risk Monitor" icon={<AlertTriangle size={12} className="text-yellow-500" />}>
          <div className="space-y-2">
            <button 
              onClick={() => onDomainClick('tasks')}
              className="w-full text-left p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono">Active Cases</span>
                <span className="text-xs font-mono text-primary">{stats.tasks}</span>
              </div>
            </button>
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2">
                <Gavel size={12} className="text-green-500" />
                <span className="text-[10px] font-mono text-foreground">No Active Litigation</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">LEGAL</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">CONTRACTS</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
