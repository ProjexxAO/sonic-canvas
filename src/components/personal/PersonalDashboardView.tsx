import { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Loader2, LayoutDashboard, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePersonalDashboard, DashboardWidget } from '@/hooks/usePersonalDashboard';
import { useDataConnectors } from '@/hooks/useDataConnectors';
import { useBanking } from '@/hooks/useBanking';
import { usePersonalHub } from '@/hooks/usePersonalHub';
import { DashboardWidgetMemo } from './DashboardWidget';
import { DashboardCustomizer } from './DashboardCustomizer';
import { InvitedDashboardsPanel } from './InvitedDashboardsPanel';
import { useTheme } from 'next-themes';

interface PersonalDashboardViewProps {
  userId?: string;
}

export function PersonalDashboardView({ userId }: PersonalDashboardViewProps) {
  const { theme } = useTheme();
  const { 
    layout, 
    isLoading, 
    atlasFilter, 
    setAtlasFilter,
    applyPreset,
    addWidget,
    removeWidget,
    updateWidget,
    reorderWidgets,
    setColumns,
    atlasAutoArrange
  } = usePersonalDashboard(userId);

  const { connectors, getConnectorStats } = useDataConnectors(userId);
  const { accounts: bankAccounts } = useBanking();
  const { stats, goals, habits } = usePersonalHub();

  // Get connected services
  const connectedServices = useMemo(() => {
    return connectors.filter(c => c.isActive).map(c => c.platform);
  }, [connectors]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !layout) return;

    const items = Array.from(layout.widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
      column: index % layout.columns
    }));

    reorderWidgets(updatedItems);
  };

  // Handle Atlas auto-arrange
  const handleAtlasArrange = () => {
    atlasAutoArrange(connectedServices, {
      tasksToday: stats.activeTasks,
      goalsActive: goals.length,
      habitsActive: habits.length,
      hasBanking: bankAccounts.length > 0
    });
  };

  // Group widgets by column
  const widgetsByColumn = useMemo(() => {
    if (!layout) return [];
    
    const columns: DashboardWidget[][] = Array.from(
      { length: layout.columns }, 
      () => []
    );
    
    layout.widgets
      .filter(w => w.isVisible)
      .sort((a, b) => a.position - b.position)
      .forEach((widget, index) => {
        const colIndex = index % layout.columns;
        columns[colIndex].push(widget);
      });
    
    return columns;
  }, [layout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!layout) {
    return (
      <Card className={cn(
        "border-0 shadow-lg backdrop-blur-sm",
        theme === 'dark' ? "bg-card/40" : "bg-white/80"
      )}>
        <CardContent className="p-8 text-center">
          <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Set Up Your Dashboard</h3>
          <p className="text-muted-foreground mb-4">
            Create your personalized dashboard by choosing a preset or let Atlas arrange it for you.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => applyPreset('default')}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Use Default Layout
            </Button>
            <Button onClick={handleAtlasArrange}>
              <Sparkles className="h-4 w-4 mr-2" />
              Let Atlas Arrange
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invited Dashboards - Prominent placement for hub transitions */}
      <InvitedDashboardsPanel />

      {/* Customizer Bar */}
      <DashboardCustomizer
        columns={layout.columns}
        currentPreset={layout.preset}
        atlasFilter={atlasFilter}
        onColumnsChange={setColumns}
        onPresetChange={applyPreset}
        onAtlasFilterChange={setAtlasFilter}
        onAddWidget={addWidget}
        onAtlasArrange={handleAtlasArrange}
      />

      {/* Dashboard Grid with Drag & Drop */}
      {layout.widgets.length === 0 ? (
        <Card className={cn(
          "border-0 shadow-lg backdrop-blur-sm",
          theme === 'dark' ? "bg-card/40" : "bg-white/80"
        )}>
          <CardContent className="p-8 text-center">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your Dashboard is Empty</h3>
            <p className="text-muted-foreground mb-4">
              Add widgets or let Atlas create a personalized layout based on your connected data.
            </p>
            <Button onClick={handleAtlasArrange}>
              <Sparkles className="h-4 w-4 mr-2" />
              Let Atlas Arrange
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard" direction="vertical">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "grid gap-4",
                  layout.columns === 1 && "grid-cols-1",
                  layout.columns === 2 && "grid-cols-1 md:grid-cols-2",
                  layout.columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                )}
              >
                {layout.widgets
                  .filter(w => w.isVisible)
                  .sort((a, b) => a.position - b.position)
                  .map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            widget.size === 'large' && layout.columns > 1 && "md:col-span-2",
                            widget.size === 'full' && "col-span-full"
                          )}
                        >
                          <DashboardWidgetMemo
                            widget={widget}
                            onRemove={() => removeWidget(widget.id)}
                            onResize={(size) => updateWidget(widget.id, { size })}
                            isDragging={snapshot.isDragging}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
