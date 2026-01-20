import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  Zap, 
  ChevronRight,
  Server,
  Headphones,
  Code,
  Truck,
  Users,
  DollarSign,
  Megaphone,
  Shield,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  WorkflowTemplate, 
  WORKFLOW_TEMPLATES, 
  TEMPLATE_CATEGORIES,
  searchTemplates,
  getTemplatesByCategory 
} from '@/lib/workflowTemplates';

interface WorkflowTemplateGalleryProps {
  onSelectTemplate: (template: WorkflowTemplate) => void;
  onClose?: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  it_operations: Server,
  customer_service: Headphones,
  software_engineering: Code,
  supply_chain: Truck,
  hr_operations: Users,
  finance: DollarSign,
  marketing: Megaphone,
  security: Shield,
};

const COMPLEXITY_CONFIG = {
  simple: { label: 'Simple', color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
  moderate: { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/20' },
  advanced: { label: 'Advanced', color: 'text-red-500', bg: 'bg-red-500/20' },
};

export function WorkflowTemplateGallery({
  onSelectTemplate,
  onClose,
}: WorkflowTemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    let templates = WORKFLOW_TEMPLATES;

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = getTemplatesByCategory(selectedCategory as WorkflowTemplate['category']);
    }

    // Filter by search
    if (searchQuery.trim()) {
      templates = searchTemplates(searchQuery).filter(t => 
        selectedCategory === 'all' || t.category === selectedCategory
      );
    }

    return templates;
  }, [searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: WORKFLOW_TEMPLATES.length };
    WORKFLOW_TEMPLATES.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Workflow Templates</h2>
          </div>
          <Badge variant="secondary">
            {filteredTemplates.length} templates
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>

        {/* Category Tabs */}
        <ScrollArea className="w-full">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="h-8 bg-transparent p-0 gap-1">
              <TabsTrigger 
                value="all" 
                className="h-7 px-3 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All ({categoryCounts.all})
              </TabsTrigger>
              {TEMPLATE_CATEGORIES.map(cat => {
                const Icon = CATEGORY_ICONS[cat.id];
                return (
                  <TabsTrigger 
                    key={cat.id}
                    value={cat.id}
                    className="h-7 px-3 text-xs gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon size={12} />
                    {cat.label}
                    <span className="text-[10px] opacity-70">
                      ({categoryCounts[cat.id] || 0})
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </ScrollArea>
      </div>

      {/* Template Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-muted-foreground">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p>No templates found matching your search</p>
            </div>
          ) : (
            filteredTemplates.map((template) => {
              const CategoryIcon = CATEGORY_ICONS[template.category] || Zap;
              const complexityConfig = COMPLEXITY_CONFIG[template.complexity];
              const categoryMeta = TEMPLATE_CATEGORIES.find(c => c.id === template.category);
              const isHovered = hoveredTemplate === template.id;

              return (
                <Card
                  key={template.id}
                  className={cn(
                    'cursor-pointer transition-all duration-200 group',
                    'hover:border-primary/50 hover:shadow-md',
                    isHovered && 'ring-1 ring-primary'
                  )}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  onClick={() => onSelectTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${categoryMeta?.color || '#888'}20` }}
                      >
                        <CategoryIcon 
                          size={20} 
                          style={{ color: categoryMeta?.color || '#888' }} 
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge 
                          variant="outline" 
                          className={cn('text-[10px]', complexityConfig.color)}
                        >
                          {complexityConfig.label}
                        </Badge>
                        <ChevronRight 
                          size={16} 
                          className={cn(
                            'text-muted-foreground transition-transform',
                            'group-hover:translate-x-1 group-hover:text-primary'
                          )} 
                        />
                      </div>
                    </div>
                    <CardTitle className="text-sm mt-2">{template.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 4).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] py-0">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 4 && (
                        <Badge variant="secondary" className="text-[10px] py-0">
                          +{template.tags.length - 4}
                        </Badge>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{template.estimatedSetupTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{template.nodes.length} nodes</span>
                        <span>•</span>
                        <span>{template.connections.length} connections</span>
                      </div>
                    </div>

                    {/* Required Integrations */}
                    {template.requiredIntegrations && template.requiredIntegrations.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Filter size={10} />
                        <span>Requires: {template.requiredIntegrations.join(', ')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {onClose && (
        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
