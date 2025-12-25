import { User, Building2, Dna, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SonicAgent } from '@/lib/agentTypes';
import { cn } from '@/lib/utils';

interface AgentOverviewCardProps {
  agent: SonicAgent | null;
}

export function AgentOverviewCard({ agent }: AgentOverviewCardProps) {
  if (!agent) {
    return (
      <div className="hud-panel p-6">
        <div className="text-center text-muted-foreground py-8">
          <Dna className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Select an agent to view its governance profile</p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      label: 'Persona',
      icon: User,
      value: agent.class,
      color: 'text-primary',
    },
    {
      label: 'Industry',
      icon: Building2,
      value: agent.sector,
      color: 'text-secondary',
    },
    {
      label: 'DNA',
      icon: Dna,
      value: `${agent.sonicDNA.waveform} @ ${agent.sonicDNA.frequency.toFixed(0)}Hz`,
      color: 'text-accent',
    },
    {
      label: 'Links',
      icon: Link2,
      value: `${agent.linkedAgents.length} linked`,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="hud-panel p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full animate-pulse"
            style={{ backgroundColor: agent.sonicDNA.color }}
          />
          <div>
            <h2 className="font-semibold text-lg">{agent.name}</h2>
            <p className="text-xs text-muted-foreground">{agent.designation}</p>
          </div>
        </div>
        <Badge 
          variant="outline"
          className={cn(
            agent.status === 'ACTIVE' && 'border-primary/50 text-primary',
            agent.status === 'IDLE' && 'border-muted-foreground/50',
            agent.status === 'PROCESSING' && 'border-secondary/50 text-secondary',
            agent.status === 'ERROR' && 'border-destructive/50 text-destructive'
          )}
        >
          {agent.status}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {sections.map(section => (
          <div key={section.label} className="text-center">
            <section.icon className={cn('h-5 w-5 mx-auto mb-2', section.color)} />
            <p className="text-xs text-muted-foreground mb-1">{section.label}</p>
            <p className="text-sm font-medium truncate">{section.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
