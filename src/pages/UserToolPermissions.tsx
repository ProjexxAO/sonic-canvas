import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToolPermissions } from '@/hooks/useToolPermissions';
import { UserContextPanel } from '@/components/permissions/UserContextPanel';
import { ToolFiltersBar } from '@/components/permissions/ToolFiltersBar';
import { ToolPermissionsBoard } from '@/components/permissions/ToolPermissionsBoard';
import { ToolDetailsDrawer } from '@/components/permissions/ToolDetailsDrawer';
import type { ToolSection, ToolItem } from '@/types/toolPermissions';

export default function UserToolPermissions() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { sections, loading, saving, savePermissions, refreshPermissions } = useToolPermissions();
  
  const [localSections, setLocalSections] = useState<ToolSection[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [autoInvokableOnly, setAutoInvokableOnly] = useState(false);

  useEffect(() => {
    setLocalSections(sections);
  }, [sections]);

  // Calculate changes count
  const changesCount = useMemo(() => {
    if (sections.length === 0 || localSections.length === 0) return 0;
    
    let changes = 0;
    sections.forEach((originalSection, sectionIndex) => {
      const localSection = localSections[sectionIndex];
      if (!localSection) return;
      
      originalSection.items.forEach(item => {
        const stillInSection = localSection.items.some(i => i.tool === item.tool);
        if (!stillInSection) changes++;
      });
    });
    return changes;
  }, [sections, localSections]);

  // Get all unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    localSections.forEach(section => {
      section.items.forEach(item => {
        if (item.metadata.category) cats.add(item.metadata.category);
      });
    });
    return Array.from(cats);
  }, [localSections]);

  // Filter sections
  const filteredSections = useMemo(() => {
    return localSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const matchesSearch = !searchQuery || 
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tool.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = !categoryFilter || 
          item.metadata.category === categoryFilter;
        
        const matchesAutoInvokable = !autoInvokableOnly || 
          item.metadata.autoInvokable === true;
        
        return matchesSearch && matchesCategory && matchesAutoInvokable;
      })
    }));
  }, [localSections, searchQuery, categoryFilter, autoInvokableOnly]);

  const handleSectionsChange = (newSections: ToolSection[]) => {
    setLocalSections(newSections);
  };

  const handleToolClick = (tool: ToolItem) => {
    setSelectedTool(tool);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    await savePermissions(localSections);
  };

  const handleDiscard = () => {
    setLocalSections(sections);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter(null);
    setAutoInvokableOnly(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">User Tool Permissions</h1>
              <p className="text-xs text-muted-foreground">Manage tool access and preferences</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {userId ? `User: ${userId.slice(0, 8)}...` : 'Current User'}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-6">
        {/* User Context Panel */}
        <UserContextPanel userId={userId} />

        {/* Filters Bar */}
        <ToolFiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          categories={categories}
          autoInvokableOnly={autoInvokableOnly}
          onAutoInvokableChange={setAutoInvokableOnly}
          onReset={handleResetFilters}
        />

        {/* Permissions Board */}
        <div className="flex-1 min-h-0">
          <ToolPermissionsBoard
            sections={filteredSections}
            allSections={localSections}
            onChange={handleSectionsChange}
            onToolClick={handleToolClick}
          />
        </div>

        {/* Footer Bar */}
        <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-4 -mx-4 px-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {changesCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {changesCount} unsaved {changesCount === 1 ? 'change' : 'changes'}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDiscard}
                disabled={changesCount === 0 || saving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={changesCount === 0 || saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </footer>
      </div>

      {/* Tool Details Drawer */}
      <ToolDetailsDrawer
        tool={selectedTool}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
