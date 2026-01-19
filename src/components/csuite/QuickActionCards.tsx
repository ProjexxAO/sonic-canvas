import { 
  TrendingUp, 
  FileText, 
  Users, 
  DollarSign, 
  Shield, 
  Megaphone,
  Scale,
  Cpu,
  Target,
  Calendar,
  BarChart3,
  Zap,
  Mail,
  CheckSquare,
  BookOpen,
  LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  priority: 'high' | 'medium' | 'low';
}

interface QuickActionCardsProps {
  personaId: string | null;
  onActionClick: (actionId: string) => void;
  stats?: {
    communications: number;
    documents: number;
    events: number;
    financials: number;
    tasks: number;
    knowledge: number;
  };
}

// Common actions available to all personas
const COMMON_ACTIONS: QuickAction[] = [
  { id: 'inbox', label: 'Inbox', description: 'View emails & messages', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
  { id: 'my_tasks', label: 'My Tasks', description: 'View pending tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
  { id: 'calendar', label: 'Calendar', description: 'Upcoming meetings & events', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'high' },
  { id: 'documents', label: 'Documents', description: 'Access files & docs', icon: FileText, color: 'hsl(45 80% 50%)', priority: 'medium' },
];

// Role-specific actions (2 per persona) + common actions
const PERSONA_ACTIONS: Record<string, QuickAction[]> = {
  ceo: [
    { id: 'inbox', label: 'Inbox', description: 'Stakeholder communications', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Executive action items', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'kpi_dashboard', label: 'KPI Dashboard', description: 'Company-wide metrics', icon: BarChart3, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'financials', label: 'Financials', description: 'Revenue & cash position', icon: DollarSign, color: 'hsl(45 80% 50%)', priority: 'high' },
  ],
  cfo: [
    { id: 'inbox', label: 'Inbox', description: 'Financial communications', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'financials', label: 'Cash Flow', description: 'Current cash position', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Finance action items', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'documents', label: 'Reports', description: 'Financial statements', icon: FileText, color: 'hsl(280 70% 50%)', priority: 'high' },
  ],
  coo: [
    { id: 'inbox', label: 'Inbox', description: 'Operations updates', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Operations tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'team_overview', label: 'Team Overview', description: 'Resource allocation', icon: Users, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'calendar', label: 'Calendar', description: 'Operations schedule', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  chief_of_staff: [
    { id: 'inbox', label: 'Inbox', description: 'Executive communications', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'Action Items', description: 'Leadership priorities', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'calendar', label: 'Calendar', description: 'Executive schedule', icon: Calendar, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'documents', label: 'Briefings', description: 'Prepare executive docs', icon: FileText, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  cto: [
    { id: 'inbox', label: 'Inbox', description: 'Tech team updates', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Tech priorities', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'knowledge', label: 'Tech Docs', description: 'Technical documentation', icon: BookOpen, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'infrastructure', label: 'Infrastructure', description: 'System health', icon: Cpu, color: 'hsl(150 70% 45%)', priority: 'medium' },
  ],
  ciso: [
    { id: 'inbox', label: 'Inbox', description: 'Security alerts', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Security actions', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'security_posture', label: 'Security', description: 'Overall security status', icon: Shield, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'documents', label: 'Policies', description: 'Security policies', icon: FileText, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  chro: [
    { id: 'inbox', label: 'Inbox', description: 'HR communications', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'HR action items', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'team_overview', label: 'Workforce', description: 'Employee analytics', icon: Users, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'calendar', label: 'Calendar', description: 'HR schedule', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  chief_people: [
    { id: 'inbox', label: 'Inbox', description: 'People updates', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'People initiatives', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'team_overview', label: 'Team Pulse', description: 'Engagement metrics', icon: Users, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'calendar', label: 'Calendar', description: 'Team events', icon: Calendar, color: 'hsl(150 70% 45%)', priority: 'medium' },
  ],
  cmo: [
    { id: 'inbox', label: 'Inbox', description: 'Marketing updates', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Campaign tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'campaigns', label: 'Campaigns', description: 'Active campaigns', icon: Megaphone, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'calendar', label: 'Content Cal', description: 'Content schedule', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  cro: [
    { id: 'inbox', label: 'Inbox', description: 'Sales communications', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Revenue tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'financials', label: 'Pipeline', description: 'Revenue pipeline', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'calendar', label: 'Calendar', description: 'Sales meetings', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  clo: [
    { id: 'inbox', label: 'Inbox', description: 'Legal communications', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Legal matters', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'documents', label: 'Contracts', description: 'Contract review', icon: FileText, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'knowledge', label: 'Legal Docs', description: 'Legal library', icon: Scale, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  cco: [
    { id: 'inbox', label: 'Inbox', description: 'Compliance updates', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Compliance tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'compliance', label: 'Compliance', description: 'Compliance status', icon: Shield, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'documents', label: 'Regulations', description: 'Regulatory docs', icon: FileText, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  admin: [
    { id: 'inbox', label: 'Inbox', description: 'System notifications', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Admin tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'user_management', label: 'Users', description: 'Manage users', icon: Users, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'system_health', label: 'System', description: 'Platform health', icon: Cpu, color: 'hsl(150 70% 45%)', priority: 'medium' },
  ],
  entrepreneur: [
    { id: 'inbox', label: 'Inbox', description: 'Business messages', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'my_tasks', label: 'My Tasks', description: 'Priority tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'financials', label: 'Cash Flow', description: 'Money in & out', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'growth_optimizer', label: 'Growth', description: 'Grow your business', icon: TrendingUp, color: 'hsl(var(--primary))', priority: 'high' },
  ],
};

// Default actions for users without a persona
const DEFAULT_ACTIONS: QuickAction[] = COMMON_ACTIONS;

export function QuickActionCards({ personaId, onActionClick, stats }: QuickActionCardsProps) {
  const actions = personaId ? (PERSONA_ACTIONS[personaId] || DEFAULT_ACTIONS) : DEFAULT_ACTIONS;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={10} className="text-primary" />
        <span className="text-[9px] font-mono text-muted-foreground uppercase">Quick Actions</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          // Show count for relevant actions
          const count = stats ? (
            action.id === 'inbox' ? stats.communications :
            action.id === 'my_tasks' ? stats.tasks :
            action.id === 'calendar' ? stats.events :
            action.id === 'documents' ? stats.documents :
            action.id === 'financials' ? stats.financials :
            action.id === 'knowledge' ? stats.knowledge :
            null
          ) : null;

          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className="p-2 rounded-md bg-background border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left group hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} style={{ color: action.color }} />
                  <span className="text-[10px] font-medium text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </span>
                </div>
                {count !== null && count > 0 && (
                  <Badge variant="secondary" className="text-[8px] px-1.5 py-0 h-4 font-mono">
                    {count}
                  </Badge>
                )}
              </div>
              <p className="text-[8px] text-muted-foreground leading-tight line-clamp-1">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
