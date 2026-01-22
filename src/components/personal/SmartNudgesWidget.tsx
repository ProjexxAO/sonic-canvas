// Smart Nudges Widget - Proactive action suggestions
import React, { useState } from 'react';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  User, 
  Brain, 
  Coffee, 
  Flame, 
  Sun, 
  AlertTriangle, 
  Target, 
  Trophy,
  CalendarX,
  FileCheck,
  Reply,
  Droplets,
  Footprints,
  Eye,
  X,
  ChevronRight,
  Sparkles,
  Bell,
  BellOff,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSmartNudges, SmartNudge, NudgeType, NudgePriority } from '@/hooks/useSmartNudges';
import { toast } from 'sonner';

interface SmartNudgesWidgetProps {
  className?: string;
  compact?: boolean;
  maxItems?: number;
}

// Icon mapping
const NUDGE_ICONS: Record<string, typeof Phone> = {
  Phone,
  MessageCircle,
  Mail,
  User,
  Brain,
  Coffee,
  Flame,
  Sun,
  AlertTriangle,
  Target,
  Trophy,
  CalendarX,
  FileCheck,
  Reply,
  Droplets,
  Footprints,
  Eye,
  Bell
};

// Priority colors
const PRIORITY_STYLES: Record<NudgePriority, { bg: string; border: string; text: string; badge: string }> = {
  urgent: { 
    bg: 'bg-red-500/10', 
    border: 'border-red-500/30', 
    text: 'text-red-400',
    badge: 'bg-red-500 text-white'
  },
  high: { 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/30', 
    text: 'text-amber-400',
    badge: 'bg-amber-500 text-black'
  },
  medium: { 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30', 
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400'
  },
  low: { 
    bg: 'bg-muted/30', 
    border: 'border-border', 
    text: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground'
  }
};

// Type icons and labels
const TYPE_CONFIG: Record<NudgeType, { label: string; color: string }> = {
  contact: { label: 'Connection', color: 'text-pink-400' },
  focus_time: { label: 'Focus', color: 'text-green-400' },
  habit: { label: 'Habit', color: 'text-orange-400' },
  task: { label: 'Task', color: 'text-red-400' },
  health: { label: 'Wellness', color: 'text-cyan-400' },
  calendar: { label: 'Calendar', color: 'text-blue-400' },
  goal: { label: 'Goal', color: 'text-purple-400' },
  break: { label: 'Break', color: 'text-amber-400' },
  preparation: { label: 'Prep', color: 'text-indigo-400' },
  follow_up: { label: 'Follow-up', color: 'text-teal-400' }
};

function NudgeCard({ 
  nudge, 
  onDismiss, 
  onAction,
  compact = false 
}: { 
  nudge: SmartNudge; 
  onDismiss: () => void;
  onAction?: () => void;
  compact?: boolean;
}) {
  const IconComponent = NUDGE_ICONS[nudge.icon] || Bell;
  const priorityStyle = PRIORITY_STYLES[nudge.priority];
  const typeConfig = TYPE_CONFIG[nudge.type];
  
  if (compact) {
    return (
      <div className={cn(
        "p-2 rounded-lg border transition-all group",
        priorityStyle.bg,
        priorityStyle.border,
        "hover:shadow-sm"
      )}>
        <div className="flex items-start gap-2">
          <div className={cn("mt-0.5", priorityStyle.text)}>
            <IconComponent size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{nudge.title}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{nudge.description}</p>
          </div>
          {nudge.dismissible && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onDismiss}
            >
              <X size={10} />
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all group",
      priorityStyle.bg,
      priorityStyle.border,
      "hover:shadow-md"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          priorityStyle.bg,
          priorityStyle.text
        )}>
          <IconComponent size={16} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium">{nudge.title}</span>
            {nudge.priority !== 'low' && (
              <Badge className={cn("text-[8px] px-1 py-0", priorityStyle.badge)}>
                {nudge.priority}
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">{nudge.description}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={cn("text-[9px]", typeConfig.color)}>
              {typeConfig.label}
            </Badge>
            
            {nudge.actionLabel && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] text-primary"
                onClick={onAction}
              >
                {nudge.actionLabel}
                <ChevronRight size={10} className="ml-0.5" />
              </Button>
            )}
          </div>
        </div>
        
        {nudge.dismissible && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={onDismiss}
                >
                  <X size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                Dismiss for today
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

export function SmartNudgesWidget({ className, compact = false, maxItems = 5 }: SmartNudgesWidgetProps) {
  const { 
    topNudges, 
    nudges,
    nudgeSummary, 
    isLoading, 
    dismissNudge, 
    generateAllNudges,
    recordContactInteraction
  } = useSmartNudges();
  
  const [showAll, setShowAll] = useState(false);
  const [mutedTypes, setMutedTypes] = useState<Set<NudgeType>>(new Set());
  
  const displayNudges = showAll 
    ? nudges.filter(n => !mutedTypes.has(n.type))
    : topNudges.filter(n => !mutedTypes.has(n.type)).slice(0, maxItems);
  
  const handleAction = (nudge: SmartNudge) => {
    if (nudge.type === 'contact' && nudge.metadata?.contactId) {
      recordContactInteraction(nudge.metadata.contactId as string);
      toast.success(`Marked ${nudge.title.replace('Time to ', '').replace('call ', '').replace('text ', '')} as contacted`);
    } else {
      toast.info(`Action: ${nudge.actionLabel}`);
    }
  };
  
  const toggleMuteType = (type: NudgeType) => {
    setMutedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  if (compact) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Smart Nudges
            </span>
            {nudgeSummary.urgent + nudgeSummary.high > 0 && (
              <Badge variant="destructive" className="text-[9px] px-1.5">
                {nudgeSummary.urgent + nudgeSummary.high} important
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {displayNudges.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              All caught up! No suggestions right now.
            </p>
          ) : (
            displayNudges.slice(0, 3).map(nudge => (
              <NudgeCard
                key={nudge.id}
                nudge={nudge}
                onDismiss={() => dismissNudge(nudge.id)}
                onAction={() => handleAction(nudge)}
                compact
              />
            ))
          )}
          
          {nudges.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs h-7"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show less' : `+${nudges.length - 3} more nudges`}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col", className)}>
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Smart Nudges
            {nudgeSummary.total > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {nudgeSummary.total}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={generateAllNudges}
                  >
                    <Sparkles size={12} className="text-primary" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Refresh suggestions
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-xs" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show top nudges' : 'Show all nudges'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1 text-[10px] text-muted-foreground">Mute categories</div>
                {(Object.keys(TYPE_CONFIG) as NudgeType[]).map(type => (
                  <DropdownMenuItem 
                    key={type}
                    className="text-xs flex items-center justify-between"
                    onClick={() => toggleMuteType(type)}
                  >
                    <span className={TYPE_CONFIG[type].color}>{TYPE_CONFIG[type].label}</span>
                    {mutedTypes.has(type) ? (
                      <BellOff size={10} className="text-muted-foreground" />
                    ) : (
                      <Bell size={10} className="text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Quick Stats */}
        {nudgeSummary.total > 0 && (
          <div className="flex items-center gap-3 mt-2 text-[10px]">
            {nudgeSummary.contacts > 0 && (
              <span className="flex items-center gap-1 text-pink-400">
                <User size={10} />
                {nudgeSummary.contacts} contacts
              </span>
            )}
            {nudgeSummary.tasks > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Target size={10} />
                {nudgeSummary.tasks} tasks
              </span>
            )}
            {nudgeSummary.calendar > 0 && (
              <span className="flex items-center gap-1 text-blue-400">
                <FileCheck size={10} />
                {nudgeSummary.calendar} calendar
              </span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-2">
          {displayNudges.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles size={24} className="mx-auto mb-2 text-primary/50" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No suggestions right now</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayNudges.map(nudge => (
                <NudgeCard
                  key={nudge.id}
                  nudge={nudge}
                  onDismiss={() => dismissNudge(nudge.id)}
                  onAction={() => handleAction(nudge)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default SmartNudgesWidget;
