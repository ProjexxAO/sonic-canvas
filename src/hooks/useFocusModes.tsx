import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { addMinutes, differenceInMinutes } from 'date-fns';

export interface FocusMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  settings: FocusModeSettings;
  isBuiltIn: boolean;
}

export interface FocusModeSettings {
  // Notification controls
  blockAllNotifications: boolean;
  allowedNotificationTypes: string[];
  allowedContacts: string[];
  
  // UI simplification
  hideNonEssentialUI: boolean;
  reducedMotion: boolean;
  simplifiedNavigation: boolean;
  
  // Cognitive load reduction
  limitVisibleTasks: number;
  hideCompletedItems: boolean;
  singleTaskMode: boolean;
  
  // Time management
  defaultSessionDuration: number; // minutes
  breakInterval: number; // minutes
  breakDuration: number; // minutes
  autoEndSession: boolean;
  
  // ADHD-specific
  enableBodyDoubling: boolean; // virtual co-working
  enableExternalAccountability: boolean;
  enableMicroBreaks: boolean;
  microBreakInterval: number; // minutes
  showProgressVisuals: boolean;
  enableRewardSystem: boolean;
  
  // Distraction blocking
  blockSocialMedia: boolean;
  blockEntertainment: boolean;
  blockNews: boolean;
  customBlockedDomains: string[];
  
  // Audio/Environment
  enableAmbientSounds: boolean;
  ambientSoundType: 'rain' | 'cafe' | 'nature' | 'white-noise' | 'binaural' | 'none';
  enableFocusMusic: boolean;
}

export interface FocusSession {
  id: string;
  modeId: string;
  startedAt: Date;
  endedAt?: Date;
  plannedDuration: number;
  actualDuration?: number;
  tasksCompleted: number;
  distractionsBlocked: number;
  breaksTaken: number;
  productivityScore?: number;
}

export interface CognitiveState {
  overwhelmLevel: number; // 0-100
  focusScore: number; // 0-100
  energyLevel: number; // 0-100
  taskLoadScore: number; // 0-100
  recommendedAction: string;
}

const BUILT_IN_MODES: FocusMode[] = [
  {
    id: 'deep-work',
    name: 'Deep Work',
    description: 'Maximum focus for complex tasks',
    icon: '🎯',
    color: 'from-purple-500 to-indigo-600',
    isBuiltIn: true,
    settings: {
      blockAllNotifications: true,
      allowedNotificationTypes: ['emergency'],
      allowedContacts: [],
      hideNonEssentialUI: true,
      reducedMotion: true,
      simplifiedNavigation: true,
      limitVisibleTasks: 1,
      hideCompletedItems: true,
      singleTaskMode: true,
      defaultSessionDuration: 90,
      breakInterval: 90,
      breakDuration: 15,
      autoEndSession: false,
      enableBodyDoubling: false,
      enableExternalAccountability: false,
      enableMicroBreaks: false,
      microBreakInterval: 25,
      showProgressVisuals: true,
      enableRewardSystem: false,
      blockSocialMedia: true,
      blockEntertainment: true,
      blockNews: true,
      customBlockedDomains: [],
      enableAmbientSounds: true,
      ambientSoundType: 'white-noise',
      enableFocusMusic: false,
    },
  },
  {
    id: 'adhd-friendly',
    name: 'ADHD Focus',
    description: 'Optimized for attention challenges',
    icon: '🧠',
    color: 'from-amber-500 to-orange-600',
    isBuiltIn: true,
    settings: {
      blockAllNotifications: true,
      allowedNotificationTypes: [],
      allowedContacts: [],
      hideNonEssentialUI: true,
      reducedMotion: true,
      simplifiedNavigation: true,
      limitVisibleTasks: 3,
      hideCompletedItems: false, // Show progress!
      singleTaskMode: false,
      defaultSessionDuration: 25, // Pomodoro
      breakInterval: 25,
      breakDuration: 5,
      autoEndSession: true,
      enableBodyDoubling: true,
      enableExternalAccountability: true,
      enableMicroBreaks: true,
      microBreakInterval: 10,
      showProgressVisuals: true,
      enableRewardSystem: true,
      blockSocialMedia: true,
      blockEntertainment: true,
      blockNews: true,
      customBlockedDomains: [],
      enableAmbientSounds: true,
      ambientSoundType: 'binaural',
      enableFocusMusic: true,
    },
  },
  {
    id: 'light-work',
    name: 'Light Work',
    description: 'For emails and admin tasks',
    icon: '✉️',
    color: 'from-sky-500 to-cyan-600',
    isBuiltIn: true,
    settings: {
      blockAllNotifications: false,
      allowedNotificationTypes: ['email', 'message', 'calendar'],
      allowedContacts: [],
      hideNonEssentialUI: false,
      reducedMotion: false,
      simplifiedNavigation: false,
      limitVisibleTasks: 10,
      hideCompletedItems: false,
      singleTaskMode: false,
      defaultSessionDuration: 45,
      breakInterval: 45,
      breakDuration: 10,
      autoEndSession: true,
      enableBodyDoubling: false,
      enableExternalAccountability: false,
      enableMicroBreaks: false,
      microBreakInterval: 25,
      showProgressVisuals: false,
      enableRewardSystem: false,
      blockSocialMedia: false,
      blockEntertainment: true,
      blockNews: false,
      customBlockedDomains: [],
      enableAmbientSounds: false,
      ambientSoundType: 'none',
      enableFocusMusic: false,
    },
  },
  {
    id: 'family-time',
    name: 'Family Time',
    description: 'Block all work notifications',
    icon: '👨‍👩‍👧‍👦',
    color: 'from-pink-500 to-rose-600',
    isBuiltIn: true,
    settings: {
      blockAllNotifications: true,
      allowedNotificationTypes: ['emergency'],
      allowedContacts: ['family'],
      hideNonEssentialUI: true,
      reducedMotion: false,
      simplifiedNavigation: true,
      limitVisibleTasks: 0,
      hideCompletedItems: true,
      singleTaskMode: false,
      defaultSessionDuration: 120,
      breakInterval: 0,
      breakDuration: 0,
      autoEndSession: false,
      enableBodyDoubling: false,
      enableExternalAccountability: false,
      enableMicroBreaks: false,
      microBreakInterval: 0,
      showProgressVisuals: false,
      enableRewardSystem: false,
      blockSocialMedia: false,
      blockEntertainment: false,
      blockNews: true,
      customBlockedDomains: [],
      enableAmbientSounds: false,
      ambientSoundType: 'none',
      enableFocusMusic: false,
    },
  },
  {
    id: 'wind-down',
    name: 'Wind Down',
    description: 'Prepare for rest',
    icon: '🌙',
    color: 'from-violet-500 to-purple-600',
    isBuiltIn: true,
    settings: {
      blockAllNotifications: true,
      allowedNotificationTypes: [],
      allowedContacts: ['family'],
      hideNonEssentialUI: true,
      reducedMotion: true,
      simplifiedNavigation: true,
      limitVisibleTasks: 0,
      hideCompletedItems: true,
      singleTaskMode: false,
      defaultSessionDuration: 60,
      breakInterval: 0,
      breakDuration: 0,
      autoEndSession: true,
      enableBodyDoubling: false,
      enableExternalAccountability: false,
      enableMicroBreaks: false,
      microBreakInterval: 0,
      showProgressVisuals: false,
      enableRewardSystem: false,
      blockSocialMedia: true,
      blockEntertainment: false,
      blockNews: true,
      customBlockedDomains: [],
      enableAmbientSounds: true,
      ambientSoundType: 'rain',
      enableFocusMusic: false,
    },
  },
];

export const useFocusModes = () => {
  const [modes, setModes] = useState<FocusMode[]>(BUILT_IN_MODES);
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<FocusSession[]>([]);
  const [cognitiveState, setCognitiveState] = useState<CognitiveState>({
    overwhelmLevel: 30,
    focusScore: 70,
    energyLevel: 65,
    taskLoadScore: 45,
    recommendedAction: 'You\'re doing well! Consider a short break in 15 minutes.',
  });
  const [distractionsBlocked, setDistractionsBlocked] = useState(0);
  const [microBreakDue, setMicroBreakDue] = useState(false);

  const activeMode = useMemo(() => 
    activeSession ? modes.find(m => m.id === activeSession.modeId) : null,
    [activeSession, modes]
  );

  // Start a focus session
  const startSession = useCallback((modeId: string, customDuration?: number) => {
    const mode = modes.find(m => m.id === modeId);
    if (!mode) return;

    const session: FocusSession = {
      id: Math.random().toString(36).substring(2),
      modeId,
      startedAt: new Date(),
      plannedDuration: customDuration || mode.settings.defaultSessionDuration,
      tasksCompleted: 0,
      distractionsBlocked: 0,
      breaksTaken: 0,
    };

    setActiveSession(session);
    setDistractionsBlocked(0);
    
    toast.success(`${mode.name} mode activated`, {
      description: `Focus session started for ${session.plannedDuration} minutes`,
    });

    // Apply mode settings
    if (mode.settings.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    }
    if (mode.settings.hideNonEssentialUI) {
      document.documentElement.classList.add('focus-mode-active');
    }
  }, [modes]);

  // End the current session
  const endSession = useCallback((completed: boolean = true) => {
    if (!activeSession) return;

    const endedAt = new Date();
    const actualDuration = differenceInMinutes(endedAt, activeSession.startedAt);
    
    const completedSession: FocusSession = {
      ...activeSession,
      endedAt,
      actualDuration,
      distractionsBlocked,
      productivityScore: completed 
        ? Math.min(100, Math.round((actualDuration / activeSession.plannedDuration) * 100))
        : Math.round((actualDuration / activeSession.plannedDuration) * 50),
    };

    setSessionHistory(prev => [...prev, completedSession]);
    setActiveSession(null);
    
    // Remove mode CSS classes
    document.documentElement.classList.remove('reduce-motion', 'focus-mode-active');

    toast.success(completed ? 'Focus session completed!' : 'Session ended early', {
      description: `You focused for ${actualDuration} minutes`,
    });
  }, [activeSession, distractionsBlocked]);

  // Record task completion during session
  const recordTaskCompletion = useCallback(() => {
    if (!activeSession) return;
    
    setActiveSession(prev => prev ? {
      ...prev,
      tasksCompleted: prev.tasksCompleted + 1,
    } : null);

    // Reward feedback for ADHD mode
    if (activeMode?.settings.enableRewardSystem) {
      toast.success('🎉 Task completed!', {
        description: 'Great progress! Keep going!',
      });
    }
  }, [activeSession, activeMode]);

  // Record break taken
  const recordBreak = useCallback(() => {
    if (!activeSession) return;
    
    setActiveSession(prev => prev ? {
      ...prev,
      breaksTaken: prev.breaksTaken + 1,
    } : null);
    
    setMicroBreakDue(false);
  }, [activeSession]);

  // Block a distraction
  const blockDistraction = useCallback((source: string) => {
    setDistractionsBlocked(prev => prev + 1);
    
    if (activeMode?.settings.showProgressVisuals) {
      toast.info(`Distraction blocked: ${source}`, {
        description: 'Staying focused! 💪',
      });
    }
  }, [activeMode]);

  // Create custom mode
  const createCustomMode = useCallback((
    name: string,
    description: string,
    baseMode: string,
    overrides: Partial<FocusModeSettings>
  ) => {
    const base = modes.find(m => m.id === baseMode);
    if (!base) return;

    const newMode: FocusMode = {
      id: `custom-${Math.random().toString(36).substring(2)}`,
      name,
      description,
      icon: '⚙️',
      color: 'from-emerald-500 to-teal-600',
      isBuiltIn: false,
      settings: {
        ...base.settings,
        ...overrides,
      },
    };

    setModes(prev => [...prev, newMode]);
    toast.success(`"${name}" mode created`);
    return newMode;
  }, [modes]);

  // Update cognitive state
  const updateCognitiveState = useCallback((taskCount: number, urgentCount: number) => {
    const overwhelm = Math.min(100, (taskCount * 5) + (urgentCount * 20));
    const focus = activeSession ? Math.max(20, 100 - overwhelm) : 50;
    
    let recommendation = '';
    if (overwhelm > 70) {
      recommendation = 'High cognitive load detected. Consider using ADHD Focus mode or breaking tasks into smaller steps.';
    } else if (overwhelm > 50) {
      recommendation = 'Moderate load. Try single-task mode to maintain focus.';
    } else if (!activeSession && focus < 60) {
      recommendation = 'Start a focus session to boost productivity.';
    } else {
      recommendation = 'You\'re in a good state. Keep up the momentum!';
    }

    setCognitiveState({
      overwhelmLevel: overwhelm,
      focusScore: focus,
      energyLevel: cognitiveState.energyLevel,
      taskLoadScore: Math.min(100, taskCount * 10),
      recommendedAction: recommendation,
    });
  }, [activeSession, cognitiveState.energyLevel]);

  // Check for micro-break
  useEffect(() => {
    if (!activeSession || !activeMode?.settings.enableMicroBreaks) return;

    const interval = setInterval(() => {
      const elapsed = differenceInMinutes(new Date(), activeSession.startedAt);
      if (elapsed > 0 && elapsed % activeMode.settings.microBreakInterval === 0) {
        setMicroBreakDue(true);
        toast.info('Micro-break time!', {
          description: 'Stand up, stretch, and take a deep breath.',
          action: {
            label: 'Done',
            onClick: () => recordBreak(),
          },
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [activeSession, activeMode, recordBreak]);

  // Calculate session stats
  const sessionStats = useMemo(() => {
    const last7Days = sessionHistory.filter(s => 
      s.startedAt > addMinutes(new Date(), -7 * 24 * 60)
    );

    const totalMinutes = last7Days.reduce((sum, s) => sum + (s.actualDuration || 0), 0);
    const avgScore = last7Days.length > 0
      ? Math.round(last7Days.reduce((sum, s) => sum + (s.productivityScore || 0), 0) / last7Days.length)
      : 0;

    return {
      totalSessions: last7Days.length,
      totalMinutes,
      averageScore: avgScore,
      tasksCompleted: last7Days.reduce((sum, s) => sum + s.tasksCompleted, 0),
      distractionsBlocked: last7Days.reduce((sum, s) => sum + s.distractionsBlocked, 0),
    };
  }, [sessionHistory]);

  // Get remaining time in session
  const remainingTime = useMemo(() => {
    if (!activeSession) return null;
    
    const elapsed = differenceInMinutes(new Date(), activeSession.startedAt);
    const remaining = Math.max(0, activeSession.plannedDuration - elapsed);
    
    return {
      minutes: remaining,
      percentage: Math.round((elapsed / activeSession.plannedDuration) * 100),
    };
  }, [activeSession]);

  return {
    // State
    modes,
    activeSession,
    activeMode,
    sessionHistory,
    cognitiveState,
    distractionsBlocked,
    microBreakDue,
    sessionStats,
    remainingTime,
    
    // Actions
    startSession,
    endSession,
    recordTaskCompletion,
    recordBreak,
    blockDistraction,
    createCustomMode,
    updateCognitiveState,
    
    // Setters
    setModes,
    setCognitiveState,
  };
};
