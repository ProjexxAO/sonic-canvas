import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input component with psychology-based enhancements:
 * - Focus glow for clear affordance (Von Restorff Effect)
 * - Smooth transitions for a polished feel
 * - Optional success/error states with visual feedback
 */

export interface InputProps extends React.ComponentProps<"input"> {
  /** Visual state for validation feedback */
  state?: 'default' | 'success' | 'error';
  /** Show subtle glow on focus */
  focusGlow?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, state = 'default', focusGlow = true, ...props }, ref) => {
    const stateClasses = {
      default: '',
      success: 'border-success focus-visible:ring-success/40',
      error: 'border-destructive focus-visible:ring-destructive/40',
    };

    return (
      <input
        type={type}
        className={cn(
          [
            "flex h-10 w-full rounded-md border border-input bg-background",
            "px-3 py-2 text-base ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground",
            "transition-all duration-200 ease-out",
            // Focus states with glow
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            focusGlow && "focus-visible:shadow-[0_0_15px_hsl(var(--primary)/0.15)]",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50",
            "md:text-sm",
          ].join(" "),
          stateClasses[state],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
