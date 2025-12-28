import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckSquare, Calendar, Clock, User, Tag, Flag, X, Trash2, Save, Loader2 } from 'lucide-react';
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
import { TaskItem } from '@/hooks/useCSuiteData';

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskItem | null;
  defaultStatus?: string;
  userId: string;
  onTaskSaved: () => void;
  onTaskDeleted?: () => void;
}

const TASK_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'review', label: 'Review', color: 'bg-purple-500' },
  { value: 'done', label: 'Done', color: 'bg-green-500' },
];

const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-green-500' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
  { value: 'high', label: 'High', color: 'text-red-500' },
];

const TASK_TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'improvement', label: 'Improvement' },
];

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  defaultStatus = 'pending',
  userId,
  onTaskSaved,
  onTaskDeleted,
}: TaskFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('task');
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [project, setProject] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const isEditing = !!task;

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        // Editing existing task
        setTitle(task.title || '');
        setDescription(task.preview || '');
        setTaskType(task.type || 'task');
        setStatus(task.status || 'pending');
        setPriority(task.priority || 'medium');
        if (task.due_date) {
          setDueDate(format(task.due_date, 'yyyy-MM-dd'));
          setDueTime(format(task.due_date, 'HH:mm'));
        } else {
          setDueDate('');
          setDueTime('');
        }
        setAssignedTo(task.assigned_to || '');
        setProject(task.metadata?.project || '');
        setTagsInput(task.metadata?.tags?.join(', ') || '');
      } else {
        // New task
        setTitle('');
        setDescription('');
        setTaskType('task');
        setStatus(defaultStatus);
        setPriority('medium');
        setDueDate('');
        setDueTime('');
        setAssignedTo('');
        setProject('');
        setTagsInput('');
      }
    }
  }, [open, task, defaultStatus]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsLoading(true);
    try {
      const dueDateTime = dueDate && dueTime 
        ? new Date(`${dueDate}T${dueTime}:00`) 
        : dueDate 
          ? new Date(`${dueDate}T23:59:59`)
          : null;

      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        type: taskType,
        status,
        priority,
        due_date: dueDateTime?.toISOString() || null,
        assigned_to: assignedTo.trim() || null,
        project: project.trim() || null,
        tags: tags.length > 0 ? tags : null,
        source: 'manual',
        user_id: userId,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && task) {
        const { error } = await supabase
          .from('csuite_tasks')
          .update(taskData)
          .eq('id', task.id);

        if (error) throw error;
        toast.success('Task updated');
      } else {
        const { error } = await supabase
          .from('csuite_tasks')
          .insert(taskData);

        if (error) throw error;
        toast.success('Task created');
      }

      onTaskSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('csuite_tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;
      
      toast.success('Task deleted');
      onTaskDeleted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
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
              <CheckSquare size={18} className="text-primary" />
              {isEditing ? 'Edit Task' : 'New Task'}
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
                placeholder="Task title"
                className="h-9"
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Flag size={12} />
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${s.color}`} />
                          {s.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Flag size={12} />
                  Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={p.color}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label className="text-xs font-mono">Type</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Calendar size={12} />
                  Due Date
                </Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono flex items-center gap-1">
                  <Clock size={12} />
                  Due Time
                </Label>
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assignedTo" className="text-xs font-mono flex items-center gap-1">
                <User size={12} />
                Assigned To
              </Label>
              <Input
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Name or email"
                className="h-9"
              />
            </div>

            {/* Project */}
            <div className="space-y-2">
              <Label htmlFor="project" className="text-xs font-mono">Project</Label>
              <Input
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Project name"
                className="h-9"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-xs font-mono flex items-center gap-1">
                <Tag size={12} />
                Tags
              </Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Comma-separated tags"
                className="h-9"
              />
              {tagsInput && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tagsInput.split(',').filter(t => t.trim()).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-[9px]">
                      {tag.trim()}
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
                placeholder="Add task details..."
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
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task?.title}"? This action cannot be undone.
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
