import { useState } from 'react';
import { 
  Brain, 
  Play, 
  Pause, 
  X, 
  Clock, 
  Target,
  Zap,
  Moon,
  Users,
  Coffee,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useFocusModes, FocusMode } from '@/hooks/useFocusModes';
import { cn } from '@/lib/utils';

interface FocusModesPanelProps {
  onRemove?: () => void;
  compact?: boolean;
}

export function FocusModesPanel({ onRemove, compact = false }: FocusModesPanelProps) {
  const {
    modes,
    activeSession,
    activeMode,
    cognitiveState,
    sessionStats,
    remainingTime,
    startSession,
    endSession,
    recordBreak,
    microBreakDue,
  } = useFocusModes();

  const [selectedDuration, setSelectedDuration] = useState(25);

  const getModeIcon = (id: string) => {
    switch (id) {
      case 'deep-work': return <Target size={16} />;
      case 'adhd-friendly': return <Brain size={16} />;
      case 'light-work': return <Coffee size={16} />;
      case 'family-time': return <Users size={16} />;
      case 'wind-down': return <Moon size={16} />;
      default: return <Zap size={16} />;
    }
  };

  if (compact) {
    return (
      <Card className="bg-card/50 border-border relative group">
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
          >
            <X size={12} />
          </button>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain size={14} className="text-primary" />
            Focus Modes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeSession && activeMode ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs">{activeMode.name}</span>
                <Badge className="bg-green-500/20 text-green-500 text-[10px]">Active</Badge>
              </div>
              <Progress value={remainingTime?.percentage || 0} className="h-1.5" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{remainingTime?.minutes}m left</span>
                <Button size="sm" variant="ghost" className="h-6" onClick={() => endSession()}>
                  <Pause size={10} className="mr-1" />
                  End
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">
                Focus Score: {cognitiveState.focusScore}%
              </div>
              <Progress value={cognitiveState.focusScore} className="h-1.5" />
              <Button size="sm" className="w-full mt-2" onClick={() => startSession('adhd-friendly')}>
                <Play size={12} className="mr-1" />
                Start Focus
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background relative group">
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
        >
          <X size={14} />
        </button>
      )}

      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Focus Modes</h2>
          </div>
          {activeSession && (
            <Badge className="bg-green-500/20 text-green-500">
              Session Active
            </Badge>
          )}
        </div>
      </div>

      {/* Micro-break reminder */}
      {microBreakDue && (
        <div className="mx-4 mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coffee size={16} className="text-primary" />
              <span className="text-sm font-medium">Micro-break time!</span>
            </div>
            <Button size="sm" variant="outline" onClick={recordBreak}>
              Done
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Stand up, stretch, and take a deep breath.
          </p>
        </div>
      )}

      {/* Active session display */}
      {activeSession && activeMode && (
        <div className="mx-4 mt-4 p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br", activeMode.color)}>
                {getModeIcon(activeMode.id)}
              </div>
              <div>
                <h3 className="text-sm font-medium">{activeMode.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {remainingTime?.minutes} minutes remaining
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => endSession()}>
              <Pause size={12} className="mr-1" />
              End
            </Button>
          </div>
          <Progress value={remainingTime?.percentage || 0} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tasks: {activeSession.tasksCompleted}</span>
            <span>Breaks: {activeSession.breaksTaken}</span>
            <span>Blocked: {activeSession.distractionsBlocked}</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="modes" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="modes" className="text-xs">Modes</TabsTrigger>
          <TabsTrigger value="cognitive" className="text-xs">Cognitive</TabsTrigger>
          <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="modes" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {modes.map((mode) => (
                <ModeCard
                  key={mode.id}
                  mode={mode}
                  icon={getModeIcon(mode.id)}
                  isActive={activeMode?.id === mode.id}
                  onStart={() => startSession(mode.id, selectedDuration)}
                  disabled={!!activeSession}
                />
              ))}
            </div>

            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <label className="text-xs font-medium">Session Duration</label>
              <div className="flex items-center gap-3 mt-2">
                <Slider
                  value={[selectedDuration]}
                  onValueChange={([v]) => setSelectedDuration(v)}
                  min={15}
                  max={120}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-12">{selectedDuration}m</span>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="cognitive" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3">Cognitive State</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Overwhelm Level</span>
                        <span className={cognitiveState.overwhelmLevel > 70 ? "text-destructive" : ""}>
                          {cognitiveState.overwhelmLevel}%
                        </span>
                      </div>
                      <Progress 
                        value={cognitiveState.overwhelmLevel} 
                        className={cn("h-2", cognitiveState.overwhelmLevel > 70 && "[&>div]:bg-destructive")}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Focus Score</span>
                        <span className="text-primary">{cognitiveState.focusScore}%</span>
                      </div>
                      <Progress value={cognitiveState.focusScore} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Energy Level</span>
                        <span>{cognitiveState.energyLevel}%</span>
                      </div>
                      <Progress value={cognitiveState.energyLevel} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Task Load</span>
                        <span>{cognitiveState.taskLoadScore}%</span>
                      </div>
                      <Progress value={cognitiveState.taskLoadScore} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    {cognitiveState.overwhelmLevel > 70 ? (
                      <AlertTriangle size={16} className="text-destructive mt-0.5" />
                    ) : (
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-sm font-medium">Atlas Recommendation</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cognitiveState.recommendedAction}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stats" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {sessionStats.totalSessions}
                  </div>
                  <div className="text-xs text-muted-foreground">Sessions (7d)</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(sessionStats.totalMinutes / 60)}h
                  </div>
                  <div className="text-xs text-muted-foreground">Focus Time</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {sessionStats.tasksCompleted}
                  </div>
                  <div className="text-xs text-muted-foreground">Tasks Done</div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {sessionStats.distractionsBlocked}
                  </div>
                  <div className="text-xs text-muted-foreground">Blocked</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/50 mt-4">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-2">Average Score</h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Progress value={sessionStats.averageScore} className="h-3" />
                  </div>
                  <span className="text-lg font-bold">{sessionStats.averageScore}%</span>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModeCard({
  mode,
  icon,
  isActive,
  onStart,
  disabled,
}: {
  mode: FocusMode;
  icon: React.ReactNode;
  isActive: boolean;
  onStart: () => void;
  disabled: boolean;
}) {
  return (
    <Card className={cn(
      "bg-card/50 border-border transition-colors",
      isActive && "border-primary bg-primary/5"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br text-white",
              mode.color
            )}>
              {icon}
            </div>
            <div>
              <h4 className="text-sm font-medium">{mode.name}</h4>
              <p className="text-xs text-muted-foreground">{mode.description}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={onStart}
            disabled={disabled}
            variant={isActive ? "secondary" : "default"}
          >
            {isActive ? 'Active' : 'Start'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {mode.settings.blockAllNotifications && (
            <Badge variant="outline" className="text-[10px]">
              <BellOff size={10} className="mr-1" />
              Muted
            </Badge>
          )}
          {mode.settings.singleTaskMode && (
            <Badge variant="outline" className="text-[10px]">
              <Target size={10} className="mr-1" />
              Single Task
            </Badge>
          )}
          {mode.settings.enableMicroBreaks && (
            <Badge variant="outline" className="text-[10px]">
              <Coffee size={10} className="mr-1" />
              Micro-breaks
            </Badge>
          )}
          {mode.settings.enableAmbientSounds && (
            <Badge variant="outline" className="text-[10px]">
              <Volume2 size={10} className="mr-1" />
              {mode.settings.ambientSoundType}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
