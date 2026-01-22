// Wellness Widget - Mood check-in and stress monitoring with Atlas AI evaluation
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
  ChevronUp,
  Sparkles,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAtlasIntelligence, type StressIndicator, type MoodLevel, type InferredMood } from '@/hooks/useAtlasIntelligence';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  const { 
    stressIndicator, 
    checkStressLevels, 
    boundaryInsights,
    inferredMood,
    inferMoodFromActivity,
    setManualMood,
  } = useAtlasIntelligence();
  
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Check stress and auto-evaluate mood on mount (passive evaluation)
  useEffect(() => {
    checkStressLevels();
    
    // Auto-infer mood if not already set for today
    if (!inferredMood) {
      // Small delay to let stress data load first
      const timer = setTimeout(() => {
        inferMoodFromActivity();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [checkStressLevels, inferredMood, inferMoodFromActivity]);

  // Life balance areas (calculated based on activity)
  const lifeAreas: LifeArea[] = [
    { id: 'work', name: 'Work', icon: <Sun size={12} />, score: 75, trend: 'up' },
    { id: 'health', name: 'Health', icon: <Heart size={12} />, score: 60, trend: 'stable' },
    { id: 'social', name: 'Social', icon: <Smile size={12} />, score: 45, trend: 'down' },
    { id: 'rest', name: 'Rest', icon: <Moon size={12} />, score: 55, trend: 'stable' },
  ];

  // Handle Atlas mood analysis
  const handleAtlasAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const result = inferMoodFromActivity();
      toast.success(`Atlas analyzed your mood: ${MOOD_CONFIG[result.mood].label}`, {
        description: result.reasoning,
      });
    } catch (error) {
      toast.error('Failed to analyze mood');
    } finally {
      setIsAnalyzing(false);
    }
  }, [inferMoodFromActivity]);

  // Handle manual mood check
  const handleMoodCheck = useCallback((mood: MoodLevel) => {
    if (!user?.id) return;
    setManualMood(mood);
    toast.success(`Mood set: ${MOOD_CONFIG[mood].label}`);
  }, [user?.id, setManualMood]);

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

  const getSourceBadge = (source: InferredMood['source']) => {
    switch (source) {
      case 'activity': return { label: 'Activity', icon: <Brain size={8} /> };
      case 'conversation': return { label: 'Atlas', icon: <Sparkles size={8} /> };
      case 'manual': return { label: 'You', icon: null };
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
            {inferredMood && (
              <div className={cn("flex items-center gap-1", MOOD_CONFIG[inferredMood.mood].color)}>
                {MOOD_CONFIG[inferredMood.mood].icon}
              </div>
            )}
          </div>
          
          {!inferredMood ? (
            <div className="flex gap-1 items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1"
                onClick={handleAtlasAnalysis}
                disabled={isAnalyzing}
              >
                <Sparkles size={10} />
                {isAnalyzing ? 'Analyzing...' : 'Ask Atlas'}
              </Button>
              {(['great', 'okay', 'low'] as MoodLevel[]).map((mood) => (
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
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleAtlasAnalysis}
              disabled={isAnalyzing}
              title="Ask Atlas to evaluate your mood"
            >
              <Sparkles size={10} className={isAnalyzing ? "animate-spin" : ""} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Mood Display or Check-in */}
        {!inferredMood ? (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-muted-foreground">How are you feeling?</p>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[9px] gap-1"
                onClick={handleAtlasAnalysis}
                disabled={isAnalyzing}
              >
                <Brain size={10} />
                {isAnalyzing ? 'Analyzing...' : 'Let Atlas Evaluate'}
              </Button>
            </div>
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
          <div className="mb-3 p-2 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("text-xl", MOOD_CONFIG[inferredMood.mood].color)}>
                  {MOOD_CONFIG[inferredMood.mood].icon}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-medium">{MOOD_CONFIG[inferredMood.mood].label}</p>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 gap-0.5">
                      {getSourceBadge(inferredMood.source).icon}
                      {getSourceBadge(inferredMood.source).label}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {inferredMood.source === 'conversation' ? 'Evaluated by Atlas' : 
                     inferredMood.source === 'activity' ? 'Based on activity' :
                     `Set at ${format(inferredMood.timestamp, 'h:mm a')}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary" className="text-[9px]">
                  {inferredMood.confidence}% confident
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[9px] px-1"
                  onClick={handleAtlasAnalysis}
                  disabled={isAnalyzing}
                >
                  <RefreshCw size={8} className={cn("mr-1", isAnalyzing && "animate-spin")} />
                  Re-evaluate
                </Button>
              </div>
            </div>
            {inferredMood.reasoning && (
              <p className="text-[9px] text-muted-foreground mt-1 italic">
                "{inferredMood.reasoning}"
              </p>
            )}
            {/* Quick mood override buttons */}
            <div className="flex gap-1 mt-2 pt-2 border-t border-border">
              <span className="text-[9px] text-muted-foreground mr-1">Override:</span>
              {(['great', 'good', 'okay', 'low', 'struggling'] as MoodLevel[]).map((mood) => (
                <Button
                  key={mood}
                  variant={inferredMood.mood === mood ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("h-5 w-5 p-0", MOOD_CONFIG[mood].color)}
                  onClick={() => handleMoodCheck(mood)}
                >
                  {MOOD_CONFIG[mood].icon}
                </Button>
              ))}
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