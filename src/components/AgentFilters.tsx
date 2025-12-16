// Atlas Sonic OS - Agent Filters Component

import { AgentSector, AgentStatus, AgentClass } from '@/lib/agentTypes';
import { Filter, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const SECTORS: AgentSector[] = ['FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY'];
const STATUSES: AgentStatus[] = ['IDLE', 'ACTIVE', 'PROCESSING', 'ERROR', 'DORMANT'];
const CLASSES: AgentClass[] = ['BASIC', 'ADVANCED', 'ELITE', 'SINGULARITY'];

const sectorColors: Record<AgentSector, string> = {
  FINANCE: '#00ff88',
  BIOTECH: '#ff6b9d',
  SECURITY: '#ff4444',
  DATA: '#00d4ff',
  CREATIVE: '#a855f7',
  UTILITY: '#ffa500',
};

export interface AgentFiltersState {
  sector: AgentSector | 'ALL';
  status: AgentStatus | 'ALL';
  class: AgentClass | 'ALL';
}

interface AgentFiltersProps {
  filters: AgentFiltersState;
  onFiltersChange: (filters: AgentFiltersState) => void;
  totalCount: number;
  filteredCount: number;
}

export default function AgentFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: AgentFiltersProps) {
  const hasFilters = filters.sector !== 'ALL' || filters.status !== 'ALL' || filters.class !== 'ALL';

  const clearFilters = () => {
    onFiltersChange({ sector: 'ALL', status: 'ALL', class: 'ALL' });
  };

  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Filter size={12} className="text-primary" />
        <span className="font-mono">FILTERS</span>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
            onClick={clearFilters}
          >
            <X size={10} className="mr-0.5" /> Clear
          </Button>
        )}
        <span className="ml-auto">
          {filteredCount.toLocaleString()} / {totalCount.toLocaleString()}
        </span>
      </div>

      <div className="flex gap-2">
        {/* Sector Filter */}
        <Select
          value={filters.sector}
          onValueChange={(value) => onFiltersChange({ ...filters, sector: value as AgentSector | 'ALL' })}
        >
          <SelectTrigger className="h-7 text-[10px] flex-1 bg-card border-border">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All Sectors</SelectItem>
            {SECTORS.map((sector) => (
              <SelectItem key={sector} value={sector} className="text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: sectorColors[sector] }}
                  />
                  {sector}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as AgentStatus | 'ALL' })}
        >
          <SelectTrigger className="h-7 text-[10px] flex-1 bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All Status</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status} className="text-xs">
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Class Filter */}
        <Select
          value={filters.class}
          onValueChange={(value) => onFiltersChange({ ...filters, class: value as AgentClass | 'ALL' })}
        >
          <SelectTrigger className="h-7 text-[10px] flex-1 bg-card border-border">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="text-xs">All Classes</SelectItem>
            {CLASSES.map((cls) => (
              <SelectItem key={cls} value={cls} className="text-xs">
                {cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
