import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/**
 * Switch component with psychology-based enhancements:
 * - Clear visual feedback for state change
 * - Smooth transition following Doherty Threshold
 * - Subtle glow for active state
 */

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = 'default', ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-5 w-9',
    default: 'h-6 w-11',
    lg: 'h-7 w-14',
  };

  const thumbSizes = {
    sm: 'h-4 w-4 data-[state=checked]:translate-x-4',
    default: 'h-5 w-5 data-[state=checked]:translate-x-5',
    lg: 'h-6 w-6 data-[state=checked]:translate-x-7',
  };

  return (
    <SwitchPrimitives.Root
      className={cn(
        [
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full",
          "border-2 border-transparent transition-all duration-200",
          // Unchecked state
          "data-[state=unchecked]:bg-input",
          // Checked state with glow
          "data-[state=checked]:bg-primary data-[state=checked]:shadow-[0_0_8px_hsl(var(--primary)/0.4)]",
          // Focus state
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" "),
        sizeClasses[size],
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          [
            "pointer-events-none block rounded-full bg-background shadow-lg ring-0",
            "transition-all duration-200",
            "data-[state=unchecked]:translate-x-0",
            // Add subtle scale effect on toggle
            "data-[state=checked]:scale-105",
          ].join(" "),
          thumbSizes[size],
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
