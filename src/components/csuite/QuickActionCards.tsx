import { useState, useCallback, useMemo } from 'react';
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
  GripVertical,
  RotateCcw,
  Rocket,
  Lightbulb,
  PieChart,
  LineChart,
  Building2,
  Gavel,
  FileCheck,
  HeartHandshake,
  Presentation,
  ShoppingCart,
  Globe,
  LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuickActionPreferences } from '@/hooks/useQuickActionPreferences';

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
  userId: string | undefined;
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

// Persona-specific unique actions - each persona gets DIFFERENT actions tailored to their role
const PERSONA_ACTIONS: Record<string, QuickAction[]> = {
  ceo: [
    { id: 'inbox', label: 'Priority Inbox', description: 'Board & investor comms', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'kpi_dashboard', label: 'Company KPIs', description: 'Real-time performance', icon: BarChart3, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'financials', label: 'Financial Overview', description: 'P&L, cash, runway', icon: DollarSign, color: 'hsl(45 80% 50%)', priority: 'high' },
    { id: 'calendar', label: 'Executive Calendar', description: 'Key meetings today', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'strategic_initiatives', label: 'Strategic Goals', description: 'OKRs & initiatives', icon: Target, color: 'hsl(var(--primary))', priority: 'medium' },
    { id: 'my_tasks', label: 'Action Items', description: 'Your priority tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  cfo: [
    { id: 'financials', label: 'Cash Position', description: 'Current liquidity', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'inbox', label: 'Finance Inbox', description: 'Vendor & bank comms', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'budget_tracking', label: 'Budget vs Actual', description: 'Variance analysis', icon: PieChart, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'financial_reports', label: 'Financial Reports', description: 'Statements & reports', icon: FileText, color: 'hsl(45 80% 50%)', priority: 'high' },
    { id: 'forecasting', label: 'Forecasting', description: 'Cash flow projections', icon: LineChart, color: 'hsl(var(--primary))', priority: 'medium' },
    { id: 'my_tasks', label: 'Finance Tasks', description: 'Approvals pending', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  coo: [
    { id: 'operations_dashboard', label: 'Ops Dashboard', description: 'Efficiency metrics', icon: BarChart3, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'team_overview', label: 'Team Capacity', description: 'Resource allocation', icon: Users, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'inbox', label: 'Ops Inbox', description: 'Team & vendor updates', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'calendar', label: 'Ops Calendar', description: 'Standups & reviews', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'process_tracker', label: 'Processes', description: 'SOP & workflows', icon: Cpu, color: 'hsl(45 80% 50%)', priority: 'medium' },
    { id: 'my_tasks', label: 'Ops Tasks', description: 'Operational items', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  chief_of_staff: [
    { id: 'inbox', label: 'Exec Inbox', description: 'Leadership comms', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'calendar', label: 'Exec Calendar', description: 'Leadership schedule', icon: Calendar, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'action_tracker', label: 'Action Tracker', description: 'Cross-team items', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'meeting_prep', label: 'Meeting Prep', description: 'Briefing materials', icon: FileText, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'strategic_initiatives', label: 'Initiatives', description: 'Track OKRs', icon: Target, color: 'hsl(var(--primary))', priority: 'medium' },
    { id: 'stakeholder_map', label: 'Stakeholders', description: 'Key relationships', icon: Users, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
  cto: [
    { id: 'inbox', label: 'Tech Inbox', description: 'Engineering updates', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'system_health', label: 'System Health', description: 'Infrastructure status', icon: Cpu, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'knowledge', label: 'Tech Docs', description: 'Architecture docs', icon: BookOpen, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'my_tasks', label: 'Tech Debt', description: 'Engineering backlog', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'roadmap', label: 'Product Roadmap', description: 'Feature pipeline', icon: Target, color: 'hsl(280 70% 50%)', priority: 'medium' },
    { id: 'calendar', label: 'Sprint Calendar', description: 'Sprints & releases', icon: Calendar, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
  ciso: [
    { id: 'security_dashboard', label: 'Security Posture', description: 'Threat landscape', icon: Shield, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'inbox', label: 'Security Alerts', description: 'Incidents & alerts', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'compliance_tracker', label: 'Compliance', description: 'Audit readiness', icon: FileCheck, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'documents', label: 'Policies', description: 'Security policies', icon: FileText, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'risk_register', label: 'Risk Register', description: 'Active risks', icon: Target, color: 'hsl(350 70% 50%)', priority: 'medium' },
    { id: 'my_tasks', label: 'Security Tasks', description: 'Remediation items', icon: CheckSquare, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
  chro: [
    { id: 'workforce_analytics', label: 'Workforce Data', description: 'Headcount & trends', icon: Users, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'inbox', label: 'HR Inbox', description: 'Employee requests', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'hiring_pipeline', label: 'Hiring Pipeline', description: 'Open positions', icon: Target, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'calendar', label: 'HR Calendar', description: 'Reviews & events', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'engagement_surveys', label: 'Engagement', description: 'Survey results', icon: HeartHandshake, color: 'hsl(350 70% 50%)', priority: 'medium' },
    { id: 'my_tasks', label: 'HR Tasks', description: 'Pending approvals', icon: CheckSquare, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
  chief_people: [
    { id: 'engagement_dashboard', label: 'Engagement', description: 'Team pulse', icon: HeartHandshake, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'inbox', label: 'People Inbox', description: 'Team feedback', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'team_overview', label: 'Team Health', description: 'Wellbeing metrics', icon: Users, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'calendar', label: 'Team Events', description: 'Culture calendar', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'learning_programs', label: 'L&D Programs', description: 'Training & growth', icon: BookOpen, color: 'hsl(45 80% 50%)', priority: 'medium' },
    { id: 'my_tasks', label: 'People Tasks', description: 'Action items', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  cmo: [
    { id: 'campaign_dashboard', label: 'Campaigns', description: 'Active campaigns', icon: Megaphone, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'inbox', label: 'Marketing Inbox', description: 'Agency & team', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'analytics', label: 'Marketing Analytics', description: 'Performance data', icon: BarChart3, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'calendar', label: 'Content Calendar', description: 'Publishing schedule', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'brand_assets', label: 'Brand Assets', description: 'Logos & guidelines', icon: FileText, color: 'hsl(45 80% 50%)', priority: 'medium' },
    { id: 'my_tasks', label: 'Marketing Tasks', description: 'Campaign tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  cro: [
    { id: 'revenue_dashboard', label: 'Revenue', description: 'Pipeline & ARR', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'inbox', label: 'Sales Inbox', description: 'Deal updates', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'pipeline_tracker', label: 'Pipeline', description: 'Deal flow', icon: TrendingUp, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'calendar', label: 'Sales Calendar', description: 'Client meetings', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'forecasting', label: 'Forecast', description: 'Revenue forecast', icon: LineChart, color: 'hsl(45 80% 50%)', priority: 'medium' },
    { id: 'my_tasks', label: 'Sales Tasks', description: 'Follow-ups', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  clo: [
    { id: 'contracts', label: 'Contracts', description: 'Pending review', icon: FileText, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'inbox', label: 'Legal Inbox', description: 'Legal requests', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'matter_tracker', label: 'Matters', description: 'Active matters', icon: Gavel, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'calendar', label: 'Legal Calendar', description: 'Deadlines & filings', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'knowledge', label: 'Legal Library', description: 'Templates & docs', icon: BookOpen, color: 'hsl(45 80% 50%)', priority: 'medium' },
    { id: 'my_tasks', label: 'Legal Tasks', description: 'Review queue', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  cco: [
    { id: 'compliance_dashboard', label: 'Compliance', description: 'Status overview', icon: Shield, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'inbox', label: 'Compliance Inbox', description: 'Regulatory updates', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'audit_tracker', label: 'Audits', description: 'Audit schedule', icon: FileCheck, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'documents', label: 'Regulations', description: 'Policy documents', icon: FileText, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'risk_register', label: 'Risk Register', description: 'Compliance risks', icon: Target, color: 'hsl(350 70% 50%)', priority: 'medium' },
    { id: 'my_tasks', label: 'Compliance Tasks', description: 'Open items', icon: CheckSquare, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
  admin: [
    { id: 'system_health', label: 'System Status', description: 'Platform health', icon: Cpu, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'inbox', label: 'System Inbox', description: 'Notifications', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'user_management', label: 'Users', description: 'Manage users', icon: Users, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'persona_management', label: 'Personas', description: 'Manage roles', icon: Building2, color: 'hsl(280 70% 50%)', priority: 'high' },
    { id: 'audit_logs', label: 'Audit Logs', description: 'System activity', icon: FileText, color: 'hsl(45 80% 50%)', priority: 'medium' },
    { id: 'my_tasks', label: 'Admin Tasks', description: 'Pending actions', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'medium' },
  ],
  entrepreneur: [
    { id: 'inbox', label: 'Business Inbox', description: 'Customer & leads', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'financials', label: 'Cash Flow', description: 'Money in & out', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'my_tasks', label: 'Today\'s Focus', description: 'Priority tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'growth_optimizer', label: 'Growth', description: 'Grow your business', icon: TrendingUp, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'launch_venture', label: 'Launch', description: 'New ventures', icon: Rocket, color: 'hsl(280 70% 50%)', priority: 'medium' },
    { id: 'idea_validator', label: 'Validate Ideas', description: 'Test concepts', icon: Lightbulb, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
  c_suite: [
    { id: 'inbox', label: 'Business Inbox', description: 'Customer & leads', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
    { id: 'financials', label: 'Cash Flow', description: 'Money in & out', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'high' },
    { id: 'my_tasks', label: 'Today\'s Focus', description: 'Priority tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
    { id: 'growth_optimizer', label: 'Growth', description: 'Grow your business', icon: TrendingUp, color: 'hsl(var(--primary))', priority: 'high' },
    { id: 'launch_venture', label: 'Launch', description: 'New ventures', icon: Rocket, color: 'hsl(280 70% 50%)', priority: 'medium' },
    { id: 'idea_validator', label: 'Validate Ideas', description: 'Test concepts', icon: Lightbulb, color: 'hsl(45 80% 50%)', priority: 'medium' },
  ],
};

// Default actions for users without a persona
const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'inbox', label: 'Inbox', description: 'View messages', icon: Mail, color: 'hsl(200 70% 50%)', priority: 'high' },
  { id: 'my_tasks', label: 'My Tasks', description: 'Pending tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)', priority: 'high' },
  { id: 'calendar', label: 'Calendar', description: 'Upcoming events', icon: Calendar, color: 'hsl(280 70% 50%)', priority: 'high' },
  { id: 'documents', label: 'Documents', description: 'Files & docs', icon: FileText, color: 'hsl(45 80% 50%)', priority: 'medium' },
  { id: 'financials', label: 'Financials', description: 'Money matters', icon: DollarSign, color: 'hsl(150 70% 45%)', priority: 'medium' },
  { id: 'knowledge', label: 'Knowledge', description: 'Info library', icon: BookOpen, color: 'hsl(var(--primary))', priority: 'medium' },
];

export function QuickActionCards({ personaId, userId, onActionClick, stats }: QuickActionCardsProps) {
  const { preferences, recordUsage, setCustomOrder, clearCustomOrder, getSortedActionIds } = useQuickActionPreferences(userId);
  const [isDragMode, setIsDragMode] = useState(false);

  // Get actions for current persona
  const baseActions = useMemo(() => {
    if (personaId && PERSONA_ACTIONS[personaId]) {
      return PERSONA_ACTIONS[personaId];
    }
    return DEFAULT_ACTIONS;
  }, [personaId]);

  // Sort actions based on user preferences
  const sortedActions = useMemo(() => {
    const actionIds = baseActions.map(a => a.id);
    const sortedIds = getSortedActionIds(actionIds);
    return sortedIds.map(id => baseActions.find(a => a.id === id)!).filter(Boolean);
  }, [baseActions, getSortedActionIds]);

  // Handle action click
  const handleActionClick = useCallback((actionId: string) => {
    recordUsage(actionId);
    onActionClick(actionId);
  }, [recordUsage, onActionClick]);

  // Handle drag end
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sortedActions);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);

    setCustomOrder(items.map(a => a.id));
  }, [sortedActions, setCustomOrder]);

  // Get count for action
  const getCount = (actionId: string): number | null => {
    if (!stats) return null;
    switch (actionId) {
      case 'inbox': return stats.communications;
      case 'my_tasks': 
      case 'action_tracker': return stats.tasks;
      case 'calendar': return stats.events;
      case 'documents':
      case 'contracts':
      case 'meeting_prep':
      case 'financial_reports': return stats.documents;
      case 'financials':
      case 'budget_tracking':
      case 'revenue_dashboard': return stats.financials;
      case 'knowledge': return stats.knowledge;
      default: return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={10} className="text-primary" />
            <span className="text-[9px] font-mono text-muted-foreground uppercase">Quick Actions</span>
            {!preferences.autoSortByUsage && (
              <Badge variant="outline" className="text-[7px] px-1 py-0 h-3">
                Custom Order
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!preferences.autoSortByUsage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={clearCustomOrder}
                  >
                    <RotateCcw size={10} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to auto-sort by usage</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isDragMode ? "secondary" : "ghost"}
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setIsDragMode(!isDragMode)}
                >
                  <GripVertical size={10} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isDragMode ? 'Done reordering' : 'Reorder cards'}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="quick-actions" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-2 gap-2"
              >
                {sortedActions.map((action, index) => {
                  const Icon = action.icon;
                  const count = getCount(action.id);
                  const usageCount = preferences.usageStats[action.id]?.useCount || 0;

                  return (
                    <Draggable
                      key={action.id}
                      draggableId={action.id}
                      index={index}
                      isDragDisabled={!isDragMode}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            relative p-2 rounded-md bg-background border border-border 
                            hover:border-primary/40 hover:bg-muted/30 transition-all text-left group 
                            hover:scale-[1.02] active:scale-[0.98]
                            ${snapshot.isDragging ? 'shadow-lg border-primary z-50' : ''}
                            ${isDragMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                          `}
                          onClick={() => !isDragMode && handleActionClick(action.id)}
                        >
                          {isDragMode && (
                            <div className="absolute top-0.5 right-0.5">
                              <GripVertical size={8} className="text-muted-foreground" />
                            </div>
                          )}
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
                          {preferences.autoSortByUsage && usageCount > 0 && (
                            <div className="absolute bottom-0.5 right-1">
                              <span className="text-[6px] text-muted-foreground/50 font-mono">
                                {usageCount}×
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </TooltipProvider>
  );
}
