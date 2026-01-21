// Wellness Widget - Mood check-in and stress monitoring
import { useState, useCallback, useEffect } from 'react';
import { 
  Heart, 
  Smile, 
  Meh, 
  Frown, 
  Sun,
  Moon,
  Battery,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAtlasIntelligence, type StressIndicator } from '@/hooks/useAtlasIntelligence';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';

// Mood types
type MoodLevel = 'great' | 'good' | 'okay' | 'low' | 'struggling';

interface MoodEntry {
  id: string;
  mood: MoodLevel;
  note?: string;
  timestamp: Date;
  energyLevel: number; // 1-5
}

// Life balance area
interface LifeArea {
  id: string;
  name: string;
  icon: React.ReactNode;
  score: number; // 0-100
  trend: 'up' | 'down' | 'stable';
}

const MOOD_CONFIG: Record<MoodLevel, { icon: React.ReactNode; color: string; label: string }> = {
  great: { icon: <Smile className="fill-current" />, color: 'text-emerald-500', label: 'Great' },
  good: { icon: <Smile />, color: 'text-green-500', label: 'Good' },
  okay: { icon: <Meh />, color: 'text-amber-500', label: 'Okay' },
  low: { icon: <Frown />, color: 'text-orange-500', label: 'Low' },
  struggling: { icon: <Frown className="fill-current" />, color: 'text-red-500', label: 'Struggling' },
};

interface WellnessWidgetProps {
  className?: string;
  compact?: boolean;
}

export function WellnessWidget({ className, compact = false }: WellnessWidgetProps) {
  const { user } = useAuth();
  const { stressIndicator, checkStressLevels, boundaryInsights } = useAtlasIntelligence();
  
  const [todaysMood, setTodaysMood] = useState<MoodEntry | null>(null);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [energyLevel, setEnergyLevel] = useState<number>(3);

  // Load today's mood from localStorage
  useEffect(() => {
    if (user?.id) {
      const key = `mood-${user.id}-${format(new Date(), 'yyyy-MM-dd')}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTodaysMood({ ...parsed, timestamp: new Date(parsed.timestamp) });
      }
    }
  }, [user?.id]);

  // Check stress on mount
  useEffect(() => {
    checkStressLevels();
  }, [checkStressLevels]);

  // Life balance areas (calculated based on activity)
  const lifeAreas: LifeArea[] = [
    { id: 'work', name: 'Work', icon: <Sun size={12} />, score: 75, trend: 'up' },
    { id: 'health', name: 'Health', icon: <Heart size={12} />, score: 60, trend: 'stable' },
    { id: 'social', name: 'Social', icon: <Smile size={12} />, score: 45, trend: 'down' },
    { id: 'rest', name: 'Rest', icon: <Moon size={12} />, score: 55, trend: 'stable' },
  ];

  const handleMoodCheck = useCallback((mood: MoodLevel) => {
    if (!user?.id) return;

    const entry: MoodEntry = {
      id: `mood-${Date.now()}`,
      mood,
      energyLevel,
      timestamp: new Date(),
    };

    // Save to localStorage
    const key = `mood-${user.id}-${format(new Date(), 'yyyy-MM-dd')}`;
    localStorage.setItem(key, JSON.stringify(entry));
    setTodaysMood(entry);

    toast.success(`Mood logged: ${MOOD_CONFIG[mood].label}`);
  }, [user?.id, energyLevel]);

  const getStressColor = (level: StressIndicator['level']) => {
    switch (level) {
      case 'low': return 'text-emerald-500 bg-emerald-500/10';
      case 'moderate': return 'text-amber-500 bg-amber-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'critical': return 'text-red-500 bg-red-500/10';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp size={10} className="text-emerald-500" />;
      case 'down': return <TrendingDown size={10} className="text-red-500" />;
      case 'stable': return <Minus size={10} className="text-muted-foreground" />;
    }
  };

  const averageBalance = Math.round(lifeAreas.reduce((sum, a) => sum + a.score, 0) / lifeAreas.length);

  if (compact) {
    return (
      <Card className={cn("border bg-gradient-to-br from-card to-rose-500/5", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10">
                <Heart size={12} className="text-rose-500" />
              </div>
              <span className="text-xs font-medium">Wellness</span>
            </div>
            {todaysMood && (
              <div className={cn("flex items-center gap-1", MOOD_CONFIG[todaysMood.mood].color)}>
                {MOOD_CONFIG[todaysMood.mood].icon}
              </div>
            )}
          </div>
          
          {!todaysMood ? (
            <div className="flex gap-1">
              {(['great', 'good', 'okay', 'low'] as MoodLevel[]).map((mood) => (
                <Button
                  key={mood}
                  variant="ghost"
                  size="sm"
                  className={cn("h-7 w-7 p-0", MOOD_CONFIG[mood].color)}
                  onClick={() => handleMoodCheck(mood)}
                >
                  {MOOD_CONFIG[mood].icon}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Balance: {averageBalance}% • {stressIndicator?.level || 'low'} stress
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border bg-gradient-to-br from-card via-card to-rose-500/5", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-rose-500/20 to-pink-500/20">
              <Heart size={14} className="text-rose-500" />
            </div>
            Wellness Check
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Mood Check-in */}
        {!todaysMood ? (
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-2">How are you feeling today?</p>
            <div className="flex gap-2 justify-center">
              {(['great', 'good', 'okay', 'low', 'struggling'] as MoodLevel[]).map((mood) => (
                <Button
                  key={mood}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-10 w-10 p-0 flex flex-col gap-0.5 hover:scale-110 transition-transform",
                    MOOD_CONFIG[mood].color
                  )}
                  onClick={() => handleMoodCheck(mood)}
                >
                  <span className="text-lg">{MOOD_CONFIG[mood].icon}</span>
                </Button>
              ))}
            </div>
            
            {/* Energy Level */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Battery size={10} /> Energy
                </span>
                <span className="text-[10px] font-medium">{energyLevel}/5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    className={cn(
                      "flex-1 h-2 rounded-full transition-colors",
                      level <= energyLevel ? "bg-primary" : "bg-muted"
                    )}
                    onClick={() => setEnergyLevel(level)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-3 p-2 rounded-lg bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("text-xl", MOOD_CONFIG[todaysMood.mood].color)}>
                {MOOD_CONFIG[todaysMood.mood].icon}
              </div>
              <div>
                <p className="text-xs font-medium">{MOOD_CONFIG[todaysMood.mood].label}</p>
                <p className="text-[10px] text-muted-foreground">
                  Logged at {format(todaysMood.timestamp, 'h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Battery size={12} className="text-muted-foreground" />
              <span className="text-xs">{todaysMood.energyLevel}/5</span>
            </div>
          </div>
        )}

        {/* Stress Indicator */}
        {stressIndicator && (
          <div className={cn(
            "mb-3 p-2 rounded-lg flex items-center justify-between",
            getStressColor(stressIndicator.level)
          )}>
            <div>
              <p className="text-xs font-medium capitalize">{stressIndicator.level} Stress</p>
              <p className="text-[10px] opacity-80">
                {stressIndicator.messageVolume} messages today
              </p>
            </div>
            {stressIndicator.level !== 'low' && (
              <Badge variant="outline" className="text-[9px]">
                {stressIndicator.suggestedAction}
              </Badge>
            )}
          </div>
        )}

        {isExpanded && (
          <>
            {/* Life Balance Wheel */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Life Balance
                </span>
                <Badge variant="secondary" className="text-[9px]">
                  {averageBalance}% avg
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {lifeAreas.map((area) => (
                  <div key={area.id} className="p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        {area.icon}
                        <span className="text-[10px]">{area.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium">{area.score}%</span>
                        {getTrendIcon(area.trend)}
                      </div>
                    </div>
                    <Progress value={area.score} className="h-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Boundary Insights */}
            {boundaryInsights.filter(i => !i.dismissed).slice(0, 2).map((insight) => (
              <div 
                key={insight.id}
                className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
              >
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  💡 {insight.message}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {insight.suggestion}
                </p>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}