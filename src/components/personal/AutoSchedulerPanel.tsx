import { useState } from 'react';
import { 
  Calendar, 
  Zap, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Shield,
  Battery,
  RefreshCw,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAutoScheduler, ScheduleBlock, RescheduleAction } from '@/hooks/useAutoScheduler';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AutoSchedulerPanelProps {
  onRemove?: () => void;
  compact?: boolean;
}

export function AutoSchedulerPanel({ onRemove, compact = false }: AutoSchedulerPanelProps) {
  const {
    scheduleBlocks,
    pendingActions,
    conflicts,
    isAutoScheduling,
    defensiveTimeEnabled,
    scheduleEfficiency,
    autoScheduleTask,
    protectFocusTime,
    autoResolveConflicts,
    applyReschedule,
    rejectReschedule,
    setDefensiveTimeEnabled,
  } = useAutoScheduler();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(60);
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const handleAutoSchedule = () => {
    if (!newTaskTitle.trim()) return;
    autoScheduleTask(newTaskTitle, newTaskDuration, newTaskPriority);
    setNewTaskTitle('');
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
            <Zap size={14} className="text-primary" />
            Auto-Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Efficiency</span>
            <span className="font-medium">{scheduleEfficiency.efficiency}%</span>
          </div>
          <Progress value={scheduleEfficiency.efficiency} className="h-1.5" />
          {conflicts.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle size={10} />
              <span>{conflicts.length} conflicts</span>
            </div>
          )}
          <Button size="sm" className="w-full mt-2" onClick={() => protectFocusTime()}>
            <Shield size={12} className="mr-1" />
            Protect Focus
          </Button>
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
            <Zap size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Auto-Scheduler</h2>
          </div>
          {conflicts.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {conflicts.length} conflicts
            </Badge>
          )}
        </div>
      </div>

      {/* Efficiency Overview */}
      <div className="mx-4 mt-4 p-4 bg-card rounded-lg border border-border">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-primary">{scheduleEfficiency.efficiency}%</div>
            <div className="text-[10px] text-muted-foreground">Efficiency</div>
          </div>
          <div>
            <div className="text-lg font-bold">{Math.round(scheduleEfficiency.totalScheduled / 60)}h</div>
            <div className="text-[10px] text-muted-foreground">Scheduled</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-500">{Math.round(scheduleEfficiency.focusTime / 60)}h</div>
            <div className="text-[10px] text-muted-foreground">Focus</div>
          </div>
          <div>
            <div className="text-lg font-bold text-destructive">{scheduleEfficiency.conflicts}</div>
            <div className="text-[10px] text-muted-foreground">Conflicts</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="schedule" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="schedule" className="text-xs">Schedule</TabsTrigger>
          <TabsTrigger value="conflicts" className="text-xs">
            Conflicts {conflicts.length > 0 && `(${conflicts.length})`}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            {/* Quick Schedule */}
            <Card className="bg-card/50 mb-4">
              <CardContent className="p-3 space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles size={14} className="text-primary" />
                  Quick Auto-Schedule
                </h3>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task name..."
                  className="h-8"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">Duration</label>
                    <Select value={String(newTaskDuration)} onValueChange={(v) => setNewTaskDuration(Number(v))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">Priority</label>
                    <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="w-full" onClick={handleAutoSchedule}>
                  <Zap size={12} className="mr-1" />
                  Find Optimal Time
                </Button>
              </CardContent>
            </Card>

            {/* Scheduled Blocks */}
            <h3 className="text-sm font-medium mb-2">Today's Schedule</h3>
            {scheduleBlocks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No scheduled blocks yet
              </div>
            ) : (
              <div className="space-y-2">
                {scheduleBlocks.slice(0, 10).map((block) => (
                  <ScheduleBlockCard key={block.id} block={block} />
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => protectFocusTime(2, 'morning')}>
                <Shield size={12} className="mr-1" />
                Protect AM Focus
              </Button>
              <Button variant="outline" size="sm" onClick={() => protectFocusTime(2, 'afternoon')}>
                <Shield size={12} className="mr-1" />
                Protect PM Focus
              </Button>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="conflicts" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            {conflicts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={40} className="mx-auto text-green-500 mb-3" />
                <p className="text-sm text-muted-foreground">No scheduling conflicts!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">{conflicts.length} Conflicts Found</h3>
                  <Button size="sm" onClick={autoResolveConflicts} disabled={isAutoScheduling}>
                    <RefreshCw size={12} className={cn("mr-1", isAutoScheduling && "animate-spin")} />
                    Auto-Resolve All
                  </Button>
                </div>

                <div className="space-y-3">
                  {conflicts.map((conflict) => (
                    <Card key={conflict.conflictId} className="bg-card/50 border-destructive/30">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle size={14} className="text-destructive mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Scheduling Conflict</p>
                            <p className="text-xs text-muted-foreground">{conflict.suggestion}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          {conflict.blocks.map((block, i) => (
                            <span key={block.id}>
                              {block.title}
                              {i < conflict.blocks.length - 1 && <ArrowRight size={10} className="inline mx-1" />}
                            </span>
                          ))}
                        </div>

                        {conflict.actions.map((action) => (
                          <div key={action.id} className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => applyReschedule(action.id)}
                            >
                              <CheckCircle2 size={12} className="mr-1" />
                              Apply
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectReschedule(action.id)}
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium">Defensive Scheduling</h4>
                      <p className="text-xs text-muted-foreground">
                        Protect focus time from new meetings
                      </p>
                    </div>
                    <Switch
                      checked={defensiveTimeEnabled}
                      onCheckedChange={setDefensiveTimeEnabled}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-4 space-y-4">
                  <h4 className="text-sm font-medium">Energy Mapping</h4>
                  <p className="text-xs text-muted-foreground">
                    Tasks are scheduled based on your energy patterns
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Battery size={12} className="text-green-500" />
                        Peak Energy
                      </span>
                      <span>9:00 - 11:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Battery size={12} className="text-yellow-500" />
                        High Energy
                      </span>
                      <span>2:00 - 4:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Battery size={12} className="text-orange-500" />
                        Low Energy
                      </span>
                      <span>12:00 - 1:00 PM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium mb-3">Auto-Schedule Preferences</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Prefer morning for deep work</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Buffer time between meetings</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Respect "No meetings" days</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleBlockCard({ block }: { block: ScheduleBlock }) {
  const typeColors = {
    meeting: 'bg-blue-500/20 text-blue-500',
    task: 'bg-green-500/20 text-green-500',
    focus: 'bg-purple-500/20 text-purple-500',
    break: 'bg-orange-500/20 text-orange-500',
    personal: 'bg-pink-500/20 text-pink-500',
    blocked: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
      <div className="text-xs text-muted-foreground w-16">
        {format(block.start, 'h:mm a')}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{block.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge className={cn("text-[10px]", typeColors[block.type])}>
            {block.type}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {Math.round((block.end.getTime() - block.start.getTime()) / 60000)} min
          </span>
        </div>
      </div>
      {block.source === 'auto' && (
        <Sparkles size={12} className="text-primary" />
      )}
    </div>
  );
}
