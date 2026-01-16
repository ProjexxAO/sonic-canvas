// Global Floating Atlas Orb - Present on every page

import { useAtlasSafe } from '@/contexts/AtlasContext';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight,
  X,
  Minus,
  Maximize2,
  Radio,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

export function GlobalAtlasOrb() {
  const atlas = useAtlasSafe();
  const location = useLocation();
  
  // Don't render on the Atlas page itself - it has its own full interface
  if (location.pathname === '/atlas') return null;
  
  // Don't render if context is not available
  if (!atlas) return null;

  const {
    isConnected,
    isConnecting,
    isMuted,
    isSpeaking,
    audioLevels,
    transcript,
    startConversation,
    stopConversation,
    toggleMute,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    isExpanded,
    setIsExpanded,
    isMinimized,
    setIsMinimized,
  } = atlas;

  // Minimized state - just show a small orb
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full",
          "bg-primary/90 hover:bg-primary shadow-lg",
          "flex items-center justify-center transition-all duration-300",
          "hover:scale-110 active:scale-95",
          isConnected && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
        )}
      >
        <Radio className={cn(
          "w-6 h-6 text-primary-foreground",
          isConnected && "animate-pulse"
        )} />
        {isConnected && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  // Expanded floating panel
  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-300",
      isExpanded ? "w-80" : "w-64"
    )}>
      <div className={cn(
        "rounded-2xl border bg-background/95 backdrop-blur-xl shadow-2xl",
        "border-primary/20 overflow-hidden",
        isConnected && "border-primary/40"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Atlas
            </span>
            {isSpeaking && (
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsMinimized(true)}
            >
              <Minus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Audio Visualizer */}
        <div className="h-12 flex items-end justify-center gap-0.5 px-4 py-2 bg-gradient-to-t from-muted/20 to-transparent">
          {audioLevels.slice(0, 16).map((level, i) => (
            <div
              key={i}
              className={cn(
                "w-1 rounded-full transition-all duration-75",
                isConnected 
                  ? isSpeaking 
                    ? "bg-primary" 
                    : "bg-primary/60"
                  : "bg-muted-foreground/30"
              )}
              style={{
                height: `${Math.max(4, level * 32)}px`,
              }}
            />
          ))}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="px-3 py-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {transcript}
            </p>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goBack}
            disabled={!canGoBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-mono">
            {atlas.currentPath === '/' ? 'Home' : atlas.currentPath.slice(1)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goForward}
            disabled={!canGoForward}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 p-3 border-t border-border/30 bg-muted/20">
          {!isConnected ? (
            <Button
              onClick={startConversation}
              disabled={isConnecting}
              size="sm"
              className="gap-2 flex-1"
            >
              <Mic className="w-4 h-4" />
              {isConnecting ? "Connecting..." : "Start Atlas"}
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleMute}
                variant="outline"
                size="icon"
                className="h-9 w-9"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={stopConversation}
                variant="destructive"
                size="sm"
                className="gap-2 flex-1"
              >
                <MicOff className="w-4 h-4" />
                End
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
