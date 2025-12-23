// Atlas Sonic OS - Header Component

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioEngine } from '@/lib/audioEngine';
import { User } from '@supabase/supabase-js';
import WorkspaceSelector from './WorkspaceSelector';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  HelpCircle,
  Radio,
  Hexagon,
  LogIn,
  LogOut,
  User as UserIcon,
  Download,
  MessageCircle
} from 'lucide-react';
import { WorkspaceToolsDialog } from './workspace/WorkspaceToolsDialog';

interface HeaderProps {
  onToggleAudio: (enabled: boolean) => void;
  audioEnabled: boolean;
  user?: User | null;
  onSignOut?: () => void;
}

export default function Header({ onToggleAudio, audioEnabled, user, onSignOut }: HeaderProps) {
  const navigate = useNavigate();
  
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

      {/* Center - Workspace Selector & Status */}
      <div className="hidden md:flex items-center gap-4">
        {user && <WorkspaceSelector compact />}
        <div className="h-4 w-px bg-border" />
        {user ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">
              <span className="text-primary">{user.email?.split('@')[0].toUpperCase()}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary rounded-full" />
            <span className="text-xs text-muted-foreground">GUEST MODE</span>
          </div>
        )}
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
          onClick={() => navigate('/atlas')}
          className="p-2 text-primary hover:text-primary/80 transition-colors"
          title="Atlas Voice Agent"
        >
          <MessageCircle size={18} />
        </button>
        
        <button
          onClick={() => navigate('/import')}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Import Agents"
        >
          <Download size={18} />
        </button>
        
        {user && <WorkspaceToolsDialog />}
        
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

        <div className="h-6 w-px bg-border mx-1" />

        {user ? (
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">LOGOUT</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-xs"
          >
            <LogIn size={16} />
            <span>LOGIN</span>
          </button>
        )}
      </div>
    </header>
  );
}
