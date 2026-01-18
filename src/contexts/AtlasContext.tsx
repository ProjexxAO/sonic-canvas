// Global Atlas Voice Agent Context - Enables Atlas on every page

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConversation } from "@elevenlabs/react";
import { voiceIntentParser } from '@/lib/voice-intent-parser';
import { useVoiceCommandBus } from '@/lib/voice-command-bus';
import { useAtlasMemory } from '@/hooks/useAtlasMemory';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardAgents } from '@/hooks/useDashboardAgents';
import { useDataHubController, getDomainKeyFromName, getTabFromName, getPersonaFromName } from '@/hooks/useDataHubController';
import { useWakeWordDetection, WakeWordStatus, WakeWordName } from '@/hooks/useWakeWordDetection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface AtlasContextValue {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  status: string;
  
  // Audio levels for visualization
  audioLevels: number[];
  inputVolume: number;
  outputVolume: number;
  frequencyBands: { bass: number; mid: number; treble: number };
  
  // Transcript
  transcript: string;
  isTranscribing: boolean;
  
  // Actions
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  toggleMute: () => Promise<void>;
  sendTextMessage: (text: string) => void;
  sendContextualUpdate: (text: string) => void;
  
  // Navigation
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  currentPath: string;
  
  // UI state
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  
  // Logs and results
  actionLogs: ActionLog[];
  searchResults: SearchResult[];
  synthesizedAgent: any | null;
  
  // Wake word detection
  wakeWordStatus: WakeWordStatus;
  wakeWordEnabled: boolean;
  setWakeWordEnabled: (enabled: boolean) => void;
  wakeWord: WakeWordName;
  setWakeWord: (word: WakeWordName) => void;
  
  // Direct conversation access for Atlas page
  conversation: ReturnType<typeof useConversation>;
}

const AtlasContext = createContext<AtlasContextValue | null>(null);

export function useAtlas() {
  const context = useContext(AtlasContext);
  if (!context) {
    throw new Error('useAtlas must be used within AtlasProvider');
  }
  return context;
}

// Safe hook that doesn't throw if not in provider
export function useAtlasSafe() {
  return useContext(AtlasContext);
}

interface AtlasProviderProps {
  children: ReactNode;
}

export function AtlasProvider({ children }: AtlasProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { agents } = useDashboardAgents({ limit: 200 });
  
  // State
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [frequencyBands, setFrequencyBands] = useState({ bass: 0, mid: 0, treble: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [synthesizedAgent, setSynthesizedAgent] = useState<any | null>(null);
  
  // Wake word settings
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [wakeWord, setWakeWord] = useState<WakeWordName>("jarvis");
  
  // Navigation history tracking
  const [historyStack, setHistoryStack] = useState<string[]>([location.pathname]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyStackRef = useRef<string[]>([location.pathname]);
  const historyIndexRef = useRef(0);
  
  // Memory
  const atlasMemory = useAtlasMemory({ userId: user?.id, autoLoad: true, messageLimit: 20 });
  
  // Refs
  const lastSavedMessageRef = useRef<string>('');
  const animationRef = useRef<number>();
  const conversationRef = useRef<any>(null);
  const startConversationLockRef = useRef(false);
  const pendingMemoryContextRef = useRef<string | null>(null);
  const userRef = useRef(user);
  const agentsRef = useRef(agents);
  
  // Keep refs updated
  useEffect(() => {
    userRef.current = user;
    agentsRef.current = agents;
  }, [user, agents]);
  
  // Track navigation history - using refs to avoid infinite loops
  useEffect(() => {
    const currentPath = location.pathname;
    const currentIndex = historyIndexRef.current;
    const currentStack = historyStackRef.current;
    
    // If navigating via browser buttons, don't add to stack
    if (currentStack[currentIndex] === currentPath) return;
    
    // Add new path, truncate forward history
    const newStack = [...currentStack.slice(0, currentIndex + 1), currentPath];
    const newIndex = newStack.length - 1;
    
    // Update refs first (sync)
    historyStackRef.current = newStack;
    historyIndexRef.current = newIndex;
    
    // Then update state (async, batched)
    setHistoryStack(newStack);
    setHistoryIndex(newIndex);
  }, [location.pathname]);
  
  // Memory context setup
  useEffect(() => {
    if (atlasMemory.isLoaded && atlasMemory.contextString) {
      pendingMemoryContextRef.current = atlasMemory.contextString;
    }
  }, [atlasMemory.isLoaded, atlasMemory.contextString]);

  // Add log helper
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

  const addLogRef = useRef(addLog);
  useEffect(() => { addLogRef.current = addLog; }, [addLog]);

  // Navigation functions
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      navigate(historyStack[newIndex]);
      addLog('goBack', {}, `Navigated back to ${historyStack[newIndex]}`, 'success');
      toast.info('Navigated back');
    }
  }, [historyIndex, historyStack, navigate, addLog]);

  const goForward = useCallback(() => {
    if (historyIndex < historyStack.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      navigate(historyStack[newIndex]);
      addLog('goForward', {}, `Navigated forward to ${historyStack[newIndex]}`, 'success');
      toast.info('Navigated forward');
    }
  }, [historyIndex, historyStack, navigate, addLog]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  // Conversation config with all client tools
  const conversationConfig = useMemo(() => ({
    clientTools: {
      // Navigation - go back
      goBack: () => {
        if (historyIndex > 0) {
          goBack();
          return 'Navigated back to the previous page';
        }
        return 'Cannot go back - already at the beginning of navigation history';
      },

      // Navigation - go forward
      goForward: () => {
        if (historyIndex < historyStack.length - 1) {
          goForward();
          return 'Navigated forward to the next page';
        }
        return 'Cannot go forward - already at the most recent page';
      },

      // Get current location
      getCurrentLocation: () => {
        addLogRef.current('getCurrentLocation', {}, location.pathname, 'success');
        const pageNames: Record<string, string> = {
          '/': 'Agent Grid - Atlas Sonic OS',
          '/atlas': 'Dashboard - Atlas Command Center',
          '/import': 'Import Agents - Bulk Upload',
          '/marketplace': 'Integrations Marketplace',
          '/governance': 'Tool Governance - Agent Permissions',
          '/workspace/tools': 'User Tool Permissions',
          '/auth': 'Authentication - Login/Sign Up',
        };
        // Handle dynamic routes
        let pageName = pageNames[location.pathname];
        if (!pageName && location.pathname.startsWith('/workspace/tools')) {
          pageName = 'User Tool Permissions';
        }
        pageName = pageName || location.pathname;
        return `You are currently on: ${pageName}`;
      },

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
            l.id === logId ? { ...l, result: 'Web search complete', status: 'success' } : l
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

      // Search agents
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

      // Synthesize agent
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

      // Create task
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
          return `Task "${params.title}" has been created. Priority: ${params.priority || 'medium'}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Task creation failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error('Failed to create task');
          return `Error: ${msg}`;
        }
      },

      // Get tasks
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
                progress: params.progress,
                status: params.status
              }
            }
          });
          
          if (response.error) throw response.error;
          
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: `Updated task progress to ${params.progress}%`, status: 'success' } : l
          ));
          
          toast.success(`Task progress updated to ${params.progress}%`);
          return `Task progress updated to ${params.progress}%${params.status ? `. Status: ${params.status}` : ''}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Task update failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error('Failed to update task');
          return `Error: ${msg}`;
        }
      },

      // Complete a task
      completeTask: async (params: { taskId: string; summary?: string }) => {
        const logId = addLogRef.current('completeTask', params, 'Completing task...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'update_task', 
              userId: userRef.current?.id,
              taskId: params.taskId,
              updates: {
                progress: 100,
                status: 'completed',
                output_data: params.summary ? { summary: params.summary } : undefined
              }
            }
          });
          
          if (response.error) throw response.error;
          
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: 'Task completed', status: 'success' } : l
          ));
          
          toast.success('Task completed successfully!');
          return `Task has been marked as completed.${params.summary ? ` Summary: ${params.summary}` : ''}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Task completion failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error('Failed to complete task');
          return `Error: ${msg}`;
        }
      },

      // Delete a task
      deleteTask: async (params: { taskId?: string; taskTitle?: string }) => {
        const logId = addLogRef.current('deleteTask', params, 'Deleting task...', 'pending');
        try {
          // If taskId provided, delete directly
          if (params.taskId) {
            const response = await supabase.functions.invoke('atlas-orchestrator', {
              body: { 
                action: 'delete_task', 
                userId: userRef.current?.id,
                taskId: params.taskId
              }
            });
            
            if (response.error) throw response.error;
            
            setActionLogs(prev => prev.map(l => 
              l.id === logId ? { ...l, result: 'Task deleted', status: 'success' } : l
            ));
            
            toast.success('Task deleted');
            return 'Task has been deleted successfully.';
          }
          
          // If taskTitle provided, find and delete by title
          if (params.taskTitle) {
            // First get tasks to find the matching one
            const tasksResponse = await supabase.functions.invoke('atlas-orchestrator', {
              body: { 
                action: 'get_tasks', 
                userId: userRef.current?.id,
              }
            });
            
            if (tasksResponse.error) throw tasksResponse.error;
            
            const tasks = tasksResponse.data?.tasks || [];
            const matchingTask = tasks.find((t: any) => 
              t.task_title.toLowerCase().includes(params.taskTitle!.toLowerCase())
            );
            
            if (!matchingTask) {
              setActionLogs(prev => prev.map(l => 
                l.id === logId ? { ...l, result: 'Task not found', status: 'error' } : l
              ));
              return `Could not find a task matching "${params.taskTitle}". Please be more specific or check the task list.`;
            }
            
            const response = await supabase.functions.invoke('atlas-orchestrator', {
              body: { 
                action: 'delete_task', 
                userId: userRef.current?.id,
                taskId: matchingTask.id
              }
            });
            
            if (response.error) throw response.error;
            
            setActionLogs(prev => prev.map(l => 
              l.id === logId ? { ...l, result: `Deleted: ${matchingTask.task_title}`, status: 'success' } : l
            ));
            
            toast.success(`Task deleted: ${matchingTask.task_title}`);
            return `Task "${matchingTask.task_title}" has been deleted.`;
          }
          
          return 'Please specify which task to delete by providing either a task ID or task title.';
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Task deletion failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error('Failed to delete task');
          return `Error: ${msg}`;
        }
      },

      // Navigate to page - comprehensive route support
      navigateTo: (params: { page: string }) => {
        addLogRef.current('navigateTo', params, `Navigating to ${params.page}`, 'success');
        
        // All app routes with natural language aliases
        const routes: Record<string, string> = {
          // Main pages
          'home': '/atlas',
          'main': '/atlas',
          'dashboard': '/atlas',
          'index': '/',
          'agents': '/',
          'sonic nodes': '/',
          'agent dashboard': '/atlas',
          
          // Atlas / Command Center
          'atlas': '/atlas',
          'command center': '/atlas',
          'voice': '/atlas',
          'voice control': '/atlas',
          'ai assistant': '/atlas',
          'data hub': '/atlas',
          'c-suite': '/atlas',
          'csuite': '/atlas',
          'executive dashboard': '/atlas',
          
          // Import
          'import': '/import',
          'import agents': '/import',
          'bulk import': '/import',
          'upload agents': '/import',
          
          // Governance
          'governance': '/governance',
          'tool governance': '/governance',
          'agent governance': '/governance',
          
          // Permissions
          'permissions': '/workspace/tools',
          'user permissions': '/workspace/tools',
          'tool permissions': '/workspace/tools',
          'workspace tools': '/workspace/tools',
          
          // Integrations / Marketplace
          'integrations': '/marketplace',
          'marketplace': '/marketplace',
          'connect': '/marketplace',
          'connections': '/marketplace',
          'apps': '/marketplace',
          
          // Auth
          'auth': '/auth',
          'login': '/auth',
          'sign in': '/auth',
          'sign up': '/auth',
          'register': '/auth',
          'authentication': '/auth',
        };
        
        const pageLower = params.page.toLowerCase().trim();
        
        // Check if it's a direct path (starts with /)
        if (pageLower.startsWith('/')) {
          toast.info(`Navigating to ${params.page}`);
          setTimeout(() => navigate(pageLower), 500);
          return `Navigating to ${params.page}`;
        }
        
        // Try exact match first
        let route = routes[pageLower];
        
        // If no exact match, try partial match - prioritize longer key matches
        if (!route) {
          // Sort by key length descending to prioritize more specific matches
          const sortedRoutes = Object.entries(routes).sort((a, b) => b[0].length - a[0].length);
          const partialMatch = sortedRoutes.find(([k]) => 
            pageLower.includes(k) || k.includes(pageLower)
          );
          route = partialMatch?.[1] || '/';
        }
        
        toast.info(`Navigating to ${params.page}`);
        setTimeout(() => navigate(route), 500);
        return `Navigating to ${params.page}`;
      },

      // Alias for ElevenLabs agent
      navigateToPage: (params: { page: string }) => {
        return conversationConfig.clientTools.navigateTo(params);
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

      // Filter agents
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

      // Show notification
      showNotification: (params: { title: string; message: string; type?: string }) => {
        addLogRef.current('showNotification', params, 'Notification shown', 'success');
        
        const toastType = params.type || 'info';
        if (toastType === 'success') toast.success(params.message);
        else if (toastType === 'error') toast.error(params.message);
        else if (toastType === 'warning') toast.warning(params.message);
        else toast.info(params.message);
        
        return `Displayed ${toastType} notification: ${params.title}`;
      },

      // System status
      getSystemStatus: () => {
        addLogRef.current('getSystemStatus', {}, 'Status retrieved', 'success');
        return `System online. Current page: ${location.pathname}. Agents loaded: ${agentsRef.current.length}.`;
      },

      // Data Hub controls
      switchDataHubTab: (params: { tab: string }) => {
        const tabId = getTabFromName(params.tab);
        if (!tabId) {
          addLogRef.current('switchDataHubTab', params, `Unknown tab: ${params.tab}`, 'error');
          return `Unknown tab "${params.tab}". Available tabs: command, insights, admin`;
        }
        
        useDataHubController.getState().setActiveTab(tabId);
        addLogRef.current('switchDataHubTab', params, `Switched to ${tabId}`, 'success');
        toast.info(`Switched to ${tabId} tab`);
        return `Switched Data Hub to ${tabId} tab`;
      },

      openDataDomain: (params: { domain: string }) => {
        const domainKey = getDomainKeyFromName(params.domain);
        if (!domainKey) {
          addLogRef.current('openDataDomain', params, `Unknown domain: ${params.domain}`, 'error');
          return `Unknown domain "${params.domain}". Available: communications, documents, events, financials, tasks, knowledge`;
        }
        
        useDataHubController.getState().setExpandedDomain(domainKey);
        useDataHubController.getState().setActiveTab('command');
        addLogRef.current('openDataDomain', params, `Opened ${domainKey}`, 'success');
        toast.info(`Opened ${domainKey} domain`);
        return `Opened ${domainKey} domain in Data Hub`;
      },

      closeDataDomain: () => {
        useDataHubController.getState().setExpandedDomain(null);
        addLogRef.current('closeDataDomain', {}, 'Closed domain view', 'success');
        return 'Closed domain view';
      },

      generateDataHubReport: (params: { persona: string }) => {
        const personaId = getPersonaFromName(params.persona);
        if (!personaId) {
          addLogRef.current('generateDataHubReport', params, `Unknown persona: ${params.persona}`, 'error');
          return `Unknown persona "${params.persona}".`;
        }
        
        useDataHubController.getState().requestReportGeneration(personaId);
        addLogRef.current('generateDataHubReport', params, `Generating ${personaId} report`, 'success');
        toast.info(`Generating ${personaId.toUpperCase()} report...`);
        return `Generating executive report for ${personaId.toUpperCase()} persona`;
      },

      refreshDataHub: () => {
        useDataHubController.getState().requestRefresh();
        addLogRef.current('refreshDataHub', {}, 'Refresh triggered', 'success');
        toast.info('Refreshing Data Hub...');
        return 'Refreshing Data Hub data';
      },
    },
    onConnect: () => {
      console.log("[Atlas Global] Connected to voice agent");
      addLogRef.current('system', {}, 'Connected to Atlas', 'success');
      toast.success('Atlas online');

      const memoryContext = pendingMemoryContextRef.current;
      if (memoryContext && conversationRef.current?.sendContextualUpdate) {
        conversationRef.current.sendContextualUpdate(
          "SYSTEM: You have been provided background context about this user. Use it to be helpful."
        );
        conversationRef.current.sendContextualUpdate(
          `[BACKGROUND CONTEXT]: ${memoryContext}`
        );
        pendingMemoryContextRef.current = null;
      }
    },
    onDisconnect: () => {
      console.log("[Atlas Global] Disconnected");
      addLogRef.current('system', {}, 'Disconnected from Atlas', 'success');
    },
    onMessage: (message: any) => {
      if (typeof message?.message === "string") {
        const who = message.role === "agent" ? "Atlas" : "You";
        const content = message.message;
        setTranscript(`${who}: ${content}`);
        setIsTranscribing(message.role === "agent");

        if (content && content !== lastSavedMessageRef.current) {
          lastSavedMessageRef.current = content;
          const role = message.role === "agent" ? 'assistant' : 'user';
          
          atlasMemory.storeMessage(role, content, {
            timestamp: new Date().toISOString(),
            source: 'voice'
          });
          
          if (message.role !== "agent") {
            const intent = voiceIntentParser.parse(content);
            if (intent) {
              useVoiceCommandBus.getState().sendCommand(intent.command);
            }
          }
        }
      }
    },
    onError: (error: any) => {
      console.error("[Atlas Global] Error:", error);
      addLogRef.current('system', { error }, 'Connection error', 'error');
      toast.error('Atlas connection error');
    },
  }), [navigate, location.pathname, goBack, goForward, historyIndex, historyStack, atlasMemory]);

  const conversation = useConversation({
    ...conversationConfig,
    micMuted: isMuted,
  });
  conversationRef.current = conversation;

  const isConnected = conversation.status === "connected";

  // Ref to hold the latest startConversation function for wake word callback
  const startConversationRef = useRef<(() => Promise<void>) | null>(null);

  // Start conversation
  const startConversation = useCallback(async () => {
    // Prevent multiple concurrent start attempts (can cause AbortError/timeouts)
    if (startConversationLockRef.current) return;
    if (isConnecting || conversation.status === 'connected') return;

    startConversationLockRef.current = true;
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const fetchSignedUrl = async () => {
        const controller = new AbortController();
        const t = window.setTimeout(() => controller.abort(), 60000);

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

          const signedUrlResp = await res.json().catch(() => ({}));
          return { res, signedUrlResp };
        } finally {
          window.clearTimeout(t);
        }
      };

      // Retry once on timeout/AbortError (common with extensions/network hiccups)
      let res: Response;
      let signedUrlResp: any;

      try {
        ({ res, signedUrlResp } = await fetchSignedUrl());
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          ({ res, signedUrlResp } = await fetchSignedUrl());
        } else {
          throw e;
        }
      }

      if (!res.ok || !signedUrlResp?.signed_url) {
        throw new Error(signedUrlResp?.error || "Failed to authenticate with voice service");
      }

      const userDisplayName = user?.email?.split("@")[0] || "Operator";
      
      if (atlasMemory.contextString) {
        pendingMemoryContextRef.current = atlasMemory.contextString;
      }

      await conversation.startSession({
        signedUrl: signedUrlResp.signed_url,
        connectionType: "websocket",
        userId: user?.id,
        dynamicVariables: {
          _userDisplayName_: userDisplayName,
        },
      });
    } catch (error) {
      console.error("[Atlas Global] Failed to start:", error);
      toast.error(`Failed to start Atlas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      startConversationLockRef.current = false;
      setIsConnecting(false);
    }
  }, [conversation, isConnecting, user, atlasMemory.contextString]);

  // Keep ref updated (no deps to avoid loop)
  startConversationRef.current = startConversation;

  // Wake word detection - only active when not connected
  const { status: wakeWordStatus } = useWakeWordDetection({
    enabled: wakeWordEnabled && !isConnected && !isConnecting,
    wakeWord,
    onWakeWordDetected: () => {
      toast.info(`"${wakeWord}" detected! Starting Atlas...`);
      startConversationRef.current?.();
    },
  });

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

  const sendTextMessage = useCallback((text: string) => {
    const conv = conversationRef.current;
    if (text.trim() && conv && conv.status === 'connected') {
      conv.sendUserActivity?.();
      conv.sendUserMessage?.(text);
      setTranscript(`You: ${text}`);

      // Store to memory for Atlas context
      atlasMemory.storeMessage('user', text, {
        timestamp: new Date().toISOString(),
        source: 'text'
      });

      // Parse for voice commands
      const intent = voiceIntentParser.parse(text);
      if (intent) {
        useVoiceCommandBus.getState().sendCommand(intent.command);
      }
    }
  }, [atlasMemory]);

  // Send contextual update to Atlas
  const sendContextualUpdate = useCallback((text: string) => {
    if (isConnected && conversation) {
      conversation.sendContextualUpdate(text);
    }
  }, [isConnected, conversation]);


  // Audio visualization
  useEffect(() => {
    if (!isConnected) {
      setAudioLevels(new Array(20).fill(0));
      setInputVolume(0);
      setOutputVolume(0);
      setFrequencyBands({ bass: 0, mid: 0, treble: 0 });
      return;
    }

    const updateAudioLevels = () => {
      const inVol = conversation.getInputVolume();
      const outVol = conversation.getOutputVolume();
      setInputVolume(inVol);
      setOutputVolume(outVol);
      
      const outputFreq = conversation.getOutputByteFrequencyData();
      const inputFreq = conversation.getInputByteFrequencyData();
      const frequencyData = conversation.isSpeaking ? outputFreq : inputFreq;
      
      if (frequencyData && frequencyData.length > 0) {
        const third = Math.floor(frequencyData.length / 3);
        const bassSum = frequencyData.slice(0, third).reduce((a, b) => a + b, 0) / third / 255;
        const midSum = frequencyData.slice(third, third * 2).reduce((a, b) => a + b, 0) / third / 255;
        const trebleSum = frequencyData.slice(third * 2).reduce((a, b) => a + b, 0) / third / 255;
        setFrequencyBands({ bass: bassSum, mid: midSum, treble: trebleSum });
        
        const newLevels = Array.from({ length: 20 }, (_, i) => {
          const index = Math.floor((i / 20) * frequencyData.length);
          return frequencyData[index] / 255;
        });
        setAudioLevels(newLevels);
      } else {
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

  const value: AtlasContextValue = {
    isConnected,
    isConnecting,
    isMuted,
    isSpeaking: conversation.isSpeaking,
    status: conversation.status,
    audioLevels,
    inputVolume,
    outputVolume,
    frequencyBands,
    transcript,
    isTranscribing,
    startConversation,
    stopConversation,
    toggleMute,
    sendTextMessage,
    sendContextualUpdate,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    currentPath: location.pathname,
    isExpanded,
    setIsExpanded,
    isMinimized,
    setIsMinimized,
    actionLogs,
    searchResults,
    synthesizedAgent,
    wakeWordStatus,
    wakeWordEnabled,
    setWakeWordEnabled,
    wakeWord,
    setWakeWord,
    conversation,
  };

  return (
    <AtlasContext.Provider value={value}>
      {children}
    </AtlasContext.Provider>
  );
}
