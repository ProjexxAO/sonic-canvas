import { 
  TrendingUp, 
  AlertTriangle, 
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
  Search,
  Mail,
  CheckSquare,
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

const PERSONA_ACTIONS: Record<string, QuickAction[]> = {
  ceo: [
    { id: 'strategic_review', label: 'Strategic Review', description: 'Review key decisions & market position', icon: Target, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'stakeholder_brief', label: 'Stakeholder Brief', description: 'Prepare stakeholder communications', icon: Users, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'kpi_dashboard', label: 'KPI Dashboard', description: 'View company-wide metrics', icon: BarChart3, color: 'hsl(150 70% 45%)', priority: 'medium' },
    { id: 'risk_assessment', label: 'Risk Assessment', description: 'Review critical risks & mitigations', icon: AlertTriangle, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
  cfo: [
    { id: 'cash_flow', label: 'Cash Flow Analysis', description: 'Review current cash position', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'financial_forecast', label: 'Financial Forecast', description: 'Generate quarterly projections', icon: TrendingUp, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'compliance_check', label: 'Compliance Check', description: 'Review regulatory compliance', icon: Shield, color: 'hsl(280 70% 50%)', priority: 'medium' },
    { id: 'expense_report', label: 'Expense Report', description: 'Analyze spending patterns', icon: FileText, color: 'hsl(200 70% 50%)', priority: 'medium' },
  ],
  coo: [
    { id: 'operations_metrics', label: 'Operations Metrics', description: 'View efficiency & performance', icon: BarChart3, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'resource_allocation', label: 'Resource Allocation', description: 'Review team & resource usage', icon: Users, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'process_optimization', label: 'Process Optimization', description: 'Identify improvement areas', icon: Zap, color: 'hsl(45 80% 50%)', priority: 'medium' },
    { id: 'team_performance', label: 'Team Performance', description: 'Review team productivity', icon: TrendingUp, color: 'hsl(150 70% 45%)', priority: 'medium' },
  ],
  chief_of_staff: [
    { id: 'executive_priorities', label: 'Executive Priorities', description: 'Track leadership action items', icon: Target, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'cross_functional', label: 'Cross-Functional', description: 'Review department alignment', icon: Users, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'meeting_prep', label: 'Meeting Prep', description: 'Prepare executive briefings', icon: Calendar, color: 'hsl(150 70% 45%)', priority: 'medium' },
    { id: 'action_items', label: 'Action Items', description: 'Track open action items', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  cto: [
    { id: 'tech_roadmap', label: 'Tech Roadmap', description: 'Review technology strategy', icon: Cpu, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'innovation_radar', label: 'Innovation Radar', description: 'Explore emerging tech', icon: Search, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'tech_debt', label: 'Tech Debt Analysis', description: 'Review technical debt', icon: AlertTriangle, color: 'hsl(45 80% 50%)', priority: 'medium' },
    { id: 'infrastructure', label: 'Infrastructure', description: 'System health overview', icon: BarChart3, color: 'hsl(150 70% 45%)', priority: 'medium' },
  ],
  ciso: [
    { id: 'security_posture', label: 'Security Posture', description: 'Review overall security status', icon: Shield, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'threat_assessment', label: 'Threat Assessment', description: 'Analyze active threats', icon: AlertTriangle, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'compliance_audit', label: 'Compliance Audit', description: 'Review security compliance', icon: CheckSquare, color: 'hsl(150 70% 45%)', priority: 'medium' },
    { id: 'incident_review', label: 'Incident Review', description: 'Recent security incidents', icon: Zap, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
  chro: [
    { id: 'workforce_analytics', label: 'Workforce Analytics', description: 'Employee metrics & trends', icon: Users, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'talent_pipeline', label: 'Talent Pipeline', description: 'Recruitment & hiring status', icon: Target, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'retention_analysis', label: 'Retention Analysis', description: 'Turnover & engagement data', icon: TrendingUp, color: 'hsl(150 70% 45%)', priority: 'medium' },
    { id: 'culture_pulse', label: 'Culture Pulse', description: 'Employee sentiment analysis', icon: BarChart3, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  chief_people: [
    { id: 'engagement_score', label: 'Engagement Score', description: 'Current engagement metrics', icon: TrendingUp, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'talent_development', label: 'Talent Development', description: 'L&D program overview', icon: Users, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'wellbeing_check', label: 'Wellbeing Check', description: 'Employee wellbeing status', icon: Target, color: 'hsl(150 70% 45%)', priority: 'medium' },
    { id: 'org_culture', label: 'Org Culture', description: 'Culture initiatives tracker', icon: BarChart3, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  cmo: [
    { id: 'campaign_performance', label: 'Campaign Performance', description: 'Active campaign metrics', icon: Megaphone, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'brand_health', label: 'Brand Health', description: 'Brand awareness & sentiment', icon: TrendingUp, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'customer_insights', label: 'Customer Insights', description: 'Customer behavior analysis', icon: Users, color: 'hsl(150 70% 45%)', priority: 'medium' },
    { id: 'content_calendar', label: 'Content Calendar', description: 'Upcoming content schedule', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  cro: [
    { id: 'revenue_forecast', label: 'Revenue Forecast', description: 'Current revenue projections', icon: DollarSign, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'pipeline_review', label: 'Pipeline Review', description: 'Sales pipeline health', icon: TrendingUp, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'sales_performance', label: 'Sales Performance', description: 'Team performance metrics', icon: BarChart3, color: 'hsl(200 70% 50%)', priority: 'medium' },
    { id: 'customer_success', label: 'Customer Success', description: 'Retention & expansion', icon: Users, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  clo: [
    { id: 'contract_review', label: 'Contract Review', description: 'Pending contracts & renewals', icon: FileText, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'legal_matters', label: 'Legal Matters', description: 'Active legal issues', icon: Scale, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'ip_portfolio', label: 'IP Portfolio', description: 'Intellectual property status', icon: Shield, color: 'hsl(280 70% 50%)', priority: 'medium' },
    { id: 'litigation_tracker', label: 'Litigation Tracker', description: 'Active litigation cases', icon: AlertTriangle, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  cco: [
    { id: 'compliance_status', label: 'Compliance Status', description: 'Overall compliance health', icon: CheckSquare, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'regulatory_updates', label: 'Regulatory Updates', description: 'New regulatory changes', icon: FileText, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'ethics_review', label: 'Ethics Review', description: 'Ethics program status', icon: Scale, color: 'hsl(150 70% 45%)', priority: 'medium' },
    { id: 'governance_check', label: 'Governance Check', description: 'Governance framework review', icon: Shield, color: 'hsl(280 70% 50%)', priority: 'medium' },
  ],
  admin: [
    { id: 'system_health', label: 'System Health', description: 'Platform status & metrics', icon: Cpu, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'user_management', label: 'User Management', description: 'Manage users & permissions', icon: Users, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'agent_oversight', label: 'Agent Oversight', description: 'Monitor agent activity', icon: Zap, color: 'hsl(150 70% 45%)', priority: 'medium' },
    { id: 'security_monitor', label: 'Security Monitor', description: 'Security event logs', icon: Shield, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  entrepreneur: [
    { id: 'launch_venture', label: 'Launch Venture', description: 'Start a new business initiative', icon: Target, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'financial_autopilot', label: 'Financial Autopilot', description: 'Automated cash flow & invoicing', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'growth_optimizer', label: 'Growth Optimizer', description: 'AI-driven marketing campaigns', icon: TrendingUp, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'idea_validator', label: 'Idea Validator', description: 'Validate new business ideas', icon: Zap, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
};

// Default actions for users without a persona
const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'browse_data', label: 'Browse Data', description: 'Explore your connected data', icon: Search, color: 'hsl(var(--primary))', priority: 'high' },
  { id: 'view_tasks', label: 'View Tasks', description: 'Check pending tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
  { id: 'recent_docs', label: 'Recent Documents', description: 'Access recent documents', icon: FileText, color: 'hsl(280 70% 50%)', priority: 'medium' },
  { id: 'check_calendar', label: 'Check Calendar', description: 'Upcoming events', icon: Calendar, color: 'hsl(150 70% 45%)', priority: 'medium' },
];

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
                {action.priority === 'high' && (
                  <Badge variant="secondary" className="text-[7px] px-1 py-0 h-3">
                    Priority
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
