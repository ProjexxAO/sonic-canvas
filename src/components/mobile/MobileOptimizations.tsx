/**
 * Mobile Optimization Components
 * 
 * Touch-first components that meet WCAG 2.2 touch target requirements
 * and provide optimized mobile experiences.
 */

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// TOUCH BUTTON - Meets 48x48px minimum
// ============================================================================

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Size variant */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  /** Full width on mobile */
  fullWidthMobile?: boolean;
}

export function TouchButton({
  children,
  className,
  size = 'default',
  variant = 'primary',
  fullWidthMobile = false,
  ...props
}: TouchButtonProps) {
  const sizeClasses = {
    default: 'min-h-[48px] min-w-[48px] px-6 py-3 text-base',
    sm: 'min-h-[44px] min-w-[44px] px-4 py-2 text-sm',
    lg: 'min-h-[56px] min-w-[56px] px-8 py-4 text-lg',
    icon: 'min-h-[48px] min-w-[48px] p-3',
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80',
    ghost: 'hover:bg-muted active:bg-muted/80 text-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'touch-target transition-all duration-150',
        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'active:scale-[0.98]',
        sizeClasses[size],
        variantClasses[variant],
        fullWidthMobile && 'max-sm:w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================================================
// TOUCH CARD - Accessible card with touch feedback
// ============================================================================

interface TouchCardProps {
  children: React.ReactNode;
  className?: string;
  /** Make card interactive/clickable */
  interactive?: boolean;
  /** Padding size */
  padding?: 'none' | 'sm' | 'default' | 'lg';
  /** On click handler */
  onPress?: () => void;
}

export function TouchCard({
  children,
  className,
  interactive = false,
  padding = 'default',
  onPress,
}: TouchCardProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    default: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  const baseClasses = cn(
    'rounded-xl bg-card border border-border',
    'transition-all duration-200',
    paddingClasses[padding],
    interactive && [
      'cursor-pointer',
      'hover:border-primary/50 hover:shadow-md',
      'active:scale-[0.99] active:shadow-sm',
      'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'touch-feedback',
    ],
    className
  );

  if (interactive) {
    return (
      <button
        className={baseClasses}
        onClick={onPress}
        type="button"
      >
        {children}
      </button>
    );
  }

  return (
    <div className={baseClasses}>
      {children}
    </div>
  );
}

// ============================================================================
// RESPONSIVE STACK - Column on mobile, row on larger screens
// ============================================================================

interface ResponsiveStackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Breakpoint to switch to row */
  breakpoint?: 'sm' | 'md' | 'lg';
  /** Gap between items */
  gap?: 'none' | 'sm' | 'default' | 'lg';
  /** Reverse order on mobile */
  reverseMobile?: boolean;
}

export function ResponsiveStack({
  children,
  className,
  breakpoint = 'sm',
  gap = 'default',
  reverseMobile = false,
  ...props
}: ResponsiveStackProps) {
  const breakpointClasses = {
    sm: 'sm:flex-row',
    md: 'md:flex-row',
    lg: 'lg:flex-row',
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    default: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div
      className={cn(
        'flex flex-col',
        breakpointClasses[breakpoint],
        gapClasses[gap],
        reverseMobile && 'flex-col-reverse sm:flex-row',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// BOTTOM SHEET CONTAINER - Mobile-friendly bottom panel
// ============================================================================

interface BottomSheetContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show sheet */
  open?: boolean;
  /** Close handler */
  onClose?: () => void;
}

export function BottomSheetContainer({
  children,
  className,
  open = true,
  onClose,
  ...props
}: BottomSheetContainerProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in-scale"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-card rounded-t-2xl border-t border-border',
          'safe-area-bottom bottom-sheet-safe',
          'max-h-[85vh] overflow-y-auto',
          'animate-slide-up-fade',
          className
        )}
        role="dialog"
        aria-modal="true"
        {...props}
      >
        {/* Drag handle */}
        <div className="sticky top-0 bg-card pt-3 pb-2">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto" />
        </div>
        
        {/* Content */}
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// SCROLL SNAP CONTAINER - Horizontal scroll with snap points
// ============================================================================

interface ScrollSnapContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Gap between items */
  gap?: 'sm' | 'default' | 'lg';
  /** Padding for peek effect */
  peekPadding?: boolean;
}

export function ScrollSnapContainer({
  children,
  className,
  gap = 'default',
  peekPadding = true,
  ...props
}: ScrollSnapContainerProps) {
  const gapClasses = {
    sm: 'gap-2',
    default: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div
      className={cn(
        'flex overflow-x-auto scroll-snap-x',
        '-mx-4 px-4',
        gapClasses[gap],
        peekPadding && 'pr-12',
        'scrollbar-hide',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => (
        <div className="snap-start flex-shrink-0">
          {child}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// FLUID TEXT - Responsive typography
// ============================================================================

interface FluidTextProps extends React.HTMLAttributes<HTMLElement> {
  /** Text size */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  /** Semantic element */
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Weight */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export function FluidText({
  children,
  className,
  size = 'base',
  as = 'p',
  weight = 'normal',
  ...props
}: FluidTextProps) {
  const sizeClasses = {
    xs: 'text-fluid-xs',
    sm: 'text-fluid-sm',
    base: 'text-fluid-base',
    lg: 'text-fluid-lg',
    xl: 'text-fluid-xl',
    '2xl': 'text-fluid-2xl',
    '3xl': 'text-fluid-3xl',
    '4xl': 'text-fluid-4xl',
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const Component = as;

  return (
    <Component
      className={cn(sizeClasses[size], weightClasses[weight], className)}
      {...props}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// SAFE AREA WRAPPER - Handles notched devices
// ============================================================================

interface SafeAreaWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which edges to pad */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeAreaWrapper({
  children,
  className,
  edges = ['top', 'bottom'],
  ...props
}: SafeAreaWrapperProps) {
  const edgeClasses = edges.map(edge => `safe-area-${edge}`).join(' ');

  return (
    <div className={cn(edgeClasses, className)} {...props}>
      {children}
    </div>
  );
}

// ============================================================================
// HIDE ON TOUCH - Hide elements on touch devices
// ============================================================================

interface HideOnTouchProps {
  children: React.ReactNode;
}

export function HideOnTouch({ children }: HideOnTouchProps) {
  return (
    <div className="hidden [@media(hover:hover)]:block">
      {children}
    </div>
  );
}

// ============================================================================
// SHOW ON TOUCH - Show elements only on touch devices
// ============================================================================

interface ShowOnTouchProps {
  children: React.ReactNode;
}

export function ShowOnTouch({ children }: ShowOnTouchProps) {
  return (
    <div className="block [@media(hover:hover)]:hidden">
      {children}
    </div>
  );
}
