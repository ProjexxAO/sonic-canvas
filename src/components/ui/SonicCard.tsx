import React from 'react';
import { cn } from '@/lib/utils';

interface SonicCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'gradient' | 'outline' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
}

const SonicCard = React.forwardRef<HTMLDivElement, SonicCardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hover = false,
      glow = false,
      glowColor = 'purple',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      relative rounded-2xl overflow-hidden
      transition-all duration-300 ease-out
    `;

    const variants = {
      default: `
        bg-slate-900/80 backdrop-blur-sm
        border border-slate-800
      `,
      glass: `
        bg-white/5 backdrop-blur-xl
        border border-white/10
      `,
      gradient: `
        bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900
        border border-purple-500/20
      `,
      outline: `
        bg-transparent
        border-2 border-slate-700
      `,
      elevated: `
        bg-slate-900
        shadow-2xl shadow-black/50
        border border-slate-800
      `,
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-8',
    };

    const hoverStyles = hover
      ? `
        hover:scale-[1.02] hover:shadow-xl
        hover:border-purple-500/40
        cursor-pointer
      `
      : '';

    const glowColors: Record<string, string> = {
      purple: 'shadow-purple-500/20 hover:shadow-purple-500/40',
      blue: 'shadow-blue-500/20 hover:shadow-blue-500/40',
      green: 'shadow-emerald-500/20 hover:shadow-emerald-500/40',
      pink: 'shadow-pink-500/20 hover:shadow-pink-500/40',
      orange: 'shadow-orange-500/20 hover:shadow-orange-500/40',
    };

    const glowStyles = glow
      ? `shadow-lg ${glowColors[glowColor] ?? glowColors.purple}`
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          hoverStyles,
          glowStyles,
          className
        )}
        {...props}
      >
        {/* Gradient overlay for glass variant */}
        {variant === 'glass' && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Animated border gradient */}
        {(variant === 'gradient' || glow) && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          </div>
        )}
      </div>
    );
  }
);

SonicCard.displayName = 'SonicCard';

// Card subcomponents
const SonicCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
));
SonicCardHeader.displayName = 'SonicCardHeader';

const SonicCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold text-white leading-none tracking-tight', className)}
    {...props}
  />
));
SonicCardTitle.displayName = 'SonicCardTitle';

const SonicCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-400', className)}
    {...props}
  />
));
SonicCardDescription.displayName = 'SonicCardDescription';

const SonicCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
SonicCardContent.displayName = 'SonicCardContent';

const SonicCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 border-t border-slate-800', className)}
    {...props}
  />
));
SonicCardFooter.displayName = 'SonicCardFooter';

export {
  SonicCard,
  SonicCardHeader,
  SonicCardTitle,
  SonicCardDescription,
  SonicCardContent,
  SonicCardFooter,
};
export type { SonicCardProps };
