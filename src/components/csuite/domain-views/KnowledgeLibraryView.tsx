import { useState, useMemo } from 'react';
import { 
  BookOpen, 
  ArrowLeft, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Tag, 
  FolderOpen,
  X,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { KnowledgeItem, DomainItem } from '@/hooks/useCSuiteData';

interface KnowledgeLibraryViewProps {
  items: KnowledgeItem[];
  isLoading: boolean;
  onBack: () => void;
  onItemClick: (item: DomainItem) => void;
  onRefresh?: () => void;
}

const KNOWLEDGE_COLOR = 'hsl(220 70% 55%)';

export function KnowledgeLibraryView({
  items,
  isLoading,
  onBack,
  onItemClick,
  onRefresh,
}: KnowledgeLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  // Extract unique categories and tags from items
  const { categories, tags } = useMemo(() => {
    const categorySet = new Set<string>();
    const tagSet = new Set<string>();
    
    items.forEach(item => {
      if (item.category) categorySet.add(item.category);
      if (item.tags) item.tags.forEach(tag => tagSet.add(tag));
    });
    
    return {
      categories: Array.from(categorySet).sort(),
      tags: Array.from(tagSet).sort(),
    };
  }, [items]);

  // Filter items based on search, categories, and tags
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          item.title.toLowerCase().includes(query) ||
          (item.preview && item.preview.toLowerCase().includes(query)) ||
          (item.category && item.category.toLowerCase().includes(query)) ||
          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)));
        
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (selectedCategories.length > 0) {
        if (!item.category || !selectedCategories.includes(item.category)) {
          return false;
        }
      }
      
      // Tag filter
      if (selectedTags.length > 0) {
        if (!item.tags || !selectedTags.some(tag => item.tags?.includes(tag))) {
          return false;
        }
      }
      
      return true;
    });
  }, [items, searchQuery, selectedCategories, selectedTags]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedTags.length > 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
        </Button>
        <div 
          className="p-2 rounded"
          style={{ backgroundColor: `${KNOWLEDGE_COLOR}20` }}
        >
          <BookOpen size={16} style={{ color: KNOWLEDGE_COLOR }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Knowledge Library</h3>
          <p className="text-[10px] text-muted-foreground">
            {filteredItems.length} of {items.length} articles
          </p>
        </div>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRefresh}
            >
              <RefreshCw size={14} />
            </Button>
          )}
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('list')}
          >
            <List size={14} />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={14} />
          </Button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="px-3 py-2 border-b border-border bg-card/50 flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search articles, categories, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs font-mono bg-background"
          />
        </div>
        
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant={hasActiveFilters ? 'default' : 'outline'} 
              size="sm" 
              className="h-8 text-xs"
            >
              <Filter size={12} className="mr-1" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">
                  {selectedCategories.length + selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="end">
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Filters</span>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px]"
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>
            
            <ScrollArea className="max-h-80">
              {/* Categories */}
              {categories.length > 0 && (
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FolderOpen size={12} className="text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Categories
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {categories.map(category => (
                      <label
                        key={category}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                          className="h-3.5 w-3.5"
                        />
                        <span className="text-xs text-foreground group-hover:text-primary transition-colors">
                          {category}
                        </span>
                        <span className="text-[9px] text-muted-foreground ml-auto">
                          {items.filter(i => i.category === category).length}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags */}
              {tags.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag size={12} className="text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        className="text-[10px] cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {categories.length === 0 && tags.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-xs text-muted-foreground">No categories or tags found</p>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-[10px] text-muted-foreground">Active filters:</span>
          {selectedCategories.map(category => (
            <Badge
              key={`cat-${category}`}
              variant="secondary"
              className="text-[10px] gap-1 pr-1"
            >
              <FolderOpen size={10} />
              {category}
              <button
                onClick={() => toggleCategory(category)}
                className="ml-0.5 hover:bg-background/50 rounded-full p-0.5"
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
          {selectedTags.map(tag => (
            <Badge
              key={`tag-${tag}`}
              variant="outline"
              className="text-[10px] gap-1 pr-1"
            >
              <Tag size={10} />
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-0.5 hover:bg-background/50 rounded-full p-0.5"
              >
                <X size={10} />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] px-1.5"
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen size={48} className="text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || hasActiveFilters 
                ? 'No articles match your filters' 
                : 'No knowledge articles found'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 text-xs"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="p-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className="p-4 rounded-lg bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all text-left flex flex-col"
              >
                <div className="flex items-start gap-2 mb-2">
                  <BookOpen size={14} style={{ color: KNOWLEDGE_COLOR }} className="mt-0.5 shrink-0" />
                  <span className="text-xs font-medium text-foreground line-clamp-2 flex-1">
                    {item.title}
                  </span>
                </div>
                
                {item.category && (
                  <Badge variant="outline" className="text-[9px] w-fit mb-2">
                    {item.category}
                  </Badge>
                )}
                
                {item.preview && (
                  <p className="text-[10px] text-muted-foreground line-clamp-3 mb-3 flex-1">
                    {item.preview}
                  </p>
                )}
                
                <div className="mt-auto">
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.tags.slice(0, 3).map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-[8px] px-1.5 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <span className="text-[9px] text-muted-foreground">
                    {format(item.date, 'MMM d, yyyy')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => onItemClick(item)}
                className="w-full p-4 rounded-lg bg-card border border-border hover:border-primary/40 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2 rounded shrink-0"
                    style={{ backgroundColor: `${KNOWLEDGE_COLOR}15` }}
                  >
                    <BookOpen size={14} style={{ color: KNOWLEDGE_COLOR }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-foreground line-clamp-1">
                        {item.title}
                      </span>
                      {item.category && (
                        <Badge variant="secondary" className="text-[8px] shrink-0">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                    
                    {item.preview && (
                      <p className="text-[10px] text-muted-foreground/70 line-clamp-2 mt-1">
                        {item.preview}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[9px] text-muted-foreground">
                        {format(item.date, 'MMM d, yyyy')}
                      </span>
                      
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag size={10} className="text-muted-foreground" />
                          <div className="flex gap-1">
                            {item.tags.slice(0, 4).map(tag => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-[8px] px-1.5 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 4 && (
                              <span className="text-[8px] text-muted-foreground">
                                +{item.tags.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
