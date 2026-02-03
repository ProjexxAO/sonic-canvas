// GroupItemDialog - Unified dialog for creating/editing group items (tasks, events, notes, etc.)

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  Calendar as CalendarIcon, 
  FileText, 
  Megaphone,
  Clock,
  Flag,
  X,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { GroupItem, ItemType, ItemPriority } from '@/hooks/useGroupHub';

interface GroupItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: GroupItem | null;
  defaultType?: ItemType;
  onSave: (data: {
    itemType: ItemType;
    title: string;
    content?: string;
    priority?: ItemPriority;
    dueDate?: Date;
    tags?: string[];
  }) => Promise<boolean>;
  onDelete?: (itemId: string) => Promise<boolean>;
}

const itemTypeConfig: Record<ItemType, { icon: typeof CheckSquare; label: string; color: string }> = {
  task: { icon: CheckSquare, label: 'Task', color: 'hsl(150 70% 45%)' },
  event: { icon: CalendarIcon, label: 'Event', color: 'hsl(280 60% 55%)' },
  note: { icon: FileText, label: 'Note', color: 'hsl(45 80% 50%)' },
  announcement: { icon: Megaphone, label: 'Announcement', color: 'hsl(0 70% 55%)' },
  goal: { icon: Flag, label: 'Goal', color: 'hsl(200 70% 50%)' },
  resource: { icon: FileText, label: 'Resource', color: 'hsl(30 70% 50%)' },
  poll: { icon: CheckSquare, label: 'Poll', color: 'hsl(170 60% 45%)' },
};

const priorityOptions: { value: ItemPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'hsl(200 60% 50%)' },
  { value: 'medium', label: 'Medium', color: 'hsl(45 80% 50%)' },
  { value: 'high', label: 'High', color: 'hsl(25 80% 50%)' },
  { value: 'urgent', label: 'Urgent', color: 'hsl(0 70% 55%)' },
];

export function GroupItemDialog({
  open,
  onOpenChange,
  item,
  defaultType = 'task',
  onSave,
  onDelete
}: GroupItemDialogProps) {
  const isEditing = !!item;
  
  const [itemType, setItemType] = useState<ItemType>(item?.item_type as ItemType || defaultType);
  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [priority, setPriority] = useState<ItemPriority>(item?.priority as ItemPriority || 'medium');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    item?.due_date ? new Date(item.due_date) : undefined
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(item?.tags as string[] || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      setItemType(item?.item_type as ItemType || defaultType);
      setTitle(item?.title || '');
      setContent(item?.content || '');
      setPriority(item?.priority as ItemPriority || 'medium');
      setDueDate(item?.due_date ? new Date(item.due_date) : undefined);
      setTags(item?.tags as string[] || []);
      setTagInput('');
      setShowDeleteConfirm(false);
    }
  }, [open, item, defaultType]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    
    setIsSaving(true);
    try {
      const success = await onSave({
        itemType,
        title: title.trim(),
        content: content.trim() || undefined,
        priority,
        dueDate,
        tags: tags.length > 0 ? tags : undefined
      });
      
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await onDelete(item.id);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const config = itemTypeConfig[itemType];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <Icon size={18} style={{ color: config.color }} />
            </div>
            {isEditing ? `Edit ${config.label}` : `New ${config.label}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? `Update this ${config.label.toLowerCase()} details`
              : `Create a new ${config.label.toLowerCase()} for your group`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Type Selector (only for new items) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex flex-wrap gap-2">
                {(['task', 'event', 'note', 'announcement'] as ItemType[]).map((type) => {
                  const typeConfig = itemTypeConfig[type];
                  const TypeIcon = typeConfig.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setItemType(type)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                        itemType === type
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <TypeIcon size={14} style={{ color: typeConfig.color }} />
                      <span className="text-sm">{typeConfig.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${config.label.toLowerCase()} title...`}
              autoFocus
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Description</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add details..."
              rows={3}
            />
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ItemPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: opt.color }}
                        />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <Clock size={14} className="mr-2" />
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && onDelete && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 mr-auto">
                  <span className="text-sm text-destructive">Confirm delete?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Yes, Delete'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive mr-auto"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </Button>
              )}
            </>
          )}
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              isEditing ? 'Save Changes' : `Create ${config.label}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GroupItemDialog;
