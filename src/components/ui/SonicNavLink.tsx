// Sonic Entity-enabled Navigation Link component

import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSonicEntity } from "@/hooks/useSonicEntity";
import { CapabilityTemplates } from "@/lib/sonicEntityBridge";
import { cn } from "@/lib/utils";

export interface SonicNavLinkProps {
  /** Unique name for this nav link entity */
  entityName: string;
  /** Target route */
  to: string;
  /** Description for Atlas */
  navDescription?: string;
  /** Importance level */
  importance?: 'critical' | 'high' | 'medium' | 'low';
  /** Additional class names */
  className?: string;
  /** Children content */
  children: React.ReactNode;
  /** Active class when route matches */
  activeClassName?: string;
}

export function SonicNavLink({
  entityName,
  to,
  navDescription,
  importance = 'medium',
  className,
  children,
  activeClassName = 'text-primary',
}: SonicNavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  // Register as Sonic Entity
  const { recordInteraction, updateState } = useSonicEntity(
    {
      name: entityName,
      category: 'navigation',
      componentType: 'SonicNavLink',
      importance,
      capabilities: [
        CapabilityTemplates.navigate(navDescription || `Navigate to ${entityName}`),
      ],
    },
    { to, isActive }
  );

  // Update state based on active status
  React.useEffect(() => {
    updateState(isActive ? 'active' : 'idle');
  }, [isActive, updateState]);

  const handleClick = React.useCallback(() => {
    recordInteraction();
    updateState('active');
  }, [recordInteraction, updateState]);

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(
        className,
        isActive && activeClassName
      )}
    >
      {children}
    </Link>
  );
}
