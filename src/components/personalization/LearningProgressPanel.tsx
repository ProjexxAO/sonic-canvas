import { Trophy, Star, Zap, TrendingUp, Lock, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLearningProgress } from '@/hooks/useLearningProgress';

interface LearningProgressPanelProps {
  userId: string | undefined;
}

const SKILL_ICONS: Record<string, string> = {
  data_analysis: '📊',
  report_generation: '📄',
  workflow_automation: '⚙️',
  agent_management: '🤖',
  communications: '💬',
  financial_ops: '💰',
};

const SKILL_LABELS: Record<string, string> = {
  data_analysis: 'Data Analysis',
  report_generation: 'Report Generation',
  workflow_automation: 'Workflow Automation',
  agent_management: 'Agent Management',
  communications: 'Communications',
  financial_ops: 'Financial Operations',
};

export function LearningProgressPanel({ userId }: LearningProgressPanelProps) {
  const { 
    progress, 
    isLoading, 
    getTotalLevel, 
    getTotalXP, 
    getAllAchievements,
    getAllUnlockedFeatures,
    ACHIEVEMENTS,
    XP_PER_LEVEL,
  } = useLearningProgress(userId);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalLevel = getTotalLevel();
  const totalXP = getTotalXP();
  const unlockedAchievements = getAllAchievements();
  const unlockedFeatures = getAllUnlockedFeatures();

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          Learning Progress
        </CardTitle>
        <CardDescription>
          Track your skill development and unlock new features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-2xl font-bold text-primary">{totalLevel}</div>
            <div className="text-xs text-muted-foreground">Total Levels</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-2xl font-bold text-amber-400">{totalXP}</div>
            <div className="text-xs text-muted-foreground">Total XP</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400">{unlockedAchievements.length}</div>
            <div className="text-xs text-muted-foreground">Achievements</div>
          </div>
        </div>

        {/* Skill Progress */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Skills
          </h4>
          
          <div className="space-y-3">
            {Object.entries(SKILL_LABELS).map(([key, label]) => {
              const skillProgress = progress[key];
              const level = skillProgress?.skill_level || 1;
              const xp = skillProgress?.xp_points || 0;
              const nextLevelXP = XP_PER_LEVEL[level] || XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
              const prevLevelXP = XP_PER_LEVEL[level - 1] || 0;
              const progressPercent = Math.min(100, ((xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100);

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{SKILL_ICONS[key]}</span>
                      <span>{label}</span>
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Lv.{level}
                    </Badge>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {xp} / {nextLevelXP} XP
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Achievements
          </h4>
          
          <TooltipProvider>
            <div className="grid grid-cols-6 gap-2">
              {ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);
                return (
                  <Tooltip key={achievement.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                          isUnlocked
                            ? 'bg-amber-500/20 border border-amber-500/40'
                            : 'bg-muted/50 border border-border opacity-50 grayscale'
                        }`}
                      >
                        {achievement.icon}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm font-medium">{achievement.name}</div>
                      <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      {isUnlocked && (
                        <div className="text-xs text-amber-400 mt-1">+{achievement.xpReward} XP</div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        {/* Unlocked Features */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Star className="w-4 h-4" />
            Feature Unlocks
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {[
              'basic_reports', 'single_agent', 'advanced_filters', 'workflow_templates',
              'custom_workflows', 'agent_allocation', 'predictive_insights', 'bulk_operations',
              'full_automation', 'enterprise_features'
            ].map((feature) => {
              const isUnlocked = unlockedFeatures.includes(feature);
              return (
                <Badge
                  key={feature}
                  variant={isUnlocked ? 'default' : 'outline'}
                  className={`flex items-center gap-1 ${!isUnlocked ? 'opacity-50' : ''}`}
                >
                  {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {feature.replace(/_/g, ' ')}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
