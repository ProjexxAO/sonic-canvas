import { useState } from 'react';
import { 
  Bot, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  Zap, 
  GitBranch, 
  ArrowRight,
  CheckCircle2,
  Settings,
  X,
  Sparkles,
  ChevronRight,
  Clock,
  Filter,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAgentBuilder, CustomAgent, AgentTemplate } from '@/hooks/useAgentBuilder';
import { cn } from '@/lib/utils';

interface AgentBuilderPanelProps {
  onRemove?: () => void;
  compact?: boolean;
}

export function AgentBuilderPanel({ onRemove, compact = false }: AgentBuilderPanelProps) {
  const {
    customAgents,
    currentAgent,
    isBuilderOpen,
    isTesting,
    templates,
    nodeTemplates,
    createNewAgent,
    createFromTemplate,
    addNode,
    deleteNode,
    saveAgent,
    activateAgent,
    deactivateAgent,
    testAgent,
    duplicateAgent,
    deleteAgent,
    setCurrentAgent,
    setIsBuilderOpen,
  } = useAgentBuilder();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDesc, setNewAgentDesc] = useState('');
  const [newAgentDomain, setNewAgentDomain] = useState('productivity');
  const [activeTab, setActiveTab] = useState('agents');

  const handleCreateAgent = () => {
    if (!newAgentName.trim()) return;
    createNewAgent(newAgentName, newAgentDesc, newAgentDomain);
    setShowCreateDialog(false);
    setNewAgentName('');
    setNewAgentDesc('');
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger': return <Zap size={12} className="text-yellow-500" />;
      case 'action': return <Play size={12} className="text-green-500" />;
      case 'condition': return <GitBranch size={12} className="text-blue-500" />;
      case 'output': return <ArrowRight size={12} className="text-purple-500" />;
      default: return <Bot size={12} />;
    }
  };

  if (compact) {
    return (
      <Card className="bg-card/50 border-border relative group">
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          >
            <X size={12} />
          </button>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot size={14} className="text-primary" />
            Agent Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Custom Agents</span>
            <Badge variant="secondary">{customAgents.length}</Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active</span>
            <Badge className="bg-green-500/20 text-green-500">
              {customAgents.filter(a => a.isActive).length}
            </Badge>
          </div>
          <Button size="sm" className="w-full mt-2" onClick={() => setShowCreateDialog(true)}>
            <Plus size={12} className="mr-1" />
            Create Agent
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background relative group">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
        >
          <X size={14} />
        </button>
      )}
      
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Agent Builder</h2>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus size={14} className="mr-1" />
                New Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border">
              <DialogHeader>
                <DialogTitle>Create Custom Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="My Custom Agent"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newAgentDesc}
                    onChange={(e) => setNewAgentDesc(e.target.value)}
                    placeholder="What does this agent do?"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Domain</label>
                  <Select value={newAgentDomain} onValueChange={setNewAgentDomain}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="wellness">Wellness</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateAgent} className="w-full">
                  Create Agent
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="agents" className="text-xs">My Agents</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
          <TabsTrigger value="builder" className="text-xs">Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            {customAgents.length === 0 ? (
              <div className="text-center py-8">
                <Bot size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No custom agents yet</p>
                <Button variant="outline" onClick={() => setActiveTab('templates')}>
                  Browse Templates
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {customAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onActivate={() => activateAgent(agent.id)}
                    onDeactivate={() => deactivateAgent(agent.id)}
                    onEdit={() => { setCurrentAgent(agent); setActiveTab('builder'); }}
                    onDuplicate={() => duplicateAgent(agent.id)}
                    onDelete={() => deleteAgent(agent.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid gap-3">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={() => createFromTemplate(template.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="builder" className="flex-1 p-4 overflow-hidden">
          {currentAgent ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">{currentAgent.name}</h3>
                  <p className="text-xs text-muted-foreground">{currentAgent.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testAgent}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <Play size={14} className="mr-1" />
                    )}
                    Test
                  </Button>
                  <Button size="sm" onClick={saveAgent}>
                    Save
                  </Button>
                </div>
              </div>

              <div className="flex-1 bg-muted/30 rounded-lg border border-border p-4 overflow-auto">
                <div className="space-y-2">
                  {currentAgent.nodes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-4">Add nodes to build your agent</p>
                    </div>
                  ) : (
                    currentAgent.nodes.map((node, index) => (
                      <div key={node.id} className="relative">
                        <div className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border">
                          {getNodeIcon(node.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{node.name}</p>
                            <p className="text-xs text-muted-foreground">{node.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteNode(node.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                        {index < currentAgent.nodes.length - 1 && (
                          <div className="flex justify-center py-1">
                            <ArrowRight size={14} className="text-muted-foreground rotate-90" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {Object.entries(nodeTemplates).map(([category, nodes]) => (
                  <Select
                    key={category}
                    onValueChange={(name) => addNode(
                      category.replace('s', '') as any,
                      name,
                      { x: 100, y: 100 + currentAgent.nodes.length * 80 }
                    )}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder={`+ ${category}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.map((node) => (
                        <SelectItem key={node.name} value={node.name} className="text-xs">
                          {node.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Bot size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Select or create an agent to edit</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AgentCard({
  agent,
  onActivate,
  onDeactivate,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  agent: CustomAgent;
  onActivate: () => void;
  onDeactivate: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xl">{agent.icon}</div>
            <div>
              <h4 className="text-sm font-medium">{agent.name}</h4>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {agent.description}
              </p>
            </div>
          </div>
          <Badge className={agent.isActive ? "bg-green-500/20 text-green-500" : "bg-muted"}>
            {agent.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>{agent.nodes.length} nodes</span>
          <span>•</span>
          <span>{agent.executionCount} runs</span>
        </div>

        <div className="flex gap-2 mt-3">
          {agent.isActive ? (
            <Button size="sm" variant="outline" onClick={onDeactivate} className="flex-1">
              <Pause size={12} className="mr-1" />
              Pause
            </Button>
          ) : (
            <Button size="sm" onClick={onActivate} className="flex-1">
              <Play size={12} className="mr-1" />
              Activate
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Settings size={12} />
          </Button>
          <Button size="sm" variant="outline" onClick={onDuplicate}>
            <Copy size={12} />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive">
            <Trash2 size={12} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateCard({
  template,
  onUse,
}: {
  template: AgentTemplate;
  onUse: () => void;
}) {
  return (
    <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={onUse}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-sm font-medium">{template.name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
          </div>
          <Badge variant="outline" className="text-[10px]">{template.category}</Badge>
        </div>

        <div className="flex items-center gap-1 mt-3">
          {template.nodes.map((node, i) => (
            <div key={i} className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                {node.type === 'trigger' && <Zap size={10} className="text-yellow-500" />}
                {node.type === 'action' && <Play size={10} className="text-green-500" />}
                {node.type === 'condition' && <GitBranch size={10} className="text-blue-500" />}
                {node.type === 'output' && <ArrowRight size={10} className="text-purple-500" />}
              </div>
              {i < template.nodes.length - 1 && (
                <ChevronRight size={10} className="text-muted-foreground mx-0.5" />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles size={10} />
            <span>{template.popularity}% popular</span>
          </div>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
