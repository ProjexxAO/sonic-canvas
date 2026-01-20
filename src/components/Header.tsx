// Atlas Sonic OS - Header Component with Sonic Entity Integration

import { useNavigate } from 'react-router-dom';
import { audioEngine } from '@/lib/audioEngine';
import { User } from '@supabase/supabase-js';
import { useSonicEntity } from '@/hooks/useSonicEntity';
import { CapabilityTemplates } from '@/lib/sonicEntityBridge';
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
  Download,
  MessageCircle,
  Wrench,
  Shield,
  Plug
} from 'lucide-react';

interface HeaderProps {
  onToggleAudio: (enabled: boolean) => void;
  audioEnabled: boolean;
  user?: User | null;
  onSignOut?: () => void;
}

// Sonic Entity-enabled Header Button
function HeaderButton({ 
  entityName, 
  onClick, 
  title, 
  children, 
  className = '',
  importance = 'medium' as const
}: { 
  entityName: string;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  importance?: 'critical' | 'high' | 'medium' | 'low';
}) {
  const { recordInteraction, updateState } = useSonicEntity(
    {
      name: entityName,
      category: 'navigation',
      componentType: 'HeaderButton',
      importance,
      capabilities: [CapabilityTemplates.click(title)],
    },
    { onClick }
  );

  const handleClick = () => {
    recordInteraction();
    updateState('active');
    onClick();
    setTimeout(() => updateState('idle'), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      title={title}
    >
      {children}
    </button>
  );
}

export default function Header({ onToggleAudio, audioEnabled, user, onSignOut }: HeaderProps) {
  const navigate = useNavigate();
  
  // Register Header as a container entity
  useSonicEntity({
    name: 'Main Header',
    category: 'container',
    componentType: 'Header',
    importance: 'high',
  });
  
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
        <HeaderButton
          entityName="Audio Toggle"
          onClick={handleAudioToggle}
          title={audioEnabled ? 'Mute audio' : 'Enable audio'}
          className={`p-2 rounded transition-all ${
            audioEnabled 
              ? 'bg-primary/20 text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </HeaderButton>
        
        <HeaderButton
          entityName="Atlas Dashboard"
          onClick={() => navigate('/atlas')}
          title="Atlas Voice Agent"
          importance="high"
          className="p-2 text-primary hover:text-primary/80 transition-colors"
        >
          <MessageCircle size={18} />
        </HeaderButton>
        
        <HeaderButton
          entityName="Import Agents"
          onClick={() => navigate('/import')}
          title="Import Agents"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download size={18} />
        </HeaderButton>
        
        {user && (
          <>
            <HeaderButton
              entityName="Integrations Marketplace"
              onClick={() => navigate('/marketplace')}
              title="Integrations"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plug size={18} />
            </HeaderButton>
            <HeaderButton
              entityName="Tool Governance"
              onClick={() => navigate('/governance')}
              title="Tool Governance"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Shield size={18} />
            </HeaderButton>
            <HeaderButton
              entityName="Tool Permissions"
              onClick={() => navigate('/workspace/tools')}
              title="Tool Permissions"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Wrench size={18} />
            </HeaderButton>
          </>
        )}
        
        <HeaderButton
          entityName="Settings"
          onClick={() => {}}
          title="Settings"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings size={18} />
        </HeaderButton>
        
        <HeaderButton
          entityName="Help"
          onClick={() => {}}
          title="Help"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle size={18} />
        </HeaderButton>

        <div className="h-6 w-px bg-border mx-1" />

        {user ? (
          <HeaderButton
            entityName="Logout"
            onClick={onSignOut || (() => {})}
            title="Sign out"
            importance="high"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">LOGOUT</span>
          </HeaderButton>
        ) : (
          <HeaderButton
            entityName="Login"
            onClick={() => navigate('/auth')}
            title="Login"
            importance="high"
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors text-xs"
          >
            <LogIn size={16} />
            <span>LOGIN</span>
          </HeaderButton>
        )}
      </div>
    </header>
  );
}
