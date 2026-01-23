/**
 * Cognitive Load Reduction Components
 * 
 * These components implement Miller's Law (7±2 items) and progressive
 * disclosure to reduce mental fatigue and improve task completion.
 */

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, HelpCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { COGNITIVE_LIMITS } from '@/lib/designPsychology';

// ============================================================================
// PROGRESSIVE SECTION - Collapsible content with smart defaults
// ============================================================================

interface ProgressiveSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  level?: 'surface' | 'details' | 'advanced';
  hint?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function ProgressiveSection({
  title,
  children,
  defaultOpen = true,
  level = 'surface',
  hint,
  badge,
  className,
}: ProgressiveSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const levelStyles = {
    surface: 'border-l-4 border-l-primary',
    details: 'border-l-4 border-l-muted-foreground/30',
    advanced: 'border-l-4 border-l-muted-foreground/10 bg-muted/30',
  };

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', levelStyles[level], className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown size={16} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground" />
          )}
          <span className="font-medium">{title}</span>
          {badge}
        </div>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle size={14} className="text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CHUNKED LIST - Breaks long lists into digestible groups
// ============================================================================

interface ChunkedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  chunkSize?: number;
  showMoreLabel?: string;
  showLessLabel?: string;
  className?: string;
}

export function ChunkedList<T>({
  items,
  renderItem,
  chunkSize = COGNITIVE_LIMITS.dashboardSections,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  className,
}: ChunkedListProps<T>) {
  const [showAll, setShowAll] = useState(false);
  const displayedItems = showAll ? items : items.slice(0, chunkSize);
  const hasMore = items.length > chunkSize;

  return (
    <div className={className}>
      <div className="space-y-2">
        {displayedItems.map((item, i) => renderItem(item, i))}
      </div>
      
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {showAll ? showLessLabel : `${showMoreLabel} (${items.length - chunkSize} more)`}
          <ChevronDown 
            size={14} 
            className={cn('transition-transform', showAll && 'rotate-180')} 
          />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// CONTEXT HINT - Inline help without leaving context
// ============================================================================

interface ContextHintProps {
  children: React.ReactNode;
  hint: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function ContextHint({
  children,
  hint,
  placement = 'top',
}: ContextHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/50">
          {children}
          <Info size={12} className="text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent side={placement} className="max-w-xs">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// EMPTY STATE - Guides users when there's no content
// ============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// STEP INDICATOR - Shows progress through multi-step processes
// ============================================================================

interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
}: StepIndicatorProps) {
  return (
    <div 
      className={cn(
        'flex gap-2',
        orientation === 'vertical' ? 'flex-col' : 'items-center',
        className
      )}
    >
      {steps.map((step, i) => {
        const isComplete = i < currentStep;
        const isCurrent = i === currentStep;
        const isPending = i > currentStep;

        return (
          <React.Fragment key={i}>
            <div className={cn(
              'flex items-center gap-2',
              orientation === 'vertical' && 'flex-row'
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                isComplete && 'bg-success text-success-foreground',
                isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                isPending && 'bg-muted text-muted-foreground'
              )}>
                {isComplete ? '✓' : i + 1}
              </div>
              <div className={orientation === 'horizontal' ? 'hidden sm:block' : ''}>
                <p className={cn(
                  'text-sm font-medium',
                  isPending && 'text-muted-foreground'
                )}>
                  {step.label}
                </p>
                {step.description && orientation === 'vertical' && (
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                )}
              </div>
            </div>
            
            {i < steps.length - 1 && orientation === 'horizontal' && (
              <div className={cn(
                'flex-1 h-0.5 max-w-8',
                isComplete ? 'bg-success' : 'bg-muted'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// ACTION GROUP - Limits visible actions per Hick's Law
// ============================================================================

interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface ActionGroupProps {
  actions: Action[];
  maxVisible?: number;
  moreLabel?: string;
  className?: string;
}

export function ActionGroup({
  actions,
  maxVisible = COGNITIVE_LIMITS.ctaButtons,
  moreLabel = 'More',
  className,
}: ActionGroupProps) {
  const [showMore, setShowMore] = useState(false);
  const visibleActions = actions.slice(0, maxVisible);
  const hiddenActions = actions.slice(maxVisible);

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-muted',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {visibleActions.map((action, i) => (
        <button
          key={i}
          onClick={action.onClick}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
            variantStyles[action.variant || 'ghost']
          )}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
      
      {hiddenActions.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowMore(!showMore)}
            className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            {moreLabel} ({hiddenActions.length})
          </button>
          
          {showMore && (
            <div className="absolute right-0 mt-1 py-1 bg-popover border rounded-lg shadow-lg z-10 min-w-[150px]">
              {hiddenActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    action.onClick();
                    setShowMore(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SKELETON GROUP - Coordinated loading states
// ============================================================================

interface SkeletonGroupProps {
  count?: number;
  layout?: 'list' | 'grid' | 'cards';
  className?: string;
}

export function SkeletonGroup({
  count = 3,
  layout = 'list',
  className,
}: SkeletonGroupProps) {
  const layoutStyles = {
    list: 'space-y-3',
    grid: 'grid grid-cols-2 md:grid-cols-3 gap-4',
    cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  };

  return (
    <div className={cn(layoutStyles[layout], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="bg-muted/50 rounded-lg overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {layout === 'list' ? (
            <div className="h-12 flex items-center gap-3 px-4">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-1/2" />
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Export all components
export const CognitiveLoadReducers = {
  ProgressiveSection,
  ChunkedList,
  ContextHint,
  EmptyState,
  StepIndicator,
  ActionGroup,
  SkeletonGroup,
};
