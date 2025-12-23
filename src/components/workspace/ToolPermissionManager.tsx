import { useState, useCallback } from 'react';
import { 
  TrendingUp, 
  ShieldAlert, 
  Star, 
  Route, 
  MessageCircle,
  BarChart3,
  GripVertical,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ToolItem {
  tool: string;
  label: string;
  icon: string;
  metadata: {
    autoInvokable?: boolean;
    category?: string;
    reason?: string;
    boost?: number;
  };
}

interface ToolSection {
  id: string;
  title: string;
  description: string;
  droppable: boolean;
  items: ToolItem[];
}

interface ToolPermissionManagerProps {
  userName?: string;
  userRole?: string;
  sections: ToolSection[];
  onSectionsChange?: (sections: ToolSection[]) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'chart-line': BarChart3,
  'trending-up': TrendingUp,
  'shield-alert': ShieldAlert,
  'star': Star,
  'route': Route,
  'message-circle': MessageCircle,
};

const sectionStyles: Record<string, { border: string; bg: string; accent: string }> = {
  allowed: { 
    border: 'border-emerald-500/30', 
    bg: 'bg-emerald-500/5', 
    accent: 'text-emerald-400' 
  },
  blocked: { 
    border: 'border-red-500/30', 
    bg: 'bg-red-500/5', 
    accent: 'text-red-400' 
  },
  preferred: { 
    border: 'border-amber-500/30', 
    bg: 'bg-amber-500/5', 
    accent: 'text-amber-400' 
  },
  available: { 
    border: 'border-muted-foreground/30', 
    bg: 'bg-muted/5', 
    accent: 'text-muted-foreground' 
  },
};

export function ToolPermissionManager({ 
  userName = 'User',
  userRole = 'Analyst',
  sections: initialSections,
  onSectionsChange 
}: ToolPermissionManagerProps) {
  const [sections, setSections] = useState<ToolSection[]>(initialSections);
  const [draggedItem, setDraggedItem] = useState<{ item: ToolItem; fromSection: string } | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    allowed: true,
    blocked: true,
    preferred: true,
    available: true,
  });

  const handleDragStart = useCallback((item: ToolItem, sectionId: string) => {
    setDraggedItem({ item, fromSection: sectionId });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    setDragOverSection(sectionId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSection(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toSectionId: string) => {
    e.preventDefault();
    setDragOverSection(null);

    if (!draggedItem || draggedItem.fromSection === toSectionId) {
      setDraggedItem(null);
      return;
    }

    const newSections = sections.map(section => {
      if (section.id === draggedItem.fromSection) {
        return {
          ...section,
          items: section.items.filter(item => item.tool !== draggedItem.item.tool)
        };
      }
      if (section.id === toSectionId) {
        // Check if item already exists in target section
        const exists = section.items.some(item => item.tool === draggedItem.item.tool);
        if (exists) return section;
        return {
          ...section,
          items: [...section.items, draggedItem.item]
        };
      }
      return section;
    });

    setSections(newSections);
    onSectionsChange?.(newSections);
    setDraggedItem(null);
  }, [draggedItem, sections, onSectionsChange]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="space-y-4">
      {/* User Header */}
      <div className="flex items-center gap-3 px-1 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary font-mono text-sm">
            {userName.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{userName}</h3>
          <p className="text-xs text-muted-foreground font-mono">{userRole}</p>
        </div>
      </div>

      {/* Permission Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map(section => {
          const style = sectionStyles[section.id] || sectionStyles.available;
          const isExpanded = expandedSections[section.id];
          const isDragOver = dragOverSection === section.id;

          return (
            <Collapsible 
              key={section.id} 
              open={isExpanded} 
              onOpenChange={() => toggleSection(section.id)}
            >
              <Card 
                className={cn(
                  'transition-all duration-200 border',
                  style.border,
                  style.bg,
                  isDragOver && 'ring-2 ring-primary/50 scale-[1.02]'
                )}
                onDragOver={(e) => handleDragOver(e, section.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, section.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-background/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <CardTitle className={cn('text-sm font-mono uppercase tracking-wider', style.accent)}>
                          {section.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-mono">
                          {section.items.length}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-xs ml-6">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-2 min-h-[60px]">
                      {section.items.length === 0 ? (
                        <div className="text-xs text-muted-foreground/50 text-center py-4 border border-dashed border-muted-foreground/20 rounded-md">
                          Drop tools here
                        </div>
                      ) : (
                        section.items.map(item => {
                          const IconComponent = iconMap[item.icon] || BarChart3;
                          return (
                            <div
                              key={item.tool}
                              draggable
                              onDragStart={() => handleDragStart(item, section.id)}
                              className={cn(
                                'group flex items-center gap-3 p-2 rounded-md',
                                'bg-background/50 border border-border/50',
                                'hover:bg-background/80 hover:border-border',
                                'cursor-grab active:cursor-grabbing transition-all',
                                draggedItem?.item.tool === item.tool && 'opacity-50'
                              )}
                            >
                              <GripVertical className="h-3 w-3 text-muted-foreground/50 group-hover:text-muted-foreground" />
                              <div className={cn('p-1.5 rounded', style.bg)}>
                                <IconComponent className={cn('h-4 w-4', style.accent)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {item.label}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {item.metadata.category}
                                  </span>
                                  {item.metadata.autoInvokable && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                      AUTO
                                    </Badge>
                                  )}
                                  {item.metadata.boost && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                      +{item.metadata.boost}
                                    </Badge>
                                  )}
                                  {item.metadata.reason && (
                                    <span className="text-[10px] text-red-400/70 truncate">
                                      {item.metadata.reason}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
