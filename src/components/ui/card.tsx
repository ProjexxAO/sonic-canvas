import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Card component with psychology-based enhancements:
 * - Subtle hover lift for interactive cards (Fitts's Law affordance)
 * - Smooth transitions following Doherty Threshold
 * - Optional interactive mode with enhanced feedback
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Enable hover interactions (lift, shadow) */
  interactive?: boolean;
  /** Add left accent border for visual hierarchy */
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'personal' | 'group' | 'csuite';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, accent, ...props }, ref) => {
    const accentClasses = {
      primary: 'border-l-4 border-l-primary',
      success: 'border-l-4 border-l-success',
      warning: 'border-l-4 border-l-warning',
      destructive: 'border-l-4 border-l-destructive',
      personal: 'border-l-4 border-l-[hsl(160_70%_45%)]',
      group: 'border-l-4 border-l-[hsl(200_70%_50%)]',
      csuite: 'border-l-4 border-l-[hsl(270_70%_55%)]',
    };
    
    return (
      <div 
        ref={ref} 
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          "transition-all duration-200 ease-out",
          interactive && [
            "cursor-pointer",
            "hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30",
            "active:translate-y-0 active:shadow-sm",
          ],
          accent && accentClasses[accent],
          className
        )} 
        {...props} 
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
