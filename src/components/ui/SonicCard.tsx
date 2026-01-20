// Sonic Entity-enabled Card component

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { useSonicEntity } from "@/hooks/useSonicEntity";
import { CapabilityTemplates, EntityCapability } from "@/lib/sonicEntityBridge";
import { cn } from "@/lib/utils";

export interface SonicCardProps extends React.ComponentProps<typeof Card> {
  /** Unique name for this card entity */
  entityName: string;
  /** Description for Atlas to understand what this card displays */
  cardDescription?: string;
  /** Importance level for Atlas perception */
  importance?: 'critical' | 'high' | 'medium' | 'low';
  /** Is this card clickable? */
  clickable?: boolean;
  /** Click handler if clickable */
  onCardClick?: () => void;
  /** Is this card expandable? */
  expandable?: boolean;
  /** Expand handler if expandable */
  onExpand?: (expanded: boolean) => void;
}

const SonicCard = React.forwardRef<HTMLDivElement, SonicCardProps>(
  ({ 
    entityName, 
    cardDescription = "View this card", 
    importance = 'medium',
    clickable = false,
    onCardClick,
    expandable = false,
    onExpand,
    className,
    children,
    ...props 
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Build capabilities based on props
    const capabilities: EntityCapability[] = [];
    if (clickable && onCardClick) {
      capabilities.push(CapabilityTemplates.click(cardDescription));
    }
    if (expandable && onExpand) {
      capabilities.push(CapabilityTemplates.expand(`Expand or collapse this ${entityName}`));
    }

    // Register as Sonic Entity
    const { recordInteraction, updateState } = useSonicEntity(
      {
        name: entityName,
        category: clickable ? 'action' : 'display',
        componentType: 'SonicCard',
        importance,
        capabilities,
      },
      { onClick: onCardClick, onExpand }
    );

    // Handle click
    const handleClick = React.useCallback(() => {
      if (clickable && onCardClick) {
        recordInteraction();
        updateState('active');
        onCardClick();
        setTimeout(() => updateState('idle'), 300);
      }
    }, [clickable, onCardClick, recordInteraction, updateState]);

    // Handle expand
    const handleExpand = React.useCallback(() => {
      if (expandable && onExpand) {
        const newState = !isExpanded;
        setIsExpanded(newState);
        recordInteraction();
        onExpand(newState);
      }
    }, [expandable, onExpand, isExpanded, recordInteraction]);

    return (
      <Card
        ref={ref}
        className={cn(
          clickable && "cursor-pointer hover:border-primary/50 transition-colors",
          className
        )}
        onClick={clickable ? handleClick : undefined}
        {...props}
      >
        {children}
      </Card>
    );
  }
);

SonicCard.displayName = "SonicCard";

// Re-export card sub-components for convenience
export { SonicCard, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
