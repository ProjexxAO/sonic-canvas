import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SkillProgress {
  id: string;
  user_id: string;
  skill_category: string;
  skill_level: number;
  xp_points: number;
  total_actions: number;
  achievements: string[];
  unlocked_features: string[];
  last_activity_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  requirement: { type: string; value: number };
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_report', name: 'First Report', description: 'Generate your first report', icon: '📊', xpReward: 50, requirement: { type: 'reports', value: 1 } },
  { id: 'data_explorer', name: 'Data Explorer', description: 'View 10 different data items', icon: '🔍', xpReward: 100, requirement: { type: 'views', value: 10 } },
  { id: 'power_user', name: 'Power User', description: 'Complete 50 actions', icon: '⚡', xpReward: 200, requirement: { type: 'actions', value: 50 } },
  { id: 'workflow_master', name: 'Workflow Master', description: 'Create 5 workflows', icon: '🔄', xpReward: 150, requirement: { type: 'workflows', value: 5 } },
  { id: 'agent_whisperer', name: 'Agent Whisperer', description: 'Interact with Atlas 20 times', icon: '🤖', xpReward: 100, requirement: { type: 'atlas_interactions', value: 20 } },
  { id: 'level_5', name: 'Expert', description: 'Reach level 5 in any skill', icon: '🏆', xpReward: 500, requirement: { type: 'level', value: 5 } },
];

const SKILL_CATEGORIES = [
  'data_analysis',
  'report_generation',
  'workflow_automation',
  'agent_management',
  'communications',
  'financial_ops',
];

const XP_PER_LEVEL = [0, 100, 300, 600, 1000, 1500];

const FEATURE_UNLOCKS: Record<number, string[]> = {
  1: ['basic_reports', 'single_agent'],
  2: ['advanced_filters', 'workflow_templates'],
  3: ['custom_workflows', 'agent_allocation'],
  4: ['predictive_insights', 'bulk_operations'],
  5: ['full_automation', 'enterprise_features'],
};

export function useLearningProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<Record<string, SkillProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [recentUnlock, setRecentUnlock] = useState<{ type: 'achievement' | 'level' | 'feature'; data: any } | null>(null);

  useEffect(() => {
    if (!userId) {
      setProgress({});
      setIsLoading(false);
      return;
    }

    const fetchProgress = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_learning_progress')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;

        const progressMap: Record<string, SkillProgress> = {};
        (data || []).forEach((item) => {
          progressMap[item.skill_category] = item as SkillProgress;
        });
        setProgress(progressMap);
      } catch (error) {
        console.error('Error fetching learning progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);

  const getOrCreateSkillProgress = useCallback(async (category: string): Promise<SkillProgress | null> => {
    if (!userId) return null;

    if (progress[category]) {
      return progress[category];
    }

    try {
      const { data, error } = await supabase
        .from('user_learning_progress')
        .insert({
          user_id: userId,
          skill_category: category,
          skill_level: 1,
          xp_points: 0,
          total_actions: 0,
          achievements: [],
          unlocked_features: FEATURE_UNLOCKS[1] || [],
        })
        .select()
        .single();

      if (error) throw error;

      const newProgress = data as SkillProgress;
      setProgress((prev) => ({ ...prev, [category]: newProgress }));
      return newProgress;
    } catch (error) {
      console.error('Error creating skill progress:', error);
      return null;
    }
  }, [userId, progress]);

  const addXP = useCallback(async (category: string, xpAmount: number): Promise<void> => {
    if (!userId) return;

    const current = await getOrCreateSkillProgress(category);
    if (!current) return;

    const newXP = current.xp_points + xpAmount;
    const newActions = current.total_actions + 1;

    // Calculate new level
    let newLevel = current.skill_level;
    for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
      if (newXP >= XP_PER_LEVEL[i]) {
        newLevel = i + 1;
        break;
      }
    }

    // Check for level up
    const leveledUp = newLevel > current.skill_level;
    const newUnlockedFeatures = leveledUp
      ? [...(current.unlocked_features || []), ...(FEATURE_UNLOCKS[newLevel] || [])]
      : current.unlocked_features;

    try {
      const { data, error } = await supabase
        .from('user_learning_progress')
        .update({
          xp_points: newXP,
          skill_level: newLevel,
          total_actions: newActions,
          unlocked_features: newUnlockedFeatures,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select()
        .single();

      if (error) throw error;

      setProgress((prev) => ({ ...prev, [category]: data as SkillProgress }));

      if (leveledUp) {
        setRecentUnlock({
          type: 'level',
          data: { level: newLevel, features: FEATURE_UNLOCKS[newLevel] || [] },
        });
      }
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  }, [userId, getOrCreateSkillProgress]);

  const unlockAchievement = useCallback(async (category: string, achievementId: string): Promise<void> => {
    if (!userId) return;

    const current = await getOrCreateSkillProgress(category);
    if (!current) return;

    if (current.achievements?.includes(achievementId)) return;

    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return;

    const newAchievements = [...(current.achievements || []), achievementId];
    const newXP = current.xp_points + achievement.xpReward;

    try {
      const { data, error } = await supabase
        .from('user_learning_progress')
        .update({
          achievements: newAchievements,
          xp_points: newXP,
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', current.id)
        .select()
        .single();

      if (error) throw error;

      setProgress((prev) => ({ ...prev, [category]: data as SkillProgress }));
      setRecentUnlock({ type: 'achievement', data: achievement });
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }, [userId, getOrCreateSkillProgress]);

  const getTotalLevel = useCallback((): number => {
    return Object.values(progress).reduce((sum, p) => sum + p.skill_level, 0);
  }, [progress]);

  const getTotalXP = useCallback((): number => {
    return Object.values(progress).reduce((sum, p) => sum + p.xp_points, 0);
  }, [progress]);

  const getAllAchievements = useCallback((): string[] => {
    const all: string[] = [];
    Object.values(progress).forEach((p) => {
      all.push(...(p.achievements || []));
    });
    return [...new Set(all)];
  }, [progress]);

  const getAllUnlockedFeatures = useCallback((): string[] => {
    const all: string[] = [];
    Object.values(progress).forEach((p) => {
      all.push(...(p.unlocked_features || []));
    });
    return [...new Set(all)];
  }, [progress]);

  const isFeatureUnlocked = useCallback((feature: string): boolean => {
    return getAllUnlockedFeatures().includes(feature);
  }, [getAllUnlockedFeatures]);

  const dismissUnlock = useCallback(() => {
    setRecentUnlock(null);
  }, []);

  return {
    progress,
    isLoading,
    addXP,
    unlockAchievement,
    getTotalLevel,
    getTotalXP,
    getAllAchievements,
    getAllUnlockedFeatures,
    isFeatureUnlocked,
    recentUnlock,
    dismissUnlock,
    ACHIEVEMENTS,
    SKILL_CATEGORIES,
    XP_PER_LEVEL,
  };
}
