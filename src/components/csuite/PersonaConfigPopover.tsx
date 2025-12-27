import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type ReportDepth = 'brief' | 'standard' | 'detailed';

export interface PersonaConfig {
  focusAreas: string[];
  depth: ReportDepth;
}

interface PersonaConfigPopoverProps {
  personaId: string;
  availableFocusAreas: string[];
  config: PersonaConfig;
  onConfigChange: (personaId: string, config: PersonaConfig) => void;
}

const DEPTH_OPTIONS: { value: ReportDepth; label: string; description: string }[] = [
  { value: 'brief', label: 'Brief', description: '2-3 key points' },
  { value: 'standard', label: 'Standard', description: 'Full briefing' },
  { value: 'detailed', label: 'Detailed', description: 'Deep analysis' },
];

export function PersonaConfigPopover({
  personaId,
  availableFocusAreas,
  config,
  onConfigChange,
}: PersonaConfigPopoverProps) {
  const [open, setOpen] = useState(false);

  const toggleFocusArea = (area: string) => {
    const newAreas = config.focusAreas.includes(area)
      ? config.focusAreas.filter(a => a !== area)
      : [...config.focusAreas, area];
    
    onConfigChange(personaId, { ...config, focusAreas: newAreas });
  };

  const setDepth = (depth: ReportDepth) => {
    onConfigChange(personaId, { ...config, depth });
  };

  const selectAll = () => {
    onConfigChange(personaId, { ...config, focusAreas: [...availableFocusAreas] });
  };

  const clearAll = () => {
    onConfigChange(personaId, { ...config, focusAreas: [] });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <Settings2 size={12} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          {/* Depth Selection */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-mono text-muted-foreground">REPORT DEPTH</Label>
            <Select value={config.depth} onValueChange={(v) => setDepth(v as ReportDepth)}>
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPTH_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-[11px]">
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-muted-foreground ml-1">— {opt.description}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Focus Areas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-mono text-muted-foreground">FOCUS AREAS</Label>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 px-1 text-[9px]"
                  onClick={selectAll}
                >
                  All
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-4 px-1 text-[9px]"
                  onClick={clearAll}
                >
                  None
                </Button>
              </div>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {availableFocusAreas.map(area => (
                <div key={area} className="flex items-center gap-2">
                  <Checkbox
                    id={`${personaId}-${area}`}
                    checked={config.focusAreas.includes(area)}
                    onCheckedChange={() => toggleFocusArea(area)}
                    className="h-3 w-3"
                  />
                  <Label 
                    htmlFor={`${personaId}-${area}`} 
                    className="text-[10px] font-normal cursor-pointer capitalize"
                  >
                    {area.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="pt-2 border-t border-border">
            <p className="text-[9px] text-muted-foreground">
              {config.focusAreas.length} of {availableFocusAreas.length} areas selected
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
