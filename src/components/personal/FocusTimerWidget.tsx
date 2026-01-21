// Focus Timer Widget - Pomodoro-style productivity timer
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee,
  Target,
  CheckCircle2,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type SessionType = 'focus' | 'short-break' | 'long-break';

interface FocusSession {
  id: string;
  type: SessionType;
  duration: number; // seconds
  completedAt: Date;
}

interface TimerPreset {
  focus: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
}

const DEFAULT_PRESET: TimerPreset = {
  focus: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
  sessionsBeforeLongBreak: 4,
};

const SESSION_COLORS: Record<SessionType, string> = {
  focus: 'from-primary/20 to-blue-500/20',
  'short-break': 'from-emerald-500/20 to-green-500/20',
  'long-break': 'from-purple-500/20 to-violet-500/20',
};

interface FocusTimerWidgetProps {
  className?: string;
  compact?: boolean;
}

export function FocusTimerWidget({ className, compact = false }: FocusTimerWidgetProps) {
  const { user } = useAuth();
  
  const [preset] = useState<TimerPreset>(DEFAULT_PRESET);
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_PRESET.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<FocusSession[]>([]);
  const [todaySessions, setTodaySessions] = useState(0);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load today's sessions from localStorage
  useEffect(() => {
    if (user?.id) {
      const key = `focus-sessions-${user.id}-${new Date().toDateString()}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const sessions = JSON.parse(stored);
        setCompletedSessions(sessions.map((s: any) => ({ ...s, completedAt: new Date(s.completedAt) })));
        setTodaySessions(sessions.filter((s: any) => s.type === 'focus').length);
      }
    }
  }, [user?.id]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeRemaining]);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    
    // Play notification sound (if we had one)
    toast.success(
      sessionType === 'focus' 
        ? '🎉 Focus session complete! Take a break.' 
        : '☕ Break over! Ready for another focus session?'
    );

    // Record completed session
    const session: FocusSession = {
      id: `session-${Date.now()}`,
      type: sessionType,
      duration: sessionType === 'focus' ? preset.focus : 
               sessionType === 'short-break' ? preset.shortBreak : preset.longBreak,
      completedAt: new Date(),
    };

    const updatedSessions = [...completedSessions, session];
    setCompletedSessions(updatedSessions);

    // Save to localStorage
    if (user?.id) {
      const key = `focus-sessions-${user.id}-${new Date().toDateString()}`;
      localStorage.setItem(key, JSON.stringify(updatedSessions));
    }

    // Update session count
    if (sessionType === 'focus') {
      const newCount = todaySessions + 1;
      setTodaySessions(newCount);

      // Determine next break type
      if (newCount % preset.sessionsBeforeLongBreak === 0) {
        setSessionType('long-break');
        setTimeRemaining(preset.longBreak);
      } else {
        setSessionType('short-break');
        setTimeRemaining(preset.shortBreak);
      }
    } else {
      // After break, back to focus
      setSessionType('focus');
      setTimeRemaining(preset.focus);
    }
  }, [sessionType, completedSessions, todaySessions, preset, user?.id]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    const duration = sessionType === 'focus' ? preset.focus :
                     sessionType === 'short-break' ? preset.shortBreak : preset.longBreak;
    setTimeRemaining(duration);
  };

  const switchSession = (type: SessionType) => {
    setIsRunning(false);
    setSessionType(type);
    const duration = type === 'focus' ? preset.focus :
                     type === 'short-break' ? preset.shortBreak : preset.longBreak;
    setTimeRemaining(duration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = sessionType === 'focus' ? preset.focus :
                        sessionType === 'short-break' ? preset.shortBreak : preset.longBreak;
  const progress = ((totalDuration - timeRemaining) / totalDuration) * 100;

  // Today's focus time in minutes
  const todayFocusMinutes = Math.round(
    completedSessions
      .filter(s => s.type === 'focus')
      .reduce((sum, s) => sum + s.duration, 0) / 60
  );

  if (compact) {
    return (
      <Card className={cn("border bg-gradient-to-br from-card to-blue-500/5", className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-1.5 rounded-lg",
                isRunning ? "bg-primary/20 animate-pulse" : "bg-muted"
              )}>
                <Timer size={12} className={isRunning ? "text-primary" : "text-muted-foreground"} />
              </div>
              <div>
                <span className="text-lg font-mono font-bold">{formatTime(timeRemaining)}</span>
                <p className="text-[9px] text-muted-foreground capitalize">{sessionType.replace('-', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={isRunning ? "secondary" : "default"}
                size="icon"
                className="h-8 w-8"
                onClick={toggleTimer}
              >
                {isRunning ? <Pause size={14} /> : <Play size={14} />}
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-1 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border bg-gradient-to-br from-card via-card",
      SESSION_COLORS[sessionType],
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              isRunning ? "bg-primary/20 animate-pulse" : "bg-muted"
            )}>
              <Timer size={14} className={isRunning ? "text-primary" : "text-muted-foreground"} />
            </div>
            Focus Timer
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-[9px]">
              {todaySessions} sessions today
            </Badge>
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
        {/* Session Type Tabs */}
        <div className="flex gap-1 mb-3">
          <Button
            variant={sessionType === 'focus' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 h-7 text-[10px]"
            onClick={() => switchSession('focus')}
          >
            <Target size={10} className="mr-1" />
            Focus
          </Button>
          <Button
            variant={sessionType === 'short-break' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 h-7 text-[10px]"
            onClick={() => switchSession('short-break')}
          >
            <Coffee size={10} className="mr-1" />
            Short
          </Button>
          <Button
            variant={sessionType === 'long-break' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 h-7 text-[10px]"
            onClick={() => switchSession('long-break')}
          >
            <Coffee size={10} className="mr-1" />
            Long
          </Button>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-3">
          <div className="text-4xl font-mono font-bold mb-1">
            {formatTime(timeRemaining)}
          </div>
          <p className="text-[10px] text-muted-foreground capitalize">
            {sessionType.replace('-', ' ')} {isRunning ? '• Running' : '• Paused'}
          </p>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2 mb-3" />

        {/* Controls */}
        <div className="flex justify-center gap-2 mb-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={resetTimer}
          >
            <RotateCcw size={16} />
          </Button>
          <Button
            variant={isRunning ? "secondary" : "default"}
            size="lg"
            className="h-10 px-8"
            onClick={toggleTimer}
          >
            {isRunning ? (
              <>
                <Pause size={16} className="mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                Start
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <>
            {/* Today's Stats */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-primary">{todaySessions}</div>
                <div className="text-[9px] text-muted-foreground">Sessions</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-emerald-500">{todayFocusMinutes}</div>
                <div className="text-[9px] text-muted-foreground">Focus mins</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30">
                <div className="text-lg font-bold text-purple-500">
                  {preset.sessionsBeforeLongBreak - (todaySessions % preset.sessionsBeforeLongBreak)}
                </div>
                <div className="text-[9px] text-muted-foreground">Until long break</div>
              </div>
            </div>

            {/* Recent Sessions */}
            {completedSessions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] font-mono uppercase text-muted-foreground mb-2">
                  Recent Sessions
                </p>
                <div className="flex flex-wrap gap-1">
                  {completedSessions.slice(-8).map((session) => (
                    <Badge 
                      key={session.id}
                      variant={session.type === 'focus' ? 'default' : 'secondary'}
                      className="text-[8px]"
                    >
                      {session.type === 'focus' ? <Target size={8} className="mr-0.5" /> : <Coffee size={8} className="mr-0.5" />}
                      {Math.round(session.duration / 60)}m
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}