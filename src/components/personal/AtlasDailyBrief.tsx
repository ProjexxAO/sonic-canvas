// Atlas Daily Brief - AI-generated morning summary
import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Sun, 
  AlertTriangle, 
  Briefcase, 
  Heart,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  MessageCircle,
  PauseCircle,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAtlasIntelligence, type DailyBrief, type UnifiedMessage } from '@/hooks/useAtlasIntelligence';
import { format } from 'date-fns';

interface AtlasDailyBriefProps {
  className?: string;
  compact?: boolean;
}

function MessagePreview({ message }: { message: UnifiedMessage }) {
  const platformColors: Record<string, string> = {
    email: 'bg-blue-500',
    sms: 'bg-green-500',
    whatsapp: 'bg-emerald-500',
    slack: 'bg-purple-500',
    teams: 'bg-violet-500',
    messenger: 'bg-blue-600',
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn(
        "w-2 h-2 rounded-full flex-shrink-0",
        platformColors[message.platform] || 'bg-gray-500'
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium truncate">{message.sender}</span>
          <Badge 
            variant={message.urgencyScore >= 80 ? 'destructive' : 'secondary'}
            className="text-[8px] px-1 py-0 h-4"
          >
            {message.urgencyScore}%
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{message.preview}</p>
      </div>
    </div>
  );
}

export function AtlasDailyBrief({ className, compact = false }: AtlasDailyBriefProps) {
  const { 
    dailyBrief, 
    generateDailyBrief, 
    activeFocusMode,
    heldMessages,
    getInboxSummary,
    isLoading 
  } = useAtlasIntelligence();
  
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const summary = getInboxSummary();

  useEffect(() => {
    generateDailyBrief();
  }, [generateDailyBrief]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await generateDailyBrief();
    setIsRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (compact) {
    return (
      <Card className={cn("border bg-gradient-to-br from-card to-primary/5", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles size={12} className="text-primary" />
              </div>
              <span className="text-xs font-medium">{getGreeting()}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={10} className={isRefreshing ? "animate-spin" : ""} />
            </Button>
          </div>
          
          <p className="text-[10px] text-muted-foreground mb-2">
            {summary.total} unread • {summary.byCategory.urgent} urgent
          </p>
          
          {activeFocusMode && (
            <Badge variant="secondary" className="text-[9px]">
              {activeFocusMode.icon} {activeFocusMode.name} • {heldMessages.length} held
            </Badge>
          )}
          
          {dailyBrief?.wellbeingNote && (
            <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                💡 {dailyBrief.wellbeingNote}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              <Sparkles size={14} className="text-primary" />
            </div>
            Atlas Daily Brief
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={10} className={isRefreshing ? "animate-spin" : ""} />
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
        
        <div className="flex items-center gap-2 mt-2">
          <Sun size={14} className="text-amber-500" />
          <span className="text-xs">{getGreeting()}</span>
          <span className="text-[10px] text-muted-foreground">
            • {format(new Date(), 'EEEE, MMM d')}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-lg font-bold text-foreground">{summary.total}</div>
            <div className="text-[9px] text-muted-foreground">Unread</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-destructive/10">
            <div className="text-lg font-bold text-destructive">{summary.byCategory.urgent}</div>
            <div className="text-[9px] text-muted-foreground">Urgent</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-purple-500/10">
            <div className="text-lg font-bold text-purple-500">{summary.byHub.csuite + summary.byHub.group}</div>
            <div className="text-[9px] text-muted-foreground">Work</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <div className="text-lg font-bold text-blue-500">{summary.byHub.personal}</div>
            <div className="text-[9px] text-muted-foreground">Personal</div>
          </div>
        </div>

        {/* Focus Mode Status */}
        {activeFocusMode && (
          <div className="mb-3 p-2 rounded-lg bg-secondary/20 border border-secondary/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeFocusMode.icon}</span>
              <div>
                <p className="text-xs font-medium">{activeFocusMode.name} Active</p>
                <p className="text-[10px] text-muted-foreground">
                  {heldMessages.length} messages held
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[9px]">
              <PauseCircle size={10} className="mr-1" />
              Focus
            </Badge>
          </div>
        )}

        {isExpanded && (
          <>
            {/* Wellbeing Note */}
            {dailyBrief?.wellbeingNote && (
              <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <Heart size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Wellbeing Check
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {dailyBrief.wellbeingNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Focus */}
            {dailyBrief?.suggestedFocus && (
              <div className="mb-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-primary">💡 Suggested:</span> {dailyBrief.suggestedFocus}
                </p>
              </div>
            )}

            {/* Urgent Items */}
            {summary.topUrgent.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={12} className="text-destructive" />
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Urgent Attention
                  </span>
                </div>
                <div className="space-y-1">
                  {summary.topUrgent.map(msg => (
                    <MessagePreview key={msg.id} message={msg} />
                  ))}
                </div>
              </div>
            )}

            {/* Platform Breakdown */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  By Platform
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(summary.byPlatform).map(([platform, count]) => (
                  count > 0 && (
                    <Badge key={platform} variant="outline" className="text-[9px]">
                      {platform}: {count}
                    </Badge>
                  )
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
