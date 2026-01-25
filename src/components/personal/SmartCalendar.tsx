// Smart Calendar Component - Unified cross-hub calendar with predictive scheduling
// Now includes Atlas Life tab for work-life balance management
import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Zap,
  Users,
  MapPin,
  Target,
  TrendingUp,
  Eye,
  EyeOff,
  Brain,
  Layers,
  Heart,
  Plane,
  DollarSign,
  Check,
  Dumbbell,
  Moon
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  isToday,
  addHours 
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useSmartCalendar, UnifiedEvent, FocusBlock, SchedulingSuggestion, EventType } from '@/hooks/useSmartCalendar';
import { useAtlasLifeManager, AutoBlockSuggestion } from '@/hooks/useAtlasLifeManager';
import { useFinancialIntelligence } from '@/hooks/useFinancialIntelligence';
import { toast } from 'sonner';

interface SmartCalendarProps {
  className?: string;
  compact?: boolean;
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  personal: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  group: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  csuite: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  external: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
};

const TYPE_ICONS: Record<EventType, React.ReactNode> = {
  meeting: <Users size={12} />,
  deadline: <Target size={12} />,
  reminder: <Clock size={12} />,
  focus: <Brain size={12} />,
  personal: <CalendarIcon size={12} />,
  travel: <MapPin size={12} />,
  health: <Zap size={12} />
};

export function SmartCalendar({ className, compact = false }: SmartCalendarProps) {
  const {
    events,
    conflicts,
    focusBlocks,
    suggestions,
    todaySummary,
    isLoading,
    selectedDate,
    setSelectedDate,
    createEvent,
    blockFocusTime,
    getEventsForDay
  } = useSmartCalendar();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showTransparent, setShowTransparent] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    duration: '60',
    type: 'meeting' as EventType,
    location: ''
  });
  
  // Calendar days for current month view
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);
  
  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    return getEventsForDay(selectedDate).filter(e => showTransparent || !e.isTransparent);
  }, [selectedDate, getEventsForDay, showTransparent]);
  
  // Handle creating new event
  const handleCreateEvent = async () => {
    const startAt = new Date(`${newEventData.date}T${newEventData.time}`);
    
    // Validate event is not in the past
    if (startAt < new Date()) {
      toast.error('Cannot create events in the past');
      return;
    }
    
    const endAt = addHours(startAt, parseInt(newEventData.duration) / 60);
    
    const result = await createEvent({
      title: newEventData.title,
      description: newEventData.description,
      startAt,
      endAt,
      type: newEventData.type,
      location: newEventData.location,
      source: 'csuite',
      sourceName: 'Personal'
    }, 'csuite');
    
    if (result) {
      toast.success('Event created');
      setShowNewEvent(false);
      setNewEventData({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        duration: '60',
        type: 'meeting',
        location: ''
      });
    } else {
      toast.error('Failed to create event');
    }
  };
  
  // Handle blocking focus time
  const handleBlockFocus = async (block: FocusBlock) => {
    const success = await blockFocusTime(block);
    if (success) {
      toast.success(`Focus time blocked: ${block.label}`);
    } else {
      toast.error('Failed to block focus time');
    }
  };

  if (compact) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon size={14} className="text-primary" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-muted/30">
              <div className="text-lg font-bold text-primary">{todaySummary.eventCount}</div>
              <div className="text-[9px] text-muted-foreground">Events</div>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <div className="text-lg font-bold text-green-400">{todaySummary.focusBlocksAvailable}</div>
              <div className="text-[9px] text-muted-foreground">Focus Blocks</div>
            </div>
            <div className="p-2 rounded bg-muted/30">
              <div className="text-lg font-bold text-amber-400">{todaySummary.conflictCount}</div>
              <div className="text-[9px] text-muted-foreground">Conflicts</div>
            </div>
          </div>
          
          {/* Next Event */}
          {todaySummary.nextEvent && (
            <div className="p-2 rounded border border-primary/30 bg-primary/5">
              <div className="text-[10px] text-muted-foreground mb-1">Next Up</div>
              <div className="text-xs font-medium truncate">{todaySummary.nextEvent.title}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                <Clock size={10} />
                {format(todaySummary.nextEvent.startAt, 'h:mm a')}
                {todaySummary.nextEvent.location && (
                  <>
                    <span className="mx-1">•</span>
                    <MapPin size={10} />
                    {todaySummary.nextEvent.location}
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Top Suggestion */}
          {suggestions[0] && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-400" />
                <span className="text-[10px] font-medium text-amber-400">{suggestions[0].title}</span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">{suggestions[0].description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon size={20} className="text-primary" />
              Smart Calendar
            </h2>
            <Badge variant="outline" className="text-[10px]">
              <Layers size={10} className="mr-1" />
              Cross-Hub Sync
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTransparent(!showTransparent)}
              className="text-xs h-7"
            >
              {showTransparent ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="ml-1.5 hidden sm:inline">Shared Events</span>
            </Button>
            
            <Dialog open={showNewEvent} onOpenChange={setShowNewEvent}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs h-7">
                  <Plus size={14} className="mr-1" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Event title"
                    value={newEventData.title}
                    onChange={e => setNewEventData(p => ({ ...p, title: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={newEventData.date}
                      onChange={e => setNewEventData(p => ({ ...p, date: e.target.value }))}
                    />
                    <Input
                      type="time"
                      value={newEventData.time}
                      onChange={e => setNewEventData(p => ({ ...p, time: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newEventData.duration}
                      onValueChange={v => setNewEventData(p => ({ ...p, duration: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={newEventData.type}
                      onValueChange={v => setNewEventData(p => ({ ...p, type: v as EventType }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="focus">Focus Time</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Location (optional)"
                    value={newEventData.location}
                    onChange={e => setNewEventData(p => ({ ...p, location: e.target.value }))}
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newEventData.description}
                    onChange={e => setNewEventData(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                  />
                  <Button onClick={handleCreateEvent} className="w-full" disabled={!newEventData.title}>
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-5 mb-3">
            <TabsTrigger value="calendar" className="text-xs">
              <CalendarIcon size={12} className="mr-1" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="life" className="text-xs">
              <Heart size={12} className="mr-1" />
              Atlas Life
            </TabsTrigger>
            <TabsTrigger value="focus" className="text-xs">
              <Brain size={12} className="mr-1" />
              Focus
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              <Sparkles size={12} className="mr-1" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="text-xs relative">
              <AlertTriangle size={12} className="mr-1" />
              Conflicts
              {conflicts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center">
                  {conflicts.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Calendar Tab */}
          <TabsContent value="calendar" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="grid lg:grid-cols-[1fr,300px] gap-4 flex-1 min-h-0">
              {/* Month View */}
              <Card className="border-border/50 bg-card/50 flex flex-col min-h-0">
                <CardHeader className="pb-2 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-hidden">
                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-[10px] text-muted-foreground font-medium py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before month start */}
                    {Array.from({ length: calendarDays[0].getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    
                    {calendarDays.map(day => {
                      const dayEvents = getEventsForDay(day).filter(e => showTransparent || !e.isTransparent);
                      const hasConflict = conflicts.some(c => c.events.some(e => isSameDay(e.startAt, day)));
                      
                      return (
                        <Tooltip key={day.toISOString()}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedDate(day)}
                              className={cn(
                                "aspect-square rounded p-1 text-xs transition-all relative",
                                "hover:bg-muted/50 focus:ring-1 focus:ring-primary",
                                isSameDay(day, selectedDate) && "bg-primary/20 ring-1 ring-primary",
                                isToday(day) && "bg-accent/30 font-bold",
                                !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50"
                              )}
                            >
                              <span className="block">{format(day, 'd')}</span>
                              
                              {/* Event dots */}
                              {dayEvents.length > 0 && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                  {dayEvents.slice(0, 3).map((e, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        SOURCE_COLORS[e.source].bg
                                      )}
                                    />
                                  ))}
                                  {dayEvents.length > 3 && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                  )}
                                </div>
                              )}
                              
                              {/* Conflict indicator */}
                              {hasConflict && (
                                <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{format(day, 'EEEE, MMMM d')}</p>
                            <p className="text-xs text-muted-foreground">{dayEvents.length} events</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Day Detail */}
              <Card className="border-border/50 bg-card/50 flex flex-col min-h-0">
                <CardHeader className="pb-2 flex-shrink-0">
                  <CardTitle className="text-sm font-medium">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                  <ScrollArea className="h-full pr-2">
                    {selectedDayEvents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <CalendarIcon size={24} className="mx-auto mb-2 opacity-50" />
                        No events scheduled
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayEvents.map(event => (
                          <div
                            key={event.id}
                            className={cn(
                              "p-2 rounded border transition-all hover:shadow-sm",
                              SOURCE_COLORS[event.source].bg,
                              SOURCE_COLORS[event.source].border,
                              event.isTransparent && "opacity-60"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <div className={cn("mt-0.5", SOURCE_COLORS[event.source].text)}>
                                {TYPE_ICONS[event.type]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium truncate">{event.title}</div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                  <span>{format(event.startAt, 'h:mm a')}</span>
                                  {event.endAt && (
                                    <span>- {format(event.endAt, 'h:mm a')}</span>
                                  )}
                                </div>
                                {event.location && (
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin size={10} />
                                    {event.location}
                                  </div>
                                )}
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge variant="outline" className="text-[8px] px-1 py-0">
                                    {event.sourceName}
                                  </Badge>
                                  {event.isTransparent && (
                                    <Badge variant="outline" className="text-[8px] px-1 py-0 bg-muted/30">
                                      Shared
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Focus Tab */}
          <TabsContent value="focus" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-4">
                {/* Today's Summary */}
                <Card className="border-border/50 bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" />
                      Today's Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-xl font-bold text-primary">{todaySummary.eventCount}</div>
                        <div className="text-[10px] text-muted-foreground">Total Events</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-xl font-bold text-amber-400">{todaySummary.totalMeetingHours}h</div>
                        <div className="text-[10px] text-muted-foreground">In Meetings</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-xl font-bold text-green-400">{Math.round(todaySummary.freeTimeMinutes / 60 * 10) / 10}h</div>
                        <div className="text-[10px] text-muted-foreground">Free Time</div>
                      </div>
                      <div className="text-center p-2 rounded bg-muted/30">
                        <div className="text-xl font-bold text-blue-400">{todaySummary.focusBlocksAvailable}</div>
                        <div className="text-[10px] text-muted-foreground">Focus Blocks</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Available Focus Blocks */}
                <Card className="border-border/50 bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Brain size={14} className="text-green-400" />
                      Available Focus Blocks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {focusBlocks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No focus blocks available this week</p>
                    ) : (
                      <div className="space-y-2">
                        {focusBlocks.slice(0, 6).map(block => (
                          <div
                            key={block.id}
                            className={cn(
                              "p-3 rounded border flex items-center justify-between",
                              block.isOptimal 
                                ? "bg-green-500/10 border-green-500/30" 
                                : "bg-muted/30 border-border"
                            )}
                          >
                            <div>
                              <div className="text-xs font-medium flex items-center gap-2">
                                {block.label}
                                {block.isOptimal && (
                                  <Badge className="text-[8px] bg-green-500/20 text-green-400 border-green-500/30">
                                    <Zap size={8} className="mr-0.5" />
                                    Peak Energy
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {format(block.startAt, 'EEE, MMM d')} • {format(block.startAt, 'h:mm a')} - {format(block.endAt, 'h:mm a')}
                                <span className="ml-2">({block.duration} min)</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant={block.isOptimal ? "default" : "outline"}
                              className="text-xs h-7"
                              onClick={() => handleBlockFocus(block)}
                            >
                              Block
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Atlas Life Tab */}
          <TabsContent value="life" className="flex-1 min-h-0 mt-0">
            <AtlasLifeTab />
          </TabsContent>
          
          {/* Insights Tab */}
          <TabsContent value="insights" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-3">
                {suggestions.length === 0 ? (
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="py-8 text-center">
                      <Sparkles size={24} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No suggestions at this time</p>
                      <p className="text-xs text-muted-foreground mt-1">Your schedule looks good!</p>
                    </CardContent>
                  </Card>
                ) : (
                  suggestions.map(suggestion => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full pr-2">
              <div className="space-y-3">
                {conflicts.length === 0 ? (
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="py-8 text-center">
                      <AlertTriangle size={24} className="mx-auto mb-2 text-green-400" />
                      <p className="text-sm text-muted-foreground">No scheduling conflicts</p>
                      <p className="text-xs text-muted-foreground mt-1">Your calendar is conflict-free!</p>
                    </CardContent>
                  </Card>
                ) : (
                  conflicts.map(conflict => (
                    <Card
                      key={conflict.id}
                      className={cn(
                        "border-border/50",
                        conflict.severity === 'high' ? "bg-red-500/10 border-red-500/30" :
                        conflict.severity === 'medium' ? "bg-amber-500/10 border-amber-500/30" :
                        "bg-yellow-500/10 border-yellow-500/30"
                      )}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={16} className={cn(
                            conflict.severity === 'high' ? "text-red-400" :
                            conflict.severity === 'medium' ? "text-amber-400" : "text-yellow-400"
                          )} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{conflict.message}</p>
                            <div className="mt-2 space-y-1">
                              {conflict.events.map(event => (
                                <div key={event.id} className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span className={cn("w-2 h-2 rounded-full", SOURCE_COLORS[event.source].bg)} />
                                  {event.title} ({format(event.startAt, 'h:mm a')})
                                </div>
                              ))}
                            </div>
                            {conflict.suggestedResolution && (
                              <p className="text-xs text-primary mt-2 flex items-center gap-1">
                                <Sparkles size={10} />
                                {conflict.suggestedResolution}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

// Suggestion Card Component
function SuggestionCard({ suggestion }: { suggestion: SchedulingSuggestion }) {
  const priorityColors = {
    low: 'bg-blue-500/10 border-blue-500/30',
    medium: 'bg-amber-500/10 border-amber-500/30',
    high: 'bg-red-500/10 border-red-500/30'
  };
  
  const typeIcons = {
    focus_block: <Brain size={14} className="text-green-400" />,
    meeting_time: <Users size={14} className="text-blue-400" />,
    break: <Clock size={14} className="text-amber-400" />,
    conflict_resolution: <AlertTriangle size={14} className="text-red-400" />
  };
  
  return (
    <Card className={cn("border-border/50", priorityColors[suggestion.priority])}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {typeIcons[suggestion.type]}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">{suggestion.title}</h4>
              <Badge variant="outline" className="text-[8px] px-1">
                {suggestion.confidence}% confidence
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
            {suggestion.suggestedTime && (
              <p className="text-xs text-primary mt-2">
                Suggested: {format(suggestion.suggestedTime.start, 'EEE h:mm a')} - {format(suggestion.suggestedTime.end, 'h:mm a')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Atlas Life Tab - Work-Life Balance and Financial Intelligence
function AtlasLifeTab() {
  const {
    workLifeBalance,
    autoBlockSuggestions,
    vacationPlans,
    acceptAutoBlock,
    analyzeWorkLifeBalance,
    isAnalyzing
  } = useAtlasLifeManager();
  
  const {
    financialHealth,
    investmentSuggestions,
    getAffordableDestinations,
    isAnalyzing: isAnalyzingFinance
  } = useFinancialIntelligence();

  const handleAcceptBlock = async (suggestion: AutoBlockSuggestion) => {
    const success = await acceptAutoBlock(suggestion);
    if (success) {
      toast.success(`Blocked ${suggestion.activity.name}`);
    } else {
      toast.error('Failed to block time');
    }
  };

  const { affordable, reachable } = getAffordableDestinations(7, 1);

  return (
    <ScrollArea className="h-full pr-2">
      <div className="space-y-4">
        {/* Work-Life Balance Score */}
        {workLifeBalance && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Heart size={14} className="text-pink-400" />
                  Work-Life Balance
                </span>
                <Badge variant="outline" className={cn(
                  "text-[10px]",
                  workLifeBalance.balanceScore >= 70 ? "border-green-500/30 text-green-400" :
                  workLifeBalance.balanceScore >= 50 ? "border-amber-500/30 text-amber-400" : 
                  "border-red-500/30 text-red-400"
                )}>
                  {workLifeBalance.balanceScore}% Score
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={workLifeBalance.balanceScore} className="h-2" />
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded bg-muted/30">
                  <div className="text-muted-foreground">Work Hours</div>
                  <div className="font-medium">{Math.round(workLifeBalance.weeklyWorkHours)}h/week</div>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <div className="text-muted-foreground">Personal Time</div>
                  <div className="font-medium">{Math.round(workLifeBalance.weeklyPersonalHours)}h/week</div>
                </div>
              </div>

              {/* Alerts */}
              {workLifeBalance.alerts.length > 0 && (
                <div className="space-y-2">
                  {workLifeBalance.alerts.slice(0, 2).map(alert => (
                    <div key={alert.id} className={cn(
                      "p-2 rounded text-xs",
                      alert.severity === 'critical' ? "bg-red-500/10 border border-red-500/20" :
                      alert.severity === 'warning' ? "bg-amber-500/10 border border-amber-500/20" :
                      "bg-blue-500/10 border border-blue-500/20"
                    )}>
                      <div className="flex items-center gap-1.5 font-medium">
                        <AlertTriangle size={12} className={
                          alert.severity === 'critical' ? "text-red-400" :
                          alert.severity === 'warning' ? "text-amber-400" : "text-blue-400"
                        } />
                        {alert.message}
                      </div>
                      <p className="text-muted-foreground text-[10px] mt-1">{alert.suggestedAction}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Auto-Block Suggestions */}
        {autoBlockSuggestions.length > 0 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap size={14} className="text-primary" />
                Atlas Auto-Block Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {autoBlockSuggestions.slice(0, 3).map(suggestion => (
                <div key={suggestion.id} className="p-2 rounded bg-primary/10 border border-primary/20 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium flex items-center gap-1.5">
                      {suggestion.activity.category === 'fitness' && <Dumbbell size={12} className="text-green-400" />}
                      {suggestion.activity.category === 'family' && <Heart size={12} className="text-pink-400" />}
                      {suggestion.activity.category === 'rest' && <Moon size={12} className="text-indigo-400" />}
                      {suggestion.activity.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {format(suggestion.suggestedSlot.start, 'EEE, MMM d')} • {format(suggestion.suggestedSlot.start, 'h:mm a')}
                    </div>
                    <div className="text-[9px] text-muted-foreground italic mt-0.5">{suggestion.reason}</div>
                  </div>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => handleAcceptBlock(suggestion)}
                  >
                    <Check size={12} className="mr-1" />
                    Block
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Financial Intelligence for Vacations */}
        {financialHealth && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign size={14} className="text-green-400" />
                Vacation Budget Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                  <div className="text-muted-foreground">Available for Travel</div>
                  <div className="font-medium text-green-400">
                    ${financialHealth.availableFunds.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <div className="text-muted-foreground">Financial Health</div>
                  <div className="font-medium">{financialHealth.healthScore}%</div>
                </div>
              </div>

              {/* Affordable Now */}
              {affordable.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                    <Check size={10} className="text-green-400" /> AFFORDABLE NOW (7 days)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {affordable.slice(0, 4).map(dest => (
                      <Badge key={dest.destination} variant="outline" className="text-[9px] bg-green-500/10 border-green-500/20">
                        <Plane size={8} className="mr-1" />
                        {dest.destination} ~${dest.estimatedCost.toLocaleString()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Reachable Soon */}
              {reachable.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                    <Target size={10} className="text-amber-400" /> SAVE FOR (next 6 months)
                  </div>
                  <div className="space-y-1.5">
                    {reachable.slice(0, 3).map(dest => (
                      <div key={dest.destination} className="flex items-center justify-between text-xs p-1.5 rounded bg-amber-500/5 border border-amber-500/10">
                        <span className="flex items-center gap-1">
                          <Plane size={10} className="text-amber-400" />
                          {dest.destination}
                        </span>
                        <span className="text-muted-foreground">
                          ~{Math.ceil(dest.daysToSave / 30)} months
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investment Suggestions */}
              {investmentSuggestions.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="text-[10px] font-mono text-muted-foreground mb-2">
                    ATLAS INVESTMENT GUIDANCE
                  </div>
                  {investmentSuggestions.slice(0, 2).map(suggestion => (
                    <div key={suggestion.id} className="p-2 rounded bg-muted/30 text-xs mb-2">
                      <div className="font-medium flex items-center gap-1.5">
                        {suggestion.priority === 'high' && <Zap size={10} className="text-primary" />}
                        {suggestion.title}
                      </div>
                      <p className="text-muted-foreground text-[10px] mt-0.5">{suggestion.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[8px]">
                          ${suggestion.suggestedAmount.toFixed(0)}/mo
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">{suggestion.vehicle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vacation Plans */}
        {vacationPlans.length > 0 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plane size={14} className="text-cyan-400" />
                Planned Vacations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {vacationPlans.map(plan => (
                <div key={plan.id} className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-xs font-medium">{plan.destination || 'Upcoming Trip'}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {format(plan.startDate, 'MMM d')} - {format(plan.endDate, 'MMM d, yyyy')}
                    <span className="ml-2">({plan.totalDays} days, {plan.workDaysAffected} work days)</span>
                  </div>
                  <Badge variant="outline" className="text-[8px] mt-1">
                    {plan.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

export default SmartCalendar;
