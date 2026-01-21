// Stress Monitor - Wellbeing tracking and boundary coaching
import { useEffect, useState } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Heart,
  X,
  Sparkles,
  Clock,
  MessageCircle,
  Brain,
  Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAtlasIntelligence, type StressIndicator, type BoundaryInsight } from '@/hooks/useAtlasIntelligence';
import { formatDistanceToNow } from 'date-fns';

interface StressMonitorProps {
  className?: string;
  showInsights?: boolean;
}

const stressColors: Record<StressIndicator['level'], { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' },
  moderate: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/30' },
  critical: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
};

const insightIcons: Record<BoundaryInsight['type'], typeof AlertTriangle> = {
  'overworking': TrendingUp,
  'weekend-work': Clock,
  'late-night': Clock,
  'high-volume': MessageCircle,
  'no-breaks': Activity,
};

export function StressMonitor({ className, showInsights = true }: StressMonitorProps) {
  const { 
    stressIndicator, 
    boundaryInsights, 
    checkStressLevels,
    dismissInsight,
    activateFocusMode
  } = useAtlasIntelligence();

  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!hasChecked) {
      checkStressLevels();
      setHasChecked(true);
    }
  }, [checkStressLevels, hasChecked]);

  const activeInsights = boundaryInsights.filter(i => !i.dismissed);
  const level = stressIndicator?.level || 'low';
  const colors = stressColors[level];

  const stressPercentage = {
    low: 25,
    moderate: 50,
    high: 75,
    critical: 100,
  }[level];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Stress Level Card */}
      <Card className={cn("border", colors.border)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg", colors.bg)}>
                <Activity size={14} className={colors.text} />
              </div>
              <span className="text-xs font-medium">Digital Wellness</span>
            </div>
            <Badge variant="outline" className={cn("text-[9px]", colors.text, colors.border)}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Badge>
          </div>

          <Progress 
            value={stressPercentage} 
            className={cn("h-2 mb-2", 
              level === 'low' && "[&>div]:bg-emerald-500",
              level === 'moderate' && "[&>div]:bg-amber-500",
              level === 'high' && "[&>div]:bg-orange-500",
              level === 'critical' && "[&>div]:bg-destructive"
            )} 
          />

          {stressIndicator && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 rounded-lg bg-muted/30 text-center">
                <div className="flex items-center justify-center gap-1">
                  <MessageCircle size={10} className="text-muted-foreground" />
                  <span className="text-sm font-bold">{stressIndicator.messageVolume}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">Messages today</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock size={10} className="text-muted-foreground" />
                  <span className="text-sm font-bold">{stressIndicator.checkFrequency}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">Times checked</p>
              </div>
            </div>
          )}

          <div className={cn("p-2 rounded-lg", colors.bg)}>
            <div className="flex items-start gap-2">
              <Sparkles size={12} className={cn("mt-0.5", colors.text)} />
              <p className="text-[10px]">
                {stressIndicator?.suggestedAction || 'Checking your wellbeing...'}
              </p>
            </div>
          </div>

          {(level === 'high' || level === 'critical') && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-3 text-xs"
              onClick={() => activateFocusMode('family-time', 60)}
            >
              <Shield size={12} className="mr-2" />
              Enable Focus Mode
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Boundary Insights */}
      {showInsights && activeInsights.length > 0 && (
        <Card className="border border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={14} className="text-primary" />
              <span className="text-xs font-medium">Boundary Coaching</span>
              <Badge variant="secondary" className="text-[9px] ml-auto">
                {activeInsights.length} insight{activeInsights.length > 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-2">
              {activeInsights.map(insight => {
                const InsightIcon = insightIcons[insight.type];
                return (
                  <div 
                    key={insight.id}
                    className="p-2 rounded-lg bg-background/50 border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <InsightIcon size={12} className="text-amber-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{insight.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            💡 {insight.suggestion}
                          </p>
                          <p className="text-[9px] text-muted-foreground mt-1">
                            {formatDistanceToNow(insight.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => dismissInsight(insight.id)}
                      >
                        <X size={10} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-start gap-2">
                <Heart size={12} className="text-rose-500 mt-0.5" />
                <p className="text-[10px] text-muted-foreground">
                  Atlas monitors your digital patterns to help maintain healthy work-life boundaries. 
                  Your wellbeing matters.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
