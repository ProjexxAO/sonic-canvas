// Draggable Overview Section - Wrapper for draggable dashboard sections
import { ReactNode } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableOverviewSectionProps {
  id: string;
  index: number;
  children: ReactNode;
  className?: string;
}

export function DraggableOverviewSection({ 
  id, 
  index, 
  children,
  className 
}: DraggableOverviewSectionProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "relative group",
            snapshot.isDragging && "opacity-90 shadow-lg z-50",
            className
          )}
        >
          {/* Drag handle */}
          <div 
            {...provided.dragHandleProps}
            className={cn(
              "absolute -left-1 top-1/2 -translate-y-1/2 p-1 rounded cursor-grab active:cursor-grabbing",
              "opacity-0 group-hover:opacity-100 transition-opacity bg-muted/80 hover:bg-muted"
            )}
          >
            <GripVertical size={12} className="text-muted-foreground" />
          </div>
          {children}
        </div>
      )}
    </Draggable>
  );
}

// Section type definitions
export type OverviewSectionId = 
  | 'shortcuts'
  | 'stats'
  | 'atlas-widgets'
  | 'quick-add'
  | 'todays-tasks'
  | 'overdue'
  | 'habits'
  | 'visualizations'
  | 'goals';

export const DEFAULT_SECTION_ORDER: OverviewSectionId[] = [
  'shortcuts',
  'stats',
  'atlas-widgets',
  'quick-add',
  'todays-tasks',
  'overdue',
  'habits',
  'visualizations',
  'goals'
];
