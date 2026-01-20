import { useEffect } from 'react';
import { Trophy, Star, Zap, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLearningProgress } from '@/hooks/useLearningProgress';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';

interface UnlockNotificationProps {
  userId: string | undefined;
}

export function UnlockNotification({ userId }: UnlockNotificationProps) {
  const { recentUnlock, dismissUnlock } = useLearningProgress(userId);
  const { playLevelUp, playAchievement } = useAudioFeedback(userId);

  useEffect(() => {
    if (recentUnlock) {
      if (recentUnlock.type === 'level') {
        playLevelUp();
      } else if (recentUnlock.type === 'achievement') {
        playAchievement();
      }
    }
  }, [recentUnlock, playLevelUp, playAchievement]);

  if (!recentUnlock) return null;

  const renderContent = () => {
    switch (recentUnlock.type) {
      case 'level':
        return (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center animate-pulse">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Level Up!</h3>
              <p className="text-sm text-muted-foreground">
                You reached Level {recentUnlock.data.level}
              </p>
              {recentUnlock.data.features?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {recentUnlock.data.features.map((feature: string) => (
                    <span
                      key={feature}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary"
                    >
                      {feature.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'achievement':
        return (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-3xl animate-bounce">
              {recentUnlock.data.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Achievement Unlocked!
              </h3>
              <p className="font-medium text-amber-400">{recentUnlock.data.name}</p>
              <p className="text-sm text-muted-foreground">{recentUnlock.data.description}</p>
              <p className="text-xs text-amber-400 mt-1">+{recentUnlock.data.xpReward} XP</p>
            </div>
          </div>
        );

      case 'feature':
        return (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Feature Unlocked!</h3>
              <p className="text-purple-400 font-medium">
                {recentUnlock.data.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
      <Card className="border-primary/30 bg-background/95 backdrop-blur-md shadow-2xl">
        <CardContent className="p-4 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 w-6 h-6"
            onClick={dismissUnlock}
          >
            <X className="w-4 h-4" />
          </Button>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
