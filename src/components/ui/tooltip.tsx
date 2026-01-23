import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

/**
 * Tooltip system with psychology-based enhancements:
 * - Delayed appearance reduces cognitive noise (Hick's Law)
 * - Smooth animations for natural feel
 * - Variant support for different contexts
 */

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  /** Visual variant */
  variant?: 'default' | 'info' | 'warning' | 'success';
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, variant = 'default', ...props }, ref) => {
  const variantClasses = {
    default: 'bg-popover text-popover-foreground border',
    info: 'bg-info/95 text-white border-info/50',
    warning: 'bg-warning/95 text-white border-warning/50',
    success: 'bg-success/95 text-white border-success/50',
  };

  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        [
          "z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm shadow-md",
          // Smooth entrance animation
          "animate-in fade-in-0 zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          // Slide based on position
          "data-[side=bottom]:slide-in-from-top-2",
          "data-[side=left]:slide-in-from-right-2",
          "data-[side=right]:slide-in-from-left-2",
          "data-[side=top]:slide-in-from-bottom-2",
        ].join(" "),
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/** Convenience wrapper for simple text tooltips */
function SimpleTooltip({ 
  children, 
  content, 
  side = 'top',
  variant = 'default',
}: { 
  children: React.ReactNode; 
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'info' | 'warning' | 'success';
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} variant={variant}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, SimpleTooltip };
