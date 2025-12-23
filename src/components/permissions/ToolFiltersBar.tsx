import { Search, X, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ToolFiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string | null;
  onCategoryChange: (value: string | null) => void;
  categories: string[];
  autoInvokableOnly: boolean;
  onAutoInvokableChange: (value: boolean) => void;
  onReset: () => void;
}

export function ToolFiltersBar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  autoInvokableOnly,
  onAutoInvokableChange,
  onReset
}: ToolFiltersBarProps) {
  const hasActiveFilters = searchQuery || categoryFilter || autoInvokableOnly;

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-card/50 border border-border/50">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange('')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <Select 
        value={categoryFilter || 'all'} 
        onValueChange={(v) => onCategoryChange(v === 'all' ? null : v)}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map(cat => (
            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Auto-Invokable Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="auto-invokable"
          checked={autoInvokableOnly}
          onCheckedChange={onAutoInvokableChange}
        />
        <Label htmlFor="auto-invokable" className="flex items-center gap-1.5 text-sm cursor-pointer">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Auto only
        </Label>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}
