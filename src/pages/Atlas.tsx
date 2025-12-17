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
  Users,
  Eye,
  Ear
} from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useAtlasContext } from '@/hooks/useAtlasContext';
import { useWakeWord } from '@/hooks/useWakeWord';
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
  const { agents, loading: agentsLoading } = useAgents();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [synthesizedAgent, setSynthesizedAgent] = useState<any>(null);
  const [toolActivities, setToolActivities] = useState<{ tool: string; status: 'active' | 'success' | 'error'; timestamp: Date }[]>([]);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(20).fill(0));
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [frequencyBands, setFrequencyBands] = useState({ bass: 0, mid: 0, treble: 0 });
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true);
  const animationRef = useRef<number>();
  const conversationRef = useRef<any>(null);

  // Get active agents (those with ACTIVE or PROCESSING status)
  const activeAgents = agents.filter(a => a.status === 'ACTIVE' || a.status === 'PROCESSING').slice(0, 6);

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
    onMessage: (message: any) => {
      console.log("[Atlas] Message:", message);
      
      // Handle agent transcript events
      if (message.type === 'agent_response') {
        setTranscript(message.agent_response_event?.agent_response || '');
        setIsTranscribing(true);
      } else if (message.type === 'agent_response_correction') {
        setTranscript(message.agent_response_correction_event?.corrected_agent_response || '');
      } else if (message.type === 'response.audio_transcript.delta') {
        setTranscript(prev => prev + (message.delta || ''));
        setIsTranscribing(true);
      } else if (message.type === 'response.audio.done' || message.type === 'agent_response_done') {
        setIsTranscribing(false);
      }
    },
    onError: (error) => {
      console.error("[Atlas] Error:", error);
      addLog('system', { error }, 'Connection error', 'error');
      toast.error('Atlas connection error');
    },
  });

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
      console.log("[Atlas] Microphone permission granted, starting session...");
      
      await conversation.startSession({
        agentId: ATLAS_AGENT_ID,
        connectionType: "webrtc",
      });
      console.log("[Atlas] Session started successfully");
    } catch (error) {
      console.error("[Atlas] Failed to start:", error);
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to start Atlas: ${errMsg}`);
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, isConnecting]);

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

  // Wake word detection
  const { isListening: isWakeWordListening, isSupported: isWakeWordSupported, startListening: startWakeWordListening, stopListening: stopWakeWordListening } = useWakeWord({
    wakeWord: 'atlas',
    onWakeWordDetected: () => {
      if (!isConnected && !isConnecting) {
        toast.info('Wake word detected! Activating Atlas...');
        startConversation();
      }
    },
    enabled: wakeWordEnabled && !isConnected
  });

  // Toggle wake word mode
  const toggleWakeWord = useCallback(() => {
    setWakeWordEnabled(prev => !prev);
  }, []);

  // Keep wake word listening state in sync with the toggle + connection state
  useEffect(() => {
    // When wake word mode is ON and we're not connected, ensure listening is active
    if (wakeWordEnabled && !isConnected && isWakeWordSupported && !isWakeWordListening) {
      startWakeWordListening();
      return;
    }

    // When wake word mode is OFF (or we're connected), ensure listening is stopped
    if ((!wakeWordEnabled || isConnected) && isWakeWordListening) {
      stopWakeWordListening();
    }
  }, [
    wakeWordEnabled,
    isConnected,
    isWakeWordSupported,
    isWakeWordListening,
    startWakeWordListening,
    stopWakeWordListening,
  ]);

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
        // Subtle idle animation when not speaking
        setAudioLevels(prev => prev.map((_, i) => 
          0.1 + Math.sin(Date.now() / 500 + i * 0.3) * 0.05
        ));
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
        <div className="flex items-center gap-4">
          {/* State Streaming Indicator */}
          {isConnected && (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10 border border-primary/30">
              <Eye size={12} className="text-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary">CONTEXT SYNC</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-success animate-pulse" : "bg-destructive"
            }`} />
            <span className="text-xs font-mono text-muted-foreground">
              {conversation.status.toUpperCase()}
            </span>
          </div>
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
            {/* Bass-reactive outer ring */}
            {isConnected && (
              <div
                className="absolute -inset-4 rounded-full border-2 transition-all duration-100"
                style={{
                  borderColor: conversation.isSpeaking 
                    ? `hsl(var(--secondary) / ${0.3 + frequencyBands.bass * 0.7})` 
                    : `hsl(var(--primary) / ${0.2 + inputVolume * 0.5})`,
                  transform: `scale(${1 + frequencyBands.bass * 0.1})`,
                  boxShadow: frequencyBands.bass > 0.3 
                    ? `0 0 ${20 + frequencyBands.bass * 30}px hsl(var(--secondary) / ${frequencyBands.bass * 0.5})`
                    : 'none'
                }}
              />
            )}
            
            {/* Mid-frequency reactive rings */}
            {isConnected && conversation.isSpeaking && (
              <>
                {[0, 1, 2].map((i) => (
                  <div
                    key={`ring-${i}`}
                    className="absolute inset-0 rounded-full border animate-ring-pulse"
                    style={{
                      animationDelay: `${i * 0.4}s`,
                      borderColor: `hsl(var(--secondary) / ${0.3 + frequencyBands.mid * 0.5})`,
                      transform: `scale(${1 + frequencyBands.mid * 0.05 * i})`,
                    }}
                  />
                ))}
              </>
            )}
            
            {/* User speaking indicator - input volume reactive */}
            {isConnected && !conversation.isSpeaking && inputVolume > 0.1 && (
              <div
                className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-pulse"
                style={{
                  transform: `scale(${1 + inputVolume * 0.15})`,
                  boxShadow: `0 0 ${15 + inputVolume * 25}px hsl(var(--primary) / ${inputVolume * 0.6})`
                }}
              />
            )}
            
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
            
            {/* Inner circle - Cosmic Orb */}
            <div 
              className={`absolute inset-8 rounded-full bg-black/80 border border-border flex items-center justify-center overflow-hidden ${
                !isConnected && !isConnecting && !wakeWordEnabled ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''
              }`}
              onClick={() => {
                // Tap activation is ONLY when wake word mode is off
                if (!wakeWordEnabled && !isConnected && !isConnecting) {
                  startConversation();
                }
              }}
              title={!isConnected && !wakeWordEnabled ? "Tap to activate Atlas" : undefined}
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
                  {/* Base nebula layer */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(ellipse at ${30 + frequencyBands.bass * 20}% ${40 + frequencyBands.mid * 20}%, 
                        hsl(270 100% ${isConnected ? 45 + outputVolume * 35 : isWakeWordListening ? 40 : 35}% / ${0.8 + outputVolume * 0.2}) 0%,
                        hsl(220 100% ${isConnected ? 35 + outputVolume * 25 : isWakeWordListening ? 32 : 28}% / ${0.7 + outputVolume * 0.3}) 30%,
                        hsl(280 100% ${isConnected ? 28 + outputVolume * 20 : isWakeWordListening ? 25 : 22}% / ${0.6 + outputVolume * 0.3}) 60%,
                        transparent 100%)`,
                      animation: isConnected && conversation.isSpeaking 
                        ? 'orb-pulse 0.5s ease-in-out infinite' 
                        : isWakeWordListening 
                          ? 'orb-pulse 2s ease-in-out infinite' 
                          : 'orb-idle 4s ease-in-out infinite',
                    }}
                  />
                  
                  {/* Swirling nebula clouds layer 1 */}
                  <div 
                    className="absolute inset-0 rounded-full mix-blend-screen"
                    style={{
                      background: `conic-gradient(from ${Date.now() / 50 % 360}deg at 50% 50%,
                        transparent 0deg,
                        hsl(280 100% ${60 + frequencyBands.bass * 30}% / ${0.5 + outputVolume * 0.4}) 60deg,
                        transparent 120deg,
                        hsl(200 100% ${70 + frequencyBands.mid * 25}% / ${0.45 + outputVolume * 0.4}) 180deg,
                        transparent 240deg,
                        hsl(320 100% ${65 + frequencyBands.treble * 30}% / ${0.4 + outputVolume * 0.4}) 300deg,
                        transparent 360deg)`,
                      animation: isConnected && conversation.isSpeaking 
                        ? `orb-swirl ${2 - outputVolume}s linear infinite` 
                        : 'orb-swirl 8s linear infinite',
                      filter: `blur(${6 - outputVolume * 3}px)`,
                    }}
                  />
                  
                  {/* Secondary swirl - counter rotation */}
                  <div 
                    className="absolute inset-2 rounded-full mix-blend-screen"
                    style={{
                      background: `conic-gradient(from ${180 + Date.now() / 80 % 360}deg at 55% 45%,
                        transparent 0deg,
                        hsl(180 100% ${75 + frequencyBands.treble * 20}% / ${0.4 + outputVolume * 0.4}) 90deg,
                        transparent 180deg,
                        hsl(260 100% ${70 + frequencyBands.bass * 25}% / ${0.45 + outputVolume * 0.4}) 270deg,
                        transparent 360deg)`,
                      animation: isConnected && conversation.isSpeaking 
                        ? `orb-swirl-reverse ${2.5 - outputVolume * 0.5}s linear infinite` 
                        : 'orb-swirl-reverse 10s linear infinite',
                      filter: `blur(${5 - outputVolume * 2}px)`,
                    }}
                  />
                  
                  {/* Stars/sparkles layer */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage: `radial-gradient(1.5px 1.5px at 20% 30%, white ${0.6 + outputVolume * 0.4}, transparent),
                        radial-gradient(1.5px 1.5px at 40% 70%, white ${0.55 + outputVolume * 0.4}, transparent),
                        radial-gradient(1.5px 1.5px at 60% 20%, white ${0.58 + outputVolume * 0.4}, transparent),
                        radial-gradient(2px 2px at 80% 50%, hsl(180 100% 80% / ${0.6 + outputVolume * 0.4}) 0%, transparent 100%),
                        radial-gradient(2px 2px at 30% 80%, hsl(280 100% 80% / ${0.55 + outputVolume * 0.4}) 0%, transparent 100%),
                        radial-gradient(1.5px 1.5px at 70% 60%, white ${0.55 + outputVolume * 0.4}, transparent),
                        radial-gradient(1.5px 1.5px at 15% 55%, white ${0.5 + outputVolume * 0.4}, transparent),
                        radial-gradient(2px 2px at 85% 25%, hsl(200 100% 85% / ${0.55 + outputVolume * 0.4}) 0%, transparent 100%)`,
                      animation: 'orb-stars 3s ease-in-out infinite',
                    }}
                  />
                  
                  {/* Energy core - bass reactive */}
                  <div 
                    className="absolute inset-0 m-auto rounded-full"
                    style={{
                      width: `${30 + frequencyBands.bass * 40}%`,
                      height: `${30 + frequencyBands.bass * 40}%`,
                      background: `radial-gradient(circle,
                        hsl(${isConnected && conversation.isSpeaking ? '45 100%' : '190 100%'} ${80 + outputVolume * 20}% / ${0.7 + outputVolume * 0.3}) 0%,
                        hsl(${isConnected && conversation.isSpeaking ? '320 100%' : '210 100%'} 70% / ${0.5 + outputVolume * 0.4}) 40%,
                        transparent 70%)`,
                      filter: `blur(${3 - outputVolume * 1.5}px)`,
                      transition: 'width 0.1s, height 0.1s',
                    }}
                  />
                  
                  {/* Outer glow ring */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      boxShadow: `inset 0 0 ${35 + outputVolume * 45}px hsl(${isConnected && conversation.isSpeaking ? '280' : '200'} 100% 60% / ${0.5 + outputVolume * 0.4}),
                        inset 0 0 ${70 + outputVolume * 60}px hsl(200 100% 40% / ${0.4 + outputVolume * 0.3})`,
                    }}
                  />
                </div>
                
                {/* Activation hint when not connected */}
                {!isConnected && !isConnecting && !wakeWordEnabled && (
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
              {!isConnected ? (
                <>
                  {/* Wake word toggle */}
                  {isWakeWordSupported && (
                    <Button
                      onClick={toggleWakeWord}
                      variant="outline"
                      size="lg"
                      className={`gap-2 font-mono rounded-full transition-all duration-300 ${
                        isWakeWordListening 
                          ? 'bg-primary/20 border-primary text-primary shadow-[0_0_20px_hsl(var(--primary)/0.4)]' 
                          : 'bg-transparent border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      <Ear className={`w-5 h-5 ${isWakeWordListening ? 'animate-pulse' : ''}`} />
                      {isWakeWordListening ? 'LISTENING...' : 'WAKE WORD'}
                    </Button>
                  )}
                </>
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
            
            {/* Activation hint */}
            {!isConnected && !isConnecting && (
              <p className="text-[10px] font-mono text-muted-foreground/60">
                {wakeWordEnabled
                  ? (isWakeWordListening ? 'Say "Atlas" to activate' : 'Enable wake word to start listening')
                  : 'Tap the orb to activate'}
              </p>
            )}
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

          {/* Active Agents */}
          <div className="flex-1 bg-card/50 border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-primary" />
              <span className="text-xs font-mono text-muted-foreground">ACTIVE AGENTS</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                {activeAgents.length}/{agents.length}
              </span>
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {agentsLoading ? (
                  <div className="text-muted-foreground/50 text-center py-4 text-xs">
                    Loading agents...
                  </div>
                ) : activeAgents.length === 0 ? (
                  <div className="text-muted-foreground/50 text-center py-4 text-xs">
                    No active agents. Visit the Forge to create agents.
                  </div>
                ) : (
                  activeAgents.map((agent) => (
                    <div 
                      key={agent.id} 
                      className="flex items-center gap-3 p-2 rounded bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div 
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: agent.sonicDNA.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-foreground truncate">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground">{agent.designation}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-secondary">{agent.status}</span>
                        <span className="text-[10px] text-muted-foreground">{agent.sector}</span>
                      </div>
                    </div>
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

      {/* Live Transcript Display - Bottom Bar */}
      {isConnected && (
        <div className="border-t border-border bg-card/80 backdrop-blur-sm px-6 py-3">
          <div className="flex items-center gap-3">
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
        </div>
      )}
    </div>
  );
}
