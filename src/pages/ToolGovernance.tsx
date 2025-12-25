import { useState, useMemo } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAgents } from '@/hooks/useAgents';
import { useToolPermissions } from '@/hooks/useToolPermissions';
import { GovernanceAgentSelector } from '@/components/governance/GovernanceAgentSelector';
import { AgentOverviewCard } from '@/components/governance/AgentOverviewCard';
import { FinalToolsPanel } from '@/components/governance/FinalToolsPanel';
import { OverridesPanel } from '@/components/governance/OverridesPanel';
import { SonicAgent } from '@/lib/agentTypes';

export default function ToolGovernance() {
  const navigate = useNavigate();
  const { agents, loading: agentsLoading } = useAgents();
  const { sections, loading: permissionsLoading } = useToolPermissions();
  
  const [selectedAgent, setSelectedAgent] = useState<SonicAgent | null>(null);

  // Transform tool permissions into final tools with governance layers
  const finalTools = useMemo(() => {
    const tools: Array<{
      tool: string;
      label: string;
      icon: string;
      source: 'persona' | 'industry' | 'workspace' | 'user' | 'agent';
      status: 'allowed' | 'blocked' | 'preferred';
    }> = [];

    sections.forEach(section => {
      section.items.forEach(item => {
        let status: 'allowed' | 'blocked' | 'preferred' = 'allowed';
        if (section.id === 'blocked') status = 'blocked';
        if (section.id === 'preferred') status = 'preferred';

        // Simulate governance layer source based on category
        const sources: Array<'persona' | 'industry' | 'workspace' | 'user' | 'agent'> = 
          ['persona', 'industry', 'workspace', 'user', 'agent'];
        const source = sources[Math.floor(Math.random() * sources.length)];

        tools.push({
          tool: item.tool,
          label: item.label,
          icon: item.icon,
          source,
          status,
        });
      });
    });

    return tools;
  }, [sections]);

  // Mock overrides data
  const overrides = useMemo(() => {
    if (!selectedAgent) return [];
    return [
      {
        id: '1',
        tool: 'web_search',
        layer: 'workspace',
        action: 'allow' as const,
        reason: 'Required for research tasks',
        timestamp: new Date(),
      },
      {
        id: '2',
        tool: 'file_write',
        layer: 'user',
        action: 'block' as const,
        reason: 'Security policy',
        timestamp: new Date(),
      },
    ];
  }, [selectedAgent]);

  // Mock events data
  const events = useMemo(() => {
    if (!selectedAgent) return [];
    return [
      {
        id: '1',
        type: 'tool_invoked' as const,
        description: `${selectedAgent.name} invoked web_search`,
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: '2',
        type: 'permission_changed' as const,
        description: 'file_write moved to blocked',
        timestamp: new Date(Date.now() - 7200000),
      },
    ];
  }, [selectedAgent]);

  // Mock snapshots data
  const snapshots = useMemo(() => [
    {
      id: '1',
      name: 'Production Baseline',
      toolCount: 24,
      createdAt: new Date(Date.now() - 86400000 * 7),
    },
    {
      id: '2',
      name: 'Pre-deployment',
      toolCount: 28,
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
  ], []);

  const loading = agentsLoading || permissionsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading governance data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-lg font-semibold">Tool Governance</h1>
                <p className="text-xs text-muted-foreground">
                  Persona → Industry → Workspace → User → Agent. Preferred &gt; Blocked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Agent Selector */}
        <GovernanceAgentSelector
          agents={agents}
          selectedAgent={selectedAgent}
          onSelect={setSelectedAgent}
          loading={agentsLoading}
        />

        {/* Agent Overview Card */}
        <AgentOverviewCard agent={selectedAgent} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Left Column - Final Tools (wider) */}
          <div className="lg:col-span-2">
            <FinalToolsPanel tools={finalTools} />
          </div>

          {/* Right Column - Overrides, Events, Snapshots */}
          <div className="lg:col-span-1">
            <OverridesPanel
              overrides={overrides}
              events={events}
              snapshots={snapshots}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
