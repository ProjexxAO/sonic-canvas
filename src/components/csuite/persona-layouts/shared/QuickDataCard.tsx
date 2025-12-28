import { LucideIcon } from 'lucide-react';

interface QuickDataCardProps {
  label: string;
  count: number;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

export function QuickDataCard({ label, count, icon: Icon, color, onClick }: QuickDataCardProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded bg-background border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left group hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} style={{ color }} />
        <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
      </div>
      <span className="text-lg font-mono text-foreground group-hover:text-primary transition-colors">
        {count}
      </span>
    </button>
  );
}
