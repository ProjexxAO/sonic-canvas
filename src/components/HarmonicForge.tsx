// Atlas Sonic OS - Harmonic Forge Component

import { useState, useEffect } from 'react';
import { SonicAgent } from '@/lib/agentTypes';
import { audioEngine, WaveformType } from '@/lib/audioEngine';
import { Sliders, Volume2, Waves, Activity, Zap } from 'lucide-react';

interface HarmonicForgeProps {
  agent: SonicAgent | null;
  onUpdateAgent: (updates: Partial<SonicAgent>) => void;
}

export default function HarmonicForge({ agent, onUpdateAgent }: HarmonicForgeProps) {
  const [frequency, setFrequency] = useState(440);
  const [modulation, setModulation] = useState(5);
  const [density, setDensity] = useState(50);
  const [waveform, setWaveform] = useState<WaveformType>('sine');

  useEffect(() => {
    if (agent) {
      setFrequency(agent.sonicDNA.frequency);
      setModulation(agent.sonicDNA.modulation);
      setDensity(agent.sonicDNA.density);
      setWaveform(agent.sonicDNA.waveform);
    }
  }, [agent]);

  const handleFrequencyChange = (value: number) => {
    setFrequency(value);
    audioEngine.playTone(value, 0.1, waveform);
    if (agent) {
      onUpdateAgent({
        sonicDNA: { ...agent.sonicDNA, frequency: value }
      });
    }
  };

  const handleWaveformChange = (type: WaveformType) => {
    setWaveform(type);
    audioEngine.playTone(frequency, 0.2, type);
    if (agent) {
      onUpdateAgent({
        sonicDNA: { ...agent.sonicDNA, waveform: type }
      });
    }
  };

  const waveforms: WaveformType[] = ['sine', 'square', 'sawtooth', 'triangle'];

  const getWaveformPath = (type: WaveformType) => {
    switch (type) {
      case 'sine': return 'M0,15 Q5,0 10,15 T20,15 T30,15 T40,15';
      case 'square': return 'M0,20 L0,10 L10,10 L10,20 L20,20 L20,10 L30,10 L30,20 L40,20';
      case 'sawtooth': return 'M0,20 L10,10 L10,20 L20,10 L20,20 L30,10 L30,20 L40,10';
      case 'triangle': return 'M0,15 L5,10 L15,20 L25,10 L35,20 L40,15';
    }
  };

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Sliders size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select an agent to tune</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sliders size={16} className="text-secondary" />
        <h3 className="font-orbitron text-sm text-secondary text-glow-amber">HARMONIC FORGE</h3>
      </div>

      {/* Agent badge */}
      <div className="mb-4 p-2 bg-muted/30 border border-border rounded">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: agent.sonicDNA.color }}
          />
          <span className="font-mono text-xs text-foreground">{agent.designation}</span>
        </div>
      </div>

      {/* Waveform selector */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
          <Waves size={12} />
          WAVEFORM
        </label>
        <div className="grid grid-cols-4 gap-2">
          {waveforms.map((type) => (
            <button
              key={type}
              onClick={() => handleWaveformChange(type)}
              className={`
                p-2 rounded border transition-all
                ${waveform === type 
                  ? 'border-secondary bg-secondary/20' 
                  : 'border-border hover:border-secondary/50'}
              `}
            >
              <svg viewBox="0 0 40 30" className="w-full h-6">
                <path
                  d={getWaveformPath(type)}
                  fill="none"
                  stroke={waveform === type ? 'hsl(var(--secondary))' : 'hsl(var(--muted-foreground))'}
                  strokeWidth="2"
                />
              </svg>
              <span className="text-[9px] text-muted-foreground uppercase">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frequency slider */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
          <Volume2 size={12} />
          FREQUENCY: {frequency.toFixed(0)} Hz
        </label>
        <input
          type="range"
          min={100}
          max={1000}
          value={frequency}
          onChange={(e) => handleFrequencyChange(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>100Hz</span>
          <span>1000Hz</span>
        </div>
      </div>

      {/* Modulation slider */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
          <Activity size={12} />
          MODULATION: {modulation.toFixed(1)}
        </label>
        <input
          type="range"
          min={0}
          max={20}
          step={0.1}
          value={modulation}
          onChange={(e) => setModulation(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary"
        />
      </div>

      {/* Density slider */}
      <div className="mb-4">
        <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
          <Zap size={12} />
          DENSITY: {density.toFixed(0)}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={density}
          onChange={(e) => setDensity(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-secondary"
        />
      </div>

      {/* Play test button */}
      <button
        onClick={() => {
          audioEngine.startDrone({
            waveform,
            frequency,
            modulation,
            density,
            color: agent.sonicDNA.color
          });
          setTimeout(() => audioEngine.stopDrone(), 2000);
        }}
        className="mt-auto cyber-btn"
      >
        TEST SONIC SIGNATURE
      </button>
    </div>
  );
}
