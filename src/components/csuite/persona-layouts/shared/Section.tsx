import { SectionProps } from '../types';
import { cn } from '@/lib/utils';

export function Section({ title, icon, children, className }: SectionProps) {
  return (
    <div className={cn("p-2 rounded bg-background border border-border", className)}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-mono text-muted-foreground uppercase">{title}</span>
      </div>
      {children}
    </div>
  );
}
