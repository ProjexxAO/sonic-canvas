// Agent Widget Renderer - Mini-Atlas widgets that orchestrate AI agents
// Each widget is a specialized agent ensemble that can execute real tasks

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bot, 
  Zap, 
  Sparkles,
  RefreshCw,
  MoreHorizontal,
  Loader2,
  Brain,
  Send,
  ChevronRight,
  Check,
  AlertCircle,
  Play,
  Pause,
  Settings,
  Users,
  Activity,
  MessageSquare,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CustomWidget } from '@/hooks/useCustomWidgets';
import { usePersonalHub } from '@/hooks/usePersonalHub';
import { useBanking } from '@/hooks/useBanking';
import { useDataRefreshStore } from '@/hooks/useDataRefresh';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface AgentWidgetRendererProps {
  widget: CustomWidget;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  action?: {
    type: 'task_created' | 'task_completed' | 'goal_created' | 'habit_created' | 'analysis_complete' | 'automation_triggered';
    data?: any;
  };
}

interface AgentStatus {
  activeAgents: number;
  totalAssigned: number;
  currentTask: string | null;
  isProcessing: boolean;
  lastAction: string | null;
  lastActionTime: Date | null;
}

const COLOR_SCHEMES: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  purple: { bg: 'bg-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-500', accent: 'bg-purple-500' },
  blue: { bg: 'bg-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-500', accent: 'bg-blue-500' },
  green: { bg: 'bg-green-500/5', border: 'border-green-500/20', text: 'text-green-500', accent: 'bg-green-500' },
  orange: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-500', accent: 'bg-orange-500' },
  pink: { bg: 'bg-pink-500/5', border: 'border-pink-500/20', text: 'text-pink-500', accent: 'bg-pink-500' },
  cyan: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', text: 'text-cyan-500', accent: 'bg-cyan-500' },
  yellow: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/20', text: 'text-yellow-500', accent: 'bg-yellow-500' },
  red: { bg: 'bg-red-500/5', border: 'border-red-500/20', text: 'text-red-500', accent: 'bg-red-500' },
};

export function AgentWidgetRenderer({ 
  widget, 
  onEdit, 
  onDelete 
}: AgentWidgetRendererProps) {
  const { user } = useAuth();
  const { items: tasks, goals, habits, createItem, updateItem } = usePersonalHub();
  const { accounts, transactions } = useBanking();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    activeAgents: 0,
    totalAssigned: widget.agent_chain?.length || 3,
    currentTask: null,
    isProcessing: false,
    lastAction: null,
    lastActionTime: null,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const colors = COLOR_SCHEMES[widget.style.color || 'purple'];

  // Initialize widget with agent briefing
  useEffect(() => {
    if (!isInitialized) {
      initializeWidget();
    }
  }, [isInitialized]);

  const initializeWidget = async () => {
    setIsProcessing(true);
    
    // Simulate agent allocation
    setAgentStatus(prev => ({
      ...prev,
      activeAgents: Math.min(widget.agent_chain?.length || 3, 5),
      isProcessing: true,
      currentTask: 'Initializing agent ensemble...'
    }));

    try {
      // Get initial context from agents
      const context = buildAgentContext();
      
      const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
        body: {
          action: 'widget_initialize',
          userId: user?.id,
          widgetConfig: {
            name: widget.name,
            description: widget.description,
            purpose: widget.generation_prompt,
            capabilities: widget.ai_capabilities.capabilities,
            agentChain: widget.agent_chain,
            dataSources: widget.data_sources,
          },
          context,
          message: `Initialize as "${widget.name}" widget. Your purpose: ${widget.generation_prompt || widget.description}. 
          You have ${widget.agent_chain?.length || 3} specialized agents available: ${(widget.agent_chain || ['analyzer', 'executor', 'reporter']).join(', ')}.
          Provide a brief (2 sentences) welcome message about what you can do for the user. Be specific to your purpose.`
        }
      });

      if (error) throw error;

      const welcomeMessage: AgentMessage = {
        id: `init-${Date.now()}`,
        role: 'agent',
        content: data?.response || `I'm your ${widget.name} agent. I'm ready to help you with ${widget.ai_capabilities.capabilities?.join(', ') || 'analysis and automation'}.`,
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);
      setAgentStatus(prev => ({
        ...prev,
        isProcessing: false,
        currentTask: null,
        lastAction: 'Initialized',
        lastActionTime: new Date(),
      }));
    } catch (err) {
      console.error('Widget init error:', err);
      setMessages([{
        id: `init-${Date.now()}`,
        role: 'agent',
        content: `I'm ${widget.name}, ready to help. What would you like me to do?`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
      setIsInitialized(true);
    }
  };

  const buildAgentContext = () => {
    const context: Record<string, any> = {};
    
    if (widget.data_sources.includes('tasks')) {
      const activeTasks = tasks.filter(t => t.status === 'active');
      context.tasks = {
        total: tasks.length,
        active: activeTasks.length,
        highPriority: activeTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
        items: activeTasks.slice(0, 5).map(t => ({ id: t.id, title: t.title, priority: t.priority })),
      };
    }
    
    if (widget.data_sources.includes('goals')) {
      context.goals = {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        items: goals.slice(0, 3).map(g => ({ id: g.id, title: g.title, progress: g.target_value ? Math.round((g.current_value / g.target_value) * 100) : 0 })),
      };
    }
    
    if (widget.data_sources.includes('habits')) {
      const today = new Date().toISOString().split('T')[0];
      context.habits = {
        total: habits.length,
        completedToday: habits.filter(h => h.last_completed_at?.split('T')[0] === today).length,
        // Cast defensively here to avoid type mismatches from mixed upstream shapes
        items: habits.slice(0, 3).map((h: any) => ({ id: h.id, name: h.name ?? h.title, streak: h.current_streak })),
      };
    }
    
    if (widget.data_sources.includes('finance')) {
      context.finance = {
        totalBalance: accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0),
        accountCount: accounts.length,
        recentSpending: transactions.filter(t => t.amount < 0).slice(0, 5).reduce((sum, t) => sum + Math.abs(t.amount), 0),
      };
    }

    if (widget.data_sources.includes('email')) {
      // Simulated email context
      context.email = {
        unread: 8,
        urgent: 2,
        needsResponse: 4,
      };
    }
    
    return context;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    setAgentStatus(prev => ({
      ...prev,
      isProcessing: true,
      currentTask: 'Processing request...',
      activeAgents: prev.totalAssigned,
    }));

    try {
      const context = buildAgentContext();
      
      const { data, error } = await supabase.functions.invoke('atlas-orchestrator', {
        body: {
          action: 'widget_execute',
          userId: user?.id,
          widgetConfig: {
            name: widget.name,
            description: widget.description,
            purpose: widget.generation_prompt,
            capabilities: widget.ai_capabilities.capabilities,
            agentChain: widget.agent_chain,
            dataSources: widget.data_sources,
          },
          context,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role === 'agent' ? 'assistant' : m.role,
            content: m.content,
          })),
          message: userMessage.content,
        }
      });

      if (error) throw error;

      // Parse response for potential actions
      const responseText = data?.response || "I'll help you with that.";
      let action: AgentMessage['action'] | undefined;

      // Check if response contains action indicators and trigger data refresh
      const lowerResponse = responseText.toLowerCase();
      if (lowerResponse.includes('created task') || lowerResponse.includes('added task')) {
        action = { type: 'task_created' };
        useDataRefreshStore.getState().triggerRefresh('personal_items', 'widget-task-created');
      } else if (lowerResponse.includes('created goal') || lowerResponse.includes('set goal')) {
        action = { type: 'goal_created' };
        useDataRefreshStore.getState().triggerRefresh('personal_goals', 'widget-goal-created');
      } else if (lowerResponse.includes('created habit') || lowerResponse.includes('new habit')) {
        action = { type: 'habit_created' };
        useDataRefreshStore.getState().triggerRefresh('personal_habits', 'widget-habit-created');
      } else if (lowerResponse.includes('completed') || lowerResponse.includes('marked as done')) {
        action = { type: 'task_completed' };
        useDataRefreshStore.getState().triggerRefresh('personal_items', 'widget-task-completed');
      } else if (lowerResponse.includes('analysis') || lowerResponse.includes('analyzed')) {
        action = { type: 'analysis_complete' };
      }

      const agentResponse: AgentMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: responseText,
        timestamp: new Date(),
        action,
      };

      setMessages(prev => [...prev, agentResponse]);
      setAgentStatus(prev => ({
        ...prev,
        isProcessing: false,
        currentTask: null,
        lastAction: action?.type || 'Responded',
        lastActionTime: new Date(),
      }));

    } catch (err) {
      console.error('Widget execution error:', err);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Failed to process request. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
      setAgentStatus(prev => ({
        ...prev,
        isProcessing: false,
        currentTask: null,
      }));
    }
  };

  const handleQuickAction = async (action: string) => {
    setInputValue(action);
    // Auto-submit
    setTimeout(() => {
      const input = inputRef.current;
      if (input) {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        input.dispatchEvent(event);
      }
    }, 100);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Collapsed view
  if (!isExpanded) {
    return (
      <Card 
        className={cn(
          "group relative overflow-hidden border-2 transition-all hover:shadow-lg cursor-pointer",
          colors.bg, colors.border
        )}
        onClick={() => setIsExpanded(true)}
      >
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={cn("p-2 rounded-lg", colors.text, "bg-current/10")}>
                <Bot size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">{widget.name}</h3>
                  <Badge className={cn("text-[8px] px-1.5", colors.text, "bg-current/10")}>
                    <Users size={8} className="mr-1" />
                    {widget.agent_chain?.length || 3} agents
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {widget.description}
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreHorizontal size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border z-50">
                {onEdit && <DropdownMenuItem onClick={onEdit}>Edit Widget</DropdownMenuItem>}
                {onDelete && <DropdownMenuItem onClick={onDelete} className="text-destructive">Remove Widget</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="px-3 pb-3">
          {/* Agent Status Bar */}
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("w-2 h-2 rounded-full", agentStatus.isProcessing ? "bg-yellow-500 animate-pulse" : "bg-green-500")} />
            <span className="text-[10px] text-muted-foreground">
              {agentStatus.isProcessing ? agentStatus.currentTask : 'Ready'}
            </span>
          </div>

          {/* Last message preview */}
          {messages.length > 0 && (
            <div className="p-2 rounded-lg bg-background/50 border border-border/50">
              <p className="text-xs text-foreground line-clamp-2">
                {messages[messages.length - 1].content}
              </p>
            </div>
          )}

          {/* Quick action hint */}
          <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground">
            <MessageSquare size={10} />
            Click to interact
            <ChevronRight size={10} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expanded view with full chat
  return (
    <Card className={cn(
      "group relative overflow-hidden border-2 transition-all",
      colors.bg, colors.border,
      "col-span-3 row-span-2"
    )}>
      <CardHeader className="pb-2 pt-3 px-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg", colors.text, "bg-current/10")}>
              <Bot size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{widget.name}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className={cn("text-[8px] px-1.5", colors.text, "bg-current/10")}>
                        <Activity size={8} className="mr-1" />
                        {agentStatus.activeAgents}/{agentStatus.totalAssigned}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{agentStatus.activeAgents} agents active</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {widget.ai_capabilities.capabilities?.slice(0, 3).join(' • ') || 'AI Assistant'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => initializeWidget()}
              disabled={isProcessing}
            >
              <RefreshCw size={12} className={cn(isProcessing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(false)}
            >
              <X size={12} />
            </Button>
          </div>
        </div>

        {/* Agent Chain Visualization */}
        {widget.agent_chain && widget.agent_chain.length > 0 && (
          <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1">
            {widget.agent_chain.slice(0, 5).map((agent, idx) => (
              <Badge 
                key={agent} 
                variant="outline" 
                className={cn(
                  "text-[8px] shrink-0 capitalize",
                  agentStatus.isProcessing && idx < agentStatus.activeAgents && "animate-pulse"
                )}
              >
                <Zap size={8} className="mr-1" />
                {agent.replace(/-/g, ' ')}
              </Badge>
            ))}
            {widget.agent_chain.length > 5 && (
              <Badge variant="outline" className="text-[8px]">
                +{widget.agent_chain.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 flex flex-col h-[280px]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.role === 'user' && "justify-end"
                )}
              >
                {msg.role === 'agent' && (
                  <div className={cn("p-1.5 rounded-lg h-fit shrink-0", colors.text, "bg-current/10")}>
                    <Brain size={12} />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] p-2 rounded-lg text-xs",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground ml-auto" 
                    : msg.role === 'system'
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-muted/50 border border-border/50"
                )}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.action && (
                    <Badge className="mt-1.5 text-[8px]" variant="secondary">
                      <Check size={8} className="mr-1" />
                      {msg.action.type.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex gap-2">
                <div className={cn("p-1.5 rounded-lg h-fit", colors.text, "bg-current/10")}>
                  <Brain size={12} />
                </div>
                <div className="bg-muted/50 border border-border/50 p-2 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 size={12} className="animate-spin" />
                    {agentStatus.currentTask || 'Processing...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="px-3 pb-2 flex gap-1 overflow-x-auto">
          {(widget.ai_capabilities.capabilities || ['analyze', 'summarize', 'suggest']).slice(0, 4).map((cap) => (
            <Button
              key={cap}
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 shrink-0 capitalize"
              onClick={() => handleQuickAction(`${cap} my data`)}
              disabled={isProcessing}
            >
              {cap}
            </Button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-3 pt-0 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Ask ${widget.name}...`}
              className="h-8 text-xs"
              disabled={isProcessing}
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
            >
              <Send size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}