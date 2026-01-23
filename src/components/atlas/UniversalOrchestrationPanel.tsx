// Universal Atlas Orchestration Panel - Fleet management and cross-hub control

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Bot, 
  Cpu, 
  Network, 
  Zap, 
  Activity, 
  Globe, 
  Users, 
  Briefcase, 
  User,
  Play,
  Pause,
  RotateCcw,
  Settings,
  ChevronRight,
  TrendingUp,
  Shield,
  Brain,
  Layers
} from 'lucide-react';
import { useUniversalAtlasOrchestration, AGENT_FLEET_CONFIG, OrchestrationCommand } from '@/hooks/useUniversalAtlasOrchestration';
import { cn } from '@/lib/utils';

interface UniversalOrchestrationPanelProps {
  compact?: boolean;
}

export function UniversalOrchestrationPanel({ compact = false }: UniversalOrchestrationPanelProps) {
  const orchestration = useUniversalAtlasOrchestration();
  const [swarmInput, setSwarmInput] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const handleSwarmExecution = async () => {
    if (!swarmInput.trim()) return;
    await orchestration.executeSwarm(swarmInput, 100, selectedDomain || undefined);
    setSwarmInput('');
  };

  const getDomainIcon = (domain: string) => {
    const icons: Record<string, React.ReactNode> = {
      finance: <TrendingUp className="h-4 w-4" />,
      operations: <Settings className="h-4 w-4" />,
      technology: <Cpu className="h-4 w-4" />,
      data: <Activity className="h-4 w-4" />,
      creative: <Brain className="h-4 w-4" />,
      security: <Shield className="h-4 w-4" />,
      personal: <User className="h-4 w-4" />,
    };
    return icons[domain] || <Bot className="h-4 w-4" />;
  };

  if (compact) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              Agent Fleet
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {formatNumber(orchestration.fleetStatus.activeAgents)} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-primary">{formatNumber(AGENT_FLEET_CONFIG.totalCapacity)}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-500">{formatNumber(orchestration.fleetStatus.activeAgents)}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-500">{orchestration.fleetStatus.processingTasks}</p>
              <p className="text-xs text-muted-foreground">Tasks</p>
            </div>
          </div>
          <Progress value={orchestration.fleetStatus.healthScore} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">
            Fleet Health: {orchestration.fleetStatus.healthScore}%
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Universal Atlas Orchestration
            </CardTitle>
            <CardDescription>
              144,000 AI agents at your command across all hubs
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={orchestration.isOrchestrating ? 'default' : 'secondary'}>
              {orchestration.isOrchestrating ? 'Orchestrating' : 'Ready'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fleet" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="fleet">Fleet</TabsTrigger>
            <TabsTrigger value="hubs">Hubs</TabsTrigger>
            <TabsTrigger value="swarm">Swarm</TabsTrigger>
            <TabsTrigger value="queue">Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="fleet" className="space-y-4">
            {/* Fleet Overview */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-background/50">
                <CardContent className="pt-4 text-center">
                  <Bot className="h-8 w-8 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{formatNumber(AGENT_FLEET_CONFIG.totalCapacity)}</p>
                  <p className="text-xs text-muted-foreground">Total Agents</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50">
                <CardContent className="pt-4 text-center">
                  <Zap className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold text-green-500">
                    {formatNumber(orchestration.fleetStatus.activeAgents)}
                  </p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50">
                <CardContent className="pt-4 text-center">
                  <Activity className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold text-blue-500">
                    {orchestration.fleetStatus.processingTasks}
                  </p>
                  <p className="text-xs text-muted-foreground">Processing</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50">
                <CardContent className="pt-4 text-center">
                  <Shield className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold text-yellow-500">
                    {orchestration.fleetStatus.healthScore}%
                  </p>
                  <p className="text-xs text-muted-foreground">Health</p>
                </CardContent>
              </Card>
            </div>

            {/* Domain Distribution */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Domain Distribution</h4>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {Object.entries(AGENT_FLEET_CONFIG.domains).map(([domain, config]) => {
                    const stats = orchestration.fleetStatus.domainDistribution[domain] || { active: 0, idle: config.capacity };
                    const utilization = (stats.active / config.capacity) * 100;
                    
                    return (
                      <div
                        key={domain}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          selectedDomain === domain ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
                        )}
                        onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
                      >
                        {getDomainIcon(domain)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{domain}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatNumber(stats.active)} / {formatNumber(config.capacity)}
                            </span>
                          </div>
                          <Progress value={utilization} className="h-1" />
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {config.sectors.length} sectors
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="hubs" className="space-y-4">
            {/* Hub Access Status */}
            <div className="grid grid-cols-3 gap-4">
              {/* Personal Hub */}
              <Card className={cn(
                "bg-background/50 transition-colors",
                orchestration.hubAccess.personal.connected && "border-green-500/30"
              )}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Personal Hub</span>
                    {orchestration.hubAccess.personal.connected && (
                      <Badge variant="outline" className="ml-auto text-green-500 border-green-500/30">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items</span>
                      <span>{orchestration.hubAccess.personal.itemCount}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {orchestration.hubAccess.personal.features.slice(0, 4).map(f => (
                        <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Group Hub */}
              <Card className={cn(
                "bg-background/50 transition-colors",
                orchestration.hubAccess.group.connected && "border-green-500/30"
              )}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Group Hub</span>
                    {orchestration.hubAccess.group.connected && (
                      <Badge variant="outline" className="ml-auto text-green-500 border-green-500/30">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Groups</span>
                      <span>{orchestration.hubAccess.group.groupCount}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {orchestration.hubAccess.group.features.slice(0, 4).map(f => (
                        <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enterprise Hub */}
              <Card className={cn(
                "bg-background/50 transition-colors",
                orchestration.hubAccess.csuite.connected && "border-green-500/30"
              )}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Enterprise Hub</span>
                    {orchestration.hubAccess.csuite.connected && (
                      <Badge variant="outline" className="ml-auto text-green-500 border-green-500/30">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Persona</span>
                      <span className="uppercase">{orchestration.hubAccess.csuite.personaActive}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {orchestration.hubAccess.csuite.features.slice(0, 4).map(f => (
                        <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Quick Hub Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => orchestration.executeUniversalAction('all', 'universal_search', { query: 'important tasks' })}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Universal Search
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => orchestration.executeUniversalAction('all', 'get_insights', {})}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Get Insights
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => orchestration.executeUniversalAction('csuite', 'generate_report', { persona: 'ceo' })}
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  CEO Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => orchestration.executeUniversalAction('personal', 'life_balance', {})}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Life Balance
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="swarm" className="space-y-4">
            {/* Swarm Execution */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter task for swarm execution..."
                  value={swarmInput}
                  onChange={(e) => setSwarmInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSwarmExecution()}
                />
                <Button onClick={handleSwarmExecution} disabled={!swarmInput.trim() || orchestration.isOrchestrating}>
                  <Zap className="h-4 w-4 mr-2" />
                  Execute
                </Button>
              </div>

              {selectedDomain && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
                  {getDomainIcon(selectedDomain)}
                  <span className="text-sm">
                    Targeting: <strong className="capitalize">{selectedDomain}</strong> domain
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6"
                    onClick={() => setSelectedDomain(null)}
                  >
                    Clear
                  </Button>
                </div>
              )}

              <Card className="bg-background/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-5 w-5 text-primary" />
                    <span className="font-medium">Swarm Capabilities</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span>Parallel execution up to 10,000 agents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span>Cross-hub data aggregation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span>Automatic load balancing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span>Domain-specific optimization</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            {/* Command Queue */}
            <div className="space-y-2">
              {orchestration.commandQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No commands in queue</p>
                  <p className="text-sm">Execute a swarm or action to see it here</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  {orchestration.commandQueue.map((cmd) => (
                    <div
                      key={cmd.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 mb-2"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs uppercase">{cmd.type}</Badge>
                          <Badge variant={cmd.priority === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                            {cmd.priority}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{cmd.payload.request || 'Processing...'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mode: {cmd.orchestrationMode} | Agents: {cmd.agentCount || 1}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
