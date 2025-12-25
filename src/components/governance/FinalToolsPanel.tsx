import { useState } from 'react';
import { Layers, ShieldCheck, Ban, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getIconComponent } from '@/lib/iconUtils';
import { cn } from '@/lib/utils';

interface ToolItem {
  tool: string;
  label: string;
  icon: string;
  source: 'persona' | 'industry' | 'workspace' | 'user' | 'agent';
  status: 'allowed' | 'blocked' | 'preferred';
}

interface FinalToolsPanelProps {
  tools: ToolItem[];
}

const sourceColors: Record<string, string> = {
  persona: 'bg-accent/20 text-accent',
  industry: 'bg-secondary/20 text-secondary',
  workspace: 'bg-primary/20 text-primary',
  user: 'bg-info/20 text-info',
  agent: 'bg-success/20 text-success',
};

const statusConfig = {
  allowed: { icon: ShieldCheck, color: 'text-success', label: 'Allowed' },
  blocked: { icon: Ban, color: 'text-destructive', label: 'Blocked' },
  preferred: { icon: Star, color: 'text-secondary', label: 'Preferred' },
};

export function FinalToolsPanel({ tools }: FinalToolsPanelProps) {
  const [activeTab, setActiveTab] = useState('final');

  const finalTools = tools.filter(t => t.status !== 'blocked');
  const allowedTools = tools.filter(t => t.status === 'allowed');
  const preferredTools = tools.filter(t => t.status === 'preferred');
  const blockedTools = tools.filter(t => t.status === 'blocked');

  const renderToolList = (items: ToolItem[]) => (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2 p-1">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No tools in this category</p>
        ) : (
          items.map(tool => {
            const IconComponent = getIconComponent(tool.icon);
            const StatusIcon = statusConfig[tool.status].icon;
            
            return (
              <div
                key={tool.tool}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <IconComponent className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{tool.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={cn('text-[10px] px-1.5 py-0', sourceColors[tool.source])}
                    >
                      {tool.source}
                    </Badge>
                  </div>
                </div>
                
                <StatusIcon className={cn('h-4 w-4 shrink-0', statusConfig[tool.status].color)} />
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="hud-panel h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Final Tools</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Resolved tool permissions after all governance layers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start gap-1 px-4 pt-2 bg-transparent border-b border-border rounded-none h-auto">
          <TabsTrigger value="final" className="text-xs data-[state=active]:bg-primary/10">
            Final ({finalTools.length})
          </TabsTrigger>
          <TabsTrigger value="allowed" className="text-xs data-[state=active]:bg-primary/10">
            Allowed ({allowedTools.length})
          </TabsTrigger>
          <TabsTrigger value="preferred" className="text-xs data-[state=active]:bg-primary/10">
            Preferred ({preferredTools.length})
          </TabsTrigger>
          <TabsTrigger value="blocked" className="text-xs data-[state=active]:bg-primary/10">
            Blocked ({blockedTools.length})
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-4">
          <TabsContent value="final" className="mt-0 h-full">
            {renderToolList(finalTools)}
          </TabsContent>
          <TabsContent value="allowed" className="mt-0 h-full">
            {renderToolList(allowedTools)}
          </TabsContent>
          <TabsContent value="preferred" className="mt-0 h-full">
            {renderToolList(preferredTools)}
          </TabsContent>
          <TabsContent value="blocked" className="mt-0 h-full">
            {renderToolList(blockedTools)}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
