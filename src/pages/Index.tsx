// Atlas Sonic OS - Main Application Page

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SonicAgent, AgentSector, SimulationOutput } from '@/lib/agentTypes';
import { audioEngine } from '@/lib/audioEngine';
import { useAuth } from '@/hooks/useAuth';
import { useAgents } from '@/hooks/useAgents';
import Header from '@/components/Header';
import StatusBar from '@/components/StatusBar';
import SonicVisualizer from '@/components/SonicVisualizer';
import AgentGrid from '@/components/AgentGrid';
import SynthesisConsole from '@/components/SynthesisConsole';
import HarmonicForge from '@/components/HarmonicForge';
import CodeArtifact from '@/components/CodeArtifact';
import WaveformDisplay from '@/components/WaveformDisplay';
import BootScreen from '@/components/BootScreen';
import AgentFilters, { AgentFiltersState } from '@/components/AgentFilters';
import AtlasVoiceAgent from '@/components/AtlasVoiceAgent';
import { toast } from 'sonner';
import { Loader2, MessageCircle, X } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { agents, loading: agentsLoading, createAgent, updateAgent, deleteAgent } = useAgents();
  
  const [isBooting, setIsBooting] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [selectedAgent, setSelectedAgent] = useState<SonicAgent | null>(null);
  const [simulationOutput, setSimulationOutput] = useState<SimulationOutput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filters, setFilters] = useState<AgentFiltersState>({
    sector: 'ALL',
    status: 'ALL',
    class: 'ALL',
  });
  const [showAtlas, setShowAtlas] = useState(false);

  // Filter agents based on selected filters
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      if (filters.sector !== 'ALL' && agent.sector !== filters.sector) return false;
      if (filters.status !== 'ALL' && agent.status !== filters.status) return false;
      if (filters.class !== 'ALL' && agent.class !== filters.class) return false;
      return true;
    });
  }, [agents, filters]);

  // Handle boot complete
  const handleBootComplete = () => {
    setIsBooting(false);
    audioEngine.initialize();
    audioEngine.playBoot();
    setAudioEnabled(true);
  };

  // Audio visualization loop
  useEffect(() => {
    if (!audioEnabled) return;

    const updateAudio = () => {
      const data = audioEngine.getAnalyserData();
      setAudioData(data);
    };

    const interval = setInterval(updateAudio, 50);
    return () => clearInterval(interval);
  }, [audioEnabled]);

  // Log output helper
  const log = useCallback((type: SimulationOutput['type'], message: string) => {
    setSimulationOutput(prev => [...prev, {
      timestamp: new Date(),
      type,
      message
    }]);
  }, []);

  // Synthesize new agent
  const handleSynthesize = async (prompt: string, sector: AgentSector) => {
    if (!user) {
      toast.error('Please sign in to synthesize agents');
      navigate('/auth');
      return;
    }

    setIsProcessing(true);
    
    log('INFO', `Initiating synthesis: "${prompt}"`);
    log('INFO', `Sector lock: ${sector}`);
    
    await new Promise(r => setTimeout(r, 500));
    log('INFO', 'Analyzing prompt structure...');
    
    await new Promise(r => setTimeout(r, 700));
    log('INFO', 'Generating sonic DNA signature...');
    
    await new Promise(r => setTimeout(r, 600));
    log('INFO', 'Compiling code artifact...');
    
    // Extract name from prompt
    const nameMatch = prompt.match(/(?:create|build|make|generate)\s+(?:a\s+)?(.+?)(?:\s+for|\s+that|\s+to|$)/i);
    const name = nameMatch ? nameMatch[1].slice(0, 30) : `${sector}-Agent`;
    
    await new Promise(r => setTimeout(r, 400));
    
    // Create in database
    const newAgent = await createAgent(name, sector);
    
    if (newAgent) {
      log('SUCCESS', `Agent synthesized: ${newAgent.designation}`);
      log('INFO', `Frequency: ${newAgent.sonicDNA.frequency.toFixed(2)} Hz`);
      log('INFO', `Waveform: ${newAgent.sonicDNA.waveform.toUpperCase()}`);
      log('INFO', `Synced to Global Grid`);
      
      setSelectedAgent(newAgent);
      
      if (audioEnabled) {
        audioEngine.playSuccess();
      }
      
      toast.success(`Agent ${newAgent.designation} synthesized`, {
        description: `Sector: ${sector} | Class: ${newAgent.class}`
      });
    } else {
      log('ERROR', 'Synthesis failed - check connection');
    }
    
    setIsProcessing(false);
  };

  // Delete agent
  const handleDeleteAgent = async (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;
    
    const success = await deleteAgent(id);
    
    if (success) {
      if (selectedAgent?.id === id) {
        setSelectedAgent(null);
      }
      
      if (audioEnabled) {
        audioEngine.playError();
      }
      
      log('WARNING', `Agent ${agent.designation} terminated`);
      toast.info(`Agent ${agent.designation} deleted`);
    }
  };

  // Run agent simulation
  const handleRunAgent = async (agent: SonicAgent) => {
    setSelectedAgent(agent);
    setIsProcessing(true);
    
    if (audioEnabled) {
      audioEngine.playClick();
    }
    
    log('INFO', `Executing ${agent.designation}...`);
    
    await new Promise(r => setTimeout(r, 300));
    log('INFO', 'Initializing runtime environment...');
    
    await new Promise(r => setTimeout(r, 500));
    log('INFO', 'Loading dependencies...');
    
    await new Promise(r => setTimeout(r, 400));
    log('INFO', 'Executing main function...');
    
    const outputs = [
      'Processing input data...',
      'Analyzing patterns...',
      'Computing results...',
      'Generating output...'
    ];
    
    for (const output of outputs) {
      await new Promise(r => setTimeout(r, 300));
      log('INFO', output);
    }
    
    await new Promise(r => setTimeout(r, 500));
    
    // Update agent in database
    await updateAgent(agent.id, {
      status: 'ACTIVE',
      metrics: { 
        ...agent.metrics, 
        cycles: agent.metrics.cycles + 1 
      }
    });
    
    log('SUCCESS', `Execution complete. Cycles: ${agent.metrics.cycles + 1}`);
    
    if (audioEnabled) {
      audioEngine.playSuccess();
    }
    
    setIsProcessing(false);
  };

  // Update agent
  const handleUpdateAgent = async (updates: Partial<SonicAgent>) => {
    if (!selectedAgent) return;
    
    const success = await updateAgent(selectedAgent.id, updates);
    if (success) {
      // Update local selection
      setSelectedAgent(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    toast.info('Signed out');
  };

  // Show boot screen
  if (isBooting) {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <Header 
        audioEnabled={audioEnabled} 
        onToggleAudio={setAudioEnabled}
        user={user}
        onSignOut={handleSignOut}
      />
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Visualizer */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* 3D Visualizer */}
          <div className="flex-1 relative grid-bg">
            <SonicVisualizer
              selectedAgent={selectedAgent}
              agents={agents}
              onSelectAgent={setSelectedAgent}
              audioData={audioData}
            />
          </div>
          
          {/* Waveform display */}
          <div className="h-20 border-t border-border bg-card/50 p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-mono">AUDIO SIGNAL</span>
              <span className="text-[10px] text-primary font-mono">
                {audioEnabled ? 'ACTIVE' : 'MUTED'}
              </span>
            </div>
            <WaveformDisplay 
              audioData={audioData} 
              color={selectedAgent?.sonicDNA.color || '#00ffd5'} 
              height={50}
            />
          </div>
        </div>

        {/* Atlas Voice Agent Floating Panel */}
        {showAtlas && (
          <div className="absolute bottom-20 left-4 z-50 w-80 animate-in slide-in-from-bottom-4">
            <div className="relative">
              <button
                onClick={() => setShowAtlas(false)}
                className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
              >
                <X size={14} />
              </button>
              <AtlasVoiceAgent />
            </div>
          </div>
        )}

        {/* Atlas Toggle Button */}
        {!showAtlas && (
          <button
            onClick={() => setShowAtlas(true)}
            className="absolute bottom-20 left-4 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-all hover:scale-105 font-mono text-sm"
          >
            <MessageCircle size={18} />
            ATLAS VOICE
          </button>
        )}
        
        {/* Right panels */}
        <div className="w-[600px] flex flex-col">
          {/* Top row - Agent Grid & Harmonic Forge */}
          <div className="flex-1 flex border-b border-border overflow-hidden">
            {/* Agent Grid */}
            <div className="flex-1 p-4 border-r border-border overflow-hidden flex flex-col">
              <AgentFilters
                filters={filters}
                onFiltersChange={setFilters}
                totalCount={agents.length}
                filteredCount={filteredAgents.length}
                agents={filteredAgents}
              />
              <div className="flex-1 overflow-auto">
                <AgentGrid
                  agents={filteredAgents}
                  selectedAgent={selectedAgent}
                  onSelectAgent={setSelectedAgent}
                  onDeleteAgent={handleDeleteAgent}
                  onRunAgent={handleRunAgent}
                />
              </div>
            </div>
            
            {/* Harmonic Forge */}
            <div className="w-64 p-4 overflow-auto">
              <HarmonicForge
                agent={selectedAgent}
                onUpdateAgent={handleUpdateAgent}
              />
            </div>
          </div>
          
          {/* Bottom row - Console & Code */}
          <div className="h-[45%] flex overflow-hidden">
            {/* Synthesis Console */}
            <div className="flex-1 p-4 border-r border-border">
              <SynthesisConsole
                onSynthesize={handleSynthesize}
                selectedAgent={selectedAgent}
                simulationOutput={simulationOutput}
                isProcessing={isProcessing}
              />
            </div>
            
            {/* Code Artifact */}
            <div className="w-80 p-4 overflow-auto">
              <CodeArtifact agent={selectedAgent} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <StatusBar 
        agentCount={agents.length} 
        isConnected={!!user} 
      />
    </div>
  );
}
