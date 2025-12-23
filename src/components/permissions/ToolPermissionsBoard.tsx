import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Shield, ShieldOff, Star, Grid3X3, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getIconComponent } from '@/lib/iconUtils';
import type { ToolSection, ToolItem } from '@/types/toolPermissions';

interface ToolPermissionsBoardProps {
  sections: ToolSection[];
  allSections: ToolSection[];
  onChange: (sections: ToolSection[]) => void;
  onToolClick?: (tool: ToolItem) => void;
}

const sectionConfig: Record<string, { icon: LucideIcon; borderColor: string; bgColor: string; accentColor: string }> = {
  allowed: {
    icon: Shield,
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/5',
    accentColor: 'text-emerald-500'
  },
  blocked: {
    icon: ShieldOff,
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/5',
    accentColor: 'text-red-500'
  },
  preferred: {
    icon: Star,
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/5',
    accentColor: 'text-amber-500'
  },
  available: {
    icon: Grid3X3,
    borderColor: 'border-muted-foreground/30',
    bgColor: 'bg-muted/5',
    accentColor: 'text-muted-foreground'
  }
};

export function ToolPermissionsBoard({ 
  sections, 
  allSections,
  onChange, 
  onToolClick 
}: ToolPermissionsBoardProps) {
  
  function handleDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Find indices in allSections (unfiltered)
    const sourceSectionIndex = allSections.findIndex(s => s.id === source.droppableId);
    const destSectionIndex = allSections.findIndex(s => s.id === destination.droppableId);
    
    if (sourceSectionIndex === -1 || destSectionIndex === -1) return;

    // Get the filtered section to find the actual item
    const filteredSourceSection = sections.find(s => s.id === source.droppableId);
    if (!filteredSourceSection) return;
    
    const movedItem = filteredSourceSection.items[source.index];
    if (!movedItem) return;

    // Find the item in the unfiltered source section
    const sourceSection = allSections[sourceSectionIndex];
    const destSection = allSections[destSectionIndex];
    
    const actualSourceIndex = sourceSection.items.findIndex(i => i.tool === movedItem.tool);
    if (actualSourceIndex === -1) return;

    // Create new sections with the move
    const newSections = [...allSections];
    const sourceItems = Array.from(sourceSection.items);
    const [removed] = sourceItems.splice(actualSourceIndex, 1);
    
    const destItems = Array.from(destSection.items);
    destItems.splice(destination.index, 0, removed);

    newSections[sourceSectionIndex] = { ...sourceSection, items: sourceItems };
    newSections[destSectionIndex] = { ...destSection, items: destItems };

    onChange(newSections);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
        {sections.map(section => {
          const config = sectionConfig[section.id] || sectionConfig.available;
          const SectionIcon = config.icon;
          
          return (
            <Droppable droppableId={section.id} key={section.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'flex flex-col rounded-lg border-2 border-dashed p-4 min-h-[300px] transition-all duration-200',
                    config.borderColor,
                    config.bgColor,
                    snapshot.isDraggingOver && 'border-solid ring-2 ring-primary/20'
                  )}
                >
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
                    <SectionIcon className={cn('h-5 w-5', config.accentColor)} />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{section.title}</h3>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {section.items.length}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {section.items.map((item, index) => {
                      const ToolIcon = getIconComponent(item.icon);
                      
                      return (
                        <Draggable key={item.tool} draggableId={item.tool} index={index}>
                          {(draggableProvided, draggableSnapshot) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              onClick={() => onToolClick?.(item)}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-md bg-card border border-border cursor-grab active:cursor-grabbing transition-all',
                                'hover:border-primary/50 hover:shadow-sm',
                                draggableSnapshot.isDragging && 'shadow-lg ring-2 ring-primary/30 rotate-2'
                              )}
                            >
                              <div className={cn(
                                'p-2 rounded-md',
                                config.bgColor
                              )}>
                                <ToolIcon className={cn('h-4 w-4', config.accentColor)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.label}</p>
                                {item.metadata.category && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item.metadata.category}
                                  </p>
                                )}
                              </div>
                              {item.metadata.autoInvokable && (
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  Auto
                                </Badge>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                  
                  {section.items.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                      Drop tools here
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
