import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, Type, X, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EventItem } from '@/hooks/useCSuiteData';

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventItem | null;
  selectedDate?: Date | null;
  userId: string;
  onEventSaved: () => void;
  onEventDeleted?: () => void;
}

const EVENT_TYPES = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'call', label: 'Call' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'review', label: 'Review' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'other', label: 'Other' },
];

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  selectedDate,
  userId,
  onEventSaved,
  onEventDeleted,
}: EventFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [attendeesInput, setAttendeesInput] = useState('');

  const isEditing = !!event;

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (open) {
      if (event) {
        // Editing existing event
        setTitle(event.title || '');
        setDescription(event.preview || '');
        setEventType(event.type || 'meeting');
        setLocation(event.location || '');
        if (event.start_at) {
          setStartDate(format(event.start_at, 'yyyy-MM-dd'));
          setStartTime(format(event.start_at, 'HH:mm'));
        }
        if (event.end_at) {
          setEndDate(format(event.end_at, 'yyyy-MM-dd'));
          setEndTime(format(event.end_at, 'HH:mm'));
        }
        setAttendeesInput(event.attendees?.join(', ') || '');
      } else {
        // New event
        setTitle('');
        setDescription('');
        setEventType('meeting');
        setLocation('');
        if (selectedDate) {
          setStartDate(format(selectedDate, 'yyyy-MM-dd'));
          setEndDate(format(selectedDate, 'yyyy-MM-dd'));
        } else {
          setStartDate(format(new Date(), 'yyyy-MM-dd'));
          setEndDate(format(new Date(), 'yyyy-MM-dd'));
        }
        setStartTime('09:00');
        setEndTime('10:00');
        setAttendeesInput('');
      }
    }
  }, [open, event, selectedDate]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    setIsLoading(true);
    try {
      const startAt = startDate && startTime 
        ? new Date(`${startDate}T${startTime}:00`) 
        : startDate 
          ? new Date(`${startDate}T00:00:00`)
          : null;
      
      const endAt = endDate && endTime 
        ? new Date(`${endDate}T${endTime}:00`) 
        : endDate 
          ? new Date(`${endDate}T23:59:59`)
          : null;

      const attendees = attendeesInput
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const eventData = {
        title: title.trim(),
        description: description.trim() || null,
        type: eventType,
        location: location.trim() || null,
        start_at: startAt?.toISOString() || null,
        end_at: endAt?.toISOString() || null,
        attendees: attendees.length > 0 ? attendees : null,
        source: 'manual',
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && event) {
        const { error } = await supabase
          .from('csuite_events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
        toast.success('Event updated');
      } else {
        const { error } = await supabase
          .from('csuite_events')
          .insert(eventData);

        if (error) throw error;
        toast.success('Event created');
      }

      onEventSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('csuite_events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;
      
      toast.success('Event deleted');
      onEventDeleted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              {isEditing ? 'Edit Event' : 'New Event'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-mono">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                className="h-9"
              />
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <Label className="text-xs font-mono flex items-center gap-1">
                <Type size={12} />
                Type
              </Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Calendar size={12} />
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Clock size={12} />
                  Start Time
                </Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Calendar size={12} />
                  End Date
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Clock size={12} />
                  End Time
                </Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-mono flex items-center gap-1">
                <MapPin size={12} />
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Meeting room, video call link, etc."
                className="h-9"
              />
            </div>

            {/* Attendees */}
            <div className="space-y-2">
              <Label htmlFor="attendees" className="text-xs font-mono flex items-center gap-1">
                <Users size={12} />
                Attendees
              </Label>
              <Input
                id="attendees"
                value={attendeesInput}
                onChange={(e) => setAttendeesInput(e.target.value)}
                placeholder="Comma-separated emails or names"
                className="h-9"
              />
              {attendeesInput && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {attendeesInput.split(',').filter(a => a.trim()).map((attendee, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px]">
                      {attendee.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-mono">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add event details..."
                rows={3}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="sm:mr-auto"
              >
                <Trash2 size={14} className="mr-1" />
                Delete
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <Save size={14} className="mr-1" />
              )}
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
