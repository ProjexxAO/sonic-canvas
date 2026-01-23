/**
 * Accessibility Provider
 * 
 * WCAG 2.2 AA compliant accessibility layer providing:
 * - Skip links for keyboard navigation
 * - ARIA live regions for dynamic content
 * - Focus management utilities
 * - Reduced motion detection
 * - Screen reader announcements
 */

import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';

// ============================================================================
// ACCESSIBILITY CONTEXT
// ============================================================================

interface AccessibilityContextValue {
  // Announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  
  // Focus management
  focusMain: () => void;
  focusTrap: (containerId: string) => void;
  releaseFocusTrap: () => void;
  
  // Motion preferences
  prefersReducedMotion: boolean;
  
  // High contrast mode
  prefersHighContrast: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

export function useAccessibilitySafe() {
  return useContext(AccessibilityContext);
}

// ============================================================================
// SKIP LINKS COMPONENT
// ============================================================================

export function SkipLinks() {
  const skipLinks = [
    { id: 'main-content', label: 'Skip to main content' },
    { id: 'navigation', label: 'Skip to navigation' },
    { id: 'search', label: 'Skip to search' },
  ];

  return (
    <nav 
      aria-label="Skip links" 
      className="skip-links-container"
    >
      {skipLinks.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="skip-link"
          onClick={(e) => {
            const target = document.getElementById(link.id);
            if (target) {
              e.preventDefault();
              target.focus();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

// ============================================================================
// ARIA LIVE REGION COMPONENT
// ============================================================================

interface LiveRegionProps {
  politeRef: React.RefObject<HTMLDivElement>;
  assertiveRef: React.RefObject<HTMLDivElement>;
}

function LiveRegions({ politeRef, assertiveRef }: LiveRegionProps) {
  return (
    <>
      {/* Polite announcements - wait for user to finish current task */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
      
      {/* Assertive announcements - interrupt immediately for critical info */}
      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      />
    </>
  );
}

// ============================================================================
// FOCUS TRAP UTILITY
// ============================================================================

function useFocusTrap() {
  const trapRef = useRef<string | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const focusTrap = useCallback((containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Store current focus to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;
    trapRef.current = containerId;

    // Find all focusable elements
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    // Handle tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const releaseFocusTrap = useCallback(() => {
    trapRef.current = null;
    previousFocusRef.current?.focus();
  }, []);

  return { focusTrap, releaseFocusTrap };
}

// ============================================================================
// ACCESSIBILITY PROVIDER
// ============================================================================

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const politeRef = useRef<HTMLDivElement>(null);
  const assertiveRef = useRef<HTMLDivElement>(null);
  const { focusTrap, releaseFocusTrap } = useFocusTrap();
  
  // Detect motion preferences
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      document.documentElement.classList.toggle('reduce-motion', e.matches);
    };
    
    motionQuery.addEventListener('change', handleMotionChange);
    document.documentElement.classList.toggle('reduce-motion', motionQuery.matches);

    // Check high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    setPrefersHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
      document.documentElement.classList.toggle('high-contrast', e.matches);
    };
    
    contrastQuery.addEventListener('change', handleContrastChange);
    document.documentElement.classList.toggle('high-contrast', contrastQuery.matches);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Announce message to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = priority === 'assertive' ? assertiveRef.current : politeRef.current;
    if (region) {
      // Clear and re-add to trigger announcement
      region.textContent = '';
      requestAnimationFrame(() => {
        region.textContent = message;
      });
    }
  }, []);

  // Focus main content area
  const focusMain = useCallback(() => {
    const main = document.getElementById('main-content');
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const value: AccessibilityContextValue = {
    announce,
    focusMain,
    focusTrap,
    releaseFocusTrap,
    prefersReducedMotion,
    prefersHighContrast,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      <SkipLinks />
      <LiveRegions politeRef={politeRef} assertiveRef={assertiveRef} />
      {children}
    </AccessibilityContext.Provider>
  );
}

// ============================================================================
// ACCESSIBLE BUTTON WRAPPER
// ============================================================================

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Announce action result to screen readers */
  announceOnClick?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Loading announcement */
  loadingAnnouncement?: string;
}

export function AccessibleButton({
  children,
  announceOnClick,
  isLoading,
  loadingAnnouncement = 'Loading...',
  onClick,
  disabled,
  ...props
}: AccessibleButtonProps) {
  const { announce } = useAccessibility();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (announceOnClick) {
      announce(announceOnClick);
    }
    onClick?.(e);
  };

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <span className="sr-only">{loadingAnnouncement}</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// ============================================================================
// VISUALLY HIDDEN (SR-ONLY) COMPONENT
// ============================================================================

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'p';
}

export function VisuallyHidden({ children, as = 'span' }: VisuallyHiddenProps) {
  const Element = as;
  return <Element className="sr-only">{children}</Element>;
}

// ============================================================================
// FOCUS VISIBLE WRAPPER
// ============================================================================

interface FocusVisibleProps {
  children: React.ReactNode;
  className?: string;
}

export function FocusVisible({ children, className }: FocusVisibleProps) {
  return (
    <div className={`focus-visible-wrapper ${className ?? ''}`}>
      {children}
    </div>
  );
}
