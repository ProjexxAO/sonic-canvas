import { memo } from 'react';
import { 
  Play, 
  Clock, 
  Webhook, 
  Database, 
  AlertTriangle, 
  Calendar,
  CheckSquare,
  Bell,
  FileText,
  Cpu,
  Mail,
  Edit,
  Globe,
  Brain,
  GitBranch,
  Filter,
  Timer,
  Repeat,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowNodeProps {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  label: string;
  subLabel?: string;
  icon?: string;
  isSelected?: boolean;
  isConnecting?: boolean;
  onClick?: () => void;
  onStartConnect?: () => void;
  onEndConnect?: () => void;
}

const ICON_MAP: Record<string, typeof Play> = {
  play: Play,
  clock: Clock,
  webhook: Webhook,
  database: Database,
  'alert-triangle': AlertTriangle,
  calendar: Calendar,
  'check-square': CheckSquare,
  bell: Bell,
  'file-text': FileText,
  cpu: Cpu,
  mail: Mail,
  edit: Edit,
  globe: Globe,
  brain: Brain,
  'git-branch': GitBranch,
  filter: Filter,
  timer: Timer,
  repeat: Repeat,
};

const TYPE_STYLES = {
  trigger: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  action: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  condition: {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
};

export const WorkflowNode = memo(function WorkflowNode({
  type,
  label,
  subLabel,
  icon = 'play',
  isSelected,
  isConnecting,
  onClick,
  onStartConnect,
  onEndConnect,
}: WorkflowNodeProps) {
  const styles = TYPE_STYLES[type];
  const IconComponent = ICON_MAP[icon] || Play;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer transition-all duration-200',
        'w-48 p-3 rounded-lg border-2',
        styles.bg,
        styles.border,
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isConnecting && 'animate-pulse'
      )}
    >
      {/* Drag Handle */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical size={14} className="text-muted-foreground" />
      </div>

      {/* Connection Points */}
      {type !== 'trigger' && (
        <div 
          onClick={(e) => { e.stopPropagation(); onEndConnect?.(); }}
          className={cn(
            'absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full',
            'bg-background border-2 cursor-crosshair',
            styles.border,
            'hover:scale-125 transition-transform'
          )}
        />
      )}
      
      {type !== 'condition' && (
        <div 
          onClick={(e) => { e.stopPropagation(); onStartConnect?.(); }}
          className={cn(
            'absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full',
            'bg-background border-2 cursor-crosshair',
            styles.border,
            'hover:scale-125 transition-transform'
          )}
        />
      )}

      {/* Condition branch points */}
      {type === 'condition' && (
        <>
          <div 
            className={cn(
              'absolute -bottom-2 left-1/4 w-3 h-3 rounded-full',
              'bg-emerald-500 border-2 border-background cursor-crosshair',
              'hover:scale-125 transition-transform'
            )}
            title="True"
          />
          <div 
            className={cn(
              'absolute -bottom-2 right-1/4 w-3 h-3 rounded-full',
              'bg-red-500 border-2 border-background cursor-crosshair',
              'hover:scale-125 transition-transform'
            )}
            title="False"
          />
        </>
      )}

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-md', styles.bg)}>
          <IconComponent size={18} className={styles.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {label}
          </div>
          {subLabel && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {subLabel}
            </div>
          )}
          <div className={cn('text-[10px] uppercase tracking-wider mt-1', styles.text)}>
            {type}
          </div>
        </div>
      </div>
    </div>
  );
});
