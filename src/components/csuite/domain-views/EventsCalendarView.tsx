import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
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
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { EventItem } from '@/hooks/useCSuiteData';

interface EventsCalendarViewProps {
  items: EventItem[];
  isLoading: boolean;
  onBack: () => void;
  onItemClick: (item: EventItem) => void;
}

type ViewMode = 'calendar' | 'list';

export function EventsCalendarView({
  items,
  isLoading,
  onBack,
  onItemClick,
}: EventsCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

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

  return (
    <div className="h-full flex flex-col bg-background">
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
              {calendarDays.map((day, i) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      p-1 border-r border-b border-border text-left transition-colors
                      ${!isCurrentMonth ? 'bg-muted/20 opacity-50' : 'bg-background hover:bg-muted/30'}
                      ${isSelected ? 'bg-primary/10 ring-1 ring-primary/50' : ''}
                      ${isTodayDate ? 'bg-primary/5' : ''}
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
                    <div className="space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`${getEventColor(event)} text-white text-[7px] px-1 rounded truncate`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[7px] text-muted-foreground">+{dayEvents.length - 2} more</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events Panel */}
          {selectedDate && (
            <div className="border-t border-border bg-card p-2 max-h-[30%] overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
                <Badge variant="secondary" className="text-[8px] ml-auto">
                  {selectedDateEvents.length} events
                </Badge>
              </div>
              <ScrollArea className="flex-1">
                {selectedDateEvents.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">No events scheduled</p>
                ) : (
                  <div className="space-y-1">
                    {selectedDateEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => onItemClick(event)}
                        className="w-full p-2 rounded bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${getEventColor(event)}`} />
                          <span className="text-[11px] font-medium text-foreground flex-1 truncate">{event.title}</span>
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
                      onClick={() => onItemClick(event)}
                      className="w-full p-2 rounded bg-background hover:bg-muted/30 border border-border hover:border-primary/30 transition-all text-left"
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
                    onClick={() => onItemClick(event)}
                    className="w-full p-2 rounded bg-background hover:bg-muted/30 border border-border hover:border-primary/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${getEventColor(event)}`} />
                      <span className="text-[11px] font-medium text-foreground flex-1 truncate">{event.title}</span>
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
