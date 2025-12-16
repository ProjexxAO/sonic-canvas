// Atlas Sonic OS - Header Component

import { useState } from 'react';
import { audioEngine } from '@/lib/audioEngine';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  HelpCircle,
  Radio,
  Hexagon
} from 'lucide-react';

interface HeaderProps {
  onToggleAudio: (enabled: boolean) => void;
  audioEnabled: boolean;
}

export default function Header({ onToggleAudio, audioEnabled }: HeaderProps) {
  const handleAudioToggle = () => {
    if (!audioEnabled) {
      audioEngine.initialize();
      audioEngine.playBoot();
    }
    onToggleAudio(!audioEnabled);
  };

  return (
    <header className="h-14 bg-card/80 border-b border-border flex items-center justify-between px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Hexagon size={32} className="text-primary" />
          <Radio size={14} className="absolute inset-0 m-auto text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-orbitron text-lg tracking-wider text-foreground">
            <span className="text-primary text-glow-cyan">ATLAS</span>
            <span className="text-muted-foreground mx-1">:</span>
            <span className="text-secondary text-glow-amber">SONIC OS</span>
          </h1>
          <p className="text-[10px] text-muted-foreground tracking-widest">SOUND OVER CODE</p>
        </div>
      </div>

      {/* Center - Status */}
      <div className="hidden md:flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">SYSTEM NOMINAL</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="text-xs text-muted-foreground">
          BUILD <span className="text-primary">2024.12.16</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAudioToggle}
          className={`p-2 rounded transition-all ${
            audioEnabled 
              ? 'bg-primary/20 text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title={audioEnabled ? 'Mute audio' : 'Enable audio'}
        >
          {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        
        <button
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </button>
        
        <button
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Help"
        >
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
}
