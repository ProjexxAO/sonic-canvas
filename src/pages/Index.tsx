// Atlas Sonic OS - Main Application Page

import { useState, useEffect, useCallback } from 'react';
import { SonicAgent, AgentSector, SimulationOutput, createAgent } from '@/lib/agentTypes';
import { audioEngine } from '@/lib/audioEngine';
import Header from '@/components/Header';
import StatusBar from '@/components/StatusBar';
import SonicVisualizer from '@/components/SonicVisualizer';
import AgentGrid from '@/components/AgentGrid';
import SynthesisConsole from '@/components/SynthesisConsole';
import HarmonicForge from '@/components/HarmonicForge';
import CodeArtifact from '@/components/CodeArtifact';
import WaveformDisplay from '@/components/WaveformDisplay';
import BootScreen from '@/components/BootScreen';
import { toast } from 'sonner';

export default function Index() {
  const [isBooting, setIsBooting] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(128));
  const [agents, setAgents] = useState<SonicAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<SonicAgent | null>(null);
  const [simulationOutput, setSimulationOutput] = useState<SimulationOutput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(true);
    
    log('INFO', `Initiating synthesis: "${prompt}"`);
    log('INFO', `Sector lock: ${sector}`);
    
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 500));
    log('INFO', 'Analyzing prompt structure...');
    
    await new Promise(r => setTimeout(r, 700));
    log('INFO', 'Generating sonic DNA signature...');
    
    await new Promise(r => setTimeout(r, 600));
    log('INFO', 'Compiling code artifact...');
    
    // Extract name from prompt or generate one
    const nameMatch = prompt.match(/(?:create|build|make|generate)\s+(?:a\s+)?(.+?)(?:\s+for|\s+that|\s+to|$)/i);
    const name = nameMatch ? nameMatch[1].slice(0, 30) : `${sector}-Agent`;
    
    const newAgent = createAgent(name, sector);
    
    await new Promise(r => setTimeout(r, 400));
    log('SUCCESS', `Agent synthesized: ${newAgent.designation}`);
    log('INFO', `Frequency: ${newAgent.sonicDNA.frequency.toFixed(2)} Hz`);
    log('INFO', `Waveform: ${newAgent.sonicDNA.waveform.toUpperCase()}`);
    
    setAgents(prev => [...prev, newAgent]);
    setSelectedAgent(newAgent);
    
    if (audioEnabled) {
      audioEngine.playSuccess();
    }
    
    toast.success(`Agent ${newAgent.designation} synthesized`, {
      description: `Sector: ${sector} | Class: ${newAgent.class}`
    });
    
    setIsProcessing(false);
  };

  // Delete agent
  const handleDeleteAgent = (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;
    
    setAgents(prev => prev.filter(a => a.id !== id));
    if (selectedAgent?.id === id) {
      setSelectedAgent(null);
    }
    
    if (audioEnabled) {
      audioEngine.playError();
    }
    
    log('WARNING', `Agent ${agent.designation} terminated`);
    toast.info(`Agent ${agent.designation} deleted`);
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
    
    // Simulate various outputs
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
    
    // Update agent metrics
    setAgents(prev => prev.map(a => 
      a.id === agent.id 
        ? { 
            ...a, 
            status: 'ACTIVE',
            lastActive: new Date(),
            metrics: { 
              ...a.metrics, 
              cycles: a.metrics.cycles + 1 
            }
          }
        : a
    ));
    
    log('SUCCESS', `Execution complete. Cycles: ${agent.metrics.cycles + 1}`);
    
    if (audioEnabled) {
      audioEngine.playSuccess();
    }
    
    setIsProcessing(false);
  };

  // Update agent
  const handleUpdateAgent = (updates: Partial<SonicAgent>) => {
    if (!selectedAgent) return;
    
    setAgents(prev => prev.map(a => 
      a.id === selectedAgent.id ? { ...a, ...updates } : a
    ));
    setSelectedAgent(prev => prev ? { ...prev, ...updates } : null);
  };

  if (isBooting) {
    return <BootScreen onComplete={handleBootComplete} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <Header 
        audioEnabled={audioEnabled} 
        onToggleAudio={setAudioEnabled} 
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
        
        {/* Right panels */}
        <div className="w-[600px] flex flex-col">
          {/* Top row - Agent Grid & Harmonic Forge */}
          <div className="flex-1 flex border-b border-border overflow-hidden">
            {/* Agent Grid */}
            <div className="flex-1 p-4 border-r border-border overflow-auto">
              <AgentGrid
                agents={agents}
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
                onDeleteAgent={handleDeleteAgent}
                onRunAgent={handleRunAgent}
              />
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
        isConnected={true} 
      />
    </div>
  );
}
