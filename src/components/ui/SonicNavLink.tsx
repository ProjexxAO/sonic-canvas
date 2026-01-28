import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SonicNavLinkProps {
  to: string;
  icon?: React.ReactNode;
  label: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger';
  collapsed?: boolean;
  external?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const SonicNavLink: React.FC<SonicNavLinkProps> = ({
  to,
  icon,
  label,
  badge,
  badgeVariant = 'default',
  collapsed = false,
  external = false,
  disabled = false,
  onClick,
}) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  const baseStyles = `
    relative flex items-center gap-3
    px-3 py-2.5 rounded-xl
    font-medium text-sm
    transition-all duration-200 ease-out
    group
  `;

  const activeStyles = isActive
    ? `
      bg-gradient-to-r from-purple-500/20 to-pink-500/20
      text-white
      border border-purple-500/30
      shadow-lg shadow-purple-500/10
    `
    : `
      text-slate-400
      hover:text-white
      hover:bg-white/5
      border border-transparent
    `;

  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  const badgeColors = {
    default: 'bg-slate-700 text-slate-300',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  const content = (
    <>
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-r-full" />
      )}

      {/* Icon */}
      {icon && (
        <span className={cn(
          'flex-shrink-0 w-5 h-5 flex items-center justify-center',
          isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'
        )}>
          {icon}
        </span>
      )}

      {/* Label */}
      {!collapsed && (
        <span className="flex-1 truncate">{label}</span>
      )}

      {/* Badge */}
      {badge !== undefined && !collapsed && (
        <span className={cn(
          'px-2 py-0.5 text-xs rounded-full font-medium',
          badgeColors[badgeVariant]
        )}>
          {badge}
        </span>
      )}

      {/* Hover glow effect */}
      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-purple-500/5 to-pink-500/5 transition-opacity duration-300 pointer-events-none" />
    </>
  );

  const className = cn(baseStyles, activeStyles, disabledStyles);

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  if (disabled) {
    return (
      <div className={className}>
        {content}
      </div>
    );
  }

  return (
    <Link to={to} className={className} onClick={onClick}>
      {content}
    </Link>
  );
};

// Navigation group component
interface SonicNavGroupProps {
  title?: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

const SonicNavGroup: React.FC<SonicNavGroupProps> = ({
  title,
  children,
  collapsed = false,
}) => {
  return (
    <div className="space-y-1 mb-6">
      {title && !collapsed && (
        <div className="px-3 py-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
        </div>
      )}
      {collapsed && title && (
        <div className="px-3 py-2 flex justify-center">
          <span className="w-6 h-px bg-slate-700" />
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

// Sidebar wrapper component
interface SonicSidebarProps {
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}

const SonicSidebar: React.FC<SonicSidebarProps> = ({
  children,
  collapsed = false,
  onToggle,
}) => {
  return (
    <aside
      className={cn(
        'h-screen flex flex-col',
        'bg-slate-950 border-r border-slate-800',
        'transition-all duration-300 ease-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo area */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!collapsed && (
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Sonic
          </span>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation content */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {children}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-800 p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">User</p>
              <p className="text-xs text-slate-400 truncate">Pro Plan</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export { SonicNavLink, SonicNavGroup, SonicSidebar };
export type { SonicNavLinkProps, SonicNavGroupProps, SonicSidebarProps };
