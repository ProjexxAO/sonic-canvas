import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge component with psychology-based variants:
 * - Status badges for quick visual scanning (Gestalt - similarity)
 * - Hub-specific variants for context awareness
 * - Animated variants for attention (use sparingly per Von Restorff)
 */

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
    "transition-all duration-150 ease-out",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Status variants for semantic meaning
        success: "border-transparent bg-success/15 text-success hover:bg-success/25",
        warning: "border-transparent bg-warning/15 text-warning hover:bg-warning/25",
        info: "border-transparent bg-info/15 text-info hover:bg-info/25",
        // Hub-specific variants
        personal: "border-transparent bg-[hsl(160_70%_45%/0.15)] text-[hsl(160_70%_35%)] dark:text-[hsl(160_70%_55%)]",
        group: "border-transparent bg-[hsl(200_70%_50%/0.15)] text-[hsl(200_70%_40%)] dark:text-[hsl(200_70%_60%)]",
        csuite: "border-transparent bg-[hsl(270_70%_55%/0.15)] text-[hsl(270_70%_45%)] dark:text-[hsl(270_70%_65%)]",
        // AI/Premium indicator
        ai: [
          "border-transparent",
          "bg-gradient-to-r from-primary/20 to-primary-glow/20",
          "text-primary dark:text-primary-glow",
        ].join(" "),
        // Animated attention badge (use sparingly)
        attention: [
          "border-transparent bg-destructive/15 text-destructive",
          "animate-pulse-subtle",
        ].join(" "),
        // Muted/subtle variant
        muted: "border-border/50 bg-muted/50 text-muted-foreground",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface BadgeProps 
  extends React.HTMLAttributes<HTMLDivElement>, 
  VariantProps<typeof badgeVariants> {
  /** Add dot indicator before text */
  dot?: boolean;
  /** Dot color (defaults to current text color) */
  dotColor?: string;
}

function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span 
          className="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
          style={{ backgroundColor: dotColor || 'currentColor' }}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
