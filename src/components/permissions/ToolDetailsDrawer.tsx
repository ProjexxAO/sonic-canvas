import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Zap, Tag, AlertTriangle, Shield, Info } from 'lucide-react';
import { getIconComponent } from '@/lib/iconUtils';
import type { ToolItem } from '@/types/toolPermissions';
import { cn } from '@/lib/utils';

interface ToolDetailsDrawerProps {
  tool: ToolItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToolDetailsDrawer({ tool, open, onOpenChange }: ToolDetailsDrawerProps) {
  if (!tool) return null;

  const ToolIcon = getIconComponent(tool.icon);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <ToolIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle>{tool.label}</SheetTitle>
              <SheetDescription className="text-xs font-mono">
                {tool.tool}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Category & Auto Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {tool.metadata.category && (
              <Badge variant="secondary">{tool.metadata.category}</Badge>
            )}
            {tool.metadata.autoInvokable && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/5">
                <Zap className="h-3 w-3 mr-1" />
                Auto-Invokable
              </Badge>
            )}
            {tool.metadata.boost && (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/5">
                Boost: +{tool.metadata.boost}
              </Badge>
            )}
          </div>

          {/* Description */}
          {tool.metadata.description && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Description
              </h4>
              <p className="text-sm text-muted-foreground">
                {tool.metadata.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Capabilities */}
          {tool.metadata.capabilities && tool.metadata.capabilities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Capabilities
              </h4>
              <div className="flex flex-wrap gap-2">
                {tool.metadata.capabilities.map((cap, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {cap.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tool.metadata.tags && tool.metadata.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {tool.metadata.tags.map((tag, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className={cn(
                      'text-xs',
                      tag === 'high-risk' && 'bg-red-500/10 text-red-500 border-red-500/30',
                      tag === 'regulated' && 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    )}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reason (if blocked) */}
          {tool.metadata.reason && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
                Constraint Reason
              </h4>
              <p className="text-sm text-muted-foreground bg-amber-500/5 p-3 rounded-md border border-amber-500/20">
                {tool.metadata.reason}
              </p>
            </div>
          )}

          <Separator />

          {/* Governance Hints */}
          <div>
            <h4 className="text-sm font-medium mb-3">Governance</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-muted-foreground mb-1">Risk Level</p>
                <p className="font-medium">
                  {tool.metadata.tags?.includes('high-risk') ? 'High' : 'Standard'}
                </p>
              </div>
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-muted-foreground mb-1">Invocation</p>
                <p className="font-medium">
                  {tool.metadata.autoInvokable ? 'Automatic' : 'Manual'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
