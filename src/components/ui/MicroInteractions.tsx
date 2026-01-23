/**
 * Micro-Interaction Components
 * 
 * Psychology-based animations that provide feedback and delight users
 * following Doherty Threshold (< 400ms for instant feel)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ANIMATION_TIMING, ANIMATION_EASING, REWARD_PATTERNS } from '@/lib/designPsychology';

// ============================================================================
// PRESS FEEDBACK - Haptic-like button response
// ============================================================================

interface PressableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  haptic?: 'light' | 'medium' | 'heavy';
}

export function Pressable({ 
  children, 
  onPress, 
  disabled, 
  haptic = 'medium',
  className,
  ...props 
}: PressableProps) {
  const [isPressed, setIsPressed] = useState(false);

  const scaleMap = {
    light: 'active:scale-[0.99]',
    medium: 'active:scale-[0.97]',
    heavy: 'active:scale-[0.95]',
  };

  return (
    <div
      className={cn(
        'cursor-pointer transition-transform duration-75 ease-out select-none',
        scaleMap[haptic],
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => {
        setIsPressed(false);
        onPress?.();
      }}
      onMouseLeave={() => setIsPressed(false)}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SUCCESS PULSE - Reward feedback on completion
// ============================================================================

interface SuccessPulseProps {
  trigger: boolean;
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'celebratory';
  className?: string;
}

export function SuccessPulse({ 
  trigger, 
  children, 
  intensity = 'medium',
  className 
}: SuccessPulseProps) {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), REWARD_PATTERNS.micro.duration);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const intensityClasses = {
    subtle: 'animate-pulse-subtle',
    medium: 'animate-pulse-success',
    celebratory: 'animate-pulse-celebrate',
  };

  return (
    <div
      className={cn(
        'transition-all',
        isPulsing && intensityClasses[intensity],
        className
      )}
      style={{
        transform: isPulsing ? `scale(${REWARD_PATTERNS.micro.scale})` : 'scale(1)',
        transition: `transform ${REWARD_PATTERNS.micro.duration}ms ${ANIMATION_EASING.spring}`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SHIMMER LOADING - Skeleton with life
// ============================================================================

interface ShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Shimmer({ 
  className, 
  width = '100%', 
  height = 16,
  rounded = 'md'
}: ShimmerProps) {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'bg-muted/50 overflow-hidden relative',
        roundedClasses[rounded],
        className
      )}
      style={{ width, height }}
    >
      <div 
        className="absolute inset-0 -translate-x-full animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--muted-foreground) / 0.1), transparent)',
        }}
      />
    </div>
  );
}

// ============================================================================
// PROGRESS RING - Zeigarnik Effect completion drive
// ============================================================================

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'energy';
  className?: string;
}

export function ProgressRing({
  progress,
  size = 40,
  strokeWidth = 4,
  showPercentage = false,
  color = 'primary',
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorMap = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    energy: 'stroke-amber-500',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(colorMap[color], 'transition-all duration-500 ease-out')}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-xs font-medium">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

// ============================================================================
// AI THINKING INDICATOR - Shows AI processing state
// ============================================================================

interface AIThinkingProps {
  isThinking: boolean;
  variant?: 'dots' | 'pulse' | 'wave';
  label?: string;
  className?: string;
}

export function AIThinking({
  isThinking,
  variant = 'dots',
  label = 'Atlas is thinking',
  className,
}: AIThinkingProps) {
  if (!isThinking) return null;

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      {variant === 'dots' && (
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{
                animationDelay: `${i * 150}ms`,
                animationDuration: '600ms',
              }}
            />
          ))}
        </div>
      )}
      
      {variant === 'pulse' && (
        <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
      )}
      
      {variant === 'wave' && (
        <div className="flex gap-0.5 items-end h-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-wave"
              style={{
                animationDelay: `${i * 100}ms`,
                height: `${8 + Math.sin(i) * 8}px`,
              }}
            />
          ))}
        </div>
      )}
      
      <span>{label}</span>
    </div>
  );
}

// ============================================================================
// HOVER LIFT - Subtle depth on hover
// ============================================================================

interface HoverLiftProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  lift?: 'subtle' | 'medium' | 'dramatic';
}

export function HoverLift({
  children,
  lift = 'medium',
  className,
  ...props
}: HoverLiftProps) {
  const liftClasses = {
    subtle: 'hover:-translate-y-0.5 hover:shadow-sm',
    medium: 'hover:-translate-y-1 hover:shadow-md',
    dramatic: 'hover:-translate-y-2 hover:shadow-lg',
  };

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-out',
        liftClasses[lift],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// FOCUS GLOW - Accessible focus indicator with style
// ============================================================================

interface FocusGlowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  color?: 'primary' | 'success' | 'warning';
}

export function FocusGlow({
  children,
  color = 'primary',
  className,
  ...props
}: FocusGlowProps) {
  const colorMap = {
    primary: 'focus-within:ring-primary/40 focus-within:shadow-[0_0_15px_hsl(var(--primary)/0.3)]',
    success: 'focus-within:ring-success/40 focus-within:shadow-[0_0_15px_hsl(var(--success)/0.3)]',
    warning: 'focus-within:ring-warning/40 focus-within:shadow-[0_0_15px_hsl(var(--warning)/0.3)]',
  };

  return (
    <div
      className={cn(
        'transition-shadow duration-200 rounded-lg',
        'focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-background',
        colorMap[color],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// REVEAL ANIMATION - Staggered entrance
// ============================================================================

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  className?: string;
}

export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className,
}: RevealProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionStyles = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4',
    fade: '',
  };

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        !isVisible && `opacity-0 ${directionStyles[direction]}`,
        isVisible && 'opacity-100 translate-x-0 translate-y-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// COUNT UP - Animated number display
// ============================================================================

interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  className,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const endValue = value;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Ease-out curve
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeOut;
      
      setDisplayValue(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Export for index
export const MicroInteractions = {
  Pressable,
  SuccessPulse,
  Shimmer,
  ProgressRing,
  AIThinking,
  HoverLift,
  FocusGlow,
  Reveal,
  CountUp,
};
