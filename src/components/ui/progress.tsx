import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

/**
 * Progress component with psychology-based enhancements:
 * - Zeigarnik Effect: Incomplete progress creates drive to complete
 * - Smooth animation following Doherty Threshold
 * - Color variants for semantic meaning
 */

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Color variant based on context */
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'ai';
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Show percentage label */
  showLabel?: boolean;
  /** Animate the bar with subtle pulse when loading */
  indeterminate?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = 'default', size = 'default', showLabel, indeterminate, ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-1.5',
    default: 'h-2.5',
    lg: 'h-4',
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    ai: 'bg-gradient-to-r from-primary via-primary-glow to-primary animate-shimmer',
  };

  return (
    <div className="relative w-full">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted/50",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full flex-1 transition-all duration-500 ease-out rounded-full",
            variantClasses[variant],
            indeterminate && "animate-shimmer"
          )}
          style={{ 
            width: indeterminate ? '40%' : `${value || 0}%`,
            ...(indeterminate && { animation: 'shimmer 1.5s ease-in-out infinite' })
          }}
        />
      </ProgressPrimitive.Root>
      {showLabel && !indeterminate && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground ml-2">
          {Math.round(value || 0)}%
        </span>
      )}
    </div>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
