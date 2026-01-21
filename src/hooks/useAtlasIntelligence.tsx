// Atlas Intelligence Layer - Core differentiation from traditional phones
// Unified inbox summary, smart categorization, context-aware drafts, daily briefs

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useNotificationPreferences, type HubType } from './useNotificationPreferences';

// Message category types
export type MessageCategory = 'personal' | 'family' | 'work' | 'urgent' | 'promotional' | 'unknown';

// Unified message from any platform
export interface UnifiedMessage {
  id: string;
  platform: 'email' | 'sms' | 'whatsapp' | 'slack' | 'teams' | 'messenger' | 'internal';
  sender: string;
  senderAvatar?: string;
  subject?: string;
  preview: string;
  fullContent?: string;
  timestamp: Date;
  isRead: boolean;
  category: MessageCategory;
  hubType: HubType;
  urgencyScore: number; // 0-100
  sentiment?: 'positive' | 'neutral' | 'negative';
  suggestedAction?: string;
  relatedContacts?: string[];
}

// Daily brief structure
export interface DailyBrief {
  id: string;
  generatedAt: Date;
  summary: string;
  urgentItems: UnifiedMessage[];
  personalHighlights: string[];
  workHighlights: string[];
  suggestedFocus: string;
  wellbeingNote?: string;
  holdingCount: number; // Items held due to focus mode
}

// Focus mode configuration
export interface FocusMode {
  id: string;
  name: string;
  icon: string;
  blockedHubs: HubType[];
  allowUrgent: boolean;
  autoReply?: string;
  scheduledEnd?: Date;
  isActive: boolean;
}

// Stress indicator
export interface StressIndicator {
  level: 'low' | 'moderate' | 'high' | 'critical';
  messageVolume: number;
  checkFrequency: number; // times checked today
  suggestedAction: string;
  lastChecked: Date;
}

// Boundary coaching insight
export interface BoundaryInsight {
  id: string;
  type: 'overworking' | 'weekend-work' | 'late-night' | 'high-volume' | 'no-breaks';
  message: string;
  suggestion: string;
  timestamp: Date;
  dismissed: boolean;
}

const DEFAULT_FOCUS_MODES: FocusMode[] = [
  {
    id: 'family-time',
    name: 'Family Time',
    icon: '👨‍👩‍👧‍👦',
    blockedHubs: ['csuite', 'group'],
    allowUrgent: false,
    autoReply: "I'm spending time with family. I'll respond when I'm available.",
    isActive: false,
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    icon: '🎯',
    blockedHubs: ['personal'],
    allowUrgent: true,
    autoReply: "I'm in deep focus mode. Urgent matters only.",
    isActive: false,
  },
  {
    id: 'sleep',
    name: 'Sleep Mode',
    icon: '😴',
    blockedHubs: ['csuite', 'group', 'personal'],
    allowUrgent: true,
    isActive: false,
  },
  {
    id: 'vacation',
    name: 'Vacation',
    icon: '🏖️',
    blockedHubs: ['csuite', 'group'],
    allowUrgent: false,
    autoReply: "I'm on vacation and will respond when I return.",
    isActive: false,
  },
];

// Mock data for demonstration
const generateMockMessages = (): UnifiedMessage[] => [
  {
    id: '1',
    platform: 'email',
    sender: 'John Smith',
    subject: 'Q4 Board Meeting Prep',
    preview: 'Need your review on the financial projections before Thursday...',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isRead: false,
    category: 'work',
    hubType: 'csuite',
    urgencyScore: 85,
    sentiment: 'neutral',
    suggestedAction: 'Review and respond today',
  },
  {
    id: '2',
    platform: 'whatsapp',
    sender: 'Mom',
    preview: "Don't forget dinner on Sunday! Dad is making his famous lasagna 🍝",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    isRead: false,
    category: 'family',
    hubType: 'personal',
    urgencyScore: 30,
    sentiment: 'positive',
  },
  {
    id: '3',
    platform: 'slack',
    sender: 'Sarah (Engineering)',
    preview: 'Deployment completed successfully. All tests passing.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    isRead: true,
    category: 'work',
    hubType: 'group',
    urgencyScore: 20,
    sentiment: 'positive',
  },
  {
    id: '4',
    platform: 'sms',
    sender: 'Bank Alert',
    preview: 'Large transaction detected: $5,000 withdrawal...',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    isRead: false,
    category: 'urgent',
    hubType: 'personal',
    urgencyScore: 95,
    sentiment: 'negative',
    suggestedAction: 'Verify transaction immediately',
  },
  {
    id: '5',
    platform: 'teams',
    sender: 'HR Department',
    preview: 'Reminder: Performance reviews due by end of week',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    isRead: false,
    category: 'work',
    hubType: 'csuite',
    urgencyScore: 60,
    sentiment: 'neutral',
  },
];

export function useAtlasIntelligence() {
  const { user } = useAuth();
  const { shouldShowInPersonalHub, getHubSettings } = useNotificationPreferences();
  
  const [unifiedInbox, setUnifiedInbox] = useState<UnifiedMessage[]>([]);
  const [dailyBrief, setDailyBrief] = useState<DailyBrief | null>(null);
  const [focusModes, setFocusModes] = useState<FocusMode[]>(DEFAULT_FOCUS_MODES);
  const [activeFocusMode, setActiveFocusMode] = useState<FocusMode | null>(null);
  const [stressIndicator, setStressIndicator] = useState<StressIndicator | null>(null);
  const [boundaryInsights, setBoundaryInsights] = useState<BoundaryInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [heldMessages, setHeldMessages] = useState<UnifiedMessage[]>([]);

  // Load saved state from localStorage
  useEffect(() => {
    if (!user) return;
    
    const savedFocusModes = localStorage.getItem(`atlas-focus-modes-${user.id}`);
    const savedActiveFocus = localStorage.getItem(`atlas-active-focus-${user.id}`);
    const savedInsights = localStorage.getItem(`atlas-boundary-insights-${user.id}`);
    
    if (savedFocusModes) {
      try {
        setFocusModes(JSON.parse(savedFocusModes));
      } catch (e) {
        console.error('Error loading focus modes:', e);
      }
    }
    
    if (savedActiveFocus) {
      try {
        const parsed = JSON.parse(savedActiveFocus);
        if (parsed && (!parsed.scheduledEnd || new Date(parsed.scheduledEnd) > new Date())) {
          setActiveFocusMode(parsed);
        }
      } catch (e) {
        console.error('Error loading active focus:', e);
      }
    }
    
    if (savedInsights) {
      try {
        setBoundaryInsights(JSON.parse(savedInsights));
      } catch (e) {
        console.error('Error loading boundary insights:', e);
      }
    }
    
    // Load mock messages
    setUnifiedInbox(generateMockMessages());
  }, [user]);

  // Categorize message using simple heuristics (would use AI in production)
  const categorizeMessage = useCallback((message: Partial<UnifiedMessage>): MessageCategory => {
    const content = (message.preview || '').toLowerCase() + (message.subject || '').toLowerCase();
    const sender = (message.sender || '').toLowerCase();
    
    // Urgent detection
    if (content.includes('urgent') || content.includes('asap') || content.includes('immediately') ||
        content.includes('alert') || content.includes('warning')) {
      return 'urgent';
    }
    
    // Family detection
    if (sender.includes('mom') || sender.includes('dad') || sender.includes('wife') || 
        sender.includes('husband') || sender.includes('son') || sender.includes('daughter') ||
        content.includes('family') || content.includes('dinner')) {
      return 'family';
    }
    
    // Work detection
    if (content.includes('meeting') || content.includes('project') || content.includes('deadline') ||
        content.includes('report') || content.includes('review') || content.includes('board') ||
        message.platform === 'slack' || message.platform === 'teams') {
      return 'work';
    }
    
    // Promotional detection
    if (content.includes('sale') || content.includes('offer') || content.includes('discount') ||
        content.includes('unsubscribe') || content.includes('newsletter')) {
      return 'promotional';
    }
    
    return 'personal';
  }, []);

  // Generate daily brief
  const generateDailyBrief = useCallback(async (): Promise<DailyBrief> => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    const unreadMessages = unifiedInbox.filter(m => !m.isRead);
    const urgentItems = unreadMessages.filter(m => m.urgencyScore >= 80);
    const workItems = unreadMessages.filter(m => m.hubType === 'csuite' || m.hubType === 'group');
    const personalItems = unreadMessages.filter(m => m.hubType === 'personal');
    
    let wellbeingNote: string | undefined;
    let suggestedFocus: string;
    
    if (isWeekend && workItems.length > 0) {
      wellbeingNote = `It's the weekend, but you have ${workItems.length} work items. Want me to hold them until Monday?`;
      suggestedFocus = 'Consider focusing on personal time today';
    } else if (hour >= 20) {
      wellbeingNote = "It's getting late. Consider winding down and tackling remaining items tomorrow.";
      suggestedFocus = 'Review urgent items only, rest can wait';
    } else if (urgentItems.length > 3) {
      wellbeingNote = 'High volume of urgent items today. Remember to take breaks.';
      suggestedFocus = 'Prioritize the top 3 urgent items first';
    } else {
      suggestedFocus = 'Balanced day ahead - tackle work items, then personal';
    }
    
    const brief: DailyBrief = {
      id: `brief-${now.toISOString()}`,
      generatedAt: now,
      summary: `You have ${unreadMessages.length} unread messages: ${urgentItems.length} urgent, ${workItems.length} work-related, ${personalItems.length} personal.`,
      urgentItems,
      personalHighlights: personalItems.slice(0, 3).map(m => `${m.sender}: ${m.preview.slice(0, 50)}...`),
      workHighlights: workItems.slice(0, 3).map(m => `${m.sender}: ${m.preview.slice(0, 50)}...`),
      suggestedFocus,
      wellbeingNote,
      holdingCount: activeFocusMode ? heldMessages.length : 0,
    };
    
    setDailyBrief(brief);
    return brief;
  }, [unifiedInbox, activeFocusMode, heldMessages]);

  // Activate focus mode
  const activateFocusMode = useCallback((modeId: string, duration?: number) => {
    const mode = focusModes.find(m => m.id === modeId);
    if (!mode) return;
    
    const activeMode: FocusMode = {
      ...mode,
      isActive: true,
      scheduledEnd: duration ? new Date(Date.now() + duration * 60 * 1000) : undefined,
    };
    
    setActiveFocusMode(activeMode);
    
    // Move blocked messages to held
    const blocked = unifiedInbox.filter(m => activeMode.blockedHubs.includes(m.hubType));
    setHeldMessages(prev => [...prev, ...blocked.filter(m => !m.isRead)]);
    
    if (user) {
      localStorage.setItem(`atlas-active-focus-${user.id}`, JSON.stringify(activeMode));
    }
  }, [focusModes, unifiedInbox, user]);

  // Deactivate focus mode
  const deactivateFocusMode = useCallback(() => {
    setActiveFocusMode(null);
    
    // Release held messages
    setUnifiedInbox(prev => [...prev, ...heldMessages.filter(h => !prev.some(p => p.id === h.id))]);
    setHeldMessages([]);
    
    if (user) {
      localStorage.removeItem(`atlas-active-focus-${user.id}`);
    }
  }, [heldMessages, user]);

  // Check stress levels
  const checkStressLevels = useCallback(() => {
    const today = new Date();
    const todayMessages = unifiedInbox.filter(m => 
      m.timestamp.toDateString() === today.toDateString()
    );
    
    // Get check frequency from localStorage
    const checkKey = `atlas-check-count-${user?.id}-${today.toDateString()}`;
    const checkCount = parseInt(localStorage.getItem(checkKey) || '0') + 1;
    localStorage.setItem(checkKey, checkCount.toString());
    
    let level: StressIndicator['level'];
    let suggestedAction: string;
    
    if (todayMessages.length > 50 || checkCount > 20) {
      level = 'critical';
      suggestedAction = 'Consider enabling Focus Mode and batching responses';
    } else if (todayMessages.length > 30 || checkCount > 15) {
      level = 'high';
      suggestedAction = 'High volume today - prioritize and delegate where possible';
    } else if (todayMessages.length > 15 || checkCount > 10) {
      level = 'moderate';
      suggestedAction = 'Steady pace - remember to take short breaks';
    } else {
      level = 'low';
      suggestedAction = 'Healthy communication volume';
    }
    
    const indicator: StressIndicator = {
      level,
      messageVolume: todayMessages.length,
      checkFrequency: checkCount,
      suggestedAction,
      lastChecked: new Date(),
    };
    
    setStressIndicator(indicator);
    
    // Generate boundary insight if needed
    if (level === 'high' || level === 'critical') {
      const now = new Date();
      const hour = now.getHours();
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;
      
      let insight: BoundaryInsight | null = null;
      
      if (isWeekend && todayMessages.filter(m => m.category === 'work').length > 5) {
        insight = {
          id: `insight-${Date.now()}`,
          type: 'weekend-work',
          message: "You've checked work messages multiple times this weekend.",
          suggestion: 'Consider setting up automatic work-life boundaries for weekends.',
          timestamp: now,
          dismissed: false,
        };
      } else if (hour >= 22 || hour < 6) {
        insight = {
          id: `insight-${Date.now()}`,
          type: 'late-night',
          message: 'Late night activity detected.',
          suggestion: 'Enable Sleep Mode to protect your rest time.',
          timestamp: now,
          dismissed: false,
        };
      } else if (level === 'critical') {
        insight = {
          id: `insight-${Date.now()}`,
          type: 'high-volume',
          message: 'Unusually high message volume today.',
          suggestion: 'Would you like me to batch non-urgent items and summarize?',
          timestamp: now,
          dismissed: false,
        };
      }
      
      if (insight) {
        setBoundaryInsights(prev => {
          const updated = [insight!, ...prev.filter(i => i.type !== insight!.type)].slice(0, 5);
          if (user) {
            localStorage.setItem(`atlas-boundary-insights-${user.id}`, JSON.stringify(updated));
          }
          return updated;
        });
      }
    }
    
    return indicator;
  }, [unifiedInbox, user]);

  // Generate context-aware draft
  const generateContextAwareDraft = useCallback(async (
    message: UnifiedMessage,
    currentHub: HubType
  ): Promise<string> => {
    // This would call AI in production
    const isPersonalContext = currentHub === 'personal';
    const isWorkMessage = message.category === 'work';
    
    if (isPersonalContext && isWorkMessage) {
      return `Hi ${message.sender.split(' ')[0]},\n\nThanks for reaching out. I'm currently in personal time but will review this when I'm back in work mode.\n\nBest`;
    } else if (!isPersonalContext && message.category === 'personal') {
      return `Hey ${message.sender.split(' ')[0]}!\n\nGot your message - will get back to you properly when I'm done with work stuff.\n\nTalk soon!`;
    } else if (isWorkMessage) {
      return `Hi ${message.sender.split(' ')[0]},\n\nThank you for your message. I've reviewed the details and will follow up with a comprehensive response shortly.\n\nBest regards`;
    } else {
      return `Hey ${message.sender.split(' ')[0]}! 👋\n\nThanks for the message! `;
    }
  }, []);

  // Dismiss boundary insight
  const dismissInsight = useCallback((insightId: string) => {
    setBoundaryInsights(prev => {
      const updated = prev.map(i => i.id === insightId ? { ...i, dismissed: true } : i);
      if (user) {
        localStorage.setItem(`atlas-boundary-insights-${user.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  }, [user]);

  // Get unified inbox summary
  const getInboxSummary = useCallback(() => {
    const unread = unifiedInbox.filter(m => !m.isRead);
    const byCategory = {
      urgent: unread.filter(m => m.category === 'urgent').length,
      work: unread.filter(m => m.category === 'work').length,
      personal: unread.filter(m => m.category === 'personal').length,
      family: unread.filter(m => m.category === 'family').length,
      promotional: unread.filter(m => m.category === 'promotional').length,
    };
    
    const byHub = {
      personal: unread.filter(m => m.hubType === 'personal').length,
      group: unread.filter(m => m.hubType === 'group').length,
      csuite: unread.filter(m => m.hubType === 'csuite').length,
    };
    
    const byPlatform = {
      email: unread.filter(m => m.platform === 'email').length,
      sms: unread.filter(m => m.platform === 'sms').length,
      whatsapp: unread.filter(m => m.platform === 'whatsapp').length,
      slack: unread.filter(m => m.platform === 'slack').length,
      teams: unread.filter(m => m.platform === 'teams').length,
    };
    
    return {
      total: unread.length,
      byCategory,
      byHub,
      byPlatform,
      topUrgent: unread.sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, 3),
    };
  }, [unifiedInbox]);

  // Filter messages based on active focus mode
  const getVisibleMessages = useCallback((forHub: HubType): UnifiedMessage[] => {
    if (!activeFocusMode) {
      return unifiedInbox.filter(m => m.hubType === forHub || shouldShowInPersonalHub(m.hubType, 'message'));
    }
    
    return unifiedInbox.filter(m => {
      if (activeFocusMode.blockedHubs.includes(m.hubType)) {
        // Only show if urgent and urgent is allowed
        return activeFocusMode.allowUrgent && m.category === 'urgent';
      }
      return m.hubType === forHub || shouldShowInPersonalHub(m.hubType, 'message');
    });
  }, [unifiedInbox, activeFocusMode, shouldShowInPersonalHub]);

  return {
    // State
    unifiedInbox,
    dailyBrief,
    focusModes,
    activeFocusMode,
    stressIndicator,
    boundaryInsights,
    heldMessages,
    isLoading,
    
    // Actions
    generateDailyBrief,
    activateFocusMode,
    deactivateFocusMode,
    checkStressLevels,
    generateContextAwareDraft,
    dismissInsight,
    categorizeMessage,
    
    // Helpers
    getInboxSummary,
    getVisibleMessages,
  };
}
