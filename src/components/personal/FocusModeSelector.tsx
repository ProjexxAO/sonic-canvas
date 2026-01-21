// Focus Mode Selector - Mental health boundaries
import { useState } from 'react';
import { 
  Shield, 
  Clock, 
  Play, 
  Square,
  ChevronDown,
  Bell,
  BellOff,
  Sparkles,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAtlasIntelligence, type FocusMode } from '@/hooks/useAtlasIntelligence';

interface FocusModeSelectorProps {
  className?: string;
  compact?: boolean;
}

export function FocusModeSelector({ className, compact = false }: FocusModeSelectorProps) {
  const { 
    focusModes, 
    activeFocusMode, 
    activateFocusMode, 
    deactivateFocusMode,
    heldMessages
  } = useAtlasIntelligence();
  
  const [customDuration, setCustomDuration] = useState(60);
  const [showDurationDialog, setShowDurationDialog] = useState(false);
  const [selectedMode, setSelectedMode] = useState<FocusMode | null>(null);

  const handleActivate = (mode: FocusMode, duration?: number) => {
    activateFocusMode(mode.id, duration);
    setShowDurationDialog(false);
    setSelectedMode(null);
  };

  const handleModeClick = (mode: FocusMode) => {
    setSelectedMode(mode);
    setShowDurationDialog(true);
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={activeFocusMode ? "secondary" : "ghost"} 
            size="sm" 
            className={cn("h-7 gap-1", className)}
          >
            {activeFocusMode ? (
              <>
                <span>{activeFocusMode.icon}</span>
                <span className="text-[10px]">{activeFocusMode.name}</span>
              </>
            ) : (
              <>
                <Shield size={12} />
                <span className="text-[10px]">Focus</span>
              </>
            )}
            <ChevronDown size={10} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {activeFocusMode ? (
            <>
              <DropdownMenuLabel className="text-xs">
                {activeFocusMode.icon} {activeFocusMode.name} Active
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onClick={deactivateFocusMode}>
                <Square size={12} className="mr-2" />
                End Focus Mode
              </DropdownMenuItem>
              {heldMessages.length > 0 && (
                <div className="px-2 py-1 text-[10px] text-muted-foreground">
                  {heldMessages.length} messages held
                </div>
              )}
            </>
          ) : (
            <>
              <DropdownMenuLabel className="text-xs">Start Focus Mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {focusModes.map(mode => (
                <DropdownMenuItem 
                  key={mode.id} 
                  className="text-xs"
                  onClick={() => handleModeClick(mode)}
                >
                  <span className="mr-2">{mode.icon}</span>
                  {mode.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Card className={cn("border", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-primary" />
              <span className="text-xs font-medium">Focus Mode</span>
            </div>
            {activeFocusMode && (
              <Badge variant="secondary" className="text-[9px]">
                Active
              </Badge>
            )}
          </div>

          {activeFocusMode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-secondary/30">
                <span className="text-2xl">{activeFocusMode.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activeFocusMode.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Blocking {activeFocusMode.blockedHubs.join(', ')} notifications
                  </p>
                </div>
              </div>
              
              {heldMessages.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <BellOff size={12} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {heldMessages.length} messages held
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px]">
                    Will deliver when ended
                  </Badge>
                </div>
              )}

              {activeFocusMode.scheduledEnd && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock size={10} />
                  Ends at {activeFocusMode.scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs"
                onClick={deactivateFocusMode}
              >
                <Square size={12} className="mr-2" />
                End Focus Mode
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {focusModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => handleModeClick(mode)}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xl">{mode.icon}</span>
                  <span className="text-[10px] font-medium">{mode.name}</span>
                  <span className="text-[8px] text-muted-foreground">
                    Blocks: {mode.blockedHubs.join(', ')}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2">
              <Sparkles size={12} className="text-primary mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                Focus modes help you protect your personal time. Atlas will hold non-urgent messages until you're ready.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duration Dialog */}
      <Dialog open={showDurationDialog} onOpenChange={setShowDurationDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{selectedMode?.icon}</span>
              {selectedMode?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              How long do you want to stay focused?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 120].map(duration => (
                <Button
                  key={duration}
                  variant="outline"
                  size="sm"
                  onClick={() => selectedMode && handleActivate(selectedMode, duration)}
                >
                  {duration < 60 ? `${duration}m` : `${duration / 60}h`}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(parseInt(e.target.value) || 60)}
                className="w-20 h-8 text-sm"
                min={5}
                max={480}
              />
              <span className="text-sm text-muted-foreground">minutes</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => selectedMode && handleActivate(selectedMode, customDuration)}
              >
                Set
              </Button>
            </div>

            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => selectedMode && handleActivate(selectedMode)}
            >
              Until I turn it off
            </Button>
          </div>

          {selectedMode?.autoReply && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Bell size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-medium">Auto-reply</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                "{selectedMode.autoReply}"
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
