// Sonic Entity-enabled Button component

import * as React from "react";
import { Button, ButtonProps, buttonVariants } from "./button";
import { useSonicEntity } from "@/hooks/useSonicEntity";
import { CapabilityTemplates } from "@/lib/sonicEntityBridge";
import { cn } from "@/lib/utils";

export interface SonicButtonProps extends ButtonProps {
  /** Unique name for this button entity */
  entityName: string;
  /** Description for Atlas to understand what this button does */
  actionDescription?: string;
  /** Importance level for Atlas perception */
  importance?: 'critical' | 'high' | 'medium' | 'low';
}

const SonicButton = React.forwardRef<HTMLButtonElement, SonicButtonProps>(
  ({ 
    entityName, 
    actionDescription = "Click this button", 
    importance = 'medium',
    onClick,
    disabled,
    className,
    ...props 
  }, ref) => {
    // Register as Sonic Entity
    const { recordInteraction, updateState } = useSonicEntity(
      {
        name: entityName,
        category: 'action',
        componentType: 'SonicButton',
        importance,
        capabilities: [
          CapabilityTemplates.click(actionDescription),
        ],
      },
      { onClick, disabled }
    );

    // Update state based on disabled prop
    React.useEffect(() => {
      updateState(disabled ? 'disabled' : 'idle');
    }, [disabled, updateState]);

    // Enhanced click handler
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      recordInteraction();
      updateState('active');
      onClick?.(e);
      // Reset to idle after brief delay
      setTimeout(() => updateState('idle'), 300);
    }, [onClick, recordInteraction, updateState]);

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        className={cn(className)}
        {...props}
      />
    );
  }
);

SonicButton.displayName = "SonicButton";

export { SonicButton };
