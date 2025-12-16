// Atlas Sonic OS - Synthesis Console Component

import { useState, useRef, useEffect } from 'react';
import { SonicAgent, AgentSector, SimulationOutput } from '@/lib/agentTypes';
import { audioEngine } from '@/lib/audioEngine';
import { Terminal, Send, Loader2 } from 'lucide-react';

interface SynthesisConsoleProps {
  onSynthesize: (prompt: string, sector: AgentSector) => Promise<void>;
  selectedAgent: SonicAgent | null;
  simulationOutput: SimulationOutput[];
  isProcessing: boolean;
}

export default function SynthesisConsole({ 
  onSynthesize, 
  selectedAgent,
  simulationOutput,
  isProcessing 
}: SynthesisConsoleProps) {
  const [input, setInput] = useState('');
  const [selectedSector, setSelectedSector] = useState<AgentSector>('DATA');
  const outputRef = useRef<HTMLDivElement>(null);

  const sectors: AgentSector[] = ['FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY'];

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [simulationOutput]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    audioEngine.playSynthesize();
    await onSynthesize(input.trim(), selectedSector);
    setInput('');
  };

  const getOutputColor = (type: SimulationOutput['type']) => {
    switch (type) {
      case 'SUCCESS': return 'text-success';
      case 'WARNING': return 'text-secondary';
      case 'ERROR': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getOutputPrefix = (type: SimulationOutput['type']) => {
    switch (type) {
      case 'SUCCESS': return '[OK]';
      case 'WARNING': return '[WARN]';
      case 'ERROR': return '[ERR]';
      default: return '[INFO]';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Terminal size={16} className="text-primary" />
        <h3 className="font-orbitron text-sm text-primary text-glow-cyan">SYNTHESIS CONSOLE</h3>
      </div>

      {/* Selected Agent Info */}
      {selectedAgent && (
        <div className="mb-3 p-2 bg-muted/30 border border-border rounded text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ACTIVE:</span>
            <span className="text-primary font-mono">{selectedAgent.designation}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-muted-foreground">CLASS:</span>
            <span style={{ color: selectedAgent.sonicDNA.color }}>{selectedAgent.class}</span>
          </div>
        </div>
      )}

      {/* Terminal Output */}
      <div 
        ref={outputRef}
        className="flex-1 bg-background/50 border border-border rounded p-3 mb-3 overflow-auto font-mono text-xs"
      >
        {simulationOutput.length === 0 ? (
          <div className="text-muted-foreground/50">
            <p>{'>'} ATLAS SONIC OS v1.0.0</p>
            <p>{'>'} Ready for synthesis commands...</p>
            <p>{'>'} Type a prompt to generate an agent</p>
            <p className="mt-2">{'>'} Examples:</p>
            <p className="text-primary/70">  "Create a trading bot for crypto"</p>
            <p className="text-primary/70">  "Build a security scanner"</p>
            <p className="text-primary/70">  "Generate a data pipeline agent"</p>
          </div>
        ) : (
          <div className="space-y-1">
            {simulationOutput.map((output, i) => (
              <div key={i} className={`${getOutputColor(output.type)}`}>
                <span className="text-muted-foreground mr-2">
                  {output.timestamp.toLocaleTimeString()}
                </span>
                <span className="mr-2">{getOutputPrefix(output.type)}</span>
                <span>{output.message}</span>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 size={12} className="animate-spin" />
                <span>Processing synthesis request...</span>
              </div>
            )}
          </div>
        )}
        <span className="terminal-cursor">▊</span>
      </div>

      {/* Sector Selection */}
      <div className="mb-3">
        <label className="text-xs text-muted-foreground mb-1 block">SECTOR</label>
        <div className="flex flex-wrap gap-1">
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`
                px-2 py-1 text-[10px] font-mono rounded transition-all
                ${selectedSector === sector 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'}
              `}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter synthesis prompt..."
          disabled={isProcessing}
          className="flex-1 bg-input border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
