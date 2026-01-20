// Personal Data Hub Hook - Manages personal items, goals, and habits

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type ItemType = 'task' | 'note' | 'event' | 'goal' | 'habit' | 'finance' | 'health' | 'bookmark';
export type ItemStatus = 'active' | 'completed' | 'archived' | 'deleted';
export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface PersonalItem {
  id: string;
  user_id: string;
  item_type: ItemType;
  title: string;
  content: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  status: ItemStatus;
  priority: ItemPriority;
  due_date: string | null;
  reminder_at: string | null;
  completed_at: string | null;
  recurrence_rule: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  start_date: string;
  target_date: string | null;
  status: string;
  created_at: string;
}

export interface PersonalHabit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  current_streak: number;
  longest_streak: number;
  last_completed_at: string | null;
  is_active: boolean;
  created_at: string;
}

export function usePersonalHub() {
  const { user } = useAuth();
  const [items, setItems] = useState<PersonalItem[]>([]);
  const [goals, setGoals] = useState<PersonalGoal[]>([]);
  const [habits, setHabits] = useState<PersonalHabit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<{ type?: ItemType; status?: ItemStatus }>({});

  // Fetch all personal data
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch items
      let query = supabase
        .from('personal_items')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (filter.type) {
        query = query.eq('item_type', filter.type);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      const { data: itemsData } = await query;
      setItems((itemsData || []) as unknown as PersonalItem[]);

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('personal_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setGoals((goalsData || []) as unknown as PersonalGoal[]);

      // Fetch habits
      const { data: habitsData } = await supabase
        .from('personal_habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setHabits((habitsData || []) as unknown as PersonalHabit[]);

    } catch (error) {
      console.error('Error fetching personal data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, filter.type, filter.status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create item
  const createItem = useCallback(async (
    type: ItemType,
    title: string,
    options: {
      content?: string;
      metadata?: Record<string, unknown>;
      tags?: string[];
      status?: ItemStatus;
      priority?: ItemPriority;
      due_date?: string;
      reminder_at?: string;
      recurrence_rule?: string;
    } = {}
  ): Promise<PersonalItem | null> => {
    if (!user?.id) return null;

    const insertData = {
      user_id: user.id,
      item_type: type,
      title,
      content: options.content || null,
      metadata: (options.metadata || {}) as unknown as Record<string, unknown>,
      tags: options.tags || [],
      status: options.status || 'active',
      priority: options.priority || 'medium',
      due_date: options.due_date || null,
      reminder_at: options.reminder_at || null,
      recurrence_rule: options.recurrence_rule || null,
    };

    const { data, error } = await supabase
      .from('personal_items')
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      toast.error('Failed to create item');
      return null;
    }

    const newItem = data as unknown as PersonalItem;
    setItems(prev => [newItem, ...prev]);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created`);
    return newItem;
  }, [user?.id]);

  // Update item
  const updateItem = useCallback(async (
    id: string,
    updates: Partial<Omit<PersonalItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('personal_items')
      .update(updates as any)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update item');
      return false;
    }

    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    return true;
  }, []);

  // Complete item
  const completeItem = useCallback(async (id: string): Promise<boolean> => {
    return updateItem(id, { status: 'completed', completed_at: new Date().toISOString() });
  }, [updateItem]);

  // Delete item (soft delete)
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    return updateItem(id, { status: 'deleted' });
  }, [updateItem]);

  // Create goal
  const createGoal = useCallback(async (
    title: string,
    options: Partial<Omit<PersonalGoal, 'id' | 'user_id' | 'title' | 'created_at'>> = {}
  ): Promise<PersonalGoal | null> => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('personal_goals')
      .insert({
        user_id: user.id,
        title,
        description: options.description || null,
        category: options.category || 'general',
        target_value: options.target_value || null,
        current_value: options.current_value || 0,
        unit: options.unit || null,
        target_date: options.target_date || null,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create goal');
      return null;
    }

    const newGoal = data as unknown as PersonalGoal;
    setGoals(prev => [newGoal, ...prev]);
    toast.success('Goal created');
    return newGoal;
  }, [user?.id]);

  // Update goal progress
  const updateGoalProgress = useCallback(async (id: string, value: number): Promise<boolean> => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return false;

    const updates: Record<string, unknown> = { current_value: value };
    if (goal.target_value && value >= goal.target_value) {
      updates.status = 'completed';
    }

    const { error } = await supabase
      .from('personal_goals')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update goal');
      return false;
    }

    setGoals(prev => prev.map(g => 
      g.id === id ? { ...g, ...updates } as PersonalGoal : g
    ));
    return true;
  }, [goals]);

  // Create habit
  const createHabit = useCallback(async (
    name: string,
    frequency: 'daily' | 'weekly' | 'monthly',
    options: Partial<Omit<PersonalHabit, 'id' | 'user_id' | 'name' | 'frequency' | 'created_at'>> = {}
  ): Promise<PersonalHabit | null> => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('personal_habits')
      .insert({
        user_id: user.id,
        name,
        frequency,
        description: options.description || null,
        target_count: options.target_count || 1,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create habit');
      return null;
    }

    const newHabit = data as unknown as PersonalHabit;
    setHabits(prev => [newHabit, ...prev]);
    toast.success('Habit created');
    return newHabit;
  }, [user?.id]);

  // Complete habit for today
  const completeHabit = useCallback(async (habitId: string): Promise<boolean> => {
    if (!user?.id) return false;

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return false;

    // Insert completion record
    const { error: completionError } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: habitId,
        user_id: user.id,
      });

    if (completionError) {
      toast.error('Failed to record habit completion');
      return false;
    }

    // Update streak
    const newStreak = habit.current_streak + 1;
    const { error: updateError } = await supabase
      .from('personal_habits')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, habit.longest_streak),
        last_completed_at: new Date().toISOString(),
      })
      .eq('id', habitId);

    if (updateError) {
      console.error('Failed to update streak:', updateError);
    }

    setHabits(prev => prev.map(h => 
      h.id === habitId 
        ? { 
            ...h, 
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, h.longest_streak),
            last_completed_at: new Date().toISOString()
          } 
        : h
    ));

    toast.success(`${habit.name} completed! 🎯 ${newStreak} day streak`);
    return true;
  }, [user?.id, habits]);

  // Get items by type
  const getItemsByType = useCallback((type: ItemType) => {
    return items.filter(item => item.item_type === type);
  }, [items]);

  // Get today's tasks
  const todaysTasks = items.filter(item => {
    if (item.item_type !== 'task' || item.status === 'completed') return false;
    if (!item.due_date) return false;
    const dueDate = new Date(item.due_date);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  });

  // Get overdue tasks
  const overdueTasks = items.filter(item => {
    if (item.item_type !== 'task' || item.status === 'completed') return false;
    if (!item.due_date) return false;
    return new Date(item.due_date) < new Date();
  });

  // Summary stats
  const stats = {
    totalItems: items.length,
    activeTasks: items.filter(i => i.item_type === 'task' && i.status === 'active').length,
    completedToday: items.filter(i => {
      if (!i.completed_at) return false;
      return new Date(i.completed_at).toDateString() === new Date().toDateString();
    }).length,
    activeGoals: goals.filter(g => g.status === 'active').length,
    activeHabits: habits.length,
    totalStreak: habits.reduce((sum, h) => sum + h.current_streak, 0),
  };

  return {
    items,
    goals,
    habits,
    isLoading,
    filter,
    setFilter,
    refetch: fetchData,
    
    // Item operations
    createItem,
    updateItem,
    completeItem,
    deleteItem,
    getItemsByType,
    
    // Goal operations
    createGoal,
    updateGoalProgress,
    
    // Habit operations
    createHabit,
    completeHabit,
    
    // Computed
    todaysTasks,
    overdueTasks,
    stats,
  };
}
