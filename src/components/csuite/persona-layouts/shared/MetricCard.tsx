import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MetricCardProps } from '../types';

export function MetricCard({ label, value, icon, trend, color }: MetricCardProps) {
  const trendIcon = trend === 'up' ? (
    <TrendingUp size={10} className="text-green-500" />
  ) : trend === 'down' ? (
    <TrendingDown size={10} className="text-red-500" />
  ) : trend === 'neutral' ? (
    <Minus size={10} className="text-muted-foreground" />
  ) : null;

  return (
    <div className="p-2 rounded bg-muted/30 border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[9px] font-mono text-muted-foreground uppercase">{label}</span>
        {trendIcon}
      </div>
      <div 
        className="text-lg font-mono"
        style={{ color: color || 'hsl(var(--primary))' }}
      >
        {value}
      </div>
    </div>
  );
}
