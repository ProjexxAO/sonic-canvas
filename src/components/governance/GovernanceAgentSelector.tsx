import { ChevronDown, Bot, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SonicAgent } from '@/lib/agentTypes';

interface GovernanceAgentSelectorProps {
  agents: SonicAgent[];
  selectedAgent: SonicAgent | null;
  onSelect: (agent: SonicAgent) => void;
  loading?: boolean;
}

export function GovernanceAgentSelector({
  agents,
  selectedAgent,
  onSelect,
  loading,
}: GovernanceAgentSelectorProps) {
  return (
    <div className="hud-panel p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Agent Selector
        </span>
        <Badge variant="outline" className="text-xs">
          {agents.length} available
        </Badge>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12"
            disabled={loading || agents.length === 0}
          >
            {selectedAgent ? (
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedAgent.sonicDNA.color }}
                />
                <div className="text-left">
                  <div className="font-medium">{selectedAgent.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAgent.designation}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {loading ? 'Loading agents...' : 'Select an agent'}
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
          {agents.map(agent => (
            <DropdownMenuItem
              key={agent.id}
              onClick={() => onSelect(agent)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: agent.sonicDNA.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{agent.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{agent.designation}</span>
                    <span>•</span>
                    <span>{agent.sector}</span>
                  </div>
                </div>
                {agent.status === 'ACTIVE' && (
                  <Zap className="h-3 w-3 text-primary shrink-0" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
