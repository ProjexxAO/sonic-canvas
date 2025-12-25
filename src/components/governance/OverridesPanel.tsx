import { useState } from 'react';
import { Settings2, Activity, Camera, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Override {
  id: string;
  tool: string;
  layer: string;
  action: 'allow' | 'block' | 'prefer';
  reason?: string;
  timestamp: Date;
}

interface Event {
  id: string;
  type: 'tool_invoked' | 'permission_changed' | 'override_applied';
  description: string;
  timestamp: Date;
}

interface Snapshot {
  id: string;
  name: string;
  toolCount: number;
  createdAt: Date;
}

interface OverridesPanelProps {
  overrides: Override[];
  events: Event[];
  snapshots: Snapshot[];
}

const actionColors = {
  allow: 'bg-success/20 text-success',
  block: 'bg-destructive/20 text-destructive',
  prefer: 'bg-secondary/20 text-secondary',
};

const eventIcons = {
  tool_invoked: Activity,
  permission_changed: Settings2,
  override_applied: ChevronRight,
};

export function OverridesPanel({ overrides, events, snapshots }: OverridesPanelProps) {
  const [activeTab, setActiveTab] = useState('overrides');

  return (
    <div className="hud-panel h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start gap-1 px-4 pt-4 pb-2 bg-transparent border-b border-border rounded-none h-auto">
          <TabsTrigger value="overrides" className="text-xs data-[state=active]:bg-primary/10">
            <Settings2 className="h-3 w-3 mr-1" />
            Overrides ({overrides.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs data-[state=active]:bg-primary/10">
            <Activity className="h-3 w-3 mr-1" />
            Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="snapshots" className="text-xs data-[state=active]:bg-primary/10">
            <Camera className="h-3 w-3 mr-1" />
            Snapshots ({snapshots.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-4">
          <TabsContent value="overrides" className="mt-0 h-full">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {overrides.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No overrides configured</p>
                ) : (
                  overrides.map(override => (
                    <div
                      key={override.id}
                      className="p-3 rounded-lg border border-border bg-card/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{override.tool}</span>
                        <Badge 
                          variant="outline" 
                          className={cn('text-[10px]', actionColors[override.action])}
                        >
                          {override.action}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Layer: {override.layer}</span>
                        {override.reason && (
                          <>
                            <span>•</span>
                            <span className="truncate">{override.reason}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="events" className="mt-0 h-full">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {events.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No recent events</p>
                ) : (
                  events.map(event => {
                    const Icon = eventIcons[event.type];
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50"
                      >
                        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{event.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="snapshots" className="mt-0 h-full">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {snapshots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No snapshots saved</p>
                ) : (
                  snapshots.map(snapshot => (
                    <div
                      key={snapshot.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 cursor-pointer hover:bg-card transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{snapshot.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {snapshot.toolCount} tools • {snapshot.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
