// Atlas Voice Agent Dashboard - Full Ecosystem Control

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from "@elevenlabs/react";
import { createMemoryManager, MemoryManager } from '@/lib/memory-manager';
import { voiceIntentParser } from '@/lib/voice-intent-parser';
import { useVoiceCommandBus } from '@/lib/voice-command-bus';

// Error boundary to handle ElevenLabs SDK internal React errors during HMR
class AtlasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Atlas ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold text-foreground mb-4">Atlas needs a refresh</h2>
            <p className="text-muted-foreground mb-6">
              A temporary issue occurred. Please refresh the page to reconnect.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeft,
  Radio,
  Hexagon,
  Waves,
  Activity,
  Zap,
  Search,
  Bot,
  Sparkles,
  Database,
  Users,
  Eye,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Send
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardAgents } from '@/hooks/useDashboardAgents';
import { useAtlasContext } from '@/hooks/useAtlasContext';
import { useAtlasConversations } from '@/hooks/useAtlasConversations';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useCSuiteData } from '@/hooks/useCSuiteData';
import { useDataHubController, getDomainKeyFromName, getTabFromName, getPersonaFromName } from '@/hooks/useDataHubController';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActionLogItem } from '@/components/atlas/ActionLogItem';
import { AtlasTaskProgress } from '@/components/atlas/AtlasTaskProgress';
import { CSuiteDataHub } from '@/components/csuite/CSuiteDataHub';
import { OnboardingFlow } from '@/components/onboarding';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';
// Executive, Workflow, and Enterprise features now integrated into CSuiteDataHub

const ATLAS_AGENT_ID = "agent_7501kbh21cg1eht9xtjw6kvkpm4m";

interface ActionLog {
  id: string;
  timestamp: Date;
  action: string;
  params: Record<string, unknown>;
  result: string;
  status: 'success' | 'error' | 'pending';
}

interface SearchResult {
  id: string;
  name: string;
  sector: string;
  description?: string;
  similarity?: number;
}

function AtlasPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme ?? "dark";
  const { agents, loading: agentsLoading } = useDashboardAgents({ limit: 200 });
  const { messages: conversationHistory, saveMessage, startNewSession } = useAtlasConversations({ userId: user?.id });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [synthesizedAgent, setSynthesizedAgent] = useState<any>(null);
  
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [frequencyBands, setFrequencyBands] = useState({ bass: 0, mid: 0, treble: 0 });
  const [textInput, setTextInput] = useState('');
  const lastSavedMessageRef = useRef<string>('');
  const animationRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatingPersona, setGeneratingPersona] = useState<string | null>(null);
  const [memoryManager, setMemoryManager] = useState<MemoryManager | null>(null);

  // Onboarding
  const onboarding = useOnboarding(user?.id);
  
  // C-Suite data for onboarding
  const csuiteData = useCSuiteData(user?.id);
  const totalDataItems = Object.values(csuiteData.stats).reduce((a, b) => a + b, 0);

  // Agent orchestration for task tracking
  const orchestration = useAgentOrchestration(user?.id);

  // Get active agents (those with ACTIVE or PROCESSING status)
  const activeAgents = agents.filter(a => a.status === 'ACTIVE' || a.status === 'PROCESSING').slice(0, 6);

  // Randomized balloon configurations for light mode
  const balloonConfigs = useMemo(() => {
    const colors = [
      { main: 'hsl(350 70% 60%)', stripe1: 'hsl(45 80% 65%)', stripe2: 'hsl(200 60% 55%)' },
      { main: 'hsl(200 65% 55%)', stripe1: 'hsl(45 75% 70%)', stripe2: 'hsl(350 60% 55%)' },
      { main: 'hsl(280 55% 60%)', stripe1: 'hsl(45 80% 65%)', stripe2: 'hsl(150 50% 55%)' },
      { main: 'hsl(150 50% 55%)', stripe1: 'hsl(200 60% 60%)', stripe2: 'hsl(45 75% 60%)' },
      { main: 'hsl(35 75% 55%)', stripe1: 'hsl(15 70% 50%)', stripe2: 'hsl(45 85% 65%)' },
    ];
    
    return [
      { 
        size: 50, 
        opacity: 0.75, 
        duration: 90 + Math.random() * 20, // Gentle pace - close balloon
        startY: 20 + Math.random() * 20,
        delay: Math.random() * -90,
        direction: 'rtl',
        color: colors[Math.floor(Math.random() * colors.length)]
      },
      { 
        size: 38, 
        opacity: 0.55, 
        duration: 130 + Math.random() * 30, // Slower
        startY: 30 + Math.random() * 20,
        delay: Math.random() * -130,
        direction: 'ltr',
        color: colors[Math.floor(Math.random() * colors.length)]
      },
      { 
        size: 24, 
        opacity: 0.35, 
        duration: 180 + Math.random() * 40, // Much slower - distant
        startY: 40 + Math.random() * 20,
        delay: Math.random() * -180,
        direction: 'rtl',
        color: colors[Math.floor(Math.random() * colors.length)]
      },
      { 
        size: 16, 
        opacity: 0.22, 
        duration: 240 + Math.random() * 60, // Very slow drift - far away
        startY: 50 + Math.random() * 15,
        delay: Math.random() * -240,
        direction: 'ltr',
        color: colors[Math.floor(Math.random() * colors.length)]
      },
    ];
  }, []);

  // Memoize addLog to prevent recreation on every render
  const addLog = useCallback((action: string, params: Record<string, unknown>, result: string, status: 'success' | 'error' | 'pending') => {
    const log: ActionLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action,
      params,
      result,
      status
    };
    setActionLogs(prev => [log, ...prev].slice(0, 50));
    return log.id;
  }, []);

  // Refs to stabilize callbacks used in useConversation
  const addLogRef = useRef(addLog);
  const saveMessageRef = useRef(saveMessage);
  const agentsRef = useRef(agents);
  const activeAgentsRef = useRef(activeAgents);
  const userRef = useRef(user);
  const memoryManagerRef = useRef<MemoryManager | null>(null);
  const conversationRef = useRef<any>(null);
  const pendingMemoryContextRef = useRef<string | null>(null);
  
  // Keep memoryManagerRef updated
  useEffect(() => {
    memoryManagerRef.current = memoryManager;
  }, [memoryManager]);
  
  // Keep refs updated
  useEffect(() => {
    addLogRef.current = addLog;
    saveMessageRef.current = saveMessage;
    agentsRef.current = agents;
    activeAgentsRef.current = activeAgents;
    userRef.current = user;
  }, [addLog, saveMessage, agents, activeAgents, user]);

  // Initialize memory manager when user is available
  useEffect(() => {
    if (user?.id) {
      setMemoryManager(createMemoryManager(user.id));
    }
  }, [user?.id]);

  // Memoize the conversation config to prevent React hook queue errors
  const conversationConfig = useMemo(() => ({
    clientTools: {
      // Web search using Perplexity
      webSearch: async (params: { query: string }) => {
        const logId = addLogRef.current('webSearch', params, 'Searching the web...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { action: 'web_search', query: params.query }
          });
          
          if (response.error) throw response.error;
          
          const answer = response.data?.answer || 'No results found';
          const citations = response.data?.citations || [];
          
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: `Web search complete`, status: 'success' } : l
          ));
          
          toast.success(`Web search complete for "${params.query}"`);
          return `${answer}${citations.length > 0 ? `\n\nSources: ${citations.join(', ')}` : ''}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Web search failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error('Web search failed');
          return `Error: ${msg}`;
        }
      },

      // Search agents by query
      searchAgents: async (params: { query: string }) => {
        const logId = addLogRef.current('searchAgents', params, 'Searching...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { action: 'search', query: params.query }
          });
          
          if (response.error) throw response.error;
          
          const agents = response.data?.agents || [];
          setSearchResults(agents);
          
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: `Found ${agents.length} agents`, status: 'success' } : l
          ));
          
          toast.success(`Found ${agents.length} agents matching "${params.query}"`);
          return `Found ${agents.length} agents: ${agents.map((a: any) => a.name).join(', ')}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Search failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error('Search failed');
          return `Error: ${msg}`;
        }
      },

      synthesizeAgent: async (params: { agentIds: string[]; requirements: string }) => {
        const logId = addLogRef.current('synthesizeAgent', params, 'Synthesizing...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'synthesize', 
              agentIds: params.agentIds,
              requirements: params.requirements
            }
          });
          
          if (response.error) throw response.error;
          
          const newAgent = response.data?.synthesizedAgent;
          setSynthesizedAgent(newAgent);
          
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: `Synthesized: ${newAgent?.name || 'New Agent'}`, status: 'success' } : l
          ));
          
          toast.success(`Synthesized new agent: ${newAgent?.name}`);
          return `Successfully synthesized agent: ${newAgent?.name}. Description: ${newAgent?.description}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Synthesis failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error('Synthesis failed');
          return `Error: ${msg}`;
        }
      },

      // Create a task for Atlas to track
      createTask: async (params: { title: string; description?: string; priority?: string; taskType?: string }) => {
        const logId = addLogRef.current('createTask', params, 'Creating task...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'create_task', 
              userId: userRef.current?.id,
              taskData: {
                task_title: params.title,
                task_description: params.description || '',
                task_priority: params.priority || 'medium',
                task_type: params.taskType || 'assistance',
                orchestration_mode: 'hybrid',
                assigned_agents: [],
                input_data: {},
                agent_suggestions: [],
              }
            }
          });
          
          if (response.error) throw response.error;
          
          const task = response.data?.task;
          
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: `Created: ${task?.task_title || params.title}`, status: 'success' } : l
          ));
          
          toast.success(`Task created: ${params.title}`);
          return `Task "${params.title}" has been created and is now being tracked. Priority: ${params.priority || 'medium'}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Task creation failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error('Failed to create task');
          return `Error: ${msg}`;
        }
      },

      // Update task progress
      updateTaskProgress: async (params: { taskId: string; progress: number; status?: string }) => {
        const logId = addLogRef.current('updateTaskProgress', params, 'Updating task...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'update_task', 
              userId: userRef.current?.id,
              taskId: params.taskId,
              updates: {
                progress: Math.min(100, Math.max(0, params.progress)),
                status: params.status,
              }
            }
          });
          
          if (response.error) throw response.error;
          
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: `Progress: ${params.progress}%`, status: 'success' } : l
          ));
          
          return `Task updated to ${params.progress}% complete`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Update failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Get current tasks
      getMyTasks: async () => {
        const logId = addLogRef.current('getMyTasks', {}, 'Fetching tasks...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'get_tasks', 
              userId: userRef.current?.id,
            }
          });
          
          if (response.error) throw response.error;
          
          const tasks = response.data?.tasks || [];
          const activeTasks = tasks.filter((t: any) => 
            t.status === 'pending' || t.status === 'in_progress' || t.status === 'awaiting_approval'
          );
          
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: `Found ${activeTasks.length} active tasks`, status: 'success' } : l
          ));
          
          if (activeTasks.length === 0) {
            return "You have no active tasks at the moment.";
          }
          
          const taskSummary = activeTasks.slice(0, 5).map((t: any) => 
            `• ${t.task_title} (${t.progress}% - ${t.status})`
          ).join('\n');
          
          return `You have ${activeTasks.length} active tasks:\n${taskSummary}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to fetch tasks';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Navigate to different pages - comprehensive route map
      navigateTo: (params: { page: string }) => {
        addLogRef.current('navigateTo', params, `Navigating to ${params.page}`, 'success');
        
        const routes: Record<string, string> = {
          'home': '/',
          'main': '/',
          'dashboard': '/',
          'agents': '/',
          'sonic nodes': '/',
          'import': '/import',
          'import agents': '/import',
          'auth': '/auth',
          'login': '/auth',
          'sign in': '/auth',
          'marketplace': '/integrations',
          'integrations': '/integrations',
          'governance': '/tool-governance',
          'tool governance': '/tool-governance',
          'permissions': '/user-tool-permissions',
          'user permissions': '/user-tool-permissions',
          'atlas': '/atlas',
          'command center': '/atlas',
          'voice': '/atlas',
        };
        
        const pageLower = params.page.toLowerCase();
        const route = routes[pageLower] || Object.entries(routes).find(([k]) => pageLower.includes(k))?.[1] || '/';
        toast.info(`Navigating to ${params.page}`);
        
        setTimeout(() => navigate(route), 500);
        return `Navigating to ${params.page}`;
      },

      // Alias for ElevenLabs agent tool name
      navigateToPage: (params: { page: string }) => {
        addLogRef.current('navigateToPage', params, `Navigating to ${params.page}`, 'success');
        
        const routes: Record<string, string> = {
          'home': '/',
          'main': '/',
          'dashboard': '/',
          'agents': '/',
          'sonic nodes': '/',
          'import': '/import',
          'import agents': '/import',
          'auth': '/auth',
          'login': '/auth',
          'sign in': '/auth',
          'marketplace': '/integrations',
          'integrations': '/integrations',
          'governance': '/tool-governance',
          'tool governance': '/tool-governance',
          'permissions': '/user-tool-permissions',
          'user permissions': '/user-tool-permissions',
          'atlas': '/atlas',
          'command center': '/atlas',
          'voice': '/atlas',
        };
        
        const pageLower = params.page.toLowerCase();
        const route = routes[pageLower] || Object.entries(routes).find(([k]) => pageLower.includes(k))?.[1] || '/';
        toast.info(`Navigating to ${params.page}`);
        
        setTimeout(() => navigate(route), 500);
        return `Navigated to ${params.page}`;
      },

      // Theme control
      toggleTheme: () => {
        addLogRef.current('toggleTheme', {}, 'Theme toggled', 'success');
        useVoiceCommandBus.getState().sendCommand({ type: 'toggle_theme' });
        return 'Theme toggled';
      },

      setTheme: (params: { theme: 'light' | 'dark' }) => {
        addLogRef.current('setTheme', params, `Theme set to ${params.theme}`, 'success');
        useVoiceCommandBus.getState().sendCommand({ type: 'set_theme', theme: params.theme });
        return `Theme set to ${params.theme} mode`;
      },

      // Switch persona
      switchPersona: (params: { persona: string }) => {
        const personaId = getPersonaFromName(params.persona);
        if (!personaId) {
          addLogRef.current('switchPersona', params, `Unknown persona: ${params.persona}`, 'error');
          return `Unknown persona "${params.persona}". Try: CEO, CFO, COO, CTO, CMO, etc.`;
        }
        
        useDataHubController.getState().setTargetPersona(personaId);
        addLogRef.current('switchPersona', params, `Switched to ${personaId}`, 'success');
        toast.info(`Switched to ${personaId.toUpperCase()} persona`);
        return `Switched to ${personaId.toUpperCase()} persona view`;
      },

      // Filter agents by sector or status
      filterAgents: (params: { sector?: string; status?: string }) => {
        addLogRef.current('filterAgents', params, 'Filtering agents', 'success');
        
        const sectorMap: Record<string, string> = {
          'finance': 'FINANCE', 'financial': 'FINANCE',
          'legal': 'LEGAL',
          'operations': 'OPERATIONS', 'ops': 'OPERATIONS',
          'technology': 'TECHNOLOGY', 'tech': 'TECHNOLOGY',
          'analytics': 'ANALYTICS', 'data': 'ANALYTICS',
          'research': 'RESEARCH',
          'communications': 'COMMUNICATIONS', 'comms': 'COMMUNICATIONS',
        };
        
        const sector = params.sector ? sectorMap[params.sector.toLowerCase()] : undefined;
        const status = params.status?.toUpperCase();
        
        window.dispatchEvent(new CustomEvent('voice-filter-agents', {
          detail: { sector, status }
        }));
        
        const filterDesc = [sector, status].filter(Boolean).join(' ');
        toast.info(`Filtering agents: ${filterDesc || 'all'}`);
        return `Filtering agents by ${filterDesc || 'default criteria'}`;
      },

      showNotification: (params: { title: string; message: string; type?: string }) => {
        addLogRef.current('showNotification', params, 'Notification shown', 'success');
        
        const toastType = params.type || 'info';
        if (toastType === 'success') toast.success(params.message);
        else if (toastType === 'error') toast.error(params.message);
        else if (toastType === 'warning') toast.warning(params.message);
        else toast.info(params.message);
        
        return `Displayed ${toastType} notification: ${params.title}`;
      },

      getSystemStatus: () => {
        addLogRef.current('getSystemStatus', {}, 'Status retrieved', 'success');
        // Use refs for current values
        return `System online. Agents loaded. Actions logged.`;
      },

      clearResults: () => {
        addLogRef.current('clearResults', {}, 'Results cleared', 'success');
        setSearchResults([]);
        setSynthesizedAgent(null);
        toast.info('Results cleared');
        return 'Search results and synthesis data cleared';
      },

      listSectors: () => {
        addLogRef.current('listSectors', {}, 'Sectors listed', 'success');
        const sectors = ['FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY'];
        return `Available sectors: ${sectors.join(', ')}`;
      },

      getAgentDetails: (params: { agentId: string }) => {
        const logId = addLogRef.current('getAgentDetails', params, 'Fetching details...', 'pending');
        
        // We can't access searchResults here directly, return generic response
        setActionLogs(prev => prev.map(l => 
          l.id === logId ? { ...l, result: 'Details requested', status: 'success' } : l
        ));
        return 'Please search for agents first, then I can provide details.';
      },

      // System instruction handler - allows Atlas to send internal system commands
      instructSystem: (params: { instruction: string; context?: string }) => {
        console.log("[Atlas] System instruction received:", params);
        addLogRef.current('instructSystem', params, 'Instruction processed', 'success');
        
        // Process various system-level instructions from Atlas
        const instruction = params.instruction?.toLowerCase() || '';
        
        if (instruction.includes('clear') || instruction.includes('reset')) {
          setSearchResults([]);
          setSynthesizedAgent(null);
          return 'System state cleared';
        }
        
        if (instruction.includes('status')) {
          const user = userRef.current;
          const agents = agentsRef.current;
          const activeAgents = activeAgentsRef.current;
          return `System online. User: ${user?.email || 'Unknown'}. Agents loaded: ${agents.length}. Active: ${activeAgents.length}.`;
        }
        
        // Default acknowledgment for other instructions
        return `Instruction acknowledged: ${params.instruction}`;
      },

      // ========== DATA HUB CONTROL TOOLS ==========
      
      // Switch Data Hub tab
      switchDataHubTab: (params: { tab: string }) => {
        const tabId = getTabFromName(params.tab);
        if (!tabId) {
          addLogRef.current('switchDataHubTab', params, `Unknown tab: ${params.tab}`, 'error');
          return `Unknown tab "${params.tab}". Available tabs: command, insights, library, admin`;
        }
        
        useDataHubController.getState().setActiveTab(tabId);
        addLogRef.current('switchDataHubTab', params, `Switched to ${tabId}`, 'success');
        toast.info(`Switched to ${tabId} tab`);
        return `Switched Data Hub to ${tabId} tab`;
      },

      // Open a data domain
      openDataDomain: (params: { domain: string }) => {
        const domainKey = getDomainKeyFromName(params.domain);
        if (!domainKey) {
          addLogRef.current('openDataDomain', params, `Unknown domain: ${params.domain}`, 'error');
          return `Unknown domain "${params.domain}". Available domains: communications, documents, events, financials, tasks, knowledge`;
        }
        
        useDataHubController.getState().setExpandedDomain(domainKey);
        useDataHubController.getState().setActiveTab('command');
        addLogRef.current('openDataDomain', params, `Opened ${domainKey}`, 'success');
        toast.info(`Opened ${domainKey} domain`);
        return `Opened ${domainKey} domain in Data Hub`;
      },

      // Close current domain view
      closeDataDomain: () => {
        useDataHubController.getState().setExpandedDomain(null);
        addLogRef.current('closeDataDomain', {}, 'Closed domain view', 'success');
        return 'Closed domain view';
      },

      // Run enterprise query
      runEnterpriseQuery: (params: { query: string }) => {
        const controller = useDataHubController.getState();
        controller.setEnterpriseQuery(params.query);
        controller.setTriggerEnterpriseQuery(true);
        controller.setActiveTab('insights');
        addLogRef.current('runEnterpriseQuery', params, 'Query initiated', 'success');
        toast.info('Running enterprise query...');
        return `Running enterprise query: "${params.query}"`;
      },

      // Generate report for persona
      generateDataHubReport: (params: { persona: string }) => {
        const personaId = getPersonaFromName(params.persona);
        if (!personaId) {
          addLogRef.current('generateDataHubReport', params, `Unknown persona: ${params.persona}`, 'error');
          return `Unknown persona "${params.persona}". Available personas: CEO, CFO, COO, CTO, CMO, CRO, CHRO, CLO, CCO, CISO, Chief of Staff, Chief People, Admin`;
        }
        
        useDataHubController.getState().requestReportGeneration(personaId);
        addLogRef.current('generateDataHubReport', params, `Generating ${personaId} report`, 'success');
        toast.info(`Generating ${personaId.toUpperCase()} report...`);
        return `Generating executive report for ${personaId.toUpperCase()} persona`;
      },

      // Refresh Data Hub data
      refreshDataHub: () => {
        useDataHubController.getState().requestRefresh();
        addLogRef.current('refreshDataHub', {}, 'Refresh triggered', 'success');
        toast.info('Refreshing Data Hub...');
        return 'Refreshing Data Hub data';
      },

      // Get Data Hub status
      getDataHubStatus: () => {
        const state = useDataHubController.getState();
        addLogRef.current('getDataHubStatus', {}, 'Status retrieved', 'success');
        return `Data Hub Status: Tab=${state.activeTab}, Domain=${state.expandedDomain || 'none'}, Persona=${state.targetPersona || 'default'}`;
      },

      // List available domains
      listDataDomains: () => {
        addLogRef.current('listDataDomains', {}, 'Domains listed', 'success');
        const domains = ['communications', 'documents', 'events', 'financials', 'tasks', 'knowledge'];
        return `Available data domains: ${domains.join(', ')}`;
      },

      // List available personas
      listPersonas: () => {
        addLogRef.current('listPersonas', {}, 'Personas listed', 'success');
        const personas = ['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CRO', 'CHRO', 'CLO', 'CCO', 'CISO', 'Chief of Staff', 'Chief People', 'Admin'];
        return `Available personas: ${personas.join(', ')}`;
      }
    },
    onConnect: () => {
      console.log("[Atlas] Connected to voice agent");
      addLogRef.current('system', {}, 'Connected to Atlas', 'success');
      toast.success('Atlas online');


      // Inject memory context as soon as the connection is established.
      // IMPORTANT: this is *read-only context* for the model; the app handles persistence.
      const memoryContext = pendingMemoryContextRef.current;
      if (memoryContext && conversationRef.current?.sendContextualUpdate) {
        conversationRef.current.sendContextualUpdate(
          "SYSTEM: You have been provided background context about this user. Use it to be helpful. Do NOT mention storage, databases, or authentication problems."
        );
        conversationRef.current.sendContextualUpdate(
          `[BACKGROUND CONTEXT - Do not quote verbatim]: ${memoryContext}`
        );
        console.log('[Atlas] Injected memory context via onConnect');
        pendingMemoryContextRef.current = null;
      }
    },
    onDisconnect: (reason?: any) => {
      console.log("[Atlas] Disconnected from voice agent", reason);
      addLogRef.current('system', { reason }, 'Disconnected from Atlas', 'success');
    },
    onMessage: (message: any) => {
      console.log("[Atlas] Message:", message);

      // The ElevenLabs React SDK can emit different message shapes depending on
      // enabled events + connection type. Support both:
      // 1) "event" style: message.type === 'user_transcript' | 'agent_response' ...
      // 2) "chat" style: { source, role, message }

      // --- Chat-style fallback (what you currently receive)
      if (typeof message?.message === "string") {
        const who = message.role === "agent" ? "Atlas" : "You";
        const content = message.message;
        setTranscript(`${who}: ${content}`);
        setIsTranscribing(message.role === "agent");


        // If the agent claims it has no memory or mentions auth/storage issues, immediately correct it.
        // Some agent prompts default to these disclaimers; this nudge usually fixes it.
        if (
          message.role === "agent" &&
          /\b(don't have memory|do not have memory|no memory of past|each interaction is fresh|authentication issue|unable to store)\b/i.test(content)
        ) {
          conversationRef.current?.sendContextualUpdate?.(
            "SYSTEM: Do not mention memory limitations, storage, databases, or authentication issues. You already have background context for this user in this session. Continue normally."
          );
        }
        
        // Save to conversation history (avoid duplicates)
        if (content && content !== lastSavedMessageRef.current) {
          lastSavedMessageRef.current = content;
          const role = message.role === "agent" ? 'assistant' : 'user';
          saveMessageRef.current(role, content);
          
          // Store in persistent memory
          if (memoryManagerRef.current) {
            memoryManagerRef.current.storeMessage(role, content, {
              timestamp: new Date().toISOString(),
              source: 'voice'
            });
          }
          
          // Parse user messages for UI commands
          if (message.role !== "agent") {
            const intent = voiceIntentParser.parse(content);
            if (intent) {
              console.log('🎯 Voice command detected (chat):', intent);
              useVoiceCommandBus.getState().sendCommand(intent.command);
            }
          }
        }
        return;
      }

      // --- Event-style (requires enabling transcript/response events in ElevenLabs)
      if (message?.type === "user_transcript") {
        const userText = message.user_transcription_event?.user_transcript;
        if (userText) {
          setTranscript(`You: ${userText}`);
          setIsTranscribing(false);
          
          // Save user message
          if (userText !== lastSavedMessageRef.current) {
            lastSavedMessageRef.current = userText;
            saveMessageRef.current('user', userText);
            
            // Store in persistent memory
            if (memoryManagerRef.current) {
              memoryManagerRef.current.storeMessage('user', userText, {
                timestamp: new Date().toISOString(),
                source: 'voice'
              });
            }
            
            // Parse for UI commands
            const intent = voiceIntentParser.parse(userText);
            if (intent) {
              console.log('🎯 Voice command detected:', intent);
              useVoiceCommandBus.getState().sendCommand(intent.command);
            }
          }
        }
        return;
      }

      if (message?.type === "agent_response") {
        const agentText = message.agent_response_event?.agent_response;
        if (agentText) {
          setTranscript(`Atlas: ${agentText}`);
          setIsTranscribing(true);
          
          // Save agent response
          if (agentText !== lastSavedMessageRef.current) {
            lastSavedMessageRef.current = agentText;
            saveMessageRef.current('assistant', agentText);
            
            // Store in persistent memory
            if (memoryManagerRef.current) {
              memoryManagerRef.current.storeMessage('assistant', agentText, {
                timestamp: new Date().toISOString(),
                source: 'voice'
              });
            }
          }
        }
        return;
      }

      if (message?.type === "agent_response_correction") {
        const correctedText = message.agent_response_correction_event?.corrected_agent_response;
        if (correctedText) setTranscript(`Atlas: ${correctedText}`);
        return;
      }

      if (message?.type === "response.done") {
        setIsTranscribing(false);
      }
    },
    onError: (error: any) => {
      console.error("[Atlas] Error:", error);
      addLogRef.current('system', { error }, 'Connection error', 'error');
      toast.error('Atlas connection error');
    },
  }), [navigate]); // Only recreate if navigate changes

  const conversation = useConversation({
    ...conversationConfig,
    micMuted: isMuted,
  });
  // keep a stable ref for callbacks inside useMemo'd handlers
  conversationRef.current = conversation;

  const startConversation = useCallback(async () => {
    // Guard against multiple activation attempts
    if (isConnecting || conversation.status === 'connected') {
      console.log("[Atlas] Already connecting or connected, ignoring");
      return;
    }
    
    setIsConnecting(true);
    try {
      console.log("[Atlas] Requesting microphone permission...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[Atlas] Microphone permission granted, fetching signed URL...");

      // Fetch signed URL from backend (use fetch instead of supabase.functions.invoke to avoid hanging requests)
      // NOTE: Some browsers/extensions can delay function calls; allow a generous timeout.
      const controller = new AbortController();
      const t = window.setTimeout(() => controller.abort(), 30000);
      let signedUrlResp: any;
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-conversation-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          signal: controller.signal,
        });

        signedUrlResp = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(signedUrlResp?.error || `Token request failed (${res.status})`);
        }
      } catch (e: any) {
        // AbortError => our timeout fired
        if (e?.name === "AbortError") {
          throw new Error("Token request timed out (30s). Check network/adblock and try again.");
        }
        throw e;
      } finally {
        window.clearTimeout(t);
      }

      if (!signedUrlResp?.signed_url) {
        console.error("[Atlas] Failed to get signed URL:", signedUrlResp);
        throw new Error(signedUrlResp?.error || "Failed to authenticate with voice service");
      }
      
      console.log("[Atlas] Got signed URL, starting session...");

      const userDisplayName =
        (user?.user_metadata as any)?.display_name ||
        (user?.user_metadata as any)?.full_name ||
        user?.email?.split("@")[0] ||
        "Operator";

      // Load memory context before starting
      let memoryContext: string | undefined;
      if (memoryManager) {
        try {
          const context = await memoryManager.buildContext();
          if (context) {
            memoryContext = context;
            pendingMemoryContextRef.current = context;
            console.log("[Atlas] Loaded memory context:", context.substring(0, 100) + "...");
          }
        } catch (e) {
          console.warn("[Atlas] Failed to load memory context:", e);
        }
      }

      // Build session config
      // NOTE: When using a signedUrl, we must explicitly use the WebSocket connection type.
      // Otherwise the SDK may default to WebRTC and sit in "connecting".
      const sessionConfig: any = {
        signedUrl: signedUrlResp.signed_url,
        connectionType: "websocket",
        userId: user?.id,
        dynamicVariables: {
          _userDisplayName_: userDisplayName,
        },
      };

      // Failsafe: if we never connect, surface a useful error
      const connectTimeout = window.setTimeout(() => {
        if (conversation.status !== "connected") {
          console.error("[Atlas] Connection timed out");
          toast.error("Atlas connection timed out. Please try again.");
        }
      }, 15000);

      await conversation.startSession(sessionConfig);
      window.clearTimeout(connectTimeout);
      console.log("[Atlas] Session started successfully");
    } catch (error) {
      console.error("[Atlas] Failed to start:", error);
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to start Atlas: ${errMsg}`);
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, isConnecting, user?.id, user?.email, user?.user_metadata, memoryManager]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const toggleMute = useCallback(async () => {
    if (isMuted) {
      await conversation.setVolume({ volume: 1 });
    } else {
      await conversation.setVolume({ volume: 0 });
    }
    setIsMuted(!isMuted);
  }, [conversation, isMuted]);

  const isConnected = conversation.status === "connected";


  // Real-time state streaming to Atlas
  const sendContextualUpdate = useCallback((text: string) => {
    if (isConnected) {
      conversation.sendContextualUpdate(text);
    }
  }, [isConnected, conversation]);

  const { logActivity } = useAtlasContext({
    agents,
    isConnected,
    sendContextualUpdate,
    searchResults,
    synthesizedAgent
  });

  // Log significant activities
  useEffect(() => {
    if (searchResults.length > 0) {
      logActivity(`Search: found ${searchResults.length} agents`);
    }
  }, [searchResults, logActivity]);

  useEffect(() => {
    if (synthesizedAgent) {
      logActivity(`Synthesized: ${synthesizedAgent.name}`);
    }
  }, [synthesizedAgent, logActivity]);

  // Keepalive: send user activity ping every 25 seconds to prevent WebSocket timeout
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      try {
        // sendUserActivity keeps the connection alive without interrupting the agent
        (conversation as any).sendUserActivity?.();
      } catch (e) {
        console.log("[Atlas] Keepalive ping failed (may not be supported):", e);
      }
    }, 25000);
    
    return () => clearInterval(interval);
  }, [isConnected, conversation]);
  // Sync audio visualization to actual voice output using ElevenLabs APIs
  useEffect(() => {
    if (!isConnected) {
      setAudioLevels(new Array(20).fill(0));
      setInputVolume(0);
      setOutputVolume(0);
      setFrequencyBands({ bass: 0, mid: 0, treble: 0 });
      return;
    }

    const updateAudioLevels = () => {
      // Get real-time volume levels from ElevenLabs
      const inVol = conversation.getInputVolume();
      const outVol = conversation.getOutputVolume();
      setInputVolume(inVol);
      setOutputVolume(outVol);
      
      // Get frequency data for advanced visualization
      const outputFreq = conversation.getOutputByteFrequencyData();
      const inputFreq = conversation.getInputByteFrequencyData();
      
      // Use output frequency when speaking, input when listening
      const frequencyData = conversation.isSpeaking ? outputFreq : inputFreq;
      
      if (frequencyData && frequencyData.length > 0) {
        // Calculate frequency bands (bass, mid, treble)
        const third = Math.floor(frequencyData.length / 3);
        const bassSum = frequencyData.slice(0, third).reduce((a, b) => a + b, 0) / third / 255;
        const midSum = frequencyData.slice(third, third * 2).reduce((a, b) => a + b, 0) / third / 255;
        const trebleSum = frequencyData.slice(third * 2).reduce((a, b) => a + b, 0) / third / 255;
        setFrequencyBands({ bass: bassSum, mid: midSum, treble: trebleSum });
        
        // Sample 20 points from the frequency data
        const newLevels = Array.from({ length: 20 }, (_, i) => {
          const index = Math.floor((i / 20) * frequencyData.length);
          return frequencyData[index] / 255;
        });
        setAudioLevels(newLevels);
      } else {
        // Subtle idle animation when not speaking - use stable timestamp
        const now = performance.now();
        setAudioLevels(
          Array.from({ length: 20 }, (_, i) => 
            0.1 + Math.sin(now / 500 + i * 0.3) * 0.05
          )
        );
        setFrequencyBands({ bass: 0.1, mid: 0.1, treble: 0.1 });
      }
      
      animationRef.current = requestAnimationFrame(updateAudioLevels);
    };

    animationRef.current = requestAnimationFrame(updateAudioLevels);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isConnected, conversation]);

  // Onboarding handlers
  const handleOnboardingUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleOnboardingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    for (const file of Array.from(files)) {
      await csuiteData.uploadFile(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOnboardingGenerateReport = async (persona: string) => {
    setGeneratingPersona(persona);
    await csuiteData.generateReport(persona);
    setGeneratingPersona(null);
  };

  // Show onboarding for new users
  if (onboarding.showOnboarding) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.pptx"
          onChange={handleOnboardingFileChange}
          className="hidden"
        />
        <OnboardingFlow
          currentStep={onboarding.currentStep}
          onNext={onboarding.nextStep}
          onPrev={onboarding.prevStep}
          onSkip={onboarding.skipOnboarding}
          onComplete={onboarding.completeOnboarding}
          onGoToStep={onboarding.goToStep}
          hasConnectedData={onboarding.hasConnectedData}
          hasGeneratedReport={onboarding.hasGeneratedReport}
          hasAllocatedAgents={onboarding.hasAllocatedAgents}
          selectedPersona={onboarding.selectedPersona}
          onMarkDataConnected={onboarding.markDataConnected}
          onMarkReportGenerated={onboarding.markReportGenerated}
          onMarkAgentsAllocated={onboarding.markAgentsAllocated}
          totalDataItems={totalDataItems}
          onUploadFile={handleOnboardingUpload}
          onGenerateReport={handleOnboardingGenerateReport}
          isGenerating={generatingPersona !== null}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Full Page Star System Background - Dark Mode Only */}
      {theme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Deep space base */}
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, 
                hsl(240 30% 8%) 0%, 
                hsl(250 35% 4%) 50%, 
                hsl(260 40% 2%) 100%)`
            }}
          />
          {/* Milky Way band - sweeping across */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: `linear-gradient(135deg, 
                transparent 10%,
                hsl(270 40% 15% / 0.2) 20%,
                hsl(250 50% 25% / 0.3) 30%,
                hsl(220 60% 30% / 0.35) 40%,
                hsl(200 55% 35% / 0.3) 50%,
                hsl(270 45% 25% / 0.2) 60%,
                transparent 75%)`
            }}
          />
          {/* Nebula clouds */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: `
                radial-gradient(ellipse 60% 40% at 15% 30%, hsl(320 60% 30% / 0.25) 0%, transparent 70%),
                radial-gradient(ellipse 50% 35% at 85% 60%, hsl(280 55% 35% / 0.2) 0%, transparent 65%),
                radial-gradient(ellipse 40% 30% at 50% 20%, hsl(200 65% 40% / 0.15) 0%, transparent 60%),
                radial-gradient(ellipse 45% 25% at 70% 80%, hsl(270 50% 30% / 0.2) 0%, transparent 60%)`
            }}
          />
          {/* Dense distant stars */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(0.5px 0.5px at 3% 5%, hsl(0 0% 100% / 0.7) 100%, transparent),
                radial-gradient(0.5px 0.5px at 8% 15%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 15% 8%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 22% 25%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 28% 12%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 35% 35%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 42% 5%, hsl(0 0% 100% / 0.7) 100%, transparent),
                radial-gradient(0.5px 0.5px at 48% 22%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 55% 45%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 62% 18%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 68% 55%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 75% 8%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 82% 32%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 88% 65%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 95% 15%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 5% 75%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 12% 88%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 25% 72%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 38% 95%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 52% 78%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 65% 92%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 78% 82%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 92% 88%, hsl(0 0% 100% / 0.6) 100%, transparent)
              `
            }}
          />
          {/* Medium colored stars */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(1px 1px at 5% 12%, hsl(200 100% 85%) 100%, transparent),
                radial-gradient(1px 1px at 18% 38%, hsl(35 100% 85%) 100%, transparent),
                radial-gradient(1px 1px at 32% 62%, hsl(0 0% 100%) 100%, transparent),
                radial-gradient(1px 1px at 45% 15%, hsl(270 80% 88%) 100%, transparent),
                radial-gradient(1px 1px at 58% 75%, hsl(180 90% 82%) 100%, transparent),
                radial-gradient(1px 1px at 72% 28%, hsl(0 0% 100%) 100%, transparent),
                radial-gradient(1px 1px at 85% 52%, hsl(220 85% 88%) 100%, transparent),
                radial-gradient(1px 1px at 15% 85%, hsl(35 90% 82%) 100%, transparent),
                radial-gradient(1px 1px at 42% 92%, hsl(0 0% 100%) 100%, transparent),
                radial-gradient(1px 1px at 68% 8%, hsl(200 95% 85%) 100%, transparent),
                radial-gradient(1px 1px at 92% 72%, hsl(270 85% 85%) 100%, transparent),
                radial-gradient(1px 1px at 8% 48%, hsl(180 90% 88%) 100%, transparent)
              `,
              animation: 'twinkle 4s ease-in-out infinite alternate'
            }}
          />
          {/* Bright prominent stars */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(2px 2px at 10% 20%, hsl(0 0% 100%) 50%, hsl(200 100% 80% / 0.4) 100%, transparent),
                radial-gradient(2px 2px at 30% 45%, hsl(0 0% 100%) 50%, hsl(35 100% 80% / 0.4) 100%, transparent),
                radial-gradient(2px 2px at 55% 25%, hsl(0 0% 100%) 50%, hsl(270 90% 85% / 0.4) 100%, transparent),
                radial-gradient(2px 2px at 75% 65%, hsl(0 0% 100%) 50%, hsl(180 95% 82% / 0.4) 100%, transparent),
                radial-gradient(2px 2px at 90% 35%, hsl(0 0% 100%) 50%, hsl(220 90% 85% / 0.4) 100%, transparent),
                radial-gradient(1.5px 1.5px at 20% 70%, hsl(0 0% 100%) 50%, hsl(0 0% 90% / 0.4) 100%, transparent),
                radial-gradient(1.5px 1.5px at 48% 85%, hsl(0 0% 100%) 50%, hsl(200 85% 85% / 0.4) 100%, transparent),
                radial-gradient(1.5px 1.5px at 82% 15%, hsl(0 0% 100%) 50%, hsl(35 90% 82% / 0.4) 100%, transparent)
              `,
              animation: 'twinkle 2.5s ease-in-out infinite'
            }}
          />
          {/* Star clusters - scattered naturally */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: `
                radial-gradient(0.8px 0.8px at 23% 28%, white 100%, transparent),
                radial-gradient(0.8px 0.8px at 31% 42%, hsl(0 0% 90%) 100%, transparent),
                radial-gradient(0.8px 0.8px at 27% 51%, white 100%, transparent),
                radial-gradient(0.8px 0.8px at 41% 35%, hsl(0 0% 95%) 100%, transparent),
                radial-gradient(0.8px 0.8px at 36% 58%, white 100%, transparent),
                radial-gradient(0.8px 0.8px at 49% 39%, hsl(0 0% 90%) 100%, transparent),
                radial-gradient(0.8px 0.8px at 44% 62%, white 100%, transparent),
                radial-gradient(0.8px 0.8px at 53% 47%, hsl(0 0% 95%) 100%, transparent),
                radial-gradient(0.8px 0.8px at 59% 33%, white 100%, transparent),
                radial-gradient(0.8px 0.8px at 47% 71%, hsl(0 0% 90%) 100%, transparent),
                radial-gradient(0.8px 0.8px at 64% 44%, white 100%, transparent),
                radial-gradient(0.8px 0.8px at 56% 56%, hsl(0 0% 95%) 100%, transparent)
              `
            }}
          />
          
          {/* Shooting Stars - Rare occurrences with varied positions */}
          <div 
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{ 
              top: '8%',
              left: '15%',
              boxShadow: '0 0 8px 3px rgba(255,255,255,0.8)',
              animation: 'shooting-star-1 40s ease-in-out infinite',
              animationDelay: '0s'
            }}
          />
          <div 
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{ 
              top: '45%',
              left: '85%',
              boxShadow: '0 0 8px 3px rgba(255,255,255,0.8)',
              animation: 'shooting-star-2 55s ease-in-out infinite',
              animationDelay: '15s'
            }}
          />
          <div 
            className="absolute w-1.5 h-1.5 bg-white rounded-full"
            style={{ 
              top: '22%',
              left: '55%',
              boxShadow: '0 0 6px 2px rgba(255,255,255,0.7)',
              animation: 'shooting-star-3 70s ease-in-out infinite',
              animationDelay: '35s'
            }}
          />
          <div 
            className="absolute w-1.5 h-1.5 bg-white rounded-full"
            style={{ 
              top: '65%',
              left: '30%',
              boxShadow: '0 0 6px 2px rgba(255,255,255,0.7)',
              animation: 'shooting-star-4 65s ease-in-out infinite',
              animationDelay: '50s'
            }}
          />
          <div 
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{ 
              top: '12%',
              left: '70%',
              boxShadow: '0 0 8px 3px rgba(255,255,255,0.8)',
              animation: 'shooting-star-5 80s ease-in-out infinite',
              animationDelay: '25s'
            }}
          />
          
          {/* === SOLAR SYSTEM - All planets with realistic relative orbits === */}
          
          {/* Mercury - Closest, fastest orbit */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(50% - 200px)',
            width: '160px',
            height: '160px',
            marginTop: '-80px',
            marginLeft: '-80px',
            animation: 'orbit-rotation 24s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-5px', marginTop: '-5px' }}>
              <svg width="10" height="10" viewBox="0 0 20 20" style={{ filter: 'drop-shadow(0 0 3px hsl(30 30% 60% / 0.5))' }}>
                <defs>
                  <radialGradient id="mercurySurface" cx="35%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="hsl(30 15% 65%)" />
                    <stop offset="100%" stopColor="hsl(30 10% 40%)" />
                  </radialGradient>
                </defs>
                <circle cx="10" cy="10" r="9" fill="url(#mercurySurface)" />
                <circle cx="6" cy="7" r="2" fill="hsl(30 10% 35%)" opacity="0.4" />
                <circle cx="12" cy="12" r="1.5" fill="hsl(30 10% 38%)" opacity="0.3" />
              </svg>
            </div>
          </div>
          
          {/* Venus - Second planet */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(50% - 200px)',
            width: '220px',
            height: '220px',
            marginTop: '-110px',
            marginLeft: '-110px',
            animation: 'orbit-rotation 62s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-7px', marginTop: '-7px' }}>
              <svg width="14" height="14" viewBox="0 0 28 28" style={{ filter: 'drop-shadow(0 0 4px hsl(45 60% 70% / 0.5))' }}>
                <defs>
                  <radialGradient id="venusSurface" cx="35%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="hsl(45 50% 75%)" />
                    <stop offset="100%" stopColor="hsl(35 40% 55%)" />
                  </radialGradient>
                </defs>
                <circle cx="14" cy="14" r="13" fill="url(#venusSurface)" />
                {/* Thick atmosphere clouds */}
                <ellipse cx="10" cy="10" rx="5" ry="3" fill="hsl(45 30% 80%)" opacity="0.5" />
                <ellipse cx="16" cy="16" rx="6" ry="3" fill="hsl(40 35% 78%)" opacity="0.4" />
              </svg>
            </div>
          </div>
          
          {/* Earth - Third planet */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(50% - 200px)',
            width: '300px',
            height: '300px',
            marginTop: '-150px',
            marginLeft: '-150px',
            animation: 'orbit-rotation 100s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-10px', marginTop: '-10px' }}>
              <svg width="20" height="20" viewBox="0 0 40 40" style={{ filter: 'drop-shadow(0 0 6px hsl(200 80% 50% / 0.6))' }}>
                <defs>
                  <radialGradient id="earthOcean" cx="35%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="hsl(200 70% 55%)" />
                    <stop offset="100%" stopColor="hsl(210 80% 35%)" />
                  </radialGradient>
                </defs>
                <circle cx="20" cy="20" r="18" fill="url(#earthOcean)" />
                <ellipse cx="12" cy="12" rx="5" ry="4" fill="hsl(120 35% 40%)" opacity="0.9" />
                <ellipse cx="14" cy="24" rx="2.5" ry="5" fill="hsl(120 35% 38%)" opacity="0.9" />
                <ellipse cx="22" cy="15" rx="3" ry="2.5" fill="hsl(120 30% 42%)" opacity="0.9" />
                <ellipse cx="28" cy="12" rx="5" ry="4" fill="hsl(120 32% 40%)" opacity="0.9" />
                <ellipse cx="15" cy="10" rx="4" ry="1.5" fill="white" opacity="0.35" />
              </svg>
            </div>
            {/* Moon orbiting Earth */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              marginLeft: '-10px',
              marginTop: '-10px',
              width: '30px',
              height: '30px',
              animation: 'moon-around-earth 8s linear infinite',
            }}>
              <svg width="6" height="6" viewBox="0 0 12 12" style={{ filter: 'drop-shadow(0 0 2px hsl(0 0% 80% / 0.4))' }}>
                <circle cx="6" cy="6" r="5" fill="hsl(40 5% 75%)" />
                <circle cx="4" cy="4" r="1" fill="hsl(40 5% 55%)" opacity="0.4" />
              </svg>
            </div>
          </div>
          
          {/* Mars - Fourth planet */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(50% - 200px)',
            width: '380px',
            height: '380px',
            marginTop: '-190px',
            marginLeft: '-190px',
            animation: 'orbit-rotation 188s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-6px', marginTop: '-6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 0 4px hsl(15 70% 50% / 0.5))' }}>
                <defs>
                  <radialGradient id="marsSurface" cx="35%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="hsl(15 60% 55%)" />
                    <stop offset="100%" stopColor="hsl(10 50% 35%)" />
                  </radialGradient>
                </defs>
                <circle cx="12" cy="12" r="11" fill="url(#marsSurface)" />
                {/* Polar ice cap */}
                <ellipse cx="12" cy="4" rx="5" ry="2" fill="hsl(0 0% 90%)" opacity="0.6" />
                {/* Dark regions */}
                <ellipse cx="8" cy="12" rx="3" ry="4" fill="hsl(15 40% 30%)" opacity="0.3" />
              </svg>
            </div>
          </div>
          
          {/* Jupiter - Fifth planet, largest */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(50% - 200px)',
            width: '500px',
            height: '500px',
            marginTop: '-250px',
            marginLeft: '-250px',
            animation: 'orbit-rotation 1186s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-14px', marginTop: '-14px' }}>
              <svg width="28" height="28" viewBox="0 0 56 56" style={{ filter: 'drop-shadow(0 0 8px hsl(30 50% 60% / 0.5))' }}>
                <defs>
                  <linearGradient id="jupiterBands" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(35 45% 70%)" />
                    <stop offset="20%" stopColor="hsl(25 50% 55%)" />
                    <stop offset="35%" stopColor="hsl(40 40% 75%)" />
                    <stop offset="50%" stopColor="hsl(30 55% 50%)" />
                    <stop offset="65%" stopColor="hsl(35 45% 70%)" />
                    <stop offset="80%" stopColor="hsl(20 50% 55%)" />
                    <stop offset="100%" stopColor="hsl(35 40% 65%)" />
                  </linearGradient>
                </defs>
                <circle cx="28" cy="28" r="26" fill="url(#jupiterBands)" />
                {/* Great Red Spot */}
                <ellipse cx="20" cy="30" rx="5" ry="3" fill="hsl(10 60% 50%)" opacity="0.7" />
              </svg>
            </div>
          </div>
          
          {/* Saturn - Sixth planet, with rings */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(50% - 200px)',
            width: '620px',
            height: '620px',
            marginTop: '-310px',
            marginLeft: '-310px',
            animation: 'orbit-rotation 2946s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-20px', marginTop: '-12px' }}>
              <svg width="40" height="24" viewBox="0 0 80 48" style={{ filter: 'drop-shadow(0 0 6px hsl(45 50% 70% / 0.5))' }}>
                <defs>
                  <linearGradient id="saturnBands" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(45 40% 75%)" />
                    <stop offset="30%" stopColor="hsl(40 45% 65%)" />
                    <stop offset="60%" stopColor="hsl(50 35% 70%)" />
                    <stop offset="100%" stopColor="hsl(45 40% 60%)" />
                  </linearGradient>
                </defs>
                {/* Rings behind */}
                <ellipse cx="40" cy="24" rx="38" ry="8" fill="none" stroke="hsl(45 30% 70%)" strokeWidth="3" opacity="0.4" />
                <ellipse cx="40" cy="24" rx="32" ry="6" fill="none" stroke="hsl(50 35% 75%)" strokeWidth="4" opacity="0.5" />
                {/* Planet */}
                <ellipse cx="40" cy="24" rx="18" ry="16" fill="url(#saturnBands)" />
                {/* Rings in front */}
                <path d="M 58 24 A 38 8 0 0 1 22 24" fill="none" stroke="hsl(45 30% 70%)" strokeWidth="3" opacity="0.5" />
                <path d="M 54 24 A 32 6 0 0 1 26 24" fill="none" stroke="hsl(50 35% 75%)" strokeWidth="4" opacity="0.6" />
              </svg>
            </div>
          </div>
          
          {/* Uranus - Seventh planet */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(50% - 200px)',
            width: '740px',
            height: '740px',
            marginTop: '-370px',
            marginLeft: '-370px',
            animation: 'orbit-rotation 8401s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-8px', marginTop: '-8px' }}>
              <svg width="16" height="16" viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 0 5px hsl(180 50% 70% / 0.5))' }}>
                <defs>
                  <radialGradient id="uranusSurface" cx="35%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="hsl(180 45% 75%)" />
                    <stop offset="100%" stopColor="hsl(185 50% 55%)" />
                  </radialGradient>
                </defs>
                <circle cx="16" cy="16" r="14" fill="url(#uranusSurface)" />
                {/* Subtle banding */}
                <ellipse cx="16" cy="12" rx="10" ry="2" fill="hsl(175 40% 80%)" opacity="0.3" />
              </svg>
            </div>
          </div>
          
          {/* Neptune - Eighth planet, outermost */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(50% - 200px)',
            width: '860px',
            height: '860px',
            marginTop: '-430px',
            marginLeft: '-430px',
            animation: 'orbit-rotation 16480s linear infinite',
            pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', top: '0', left: '50%', marginLeft: '-7px', marginTop: '-7px' }}>
              <svg width="14" height="14" viewBox="0 0 28 28" style={{ filter: 'drop-shadow(0 0 5px hsl(220 60% 60% / 0.5))' }}>
                <defs>
                  <radialGradient id="neptuneSurface" cx="35%" cy="35%" r="60%">
                    <stop offset="0%" stopColor="hsl(220 55% 65%)" />
                    <stop offset="100%" stopColor="hsl(225 60% 45%)" />
                  </radialGradient>
                </defs>
                <circle cx="14" cy="14" r="12" fill="url(#neptuneSurface)" />
                {/* Dark spot */}
                <ellipse cx="10" cy="12" rx="3" ry="2" fill="hsl(230 50% 35%)" opacity="0.4" />
                {/* Bright clouds */}
                <ellipse cx="16" cy="8" rx="4" ry="1" fill="hsl(200 60% 80%)" opacity="0.5" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Full Page Sky Background - Light Mode Only */}
      {theme === 'light' && (
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Sky gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, 
                hsl(200 60% 85%) 0%, 
                hsl(200 50% 90%) 30%,
                hsl(40 40% 92%) 70%,
                hsl(35 45% 88%) 100%)`
            }}
          />
          
          {/* Sun with rays */}
          <div 
            className="absolute top-[8%] right-[15%] w-24 h-24"
            style={{ animation: 'sun-pulse 4s ease-in-out infinite' }}
          >
            {/* Sun glow */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, 
                  hsl(45 100% 70% / 0.8) 0%, 
                  hsl(40 90% 75% / 0.4) 40%,
                  transparent 70%)`
              }}
            />
            {/* Sun core */}
            <div 
              className="absolute inset-4 rounded-full"
              style={{
                background: `radial-gradient(circle, 
                  hsl(48 100% 85%) 0%, 
                  hsl(45 95% 75%) 100%)`
              }}
            />
            {/* Sun rays */}
            <div 
              className="absolute -inset-8 opacity-30"
              style={{
                background: `conic-gradient(from 0deg,
                  transparent 0deg,
                  hsl(45 90% 70% / 0.5) 10deg,
                  transparent 20deg,
                  hsl(40 85% 75% / 0.4) 40deg,
                  transparent 50deg,
                  hsl(45 90% 70% / 0.5) 70deg,
                  transparent 80deg,
                  hsl(40 85% 75% / 0.4) 100deg,
                  transparent 110deg,
                  hsl(45 90% 70% / 0.5) 130deg,
                  transparent 140deg,
                  hsl(40 85% 75% / 0.4) 160deg,
                  transparent 170deg,
                  hsl(45 90% 70% / 0.5) 190deg,
                  transparent 200deg,
                  hsl(40 85% 75% / 0.4) 220deg,
                  transparent 230deg,
                  hsl(45 90% 70% / 0.5) 250deg,
                  transparent 260deg,
                  hsl(40 85% 75% / 0.4) 280deg,
                  transparent 290deg,
                  hsl(45 90% 70% / 0.5) 310deg,
                  transparent 320deg,
                  hsl(40 85% 75% / 0.4) 340deg,
                  transparent 360deg)`,
                animation: 'spin 60s linear infinite'
              }}
            />
          </div>
          
          {/* Clouds layer 1 - floats right to left */}
          <div 
            className="absolute top-[12%] w-48 h-16 opacity-70"
            style={{ animation: 'cloud-float-1 80s linear infinite' }}
          >
            <div className="absolute inset-0 rounded-full bg-white/80 blur-md" />
            <div className="absolute top-2 left-8 w-24 h-12 rounded-full bg-white/90 blur-sm" />
            <div className="absolute top-1 left-20 w-20 h-10 rounded-full bg-white/85 blur-sm" />
          </div>
          
          {/* Clouds layer 2 - floats left to right */}
          <div 
            className="absolute top-[18%] w-36 h-14 opacity-60"
            style={{ animation: 'cloud-float-2 100s linear infinite' }}
          >
            <div className="absolute inset-0 rounded-full bg-white/75 blur-md" />
            <div className="absolute top-1 left-6 w-20 h-10 rounded-full bg-white/85 blur-sm" />
          </div>
          
          {/* Clouds layer 3 - floats right to left, slower */}
          <div 
            className="absolute top-[25%] w-32 h-12 opacity-50"
            style={{ animation: 'cloud-float-3 120s linear infinite' }}
          >
            <div className="absolute inset-0 rounded-full bg-white/70 blur-lg" />
          </div>
          
          {/* Randomized Hot Air Balloons */}
          {balloonConfigs.map((balloon, index) => (
            <div 
              key={index}
              className="absolute"
              style={{ 
                bottom: `${balloon.startY}%`,
                opacity: balloon.opacity,
                animation: `balloon-float-${balloon.direction} ${balloon.duration}s linear infinite`,
                animationDelay: `${balloon.delay}s`
              }}
            >
              <svg 
                width={balloon.size} 
                height={balloon.size * 1.4} 
                viewBox="0 0 50 70" 
                className={balloon.size > 30 ? 'drop-shadow-lg' : balloon.size > 20 ? 'drop-shadow-md' : 'drop-shadow-sm'}
              >
                <ellipse cx="25" cy="22" rx="22" ry="24" fill={balloon.color.main} />
                {balloon.size > 20 && (
                  <>
                    <path d="M 8 18 Q 25 45 42 18" stroke={balloon.color.stripe1} strokeWidth="4" fill="none" />
                    <path d="M 12 12 Q 25 38 38 12" stroke={balloon.color.stripe2} strokeWidth="3" fill="none" />
                  </>
                )}
                <line x1="12" y1="42" x2="18" y2="58" stroke="hsl(30 30% 35%)" strokeWidth="1" />
                <line x1="38" y1="42" x2="32" y2="58" stroke="hsl(30 30% 35%)" strokeWidth="1" />
                <line x1="25" y1="46" x2="25" y2="58" stroke="hsl(30 30% 35%)" strokeWidth="1" />
                <rect x="16" y="58" width="18" height="10" rx="2" fill="hsl(30 40% 45%)" />
                {balloon.size > 30 && (
                  <rect x="16" y="58" width="18" height="3" rx="1" fill="hsl(30 35% 55%)" />
                )}
              </svg>
            </div>
          ))}
          
          
          {/* Soft horizon hint */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[15%] opacity-30"
            style={{
              background: `linear-gradient(180deg, 
                transparent 0%,
                hsl(200 40% 80% / 0.3) 60%,
                hsl(200 45% 75% / 0.5) 100%)`
            }}
          />
        </div>
      )}
      {/* Header */}
      <header className="h-14 bg-card/95 border-b border-border flex items-center justify-between px-6 shadow-sm relative z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
              {/* Middle rotating ring */}
              <div className="absolute inset-1 rounded-full border border-primary/50 animate-spin" style={{ animationDuration: '8s' }} />
              {/* Core hexagon */}
              <div className="relative z-10 animate-spin" style={{ animationDuration: '12s' }}>
                <Hexagon size={28} className="text-primary/70 drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                <Radio size={12} className="absolute inset-0 m-auto text-primary" />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md" />
            </div>
            <div>
              <h1 className="font-orbitron text-lg tracking-wider text-foreground">
                <span className="text-primary text-glow-cyan">ATLAS</span>
                <span className="text-muted-foreground mx-1">:</span>
                <span className="text-secondary text-glow-amber">COMMAND CENTER</span>
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest">FULL ECOSYSTEM CONTROL</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border hover:bg-muted transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? (
              <Moon size={14} className="text-primary" />
            ) : (
              <Sun size={14} className="text-secondary" />
            )}
            <span className="text-[10px] font-mono text-muted-foreground">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>

          {/* State Streaming Indicator */}
          {isConnected && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10 border border-primary/30">
              <Eye size={12} className="text-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary">CONTEXT SYNC</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi size={14} className="text-success" />
            ) : (
              <WifiOff size={14} className="text-muted-foreground" />
            )}
            <span className="text-xs font-mono text-muted-foreground">
              {user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Operator'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10">
        {/* Left Panel - Visualizer & Controls (Fixed position) */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Central Visualizer */}
          <div className="relative w-64 h-64 mb-6">
            {/* Atmospheric Background */}
            <div className="absolute -inset-12 rounded-full overflow-hidden pointer-events-none">
              {theme === 'dark' ? (
                /* Dark Mode: Transparent - uses full page star background */
                <div className="absolute inset-0" />
              ) : (
                /* Light Mode: Soft ethereal glow */
                <div className="absolute inset-0">
                  {/* Soft radial gradient */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, 
                        hsl(210 30% 94% / 0.95) 0%, 
                        hsl(220 25% 90% / 0.8) 40%, 
                        transparent 70%)`
                    }}
                  />
                  {/* Soft light rays */}
                  <div 
                    className="absolute inset-0 rounded-full opacity-40"
                    style={{
                      background: `conic-gradient(from 0deg at 50% 50%,
                        transparent 0deg,
                        hsl(36 60% 75% / 0.3) 20deg,
                        transparent 40deg,
                        hsl(173 50% 70% / 0.25) 80deg,
                        transparent 100deg,
                        hsl(201 55% 72% / 0.3) 140deg,
                        transparent 160deg,
                        hsl(36 55% 78% / 0.25) 200deg,
                        transparent 220deg,
                        hsl(222 45% 70% / 0.3) 260deg,
                        transparent 280deg,
                        hsl(173 50% 75% / 0.25) 320deg,
                        transparent 360deg)`,
                      animation: 'spin 30s linear infinite'
                    }}
                  />
                  {/* Floating particles */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage: `
                        radial-gradient(2px 2px at 15% 20%, hsl(173 60% 45% / 0.4) 100%, transparent),
                        radial-gradient(2px 2px at 35% 70%, hsl(222 55% 50% / 0.35) 100%, transparent),
                        radial-gradient(2px 2px at 65% 25%, hsl(36 65% 55% / 0.4) 100%, transparent),
                        radial-gradient(2px 2px at 80% 65%, hsl(201 60% 48% / 0.35) 100%, transparent),
                        radial-gradient(2px 2px at 25% 85%, hsl(173 55% 50% / 0.3) 100%, transparent),
                        radial-gradient(2px 2px at 55% 50%, hsl(222 50% 55% / 0.35) 100%, transparent),
                        radial-gradient(1.5px 1.5px at 45% 15%, hsl(36 60% 52% / 0.4) 100%, transparent),
                        radial-gradient(1.5px 1.5px at 90% 45%, hsl(201 55% 50% / 0.35) 100%, transparent)
                      `,
                      animation: 'float-particles 8s ease-in-out infinite'
                    }}
                  />
                  {/* Soft cloud wisps */}
                  <div 
                    className="absolute inset-2 rounded-full opacity-25"
                    style={{
                      background: `radial-gradient(ellipse at 25% 35%, hsl(210 30% 85% / 0.6) 0%, transparent 40%),
                        radial-gradient(ellipse at 75% 55%, hsl(36 40% 88% / 0.5) 0%, transparent 35%),
                        radial-gradient(ellipse at 50% 80%, hsl(173 35% 82% / 0.4) 0%, transparent 30%)`
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Bass-reactive outer ring */}
            {isConnected && (
              <div
                className="absolute -inset-4 rounded-full border-2 transition-all duration-100"
                style={{
                  borderColor: conversation.isSpeaking 
                    ? `hsl(var(--secondary) / ${theme === 'dark' ? 0.3 + frequencyBands.bass * 0.7 : 0.5 + frequencyBands.bass * 0.5})` 
                    : `hsl(var(--primary) / ${theme === 'dark' ? 0.2 + inputVolume * 0.5 : 0.4 + inputVolume * 0.4})`,
                  transform: `scale(${1 + frequencyBands.bass * 0.1})`,
                  boxShadow: theme === 'dark'
                    ? (frequencyBands.bass > 0.3 
                        ? `0 0 ${20 + frequencyBands.bass * 30}px hsl(var(--secondary) / ${frequencyBands.bass * 0.5})`
                        : 'none')
                    : `0 0 ${8 + frequencyBands.bass * 15}px hsl(var(--secondary) / ${0.15 + frequencyBands.bass * 0.25})`
                }}
              />
            )}
            
            {/* Mid-frequency reactive rings */}
            {isConnected && conversation.isSpeaking && (
              <>
                {[0, 1, 2].map((i) => (
                  <div
                    key={`ring-${i}`}
                    className="absolute inset-0 rounded-full border-2 animate-ring-pulse"
                    style={{
                      animationDelay: `${i * 0.4}s`,
                      borderColor: `hsl(var(--secondary) / ${theme === 'dark' ? 0.3 + frequencyBands.mid * 0.5 : 0.5 + frequencyBands.mid * 0.4})`,
                      transform: `scale(${1 + frequencyBands.mid * 0.05 * i})`,
                    }}
                  />
                ))}
              </>
            )}
            
            {/* User speaking indicator - input volume reactive */}
            {isConnected && !conversation.isSpeaking && inputVolume > 0.1 && (
              <div
                className="absolute -inset-2 rounded-full border-2 animate-pulse"
                style={{
                  borderColor: `hsl(var(--primary) / ${theme === 'dark' ? 0.5 : 0.7})`,
                  transform: `scale(${1 + inputVolume * 0.15})`,
                  boxShadow: theme === 'dark'
                    ? `0 0 ${15 + inputVolume * 25}px hsl(var(--primary) / ${inputVolume * 0.6})`
                    : `0 0 ${10 + inputVolume * 18}px hsl(var(--primary) / ${0.2 + inputVolume * 0.4})`
                }}
              />
            )}
            
            {/* Outer ring */}
            <div 
              className={`absolute inset-0 rounded-full border-2 ${
                isConnected ? 'border-primary animate-pulse' : ''
              }`}
              style={{
                borderColor: isConnected 
                  ? undefined 
                  : `hsl(var(--border) / ${theme === 'dark' ? 1 : 1})`,
                boxShadow: theme === 'light' && !isConnected
                  ? 'inset 0 0 0 1px hsl(var(--border) / 0.5), 0 2px 8px hsl(220 30% 10% / 0.08)'
                  : undefined
              }}
            />
            
            {/* Middle ring */}
            <div 
              className={`absolute inset-4 rounded-full border-2 ${
                isConnected && conversation.isSpeaking 
                  ? 'border-secondary animate-spin' 
                  : ''
              }`}
              style={{ 
                animationDuration: '3s',
                borderColor: !(isConnected && conversation.isSpeaking)
                  ? `hsl(var(--border) / ${theme === 'dark' ? 0.5 : 0.8})`
                  : undefined
              }}
            />
            
            {/* Inner circle - Cosmic Orb */}
            <div
              className={`absolute inset-8 rounded-full border border-border flex items-center justify-center overflow-hidden ${
                !isConnected && !isConnecting ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''
              } ${theme === 'dark' ? 'bg-[hsl(240_10%_6%/0.9)]' : 'bg-gradient-to-br from-[hsl(220_20%_92%)] to-[hsl(220_25%_88%)] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.08)]'}`}
              onClick={() => {
                if (!isConnected && !isConnecting) {
                  startConversation();
                }
              }}
              title={!isConnected ? "Tap to activate Atlas" : undefined}
            >
              {/* Cosmic Orb Container */}
              <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                {/* Cosmic Orb - fills the center */}
                <div 
                  className="absolute w-[85%] h-[85%] rounded-full overflow-hidden"
                  style={{
                    transform: `scale(${1 + (conversation.isSpeaking ? outputVolume : inputVolume) * 0.15})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                >
                  {/* Base nebula layer - theme aware */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: theme === 'dark' 
                        ? `radial-gradient(ellipse at ${30 + frequencyBands.bass * 20}% ${40 + frequencyBands.mid * 20}%, 
                            hsl(270 100% ${isConnected ? 45 + outputVolume * 35 : 35}% / ${0.8 + outputVolume * 0.2}) 0%,
                            hsl(220 100% ${isConnected ? 35 + outputVolume * 25 : 28}% / ${0.7 + outputVolume * 0.3}) 30%,
                            hsl(280 100% ${isConnected ? 28 + outputVolume * 20 : 22}% / ${0.6 + outputVolume * 0.3}) 60%,
                            transparent 100%)`
                        : `radial-gradient(ellipse at ${30 + frequencyBands.bass * 20}% ${40 + frequencyBands.mid * 20}%, 
                            hsl(222 70% ${isConnected ? 38 + outputVolume * 18 : 35}% / ${0.9 + outputVolume * 0.1}) 0%,
                            hsl(201 75% ${isConnected ? 32 + outputVolume * 15 : 30}% / ${0.8 + outputVolume * 0.15}) 25%,
                            hsl(173 70% ${isConnected ? 28 + outputVolume * 14 : 26}% / ${0.7 + outputVolume * 0.2}) 50%,
                            hsl(220 25% 85% / 0.5) 100%)`,
                      animation: isConnected && conversation.isSpeaking 
                        ? 'orb-pulse 0.5s ease-in-out infinite' 
                        : 'orb-idle 4s ease-in-out infinite',
                    }}
                  />
                  
                  {/* Swirling nebula clouds layer 1 - theme aware */}
                  <div 
                    className={`absolute inset-0 rounded-full ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-soft-light'}`}
                    style={{
                      background: theme === 'dark'
                        ? `conic-gradient(from ${Date.now() / 50 % 360}deg at 50% 50%,
                            transparent 0deg,
                            hsl(280 100% ${60 + frequencyBands.bass * 30}% / ${0.5 + outputVolume * 0.4}) 60deg,
                            transparent 120deg,
                            hsl(200 100% ${70 + frequencyBands.mid * 25}% / ${0.45 + outputVolume * 0.4}) 180deg,
                            transparent 240deg,
                            hsl(320 100% ${65 + frequencyBands.treble * 30}% / ${0.4 + outputVolume * 0.4}) 300deg,
                            transparent 360deg)`
                        : `conic-gradient(from ${Date.now() / 50 % 360}deg at 50% 50%,
                            transparent 0deg,
                            hsl(222 75% ${35 + frequencyBands.bass * 18}% / ${0.6 + outputVolume * 0.35}) 60deg,
                            transparent 120deg,
                            hsl(201 80% ${38 + frequencyBands.mid * 15}% / ${0.55 + outputVolume * 0.35}) 180deg,
                            transparent 240deg,
                            hsl(173 75% ${32 + frequencyBands.treble * 18}% / ${0.55 + outputVolume * 0.35}) 300deg,
                            transparent 360deg)`,
                      animation: isConnected && conversation.isSpeaking 
                        ? `orb-swirl ${2 - outputVolume}s linear infinite` 
                        : 'orb-swirl 8s linear infinite',
                      filter: `blur(${6 - outputVolume * 3}px)`,
                    }}
                  />
                  
                  {/* Secondary swirl - counter rotation - theme aware */}
                  <div 
                    className={`absolute inset-2 rounded-full ${theme === 'dark' ? 'mix-blend-screen' : 'mix-blend-soft-light'}`}
                    style={{
                      background: theme === 'dark'
                        ? `conic-gradient(from ${180 + Date.now() / 80 % 360}deg at 55% 45%,
                            transparent 0deg,
                            hsl(180 100% ${75 + frequencyBands.treble * 20}% / ${0.4 + outputVolume * 0.4}) 90deg,
                            transparent 180deg,
                            hsl(260 100% ${70 + frequencyBands.bass * 25}% / ${0.45 + outputVolume * 0.4}) 270deg,
                            transparent 360deg)`
                        : `conic-gradient(from ${180 + Date.now() / 80 % 360}deg at 55% 45%,
                            transparent 0deg,
                            hsl(173 75% ${36 + frequencyBands.treble * 15}% / ${0.55 + outputVolume * 0.35}) 90deg,
                            transparent 180deg,
                            hsl(222 70% ${34 + frequencyBands.bass * 16}% / ${0.58 + outputVolume * 0.35}) 270deg,
                            transparent 360deg)`,
                      animation: isConnected && conversation.isSpeaking 
                        ? `orb-swirl-reverse ${2.5 - outputVolume * 0.5}s linear infinite` 
                        : 'orb-swirl-reverse 10s linear infinite',
                      filter: `blur(${5 - outputVolume * 2}px)`,
                    }}
                  />
                  
                  {/* Stars/sparkles layer - theme aware */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage: theme === 'dark'
                        ? `radial-gradient(1.5px 1.5px at 20% 30%, white ${0.6 + outputVolume * 0.4}, transparent),
                            radial-gradient(1.5px 1.5px at 40% 70%, white ${0.55 + outputVolume * 0.4}, transparent),
                            radial-gradient(1.5px 1.5px at 60% 20%, white ${0.58 + outputVolume * 0.4}, transparent),
                            radial-gradient(2px 2px at 80% 50%, hsl(180 100% 80% / ${0.6 + outputVolume * 0.4}) 0%, transparent 100%),
                            radial-gradient(2px 2px at 30% 80%, hsl(280 100% 80% / ${0.55 + outputVolume * 0.4}) 0%, transparent 100%),
                            radial-gradient(1.5px 1.5px at 70% 60%, white ${0.55 + outputVolume * 0.4}, transparent),
                            radial-gradient(1.5px 1.5px at 15% 55%, white ${0.5 + outputVolume * 0.4}, transparent),
                            radial-gradient(2px 2px at 85% 25%, hsl(200 100% 85% / ${0.55 + outputVolume * 0.4}) 0%, transparent 100%)`
                        : `radial-gradient(2px 2px at 20% 30%, hsl(222 70% 30% / ${0.65 + outputVolume * 0.3}), transparent),
                            radial-gradient(2px 2px at 40% 70%, hsl(201 75% 32% / ${0.6 + outputVolume * 0.3}), transparent),
                            radial-gradient(2px 2px at 60% 20%, hsl(173 70% 28% / ${0.62 + outputVolume * 0.3}), transparent),
                            radial-gradient(2.5px 2.5px at 80% 50%, hsl(36 80% 42% / ${0.65 + outputVolume * 0.3}) 0%, transparent 100%),
                            radial-gradient(2.5px 2.5px at 30% 80%, hsl(222 75% 35% / ${0.6 + outputVolume * 0.3}) 0%, transparent 100%),
                            radial-gradient(2px 2px at 70% 60%, hsl(201 70% 34% / ${0.6 + outputVolume * 0.3}), transparent),
                            radial-gradient(2px 2px at 15% 55%, hsl(173 75% 30% / ${0.55 + outputVolume * 0.3}), transparent),
                            radial-gradient(2.5px 2.5px at 85% 25%, hsl(36 75% 45% / ${0.6 + outputVolume * 0.3}) 0%, transparent 100%)`,
                      animation: 'orb-stars 3s ease-in-out infinite',
                    }}
                  />
                  
                  {/* Energy core - bass reactive - theme aware */}
                  <div 
                    className="absolute inset-0 m-auto rounded-full"
                    style={{
                      width: `${30 + frequencyBands.bass * 40}%`,
                      height: `${30 + frequencyBands.bass * 40}%`,
                      background: theme === 'dark'
                        ? `radial-gradient(circle,
                            hsl(${isConnected && conversation.isSpeaking ? '45 100%' : '190 100%'} ${80 + outputVolume * 20}% / ${0.7 + outputVolume * 0.3}) 0%,
                            hsl(${isConnected && conversation.isSpeaking ? '320 100%' : '210 100%'} 70% / ${0.5 + outputVolume * 0.4}) 40%,
                            transparent 70%)`
                        : `radial-gradient(circle,
                            hsl(${isConnected && conversation.isSpeaking ? '36 85%' : '173 80%'} ${isConnected ? 48 + outputVolume * 15 : 45}% / ${0.75 + outputVolume * 0.2}) 0%,
                            hsl(${isConnected && conversation.isSpeaking ? '222 70%' : '201 75%'} ${38 + outputVolume * 12}% / ${0.55 + outputVolume * 0.35}) 40%,
                            transparent 70%)`,
                      filter: `blur(${3 - outputVolume * 1.5}px)`,
                      transition: 'width 0.1s, height 0.1s',
                    }}
                  />
                  
                  {/* Outer glow ring - theme aware */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: theme === 'dark'
                        ? `inset 0 0 ${35 + outputVolume * 45}px hsl(${isConnected && conversation.isSpeaking ? '280' : '200'} 100% 60% / ${0.5 + outputVolume * 0.4}),
                            inset 0 0 ${70 + outputVolume * 60}px hsl(200 100% 40% / ${0.4 + outputVolume * 0.3})`
                        : `inset 0 0 ${30 + outputVolume * 30}px hsl(${isConnected && conversation.isSpeaking ? '36' : '173'} 70% 38% / ${0.45 + outputVolume * 0.3}),
                            inset 0 0 ${55 + outputVolume * 40}px hsl(222 65% 35% / ${0.35 + outputVolume * 0.25})`,
                    }}
                  />
                </div>
                
                {/* Activation hint when not connected */}
                {!isConnected && !isConnecting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-primary/60 animate-pulse">
                      TAP TO ACTIVATE
                    </span>
                  </div>
                )}
                
                {/* Connecting indicator */}
                {isConnecting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-mono text-primary animate-pulse">
                      CONNECTING...
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-4 mt-8">
            {/* Main controls */}
            <div className="flex justify-center gap-3">
              {isConnected && (
                <>
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    className="gap-2 font-mono"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isMuted ? "UNMUTE" : "MUTE"}
                  </Button>
                  <Button
                    onClick={stopConversation}
                    variant="destructive"
                    className="gap-2 font-mono"
                  >
                    <MicOff className="w-4 h-4" />
                    DEACTIVATE
                  </Button>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Right Panel - Results & Logs (Scrollable) */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-10rem)] pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent pb-4">
          {/* Atlas Task Progress */}
          <AtlasTaskProgress tasks={orchestration.tasks} isLoading={orchestration.isLoading} />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-card/90 border border-border rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Search size={14} className="text-primary" />
                <span className="text-xs font-mono text-muted-foreground">
                  SEARCH RESULTS ({searchResults.length})
                </span>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {searchResults.map((agent) => (
                    <div key={agent.id} className="p-2 bg-background rounded border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-foreground">{agent.name}</span>
                        <span className="text-[10px] text-primary">{agent.sector}</span>
                      </div>
                      {agent.similarity && (
                        <div className="text-[10px] text-muted-foreground">
                          Match: {(agent.similarity * 100).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Synthesized Agent */}
          {synthesizedAgent && (
            <div className="bg-card/90 border border-secondary/60 rounded-lg p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-secondary" />
                <span className="text-xs font-mono text-muted-foreground">SYNTHESIZED AGENT</span>
              </div>
              <div className="p-2 bg-background rounded border border-border">
                <div className="text-sm font-mono text-secondary">{synthesizedAgent.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{synthesizedAgent.sector}</div>
                <div className="text-xs text-foreground/80 mt-2">{synthesizedAgent.description}</div>
              </div>
            </div>
          )}

          {/* C-Suite Data Hub - Consolidated Enterprise Control Center */}
          <CSuiteDataHub userId={user?.id} agents={agents} agentsLoading={agentsLoading} />

        </div>
      </main>

      {/* Bottom Bar - Transcript & Text Input */}
      <div className="border-t border-border bg-card/95 backdrop-blur-sm px-6 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        {/* Transcript */}
        {isConnected && (
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isTranscribing ? 'bg-secondary animate-pulse' : 'bg-muted'}`} />
            <span className="text-[10px] font-mono text-muted-foreground tracking-wider flex-shrink-0">
              {isTranscribing ? 'ATLAS SPEAKING' : 'TRANSCRIPT'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-mono leading-relaxed truncate ${
                transcript ? 'text-foreground' : 'text-muted-foreground/50'
              }`}>
                {transcript || 'Waiting for Atlas to speak...'}
                {isTranscribing && (
                  <span className="inline-block w-1 h-4 bg-secondary animate-pulse ml-0.5 align-middle" />
                )}
              </p>
            </div>
          </div>
        )}
        
        {/* Text Input */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (textInput.trim() && isConnected) {
              const msg = textInput.trim();
              conversation.sendUserMessage(msg);
              setTranscript(`You: ${msg}`);
              saveMessage('user', msg);
              setTextInput('');
            }
          }}
          className="flex items-center gap-3"
        >
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={isConnected ? "Type a message to Atlas..." : "Connect to Atlas to send messages..."}
            disabled={!isConnected}
            className="flex-1 font-mono text-sm bg-background border-border focus:border-primary"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!isConnected || !textInput.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

// Wrap with error boundary to handle ElevenLabs SDK React errors gracefully
export default function Atlas() {
  return (
    <AtlasErrorBoundary>
      <AtlasPage />
    </AtlasErrorBoundary>
  );
}
