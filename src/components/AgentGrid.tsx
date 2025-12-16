// Atlas Sonic OS - Agent Grid Component

import { useState } from 'react';
import { SonicAgent, AgentSector } from '@/lib/agentTypes';
import { audioEngine } from '@/lib/audioEngine';
import { 
  Cpu, 
  Activity, 
  Zap, 
  Shield, 
  Database, 
  Sparkles, 
  Wrench,
  MoreVertical,
  Trash2,
  Link,
  Play
} from 'lucide-react';

const sectorIcons: Record<AgentSector, typeof Cpu> = {
  FINANCE: Zap,
  BIOTECH: Activity,
  SECURITY: Shield,
  DATA: Database,
  CREATIVE: Sparkles,
  UTILITY: Wrench,
};

const statusColors: Record<string, string> = {
  IDLE: 'bg-muted-foreground',
  ACTIVE: 'bg-success',
  PROCESSING: 'bg-secondary',
  ERROR: 'bg-destructive',
  DORMANT: 'bg-muted',
};

interface AgentCardProps {
  agent: SonicAgent;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onRun: () => void;
}

function AgentCard({ agent, isSelected, onClick, onDelete, onRun }: AgentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const Icon = sectorIcons[agent.sector];

  const handleClick = () => {
    audioEngine.playClick();
    onClick();
  };

  const handleMouseEnter = () => {
    audioEngine.playHover();
  };

  return (
    <div
      className={`
        relative p-4 hud-panel cursor-pointer transition-all duration-300
        ${isSelected ? 'border-primary neon-border' : 'border-border hover:border-primary/50'}
      `}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {/* Status indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]} ${agent.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute top-8 right-2 z-20 bg-card border border-border rounded p-1 min-w-[120px]">
          <button
            onClick={(e) => { e.stopPropagation(); onRun(); setShowMenu(false); }}
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-primary/20 flex items-center gap-2"
          >
            <Play size={12} /> Run
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-destructive/20 text-destructive flex items-center gap-2"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}

      {/* Agent icon */}
      <div 
        className="w-10 h-10 rounded flex items-center justify-center mb-3"
        style={{ 
          backgroundColor: `${agent.sonicDNA.color}20`,
          boxShadow: `0 0 10px ${agent.sonicDNA.color}40`
        }}
      >
        <Icon size={20} style={{ color: agent.sonicDNA.color }} />
      </div>

      {/* Agent info */}
      <h4 className="font-orbitron text-sm text-foreground mb-1 truncate">{agent.name}</h4>
      <p className="text-xs text-muted-foreground mb-2">{agent.designation}</p>

      {/* Metrics bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Efficiency</span>
          <span>{agent.metrics.efficiency.toFixed(1)}%</span>
        </div>
        <div className="h-1 bg-muted rounded overflow-hidden">
          <div 
            className="h-full transition-all"
            style={{ 
              width: `${agent.metrics.efficiency}%`,
              backgroundColor: agent.sonicDNA.color
            }}
          />
        </div>
      </div>

      {/* Class badge */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] px-2 py-0.5 bg-muted rounded" style={{ color: agent.sonicDNA.color }}>
          {agent.class}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {agent.sector}
        </span>
      </div>

      {/* Linked indicator */}
      {agent.linkedAgents.length > 0 && (
        <div className="absolute bottom-2 right-2 text-primary">
          <Link size={12} />
        </div>
      )}
    </div>
  );
}

interface AgentGridProps {
  agents: SonicAgent[];
  selectedAgent: SonicAgent | null;
  onSelectAgent: (agent: SonicAgent) => void;
  onDeleteAgent: (id: string) => void;
  onRunAgent: (agent: SonicAgent) => void;
}

export default function AgentGrid({ 
  agents, 
  selectedAgent, 
  onSelectAgent, 
  onDeleteAgent,
  onRunAgent 
}: AgentGridProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-orbitron text-sm text-primary text-glow-cyan">AGENT NETWORK</h3>
        <span className="text-xs text-muted-foreground">{agents.length} NODES</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        {agents.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Cpu size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No agents synthesized</p>
              <p className="text-xs mt-1">Use the console to create one</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent?.id === agent.id}
                onClick={() => onSelectAgent(agent)}
                onDelete={() => onDeleteAgent(agent.id)}
                onRun={() => onRunAgent(agent)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
