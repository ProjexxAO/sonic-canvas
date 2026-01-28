import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SonicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  pulse?: boolean;
  glow?: boolean;
}

const SonicButton = React.forwardRef<HTMLButtonElement, SonicButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      pulse = false,
      glow = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      relative inline-flex items-center justify-center font-medium
      transition-all duration-300 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      rounded-xl
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
        hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600
        text-white shadow-lg hover:shadow-xl
        focus:ring-purple-500
        ${glow ? 'shadow-purple-500/50 hover:shadow-purple-500/70' : ''}
      `,
      secondary: `
        bg-white/10 backdrop-blur-sm border border-white/20
        hover:bg-white/20 hover:border-white/30
        text-white
        focus:ring-white/50
      `,
      ghost: `
        bg-transparent hover:bg-white/10
        text-gray-300 hover:text-white
        focus:ring-gray-500
      `,
      danger: `
        bg-gradient-to-r from-red-500 to-rose-500
        hover:from-red-600 hover:to-rose-600
        text-white shadow-lg
        focus:ring-red-500
        ${glow ? 'shadow-red-500/50' : ''}
      `,
      success: `
        bg-gradient-to-r from-emerald-500 to-teal-500
        hover:from-emerald-600 hover:to-teal-600
        text-white shadow-lg
        focus:ring-emerald-500
        ${glow ? 'shadow-emerald-500/50' : ''}
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
      xl: 'px-8 py-4 text-lg gap-3',
    };

    const pulseAnimation = pulse
      ? 'animate-pulse'
      : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          pulseAnimation,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {/* Glow effect overlay */}
        {glow && (
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
        )}

        {/* Content */}
        <span className="relative flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>
          )}

          {children}

          {!loading && icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </span>

        {/* Hover shine effect */}
        <span className="absolute inset-0 rounded-xl overflow-hidden">
          <span className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-[100%] transition-transform duration-1000" />
        </span>
      </button>
    );
  }
);

SonicButton.displayName = 'SonicButton';

export { SonicButton };
export type { SonicButtonProps };
