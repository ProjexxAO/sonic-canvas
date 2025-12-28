import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  ArrowLeft,
  CheckSquare,
  Plus,
  List,
  LayoutGrid,
  Calendar,
  User,
  Flag,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TaskItem } from '@/hooks/useCSuiteData';
import { TaskFormDialog } from './TaskFormDialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface TasksKanbanViewProps {
  items: TaskItem[];
  isLoading: boolean;
  onBack: () => void;
  onItemClick: (item: TaskItem) => void;
  onRefresh?: () => void;
}

type ViewMode = 'kanban' | 'list';

const COLUMNS = [
  { id: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', label: 'Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-green-500' },
];

export function TasksKanbanView({
  items,
  isLoading,
  onBack,
  onItemClick,
  onRefresh,
}: TasksKanbanViewProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  
  // Task form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<string>('pending');

  const handleAddTask = useCallback((status: string = 'pending') => {
    setEditingTask(null);
    setDefaultStatus(status);
    setFormOpen(true);
  }, []);

  const handleEditTask = useCallback((task: TaskItem) => {
    setEditingTask(task);
    setFormOpen(true);
  }, []);

  const handleTaskSaved = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const handleTaskDeleted = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    COLUMNS.forEach(col => map.set(col.id, []));
    
    items.forEach(task => {
      const status = task.status || 'pending';
      if (!map.has(status)) {
        map.set('pending', [...(map.get('pending') || []), task]);
      } else {
        map.get(status)!.push(task);
      }
    });
    
    // Sort by priority within each column
    map.forEach((tasks, key) => {
      map.set(key, tasks.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1);
      }));
    });
    
    return map;
  }, [items]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-500/5';
      case 'medium': return 'border-l-yellow-500 bg-yellow-500/5';
      case 'low': return 'border-l-green-500 bg-green-500/5';
      default: return 'border-l-muted-foreground';
    }
  };

  const getPriorityBadgeColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500';
      case 'low': return 'bg-green-500/20 text-green-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    // Find the task
    const task = items.find(t => t.id === draggableId);
    if (!task || task.status === newStatus) return;

    try {
      const { error } = await supabase
        .from('csuite_tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggableId);

      if (error) throw error;
      
      toast.success(`Task moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`);
      onRefresh?.();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Task Form Dialog */}
      {user && (
        <TaskFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          task={editingTask}
          defaultStatus={defaultStatus}
          userId={user.id}
          onTaskSaved={handleTaskSaved}
          onTaskDeleted={handleTaskDeleted}
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
        <div className="p-2 rounded bg-red-500/20">
          <CheckSquare size={16} className="text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Tasks Board</h3>
          <p className="text-[10px] text-muted-foreground">
            {items.length} tasks total
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleAddTask()}
          >
            <Plus size={14} className="mr-1" />
            Add Task
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid size={14} />
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

      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex gap-3 p-3 overflow-x-auto">
              {COLUMNS.map(column => {
                const columnTasks = tasksByStatus.get(column.id) || [];
                return (
                  <div key={column.id} className="flex-shrink-0 w-72 flex flex-col bg-card rounded-lg border border-border">
                    {/* Column Header */}
                    <div className="p-2 border-b border-border flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${column.color}`} />
                      <span className="text-xs font-semibold text-foreground">{column.label}</span>
                      <Badge variant="secondary" className="text-[9px] ml-auto">
                        {columnTasks.length}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleAddTask(column.id)}
                      >
                        <Plus size={12} />
                      </Button>
                    </div>
                    
                    {/* Column Content */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <ScrollArea 
                          className={`flex-1 p-2 ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                        >
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-2 min-h-[100px]"
                          >
                            {columnTasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`
                                      p-2 rounded-lg bg-background border-l-2 border border-border 
                                      hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group
                                      ${getPriorityColor(task.priority)}
                                      ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''}
                                    `}
                                    onClick={() => handleEditTask(task)}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab mt-0.5"
                                      >
                                        <GripVertical size={12} className="text-muted-foreground" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-medium text-foreground line-clamp-2">{task.title}</p>
                                        
                                        {task.preview && (
                                          <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">{task.preview}</p>
                                        )}
                                        
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                          {task.priority && (
                                            <Badge className={`text-[8px] ${getPriorityBadgeColor(task.priority)}`}>
                                              {task.priority}
                                            </Badge>
                                          )}
                                          {task.due_date && (
                                            <span className="text-[8px] text-muted-foreground flex items-center gap-0.5">
                                              <Calendar size={8} />
                                              {format(task.due_date, 'MMM d')}
                                            </span>
                                          )}
                                          {task.assigned_to && (
                                            <span className="text-[8px] text-muted-foreground flex items-center gap-0.5 truncate max-w-[80px]">
                                              <User size={8} />
                                              {task.assigned_to}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </ScrollArea>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      ) : (
        /* List View */
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {items.length === 0 ? (
              <div className="text-center py-20">
                <CheckSquare size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No tasks yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleAddTask()}
                >
                  <Plus size={14} className="mr-1" />
                  Create Task
                </Button>
              </div>
            ) : (
              items.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleEditTask(task)}
                  className={`
                    w-full p-3 rounded-lg bg-card border-l-2 border border-border 
                    hover:border-primary/40 hover:shadow-sm transition-all text-left
                    ${getPriorityColor(task.priority)}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-foreground line-clamp-1">{task.title}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {task.priority && (
                            <Badge className={`text-[8px] ${getPriorityBadgeColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[8px]">{task.status}</Badge>
                        </div>
                      </div>
                      {task.preview && (
                        <p className="text-[10px] text-muted-foreground/70 line-clamp-2 mt-1">{task.preview}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {task.due_date && (
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <Calendar size={10} />
                            {format(task.due_date, 'MMM d, yyyy')}
                          </span>
                        )}
                        {task.assigned_to && (
                          <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                            <User size={10} />
                            {task.assigned_to}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
