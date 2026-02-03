// GroupItemCard - Displays a single group item with actions

import { 
  CheckSquare, 
  Calendar, 
  FileText, 
  Megaphone,
  Flag,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import type { GroupItem, ItemType, ItemPriority } from '@/hooks/useGroupHub';

interface GroupItemCardProps {
  item: GroupItem;
  canEdit?: boolean;
  onEdit?: (item: GroupItem) => void;
  onComplete?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
}

const itemTypeConfig: Record<ItemType, { icon: typeof CheckSquare; color: string }> = {
  task: { icon: CheckSquare, color: 'hsl(150 70% 45%)' },
  event: { icon: Calendar, color: 'hsl(280 60% 55%)' },
  note: { icon: FileText, color: 'hsl(45 80% 50%)' },
  announcement: { icon: Megaphone, color: 'hsl(0 70% 55%)' },
  goal: { icon: Flag, color: 'hsl(200 70% 50%)' },
  resource: { icon: FileText, color: 'hsl(30 70% 50%)' },
  poll: { icon: CheckSquare, color: 'hsl(170 60% 45%)' },
};

const priorityConfig: Record<ItemPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'hsl(200 60% 50%)' },
  medium: { label: 'Medium', color: 'hsl(45 80% 50%)' },
  high: { label: 'High', color: 'hsl(25 80% 50%)' },
  urgent: { label: 'Urgent', color: 'hsl(0 70% 55%)' },
};

function formatDueDate(date: string): { text: string; isOverdue: boolean } {
  const dueDate = new Date(date);
  const isOverdue = isPast(dueDate) && !isToday(dueDate);
  
  if (isToday(dueDate)) return { text: 'Today', isOverdue: false };
  if (isTomorrow(dueDate)) return { text: 'Tomorrow', isOverdue: false };
  return { text: format(dueDate, 'MMM d'), isOverdue };
}

export function GroupItemCard({
  item,
  canEdit = true,
  onEdit,
  onComplete,
  onDelete
}: GroupItemCardProps) {
  const typeConfig = itemTypeConfig[item.item_type as ItemType] || itemTypeConfig.task;
  const Icon = typeConfig.icon;
  const priority = priorityConfig[item.priority as ItemPriority] || priorityConfig.medium;
  const isCompleted = item.status === 'completed';
  
  const dueInfo = item.due_date ? formatDueDate(item.due_date) : null;

  return (
    <div 
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg border transition-all",
        isCompleted 
          ? "bg-muted/30 border-border opacity-60" 
          : "bg-card border-border hover:border-primary/30 hover:bg-card/80"
      )}
    >
      {/* Checkbox for tasks */}
      {item.item_type === 'task' && onComplete && (
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onComplete(item.id)}
          className="mt-0.5"
        />
      )}
      
      {/* Icon for non-tasks */}
      {item.item_type !== 'task' && (
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${typeConfig.color}15` }}
        >
          <Icon size={16} style={{ color: typeConfig.color }} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn(
            "text-sm font-medium leading-tight",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {item.title}
          </h4>
          
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit size={14} className="mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {item.item_type === 'task' && onComplete && !isCompleted && (
                  <DropdownMenuItem onClick={() => onComplete(item.id)}>
                    <Check size={14} className="mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(item.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {item.content && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {item.content}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Priority badge */}
          {item.priority && item.priority !== 'medium' && (
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0"
              style={{ 
                borderColor: `${priority.color}50`,
                color: priority.color
              }}
            >
              {priority.label}
            </Badge>
          )}

          {/* Due date */}
          {dueInfo && (
            <span className={cn(
              "text-[10px] flex items-center gap-1",
              dueInfo.isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
              <Clock size={10} />
              {dueInfo.text}
            </span>
          )}

          {/* Tags */}
          {item.tags && (item.tags as string[]).length > 0 && (
            <>
              {(item.tags as string[]).slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {(item.tags as string[]).length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{(item.tags as string[]).length - 2}
                </span>
              )}
            </>
          )}

          {/* Assigned users */}
          {item.assigned_to && (item.assigned_to as string[]).length > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <User size={10} />
              {(item.assigned_to as string[]).length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupItemCard;
