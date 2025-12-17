// Atlas Voice Agent Dashboard

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from "@elevenlabs/react";
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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ATLAS_AGENT_ID = "agent_7501kbh21cg1eht9xtjw6kvkpm4m";

export default function Atlas() {
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[Atlas] Connected to voice agent");
    },
    onDisconnect: () => {
      console.log("[Atlas] Disconnected from voice agent");
    },
    onMessage: (message) => {
      console.log("[Atlas] Message:", message);
    },
    onError: (error) => {
      console.error("[Atlas] Error:", error);
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
                <span className="text-secondary text-glow-amber">VOICE AGENT</span>
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest">SONIC INTERFACE v1.0</p>
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
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-8">
          
          {/* Central Visualizer */}
          <div className="relative aspect-square max-w-md mx-auto">
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
              {/* Audio bars */}
              <div className="flex items-center justify-center gap-1 h-32">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-100 ${
                      isConnected 
                        ? conversation.isSpeaking 
                          ? 'bg-secondary' 
                          : 'bg-primary'
                        : 'bg-muted'
                    }`}
                    style={{
                      height: isConnected 
                        ? `${Math.sin(Date.now() / 200 + i * 0.5) * 30 + 40}%`
                        : '15%',
                      opacity: isConnected ? 0.8 : 0.3,
                      animationDelay: `${i * 50}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Status text overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute bottom-12 text-center">
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
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card/50 border border-border rounded-lg p-4 text-center">
              <Waves size={24} className="mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground font-mono">AUDIO</p>
              <p className="text-sm font-mono text-foreground">
                {isConnected ? 'ACTIVE' : 'INACTIVE'}
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-4 text-center">
              <Activity size={24} className="mx-auto mb-2 text-secondary" />
              <p className="text-xs text-muted-foreground font-mono">MODE</p>
              <p className="text-sm font-mono text-foreground">
                {isConnected 
                  ? conversation.isSpeaking ? 'OUTPUT' : 'INPUT'
                  : 'STANDBY'
                }
              </p>
            </div>
            <div className="bg-card/50 border border-border rounded-lg p-4 text-center">
              <Zap size={24} className="mx-auto mb-2 text-accent" />
              <p className="text-xs text-muted-foreground font-mono">LATENCY</p>
              <p className="text-sm font-mono text-foreground">
                {isConnected ? '~200ms' : '---'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isConnected ? (
              <Button
                onClick={startConversation}
                disabled={isConnecting}
                size="lg"
                className="gap-3 font-mono px-8 py-6 text-lg"
              >
                <Mic className="w-6 h-6" />
                {isConnecting ? "CONNECTING..." : "START ATLAS"}
              </Button>
            ) : (
              <>
                <Button
                  onClick={toggleMute}
                  variant="outline"
                  size="lg"
                  className="gap-2 font-mono"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                  {isMuted ? "UNMUTE" : "MUTE"}
                </Button>
                <Button
                  onClick={stopConversation}
                  variant="destructive"
                  size="lg"
                  className="gap-2 font-mono"
                >
                  <MicOff className="w-5 h-5" />
                  END SESSION
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground font-mono">
              {isConnected 
                ? "Speak naturally. Atlas is listening and will respond."
                : "Click START ATLAS to begin voice interaction."
              }
            </p>
            <p className="text-xs text-muted-foreground/60">
              Powered by ElevenLabs Conversational AI
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
