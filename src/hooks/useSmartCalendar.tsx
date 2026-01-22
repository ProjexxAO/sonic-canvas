// Smart Calendar Hook - Unified cross-hub calendar with predictive scheduling
// Aggregates events from Personal, Group, and C-Suite hubs with conflict detection

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCrossHubAccess } from './useCrossHubAccess';
import { addDays, addHours, differenceInMinutes, format, isWithinInterval, startOfDay, endOfDay, isSameDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type EventSource = 'personal' | 'group' | 'csuite' | 'external';
export type EventType = 'meeting' | 'deadline' | 'reminder' | 'focus' | 'personal' | 'travel' | 'health';

export interface UnifiedEvent {
  id: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt?: Date;
  allDay?: boolean;
  location?: string;
  attendees?: string[];
  source: EventSource;
  sourceId?: string; // Original hub/group ID
  sourceName?: string; // Human-readable source name
  type: EventType;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isTransparent?: boolean; // Show as available
  recurrence?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface CalendarConflict {
  id: string;
  events: UnifiedEvent[];
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestedResolution?: string;
}

export interface FocusBlock {
  id: string;
  startAt: Date;
  endAt: Date;
  duration: number; // minutes
  label: string;
  isOptimal: boolean; // Based on energy patterns
}

export interface SchedulingSuggestion {
  id: string;
  type: 'focus_block' | 'meeting_time' | 'break' | 'conflict_resolution';
  title: string;
  description: string;
  suggestedTime?: { start: Date; end: Date };
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high';
}

export interface EnergyPattern {
  hour: number;
  level: 'low' | 'medium' | 'high' | 'peak';
  label: string;
}

// Default energy patterns (can be personalized over time)
const DEFAULT_ENERGY_PATTERNS: EnergyPattern[] = [
  { hour: 6, level: 'low', label: 'Morning warmup' },
  { hour: 7, level: 'medium', label: 'Rising energy' },
  { hour: 8, level: 'high', label: 'Morning peak' },
  { hour: 9, level: 'peak', label: 'Peak focus time' },
  { hour: 10, level: 'peak', label: 'Peak focus time' },
  { hour: 11, level: 'high', label: 'Strong focus' },
  { hour: 12, level: 'medium', label: 'Pre-lunch dip' },
  { hour: 13, level: 'low', label: 'Post-lunch slump' },
  { hour: 14, level: 'medium', label: 'Recovery' },
  { hour: 15, level: 'high', label: 'Afternoon peak' },
  { hour: 16, level: 'high', label: 'Productive hours' },
  { hour: 17, level: 'medium', label: 'Winding down' },
  { hour: 18, level: 'low', label: 'Evening' },
  { hour: 19, level: 'low', label: 'Personal time' },
  { hour: 20, level: 'low', label: 'Rest' },
];

export function useSmartCalendar() {
  const { user } = useAuth();
  const { grantedToMe, getAccessibleHubs } = useCrossHubAccess();
  
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [conflicts, setConflicts] = useState<CalendarConflict[]>([]);
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [energyPatterns, setEnergyPatterns] = useState<EnergyPattern[]>(DEFAULT_ENERGY_PATTERNS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewRange, setViewRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  // Fetch events from all accessible sources
  const fetchAllEvents = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    const allEvents: UnifiedEvent[] = [];
    
    try {
      // 1. Fetch personal events
      const { data: personalItems } = await supabase
        .from('personal_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_type', 'event')
        .neq('status', 'deleted')
        .gte('due_date', viewRange.start.toISOString())
        .lte('due_date', viewRange.end.toISOString());
      
      (personalItems || []).forEach(item => {
        if (item.due_date) {
          allEvents.push({
            id: item.id,
            title: item.title,
            description: item.content || undefined,
            startAt: new Date(item.due_date),
            source: 'personal',
            sourceName: 'Personal',
            type: 'personal',
            priority: item.priority as any,
            metadata: item.metadata as Record<string, unknown>
          });
        }
      });

      // 2. Fetch C-Suite events (user's own)
      const { data: csuiteEvents } = await supabase
        .from('csuite_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_at', viewRange.start.toISOString())
        .lte('start_at', viewRange.end.toISOString());
      
      (csuiteEvents || []).forEach(event => {
        allEvents.push({
          id: event.id,
          title: event.title,
          description: event.description || undefined,
          startAt: new Date(event.start_at || new Date()),
          endAt: event.end_at ? new Date(event.end_at) : undefined,
          location: event.location || undefined,
          attendees: (event.attendees || []) as string[],
          source: 'csuite',
          sourceName: 'Executive',
          type: (event.type as EventType) || 'meeting',
          color: getEventColor(event.type),
          metadata: event.metadata as Record<string, unknown>
        });
      });

      // 3. Fetch Group events from accessible groups
      const groupAccess = getAccessibleHubs('group');
      for (const grant of groupAccess) {
        if (grant.sourceHubId) {
          const { data: groupItems } = await supabase
            .from('group_items')
            .select('*')
            .eq('group_id', grant.sourceHubId)
            .eq('item_type', 'event')
            .neq('status', 'deleted')
            .gte('due_date', viewRange.start.toISOString())
            .lte('due_date', viewRange.end.toISOString());
          
          (groupItems || []).forEach(item => {
            if (item.due_date) {
              allEvents.push({
                id: item.id,
                title: item.title,
                description: item.content || undefined,
                startAt: new Date(item.due_date),
                source: 'group',
                sourceId: grant.sourceHubId,
                sourceName: grant.sourceHubName || 'Team',
                type: 'meeting',
                priority: item.priority as any,
                color: '#3b82f6',
                metadata: item.metadata as Record<string, unknown>
              });
            }
          });
        }
      }

      // 4. Fetch C-Suite events from accessible hubs
      const csuiteAccess = getAccessibleHubs('csuite');
      for (const grant of csuiteAccess) {
        // Check if events domain is allowed
        if (grant.allowedDomains && !grant.allowedDomains.includes('events')) continue;
        
        const { data: sharedEvents } = await supabase
          .from('csuite_events')
          .select('*')
          .eq('user_id', grant.grantedBy)
          .gte('start_at', viewRange.start.toISOString())
          .lte('start_at', viewRange.end.toISOString());
        
        (sharedEvents || []).forEach(event => {
          // Check if user is an attendee or event is marked transparent
          allEvents.push({
            id: `shared-${event.id}`,
            title: event.title,
            description: event.description || undefined,
            startAt: new Date(event.start_at || new Date()),
            endAt: event.end_at ? new Date(event.end_at) : undefined,
            location: event.location || undefined,
            attendees: (event.attendees || []) as string[],
            source: 'csuite',
            sourceId: grant.id,
            sourceName: grant.grantedByName || 'Shared',
            type: (event.type as EventType) || 'meeting',
            isTransparent: true,
            color: '#8b5cf6',
            metadata: event.metadata as Record<string, unknown>
          });
        });
      }

      // Sort by start time
      allEvents.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      setEvents(allEvents);
      
      // Detect conflicts
      detectConflicts(allEvents);
      
      // Generate suggestions
      generateSuggestions(allEvents);
      
      // Find available focus blocks
      findFocusBlocks(allEvents);
      
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, viewRange, getAccessibleHubs]);

  // Detect scheduling conflicts
  const detectConflicts = useCallback((allEvents: UnifiedEvent[]) => {
    const newConflicts: CalendarConflict[] = [];
    
    for (let i = 0; i < allEvents.length; i++) {
      const event1 = allEvents[i];
      if (event1.isTransparent || event1.allDay) continue;
      
      for (let j = i + 1; j < allEvents.length; j++) {
        const event2 = allEvents[j];
        if (event2.isTransparent || event2.allDay) continue;
        
        const end1 = event1.endAt || addHours(event1.startAt, 1);
        const end2 = event2.endAt || addHours(event2.startAt, 1);
        
        // Check for overlap
        if (
          isWithinInterval(event2.startAt, { start: event1.startAt, end: end1 }) ||
          isWithinInterval(event1.startAt, { start: event2.startAt, end: end2 })
        ) {
          const overlapMinutes = Math.min(
            differenceInMinutes(end1, event2.startAt),
            differenceInMinutes(end2, event1.startAt)
          );
          
          const severity = overlapMinutes > 30 ? 'high' : overlapMinutes > 15 ? 'medium' : 'low';
          
          newConflicts.push({
            id: `conflict-${event1.id}-${event2.id}`,
            events: [event1, event2],
            severity,
            message: `${event1.title} overlaps with ${event2.title} by ${overlapMinutes} minutes`,
            suggestedResolution: generateConflictResolution(event1, event2)
          });
        }
      }
    }
    
    setConflicts(newConflicts);
  }, []);

  // Generate conflict resolution suggestion
  const generateConflictResolution = (event1: UnifiedEvent, event2: UnifiedEvent): string => {
    if (event1.source === 'personal' && event2.source !== 'personal') {
      return `Consider rescheduling "${event1.title}" to accommodate the ${event2.sourceName} event`;
    }
    if (event2.source === 'personal' && event1.source !== 'personal') {
      return `Consider rescheduling "${event2.title}" to accommodate the ${event1.sourceName} event`;
    }
    if (event1.priority === 'high' || event1.priority === 'urgent') {
      return `"${event1.title}" appears more urgent - consider rescheduling "${event2.title}"`;
    }
    return `Review both events and decide which can be moved`;
  };

  // Find available focus blocks
  const findFocusBlocks = useCallback((allEvents: UnifiedEvent[]) => {
    const blocks: FocusBlock[] = [];
    const today = new Date();
    
    // Look at the next 7 days
    for (let d = 0; d < 7; d++) {
      const day = addDays(today, d);
      const dayStart = startOfDay(day);
      const dayEvents = allEvents.filter(e => isSameDay(e.startAt, day));
      
      // Work hours: 8am - 6pm
      const workStart = new Date(dayStart);
      workStart.setHours(8, 0, 0, 0);
      const workEnd = new Date(dayStart);
      workEnd.setHours(18, 0, 0, 0);
      
      // Sort events for the day
      dayEvents.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      
      // Find gaps
      let currentTime = workStart;
      
      for (const event of dayEvents) {
        if (event.isTransparent) continue;
        
        const eventEnd = event.endAt || addHours(event.startAt, 1);
        
        if (event.startAt > currentTime) {
          const gapMinutes = differenceInMinutes(event.startAt, currentTime);
          
          // Only consider gaps of 30+ minutes
          if (gapMinutes >= 30) {
            const hour = currentTime.getHours();
            const energyLevel = energyPatterns.find(p => p.hour === hour)?.level || 'medium';
            
            blocks.push({
              id: `focus-${format(currentTime, 'yyyy-MM-dd-HH-mm')}`,
              startAt: new Date(currentTime),
              endAt: new Date(event.startAt),
              duration: gapMinutes,
              label: gapMinutes >= 90 ? 'Deep Work Block' : gapMinutes >= 60 ? 'Focus Session' : 'Quick Focus',
              isOptimal: energyLevel === 'peak' || energyLevel === 'high'
            });
          }
        }
        
        if (eventEnd > currentTime) {
          currentTime = new Date(eventEnd);
        }
      }
      
      // Check remaining time until work end
      if (currentTime < workEnd) {
        const remainingMinutes = differenceInMinutes(workEnd, currentTime);
        if (remainingMinutes >= 30) {
          const hour = currentTime.getHours();
          const energyLevel = energyPatterns.find(p => p.hour === hour)?.level || 'medium';
          
          blocks.push({
            id: `focus-${format(currentTime, 'yyyy-MM-dd-HH-mm')}-end`,
            startAt: new Date(currentTime),
            endAt: workEnd,
            duration: remainingMinutes,
            label: remainingMinutes >= 90 ? 'Deep Work Block' : 'Focus Session',
            isOptimal: energyLevel === 'peak' || energyLevel === 'high'
          });
        }
      }
    }
    
    setFocusBlocks(blocks);
  }, [energyPatterns]);

  // Generate smart scheduling suggestions
  const generateSuggestions = useCallback((allEvents: UnifiedEvent[]) => {
    const newSuggestions: SchedulingSuggestion[] = [];
    const today = new Date();
    
    // 1. Check for meeting-heavy days
    for (let d = 0; d < 5; d++) {
      const day = addDays(today, d);
      const dayEvents = allEvents.filter(e => isSameDay(e.startAt, day) && !e.isTransparent);
      
      if (dayEvents.length >= 5) {
        newSuggestions.push({
          id: `suggestion-overload-${d}`,
          type: 'break',
          title: 'Meeting Overload Alert',
          description: `${format(day, 'EEEE')} has ${dayEvents.length} events. Consider blocking break time.`,
          confidence: 85,
          priority: 'high'
        });
      }
    }
    
    // 2. Suggest optimal focus times
    const optimalBlocks = focusBlocks.filter(b => b.isOptimal && b.duration >= 60);
    if (optimalBlocks.length > 0) {
      const bestBlock = optimalBlocks[0];
      newSuggestions.push({
        id: 'suggestion-focus',
        type: 'focus_block',
        title: 'Optimal Focus Time Available',
        description: `${bestBlock.duration} minutes available during your peak energy hours`,
        suggestedTime: { start: bestBlock.startAt, end: bestBlock.endAt },
        confidence: 90,
        priority: 'medium'
      });
    }
    
    // 3. Check for back-to-back meetings
    const sortedEvents = [...allEvents].filter(e => !e.isTransparent).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    let consecutiveCount = 0;
    
    for (let i = 1; i < sortedEvents.length; i++) {
      const prev = sortedEvents[i - 1];
      const curr = sortedEvents[i];
      const prevEnd = prev.endAt || addHours(prev.startAt, 1);
      
      const gap = differenceInMinutes(curr.startAt, prevEnd);
      if (gap < 10 && isSameDay(prev.startAt, curr.startAt)) {
        consecutiveCount++;
        
        if (consecutiveCount >= 2) {
          newSuggestions.push({
            id: `suggestion-buffer-${i}`,
            type: 'break',
            title: 'Buffer Time Needed',
            description: `You have ${consecutiveCount + 1} back-to-back events on ${format(curr.startAt, 'EEEE')}. Consider adding 10-minute buffers.`,
            confidence: 75,
            priority: 'medium'
          });
          break;
        }
      } else {
        consecutiveCount = 0;
      }
    }
    
    // 4. Weekly workload balance
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);
    const weekEvents = allEvents.filter(e => 
      e.startAt >= weekStart && e.startAt <= weekEnd && !e.isTransparent
    );
    
    const eventsByDay: Record<string, number> = {};
    weekEvents.forEach(e => {
      const dayKey = format(e.startAt, 'EEEE');
      eventsByDay[dayKey] = (eventsByDay[dayKey] || 0) + 1;
    });
    
    const maxDay = Object.entries(eventsByDay).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
    const minDay = Object.entries(eventsByDay).reduce((a, b) => a[1] < b[1] ? a : b, ['', Infinity]);
    
    if (maxDay[1] - minDay[1] > 3) {
      newSuggestions.push({
        id: 'suggestion-balance',
        type: 'meeting_time',
        title: 'Workload Imbalance',
        description: `${maxDay[0]} has ${maxDay[1]} events while ${minDay[0]} has ${minDay[1]}. Consider redistributing.`,
        confidence: 70,
        priority: 'low'
      });
    }
    
    setSuggestions(newSuggestions);
  }, [focusBlocks]);

  // Create a new event
  const createEvent = useCallback(async (
    event: Omit<UnifiedEvent, 'id'>,
    targetSource: EventSource = 'personal'
  ): Promise<string | null> => {
    if (!user?.id) return null;
    
    try {
      if (targetSource === 'csuite') {
        const insertData = {
          user_id: user.id,
          title: event.title,
          description: event.description || null,
          start_at: event.startAt.toISOString(),
          end_at: event.endAt?.toISOString() || null,
          location: event.location || null,
          attendees: event.attendees || [],
          type: event.type || 'meeting',
          source: 'manual',
          metadata: event.metadata || null
        };
        
        const { data, error } = await supabase
          .from('csuite_events')
          .insert(insertData as any)
          .select('id')
          .single();
        
        if (error) throw error;
        await fetchAllEvents();
        return data?.id || null;
      } else {
        const { data, error } = await supabase
          .from('personal_items')
          .insert({
            user_id: user.id,
            item_type: 'event',
            title: event.title,
            content: event.description,
            due_date: event.startAt.toISOString(),
            priority: event.priority || 'medium',
            metadata: {
              ...event.metadata,
              end_at: event.endAt?.toISOString(),
              location: event.location
            }
          })
          .select('id')
          .single();
        
        if (error) throw error;
        await fetchAllEvents();
        return data?.id || null;
      }
    } catch (error) {
      console.error('Error creating event:', error);
      return null;
    }
  }, [user?.id, fetchAllEvents]);

  // Block focus time
  const blockFocusTime = useCallback(async (block: FocusBlock): Promise<boolean> => {
    const result = await createEvent({
      title: block.label,
      startAt: block.startAt,
      endAt: block.endAt,
      type: 'focus',
      source: 'personal',
      sourceName: 'Personal',
      description: 'Protected focus time - no meetings'
    }, 'csuite');
    
    return !!result;
  }, [createEvent]);

  // Get events for a specific day
  const getEventsForDay = useCallback((date: Date): UnifiedEvent[] => {
    return events.filter(e => isSameDay(e.startAt, date));
  }, [events]);

  // Get today's schedule summary
  const todaySummary = useMemo(() => {
    const today = new Date();
    const todayEvents = getEventsForDay(today);
    const todayConflicts = conflicts.filter(c => 
      c.events.some(e => isSameDay(e.startAt, today))
    );
    const todayFocusBlocks = focusBlocks.filter(b => isSameDay(b.startAt, today));
    
    const totalMeetingMinutes = todayEvents.reduce((sum, e) => {
      if (e.isTransparent) return sum;
      const end = e.endAt || addHours(e.startAt, 1);
      return sum + differenceInMinutes(end, e.startAt);
    }, 0);
    
    const nextEvent = todayEvents.find(e => e.startAt > new Date());
    
    return {
      eventCount: todayEvents.length,
      conflictCount: todayConflicts.length,
      focusBlocksAvailable: todayFocusBlocks.length,
      totalMeetingHours: Math.round(totalMeetingMinutes / 60 * 10) / 10,
      nextEvent,
      freeTimeMinutes: todayFocusBlocks.reduce((sum, b) => sum + b.duration, 0)
    };
  }, [getEventsForDay, conflicts, focusBlocks]);

  // Refresh on mount and when view range changes
  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  return {
    // Data
    events,
    conflicts,
    focusBlocks,
    suggestions,
    energyPatterns,
    todaySummary,
    isLoading,
    
    // View state
    selectedDate,
    setSelectedDate,
    viewRange,
    setViewRange,
    
    // Actions
    fetchAllEvents,
    createEvent,
    blockFocusTime,
    getEventsForDay,
    
    // Energy patterns management
    setEnergyPatterns
  };
}

// Helper function for event colors
function getEventColor(type?: string): string {
  const colors: Record<string, string> = {
    meeting: '#3b82f6',
    deadline: '#ef4444',
    reminder: '#f59e0b',
    focus: '#10b981',
    personal: '#8b5cf6',
    travel: '#06b6d4',
    health: '#ec4899'
  };
  return colors[type || 'meeting'] || '#6b7280';
}
