import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface AgentNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'output';
  name: string;
  description: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  domain: string;
  nodes: AgentNode[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  lastExecutedAt?: Date;
}

export interface AgentTemplateNode {
  type: AgentNode['type'];
  name: string;
  description: string;
  config: Record<string, any>;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: AgentTemplateNode[];
  popularity: number;
}

const NODE_TEMPLATES: Record<string, Omit<AgentNode, 'id' | 'position' | 'connections'>[]> = {
  triggers: [
    { type: 'trigger', name: 'On Schedule', description: 'Run at specific times', config: { schedule: 'daily' } },
    { type: 'trigger', name: 'On Event', description: 'When calendar event starts', config: { eventType: 'any' } },
    { type: 'trigger', name: 'On Message', description: 'When message received', config: { platform: 'any' } },
    { type: 'trigger', name: 'On Data Change', description: 'When data is updated', config: { table: '' } },
    { type: 'trigger', name: 'On Threshold', description: 'When value exceeds limit', config: { metric: '', threshold: 0 } },
  ],
  actions: [
    { type: 'action', name: 'Send Email', description: 'Draft and send email', config: { template: '' } },
    { type: 'action', name: 'Create Task', description: 'Add task to list', config: { priority: 'medium' } },
    { type: 'action', name: 'Update Record', description: 'Modify database entry', config: { table: '', fields: {} } },
    { type: 'action', name: 'Call API', description: 'Make external API request', config: { url: '', method: 'GET' } },
    { type: 'action', name: 'Generate Report', description: 'Create AI summary', config: { format: 'markdown' } },
    { type: 'action', name: 'Send Notification', description: 'Push notification to user', config: { channel: 'app' } },
    { type: 'action', name: 'Block Calendar', description: 'Reserve time slot', config: { duration: 60 } },
  ],
  conditions: [
    { type: 'condition', name: 'If/Else', description: 'Branch based on condition', config: { condition: '' } },
    { type: 'condition', name: 'Time Check', description: 'Check current time', config: { start: '09:00', end: '17:00' } },
    { type: 'condition', name: 'Data Check', description: 'Verify data value', config: { field: '', operator: '==', value: '' } },
    { type: 'condition', name: 'AI Decision', description: 'Let AI choose path', config: { prompt: '' } },
  ],
  outputs: [
    { type: 'output', name: 'Log Result', description: 'Record execution result', config: {} },
    { type: 'output', name: 'Return Value', description: 'Output data to caller', config: {} },
    { type: 'output', name: 'Trigger Agent', description: 'Start another agent', config: { agentId: '' } },
  ],
};

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'daily-standup',
    name: 'Daily Standup Summary',
    description: 'Automatically compile yesterday\'s activities and today\'s priorities',
    category: 'productivity',
    popularity: 95,
    nodes: [
      { type: 'trigger', name: 'On Schedule', description: 'Run at 8am daily', config: { schedule: '0 8 * * *' } },
      { type: 'action', name: 'Generate Report', description: 'Summarize activities', config: { format: 'markdown' } },
      { type: 'action', name: 'Send Notification', description: 'Push to user', config: { channel: 'app' } },
    ],
  },
  {
    id: 'email-responder',
    name: 'Smart Email Responder',
    description: 'Draft contextual replies to incoming emails',
    category: 'communication',
    popularity: 88,
    nodes: [
      { type: 'trigger', name: 'On Message', description: 'When email received', config: { platform: 'email' } },
      { type: 'condition', name: 'AI Decision', description: 'Needs response?', config: { prompt: 'Does this email require a response?' } },
      { type: 'action', name: 'Send Email', description: 'Draft and send reply', config: { template: 'contextual' } },
    ],
  },
  {
    id: 'focus-guardian',
    name: 'Focus Time Guardian',
    description: 'Protect focus blocks and defer non-urgent tasks',
    category: 'wellness',
    popularity: 82,
    nodes: [
      { type: 'trigger', name: 'On Event', description: 'When focus block starts', config: { eventType: 'focus' } },
      { type: 'action', name: 'Send Notification', description: 'Enable focus mode', config: { channel: 'system' } },
      { type: 'condition', name: 'Time Check', description: 'During focus time', config: { checkActive: true } },
    ],
  },
  {
    id: 'expense-tracker',
    name: 'Expense Categorizer',
    description: 'Auto-categorize and track expenses from transactions',
    category: 'finance',
    popularity: 76,
    nodes: [
      { type: 'trigger', name: 'On Data Change', description: 'New transaction', config: { table: 'bank_transactions' } },
      { type: 'action', name: 'Update Record', description: 'Categorize expense', config: { table: 'bank_transactions', fields: { category: 'auto' } } },
      { type: 'output', name: 'Log Result', description: 'Record categorization', config: {} },
    ],
  },
  {
    id: 'meeting-prep',
    name: 'Meeting Preparation',
    description: 'Gather context and prepare briefings before meetings',
    category: 'productivity',
    popularity: 71,
    nodes: [
      { type: 'trigger', name: 'On Schedule', description: '15 min before meeting', config: { schedule: 'before_event', offset: -15 } },
      { type: 'action', name: 'Generate Report', description: 'Create meeting brief', config: { format: 'summary' } },
      { type: 'action', name: 'Send Notification', description: 'Push briefing', config: { channel: 'app' } },
    ],
  },
];

export const useAgentBuilder = () => {
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>([]);
  const [currentAgent, setCurrentAgent] = useState<CustomAgent | null>(null);
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const createNewAgent = useCallback((name: string, description: string, domain: string) => {
    const agent: CustomAgent = {
      id: generateId(),
      name,
      description,
      icon: '🤖',
      domain,
      nodes: [],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
    };
    setCurrentAgent(agent);
    setIsBuilderOpen(true);
    return agent;
  }, []);

  const createFromTemplate = useCallback((templateId: string) => {
    const template = AGENT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    const nodes: AgentNode[] = template.nodes.map((node, index) => ({
      ...node,
      id: generateId(),
      position: { x: 100, y: 100 + index * 120 },
      connections: index < template.nodes.length - 1 ? [generateId()] : [],
    }));

    // Fix connection IDs
    nodes.forEach((node, index) => {
      if (index < nodes.length - 1) {
        node.connections = [nodes[index + 1].id];
      }
    });

    const agent: CustomAgent = {
      id: generateId(),
      name: template.name,
      description: template.description,
      icon: '🤖',
      domain: template.category,
      nodes,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
    };

    setCurrentAgent(agent);
    setIsBuilderOpen(true);
    toast.success(`Created agent from "${template.name}" template`);
    return agent;
  }, []);

  const addNode = useCallback((
    type: AgentNode['type'],
    templateName: string,
    position: { x: number; y: number }
  ) => {
    if (!currentAgent) return;

    const templates = NODE_TEMPLATES[type + 's'] || [];
    const template = templates.find(t => t.name === templateName);
    if (!template) return;

    const newNode: AgentNode = {
      ...template,
      id: generateId(),
      position,
      connections: [],
    };

    setCurrentAgent(prev => prev ? {
      ...prev,
      nodes: [...prev.nodes, newNode],
      updatedAt: new Date(),
    } : null);

    toast.success(`Added ${template.name} node`);
    return newNode;
  }, [currentAgent]);

  const updateNode = useCallback((nodeId: string, updates: Partial<AgentNode>) => {
    if (!currentAgent) return;

    setCurrentAgent(prev => prev ? {
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n),
      updatedAt: new Date(),
    } : null);
  }, [currentAgent]);

  const deleteNode = useCallback((nodeId: string) => {
    if (!currentAgent) return;

    setCurrentAgent(prev => prev ? {
      ...prev,
      nodes: prev.nodes
        .filter(n => n.id !== nodeId)
        .map(n => ({
          ...n,
          connections: n.connections.filter(c => c !== nodeId),
        })),
      updatedAt: new Date(),
    } : null);

    toast.success('Node removed');
  }, [currentAgent]);

  const connectNodes = useCallback((fromId: string, toId: string) => {
    if (!currentAgent) return;

    setCurrentAgent(prev => prev ? {
      ...prev,
      nodes: prev.nodes.map(n => 
        n.id === fromId 
          ? { ...n, connections: [...new Set([...n.connections, toId])] }
          : n
      ),
      updatedAt: new Date(),
    } : null);
  }, [currentAgent]);

  const saveAgent = useCallback(() => {
    if (!currentAgent) return;

    setCustomAgents(prev => {
      const existing = prev.findIndex(a => a.id === currentAgent.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = currentAgent;
        return updated;
      }
      return [...prev, currentAgent];
    });

    toast.success(`Agent "${currentAgent.name}" saved`);
  }, [currentAgent]);

  const activateAgent = useCallback((agentId: string) => {
    setCustomAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, isActive: true } : a
    ));
    toast.success('Agent activated');
  }, []);

  const deactivateAgent = useCallback((agentId: string) => {
    setCustomAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, isActive: false } : a
    ));
    toast.info('Agent deactivated');
  }, []);

  const testAgent = useCallback(async () => {
    if (!currentAgent) return;
    
    setIsTesting(true);
    
    // Simulate agent execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsTesting(false);
    toast.success('Agent test completed successfully!', {
      description: `Executed ${currentAgent.nodes.length} nodes`,
    });
  }, [currentAgent]);

  const duplicateAgent = useCallback((agentId: string) => {
    const agent = customAgents.find(a => a.id === agentId);
    if (!agent) return;

    const duplicate: CustomAgent = {
      ...agent,
      id: generateId(),
      name: `${agent.name} (Copy)`,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      lastExecutedAt: undefined,
    };

    setCustomAgents(prev => [...prev, duplicate]);
    toast.success(`Duplicated "${agent.name}"`);
  }, [customAgents]);

  const deleteAgent = useCallback((agentId: string) => {
    setCustomAgents(prev => prev.filter(a => a.id !== agentId));
    toast.success('Agent deleted');
  }, []);

  return {
    // State
    customAgents,
    currentAgent,
    selectedNode,
    isBuilderOpen,
    isTesting,
    templates: AGENT_TEMPLATES,
    nodeTemplates: NODE_TEMPLATES,
    
    // Actions
    createNewAgent,
    createFromTemplate,
    addNode,
    updateNode,
    deleteNode,
    connectNodes,
    saveAgent,
    activateAgent,
    deactivateAgent,
    testAgent,
    duplicateAgent,
    deleteAgent,
    
    // UI Controls
    setCurrentAgent,
    setSelectedNode,
    setIsBuilderOpen,
  };
};
