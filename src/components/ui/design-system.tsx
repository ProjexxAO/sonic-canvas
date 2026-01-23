/**
 * Design System - Centralized Export
 * 
 * This file exports all psychology-based design components
 * for easy import throughout the application.
 * 
 * Usage:
 * import { Pressable, ProgressRing, Card } from '@/components/ui/design-system';
 */

// Core UI Components with psychology enhancements
export { Button, buttonVariants, type ButtonProps } from './button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, type CardProps } from './card';
export { Input, type InputProps } from './input';
export { Badge, badgeVariants, type BadgeProps } from './badge';
export { Progress, type ProgressProps } from './progress';
export { Skeleton, SkeletonCard, SkeletonAvatar, SkeletonList, type SkeletonProps } from './skeleton';
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, SimpleTooltip } from './tooltip';

// Micro-interaction Components
export {
  Pressable,
  SuccessPulse,
  Shimmer,
  ProgressRing,
  AIThinking,
  HoverLift,
  FocusGlow,
  Reveal,
  CountUp,
  TypingIndicator,
  ConfettiBurst,
  PulseDot,
  NotificationDot,
  MicroInteractions,
} from './MicroInteractions';

// Cognitive Load Reducers
export {
  ProgressiveSection,
  ChunkedList,
  ContextHint,
  EmptyState,
  StepIndicator,
  ActionGroup,
  SkeletonGroup,
  CognitiveLoadReducers,
} from './CognitiveLoadReducers';

// Design Psychology Constants
export {
  COLOR_PSYCHOLOGY,
  ANIMATION_TIMING,
  ANIMATION_EASING,
  COGNITIVE_LIMITS,
  DISCLOSURE_LEVELS,
  SPACING_SCALE,
  ACCESSIBILITY,
  HUB_PSYCHOLOGY,
  REWARD_PATTERNS,
} from '@/lib/designPsychology';
