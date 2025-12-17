// Atlas Voice Agent Dashboard - Full Ecosystem Control

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from "@elevenlabs/react";
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
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToolActivityIndicator } from '@/components/atlas/ToolActivityIndicator';
import { ActionLogItem } from '@/components/atlas/ActionLogItem';

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

export default function Atlas() {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [synthesizedAgent, setSynthesizedAgent] = useState<any>(null);
  const [toolActivities, setToolActivities] = useState<{ tool: string; status: 'active' | 'success' | 'error'; timestamp: Date }[]>([]);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const animationRef = useRef<number>();

  const addToolActivity = (tool: string, status: 'active' | 'success' | 'error') => {
    setToolActivities(prev => [{ tool, status, timestamp: new Date() }, ...prev].slice(0, 5));
    
    // Auto-remove after 3 seconds for success/error
    if (status !== 'active') {
      setTimeout(() => {
        setToolActivities(prev => prev.filter(a => !(a.tool === tool && a.status === status)));
      }, 3000);
    }
  };

  const addLog = (action: string, params: Record<string, unknown>, result: string, status: 'success' | 'error' | 'pending') => {
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
  };

  const conversation = useConversation({
    clientTools: {
      // Search agents by query
      searchAgents: async (params: { query: string }) => {
        addToolActivity('searchAgents', 'active');
        const logId = addLog('searchAgents', params, 'Searching...', 'pending');
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
          
          addToolActivity('searchAgents', 'success');
          toast.success(`Found ${agents.length} agents matching "${params.query}"`);
          return `Found ${agents.length} agents: ${agents.map((a: any) => a.name).join(', ')}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Search failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          addToolActivity('searchAgents', 'error');
          toast.error('Search failed');
          return `Error: ${msg}`;
        }
      },

      synthesizeAgent: async (params: { agentIds: string[]; requirements: string }) => {
        addToolActivity('synthesizeAgent', 'active');
        const logId = addLog('synthesizeAgent', params, 'Synthesizing...', 'pending');
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
          
          addToolActivity('synthesizeAgent', 'success');
          toast.success(`Synthesized new agent: ${newAgent?.name}`);
          return `Successfully synthesized agent: ${newAgent?.name}. Description: ${newAgent?.description}`;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Synthesis failed';
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: msg, status: 'error' } : l
          ));
          addToolActivity('synthesizeAgent', 'error');
          toast.error('Synthesis failed');
          return `Error: ${msg}`;
        }
      },

      // Navigate to different pages
      navigateTo: (params: { page: string }) => {
        addToolActivity('navigateTo', 'active');
        addLog('navigateTo', params, `Navigating to ${params.page}`, 'success');
        
        const routes: Record<string, string> = {
          'home': '/',
          'main': '/',
          'dashboard': '/',
          'agents': '/',
          'import': '/import',
          'auth': '/auth',
          'login': '/auth'
        };
        
        const route = routes[params.page.toLowerCase()] || '/';
        toast.info(`Navigating to ${params.page}`);
        addToolActivity('navigateTo', 'success');
        
        setTimeout(() => navigate(route), 500);
        return `Navigating to ${params.page}`;
      },

      showNotification: (params: { title: string; message: string; type?: string }) => {
        addToolActivity('showNotification', 'active');
        addLog('showNotification', params, 'Notification shown', 'success');
        
        const toastType = params.type || 'info';
        if (toastType === 'success') toast.success(params.message);
        else if (toastType === 'error') toast.error(params.message);
        else if (toastType === 'warning') toast.warning(params.message);
        else toast.info(params.message);
        
        addToolActivity('showNotification', 'success');
        return `Displayed ${toastType} notification: ${params.title}`;
      },

      getSystemStatus: () => {
        addToolActivity('getSystemStatus', 'active');
        addLog('getSystemStatus', {}, 'Status retrieved', 'success');
        
        const status = {
          connected: true,
          searchResults: searchResults.length,
          lastSynthesis: synthesizedAgent?.name || 'None',
          actionLogsCount: actionLogs.length
        };
        
        addToolActivity('getSystemStatus', 'success');
        return `System online. ${searchResults.length} agents in memory. Last synthesis: ${synthesizedAgent?.name || 'None'}. ${actionLogs.length} actions logged.`;
      },

      clearResults: () => {
        addToolActivity('clearResults', 'active');
        addLog('clearResults', {}, 'Results cleared', 'success');
        setSearchResults([]);
        setSynthesizedAgent(null);
        toast.info('Results cleared');
        addToolActivity('clearResults', 'success');
        return 'Search results and synthesis data cleared';
      },

      listSectors: () => {
        addToolActivity('listSectors', 'active');
        addLog('listSectors', {}, 'Sectors listed', 'success');
        const sectors = ['FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY'];
        addToolActivity('listSectors', 'success');
        return `Available sectors: ${sectors.join(', ')}`;
      },

      getAgentDetails: (params: { agentId: string }) => {
        addToolActivity('getAgentDetails', 'active');
        const logId = addLog('getAgentDetails', params, 'Fetching details...', 'pending');
        
        const agent = searchResults.find(a => a.id === params.agentId);
        if (agent) {
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: `Found: ${agent.name}`, status: 'success' } : l
          ));
          addToolActivity('getAgentDetails', 'success');
          return `Agent: ${agent.name}, Sector: ${agent.sector}, Description: ${agent.description || 'No description'}`;
        }
        
        setActionLogs(prev => prev.map(l => 
          l.id === logId ? { ...l, result: 'Agent not found', status: 'error' } : l
        ));
        addToolActivity('getAgentDetails', 'error');
        return 'Agent not found in current search results. Please search first.';
      }
    },
    onConnect: () => {
      console.log("[Atlas] Connected to voice agent");
      addLog('system', {}, 'Connected to Atlas', 'success');
      toast.success('Atlas online');
    },
    onDisconnect: () => {
      console.log("[Atlas] Disconnected from voice agent");
      addLog('system', {}, 'Disconnected from Atlas', 'success');
    },
    onMessage: (message) => {
      console.log("[Atlas] Message:", message);
    },
    onError: (error) => {
      console.error("[Atlas] Error:", error);
      addLog('system', { error }, 'Connection error', 'error');
      toast.error('Atlas connection error');
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: ATLAS_AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("[Atlas] Failed to start:", error);
      toast.error('Failed to start Atlas');
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

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

  // Sync audio visualization to actual voice output
  useEffect(() => {
    if (!isConnected) {
      setAudioLevels(new Array(20).fill(0));
      return;
    }

    const updateAudioLevels = () => {
      const frequencyData = conversation.getOutputByteFrequencyData();
      
      if (frequencyData && frequencyData.length > 0) {
        // Sample 20 points from the frequency data
        const newLevels = Array.from({ length: 20 }, (_, i) => {
          const index = Math.floor((i / 20) * frequencyData.length);
          return frequencyData[index] / 255; // Normalize to 0-1
        });
        setAudioLevels(newLevels);
      } else {
        // Subtle idle animation when not speaking
        setAudioLevels(prev => prev.map((_, i) => 
          0.1 + Math.sin(Date.now() / 500 + i * 0.3) * 0.05
        ));
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-14 bg-card/80 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Hexagon size={32} className="text-primary" />
              <Radio size={14} className="absolute inset-0 m-auto text-primary-foreground" />
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
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-success animate-pulse" : "bg-destructive"
          }`} />
          <span className="text-xs font-mono text-muted-foreground">
            {conversation.status.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Panel - Visualizer & Controls */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Tool Activity Indicator */}
          <ToolActivityIndicator activities={toolActivities} />
          
          {/* Central Visualizer */}
          <div className="relative w-64 h-64 mb-6">
            {/* Outer ring */}
            <div className={`absolute inset-0 rounded-full border-2 ${
              isConnected ? 'border-primary animate-pulse' : 'border-border'
            }`} />
            
            {/* Middle ring */}
            <div className={`absolute inset-4 rounded-full border ${
              isConnected && conversation.isSpeaking 
                ? 'border-secondary animate-spin' 
                : 'border-border/50'
            }`} style={{ animationDuration: '3s' }} />
            
            {/* Inner circle with visualizer */}
            <div className="absolute inset-8 rounded-full bg-card/50 backdrop-blur-sm border border-border flex items-center justify-center overflow-hidden">
              <div className="flex items-center justify-center gap-0.5 h-24">
                {audioLevels.map((level, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isConnected 
                        ? conversation.isSpeaking 
                          ? 'bg-secondary' 
                          : 'bg-primary'
                        : 'bg-muted'
                    }`}
                    style={{
                      height: isConnected 
                        ? `${Math.max(15, level * 85)}%`
                        : '15%',
                      opacity: isConnected ? 0.6 + level * 0.4 : 0.3,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Status text */}
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <p className="text-sm font-mono text-muted-foreground">
                {isConnected 
                  ? conversation.isSpeaking 
                    ? "ATLAS IS SPEAKING" 
                    : "LISTENING..."
                  : "OFFLINE"
                }
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3 mt-8">
            {!isConnected ? (
              <Button
                onClick={startConversation}
                disabled={isConnecting}
                size="lg"
                className="gap-2 font-mono"
              >
                <Mic className="w-5 h-5" />
                {isConnecting ? "CONNECTING..." : "ACTIVATE ATLAS"}
              </Button>
            ) : (
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

          {/* Capabilities */}
          <div className="mt-8 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search size={14} className="text-primary" />
              <span>Search Agents</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles size={14} className="text-secondary" />
              <span>Synthesize Agents</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bot size={14} className="text-accent" />
              <span>Agent Details</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database size={14} className="text-primary" />
              <span>System Status</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Results & Logs */}
        <div className="w-96 flex flex-col gap-4">
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-card/50 border border-border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Search size={14} className="text-primary" />
                <span className="text-xs font-mono text-muted-foreground">
                  SEARCH RESULTS ({searchResults.length})
                </span>
              </div>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {searchResults.map((agent) => (
                    <div key={agent.id} className="p-2 bg-background/50 rounded border border-border/50">
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
            <div className="bg-card/50 border border-secondary/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-secondary" />
                <span className="text-xs font-mono text-muted-foreground">SYNTHESIZED AGENT</span>
              </div>
              <div className="p-2 bg-background/50 rounded border border-border/50">
                <div className="text-sm font-mono text-secondary">{synthesizedAgent.name}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{synthesizedAgent.sector}</div>
                <div className="text-xs text-foreground/80 mt-2">{synthesizedAgent.description}</div>
              </div>
            </div>
          )}

          {/* Action Logs */}
          <div className="flex-1 bg-card/50 border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={14} className="text-primary" />
              <span className="text-xs font-mono text-muted-foreground">ACTION LOG</span>
              {actionLogs.some(l => l.status === 'pending') && (
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  <span className="text-[10px] text-secondary">PROCESSING</span>
                </div>
              )}
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {actionLogs.length === 0 ? (
                  <div className="text-muted-foreground/50 text-center py-4 text-xs">
                    No actions yet. Activate Atlas to begin.
                  </div>
                ) : (
                  actionLogs.map((log) => (
                    <ActionLogItem key={log.id} log={log} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card/50 border border-border rounded p-2 text-center">
              <Waves size={16} className="mx-auto mb-1 text-primary" />
              <p className="text-[10px] text-muted-foreground">AUDIO</p>
              <p className="text-xs font-mono">{isConnected ? 'ON' : 'OFF'}</p>
            </div>
            <div className="bg-card/50 border border-border rounded p-2 text-center">
              <Activity size={16} className="mx-auto mb-1 text-secondary" />
              <p className="text-[10px] text-muted-foreground">MODE</p>
              <p className="text-xs font-mono">
                {isConnected ? (conversation.isSpeaking ? 'OUT' : 'IN') : '---'}
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded p-2 text-center">
              <Zap size={16} className="mx-auto mb-1 text-accent" />
              <p className="text-[10px] text-muted-foreground">TOOLS</p>
              <p className="text-xs font-mono">8</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
