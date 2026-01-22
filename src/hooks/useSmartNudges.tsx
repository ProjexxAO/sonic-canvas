// Smart Nudges Hook - Proactive action suggestions based on patterns and data
// Analyzes contacts, calendar, habits, and user behavior to generate intelligent nudges

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSmartCalendar } from './useSmartCalendar';
import { usePersonalHub } from './usePersonalHub';
import { addDays, differenceInDays, differenceInHours, format, isToday, isTomorrow, subDays, startOfDay, endOfDay, addHours } from 'date-fns';

export type NudgeType = 
  | 'contact' 
  | 'focus_time' 
  | 'habit' 
  | 'task' 
  | 'health' 
  | 'calendar' 
  | 'goal' 
  | 'break'
  | 'preparation'
  | 'follow_up';

export type NudgePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SmartNudge {
  id: string;
  type: NudgeType;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  priority: NudgePriority;
  actionLabel?: string;
  actionCallback?: () => void;
  dismissible: boolean;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ContactRecord {
  id: string;
  name: string;
  relationship: 'family' | 'friend' | 'colleague' | 'professional' | 'other';
  lastContactAt?: Date;
  preferredContactMethod: 'call' | 'text' | 'email' | 'in_person';
  contactFrequencyDays: number; // How often to suggest contact
  birthday?: string;
  notes?: string;
  importance: 'low' | 'medium' | 'high';
}

export interface EnergyPattern {
  hour: number;
  dayOfWeek: number;
  averageProductivity: number; // 0-100
  sampleCount: number;
}

// Default important contacts for demo purposes
const DEFAULT_CONTACTS: ContactRecord[] = [
  {
    id: 'contact-mom',
    name: 'Mom',
    relationship: 'family',
    lastContactAt: subDays(new Date(), 12),
    preferredContactMethod: 'call',
    contactFrequencyDays: 7,
    importance: 'high'
  },
  {
    id: 'contact-dad',
    name: 'Dad',
    relationship: 'family',
    lastContactAt: subDays(new Date(), 5),
    preferredContactMethod: 'call',
    contactFrequencyDays: 7,
    importance: 'high'
  },
  {
    id: 'contact-bestfriend',
    name: 'Best Friend',
    relationship: 'friend',
    lastContactAt: subDays(new Date(), 20),
    preferredContactMethod: 'text',
    contactFrequencyDays: 14,
    importance: 'medium'
  }
];

// Default energy patterns based on research
const DEFAULT_ENERGY_PATTERNS: EnergyPattern[] = [
  { hour: 9, dayOfWeek: 1, averageProductivity: 85, sampleCount: 10 },
  { hour: 10, dayOfWeek: 1, averageProductivity: 92, sampleCount: 10 },
  { hour: 11, dayOfWeek: 1, averageProductivity: 88, sampleCount: 10 },
  { hour: 14, dayOfWeek: 1, averageProductivity: 65, sampleCount: 10 },
  { hour: 15, dayOfWeek: 1, averageProductivity: 78, sampleCount: 10 },
  { hour: 16, dayOfWeek: 1, averageProductivity: 80, sampleCount: 10 },
];

export function useSmartNudges() {
  const { user } = useAuth();
  const { todaySummary, focusBlocks, conflicts, events, suggestions: calendarSuggestions } = useSmartCalendar();
  const { habits, goals, todaysTasks, overdueTasks, stats } = usePersonalHub();
  
  const [nudges, setNudges] = useState<SmartNudge[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>(DEFAULT_CONTACTS);
  const [energyPatterns, setEnergyPatterns] = useState<EnergyPattern[]>(DEFAULT_ENERGY_PATTERNS);
  const [dismissedNudgeIds, setDismissedNudgeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load dismissed nudges from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('atlas_dismissed_nudges');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only keep dismissals from today
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        if (parsed.date === todayKey) {
          setDismissedNudgeIds(new Set(parsed.ids));
        }
      } catch (e) {
        console.error('Error parsing dismissed nudges:', e);
      }
    }
  }, []);

  // Save dismissed nudges
  const dismissNudge = useCallback((nudgeId: string) => {
    setDismissedNudgeIds(prev => {
      const newSet = new Set(prev);
      newSet.add(nudgeId);
      
      // Persist to localStorage
      localStorage.setItem('atlas_dismissed_nudges', JSON.stringify({
        date: format(new Date(), 'yyyy-MM-dd'),
        ids: Array.from(newSet)
      }));
      
      return newSet;
    });
  }, []);

  // Generate contact nudges
  const generateContactNudges = useCallback((): SmartNudge[] => {
    const nudges: SmartNudge[] = [];
    const now = new Date();
    
    contacts.forEach(contact => {
      if (!contact.lastContactAt) return;
      
      const daysSinceContact = differenceInDays(now, contact.lastContactAt);
      const overdueDays = daysSinceContact - contact.contactFrequencyDays;
      
      if (overdueDays > 0) {
        const priority: NudgePriority = 
          overdueDays > 14 ? 'high' :
          overdueDays > 7 ? 'medium' : 'low';
        
        const methodVerb = contact.preferredContactMethod === 'call' ? 'call' :
          contact.preferredContactMethod === 'text' ? 'text' :
          contact.preferredContactMethod === 'email' ? 'email' : 'reach out to';
        
        nudges.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          title: `Time to ${methodVerb} ${contact.name}`,
          description: `It's been ${daysSinceContact} days since you last connected. ${contact.relationship === 'family' ? 'Family connections matter!' : 'Keep the relationship strong!'}`,
          icon: contact.preferredContactMethod === 'call' ? 'Phone' : 
                contact.preferredContactMethod === 'text' ? 'MessageCircle' :
                contact.preferredContactMethod === 'email' ? 'Mail' : 'User',
          priority,
          actionLabel: `${methodVerb.charAt(0).toUpperCase() + methodVerb.slice(1)} now`,
          dismissible: true,
          metadata: { contactId: contact.id, daysSince: daysSinceContact },
          createdAt: now
        });
      }
    });
    
    return nudges;
  }, [contacts]);

  // Generate focus time nudges based on energy patterns
  const generateFocusNudges = useCallback((): SmartNudge[] => {
    const nudges: SmartNudge[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Find peak productivity hours
    const todayPatterns = energyPatterns.filter(p => p.dayOfWeek === dayOfWeek);
    const peakHours = todayPatterns
      .filter(p => p.averageProductivity >= 80)
      .map(p => p.hour)
      .sort((a, b) => a - b);
    
    // Check if there's an upcoming peak hour
    const nextPeakHour = peakHours.find(h => h > currentHour && h <= currentHour + 2);
    
    if (nextPeakHour && todaySummary.focusBlocksAvailable > 0) {
      // Check if the time slot is free
      const optimalBlock = focusBlocks.find(b => 
        b.isOptimal && b.duration >= 60 && b.startAt.getHours() === nextPeakHour
      );
      
      if (optimalBlock) {
        nudges.push({
          id: `focus-peak-${nextPeakHour}`,
          type: 'focus_time',
          title: `Block ${format(optimalBlock.startAt, 'h:mm a')} for deep work`,
          description: `This is your peak productivity window. You have ${optimalBlock.duration} minutes available - perfect for focused work.`,
          icon: 'Brain',
          priority: 'high',
          actionLabel: 'Block this time',
          dismissible: true,
          metadata: { blockId: optimalBlock.id, peakHour: nextPeakHour },
          createdAt: now
        });
      }
    }
    
    // Suggest break if many back-to-back meetings
    if (todaySummary.totalMeetingHours > 4) {
      nudges.push({
        id: 'break-needed',
        type: 'break',
        title: 'Schedule a recovery break',
        description: `You have ${todaySummary.totalMeetingHours} hours of meetings today. Block 15-30 minutes for mental recovery.`,
        icon: 'Coffee',
        priority: 'medium',
        actionLabel: 'Find break slot',
        dismissible: true,
        createdAt: now
      });
    }
    
    return nudges;
  }, [energyPatterns, todaySummary, focusBlocks]);

  // Generate habit nudges
  const generateHabitNudges = useCallback((): SmartNudge[] => {
    const nudges: SmartNudge[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    habits.forEach(habit => {
      // Check if habit is at risk (streak might break)
      if (habit.current_streak >= 3 && !habit.last_completed_at) {
        nudges.push({
          id: `habit-streak-${habit.id}`,
          type: 'habit',
          title: `Don't break your ${habit.name} streak!`,
          description: `You have a ${habit.current_streak}-day streak. Complete it today to keep going!`,
          icon: 'Flame',
          priority: habit.current_streak >= 7 ? 'high' : 'medium',
          actionLabel: 'Complete now',
          dismissible: true,
          metadata: { habitId: habit.id, streak: habit.current_streak },
          createdAt: now
        });
      }
      
      // Morning habit reminder
      if (currentHour >= 7 && currentHour <= 10 && habit.frequency === 'daily') {
        const completedToday = habit.last_completed_at && 
          isToday(new Date(habit.last_completed_at));
        
        if (!completedToday) {
          nudges.push({
            id: `habit-morning-${habit.id}`,
            type: 'habit',
            title: `Morning routine: ${habit.name}`,
            description: `Start your day right. Best completed in the morning.`,
            icon: 'Sun',
            priority: 'low',
            actionLabel: 'Mark done',
            dismissible: true,
            metadata: { habitId: habit.id },
            createdAt: now
          });
        }
      }
    });
    
    return nudges;
  }, [habits]);

  // Generate task and goal nudges
  const generateTaskNudges = useCallback((): SmartNudge[] => {
    const nudges: SmartNudge[] = [];
    const now = new Date();
    
    // Overdue task alert
    if (overdueTasks.length > 0) {
      const urgent = overdueTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
      
      if (urgent.length > 0) {
        nudges.push({
          id: 'overdue-urgent',
          type: 'task',
          title: `${urgent.length} urgent task${urgent.length > 1 ? 's' : ''} overdue`,
          description: `"${urgent[0].title}"${urgent.length > 1 ? ` and ${urgent.length - 1} more` : ''} need attention now.`,
          icon: 'AlertTriangle',
          priority: 'urgent',
          actionLabel: 'View tasks',
          dismissible: false,
          createdAt: now
        });
      }
    }
    
    // Goal progress nudge
    goals.forEach(goal => {
      if (goal.target_value && goal.current_value) {
        const progress = (goal.current_value / goal.target_value) * 100;
        const targetDate = goal.target_date ? new Date(goal.target_date) : null;
        
        // Check if goal is at risk
        if (targetDate && progress < 50) {
          const daysRemaining = differenceInDays(targetDate, now);
          
          if (daysRemaining <= 7 && daysRemaining > 0) {
            nudges.push({
              id: `goal-risk-${goal.id}`,
              type: 'goal',
              title: `Goal at risk: ${goal.title}`,
              description: `Only ${daysRemaining} days left and you're at ${Math.round(progress)}%. Time to accelerate!`,
              icon: 'Target',
              priority: 'high',
              actionLabel: 'Update progress',
              dismissible: true,
              metadata: { goalId: goal.id, progress, daysRemaining },
              createdAt: now
            });
          }
        }
        
        // Celebrate near completion
        if (progress >= 90 && progress < 100) {
          nudges.push({
            id: `goal-almost-${goal.id}`,
            type: 'goal',
            title: `Almost there! ${goal.title}`,
            description: `You're at ${Math.round(progress)}%! One final push to complete this goal.`,
            icon: 'Trophy',
            priority: 'medium',
            actionLabel: 'Finish it',
            dismissible: true,
            metadata: { goalId: goal.id, progress },
            createdAt: now
          });
        }
      }
    });
    
    return nudges;
  }, [overdueTasks, goals]);

  // Generate calendar-based nudges
  const generateCalendarNudges = useCallback((): SmartNudge[] => {
    const nudges: SmartNudge[] = [];
    const now = new Date();
    
    // Conflict warnings
    if (conflicts.length > 0) {
      const highSeverity = conflicts.filter(c => c.severity === 'high');
      
      if (highSeverity.length > 0) {
        nudges.push({
          id: 'calendar-conflict',
          type: 'calendar',
          title: `${highSeverity.length} scheduling conflict${highSeverity.length > 1 ? 's' : ''}`,
          description: highSeverity[0].message,
          icon: 'CalendarX',
          priority: 'high',
          actionLabel: 'Resolve conflicts',
          dismissible: true,
          metadata: { conflictCount: highSeverity.length },
          createdAt: now
        });
      }
    }
    
    // Meeting preparation nudge
    if (todaySummary.nextEvent) {
      const hoursUntil = differenceInHours(todaySummary.nextEvent.startAt, now);
      
      if (hoursUntil > 0 && hoursUntil <= 2) {
        const attendeeCount = todaySummary.nextEvent.attendees?.length || 0;
        
        nudges.push({
          id: `prep-${todaySummary.nextEvent.id}`,
          type: 'preparation',
          title: `Prepare for: ${todaySummary.nextEvent.title}`,
          description: `Starting in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}${attendeeCount > 0 ? ` with ${attendeeCount} attendee${attendeeCount > 1 ? 's' : ''}` : ''}.`,
          icon: 'FileCheck',
          priority: 'medium',
          actionLabel: 'View details',
          dismissible: true,
          metadata: { eventId: todaySummary.nextEvent.id },
          createdAt: now
        });
      }
    }
    
    // Follow-up nudge for recent meetings
    const yesterday = subDays(now, 1);
    const recentMeetings = events.filter(e => 
      e.type === 'meeting' && 
      e.startAt >= startOfDay(yesterday) && 
      e.startAt <= endOfDay(yesterday) &&
      (e.attendees?.length || 0) > 0
    );
    
    if (recentMeetings.length > 0) {
      nudges.push({
        id: 'follow-up-yesterday',
        type: 'follow_up',
        title: 'Follow up on yesterday\'s meetings',
        description: `You had ${recentMeetings.length} meeting${recentMeetings.length > 1 ? 's' : ''} yesterday. Send follow-up notes?`,
        icon: 'Reply',
        priority: 'low',
        actionLabel: 'Review meetings',
        dismissible: true,
        metadata: { meetingCount: recentMeetings.length },
        createdAt: now
      });
    }
    
    return nudges;
  }, [conflicts, todaySummary, events]);

  // Generate health and wellbeing nudges
  const generateHealthNudges = useCallback((): SmartNudge[] => {
    const nudges: SmartNudge[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Hydration reminder
    if (currentHour >= 10 && currentHour <= 16 && currentHour % 2 === 0) {
      nudges.push({
        id: `hydrate-${currentHour}`,
        type: 'health',
        title: 'Stay hydrated',
        description: 'Time for a water break. Hydration boosts focus and energy.',
        icon: 'Droplets',
        priority: 'low',
        dismissible: true,
        expiresAt: addHours(now, 1),
        createdAt: now
      });
    }
    
    // Movement reminder for desk workers
    if (todaySummary.totalMeetingHours >= 2) {
      nudges.push({
        id: 'movement-break',
        type: 'health',
        title: 'Time to move',
        description: 'You\'ve been in meetings. Take a quick stretch or walk.',
        icon: 'Footprints',
        priority: 'low',
        dismissible: true,
        createdAt: now
      });
    }
    
    // Eye break for screen time
    if (currentHour >= 14 && currentHour <= 17) {
      nudges.push({
        id: 'eye-break',
        type: 'health',
        title: '20-20-20 eye break',
        description: 'Look at something 20 feet away for 20 seconds. Your eyes will thank you.',
        icon: 'Eye',
        priority: 'low',
        dismissible: true,
        expiresAt: addHours(now, 1),
        createdAt: now
      });
    }
    
    return nudges;
  }, [todaySummary]);

  // Combine and prioritize all nudges
  const generateAllNudges = useCallback(() => {
    setIsLoading(true);
    
    const allNudges: SmartNudge[] = [
      ...generateContactNudges(),
      ...generateFocusNudges(),
      ...generateHabitNudges(),
      ...generateTaskNudges(),
      ...generateCalendarNudges(),
      ...generateHealthNudges()
    ];
    
    // Sort by priority
    const priorityOrder: Record<NudgePriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3
    };
    
    const sortedNudges = allNudges
      .filter(n => !dismissedNudgeIds.has(n.id))
      .filter(n => !n.expiresAt || n.expiresAt > new Date())
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    setNudges(sortedNudges);
    setIsLoading(false);
  }, [
    generateContactNudges,
    generateFocusNudges,
    generateHabitNudges,
    generateTaskNudges,
    generateCalendarNudges,
    generateHealthNudges,
    dismissedNudgeIds
  ]);

  // Regenerate nudges periodically
  useEffect(() => {
    generateAllNudges();
    
    // Refresh every 15 minutes
    const interval = setInterval(generateAllNudges, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [generateAllNudges]);

  // Get nudges by type
  const getNudgesByType = useCallback((type: NudgeType) => {
    return nudges.filter(n => n.type === type);
  }, [nudges]);

  // Get top nudges (limited count)
  const topNudges = useMemo(() => {
    return nudges.slice(0, 5);
  }, [nudges]);

  // Summary statistics
  const nudgeSummary = useMemo(() => ({
    total: nudges.length,
    urgent: nudges.filter(n => n.priority === 'urgent').length,
    high: nudges.filter(n => n.priority === 'high').length,
    contacts: nudges.filter(n => n.type === 'contact').length,
    tasks: nudges.filter(n => n.type === 'task' || n.type === 'goal').length,
    calendar: nudges.filter(n => n.type === 'calendar' || n.type === 'preparation').length,
    health: nudges.filter(n => n.type === 'health').length
  }), [nudges]);

  // Record contact interaction
  const recordContactInteraction = useCallback((contactId: string) => {
    setContacts(prev => prev.map(c => 
      c.id === contactId 
        ? { ...c, lastContactAt: new Date() }
        : c
    ));
    
    // Dismiss the nudge
    dismissNudge(`contact-${contactId}`);
  }, [dismissNudge]);

  // Add new contact
  const addContact = useCallback((contact: Omit<ContactRecord, 'id'>) => {
    const newContact: ContactRecord = {
      ...contact,
      id: `contact-${Date.now()}`
    };
    setContacts(prev => [...prev, newContact]);
    return newContact;
  }, []);

  return {
    // Nudges
    nudges,
    topNudges,
    nudgeSummary,
    isLoading,
    
    // Actions
    dismissNudge,
    generateAllNudges,
    getNudgesByType,
    
    // Contacts
    contacts,
    addContact,
    recordContactInteraction,
    
    // Energy patterns
    energyPatterns,
    setEnergyPatterns
  };
}
