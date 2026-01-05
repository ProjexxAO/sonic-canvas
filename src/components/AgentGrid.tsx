// Atlas Sonic OS - Agent Grid Component (Virtualized for large datasets)

import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  OPERATIONS: Activity,
  ANALYTICS: Database,
  SECURITY: Shield,
  CREATIVE: Sparkles,
  RESEARCH: Database,
  INFRASTRUCTURE: Wrench,
  COMMUNICATIONS: Activity,
  STRATEGY: Zap,
};

const statusColors: Record<string, string> = {
  IDLE: 'bg-muted-foreground',
  ACTIVE: 'bg-success',
  PROCESSING: 'bg-secondary',
  ERROR: 'bg-destructive',
  DORMANT: 'bg-muted',
};

// Distinctive colors for each sector
const sectorColors: Record<AgentSector, string> = {
  FINANCE: '#00ffd5',
  OPERATIONS: '#00ff88',
  ANALYTICS: '#9945ff',
  SECURITY: '#ff3366',
  CREATIVE: '#ffaa00',
  RESEARCH: '#4488ff',
  INFRASTRUCTURE: '#888888',
  COMMUNICATIONS: '#ff9900',
  STRATEGY: '#00ccff',
};

// Card shape styles per sector
const sectorStyles: Record<AgentSector, string> = {
  FINANCE: 'rounded-none border-l-4',
  OPERATIONS: 'rounded-2xl',
  ANALYTICS: 'rounded-lg border-t-4',
  SECURITY: 'rounded clip-corner',
  CREATIVE: 'rounded-xl skew-effect',
  RESEARCH: 'rounded-lg',
  INFRASTRUCTURE: 'rounded border-dashed border-2',
  COMMUNICATIONS: 'rounded-xl',
  STRATEGY: 'rounded-none border-r-4',
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
  const sectorColor = sectorColors[agent.sector] || agent.sonicDNA.color;
  const sectorStyle = sectorStyles[agent.sector] || 'rounded';

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
        ${sectorStyle}
        ${isSelected ? 'neon-border' : 'hover:border-primary/50'}
      `}
      style={{
        borderColor: isSelected ? sectorColor : `${sectorColor}30`,
        boxShadow: isSelected ? `0 0 15px ${sectorColor}40` : undefined,
      }}
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

      {/* Agent icon with sector color */}
      <div 
        className="w-10 h-10 rounded flex items-center justify-center mb-3"
        style={{ 
          backgroundColor: `${sectorColor}20`,
          boxShadow: `0 0 10px ${sectorColor}40`
        }}
      >
        <Icon size={20} style={{ color: sectorColor }} />
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
              backgroundColor: sectorColor
            }}
          />
        </div>
      </div>

      {/* Class badge with sector color */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] px-2 py-0.5 bg-muted rounded" style={{ color: sectorColor }}>
          {agent.class}
        </span>
        <span className="text-[10px]" style={{ color: sectorColor }}>
          {agent.sector}
        </span>
      </div>

      {/* Linked indicator */}
      {agent.linkedAgents.length > 0 && (
        <div className="absolute bottom-2 right-2" style={{ color: sectorColor }}>
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
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calculate rows (2 cards per row)
  const rowCount = Math.ceil(agents.length / 2);
  
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Estimated row height
    overscan: 5,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-orbitron text-sm text-primary text-glow-cyan">AGENT NETWORK</h3>
        <span className="text-xs text-muted-foreground">{agents.length.toLocaleString()} NODES</span>
      </div>

      {/* Virtualized Grid */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        {agents.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Cpu size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No agents synthesized</p>
              <p className="text-xs mt-1">Use the console to create one</p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const rowIndex = virtualRow.index;
              const agent1 = agents[rowIndex * 2];
              const agent2 = agents[rowIndex * 2 + 1];
              
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid grid-cols-2 gap-3 pb-3"
                >
                  {agent1 && (
                    <AgentCard
                      agent={agent1}
                      isSelected={selectedAgent?.id === agent1.id}
                      onClick={() => onSelectAgent(agent1)}
                      onDelete={() => onDeleteAgent(agent1.id)}
                      onRun={() => onRunAgent(agent1)}
                    />
                  )}
                  {agent2 && (
                    <AgentCard
                      agent={agent2}
                      isSelected={selectedAgent?.id === agent2.id}
                      onClick={() => onSelectAgent(agent2)}
                      onDelete={() => onDeleteAgent(agent2.id)}
                      onRun={() => onRunAgent(agent2)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
