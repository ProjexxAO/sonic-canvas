// Global Floating Atlas Orb - Present on every page
// Matches the main Atlas page cosmic orb visualizer

import { useAtlasSafe } from '@/contexts/AtlasContext';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight,
  Minus,
  Maximize2,
  Sparkles,
  Hexagon,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';

export function GlobalAtlasOrb() {
  const atlas = useAtlasSafe();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme ?? 'dark';
  
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
    inputVolume,
    outputVolume,
    frequencyBands,
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

  // Calculate orb intensity based on audio
  const intensity = isConnected ? (isSpeaking ? outputVolume : inputVolume) : 0;

  // Minimized state - cosmic mini orb
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full overflow-hidden transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          boxShadow: isConnected 
            ? theme === 'dark'
              ? `0 0 20px hsl(270 100% 50% / 0.5), 0 0 40px hsl(200 100% 50% / 0.3)`
              : `0 0 15px hsl(222 70% 45% / 0.4), 0 0 30px hsl(201 80% 50% / 0.25)`
            : theme === 'dark'
              ? `0 0 10px hsl(var(--primary) / 0.3)`
              : `0 4px 12px hsl(220 20% 20% / 0.15)`
        }}
      >
        {/* Cosmic orb background */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: theme === 'dark'
                ? `radial-gradient(circle at 30% 30%,
                    hsl(270 100% ${isConnected ? 50 + intensity * 20 : 40}%) 0%,
                    hsl(220 100% ${isConnected ? 40 + intensity * 15 : 30}%) 40%,
                    hsl(280 100% ${isConnected ? 25 + intensity * 10 : 20}%) 100%)`
                : `radial-gradient(circle at 30% 30%,
                    hsl(222 70% ${isConnected ? 45 + intensity * 15 : 40}%) 0%,
                    hsl(201 75% ${isConnected ? 38 + intensity * 12 : 35}%) 40%,
                    hsl(173 70% ${isConnected ? 32 + intensity * 10 : 30}%) 100%)`
            }}
          />
          {/* Swirl effect */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: theme === 'dark'
                ? `conic-gradient(from 0deg at 50% 50%,
                    transparent 0deg,
                    hsl(280 100% 60% / 0.5) 60deg,
                    transparent 120deg,
                    hsl(200 100% 70% / 0.4) 180deg,
                    transparent 240deg,
                    hsl(320 100% 65% / 0.4) 300deg,
                    transparent 360deg)`
                : `conic-gradient(from 0deg at 50% 50%,
                    transparent 0deg,
                    hsl(222 75% 40% / 0.5) 60deg,
                    transparent 120deg,
                    hsl(201 80% 45% / 0.45) 180deg,
                    transparent 240deg,
                    hsl(173 75% 38% / 0.45) 300deg,
                    transparent 360deg)`,
              animation: isConnected ? 'spin 3s linear infinite' : 'spin 8s linear infinite',
              filter: 'blur(3px)',
            }}
          />
          {/* Stars/sparkles */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: theme === 'dark'
                ? `radial-gradient(1px 1px at 20% 30%, white 100%, transparent),
                   radial-gradient(1px 1px at 60% 20%, white 100%, transparent),
                   radial-gradient(1px 1px at 80% 50%, hsl(180 100% 80%) 100%, transparent),
                   radial-gradient(1px 1px at 30% 70%, hsl(280 100% 80%) 100%, transparent)`
                : `radial-gradient(1.5px 1.5px at 20% 30%, hsl(222 70% 35%) 100%, transparent),
                   radial-gradient(1.5px 1.5px at 60% 20%, hsl(201 75% 38%) 100%, transparent),
                   radial-gradient(1.5px 1.5px at 80% 50%, hsl(36 80% 45%) 100%, transparent),
                   radial-gradient(1.5px 1.5px at 30% 70%, hsl(173 70% 35%) 100%, transparent)`,
            }}
          />
        </div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <Hexagon 
              className={cn(
                "w-6 h-6",
                theme === 'dark' ? "text-white/80" : "text-white/90",
                isConnected && "animate-pulse"
              )} 
            />
            <Radio 
              className={cn(
                "absolute inset-0 m-auto w-3 h-3",
                theme === 'dark' ? "text-white" : "text-white"
              )} 
            />
          </div>
        </div>
        {/* Connection indicator */}
        {isConnected && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>
    );
  }

  // Expanded floating panel with cosmic orb
  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-300",
      isExpanded ? "w-80" : "w-72"
    )}>
      <div className={cn(
        "rounded-2xl border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden",
        isConnected 
          ? theme === 'dark' 
            ? "border-primary/40 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]"
            : "border-primary/30 shadow-[0_8px_30px_-10px_hsl(220_50%_30%/0.25)]"
          : "border-border/50"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
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

        {/* Cosmic Orb Visualizer */}
        <div className="relative flex items-center justify-center py-6 px-4">
          {/* Outer glow ring */}
          {isConnected && (
            <div
              className="absolute w-28 h-28 rounded-full transition-all duration-100"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: isSpeaking 
                  ? `hsl(var(--secondary) / ${0.3 + intensity * 0.7})` 
                  : `hsl(var(--primary) / ${0.2 + intensity * 0.5})`,
                transform: `scale(${1 + (frequencyBands?.bass || 0) * 0.1})`,
                boxShadow: theme === 'dark'
                  ? `0 0 ${15 + intensity * 30}px hsl(${isSpeaking ? '45' : '270'} 100% 50% / ${0.3 + intensity * 0.4})`
                  : `0 0 ${10 + intensity * 20}px hsl(222 70% 50% / ${0.2 + intensity * 0.3})`
              }}
            />
          )}

          {/* Main Cosmic Orb */}
          <div 
            className={cn(
              "relative w-24 h-24 rounded-full overflow-hidden cursor-pointer transition-all duration-200",
              !isConnected && !isConnecting && "hover:scale-105"
            )}
            onClick={() => {
              if (!isConnected && !isConnecting) {
                startConversation();
              }
            }}
            style={{
              transform: `scale(${1 + intensity * 0.12})`,
              boxShadow: theme === 'dark'
                ? isConnected
                  ? `0 0 30px hsl(270 100% 50% / 0.4), 0 0 60px hsl(200 100% 50% / 0.2), inset 0 0 20px hsl(280 100% 60% / 0.3)`
                  : `0 0 15px hsl(var(--primary) / 0.2)`
                : isConnected
                  ? `0 4px 20px hsl(222 60% 40% / 0.3), inset 0 0 15px hsl(201 70% 50% / 0.2)`
                  : `0 4px 15px hsl(220 30% 20% / 0.15)`
            }}
          >
            {/* Base nebula layer */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: theme === 'dark' 
                  ? `radial-gradient(ellipse at ${30 + (frequencyBands?.bass || 0) * 20}% ${40 + (frequencyBands?.mid || 0) * 20}%, 
                      hsl(270 100% ${isConnected ? 45 + intensity * 35 : 35}% / 0.9) 0%,
                      hsl(220 100% ${isConnected ? 35 + intensity * 25 : 28}% / 0.8) 30%,
                      hsl(280 100% ${isConnected ? 28 + intensity * 20 : 22}% / 0.7) 60%,
                      hsl(240 80% 15%) 100%)`
                  : `radial-gradient(ellipse at ${30 + (frequencyBands?.bass || 0) * 20}% ${40 + (frequencyBands?.mid || 0) * 20}%, 
                      hsl(222 70% ${isConnected ? 42 + intensity * 18 : 38}% / 0.95) 0%,
                      hsl(201 75% ${isConnected ? 36 + intensity * 15 : 34}% / 0.85) 25%,
                      hsl(173 70% ${isConnected ? 32 + intensity * 14 : 30}% / 0.75) 50%,
                      hsl(220 25% 88%) 100%)`,
                animation: isConnected && isSpeaking 
                  ? 'pulse 0.5s ease-in-out infinite' 
                  : undefined,
              }}
            />
            
            {/* Swirling nebula layer 1 */}
            <div 
              className={cn(
                "absolute inset-0 rounded-full",
                theme === 'dark' ? "mix-blend-screen" : "mix-blend-soft-light"
              )}
              style={{
                background: theme === 'dark'
                  ? `conic-gradient(from 0deg at 50% 50%,
                      transparent 0deg,
                      hsl(280 100% ${60 + (frequencyBands?.bass || 0) * 30}% / ${0.5 + intensity * 0.4}) 60deg,
                      transparent 120deg,
                      hsl(200 100% ${70 + (frequencyBands?.mid || 0) * 25}% / ${0.45 + intensity * 0.4}) 180deg,
                      transparent 240deg,
                      hsl(320 100% ${65 + (frequencyBands?.treble || 0) * 30}% / ${0.4 + intensity * 0.4}) 300deg,
                      transparent 360deg)`
                  : `conic-gradient(from 0deg at 50% 50%,
                      transparent 0deg,
                      hsl(222 75% ${38 + (frequencyBands?.bass || 0) * 18}% / ${0.55 + intensity * 0.35}) 60deg,
                      transparent 120deg,
                      hsl(201 80% ${42 + (frequencyBands?.mid || 0) * 15}% / ${0.5 + intensity * 0.35}) 180deg,
                      transparent 240deg,
                      hsl(173 75% ${36 + (frequencyBands?.treble || 0) * 18}% / ${0.5 + intensity * 0.35}) 300deg,
                      transparent 360deg)`,
                animation: isConnected && isSpeaking 
                  ? `spin ${2 - intensity}s linear infinite` 
                  : 'spin 8s linear infinite',
                filter: `blur(${4 - intensity * 2}px)`,
              }}
            />
            
            {/* Secondary swirl - counter rotation */}
            <div 
              className={cn(
                "absolute inset-2 rounded-full",
                theme === 'dark' ? "mix-blend-screen" : "mix-blend-soft-light"
              )}
              style={{
                background: theme === 'dark'
                  ? `conic-gradient(from 180deg at 55% 45%,
                      transparent 0deg,
                      hsl(180 100% ${75 + (frequencyBands?.treble || 0) * 20}% / ${0.4 + intensity * 0.4}) 90deg,
                      transparent 180deg,
                      hsl(260 100% ${70 + (frequencyBands?.bass || 0) * 25}% / ${0.45 + intensity * 0.4}) 270deg,
                      transparent 360deg)`
                  : `conic-gradient(from 180deg at 55% 45%,
                      transparent 0deg,
                      hsl(173 75% ${40 + (frequencyBands?.treble || 0) * 15}% / ${0.5 + intensity * 0.35}) 90deg,
                      transparent 180deg,
                      hsl(222 70% ${38 + (frequencyBands?.bass || 0) * 16}% / ${0.52 + intensity * 0.35}) 270deg,
                      transparent 360deg)`,
                animation: isConnected && isSpeaking 
                  ? `spin ${2.5 - intensity * 0.5}s linear infinite reverse` 
                  : 'spin 10s linear infinite reverse',
                filter: `blur(${3 - intensity * 1.5}px)`,
              }}
            />
            
            {/* Stars/sparkles layer */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                backgroundImage: theme === 'dark'
                  ? `radial-gradient(1.5px 1.5px at 20% 30%, white ${0.6 + intensity * 0.4}, transparent),
                     radial-gradient(1.5px 1.5px at 40% 70%, white ${0.55 + intensity * 0.4}, transparent),
                     radial-gradient(1.5px 1.5px at 60% 20%, white ${0.58 + intensity * 0.4}, transparent),
                     radial-gradient(2px 2px at 80% 50%, hsl(180 100% 80% / ${0.6 + intensity * 0.4}) 0%, transparent 100%),
                     radial-gradient(2px 2px at 30% 80%, hsl(280 100% 80% / ${0.55 + intensity * 0.4}) 0%, transparent 100%)`
                  : `radial-gradient(2px 2px at 20% 30%, hsl(222 70% 35% / ${0.6 + intensity * 0.3}), transparent),
                     radial-gradient(2px 2px at 40% 70%, hsl(201 75% 38% / ${0.55 + intensity * 0.3}), transparent),
                     radial-gradient(2px 2px at 60% 20%, hsl(173 70% 35% / ${0.58 + intensity * 0.3}), transparent),
                     radial-gradient(2.5px 2.5px at 80% 50%, hsl(36 80% 45% / ${0.6 + intensity * 0.3}) 0%, transparent 100%),
                     radial-gradient(2.5px 2.5px at 30% 80%, hsl(222 75% 40% / ${0.55 + intensity * 0.3}) 0%, transparent 100%)`,
                animation: 'pulse 3s ease-in-out infinite',
              }}
            />
            
            {/* Energy core */}
            <div 
              className="absolute inset-0 m-auto rounded-full"
              style={{
                width: `${30 + (frequencyBands?.bass || 0) * 40}%`,
                height: `${30 + (frequencyBands?.bass || 0) * 40}%`,
                background: theme === 'dark'
                  ? `radial-gradient(circle,
                      hsl(${isSpeaking ? '45 100%' : '190 100%'} ${80 + intensity * 20}% / ${0.7 + intensity * 0.3}) 0%,
                      hsl(${isSpeaking ? '320 100%' : '210 100%'} 70% / ${0.5 + intensity * 0.4}) 40%,
                      transparent 70%)`
                  : `radial-gradient(circle,
                      hsl(${isSpeaking ? '36 85%' : '173 80%'} ${isConnected ? 52 + intensity * 15 : 48}% / ${0.75 + intensity * 0.2}) 0%,
                      hsl(${isSpeaking ? '222 70%' : '201 75%'} ${42 + intensity * 12}% / ${0.55 + intensity * 0.35}) 40%,
                      transparent 70%)`,
                filter: `blur(${2 - intensity}px)`,
                transition: 'width 0.1s, height 0.1s',
              }}
            />
            
            {/* Activation hint */}
            {!isConnected && !isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(
                  "text-[9px] font-mono animate-pulse",
                  theme === 'dark' ? "text-white/60" : "text-white/80"
                )}>
                  TAP
                </span>
              </div>
            )}
            
            {/* Connecting indicator */}
            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(
                  "text-[8px] font-mono animate-pulse",
                  theme === 'dark' ? "text-white/80" : "text-white"
                )}>
                  CONNECTING
                </span>
              </div>
            )}
          </div>
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
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
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
