import { useState } from 'react';
import { 
  Layout, 
  Columns2, 
  Columns3, 
  Square, 
  Sparkles, 
  Plus, 
  Settings2,
  LayoutGrid,
  Briefcase,
  Target,
  Zap,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  LayoutPreset, 
  WIDGET_CATALOG, 
  WidgetType,
  AtlasArrangementFilter 
} from '@/hooks/usePersonalDashboard';
import { useTheme } from 'next-themes';

interface DashboardCustomizerProps {
  columns: 1 | 2 | 3;
  currentPreset: LayoutPreset;
  atlasFilter: AtlasArrangementFilter;
  onColumnsChange: (columns: 1 | 2 | 3) => void;
  onPresetChange: (preset: LayoutPreset) => void;
  onAtlasFilterChange: (filter: AtlasArrangementFilter) => void;
  onAddWidget: (type: WidgetType) => void;
  onAtlasArrange: () => void;
}

const PRESETS: { value: LayoutPreset; label: string; icon: typeof Layout; description: string }[] = [
  { value: 'default', label: 'Default', icon: LayoutGrid, description: 'Balanced overview of all your data' },
  { value: 'productivity', label: 'Productivity', icon: Target, description: 'Focus on tasks and goals' },
  { value: 'finance', label: 'Finance', icon: Briefcase, description: 'Banking and spending focus' },
  { value: 'minimal', label: 'Minimal', icon: Square, description: 'Clean, distraction-free view' },
];

export function DashboardCustomizer({
  columns,
  currentPreset,
  atlasFilter,
  onColumnsChange,
  onPresetChange,
  onAtlasFilterChange,
  onAddWidget,
  onAtlasArrange
}: DashboardCustomizerProps) {
  const { theme } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm border mb-6",
      theme === 'dark' ? "bg-card/40 border-border/30" : "bg-white/60 border-border/20"
    )}>
      {/* Layout Presets */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">
              {PRESETS.find(p => p.value === currentPreset)?.label || 'Layout'}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Dashboard Presets</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PRESETS.map(preset => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => onPresetChange(preset.value)}
              className="flex items-start gap-3 p-3"
            >
              <preset.icon className="h-4 w-4 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">{preset.label}</p>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              </div>
              {currentPreset === preset.value && (
                <Badge variant="default" className="ml-auto text-[10px]">Active</Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Column Selector */}
      <div className="flex items-center gap-1 border rounded-lg p-1">
        {([1, 2, 3] as const).map(col => (
          <Button
            key={col}
            variant={columns === col ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onColumnsChange(col)}
          >
            {col === 1 ? <Square className="h-3 w-3" /> : 
             col === 2 ? <Columns2 className="h-3 w-3" /> : 
             <Columns3 className="h-3 w-3" />}
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Add Widget */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Widget</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Add Widget</SheetTitle>
            <SheetDescription>
              Choose a widget to add to your dashboard
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
            <div className="space-y-6">
              {WIDGET_CATALOG.map(category => (
                <div key={category.category}>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                    {category.category}
                  </h3>
                  <div className="grid gap-2">
                    {category.widgets.map(widget => (
                      <Card 
                        key={widget.type}
                        className={cn(
                          "cursor-pointer transition-all hover:scale-[1.01]",
                          theme === 'dark' ? "hover:bg-muted/20" : "hover:bg-muted/40"
                        )}
                        onClick={() => {
                          onAddWidget(widget.type);
                          setSheetOpen(false);
                        }}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{widget.title}</p>
                            <p className="text-xs text-muted-foreground">{widget.description}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {widget.defaultSize}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* Atlas Auto-Arrange */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-primary to-purple-500">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Atlas Arrange</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Atlas Auto-Arrange
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="p-3 space-y-4">
            <div>
              <label className="text-xs font-medium mb-2 block">Priority</label>
              <Select
                value={atlasFilter.priority}
                onValueChange={(value) => onAtlasFilterChange({ ...atlasFilter, priority: value as any })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smart">Smart (Recommended)</SelectItem>
                  <SelectItem value="data">Data Priority</SelectItem>
                  <SelectItem value="time">Time-Based</SelectItem>
                  <SelectItem value="category">Category Grouping</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-2 block">Focus Area</label>
              <Select
                value={atlasFilter.focusArea || 'all'}
                onValueChange={(value) => onAtlasFilterChange({ ...atlasFilter, focusArea: value as any })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="health">Health & Wellness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full gap-2" 
              onClick={() => {
                onAtlasArrange();
              }}
            >
              <Zap className="h-4 w-4" />
              Apply Atlas Arrangement
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
