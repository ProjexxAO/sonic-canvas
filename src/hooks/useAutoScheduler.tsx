import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { addDays, addHours, setHours, setMinutes, isWithinInterval, isBefore, isAfter, differenceInMinutes } from 'date-fns';

export interface ScheduleBlock {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'task' | 'focus' | 'break' | 'personal' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  isFlexible: boolean;
  flexibilityScore: number; // 0-100, higher = more movable
  energyLevel: 'high' | 'medium' | 'low';
  category?: string;
  source: 'calendar' | 'task' | 'habit' | 'auto';
}

export interface RescheduleAction {
  id: string;
  blockId: string;
  originalStart: Date;
  originalEnd: Date;
  newStart: Date;
  newEnd: Date;
  reason: string;
  impact: 'none' | 'low' | 'medium' | 'high';
  status: 'pending' | 'applied' | 'rejected';
}

export interface ConflictResolution {
  conflictId: string;
  blocks: ScheduleBlock[];
  suggestion: string;
  actions: RescheduleAction[];
  autoResolvable: boolean;
}

export interface EnergyPattern {
  hour: number;
  level: 'peak' | 'high' | 'medium' | 'low' | 'recovery';
  bestFor: string[];
}

const DEFAULT_ENERGY_PATTERNS: EnergyPattern[] = [
  { hour: 6, level: 'low', bestFor: ['routine', 'light-tasks'] },
  { hour: 7, level: 'medium', bestFor: ['planning', 'emails'] },
  { hour: 8, level: 'high', bestFor: ['creative', 'complex-tasks'] },
  { hour: 9, level: 'peak', bestFor: ['deep-work', 'decisions'] },
  { hour: 10, level: 'peak', bestFor: ['deep-work', 'meetings'] },
  { hour: 11, level: 'high', bestFor: ['collaboration', 'meetings'] },
  { hour: 12, level: 'low', bestFor: ['break', 'light-tasks'] },
  { hour: 13, level: 'recovery', bestFor: ['admin', 'routine'] },
  { hour: 14, level: 'medium', bestFor: ['meetings', 'collaboration'] },
  { hour: 15, level: 'high', bestFor: ['creative', 'problem-solving'] },
  { hour: 16, level: 'medium', bestFor: ['wrap-up', 'planning'] },
  { hour: 17, level: 'low', bestFor: ['admin', 'emails'] },
  { hour: 18, level: 'recovery', bestFor: ['personal', 'exercise'] },
];

export const useAutoScheduler = () => {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [pendingActions, setPendingActions] = useState<RescheduleAction[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [defensiveTimeEnabled, setDefensiveTimeEnabled] = useState(true);
  const [energyPatterns] = useState<EnergyPattern[]>(DEFAULT_ENERGY_PATTERNS);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  // Detect conflicts in schedule
  const detectConflicts = useCallback((blocks: ScheduleBlock[]): ConflictResolution[] => {
    const newConflicts: ConflictResolution[] = [];
    
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const a = blocks[i];
        const b = blocks[j];
        
        // Check if blocks overlap
        if (
          isWithinInterval(a.start, { start: b.start, end: b.end }) ||
          isWithinInterval(a.end, { start: b.start, end: b.end }) ||
          isWithinInterval(b.start, { start: a.start, end: a.end })
        ) {
          // Generate resolution
          const moreFlexible = a.flexibilityScore > b.flexibilityScore ? a : b;
          const lessFlexible = a.flexibilityScore > b.flexibilityScore ? b : a;
          
          const newStart = new Date(lessFlexible.end);
          const duration = differenceInMinutes(moreFlexible.end, moreFlexible.start);
          const newEnd = addHours(newStart, duration / 60);
          
          newConflicts.push({
            conflictId: generateId(),
            blocks: [a, b],
            suggestion: `Move "${moreFlexible.title}" to after "${lessFlexible.title}"`,
            autoResolvable: moreFlexible.isFlexible,
            actions: [{
              id: generateId(),
              blockId: moreFlexible.id,
              originalStart: moreFlexible.start,
              originalEnd: moreFlexible.end,
              newStart,
              newEnd,
              reason: `Conflict with "${lessFlexible.title}"`,
              impact: moreFlexible.priority === 'critical' ? 'high' : 'low',
              status: 'pending',
            }],
          });
        }
      }
    }
    
    return newConflicts;
  }, []);

  // Find optimal time slot for a task
  const findOptimalSlot = useCallback((
    duration: number, // in minutes
    priority: ScheduleBlock['priority'],
    preferredEnergyLevel: 'high' | 'medium' | 'low',
    deadline?: Date
  ): { start: Date; end: Date; score: number } | null => {
    const now = new Date();
    const searchEnd = deadline || addDays(now, 7);
    
    let bestSlot: { start: Date; end: Date; score: number } | null = null;
    
    // Search day by day
    let currentDay = now;
    while (isBefore(currentDay, searchEnd)) {
      // Check each hour
      for (let hour = 8; hour <= 18; hour++) {
        const slotStart = setMinutes(setHours(currentDay, hour), 0);
        const slotEnd = addHours(slotStart, duration / 60);
        
        // Skip if in the past
        if (isBefore(slotStart, now)) continue;
        
        // Check if slot is free
        const isOccupied = scheduleBlocks.some(block =>
          isWithinInterval(slotStart, { start: block.start, end: block.end }) ||
          isWithinInterval(slotEnd, { start: block.start, end: block.end })
        );
        
        if (isOccupied) continue;
        
        // Calculate slot score
        const energyPattern = energyPatterns.find(p => p.hour === hour);
        let score = 50;
        
        if (energyPattern) {
          if (preferredEnergyLevel === 'high' && (energyPattern.level === 'peak' || energyPattern.level === 'high')) {
            score += 30;
          } else if (preferredEnergyLevel === 'medium' && energyPattern.level === 'medium') {
            score += 20;
          } else if (preferredEnergyLevel === 'low' && (energyPattern.level === 'low' || energyPattern.level === 'recovery')) {
            score += 25;
          }
        }
        
        // Prefer sooner slots for higher priority
        if (priority === 'critical' || priority === 'high') {
          score += Math.max(0, 20 - differenceInMinutes(slotStart, now) / 60);
        }
        
        if (!bestSlot || score > bestSlot.score) {
          bestSlot = { start: slotStart, end: slotEnd, score };
        }
      }
      
      currentDay = addDays(currentDay, 1);
    }
    
    return bestSlot;
  }, [scheduleBlocks, energyPatterns]);

  // Auto-schedule a task
  const autoScheduleTask = useCallback((
    title: string,
    duration: number,
    priority: ScheduleBlock['priority'],
    deadline?: Date
  ): ScheduleBlock | null => {
    const preferredEnergy = priority === 'critical' || priority === 'high' ? 'high' : 'medium';
    const slot = findOptimalSlot(duration, priority, preferredEnergy, deadline);
    
    if (!slot) {
      toast.error('No available slot found', {
        description: 'Try adjusting the deadline or duration',
      });
      return null;
    }
    
    const block: ScheduleBlock = {
      id: generateId(),
      title,
      start: slot.start,
      end: slot.end,
      type: 'task',
      priority,
      isFlexible: priority !== 'critical',
      flexibilityScore: priority === 'critical' ? 10 : priority === 'high' ? 40 : 70,
      energyLevel: preferredEnergy,
      source: 'auto',
    };
    
    setScheduleBlocks(prev => [...prev, block]);
    toast.success(`Scheduled "${title}"`, {
      description: `${slot.start.toLocaleDateString()} at ${slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });
    
    return block;
  }, [findOptimalSlot]);

  // Protect focus time (defensive scheduling)
  const protectFocusTime = useCallback((
    hoursPerDay: number = 2,
    preferredTime: 'morning' | 'afternoon' = 'morning'
  ) => {
    const today = new Date();
    const focusBlocks: ScheduleBlock[] = [];
    
    for (let day = 0; day < 5; day++) {
      const date = addDays(today, day);
      const startHour = preferredTime === 'morning' ? 9 : 14;
      
      const block: ScheduleBlock = {
        id: generateId(),
        title: 'Protected Focus Time',
        start: setMinutes(setHours(date, startHour), 0),
        end: setMinutes(setHours(date, startHour + hoursPerDay), 0),
        type: 'focus',
        priority: 'high',
        isFlexible: false,
        flexibilityScore: 20,
        energyLevel: 'high',
        source: 'auto',
      };
      
      focusBlocks.push(block);
    }
    
    setScheduleBlocks(prev => [...prev, ...focusBlocks]);
    toast.success('Focus time protected', {
      description: `${hoursPerDay}h blocked daily for deep work`,
    });
  }, []);

  // Auto-resolve all conflicts
  const autoResolveConflicts = useCallback(() => {
    setIsAutoScheduling(true);
    
    const resolvableConflicts = conflicts.filter(c => c.autoResolvable);
    const actions = resolvableConflicts.flatMap(c => c.actions);
    
    // Apply all actions
    setScheduleBlocks(prev => {
      const updated = [...prev];
      actions.forEach(action => {
        const blockIndex = updated.findIndex(b => b.id === action.blockId);
        if (blockIndex >= 0) {
          updated[blockIndex] = {
            ...updated[blockIndex],
            start: action.newStart,
            end: action.newEnd,
          };
        }
      });
      return updated;
    });
    
    // Mark actions as applied
    setPendingActions(prev => [
      ...prev,
      ...actions.map(a => ({ ...a, status: 'applied' as const })),
    ]);
    
    setConflicts([]);
    setIsAutoScheduling(false);
    
    toast.success(`Resolved ${resolvableConflicts.length} conflicts`);
  }, [conflicts]);

  // Apply single reschedule action
  const applyReschedule = useCallback((actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;
    
    setScheduleBlocks(prev => prev.map(block =>
      block.id === action.blockId
        ? { ...block, start: action.newStart, end: action.newEnd }
        : block
    ));
    
    setPendingActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'applied' } : a
    ));
    
    toast.success('Rescheduled successfully');
  }, [pendingActions]);

  // Reject reschedule action
  const rejectReschedule = useCallback((actionId: string) => {
    setPendingActions(prev => prev.map(a =>
      a.id === actionId ? { ...a, status: 'rejected' } : a
    ));
    toast.info('Reschedule rejected');
  }, []);

  // Schedule habits with flexibility
  const scheduleHabit = useCallback((
    title: string,
    duration: number,
    frequency: 'daily' | 'weekdays' | 'weekends',
    preferredTime: 'morning' | 'afternoon' | 'evening',
    flexibilityScore: number = 60
  ) => {
    const today = new Date();
    const blocks: ScheduleBlock[] = [];
    
    const timeMap = { morning: 7, afternoon: 14, evening: 19 };
    const baseHour = timeMap[preferredTime];
    
    for (let day = 0; day < 14; day++) {
      const date = addDays(today, day);
      const dayOfWeek = date.getDay();
      
      // Check frequency
      if (frequency === 'weekdays' && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
      if (frequency === 'weekends' && dayOfWeek !== 0 && dayOfWeek !== 6) continue;
      
      blocks.push({
        id: generateId(),
        title,
        start: setMinutes(setHours(date, baseHour), 0),
        end: setMinutes(setHours(date, baseHour), duration),
        type: 'personal',
        priority: 'medium',
        isFlexible: true,
        flexibilityScore,
        energyLevel: preferredTime === 'morning' ? 'medium' : 'low',
        category: 'habit',
        source: 'auto',
      });
    }
    
    setScheduleBlocks(prev => [...prev, ...blocks]);
    toast.success(`Habit "${title}" scheduled`);
  }, []);

  // Recompute conflicts when blocks change
  const currentConflicts = useMemo(() => 
    detectConflicts(scheduleBlocks),
    [scheduleBlocks, detectConflicts]
  );

  // Get energy level for a specific time
  const getEnergyLevel = useCallback((date: Date) => {
    const hour = date.getHours();
    return energyPatterns.find(p => p.hour === hour) || energyPatterns[0];
  }, [energyPatterns]);

  // Calculate schedule efficiency
  const scheduleEfficiency = useMemo(() => {
    const today = new Date();
    const todayBlocks = scheduleBlocks.filter(b => 
      b.start.toDateString() === today.toDateString()
    );
    
    const totalMinutes = todayBlocks.reduce((sum, b) => 
      sum + differenceInMinutes(b.end, b.start), 0
    );
    
    const focusMinutes = todayBlocks
      .filter(b => b.type === 'focus' || b.type === 'task')
      .reduce((sum, b) => sum + differenceInMinutes(b.end, b.start), 0);
    
    return {
      totalScheduled: totalMinutes,
      focusTime: focusMinutes,
      efficiency: totalMinutes > 0 ? Math.round((focusMinutes / totalMinutes) * 100) : 0,
      conflicts: currentConflicts.length,
    };
  }, [scheduleBlocks, currentConflicts]);

  return {
    // State
    scheduleBlocks,
    pendingActions,
    conflicts: currentConflicts,
    isAutoScheduling,
    defensiveTimeEnabled,
    energyPatterns,
    scheduleEfficiency,
    
    // Actions
    autoScheduleTask,
    protectFocusTime,
    autoResolveConflicts,
    applyReschedule,
    rejectReschedule,
    scheduleHabit,
    findOptimalSlot,
    getEnergyLevel,
    detectConflicts,
    
    // Setters
    setScheduleBlocks,
    setDefensiveTimeEnabled,
  };
};
