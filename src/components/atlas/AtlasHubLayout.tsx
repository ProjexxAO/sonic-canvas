// Atlas Hub Layout - Unified interface for Personal, Group, and C-Suite hubs
// This component provides the consistent Atlas visual experience across all hub types

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAtlas } from '@/contexts/AtlasContext';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useCSuiteData } from '@/hooks/useCSuiteData';
import { useDashboardAgents } from '@/hooks/useDashboardAgents';
import { useAtlasConversations } from '@/hooks/useAtlasConversations';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';
import { useLearningProgress } from '@/hooks/useLearningProgress';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AtlasRightPanel } from './AtlasRightPanel';
import { OnboardingFlow } from '@/components/onboarding';
import { InSessionSurvey, UnlockNotification } from '@/components/personalization';
import {
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Ear,
  EarOff,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

export type HubType = 'personal' | 'group' | 'csuite';

interface AtlasHubLayoutProps {
  hubType: HubType;
  hubTitle: string;
  hubSubtitle: string;
  groupId?: string; // For group hub context
  showOnboarding?: boolean;
}

const HUB_CONFIG: Record<HubType, { color: string; label: string }> = {
  personal: { color: 'hsl(150 70% 45%)', label: 'Personal' },
  group: { color: 'hsl(200 70% 50%)', label: 'Group' },
  csuite: { color: 'hsl(280 70% 55%)', label: 'Executive' },
};

export function AtlasHubLayout({
  hubType,
  hubTitle,
  hubSubtitle,
  groupId,
  showOnboarding: propShowOnboarding,
}: AtlasHubLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme ?? 'dark';
  const { agents, loading: agentsLoading } = useDashboardAgents({ limit: 200 });
  const { messages: conversationHistory, saveMessage, startNewSession } = useAtlasConversations({ userId: user?.id });
  
  // Atlas context
  const atlas = useAtlas();
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
    isTranscribing,
    startConversation,
    stopConversation,
    toggleMute,
    sendTextMessage,
    sendContextualUpdate,
    actionLogs,
    searchResults,
    synthesizedAgent,
    webSearches,
    manualWebSearch,
    isWebSearching,
    conversation,
    wakeWordEnabled,
    setWakeWordEnabled,
    wakeWordStatus,
  } = atlas;

  const [textInput, setTextInput] = useState('');
  const [hubCreatedAt, setHubCreatedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatingPersona, setGeneratingPersona] = useState<string | null>(null);

  // Onboarding (only for csuite)
  const onboarding = useOnboarding(user?.id);
  const shouldShowOnboarding = hubType === 'csuite' && (propShowOnboarding ?? onboarding.showOnboarding);

  // C-Suite data for onboarding
  const csuiteData = useCSuiteData(user?.id);
  const totalDataItems = Object.values(csuiteData.stats).reduce((a, b) => a + b, 0);

  // Agent orchestration
  const orchestration = useAgentOrchestration(user?.id);

  // Learning progress and audio feedback
  const learningProgress = useLearningProgress(user?.id);
  const audioFeedback = useAudioFeedback(user?.id);

  // Fetch hub creation timestamp for verified badge
  useEffect(() => {
    async function fetchHubAccess() {
      if (!user?.id || hubType !== 'personal') return;
      
      const { data } = await supabase
        .from('hub_access')
        .select('granted_at')
        .eq('user_id', user.id)
        .eq('hub_type', 'personal')
        .single();
      
      if (data?.granted_at) {
        setHubCreatedAt(data.granted_at);
      }
    }
    fetchHubAccess();
  }, [user?.id, hubType]);

  // Randomized balloon configurations for light mode
  const balloonConfigs = useMemo(() => {
    const colors = [
      { main: 'hsl(350 70% 60%)', stripe1: 'hsl(45 80% 65%)', stripe2: 'hsl(200 60% 55%)' },
      { main: 'hsl(200 65% 55%)', stripe1: 'hsl(45 75% 70%)', stripe2: 'hsl(350 60% 55%)' },
      { main: 'hsl(280 55% 60%)', stripe1: 'hsl(45 80% 65%)', stripe2: 'hsl(150 50% 55%)' },
      { main: 'hsl(150 50% 55%)', stripe1: 'hsl(200 60% 60%)', stripe2: 'hsl(45 75% 60%)' },
      { main: 'hsl(35 75% 55%)', stripe1: 'hsl(15 70% 50%)', stripe2: 'hsl(45 85% 65%)' },
    ];
    
    return [
      { size: 50, opacity: 0.75, duration: 90 + Math.random() * 20, startY: 20 + Math.random() * 20, delay: Math.random() * -90, direction: 'rtl', color: colors[Math.floor(Math.random() * colors.length)] },
      { size: 38, opacity: 0.55, duration: 130 + Math.random() * 30, startY: 30 + Math.random() * 20, delay: Math.random() * -130, direction: 'ltr', color: colors[Math.floor(Math.random() * colors.length)] },
      { size: 24, opacity: 0.35, duration: 180 + Math.random() * 40, startY: 40 + Math.random() * 20, delay: Math.random() * -180, direction: 'rtl', color: colors[Math.floor(Math.random() * colors.length)] },
      { size: 16, opacity: 0.22, duration: 240 + Math.random() * 60, startY: 50 + Math.random() * 15, delay: Math.random() * -240, direction: 'ltr', color: colors[Math.floor(Math.random() * colors.length)] },
    ];
  }, []);

  // Onboarding handlers
  const handleOnboardingUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleOnboardingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    for (const file of Array.from(files)) {
      await csuiteData.uploadFile(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOnboardingGenerateReport = async (persona: string) => {
    setGeneratingPersona(persona);
    await csuiteData.generateReport(persona);
    setGeneratingPersona(null);
  };

  // Show onboarding for new users (C-Suite only)
  if (shouldShowOnboarding && hubType === 'csuite') {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.pptx"
          onChange={handleOnboardingFileChange}
          className="hidden"
        />
        <OnboardingFlow
          currentStep={onboarding.currentStep}
          onNext={onboarding.nextStep}
          onPrev={onboarding.prevStep}
          onSkip={onboarding.skipOnboarding}
          onComplete={onboarding.completeOnboarding}
          onGoToStep={onboarding.goToStep}
          hasConnectedData={onboarding.hasConnectedData}
          hasGeneratedReport={onboarding.hasGeneratedReport}
          hasAllocatedAgents={onboarding.hasAllocatedAgents}
          selectedPersona={onboarding.selectedPersona}
          onMarkDataConnected={onboarding.markDataConnected}
          onMarkReportGenerated={onboarding.markReportGenerated}
          onMarkAgentsAllocated={onboarding.markAgentsAllocated}
          totalDataItems={totalDataItems}
          onUploadFile={handleOnboardingUpload}
          onGenerateReport={handleOnboardingGenerateReport}
          isGenerating={generatingPersona !== null}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Full Page Star System Background - Dark Mode Only */}
      {theme === 'dark' && (
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Deep space base */}
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, 
                hsl(240 30% 8%) 0%, 
                hsl(250 35% 4%) 50%, 
                hsl(260 40% 2%) 100%)`
            }}
          />
          {/* Milky Way band */}
          <div 
            className="absolute inset-0 opacity-60"
            style={{
              background: `linear-gradient(135deg, 
                transparent 10%,
                hsl(270 40% 15% / 0.2) 20%,
                hsl(250 50% 25% / 0.3) 30%,
                hsl(220 60% 30% / 0.35) 40%,
                hsl(200 55% 35% / 0.3) 50%,
                hsl(270 45% 25% / 0.2) 60%,
                transparent 75%)`
            }}
          />
          {/* Nebula clouds */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: `
                radial-gradient(ellipse 60% 40% at 15% 30%, hsl(320 60% 30% / 0.25) 0%, transparent 70%),
                radial-gradient(ellipse 50% 35% at 85% 60%, hsl(280 55% 35% / 0.2) 0%, transparent 65%),
                radial-gradient(ellipse 40% 30% at 50% 20%, hsl(200 65% 40% / 0.15) 0%, transparent 60%),
                radial-gradient(ellipse 45% 25% at 70% 80%, hsl(270 50% 30% / 0.2) 0%, transparent 60%)`
            }}
          />
          {/* Dense distant stars */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(0.5px 0.5px at 3% 5%, hsl(0 0% 100% / 0.7) 100%, transparent),
                radial-gradient(0.5px 0.5px at 8% 15%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 15% 8%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 22% 25%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 28% 12%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 35% 35%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 42% 5%, hsl(0 0% 100% / 0.7) 100%, transparent),
                radial-gradient(0.5px 0.5px at 48% 22%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 55% 45%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 62% 18%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 68% 55%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 75% 8%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 82% 32%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 88% 65%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 95% 15%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 5% 75%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 12% 88%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 25% 72%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 38% 95%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 52% 78%, hsl(0 0% 95% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 65% 92%, hsl(0 0% 100% / 0.6) 100%, transparent),
                radial-gradient(0.5px 0.5px at 78% 82%, hsl(0 0% 90% / 0.5) 100%, transparent),
                radial-gradient(0.5px 0.5px at 92% 88%, hsl(0 0% 100% / 0.6) 100%, transparent)
              `
            }}
          />
          {/* Bright prominent stars */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(2px 2px at 10% 20%, hsl(0 0% 100%) 50%, hsl(200 100% 80% / 0.4) 100%, transparent),
                radial-gradient(2px 2px at 30% 45%, hsl(0 0% 100%) 50%, hsl(35 100% 80% / 0.4) 100%, transparent),
                radial-gradient(2px 2px at 55% 25%, hsl(0 0% 100%) 50%, hsl(270 90% 85% / 0.4) 100%, transparent),
                radial-gradient(2px 2px at 75% 65%, hsl(0 0% 100%) 50%, hsl(180 95% 82% / 0.4) 100%, transparent),
                radial-gradient(2px 2px at 90% 35%, hsl(0 0% 100%) 50%, hsl(220 90% 85% / 0.4) 100%, transparent),
                radial-gradient(1.5px 1.5px at 20% 70%, hsl(0 0% 100%) 50%, hsl(0 0% 90% / 0.4) 100%, transparent),
                radial-gradient(1.5px 1.5px at 48% 85%, hsl(0 0% 100%) 50%, hsl(200 85% 85% / 0.4) 100%, transparent),
                radial-gradient(1.5px 1.5px at 82% 15%, hsl(0 0% 100%) 50%, hsl(35 90% 82% / 0.4) 100%, transparent)
              `,
              animation: 'twinkle 2.5s ease-in-out infinite'
            }}
          />
        </div>
      )}

      {/* Full Page Sky Background - Light Mode Only */}
      {theme === 'light' && (
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Sky gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, 
                hsl(200 60% 85%) 0%, 
                hsl(200 50% 90%) 30%,
                hsl(40 40% 92%) 70%,
                hsl(35 45% 88%) 100%)`
            }}
          />
          
          {/* Sun with rays */}
          <div 
            className="absolute top-[8%] right-[15%] w-24 h-24"
            style={{ animation: 'sun-pulse 4s ease-in-out infinite' }}
          >
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, 
                  hsl(45 100% 70% / 0.8) 0%, 
                  hsl(40 90% 75% / 0.4) 40%,
                  transparent 70%)`
              }}
            />
            <div 
              className="absolute inset-4 rounded-full"
              style={{
                background: `radial-gradient(circle, 
                  hsl(48 100% 85%) 0%, 
                  hsl(45 95% 75%) 100%)`
              }}
            />
          </div>
          
          {/* Clouds */}
          <div 
            className="absolute top-[12%] w-48 h-16 opacity-70"
            style={{ animation: 'cloud-float-1 80s linear infinite' }}
          >
            <div className="absolute inset-0 rounded-full bg-white/80 blur-md" />
            <div className="absolute top-2 left-8 w-24 h-12 rounded-full bg-white/90 blur-sm" />
          </div>
          
          {/* Hot Air Balloons */}
          {balloonConfigs.map((balloon, index) => (
            <div 
              key={index}
              className="absolute"
              style={{ 
                bottom: `${balloon.startY}%`,
                opacity: balloon.opacity,
                animation: `balloon-float-${balloon.direction} ${balloon.duration}s linear infinite`,
                animationDelay: `${balloon.delay}s`
              }}
            >
              <svg width={balloon.size} height={balloon.size * 1.4} viewBox="0 0 50 70">
                <ellipse cx="25" cy="22" rx="22" ry="24" fill={balloon.color.main} />
                {balloon.size > 20 && (
                  <>
                    <path d="M 8 18 Q 25 45 42 18" stroke={balloon.color.stripe1} strokeWidth="4" fill="none" />
                    <path d="M 12 12 Q 25 38 38 12" stroke={balloon.color.stripe2} strokeWidth="3" fill="none" />
                  </>
                )}
                <line x1="12" y1="42" x2="18" y2="58" stroke="hsl(30 30% 35%)" strokeWidth="1" />
                <line x1="38" y1="42" x2="32" y2="58" stroke="hsl(30 30% 35%)" strokeWidth="1" />
                <rect x="15" y="56" width="20" height="10" rx="2" fill="hsl(30 25% 45%)" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className={cn(
        "relative z-40 border-b backdrop-blur-xl",
        theme === 'dark'
          ? "bg-[hsl(240_10%_6%/0.7)] border-border/50"
          : "bg-white/60 border-border/30 shadow-sm"
      )}>
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: HUB_CONFIG[hubType].color }}
              />
              <div>
                <h1 className="text-sm font-mono font-semibold tracking-tight uppercase">
                  {hubTitle}
                </h1>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                  {hubSubtitle}
                </p>
              </div>
            </div>
            
            {/* Verified Badge for Personal Hub */}
            {hubType === 'personal' && hubCreatedAt && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-help",
                    theme === 'dark'
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  )}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Verified</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      Verified Personal Hub
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This is your unique, secure personal hub. Only one personal hub can exist per user.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 pt-1 border-t border-border/50">
                      <Clock className="h-3 w-3" />
                      Created: {format(new Date(hubCreatedAt), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Connection Status */}
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono",
              isConnected 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "bg-muted text-muted-foreground"
            )}>
              {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
            </div>
            
            {/* Wake Word Toggle */}
            {isConnected && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setWakeWordEnabled(!wakeWordEnabled)}
                title={wakeWordEnabled ? 'Disable wake word' : 'Enable wake word'}
              >
                {wakeWordEnabled ? <Ear size={14} /> : <EarOff size={14} />}
              </Button>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Side - Visualizer */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Central Orb */}
          <div 
            className="relative w-72 h-72"
            style={{ 
              transform: `scale(${1 + (conversation.isSpeaking ? outputVolume : inputVolume) * 0.08})`,
              transition: 'transform 0.15s ease-out'
            }}
          >
            {/* Outer ring */}
            <div 
              className={cn(
                "absolute inset-0 rounded-full border-2",
                isConnected && "border-primary animate-pulse"
              )}
              style={{
                borderColor: !isConnected 
                  ? `hsl(var(--border) / ${theme === 'dark' ? 1 : 1})`
                  : undefined,
              }}
            />
            
            {/* Middle ring */}
            <div 
              className={cn(
                "absolute inset-4 rounded-full border-2",
                isConnected && conversation.isSpeaking && "border-secondary animate-spin"
              )}
              style={{ 
                animationDuration: '3s',
                borderColor: !(isConnected && conversation.isSpeaking)
                  ? `hsl(var(--border) / ${theme === 'dark' ? 0.5 : 0.8})`
                  : undefined
              }}
            />
            
            {/* Inner circle - Cosmic Orb */}
            <div
              className={cn(
                "absolute inset-8 rounded-full border border-border flex items-center justify-center overflow-hidden",
                !isConnected && !isConnecting && "cursor-pointer hover:border-primary/50 transition-colors",
                theme === 'dark' 
                  ? "bg-[hsl(240_10%_6%/0.9)]" 
                  : "bg-gradient-to-br from-[hsl(220_20%_92%)] to-[hsl(220_25%_88%)] shadow-lg"
              )}
              onClick={() => {
                if (!isConnected && !isConnecting) {
                  startConversation();
                }
              }}
              title={!isConnected ? "Tap to activate Atlas" : undefined}
            >
              {/* Cosmic Orb visual */}
              <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                <div 
                  className="absolute w-[85%] h-[85%] rounded-full overflow-hidden"
                  style={{
                    transform: `scale(${1 + (conversation.isSpeaking ? outputVolume : inputVolume) * 0.15})`,
                    transition: 'transform 0.1s ease-out'
                  }}
                >
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: theme === 'dark' 
                        ? `radial-gradient(ellipse at ${30 + frequencyBands.bass * 20}% ${40 + frequencyBands.mid * 20}%, 
                            hsl(270 100% ${isConnected ? 45 + outputVolume * 35 : 35}% / ${0.8 + outputVolume * 0.2}) 0%,
                            hsl(220 100% ${isConnected ? 35 + outputVolume * 25 : 28}% / ${0.7 + outputVolume * 0.3}) 30%,
                            hsl(280 100% ${isConnected ? 28 + outputVolume * 20 : 22}% / ${0.6 + outputVolume * 0.3}) 60%,
                            transparent 100%)`
                        : `radial-gradient(ellipse at ${30 + frequencyBands.bass * 20}% ${40 + frequencyBands.mid * 20}%, 
                            hsl(222 70% ${isConnected ? 38 + outputVolume * 18 : 35}% / ${0.9 + outputVolume * 0.1}) 0%,
                            hsl(201 75% ${isConnected ? 32 + outputVolume * 15 : 30}% / ${0.8 + outputVolume * 0.15}) 25%,
                            hsl(173 70% ${isConnected ? 28 + outputVolume * 14 : 26}% / ${0.7 + outputVolume * 0.2}) 50%,
                            hsl(220 25% 85% / 0.5) 100%)`,
                      animation: isConnected && conversation.isSpeaking 
                        ? 'orb-pulse 0.5s ease-in-out infinite' 
                        : 'orb-idle 4s ease-in-out infinite',
                    }}
                  />
                </div>
                
                {/* Center text */}
                {!isConnected && !isConnecting && (
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    Tap to Activate
                  </span>
                )}
                {isConnecting && (
                  <span className="text-xs font-mono text-primary uppercase tracking-widest animate-pulse">
                    Connecting...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Voice Controls */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <div className="flex justify-center gap-3">
              {isConnected && (
                <>
                  <Button onClick={toggleMute} variant="outline" className="gap-2 font-mono">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isMuted ? "UNMUTE" : "MUTE"}
                  </Button>
                  <Button onClick={stopConversation} variant="destructive" className="gap-2 font-mono">
                    <MicOff className="w-4 h-4" />
                    DEACTIVATE
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <AtlasRightPanel
          hubType={hubType}
          groupId={groupId}
          tasks={orchestration.tasks}
          completedTasks={orchestration.completedTasks}
          isLoading={orchestration.isLoading}
          onSyncMemory={orchestration.syncMemoryTasks}
          onDeleteTask={orchestration.deleteTask}
          webSearches={webSearches}
          onWebSearch={manualWebSearch}
          isSearching={isWebSearching}
          searchResults={searchResults}
          synthesizedAgent={synthesizedAgent}
          userId={user?.id}
          agents={agents}
          agentsLoading={agentsLoading}
        />
      </main>

      {/* Bottom Bar - Transcript & Text Input */}
      <div className="relative z-10 border-t border-border bg-card/95 backdrop-blur-sm px-6 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        {isConnected && (
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              isTranscribing ? "bg-secondary animate-pulse" : "bg-muted"
            )} />
            <span className="text-[10px] font-mono text-muted-foreground tracking-wider flex-shrink-0">
              {isTranscribing ? 'ATLAS SPEAKING' : 'TRANSCRIPT'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-mono leading-relaxed truncate",
                transcript ? "text-foreground" : "text-muted-foreground/50"
              )}>
                {transcript || 'Waiting for Atlas to speak...'}
                {isTranscribing && (
                  <span className="inline-block w-1 h-4 bg-secondary animate-pulse ml-0.5 align-middle" />
                )}
              </p>
            </div>
          </div>
        )}
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (textInput.trim() && isConnected) {
              const msg = textInput.trim();
              sendTextMessage(msg);
              saveMessage('user', msg);
              setTextInput('');
            }
          }}
          className="flex items-center gap-3"
        >
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={isConnected ? "Type a message to Atlas..." : "Connect to Atlas to send messages..."}
            disabled={!isConnected}
            className="flex-1 font-mono text-sm bg-background border-border focus:border-primary"
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!isConnected || !textInput.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Personalization Overlays */}
      <InSessionSurvey userId={user?.id} />
      <UnlockNotification userId={user?.id} />
    </div>
  );
}
