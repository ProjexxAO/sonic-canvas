import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button variants with psychology-based micro-interactions:
 * - Press feedback (Doherty Threshold: <100ms response)
 * - Hover lift for affordance signaling
 * - Focus glow for accessibility
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "ring-offset-background transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    // Micro-interactions
    "active:scale-[0.98] active:transition-transform active:duration-75",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md",
          "focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.3)]",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90 hover:-translate-y-0.5",
          "focus-visible:shadow-[0_0_0_3px_hsl(var(--destructive)/0.3)]",
        ].join(" "),
        outline: [
          "border border-input bg-background",
          "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 hover:-translate-y-0.5",
        ].join(" "),
        ghost: [
          "hover:bg-accent hover:text-accent-foreground",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline active:scale-100",
        // New AI-themed variant
        ai: [
          "bg-gradient-to-r from-primary via-primary-glow to-primary",
          "text-primary-foreground",
          "hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5",
          "animate-glow-pulse",
        ].join(" "),
        // Success action variant
        success: [
          "bg-success text-success-foreground",
          "hover:bg-success/90 hover:-translate-y-0.5",
          "focus-visible:shadow-[0_0_0_3px_hsl(var(--success)/0.3)]",
        ].join(" "),
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        xl: "h-12 rounded-lg px-10 text-base font-semibold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Show loading state with subtle animation */
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span 
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
