// Sonic Entity-enabled Input component

import * as React from "react";
import { Input } from "./input";
import { useSonicEntity } from "@/hooks/useSonicEntity";
import { CapabilityTemplates } from "@/lib/sonicEntityBridge";
import { cn } from "@/lib/utils";

export interface SonicInputProps extends React.ComponentProps<"input"> {
  /** Unique name for this input entity */
  entityName: string;
  /** Description for Atlas to understand what this input is for */
  inputDescription?: string;
  /** Importance level for Atlas perception */
  importance?: 'critical' | 'high' | 'medium' | 'low';
}

const SonicInput = React.forwardRef<HTMLInputElement, SonicInputProps>(
  ({ 
    entityName, 
    inputDescription = "Enter text in this field", 
    importance = 'medium',
    onChange,
    onFocus,
    onBlur,
    disabled,
    className,
    ...props 
  }, ref) => {
    // Register as Sonic Entity
    const { recordInteraction, updateState } = useSonicEntity(
      {
        name: entityName,
        category: 'input',
        componentType: 'SonicInput',
        importance,
        capabilities: [
          CapabilityTemplates.input(inputDescription),
        ],
      },
      { onChange, disabled }
    );

    // Update state based on disabled prop
    React.useEffect(() => {
      updateState(disabled ? 'disabled' : 'idle');
    }, [disabled, updateState]);

    // Enhanced handlers
    const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      recordInteraction();
      onChange?.(e);
    }, [onChange, recordInteraction]);

    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      updateState('active');
      onFocus?.(e);
    }, [onFocus, updateState]);

    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      updateState('idle');
      onBlur?.(e);
    }, [onBlur, updateState]);

    return (
      <Input
        ref={ref}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={cn(className)}
        {...props}
      />
    );
  }
);

SonicInput.displayName = "SonicInput";

export { SonicInput };
