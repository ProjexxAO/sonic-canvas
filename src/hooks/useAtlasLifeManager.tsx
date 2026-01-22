// Atlas Life Manager Hook - Intelligent work-life balance and proactive life management
// Handles auto-blocking personal time, vacation planning, leave requests, and activity tracking

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSmartCalendar, UnifiedEvent } from './useSmartCalendar';
import { addDays, addHours, format, differenceInDays, isSameDay, isWeekend, startOfWeek, endOfWeek, getDay, subDays, parseISO } from 'date-fns';

// Life activity categories that Atlas tracks and auto-blocks
export type LifeCategory = 
  | 'family' 
  | 'fitness' 
  | 'social' 
  | 'volunteer' 
  | 'hobby' 
  | 'rest' 
  | 'travel'
  | 'health'
  | 'learning'
  | 'spiritual';

export interface LifeActivity {
  id: string;
  category: LifeCategory;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'as_needed';
  preferredDays?: number[]; // 0-6 (Sun-Sat)
  preferredTimeStart?: string; // HH:mm
  preferredTimeEnd?: string;
  duration: number; // minutes
  priority: 'essential' | 'important' | 'flexible';
  isRecurring: boolean;
  lastScheduled?: Date;
  autoBlock: boolean; // Atlas auto-blocks this time
  icon?: string;
}

export interface WorkLifeBalance {
  weeklyWorkHours: number;
  weeklyPersonalHours: number;
  balanceScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  alerts: BalanceAlert[];
  recommendations: string[];
}

export interface BalanceAlert {
  id: string;
  type: 'overwork' | 'missing_family' | 'no_exercise' | 'no_rest' | 'travel_burnout' | 'social_isolation';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction: string;
  category?: LifeCategory;
}

export interface AutoBlockSuggestion {
  id: string;
  activity: LifeActivity;
  suggestedSlot: { start: Date; end: Date };
  reason: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  alternativeSlots?: { start: Date; end: Date }[];
}

export interface VacationPlan {
  id: string;
  destination?: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'dates_confirmed' | 'leave_requested' | 'approved' | 'booked';
  totalDays: number;
  workDaysAffected: number;
  leaveRequestDraft?: string;
  itinerary?: ItineraryItem[];
  researchNotes?: string;
  estimatedBudget?: number;
  travelCompanions?: string[];
  workImpactAnalysis?: WorkImpactAnalysis;
}

export interface ItineraryItem {
  id: string;
  day: number;
  time?: string;
  activity: string;
  location?: string;
  notes?: string;
  type: 'transport' | 'accommodation' | 'activity' | 'dining' | 'rest';
  bookingRequired?: boolean;
  estimatedCost?: number;
}

export interface WorkImpactAnalysis {
  meetingsToReschedule: number;
  deadlinesDuringTrip: string[];
  coverageNeeded: string[];
  handoffTasks: string[];
  preTrip: { task: string; deadline: Date }[];
  postTrip: { task: string; date: Date }[];
}

export interface LeaveRequest {
  id: string;
  vacationPlanId?: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  draftEmail: string;
  status: 'draft' | 'ready' | 'sent' | 'approved' | 'denied';
  recipientEmail?: string;
  ccEmails?: string[];
}

// Default life activities that Atlas suggests
const DEFAULT_LIFE_ACTIVITIES: Partial<LifeActivity>[] = [
  { category: 'family', name: 'Family Time', frequency: 'daily', duration: 120, priority: 'essential', preferredDays: [0, 6], autoBlock: true },
  { category: 'fitness', name: 'Exercise', frequency: 'daily', duration: 60, priority: 'important', autoBlock: true },
  { category: 'social', name: 'Friends Catch-up', frequency: 'weekly', duration: 90, priority: 'important', autoBlock: false },
  { category: 'rest', name: 'Personal Rest', frequency: 'daily', duration: 60, priority: 'essential', autoBlock: true },
  { category: 'hobby', name: 'Personal Hobby', frequency: 'weekly', duration: 120, priority: 'flexible', autoBlock: false },
  { category: 'health', name: 'Health Checkup', frequency: 'monthly', duration: 90, priority: 'important', autoBlock: false },
  { category: 'learning', name: 'Personal Development', frequency: 'weekly', duration: 60, priority: 'flexible', autoBlock: false },
];

const CATEGORY_CONFIG: Record<LifeCategory, { icon: string; color: string; label: string }> = {
  family: { icon: 'Heart', color: 'text-pink-400', label: 'Family' },
  fitness: { icon: 'Dumbbell', color: 'text-green-400', label: 'Fitness' },
  social: { icon: 'Users', color: 'text-blue-400', label: 'Social' },
  volunteer: { icon: 'HandHeart', color: 'text-amber-400', label: 'Volunteer' },
  hobby: { icon: 'Palette', color: 'text-purple-400', label: 'Hobby' },
  rest: { icon: 'Moon', color: 'text-indigo-400', label: 'Rest' },
  travel: { icon: 'Plane', color: 'text-cyan-400', label: 'Travel' },
  health: { icon: 'Stethoscope', color: 'text-red-400', label: 'Health' },
  learning: { icon: 'BookOpen', color: 'text-yellow-400', label: 'Learning' },
  spiritual: { icon: 'Sparkles', color: 'text-violet-400', label: 'Spiritual' },
};

export function useAtlasLifeManager() {
  const { user } = useAuth();
  const { events, focusBlocks, createEvent, getEventsForDay } = useSmartCalendar();
  
  const [lifeActivities, setLifeActivities] = useState<LifeActivity[]>([]);
  const [workLifeBalance, setWorkLifeBalance] = useState<WorkLifeBalance | null>(null);
  const [autoBlockSuggestions, setAutoBlockSuggestions] = useState<AutoBlockSuggestion[]>([]);
  const [vacationPlans, setVacationPlans] = useState<VacationPlan[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load saved life activities from localStorage
  useEffect(() => {
    if (!user?.id) return;
    
    const savedActivities = localStorage.getItem(`atlas-life-activities-${user.id}`);
    if (savedActivities) {
      try {
        const parsed = JSON.parse(savedActivities);
        setLifeActivities(parsed.map((a: any) => ({
          ...a,
          lastScheduled: a.lastScheduled ? new Date(a.lastScheduled) : undefined
        })));
      } catch (e) {
        console.error('Error loading life activities:', e);
      }
    } else {
      // Initialize with defaults
      const defaults = DEFAULT_LIFE_ACTIVITIES.map((a, i) => ({
        ...a,
        id: `activity-${i}`,
        isRecurring: true,
      })) as LifeActivity[];
      setLifeActivities(defaults);
    }
    
    // Load vacation plans
    const savedVacations = localStorage.getItem(`atlas-vacation-plans-${user.id}`);
    if (savedVacations) {
      try {
        const parsed = JSON.parse(savedVacations);
        setVacationPlans(parsed.map((v: any) => ({
          ...v,
          startDate: new Date(v.startDate),
          endDate: new Date(v.endDate)
        })));
      } catch (e) {
        console.error('Error loading vacation plans:', e);
      }
    }
    
    setIsLoading(false);
  }, [user?.id]);

  // Save life activities to localStorage
  useEffect(() => {
    if (!user?.id || lifeActivities.length === 0) return;
    localStorage.setItem(`atlas-life-activities-${user.id}`, JSON.stringify(lifeActivities));
  }, [user?.id, lifeActivities]);

  // Save vacation plans to localStorage
  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`atlas-vacation-plans-${user.id}`, JSON.stringify(vacationPlans));
  }, [user?.id, vacationPlans]);

  // Analyze work-life balance based on calendar events
  const analyzeWorkLifeBalance = useCallback(() => {
    setIsAnalyzing(true);
    
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    
    // Get this week's events
    const weekEvents = events.filter(e => 
      e.startAt >= weekStart && e.startAt <= weekEnd
    );
    
    // Categorize events
    let workHours = 0;
    let personalHours = 0;
    const categoryHours: Record<LifeCategory, number> = {
      family: 0, fitness: 0, social: 0, volunteer: 0, hobby: 0,
      rest: 0, travel: 0, health: 0, learning: 0, spiritual: 0
    };
    
    weekEvents.forEach(event => {
      const duration = event.endAt 
        ? differenceInDays(event.endAt, event.startAt) * 24 + (event.endAt.getHours() - event.startAt.getHours())
        : 1;
      const hours = Math.max(duration, 0.5);
      
      if (event.source === 'csuite' || event.type === 'meeting' || event.type === 'deadline') {
        workHours += hours;
      } else if (event.type === 'personal' || event.type === 'health') {
        personalHours += hours;
        // Try to categorize
        const title = event.title.toLowerCase();
        if (title.includes('family') || title.includes('kids') || title.includes('mom') || title.includes('dad')) {
          categoryHours.family += hours;
        } else if (title.includes('gym') || title.includes('run') || title.includes('workout') || title.includes('exercise')) {
          categoryHours.fitness += hours;
        } else if (title.includes('friend') || title.includes('dinner') || title.includes('drinks')) {
          categoryHours.social += hours;
        } else if (title.includes('volunteer') || title.includes('training')) {
          categoryHours.volunteer += hours;
        }
      }
    });
    
    // Check for work on weekends
    const weekendWorkEvents = weekEvents.filter(e => 
      isWeekend(e.startAt) && (e.source === 'csuite' || e.type === 'meeting')
    );
    const workedOnWeekend = weekendWorkEvents.length > 0;
    
    // Calculate balance score
    const idealWorkHours = 40;
    const workOverage = Math.max(0, workHours - idealWorkHours);
    let balanceScore = 100 - (workOverage * 3);
    
    // Penalize if key categories are missing
    if (categoryHours.family < 2) balanceScore -= 15;
    if (categoryHours.fitness < 2) balanceScore -= 10;
    if (categoryHours.social < 1) balanceScore -= 5;
    
    balanceScore = Math.max(0, Math.min(100, balanceScore));
    
    // Generate alerts
    const alerts: BalanceAlert[] = [];
    
    if (workHours > 50) {
      alerts.push({
        id: 'overwork',
        type: 'overwork',
        severity: workHours > 60 ? 'critical' : 'warning',
        message: `You've logged ${Math.round(workHours)} work hours this week`,
        suggestedAction: 'Atlas recommends blocking tomorrow for personal recovery'
      });
    }
    
    if (workedOnWeekend) {
      alerts.push({
        id: 'weekend-work',
        type: 'overwork',
        severity: 'warning',
        message: 'You worked on the weekend',
        suggestedAction: 'Atlas will auto-block compensatory personal time next week'
      });
    }
    
    if (categoryHours.family < 2) {
      alerts.push({
        id: 'missing-family',
        type: 'missing_family',
        severity: 'warning',
        message: 'Limited family time detected this week',
        suggestedAction: 'Block 2-3 hours for family this weekend',
        category: 'family'
      });
    }
    
    if (categoryHours.fitness === 0) {
      alerts.push({
        id: 'no-exercise',
        type: 'no_exercise',
        severity: 'info',
        message: 'No exercise scheduled this week',
        suggestedAction: 'Schedule at least 3 workout sessions',
        category: 'fitness'
      });
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (workedOnWeekend) {
      recommendations.push('Since you worked Saturday, Atlas has blocked Sunday for family/rest time');
    }
    
    if (workHours > 45) {
      recommendations.push('Consider delegating or rescheduling some meetings next week');
    }
    
    if (categoryHours.fitness < 3) {
      recommendations.push('Schedule morning workouts during your peak energy hours');
    }
    
    setWorkLifeBalance({
      weeklyWorkHours: workHours,
      weeklyPersonalHours: personalHours,
      balanceScore,
      trend: balanceScore >= 70 ? 'stable' : balanceScore >= 50 ? 'declining' : 'declining',
      alerts,
      recommendations
    });
    
    setIsAnalyzing(false);
  }, [events]);

  // Generate auto-block suggestions based on activities and calendar gaps
  const generateAutoBlockSuggestions = useCallback(() => {
    const suggestions: AutoBlockSuggestion[] = [];
    const now = new Date();
    
    // Only suggest for activities with autoBlock enabled
    const autoBlockActivities = lifeActivities.filter(a => a.autoBlock);
    
    autoBlockActivities.forEach(activity => {
      // Find the next best slot for this activity
      const preferredDays = activity.preferredDays || [0, 6]; // Default to weekends
      
      // Look at next 7 days
      for (let d = 1; d <= 7; d++) {
        const checkDate = addDays(now, d);
        const dayOfWeek = getDay(checkDate);
        
        if (!preferredDays.includes(dayOfWeek)) continue;
        
        // Check if already scheduled on this day
        const dayEvents = getEventsForDay(checkDate);
        const alreadyScheduled = dayEvents.some(e => 
          e.title.toLowerCase().includes(activity.name.toLowerCase())
        );
        
        if (alreadyScheduled) continue;
        
        // Find a gap in the schedule
        const focusBlocksForDay = focusBlocks.filter(b => isSameDay(b.startAt, checkDate));
        
        // Try preferred time first
        let suggestedStart: Date;
        let suggestedEnd: Date;
        
        if (activity.preferredTimeStart) {
          const [hours, minutes] = activity.preferredTimeStart.split(':').map(Number);
          suggestedStart = new Date(checkDate);
          suggestedStart.setHours(hours, minutes, 0, 0);
          suggestedEnd = addHours(suggestedStart, activity.duration / 60);
        } else if (focusBlocksForDay.length > 0) {
          // Use first available focus block
          const block = focusBlocksForDay.find(b => b.duration >= activity.duration);
          if (block) {
            suggestedStart = block.startAt;
            suggestedEnd = addHours(suggestedStart, activity.duration / 60);
          } else {
            continue;
          }
        } else {
          // Default to morning for fitness, evening for family/social
          if (activity.category === 'fitness') {
            suggestedStart = new Date(checkDate);
            suggestedStart.setHours(7, 0, 0, 0);
          } else if (activity.category === 'family' || activity.category === 'social') {
            suggestedStart = new Date(checkDate);
            suggestedStart.setHours(18, 0, 0, 0);
          } else {
            suggestedStart = new Date(checkDate);
            suggestedStart.setHours(10, 0, 0, 0);
          }
          suggestedEnd = addHours(suggestedStart, activity.duration / 60);
        }
        
        // Generate reason based on work-life analysis
        let reason = `Regular ${activity.name.toLowerCase()} time`;
        let priority: 'high' | 'medium' | 'low' = 'medium';
        
        if (workLifeBalance) {
          if (workLifeBalance.alerts.some(a => a.category === activity.category)) {
            reason = `You've been missing ${activity.category} time - Atlas recommends blocking this`;
            priority = 'high';
          }
          
          // If worked on weekend, compensate
          if (workLifeBalance.alerts.some(a => a.type === 'overwork') && 
              (activity.category === 'rest' || activity.category === 'family')) {
            reason = 'Compensatory time after weekend work';
            priority = 'high';
          }
        }
        
        suggestions.push({
          id: `suggest-${activity.id}-${d}`,
          activity,
          suggestedSlot: { start: suggestedStart, end: suggestedEnd },
          reason,
          confidence: priority === 'high' ? 95 : priority === 'medium' ? 80 : 65,
          priority
        });
        
        // Only one suggestion per activity
        break;
      }
    });
    
    // Sort by priority
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    setAutoBlockSuggestions(suggestions);
  }, [lifeActivities, focusBlocks, getEventsForDay, workLifeBalance]);

  // Run analysis when events change
  useEffect(() => {
    if (events.length > 0) {
      analyzeWorkLifeBalance();
    }
  }, [events, analyzeWorkLifeBalance]);

  // Generate suggestions after balance analysis
  useEffect(() => {
    if (workLifeBalance && lifeActivities.length > 0) {
      generateAutoBlockSuggestions();
    }
  }, [workLifeBalance, lifeActivities, generateAutoBlockSuggestions]);

  // Add or update a life activity
  const saveActivity = useCallback((activity: Partial<LifeActivity> & { id?: string }) => {
    if (activity.id) {
      setLifeActivities(prev => prev.map(a => 
        a.id === activity.id ? { ...a, ...activity } as LifeActivity : a
      ));
    } else {
      const newActivity: LifeActivity = {
        id: `activity-${Date.now()}`,
        category: activity.category || 'hobby',
        name: activity.name || 'New Activity',
        frequency: activity.frequency || 'weekly',
        duration: activity.duration || 60,
        priority: activity.priority || 'flexible',
        isRecurring: activity.isRecurring ?? true,
        autoBlock: activity.autoBlock ?? false,
        ...activity
      };
      setLifeActivities(prev => [...prev, newActivity]);
    }
  }, []);

  // Remove a life activity
  const removeActivity = useCallback((activityId: string) => {
    setLifeActivities(prev => prev.filter(a => a.id !== activityId));
  }, []);

  // Accept an auto-block suggestion and create the event
  const acceptAutoBlock = useCallback(async (suggestion: AutoBlockSuggestion): Promise<boolean> => {
    const { activity, suggestedSlot } = suggestion;
    
    const result = await createEvent({
      title: activity.name,
      description: `Auto-blocked by Atlas for ${activity.category}`,
      startAt: suggestedSlot.start,
      endAt: suggestedSlot.end,
      type: 'personal',
      source: 'personal',
      sourceName: 'Atlas Life Manager',
      metadata: {
        category: activity.category,
        autoBlocked: true,
        activityId: activity.id
      }
    }, 'csuite');
    
    if (result) {
      // Update last scheduled
      setLifeActivities(prev => prev.map(a => 
        a.id === activity.id ? { ...a, lastScheduled: new Date() } : a
      ));
      
      // Remove from suggestions
      setAutoBlockSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      
      return true;
    }
    
    return false;
  }, [createEvent]);

  // Create a vacation plan
  const createVacationPlan = useCallback((plan: Omit<VacationPlan, 'id' | 'totalDays' | 'workDaysAffected'>): VacationPlan => {
    const totalDays = differenceInDays(plan.endDate, plan.startDate) + 1;
    
    // Calculate work days
    let workDays = 0;
    for (let d = 0; d < totalDays; d++) {
      const date = addDays(plan.startDate, d);
      if (!isWeekend(date)) workDays++;
    }
    
    const newPlan: VacationPlan = {
      ...plan,
      id: `vacation-${Date.now()}`,
      totalDays,
      workDaysAffected: workDays
    };
    
    setVacationPlans(prev => [...prev, newPlan]);
    return newPlan;
  }, []);

  // Analyze work impact of a vacation
  const analyzeVacationImpact = useCallback((vacationPlan: VacationPlan): WorkImpactAnalysis => {
    // Get events during vacation period
    const vacationEvents = events.filter(e => 
      e.startAt >= vacationPlan.startDate && 
      e.startAt <= vacationPlan.endDate
    );
    
    const meetingsToReschedule = vacationEvents.filter(e => e.type === 'meeting').length;
    const deadlines = vacationEvents
      .filter(e => e.type === 'deadline')
      .map(e => e.title);
    
    // Pre-trip tasks (one week before)
    const preTrip: { task: string; deadline: Date }[] = [
      { task: 'Submit leave request', deadline: subDays(vacationPlan.startDate, 14) },
      { task: 'Brief team on ongoing projects', deadline: subDays(vacationPlan.startDate, 3) },
      { task: 'Set out-of-office reply', deadline: subDays(vacationPlan.startDate, 1) },
      { task: 'Delegate urgent matters', deadline: subDays(vacationPlan.startDate, 2) }
    ];
    
    // Post-trip tasks (first day back)
    const postTrip: { task: string; date: Date }[] = [
      { task: 'Review and clear inbox', date: addDays(vacationPlan.endDate, 1) },
      { task: 'Catch up with team', date: addDays(vacationPlan.endDate, 1) },
      { task: 'Review any urgent matters', date: addDays(vacationPlan.endDate, 1) }
    ];
    
    return {
      meetingsToReschedule,
      deadlinesDuringTrip: deadlines,
      coverageNeeded: meetingsToReschedule > 0 ? ['Meetings coverage required'] : [],
      handoffTasks: deadlines.length > 0 ? ['Complete or delegate pending deadlines'] : [],
      preTrip,
      postTrip
    };
  }, [events]);

  // Generate leave request email draft
  const generateLeaveRequestDraft = useCallback((vacationPlan: VacationPlan): string => {
    const startFormatted = format(vacationPlan.startDate, 'MMMM d, yyyy');
    const endFormatted = format(vacationPlan.endDate, 'MMMM d, yyyy');
    const workDays = vacationPlan.workDaysAffected;
    
    const impact = analyzeVacationImpact(vacationPlan);
    
    let draft = `Subject: Leave Request - ${startFormatted} to ${endFormatted}\n\n`;
    draft += `Dear Manager,\n\n`;
    draft += `I would like to request ${workDays} day${workDays > 1 ? 's' : ''} of leave `;
    draft += `from ${startFormatted} to ${endFormatted}`;
    
    if (vacationPlan.destination) {
      draft += ` for travel to ${vacationPlan.destination}`;
    }
    draft += '.\n\n';
    
    if (impact.meetingsToReschedule > 0 || impact.deadlinesDuringTrip.length > 0) {
      draft += `Before my departure, I will:\n`;
      if (impact.meetingsToReschedule > 0) {
        draft += `• Reschedule or delegate ${impact.meetingsToReschedule} meeting(s)\n`;
      }
      if (impact.deadlinesDuringTrip.length > 0) {
        draft += `• Complete or arrange coverage for pending deadlines\n`;
      }
      draft += `• Brief the team on ongoing projects\n`;
      draft += `• Set up out-of-office replies\n\n`;
    }
    
    draft += `I will ensure all urgent matters are handled before my departure `;
    draft += `and will be available for true emergencies via email.\n\n`;
    draft += `Please let me know if you need any additional information or have concerns about the timing.\n\n`;
    draft += `Thank you for considering my request.\n\n`;
    draft += `Best regards`;
    
    return draft;
  }, [analyzeVacationImpact]);

  // Generate vacation itinerary using AI (placeholder for edge function call)
  const generateItinerary = useCallback(async (
    vacationPlan: VacationPlan,
    preferences?: { interests: string[]; budget?: 'budget' | 'moderate' | 'luxury'; pace?: 'relaxed' | 'moderate' | 'active' }
  ): Promise<ItineraryItem[]> => {
    // This would call an edge function to generate using AI
    // For now, return a placeholder itinerary
    const days = vacationPlan.totalDays;
    const items: ItineraryItem[] = [];
    
    // Day 1: Travel
    items.push({
      id: 'day-1-travel',
      day: 1,
      time: '08:00',
      activity: `Depart for ${vacationPlan.destination || 'destination'}`,
      type: 'transport',
      bookingRequired: true
    });
    
    items.push({
      id: 'day-1-checkin',
      day: 1,
      time: '15:00',
      activity: 'Check in to accommodation',
      type: 'accommodation',
      bookingRequired: true
    });
    
    items.push({
      id: 'day-1-dinner',
      day: 1,
      time: '19:00',
      activity: 'Dinner at local restaurant',
      type: 'dining'
    });
    
    // Middle days: Activities
    for (let d = 2; d < days; d++) {
      items.push({
        id: `day-${d}-morning`,
        day: d,
        time: '09:00',
        activity: `Morning activity - explore ${vacationPlan.destination || 'local area'}`,
        type: 'activity'
      });
      
      items.push({
        id: `day-${d}-lunch`,
        day: d,
        time: '12:30',
        activity: 'Lunch',
        type: 'dining'
      });
      
      items.push({
        id: `day-${d}-afternoon`,
        day: d,
        time: '14:00',
        activity: 'Afternoon free time / optional activity',
        type: 'rest'
      });
      
      items.push({
        id: `day-${d}-dinner`,
        day: d,
        time: '19:00',
        activity: 'Dinner',
        type: 'dining'
      });
    }
    
    // Last day: Return
    items.push({
      id: `day-${days}-checkout`,
      day: days,
      time: '10:00',
      activity: 'Check out of accommodation',
      type: 'accommodation'
    });
    
    items.push({
      id: `day-${days}-return`,
      day: days,
      time: '12:00',
      activity: 'Return journey',
      type: 'transport',
      bookingRequired: true
    });
    
    // Update the vacation plan with itinerary
    setVacationPlans(prev => prev.map(p => 
      p.id === vacationPlan.id ? { ...p, itinerary: items } : p
    ));
    
    return items;
  }, []);

  // Update vacation plan
  const updateVacationPlan = useCallback((planId: string, updates: Partial<VacationPlan>) => {
    setVacationPlans(prev => prev.map(p => 
      p.id === planId ? { ...p, ...updates } : p
    ));
  }, []);

  // Delete vacation plan
  const deleteVacationPlan = useCallback((planId: string) => {
    setVacationPlans(prev => prev.filter(p => p.id !== planId));
  }, []);

  // Get category configuration
  const getCategoryConfig = useCallback((category: LifeCategory) => {
    return CATEGORY_CONFIG[category];
  }, []);

  // Memoized activities by category
  const activitiesByCategory = useMemo(() => {
    const grouped: Record<LifeCategory, LifeActivity[]> = {
      family: [], fitness: [], social: [], volunteer: [], hobby: [],
      rest: [], travel: [], health: [], learning: [], spiritual: []
    };
    
    lifeActivities.forEach(a => {
      if (grouped[a.category]) {
        grouped[a.category].push(a);
      }
    });
    
    return grouped;
  }, [lifeActivities]);

  return {
    // State
    lifeActivities,
    activitiesByCategory,
    workLifeBalance,
    autoBlockSuggestions,
    vacationPlans,
    leaveRequests,
    isLoading,
    isAnalyzing,
    
    // Activity management
    saveActivity,
    removeActivity,
    getCategoryConfig,
    
    // Auto-blocking
    acceptAutoBlock,
    generateAutoBlockSuggestions,
    
    // Analysis
    analyzeWorkLifeBalance,
    
    // Vacation planning
    createVacationPlan,
    updateVacationPlan,
    deleteVacationPlan,
    analyzeVacationImpact,
    generateLeaveRequestDraft,
    generateItinerary,
    
    // Constants
    CATEGORY_CONFIG
  };
}
