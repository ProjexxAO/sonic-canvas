import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday, differenceInMilliseconds } from 'date-fns';
import { 
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Plus,
  List,
  Grid3X3,
  Edit2,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { EventItem } from '@/hooks/useCSuiteData';
import { EventFormDialog } from './EventFormDialog';
import { useAuth } from '@/hooks/useAuth';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EventsCalendarViewProps {
  items: EventItem[];
  isLoading: boolean;
  onBack: () => void;
  onItemClick: (item: EventItem) => void;
  onRefresh?: () => void;
}

type ViewMode = 'calendar' | 'list';

export function EventsCalendarView({
  items,
  isLoading,
  onBack,
  onItemClick,
  onRefresh,
}: EventsCalendarViewProps) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // Event form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);

  const handleAddEvent = useCallback((date?: Date) => {
    setEditingEvent(null);
    setNewEventDate(date || selectedDate || new Date());
    setFormOpen(true);
  }, [selectedDate]);

  const handleEditEvent = useCallback((event: EventItem) => {
    setEditingEvent(event);
    setNewEventDate(null);
    setFormOpen(true);
  }, []);

  const handleEventSaved = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const handleEventDeleted = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Get calendar days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    items.forEach(event => {
      const dateKey = format(event.start_at || event.date, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [items]);

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  }, [selectedDate, eventsByDate]);

  // Upcoming events (sorted by date)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return [...items]
      .filter(e => (e.start_at || e.date) >= now)
      .sort((a, b) => (a.start_at || a.date).getTime() - (b.start_at || b.date).getTime())
      .slice(0, 10);
  }, [items]);

  const getEventColor = (event: EventItem) => {
    const type = event.type.toLowerCase();
    if (type.includes('meeting')) return 'bg-blue-500';
    if (type.includes('deadline')) return 'bg-red-500';
    if (type.includes('call')) return 'bg-green-500';
    if (type.includes('review')) return 'bg-purple-500';
    return 'bg-primary';
  };

  // Handle drag and drop to reschedule events
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const eventId = result.draggableId;
    const newDateKey = result.destination.droppableId;
    const oldDateKey = result.source.droppableId;
    
    if (newDateKey === oldDateKey) return;
    
    // Find the event
    const event = items.find(e => e.id === eventId);
    if (!event) return;

    // Calculate the new dates
    const newDate = new Date(newDateKey + 'T00:00:00');
    const oldStartAt = event.start_at || event.date;
    const oldEndAt = event.end_at;
    
    // Keep the same time, just change the date
    const newStartAt = new Date(newDate);
    newStartAt.setHours(oldStartAt.getHours(), oldStartAt.getMinutes(), oldStartAt.getSeconds());
    
    let newEndAt: Date | null = null;
    if (oldEndAt) {
      // Calculate duration and apply to new date
      const duration = differenceInMilliseconds(oldEndAt, oldStartAt);
      newEndAt = new Date(newStartAt.getTime() + duration);
    }

    try {
      const { error } = await supabase
        .from('csuite_events')
        .update({ 
          start_at: newStartAt.toISOString(),
          end_at: newEndAt?.toISOString() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;
      
      toast.success(`Event moved to ${format(newDate, 'MMM d')}`);
      onRefresh?.();
    } catch (error) {
      console.error('Error rescheduling event:', error);
      toast.error('Failed to reschedule event');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Event Form Dialog */}
      {user && (
        <EventFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          event={editingEvent}
          selectedDate={newEventDate}
          userId={user.id}
          onEventSaved={handleEventSaved}
          onEventDeleted={handleEventDeleted}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
        </Button>
        <div className="p-2 rounded bg-green-500/20">
          <Calendar size={16} className="text-green-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Events Calendar</h3>
          <p className="text-[10px] text-muted-foreground">
            {items.length} events total
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleAddEvent()}
          >
            <Plus size={14} className="mr-1" />
            Add Event
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('calendar')}
          >
            <Grid3X3 size={14} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('list')}
          >
            <List size={14} />
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft size={14} />
              </Button>
              <span className="text-sm font-mono font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight size={14} />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-1 text-center">
                    <span className="text-[9px] font-mono text-muted-foreground uppercase">{day}</span>
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
                {calendarDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate.get(dateKey) || [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <Droppable key={dateKey} droppableId={dateKey}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            p-1 border-r border-b border-border text-left transition-colors cursor-pointer
                            ${!isCurrentMonth ? 'bg-muted/20 opacity-50' : 'bg-background hover:bg-muted/30'}
                            ${isSelected ? 'bg-primary/10 ring-1 ring-primary/50' : ''}
                            ${isTodayDate ? 'bg-primary/5' : ''}
                            ${snapshot.isDraggingOver ? 'bg-primary/20 ring-2 ring-primary/50' : ''}
                          `}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`
                              text-[10px] font-mono
                              ${isTodayDate ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center' : ''}
                              ${!isCurrentMonth ? 'text-muted-foreground' : 'text-foreground'}
                            `}>
                              {format(day, 'd')}
                            </span>
                            {dayEvents.length > 0 && (
                              <Badge variant="secondary" className="text-[7px] h-3 px-1">
                                {dayEvents.length}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-0.5 overflow-hidden min-h-[20px]">
                            {dayEvents.slice(0, 2).map((event, index) => (
                              <Draggable key={event.id} draggableId={event.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`
                                      ${getEventColor(event)} text-white text-[7px] px-1 rounded truncate 
                                      cursor-grab hover:opacity-80 flex items-center gap-0.5
                                      ${snapshot.isDragging ? 'shadow-lg ring-2 ring-white/50 opacity-90' : ''}
                                    `}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditEvent(event);
                                    }}
                                  >
                                    <GripVertical size={8} className="opacity-50 flex-shrink-0" />
                                    <span className="truncate">{event.title}</span>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-[7px] text-muted-foreground">+{dayEvents.length - 2} more</span>
                            )}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </div>
          </DragDropContext>

          {/* Selected Date Events Panel */}
          {selectedDate && (
            <div className="border-t border-border bg-card p-2 max-h-[30%] overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
                <Badge variant="secondary" className="text-[8px]">
                  {selectedDateEvents.length} events
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-5 text-[9px] ml-auto"
                  onClick={() => handleAddEvent(selectedDate)}
                >
                  <Plus size={10} className="mr-0.5" />
                  Add
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-[10px] text-muted-foreground mb-2">No events scheduled</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px]"
                      onClick={() => handleAddEvent(selectedDate)}
                    >
                      <Plus size={12} className="mr-1" />
                      Create Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {selectedDateEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => handleEditEvent(event)}
                        className="w-full p-2 rounded bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/30 transition-all text-left group"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${getEventColor(event)}`} />
                          <span className="text-[11px] font-medium text-foreground flex-1 truncate">{event.title}</span>
                          <Edit2 size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          {event.start_at && (
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Clock size={8} />
                              {format(event.start_at, 'h:mm a')}
                            </span>
                          )}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-1 ml-3.5">
                            <MapPin size={8} className="text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground truncate">{event.location}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {/* Upcoming Events */}
            <div className="p-2 rounded bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Upcoming Events</span>
              </div>
              <div className="space-y-1">
                {upcomingEvents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">No upcoming events</p>
                ) : (
                  upcomingEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => handleEditEvent(event)}
                      className="w-full p-2 rounded bg-background hover:bg-muted/30 border border-border hover:border-primary/30 transition-all text-left group"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-8 rounded-full ${getEventColor(event)} mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-foreground block truncate">{event.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Calendar size={8} />
                              {format(event.start_at || event.date, 'MMM d')}
                            </span>
                            {event.start_at && (
                              <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                <Clock size={8} />
                                {format(event.start_at, 'h:mm a')}
                              </span>
                            )}
                            {event.location && (
                              <span className="text-[9px] text-muted-foreground flex items-center gap-1 truncate">
                                <MapPin size={8} />
                                {event.location}
                              </span>
                            )}
                          </div>
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users size={8} className="text-muted-foreground" />
                              <span className="text-[8px] text-muted-foreground">
                                {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                        <Edit2 size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        <Badge variant="outline" className="text-[8px]">{event.type}</Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* All Events */}
            <div className="p-2 rounded bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <List size={12} className="text-secondary" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">All Events</span>
                <Badge variant="secondary" className="text-[8px] ml-auto">{items.length}</Badge>
              </div>
              <div className="space-y-1">
                {items.map(event => (
                  <button
                    key={event.id}
                    onClick={() => handleEditEvent(event)}
                    className="w-full p-2 rounded bg-background hover:bg-muted/30 border border-border hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${getEventColor(event)}`} />
                      <span className="text-[11px] font-medium text-foreground flex-1 truncate">{event.title}</span>
                      <Edit2 size={10} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[9px] text-muted-foreground">
                        {format(event.start_at || event.date, 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
