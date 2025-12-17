import { useConversation } from "@elevenlabs/react";
import { useState, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const ATLAS_AGENT_ID = "agent_7501kbh21cg1eht9xtjw6kvkpm4m";

export default function AtlasVoiceAgent() {
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
    <div className="flex flex-col items-center gap-4 p-6 rounded-lg border border-primary/30 bg-background/50 backdrop-blur-sm">
      <div className="text-center">
        <h3 className="text-lg font-mono text-primary">ATLAS VOICE AGENT</h3>
        <p className="text-sm text-muted-foreground font-mono">
          {isConnected 
            ? conversation.isSpeaking ? "SPEAKING..." : "LISTENING..."
            : "OFFLINE"
          }
        </p>
      </div>

      {/* Audio Visualizer */}
      <div className="w-full h-16 flex items-center justify-center gap-1">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`w-1 bg-primary transition-all duration-100 ${
              isConnected && conversation.isSpeaking
                ? "animate-pulse"
                : ""
            }`}
            style={{
              height: isConnected 
                ? `${Math.random() * 100}%` 
                : "10%",
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isConnected ? (
          <Button
            onClick={startConversation}
            disabled={isConnecting}
            className="gap-2 font-mono"
            variant="default"
          >
            <Mic className="w-4 h-4" />
            {isConnecting ? "CONNECTING..." : "START ATLAS"}
          </Button>
        ) : (
          <>
            <Button
              onClick={toggleMute}
              variant="outline"
              className="gap-2 font-mono"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {isMuted ? "UNMUTE" : "MUTE"}
            </Button>
            <Button
              onClick={stopConversation}
              variant="destructive"
              className="gap-2 font-mono"
            >
              <MicOff className="w-4 h-4" />
              END SESSION
            </Button>
          </>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`} />
        <span>STATUS: {conversation.status.toUpperCase()}</span>
      </div>
    </div>
  );
}
