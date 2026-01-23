import { cn } from "@/lib/utils";

/**
 * Skeleton component with psychology-based loading animation:
 * - Shimmer effect creates anticipation (better than static gray)
 * - Reduces perceived wait time
 * - Multiple shape variants for realistic placeholders
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant */
  variant?: 'default' | 'circular' | 'text' | 'title' | 'card';
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'wave';
}

function Skeleton({ 
  className, 
  variant = 'default', 
  animation = 'shimmer',
  ...props 
}: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full aspect-square',
    text: 'rounded h-4 w-3/4',
    title: 'rounded h-6 w-1/2',
    card: 'rounded-lg h-32',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'loading-shimmer',
    wave: 'animate-pulse-subtle',
  };

  return (
    <div 
      className={cn(
        "bg-muted/60",
        variantClasses[variant],
        animationClasses[animation],
        className
      )} 
      {...props} 
    />
  );
}

/** Pre-built skeleton patterns for common use cases */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 space-y-3", className)}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Skeleton variant="circular" className="w-10 h-10" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAvatar key={i} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonAvatar, SkeletonList };
