// Atlas Voice Agent Dashboard - Full Ecosystem Control

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  Wifi,
  WifiOff,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardAgents } from '@/hooks/useDashboardAgents';
import { useAtlasContext } from '@/hooks/useAtlasContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme ?? "dark";
  const { agents, loading: agentsLoading } = useDashboardAgents({ limit: 200 });
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
  const animationRef = useRef<number>();

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

      // Navigate to different pages
      navigateTo: (params: { page: string }) => {
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
        
        setTimeout(() => navigate(route), 500);
        return `Navigating to ${params.page}`;
      },

      showNotification: (params: { title: string; message: string; type?: string }) => {
        addLog('showNotification', params, 'Notification shown', 'success');
        
        const toastType = params.type || 'info';
        if (toastType === 'success') toast.success(params.message);
        else if (toastType === 'error') toast.error(params.message);
        else if (toastType === 'warning') toast.warning(params.message);
        else toast.info(params.message);
        
        return `Displayed ${toastType} notification: ${params.title}`;
      },

      getSystemStatus: () => {
        addLog('getSystemStatus', {}, 'Status retrieved', 'success');
        
        return `System online. ${searchResults.length} agents in memory. Last synthesis: ${synthesizedAgent?.name || 'None'}. ${actionLogs.length} actions logged.`;
      },

      clearResults: () => {
        addLog('clearResults', {}, 'Results cleared', 'success');
        setSearchResults([]);
        setSynthesizedAgent(null);
        toast.info('Results cleared');
        return 'Search results and synthesis data cleared';
      },

      listSectors: () => {
        addLog('listSectors', {}, 'Sectors listed', 'success');
        const sectors = ['FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY'];
        return `Available sectors: ${sectors.join(', ')}`;
      },

      getAgentDetails: (params: { agentId: string }) => {
        const logId = addLog('getAgentDetails', params, 'Fetching details...', 'pending');
        
        const agent = searchResults.find(a => a.id === params.agentId);
        if (agent) {
          setActionLogs(prev => prev.map(l => 
            l.id === logId ? { ...l, result: `Found: ${agent.name}`, status: 'success' } : l
          ));
          return `Agent: ${agent.name}, Sector: ${agent.sector}, Description: ${agent.description || 'No description'}`;
        }
        
        setActionLogs(prev => prev.map(l => 
          l.id === logId ? { ...l, result: 'Agent not found', status: 'error' } : l
        ));
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

      // The ElevenLabs React SDK can emit different message shapes depending on
      // enabled events + connection type. Support both:
      // 1) "event" style: message.type === 'user_transcript' | 'agent_response' ...
      // 2) "chat" style: { source, role, message }

      // --- Chat-style fallback (what you currently receive)
      if (typeof message?.message === "string") {
        const who = message.role === "agent" ? "Atlas" : "You";
        setTranscript(`${who}: ${message.message}`);
        setIsTranscribing(message.role === "agent");
        return;
      }

      // --- Event-style (requires enabling transcript/response events in ElevenLabs)
      if (message?.type === "user_transcript") {
        const userText = message.user_transcription_event?.user_transcript;
        if (userText) {
          setTranscript(`You: ${userText}`);
          setIsTranscribing(false);
        }
        return;
      }

      if (message?.type === "agent_response") {
        const agentText = message.agent_response_event?.agent_response;
        if (agentText) {
          setTranscript(`Atlas: ${agentText}`);
          setIsTranscribing(true);
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
      console.log("[Atlas] Microphone permission granted, fetching signed URL...");
      
      // Fetch signed URL from our edge function for authenticated session
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token');
      
      if (error || !data?.signed_url) {
        console.error("[Atlas] Failed to get signed URL:", error || 'No signed_url in response');
        throw new Error(error?.message || 'Failed to authenticate with voice service');
      }
      
      console.log("[Atlas] Got signed URL, starting session...");
      
      await conversation.startSession({
        signedUrl: data.signed_url,
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
          
          {/* Shooting Stars */}
          <div 
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ 
              top: '15%',
              left: '20%',
              boxShadow: '0 0 6px 2px rgba(255,255,255,0.6)',
              animation: 'shooting-star-1 8s ease-in-out infinite',
              animationDelay: '0s'
            }}
          />
          <div 
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{ 
              top: '35%',
              left: '60%',
              boxShadow: '0 0 6px 2px rgba(255,255,255,0.6)',
              animation: 'shooting-star-2 12s ease-in-out infinite',
              animationDelay: '4s'
            }}
          />
          <div 
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{ 
              top: '25%',
              left: '80%',
              boxShadow: '0 0 4px 1px rgba(255,255,255,0.5)',
              animation: 'shooting-star-3 15s ease-in-out infinite',
              animationDelay: '7s'
            }}
          />
          
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
        {/* Left Panel - Visualizer & Controls */}
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

        {/* Right Panel - Results & Logs */}
        <div className="w-96 flex flex-col gap-4">
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

          {/* Active Agents */}
          <div className="flex-1 bg-card/90 border border-border rounded-lg p-3 shadow-sm">
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
                    {agents.length === 0 ? 'No agents in system' : 'No agents currently running'}
                  </div>
                ) : (
                  activeAgents.map((agent) => (
                    <div 
                      key={agent.id} 
                      className="flex items-center gap-3 p-2 rounded bg-background border border-border hover:border-primary/40 transition-colors"
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

        </div>
      </main>

      {/* Live Transcript Display - Bottom Bar */}
      {isConnected && (
        <div className="border-t border-border bg-card/95 backdrop-blur-sm px-6 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
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
