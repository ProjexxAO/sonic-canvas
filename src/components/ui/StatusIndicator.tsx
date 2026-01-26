// StatusIndicator - Reusable status/risk indicator component
// Implements color-coded compliance from Lovable spec

import { cn } from '@/lib/utils';

export type StatusLevel = 'success' | 'active' | 'warning' | 'error' | 'neutral' | 'info';

interface StatusIndicatorProps {
  status: StatusLevel;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  pulse?: boolean;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3'
};

const STATUS_COLORS: Record<StatusLevel, string> = {
  success: 'bg-emerald-500',
  active: 'bg-blue-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  neutral: 'bg-muted-foreground',
  info: 'bg-sky-500'
};

const STATUS_LABELS: Record<StatusLevel, string> = {
  success: 'Complete',
  active: 'Active',
  warning: 'Attention',
  error: 'Error',
  neutral: 'Idle',
  info: 'Info'
};

export function StatusIndicator({ 
  status, 
  size = 'sm', 
  pulse = false, 
  label,
  showLabel = false,
  className 
}: StatusIndicatorProps) {
  const displayLabel = label || STATUS_LABELS[status];

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div 
        className={cn(
          'rounded-full',
          SIZE_CLASSES[size],
          STATUS_COLORS[status],
          pulse && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className="text-[10px] text-muted-foreground">
          {displayLabel}
        </span>
      )}
    </div>
  );
}

// Badge variant for larger displays
interface StatusBadgeProps {
  status: StatusLevel;
  label?: string;
  className?: string;
}

const BADGE_COLORS: Record<StatusLevel, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  active: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  neutral: 'bg-muted text-muted-foreground border-border',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const displayLabel = label || STATUS_LABELS[status];

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border',
      BADGE_COLORS[status],
      className
    )}>
      <StatusIndicator status={status} size="xs" />
      {displayLabel}
    </div>
  );
}

// Risk level variant for compliance displays
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskIndicatorProps {
  level: RiskLevel;
  showLabel?: boolean;
  className?: string;
}

const RISK_TO_STATUS: Record<RiskLevel, StatusLevel> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'error'
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical'
};

export function RiskIndicator({ level, showLabel = true, className }: RiskIndicatorProps) {
  return (
    <StatusIndicator
      status={RISK_TO_STATUS[level]}
      label={RISK_LABELS[level]}
      showLabel={showLabel}
      pulse={level === 'critical'}
      className={className}
    />
  );
}
