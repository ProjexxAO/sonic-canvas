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
import { atlasUIClientTools } from '@/lib/atlasUIBridge';
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

// Web search entry for tracking searches
export interface WebSearchEntry {
  id: string;
  query: string;
  status: 'searching' | 'complete' | 'error';
  answer?: string;
  citations?: string[];
  timestamp: Date;
  mode?: 'search' | 'deep' | 'multi' | 'extract' | 'citations';
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
  
  // Web searches tracking
  webSearches: WebSearchEntry[];
  manualWebSearch: (query: string) => Promise<void>;
  isWebSearching: boolean;
  
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
  const [webSearches, setWebSearches] = useState<WebSearchEntry[]>([]);
  const [isWebSearching, setIsWebSearching] = useState(false);
  
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
  const atlasMemoryRef = useRef(atlasMemory);
  
  // Keep atlasMemory ref updated - use individual stable properties to avoid infinite loops
  useEffect(() => {
    atlasMemoryRef.current = atlasMemory;
  }, [atlasMemory.isLoaded, atlasMemory.contextString, atlasMemory.messages.length]);
  
  // Refs
  const lastSavedMessageRef = useRef<string>('');
  const animationRef = useRef<number>();
  const conversationRef = useRef<any>(null);
  const startConversationLockRef = useRef(false);
  const pendingMemoryContextRef = useRef<string | null>(null);
  const userRef = useRef(user);
  const agentsRef = useRef(agents);
  const locationRef = useRef(location.pathname);
  
  // Keep refs updated
  useEffect(() => {
    userRef.current = user;
    agentsRef.current = agents;
    locationRef.current = location.pathname;
  }, [user, agents, location.pathname]);
  
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
    if (historyIndexRef.current > 0) {
      const newIndex = historyIndexRef.current - 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      navigate(historyStackRef.current[newIndex]);
      addLogRef.current('goBack', {}, `Navigated back to ${historyStackRef.current[newIndex]}`, 'success');
      toast.info('Navigated back');
    }
  }, [navigate]);

  const goForward = useCallback(() => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      const newIndex = historyIndexRef.current + 1;
      historyIndexRef.current = newIndex;
      setHistoryIndex(newIndex);
      navigate(historyStackRef.current[newIndex]);
      addLogRef.current('goForward', {}, `Navigated forward to ${historyStackRef.current[newIndex]}`, 'success');
      toast.info('Navigated forward');
    }
  }, [navigate]);

  // Refs for stable clientTools callbacks
  const goBackRef = useRef(goBack);
  const goForwardRef = useRef(goForward);
  useEffect(() => {
    goBackRef.current = goBack;
    goForwardRef.current = goForward;
  }, [goBack, goForward]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyStack.length - 1;

  // Conversation config with all client tools
  const conversationConfig = useMemo(() => ({
    clientTools: {
      // Navigation - go back (use refs for stability)
      goBack: () => {
        if (historyIndexRef.current > 0) {
          goBackRef.current();
          return 'Navigated back to the previous page';
        }
        return 'Cannot go back - already at the beginning of navigation history';
      },

      // Navigation - go forward (use refs for stability)
      goForward: () => {
        if (historyIndexRef.current < historyStackRef.current.length - 1) {
          goForwardRef.current();
          return 'Navigated forward to the next page';
        }
        return 'Cannot go forward - already at the most recent page';
      },

      // Get current location (use ref to avoid dependency on location.pathname)
      getCurrentLocation: () => {
        const currentPath = locationRef.current;
        addLogRef.current('getCurrentLocation', {}, currentPath, 'success');
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
        let pageName = pageNames[currentPath];
        if (!pageName && currentPath.startsWith('/workspace/tools')) {
          pageName = 'User Tool Permissions';
        }
        pageName = pageName || currentPath;
        return `You are currently on: ${pageName}`;
      },

      // Web search using Perplexity
      webSearch: async (params: { query: string }) => {
        const logId = addLogRef.current('webSearch', params, 'Searching the web...', 'pending');
        const searchId = `search-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        
        // Add search entry as "searching"
        setWebSearches(prev => [{
          id: searchId,
          query: params.query,
          status: 'searching' as const,
          timestamp: new Date(),
          mode: 'search' as const,
        }, ...prev].slice(0, 20)); // Keep last 20 searches
        
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { action: 'web_search', query: params.query }
          });
          
          if (response.error) throw response.error;
          
          const answer = response.data?.answer || 'No results found';
          const citations = response.data?.citations || [];
          
          // Update search entry to "complete"
          setWebSearches(prev => prev.map(s => 
            s.id === searchId ? { ...s, status: 'complete' as const, answer, citations } : s
          ));
          
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: 'Web search complete', status: 'success' } : l
          ));
          
          toast.success(`Web search complete for "${params.query}"`);
          return `${answer}${citations.length > 0 ? `\n\nSources: ${citations.join(', ')}` : ''}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Web search failed';
          
          // Update search entry to "error"
          setWebSearches(prev => prev.map(s => 
            s.id === searchId ? { ...s, status: 'error' as const } : s
          ));
          
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

      // System status (use refs for stability)
      getSystemStatus: () => {
        addLogRef.current('getSystemStatus', {}, 'Status retrieved', 'success');
        return `System online. Current page: ${locationRef.current}. Agents loaded: ${agentsRef.current.length}.`;
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

      // ============= ENHANCED C-SUITE DATA HUB CONTROLS =============

      // Create item in domain (respects persona permissions via backend)
      createDataItem: async (params: { domain: string; title: string; content?: string; description?: string; metadata?: Record<string, any> }) => {
        const logId = addLogRef.current('createDataItem', params, 'Creating item...', 'pending');
        try {
          const domainKey = getDomainKeyFromName(params.domain);
          if (!domainKey) {
            throw new Error(`Unknown domain: ${params.domain}`);
          }

          const tableMap: Record<string, string> = {
            communications: 'csuite_communications',
            documents: 'csuite_documents',
            events: 'csuite_events',
            financials: 'csuite_financials',
            tasks: 'csuite_tasks',
            knowledge: 'csuite_knowledge',
          };

          const tableName = tableMap[domainKey];
          const { data, error } = await supabase
            .from(tableName as any)
            .insert({
              user_id: userRef.current?.id,
              source: 'atlas',
              title: params.title,
              content: params.content || '',
              description: params.description || '',
              type: 'general',
              ...params.metadata,
            } as any)
            .select()
            .single();

          if (error) throw error;

          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: `Created: ${params.title}`, status: 'success' } : l
          ));
          toast.success(`Created ${params.domain} item: ${params.title}`);
          return `Successfully created "${params.title}" in ${params.domain}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Creation failed';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error(msg);
          return `Error: ${msg}`;
        }
      },

      // Query items from domain
      queryDataItems: async (params: { domain: string; limit?: number; search?: string }) => {
        const logId = addLogRef.current('queryDataItems', params, 'Querying...', 'pending');
        try {
          const domainKey = getDomainKeyFromName(params.domain);
          if (!domainKey) {
            throw new Error(`Unknown domain: ${params.domain}`);
          }

          const tableMap: Record<string, string> = {
            communications: 'csuite_communications',
            documents: 'csuite_documents',
            events: 'csuite_events',
            financials: 'csuite_financials',
            tasks: 'csuite_tasks',
            knowledge: 'csuite_knowledge',
          };

          const tableName = tableMap[domainKey];
          let query = supabase
            .from(tableName as any)
            .select('*')
            .eq('user_id', userRef.current?.id)
            .order('created_at', { ascending: false })
            .limit(params.limit || 10) as any;

          const { data, error } = await query;

          if (error) throw error;

          const items = data || [];
          const summary = items.slice(0, 5).map((item: any) =>
            `• ${item.title || item.subject || 'Untitled'}`
          ).join('\n');

          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: `Found ${items.length} items`, status: 'success' } : l
          ));

          return `Found ${items.length} items in ${params.domain}:\n${summary}${items.length > 5 ? `\n... and ${items.length - 5} more` : ''}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Query failed';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Run enterprise analysis
      runEnterpriseAnalysis: async (params: { query: string; domains?: string[] }) => {
        const logId = addLogRef.current('runEnterpriseAnalysis', params, 'Analyzing...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-enterprise-query', {
            body: {
              action: 'analyze',
              userId: userRef.current?.id,
              query: params.query,
              domains: params.domains,
              options: { depth: 'detailed', includeAgents: true }
            }
          });

          if (response.error) throw response.error;

          const analysis = response.data;
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: 'Analysis complete', status: 'success' } : l
          ));
          toast.success('Enterprise analysis complete');

          const summary = analysis?.executiveSummary || 'Analysis completed successfully.';
          const risks = analysis?.risks?.slice(0, 3).map((r: any) => `• ${r.risk}`).join('\n') || '';

          return `${summary}${risks ? '\n\nKey Risks:\n' + risks : ''}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Analysis failed';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          toast.error(msg);
          return `Error: ${msg}`;
        }
      },

      // Get enterprise recommendations
      getStrategicRecommendations: async (params: { focus?: string }) => {
        const logId = addLogRef.current('getStrategicRecommendations', params, 'Getting recommendations...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-enterprise-query', {
            body: {
              action: 'recommend',
              userId: userRef.current?.id,
              query: params.focus || 'strategic priorities',
            }
          });

          if (response.error) throw response.error;

          const recs = response.data;
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: 'Recommendations ready', status: 'success' } : l
          ));

          const immediate = recs?.immediate?.slice(0, 3).map((r: any) => `• ${r.action}`).join('\n') || 'No immediate actions';
          const strategic = recs?.strategic?.slice(0, 2).map((s: any) => `• ${s.initiative}`).join('\n') || '';

          return `Immediate Actions:\n${immediate}${strategic ? '\n\nStrategic Initiatives:\n' + strategic : ''}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to get recommendations';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Execute quick action by ID
      executeQuickAction: async (params: { actionId: string }) => {
        const logId = addLogRef.current('executeQuickAction', params, 'Executing action...', 'pending');

        const actionMap: Record<string, () => string> = {
          'email': () => {
            useDataHubController.getState().setExpandedDomain('communications');
            useDataHubController.getState().setActiveTab('command');
            return 'Opened communications domain';
          },
          'tasks': () => {
            useDataHubController.getState().setExpandedDomain('tasks');
            useDataHubController.getState().setActiveTab('command');
            return 'Opened tasks domain';
          },
          'calendar': () => {
            useDataHubController.getState().setExpandedDomain('events');
            useDataHubController.getState().setActiveTab('command');
            return 'Opened events/calendar domain';
          },
          'documents': () => {
            useDataHubController.getState().setExpandedDomain('documents');
            useDataHubController.getState().setActiveTab('command');
            return 'Opened documents domain';
          },
          'financials': () => {
            useDataHubController.getState().setExpandedDomain('financials');
            useDataHubController.getState().setActiveTab('command');
            return 'Opened financials domain';
          },
          'knowledge': () => {
            useDataHubController.getState().setExpandedDomain('knowledge');
            useDataHubController.getState().setActiveTab('command');
            return 'Opened knowledge base';
          },
          'insights': () => {
            useDataHubController.getState().setActiveTab('insights');
            return 'Switched to insights tab';
          },
          'admin': () => {
            useDataHubController.getState().setActiveTab('admin');
            return 'Switched to admin tab';
          },
          'refresh': () => {
            useDataHubController.getState().requestRefresh();
            return 'Triggered data refresh';
          },
        };

        const action = actionMap[params.actionId];
        if (action) {
          const result = action();
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result, status: 'success' } : l
          ));
          toast.info(result);
          return result;
        }

        setActionLogs(prev => prev.map(l =>
          l.id === logId ? { ...l, result: 'Unknown action', status: 'error' } : l
        ));
        return `Unknown action: ${params.actionId}. Available: email, tasks, calendar, documents, financials, knowledge, insights, admin, refresh`;
      },

      // Get current Data Hub state
      getDataHubState: () => {
        const state = useDataHubController.getState();
        addLogRef.current('getDataHubState', {}, 'State retrieved', 'success');
        return `Current Data Hub state:
- Active Tab: ${state.activeTab}
- Expanded Domain: ${state.expandedDomain || 'none'}
- Target Persona: ${state.targetPersona || 'default'}
- Pending Report: ${state.triggerReportGeneration ? state.reportPersona : 'none'}`;
      },

      // Get available domains for current user's persona
      getAccessibleDomains: () => {
        addLogRef.current('getAccessibleDomains', {}, 'Domains listed', 'success');
        return 'Available domains: communications (email, messages), documents (files, reports), events (calendar, meetings), financials (invoices, budgets), tasks (to-dos, projects), knowledge (wiki, policies)';
      },

      // ============= SHARED DASHBOARD CONTROLS =============

      // List all shared dashboards the user has access to
      listSharedDashboards: async () => {
        const logId = addLogRef.current('listSharedDashboards', {}, 'Fetching dashboards...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { action: 'dashboard_list', userId: userRef.current?.id }
          });

          if (response.error) throw response.error;

          const dashboards = response.data?.dashboards || [];
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: `Found ${dashboards.length} dashboards`, status: 'success' } : l
          ));

          if (dashboards.length === 0) {
            return 'You have no shared dashboards. You can create one from the Data Hub.';
          }

          const summary = dashboards.map((d: any) => 
            `• ${d.name} (${d.member_count} members, ${d.role})`
          ).join('\n');

          return `Your shared dashboards:\n${summary}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to list dashboards';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Select/switch to a specific dashboard
      selectDashboard: async (params: { dashboardName: string }) => {
        const logId = addLogRef.current('selectDashboard', params, 'Selecting dashboard...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'dashboard_select', 
              userId: userRef.current?.id,
              dashboardName: params.dashboardName
            }
          });

          if (response.error) throw response.error;

          const dashboard = response.data?.dashboard;
          if (!dashboard) {
            setActionLogs(prev => prev.map(l =>
              l.id === logId ? { ...l, result: 'Dashboard not found', status: 'error' } : l
            ));
            return `Could not find a dashboard matching "${params.dashboardName}"`;
          }

          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: `Selected: ${dashboard.name}`, status: 'success' } : l
          ));
          toast.info(`Switched to dashboard: ${dashboard.name}`);
          return `Switched to "${dashboard.name}" dashboard. You have ${dashboard.role} access with ${dashboard.member_count} team members.`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to select dashboard';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Get dashboard messages/chat
      getDashboardMessages: async (params: { dashboardName?: string; limit?: number }) => {
        const logId = addLogRef.current('getDashboardMessages', params, 'Fetching messages...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'dashboard_messages', 
              userId: userRef.current?.id,
              dashboardName: params.dashboardName,
              limit: params.limit || 10
            }
          });

          if (response.error) throw response.error;

          const messages = response.data?.messages || [];
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: `Got ${messages.length} messages`, status: 'success' } : l
          ));

          if (messages.length === 0) {
            return 'No messages in this dashboard yet.';
          }

          const summary = messages.map((m: any) => 
            `${m.sender_name}: ${m.content.slice(0, 100)}${m.content.length > 100 ? '...' : ''}`
          ).join('\n');

          return `Recent messages:\n${summary}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to get messages';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Send a message to dashboard chat
      sendDashboardMessage: async (params: { message: string; dashboardName?: string }) => {
        const logId = addLogRef.current('sendDashboardMessage', params, 'Sending message...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'dashboard_send_message', 
              userId: userRef.current?.id,
              dashboardName: params.dashboardName,
              message: params.message
            }
          });

          if (response.error) throw response.error;

          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: 'Message sent', status: 'success' } : l
          ));
          toast.success('Message sent to dashboard');
          return `Message sent: "${params.message.slice(0, 50)}${params.message.length > 50 ? '...' : ''}"`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to send message';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // List files in dashboard
      listDashboardFiles: async (params: { dashboardName?: string }) => {
        const logId = addLogRef.current('listDashboardFiles', params, 'Listing files...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'dashboard_files', 
              userId: userRef.current?.id,
              dashboardName: params.dashboardName
            }
          });

          if (response.error) throw response.error;

          const files = response.data?.files || [];
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: `Found ${files.length} files`, status: 'success' } : l
          ));

          if (files.length === 0) {
            return 'No files have been uploaded to this dashboard yet.';
          }

          const summary = files.map((f: any) => 
            `• ${f.file_name} (${f.size_formatted}, by ${f.uploader_name})`
          ).join('\n');

          return `Dashboard files:\n${summary}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to list files';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Get user's dashboard notifications
      getMyDashboardNotifications: async () => {
        const logId = addLogRef.current('getMyDashboardNotifications', {}, 'Fetching notifications...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'dashboard_notifications', 
              userId: userRef.current?.id
            }
          });

          if (response.error) throw response.error;

          const notifications = response.data?.notifications || [];
          const unreadCount = notifications.filter((n: any) => !n.is_read).length;

          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: `${unreadCount} unread`, status: 'success' } : l
          ));

          if (notifications.length === 0) {
            return 'You have no dashboard notifications.';
          }

          const summary = notifications.slice(0, 5).map((n: any) => 
            `• ${n.title}${n.is_read ? '' : ' (unread)'}`
          ).join('\n');

          return `You have ${unreadCount} unread notifications:\n${summary}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to get notifications';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Get dashboard summary (AI-generated)
      getDashboardSummary: async (params: { dashboardName?: string }) => {
        const logId = addLogRef.current('getDashboardSummary', params, 'Generating summary...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'dashboard_summary', 
              userId: userRef.current?.id,
              dashboardName: params.dashboardName
            }
          });

          if (response.error) throw response.error;

          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: 'Summary generated', status: 'success' } : l
          ));

          return response.data?.summary || 'No summary available for this dashboard.';
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to generate summary';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Get dashboard members
      getDashboardMembers: async (params: { dashboardName?: string }) => {
        const logId = addLogRef.current('getDashboardMembers', params, 'Fetching members...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-orchestrator', {
            body: { 
              action: 'dashboard_members', 
              userId: userRef.current?.id,
              dashboardName: params.dashboardName
            }
          });

          if (response.error) throw response.error;

          const members = response.data?.members || [];
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: `Found ${members.length} members`, status: 'success' } : l
          ));

          if (members.length === 0) {
            return 'This dashboard has no members yet.';
          }

          const summary = members.map((m: any) => 
            `• ${m.display_name || m.user_id} (${m.role})`
          ).join('\n');

          return `Dashboard members:\n${summary}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Failed to get members';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // Query across all accessible dashboards
      queryAcrossDashboards: async (params: { query: string }) => {
        const logId = addLogRef.current('queryAcrossDashboards', params, 'Searching dashboards...', 'pending');
        try {
          const response = await supabase.functions.invoke('atlas-enterprise-query', {
            body: { 
              action: 'dashboard_correlate', 
              userId: userRef.current?.id,
              query: params.query
            }
          });

          if (response.error) throw response.error;

          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: 'Query complete', status: 'success' } : l
          ));

          return response.data?.answer || 'No results found across dashboards.';
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Query failed';
          setActionLogs(prev => prev.map(l =>
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          return `Error: ${msg}`;
        }
      },

      // ============= SONIC ENTITY UI BRIDGE TOOLS =============

      // Perceive the current UI state as Sonic Entities
      perceiveUI: () => {
        addLogRef.current('perceiveUI', {}, 'Perceiving UI...', 'success');
        return atlasUIClientTools.perceiveUI();
      },

      // Query UI elements by natural language
      queryUI: (params: { query: string }) => {
        addLogRef.current('queryUI', params, 'Querying UI...', 'success');
        return atlasUIClientTools.queryUI(params);
      },

      // Execute an action on a UI entity
      executeUIAction: async (params: { entityId: string; action: string; parameters?: Record<string, unknown> }) => {
        const logId = addLogRef.current('executeUIAction', params, 'Executing action...', 'pending');
        const result = await atlasUIClientTools.executeUIAction(params);
        setActionLogs(prev => prev.map(l =>
          l.id === logId ? { ...l, result, status: result.includes('Error') ? 'error' : 'success' } : l
        ));
        return result;
      },

      // Find relevant UI elements for a given context
      findRelevantUI: (params: { context: string; limit?: number }) => {
        addLogRef.current('findRelevantUI', params, 'Finding relevant UI...', 'success');
        return atlasUIClientTools.findRelevantUI(params);
      },

      // Get detailed description of a UI element
      describeUIElement: (params: { entityId: string }) => {
        addLogRef.current('describeUIElement', params, 'Describing element...', 'success');
        return atlasUIClientTools.describeUIElement(params);
      },

      // Get all actionable elements in the current UI
      getActionableElements: () => {
        addLogRef.current('getActionableElements', {}, 'Getting actions...', 'success');
        return atlasUIClientTools.getActionableElements();
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
          
          atlasMemoryRef.current.storeMessage(role, content, {
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
  }), [navigate]); // All location/agent refs are stable - no pathname dependency needed

  // Memoize the full config to prevent recreating useConversation on every render
  const fullConversationConfig = useMemo(() => ({
    ...conversationConfig,
  }), [conversationConfig]);
  
  const conversation = useConversation(fullConversationConfig);
  conversationRef.current = conversation;

  const isConnected = conversation.status === "connected";
  
  // Handle mute state separately via conversation.setVolume to avoid re-initializing
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

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
          // Get the user's session token for authentication
          const { data: { session } } = await supabase.auth.getSession();
          const accessToken = session?.access_token;
          
          if (!accessToken) {
            throw new Error("You must be logged in to use voice features");
          }

          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-conversation-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${accessToken}`,
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
      
      if (atlasMemoryRef.current.contextString) {
        pendingMemoryContextRef.current = atlasMemoryRef.current.contextString;
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
  }, [conversation, isConnecting, user]);

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
      atlasMemoryRef.current.storeMessage('user', text, {
        timestamp: new Date().toISOString(),
        source: 'text'
      });

      // Parse for voice commands
      const intent = voiceIntentParser.parse(text);
      if (intent) {
        useVoiceCommandBus.getState().sendCommand(intent.command);
      }
    }
  }, []);

  // Send contextual update to Atlas
  const sendContextualUpdate = useCallback((text: string) => {
    if (isConnected && conversation) {
      conversation.sendContextualUpdate(text);
    }
  }, [isConnected, conversation]);

  // Manual web search (for user-initiated searches from UI)
  const manualWebSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsWebSearching(true);
    const searchId = `search-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    
    // Add search entry as "searching"
    setWebSearches(prev => [{
      id: searchId,
      query: query,
      status: 'searching' as const,
      timestamp: new Date(),
      mode: 'search' as const,
    }, ...prev].slice(0, 20));
    
    try {
      const response = await supabase.functions.invoke('atlas-orchestrator', {
        body: { action: 'web_search', query: query }
      });
      
      if (response.error) throw response.error;
      
      const answer = response.data?.answer || 'No results found';
      const citations = response.data?.citations || [];
      
      // Update search entry to "complete"
      setWebSearches(prev => prev.map(s => 
        s.id === searchId ? { ...s, status: 'complete' as const, answer, citations } : s
      ));
      
      toast.success(`Search complete: "${query.slice(0, 30)}${query.length > 30 ? '...' : ''}"`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Web search failed';
      
      // Update search entry to "error"
      setWebSearches(prev => prev.map(s => 
        s.id === searchId ? { ...s, status: 'error' as const } : s
      ));
      
      toast.error('Search failed: ' + msg);
    } finally {
      setIsWebSearching(false);
    }
  }, []);
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

  // Extract stable properties from conversation to avoid object reference comparison
  const conversationStatus = conversation.status;
  const conversationIsSpeaking = conversation.isSpeaking;
  
  const value: AtlasContextValue = useMemo(() => ({
    isConnected,
    isConnecting,
    isMuted,
    isSpeaking: conversationIsSpeaking,
    status: conversationStatus,
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
    webSearches,
    manualWebSearch,
    isWebSearching,
    wakeWordStatus,
    wakeWordEnabled,
    setWakeWordEnabled,
    wakeWord,
    setWakeWord,
    conversation,
  }), [
    isConnected, isConnecting, isMuted, conversationIsSpeaking, conversationStatus,
    audioLevels, inputVolume, outputVolume, frequencyBands, transcript, isTranscribing,
    startConversation, stopConversation, toggleMute, sendTextMessage, sendContextualUpdate,
    goBack, goForward, canGoBack, canGoForward, location.pathname,
    isExpanded, isMinimized, actionLogs, searchResults, synthesizedAgent,
    webSearches, manualWebSearch, isWebSearching, wakeWordStatus, wakeWordEnabled,
    wakeWord, conversation
  ]);

  return (
    <AtlasContext.Provider value={value}>
      {children}
    </AtlasContext.Provider>
  );
}
