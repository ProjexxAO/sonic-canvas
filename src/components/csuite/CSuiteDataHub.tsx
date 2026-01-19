import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { 
  Mail, 
  FileText, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  BookOpen,
  Cloud,
  Upload,
  User,
  TrendingUp,
  Briefcase,
  BarChart3,
  Sparkles,
  RefreshCw,
  Cpu,
  Users,
  Megaphone,
  Scale,
  Filter,
  X,
  Eye,
  Activity,
  Zap,
  Brain,
  Settings,
  Command,
  Lightbulb,
  AlertTriangle,
  Bell,
  Target,
  Shield,
  Rocket,
  Plug
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCSuiteData, DataDomainStats, DomainKey, DomainItem, CSuiteReport } from '@/hooks/useCSuiteData';
import { FullScreenDomainView } from './domain-views';
import { FullscreenOverlay } from './FullscreenOverlay';
import { DomainItemDrawer } from './DomainItemDrawer';
import { PersonaConfigPopover, PersonaConfig } from './PersonaConfigPopover';
import { ReportViewer } from './ReportViewer';
import { ReportHistoryList } from './ReportHistoryList';
import { AtlasSummaryTab } from './AtlasSummaryTab';
import { UserPersonaManager } from './UserPersonaManager';
import { PersonaPermissionsManager } from './PersonaPermissionsManager';
import { PersonaLayoutRenderer } from './persona-layouts/PersonaLayoutRenderer';
import { QuickActionCards } from './QuickActionCards';
import { LaunchVentureDialog, GrowthOptimizerDialog, IdeaValidatorDialog } from './entrepreneur';
import { DashboardMemberManager } from './collaborative/DashboardMemberManager';
import { SharedDashboardSelector } from './collaborative/SharedDashboardSelector';
import { SharedDashboardView } from './collaborative/SharedDashboardView';
import { useAtlasEnterprise } from '@/hooks/useAtlasEnterprise';
import { useSharedDashboards } from '@/hooks/useSharedDashboards';
import { usePersonaPermissions } from '@/hooks/usePersonaPermissions';
import { useDataHubController } from '@/hooks/useDataHubController';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CSuiteDataHubProps {
  userId: string | undefined;
  agents?: any[];
  agentsLoading?: boolean;
}

type PersonaCategory = 'executive' | 'tech' | 'people' | 'growth' | 'legal' | 'admin';

interface Persona {
  id: string;
  label: string;
  icon: typeof User;
  description: string;
  category: PersonaCategory;
  focusAreas: string[];
  matchTitles: string[];
}

const DOMAIN_CONFIG = [
  { key: 'communications' as DomainKey, label: 'Communications', icon: Mail, color: 'hsl(200 70% 50%)' },
  { key: 'documents' as DomainKey, label: 'Documents', icon: FileText, color: 'hsl(280 70% 50%)' },
  { key: 'events' as DomainKey, label: 'Events', icon: Calendar, color: 'hsl(150 70% 45%)' },
  { key: 'financials' as DomainKey, label: 'Financials', icon: DollarSign, color: 'hsl(45 80% 50%)' },
  { key: 'tasks' as DomainKey, label: 'Tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)' },
  { key: 'knowledge' as DomainKey, label: 'Knowledge', icon: BookOpen, color: 'hsl(220 70% 55%)' },
];

const PERSONAS: Persona[] = [
  { id: 'ceo', label: 'CEO', icon: User, description: 'Strategic overview & key decisions', category: 'executive', focusAreas: ['strategic_overview', 'key_decisions', 'market_position', 'stakeholder_concerns'], matchTitles: ['ceo', 'chief executive', 'founder', 'president', 'managing director', 'general manager'] },
  { id: 'cfo', label: 'CFO', icon: DollarSign, description: 'Financial health & forecasts', category: 'executive', focusAreas: ['financial_health', 'cash_flow', 'forecasts', 'compliance'], matchTitles: ['cfo', 'chief financial', 'finance director', 'controller', 'treasurer', 'vp finance'] },
  { id: 'coo', label: 'COO', icon: TrendingUp, description: 'Operations & efficiency', category: 'executive', focusAreas: ['operations_efficiency', 'process_optimization', 'team_performance', 'resource_allocation'], matchTitles: ['coo', 'chief operating', 'operations director', 'vp operations', 'head of operations'] },
  { id: 'chief_of_staff', label: 'Chief of Staff', icon: Briefcase, description: 'Cross-functional insights', category: 'executive', focusAreas: ['cross_functional', 'executive_priorities', 'organizational_alignment', 'action_items'], matchTitles: ['chief of staff', 'executive assistant', 'ea to', 'office manager'] },
  { id: 'cto', label: 'CTO', icon: Cpu, description: 'Technology strategy & innovation', category: 'tech', focusAreas: ['technology_strategy', 'innovation', 'technical_debt', 'infrastructure'], matchTitles: ['cto', 'chief technology', 'vp engineering', 'head of engineering', 'technical director', 'it director'] },
  { id: 'ciso', label: 'CISO', icon: Scale, description: 'Security posture & risk assessment', category: 'tech', focusAreas: ['security_posture', 'risk_assessment', 'compliance', 'incident_response'], matchTitles: ['ciso', 'chief information security', 'security director', 'head of security', 'information security'] },
  { id: 'chro', label: 'CHRO', icon: Users, description: 'Workforce analytics & culture', category: 'people', focusAreas: ['workforce_analytics', 'culture', 'talent_acquisition', 'retention'], matchTitles: ['chro', 'chief human resources', 'hr director', 'head of hr', 'vp hr', 'people director'] },
  { id: 'chief_people', label: 'Chief People Officer', icon: Users, description: 'Employee engagement & talent', category: 'people', focusAreas: ['employee_engagement', 'talent_development', 'organizational_culture', 'wellbeing'], matchTitles: ['chief people', 'head of people', 'people operations', 'talent director'] },
  { id: 'cmo', label: 'CMO', icon: Megaphone, description: 'Marketing performance & brand', category: 'growth', focusAreas: ['marketing_performance', 'brand_health', 'customer_insights', 'campaigns'], matchTitles: ['cmo', 'chief marketing', 'marketing director', 'vp marketing', 'head of marketing', 'brand director'] },
  { id: 'cro', label: 'CRO', icon: TrendingUp, description: 'Revenue growth & pipeline', category: 'growth', focusAreas: ['revenue_growth', 'pipeline', 'sales_performance', 'customer_success'], matchTitles: ['cro', 'chief revenue', 'sales director', 'vp sales', 'head of sales', 'business development'] },
  { id: 'clo', label: 'CLO', icon: Scale, description: 'Legal matters & contracts', category: 'legal', focusAreas: ['legal_matters', 'contracts', 'intellectual_property', 'litigation'], matchTitles: ['clo', 'chief legal', 'general counsel', 'legal director', 'head of legal'] },
  { id: 'cco', label: 'CCO', icon: CheckSquare, description: 'Compliance & regulatory', category: 'legal', focusAreas: ['compliance', 'regulatory', 'ethics', 'governance'], matchTitles: ['cco', 'chief compliance', 'compliance director', 'regulatory affairs', 'governance'] },
  { id: 'admin', label: 'Admin', icon: Cpu, description: 'System administration & oversight', category: 'admin', focusAreas: ['system_health', 'user_management', 'agent_oversight', 'platform_analytics', 'security_monitoring'], matchTitles: ['admin', 'administrator', 'superadmin', 'system admin'] },
  { id: 'entrepreneur', label: 'Entrepreneur', icon: Rocket, description: 'Business growth & automation', category: 'executive', focusAreas: ['revenue_growth', 'cash_flow', 'customer_acquisition', 'automation', 'opportunity_radar', 'idea_validation'], matchTitles: ['entrepreneur', 'founder', 'owner', 'solopreneur', 'business owner', 'small business', 'startup founder'] },
];

const PERSONA_CATEGORIES: { id: PersonaCategory; label: string }[] = [
  { id: 'executive', label: 'Executive' },
  { id: 'tech', label: 'Tech' },
  { id: 'people', label: 'People' },
  { id: 'growth', label: 'Growth' },
  { id: 'legal', label: 'Legal' },
  { id: 'admin', label: 'Admin' },
];

const CONNECTOR_CONFIG: Record<string, { label: string; icon: typeof Cloud; color: string }> = {
  gmail: { label: 'Gmail', icon: Mail, color: 'hsl(350 75% 55%)' },
  gdrive: { label: 'Google Drive', icon: Cloud, color: 'hsl(45 85% 50%)' },
  local: { label: 'Local Upload', icon: Upload, color: 'hsl(200 60% 50%)' },
};

export function CSuiteDataHub({ userId, agents = [], agentsLoading = false }: CSuiteDataHubProps) {
  const navigate = useNavigate();
  const {
    stats,
    connectors,
    reports,
    isLoading,
    isUploading,
    domainItems,
    loadingDomains,
    uploadFile,
    generateReport,
    fetchDomainItems,
    deleteItem,
    refresh,
  } = useCSuiteData(userId);

  // Atlas Data Hub Controller integration
  const dataHubController = useDataHubController();
  
  // Initialize enterprise hook with persona for permission-aware queries
  const [userPersona, setUserPersona] = useState<string | null>(null);
  const enterprise = useAtlasEnterprise(userId, userPersona);
  const personaPerms = usePersonaPermissions(userPersona);
  
  // Persona configs - needed before effects
  const [personaConfigs, setPersonaConfigs] = useState<Record<string, PersonaConfig>>(() => {
    const configs: Record<string, PersonaConfig> = {};
    PERSONAS.forEach(p => {
      configs[p.id] = { focusAreas: [...p.focusAreas], depth: 'standard' };
    });
    return configs;
  });
  
  // Sync local state with controller state
  type TabId = 'command' | 'insights' | 'admin';
  const [activeTab, setActiveTabLocal] = useState<TabId>(dataHubController.activeTab);
  const [generatingPersona, setGeneratingPersona] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomainLocal] = useState<DomainKey | null>(dataHubController.expandedDomain);
  const [selectedItem, setSelectedItem] = useState<DomainItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<PersonaCategory[]>([]);
  const [selectedReport, setSelectedReport] = useState<CSuiteReport | null>(null);
  const [enterpriseQuery, setEnterpriseQuery] = useState(dataHubController.enterpriseQuery);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Entrepreneur dialog states
  const [launchVentureOpen, setLaunchVentureOpen] = useState(false);
  const [growthOptimizerOpen, setGrowthOptimizerOpen] = useState(false);
  const [ideaValidatorOpen, setIdeaValidatorOpen] = useState(false);
  
  // Dashboard member invite dialog state
  const [inviteDashboardOpen, setInviteDashboardOpen] = useState(false);
  
  // Shared dashboards hook for member management
  const sharedDashboards = useSharedDashboards(userId);

  // Sync tab state with controller
  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabLocal(tab);
    dataHubController.setActiveTab(tab);
  }, [dataHubController]);

  // Sync domain state with controller
  const setExpandedDomain = useCallback((domain: DomainKey | null) => {
    setExpandedDomainLocal(domain);
    dataHubController.setExpandedDomain(domain);
  }, [dataHubController]);

  // Listen for controller state changes (from Atlas)
  useEffect(() => {
    const unsubscribe = useDataHubController.subscribe((state) => {
      // Sync tab
      if (state.activeTab !== activeTab) {
        setActiveTabLocal(state.activeTab);
      }
      // Sync domain
      if (state.expandedDomain !== expandedDomain) {
        setExpandedDomainLocal(state.expandedDomain);
        if (state.expandedDomain && domainItems[state.expandedDomain].length === 0) {
          fetchDomainItems(state.expandedDomain);
        }
      }
      // Sync enterprise query
      if (state.enterpriseQuery !== enterpriseQuery) {
        setEnterpriseQuery(state.enterpriseQuery);
      }
      // Sync persona from controller (e.g., when Atlas changes it)
      if (state.targetPersona !== null && state.targetPersona !== userPersona) {
        setUserPersona(state.targetPersona);
        const persona = PERSONAS.find(p => p.id === state.targetPersona);
        if (persona) {
          setSelectedCategories([persona.category]);
        }
      }
    });
    return unsubscribe;
  }, [activeTab, expandedDomain, enterpriseQuery, userPersona, domainItems, fetchDomainItems]);

  // Handle triggered enterprise query from Atlas
  useEffect(() => {
    if (dataHubController.triggerEnterpriseQuery && dataHubController.enterpriseQuery) {
      enterprise.queryEnterprise(dataHubController.enterpriseQuery);
      dataHubController.setTriggerEnterpriseQuery(false);
    }
  }, [dataHubController.triggerEnterpriseQuery, dataHubController.enterpriseQuery, enterprise]);

  // Handle triggered report generation from Atlas
  useEffect(() => {
    if (dataHubController.triggerReportGeneration && dataHubController.reportPersona) {
      const persona = dataHubController.reportPersona;
      const config = personaConfigs[persona];
      setGeneratingPersona(persona);
      generateReport(persona, {
        depth: config?.depth || 'standard',
        focusAreas: config?.focusAreas || [],
      }).then(() => {
        setGeneratingPersona(null);
        toast.success(`${persona.toUpperCase()} report generated`);
      });
      dataHubController.clearReportRequest();
    }
  }, [dataHubController.triggerReportGeneration, dataHubController.reportPersona, generateReport, personaConfigs]);

  // Handle triggered refresh from Atlas
  useEffect(() => {
    if (dataHubController.triggerRefresh) {
      refresh();
      dataHubController.clearRefreshRequest();
    }
  }, [dataHubController.triggerRefresh, refresh]);

  useEffect(() => {
    if (!userId) return;

    const checkAdminRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.warn('Failed to read user roles:', error);
        setIsSuperAdmin(false);
        setIsAdminUser(false);
        return;
      }

      const roles = (data || []).map(r => r.role);
      const superadmin = roles.includes('superadmin');
      const admin = roles.includes('admin');

      setIsSuperAdmin(superadmin);
      setIsAdminUser(superadmin || admin);
    };

    checkAdminRoles();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const DEFAULT_PERSONA = 'ceo';

    const applyPersona = (personaId: string | null, showToast = false) => {
      const nextPersona = personaId || DEFAULT_PERSONA;
      setUserPersona(nextPersona);
      dataHubController.setTargetPersona(nextPersona);

      const persona = PERSONAS.find(p => p.id === nextPersona);
      if (persona) setSelectedCategories([persona.category]);

      if (showToast) {
        toast.info(personaId ? 'Your persona has been updated' : 'Default persona applied');
      }
    };

    const loadUserPersona = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_persona')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Failed to load preferred persona, falling back to default:', error);
        applyPersona(null);
        return;
      }

      applyPersona(data?.preferred_persona ?? null);
    };

    loadUserPersona();

    // Real-time subscription for persona changes
    const channel = supabase
      .channel('profile-persona-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newPersona = (payload.new as any)?.preferred_persona as string | null;
          if (newPersona !== userPersona) {
            applyPersona(newPersona, true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userPersona, dataHubController]);


  const handleConfigChange = useCallback((personaId: string, config: PersonaConfig) => {
    setPersonaConfigs(prev => ({ ...prev, [personaId]: config }));
  }, []);

  const filteredPersonas = useMemo(() => {
    if (selectedCategories.length === 0) return PERSONAS;
    return PERSONAS.filter(p => selectedCategories.includes(p.category));
  }, [selectedCategories]);

  const toggleCategory = (category: PersonaCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => setSelectedCategories([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerateReport = async (persona: string) => {
    setGeneratingPersona(persona);
    const config = personaConfigs[persona];
    await generateReport(persona, {
      depth: config?.depth || 'standard',
      focusAreas: config?.focusAreas || [],
    });
    setGeneratingPersona(null);
  };

  const handleDomainClick = (domain: DomainKey) => {
    setExpandedDomain(domain);
    if (domainItems[domain].length === 0) {
      fetchDomainItems(domain);
    }
  };

  const handleItemClick = (item: DomainItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const totalItems = Object.values(stats).reduce((a, b) => a + b, 0);
  const canManagePersonas = isAdminUser;
  const personasForManager = PERSONAS.map(p => ({ id: p.id, label: p.label, category: p.category }));

  const expandedDomainConfig = expandedDomain 
    ? DOMAIN_CONFIG.find(d => d.key === expandedDomain) 
    : null;

  // Get current persona info
  const currentPersona = PERSONAS.find(p => p.id === userPersona);

  // Map personas to relevant agent sectors
  const PERSONA_SECTORS: Record<string, string[]> = {
    cfo: ['FINANCE'],
    ceo: ['FINANCE', 'DATA', 'UTILITY'],
    coo: ['UTILITY', 'DATA'],
    cto: ['DATA', 'SECURITY', 'UTILITY'],
    ciso: ['SECURITY', 'DATA'],
    cmo: ['CREATIVE', 'DATA'],
    cro: ['FINANCE', 'DATA'],
    chro: ['DATA', 'UTILITY'],
    chief_people: ['DATA', 'UTILITY'],
    chief_of_staff: ['FINANCE', 'DATA', 'UTILITY'],
    clo: ['DATA', 'UTILITY'],
    cco: ['DATA', 'SECURITY'],
    admin: ['FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY'],
    entrepreneur: ['FINANCE', 'DATA', 'CREATIVE', 'UTILITY'],
  };

  // Relevant sectors used for persona-specific agent filtering (passed to layouts)
  const relevantSectors = userPersona ? PERSONA_SECTORS[userPersona] || [] : [];

  return (
    <>
      {/* Full Page Domain View Overlay */}
      <FullscreenOverlay open={!!expandedDomain}>
        {expandedDomain && (
          <FullScreenDomainView
            domainKey={expandedDomain}
            items={domainItems[expandedDomain]}
            isLoading={loadingDomains[expandedDomain]}
            onBack={() => setExpandedDomain(null)}
            onItemClick={handleItemClick}
            onRefresh={() => fetchDomainItems(expandedDomain)}
          />
        )}
      </FullscreenOverlay>

      <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" />
              <span className="text-xs font-mono text-muted-foreground">C-SUITE DATA HUB</span>
              {currentPersona && !sharedDashboards.currentDashboard && (
                <Badge variant="outline" className="text-[8px] font-mono">
                  {currentPersona.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Dashboard View Switcher */}
              <SharedDashboardSelector
                dashboards={sharedDashboards.dashboards}
                currentDashboard={sharedDashboards.currentDashboard}
                onSelect={(id) => sharedDashboards.selectDashboard(id)}
                onCreate={sharedDashboards.createDashboard}
                isLoading={sharedDashboards.isLoading}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => refresh()}
                disabled={isLoading}
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>

          {/* Restructured Tabs - 4 Main Sections + Marketplace Shortcut */}
          <div className="flex items-center border-b border-border">
            <TabsList className="flex-1 justify-start rounded-none bg-transparent px-1 py-0 h-8 overflow-x-auto border-none">
              <TabsTrigger 
                value="command" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent flex items-center gap-1"
              >
                <Command size={10} />
                COMMAND
              </TabsTrigger>
              <TabsTrigger 
                value="insights" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent flex items-center gap-1"
              >
                <Lightbulb size={10} />
                INSIGHTS
              </TabsTrigger>
              {canManagePersonas && (
                <TabsTrigger 
                  value="admin" 
                  className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent flex items-center gap-1"
                >
                  <Settings size={10} />
                  ADMIN
                </TabsTrigger>
              )}
            </TabsList>
            {/* Marketplace Shortcut */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-mono flex items-center gap-1 text-muted-foreground hover:text-primary mr-1"
              onClick={() => navigate('/marketplace')}
            >
              <Plug size={10} />
              MARKETPLACE
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden min-h-0">
            {/* Show SharedDashboardView when a shared dashboard is selected */}
            {sharedDashboards.currentDashboard ? (
              <div className="h-full overflow-auto">
                <SharedDashboardView
                  dashboard={sharedDashboards.currentDashboard}
                  sharedItems={sharedDashboards.sharedItems}
                  members={sharedDashboards.members}
                  activities={sharedDashboards.activities}
                  activeViewers={sharedDashboards.activeViewers}
                  permissions={{
                    canView: true,
                    canUpload: ['contributor', 'editor', 'admin', 'owner'].includes(sharedDashboards.currentDashboard.my_role || ''),
                    canShare: ['editor', 'admin', 'owner'].includes(sharedDashboards.currentDashboard.my_role || ''),
                    canComment: true,
                    canManage: ['admin', 'owner'].includes(sharedDashboards.currentDashboard.my_role || ''),
                  }}
                  onUnshareItem={sharedDashboards.unshareItem}
                  onTogglePin={sharedDashboards.togglePinItem}
                  onInviteMember={(userId, role) => 
                    sharedDashboards.inviteMember(sharedDashboards.currentDashboard!.id, userId, role)
                  }
                  onUpdateMember={(memberId, role) => sharedDashboards.updateMemberRole(memberId, role)}
                  onRemoveMember={sharedDashboards.removeMember}
                />
              </div>
            ) : (
            /* COMMAND CENTER TAB - Unified Dashboard */
            <TabsContent value="command" className="h-full m-0 overflow-hidden">
                <ScrollArea className="h-full [&>[data-radix-scroll-area-viewport]]:max-h-full">
                  <div className="p-2 space-y-3">
                    {/* Quick Action Cards - Always visible for quick navigation */}
                    <QuickActionCards 
                      personaId={userPersona}
                      userId={userId}
                      onActionClick={(actionId) => {
                        const actionRoutes: Record<string, () => void> = {
                          // Common domain actions
                          inbox: () => handleDomainClick('communications'),
                          my_tasks: () => handleDomainClick('tasks'),
                          action_tracker: () => handleDomainClick('tasks'),
                          calendar: () => handleDomainClick('events'),
                          documents: () => handleDomainClick('documents'),
                          financials: () => handleDomainClick('financials'),
                          knowledge: () => handleDomainClick('knowledge'),
                          contracts: () => handleDomainClick('documents'),
                          meeting_prep: () => handleDomainClick('documents'),
                          financial_reports: () => handleDomainClick('documents'),
                          
                          // Dashboard & insights actions
                          kpi_dashboard: () => setActiveTab('insights'),
                          team_overview: () => setActiveTab('insights'),
                          operations_dashboard: () => setActiveTab('insights'),
                          workforce_analytics: () => setActiveTab('insights'),
                          engagement_dashboard: () => setActiveTab('insights'),
                          campaign_dashboard: () => setActiveTab('insights'),
                          revenue_dashboard: () => setActiveTab('insights'),
                          security_dashboard: () => setActiveTab('insights'),
                          compliance_dashboard: () => setActiveTab('insights'),
                          analytics: () => setActiveTab('insights'),
                          
                          // Tracking & planning actions
                          strategic_initiatives: () => setActiveTab('insights'),
                          budget_tracking: () => handleDomainClick('financials'),
                          forecasting: () => handleDomainClick('financials'),
                          pipeline_tracker: () => setActiveTab('insights'),
                          hiring_pipeline: () => setActiveTab('insights'),
                          process_tracker: () => setActiveTab('insights'),
                          matter_tracker: () => handleDomainClick('tasks'),
                          audit_tracker: () => handleDomainClick('tasks'),
                          roadmap: () => setActiveTab('insights'),
                          stakeholder_map: () => setActiveTab('insights'),
                          
                          // Resource & health actions
                          system_health: () => setActiveTab('insights'),
                          infrastructure: () => setActiveTab('insights'),
                          security_posture: () => setActiveTab('insights'),
                          compliance: () => setActiveTab('insights'),
                          compliance_tracker: () => setActiveTab('insights'),
                          risk_register: () => setActiveTab('insights'),
                          
                          // Content & assets
                          campaigns: () => handleDomainClick('communications'),
                          brand_assets: () => handleDomainClick('documents'),
                          learning_programs: () => handleDomainClick('knowledge'),
                          engagement_surveys: () => setActiveTab('insights'),
                          audit_logs: () => setActiveTab('insights'),
                          
                          // Admin actions
                          user_management: () => setActiveTab('admin'),
                          persona_management: () => setActiveTab('admin'),
                          invite_dashboard: () => {
                            // Select first dashboard if none selected
                            if (!sharedDashboards.currentDashboard && sharedDashboards.dashboards.length > 0) {
                              sharedDashboards.selectDashboard(sharedDashboards.dashboards[0].id);
                            }
                            setInviteDashboardOpen(true);
                          },
                          
                          // Entrepreneur-specific dialogs
                          growth_optimizer: () => setGrowthOptimizerOpen(true),
                          launch_venture: () => setLaunchVentureOpen(true),
                          idea_validator: () => setIdeaValidatorOpen(true),
                        };
                        const route = actionRoutes[actionId];
                        if (route) route();
                      }}
                      stats={stats}
                    />

                    {/* No Persona Warning */}
                    {!userPersona && (
                      <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
                        <AlertTriangle size={12} className="text-yellow-500" />
                        <span className="text-[10px] text-yellow-600">No persona assigned. Contact your admin for personalized insights.</span>
                      </div>
                    )}

                    {/* Upload & Reports Section */}
                    <div className="border-t border-border pt-3 space-y-3">
                      {/* Compact Upload + Reports Row */}
                      <div className="flex gap-2">
                        {/* Upload Button */}
                        <div className="flex-shrink-0">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.pptx"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-mono px-3"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || !userId}
                          >
                            <Upload size={10} className="mr-1" />
                            {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                          </Button>
                        </div>
                        
                        {/* Generate Report Button */}
                        {currentPersona && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-[10px] font-mono px-3"
                            onClick={() => handleGenerateReport(currentPersona.id)}
                            disabled={generatingPersona !== null || !userId || totalItems === 0}
                          >
                            {generatingPersona === currentPersona.id ? (
                              <RefreshCw size={10} className="animate-spin mr-1" />
                            ) : (
                              <Sparkles size={10} className="mr-1" />
                            )}
                            GENERATE REPORT
                          </Button>
                        )}
                      </div>

                      {/* Reports List */}
                      <div className="p-2 rounded bg-background border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={12} className="text-secondary" />
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {userPersona ? 'MY REPORTS' : 'ALL REPORTS'}
                          </span>
                          {userPersona && currentPersona && (
                            <Badge variant="outline" className="text-[7px] font-mono">
                              {currentPersona.label}
                            </Badge>
                          )}
                        </div>
                        <ReportHistoryList
                          reports={userPersona ? reports.filter(r => r.persona === userPersona) : reports}
                          onSelectReport={(report) => setSelectedReport(report)}
                          selectedReportId={selectedReport?.id}
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* INSIGHTS TAB - AI Intelligence + Summary */}
            {(
              <TabsContent value="insights" className="h-full m-0 overflow-hidden">
                <ScrollArea className="h-full [&>[data-radix-scroll-area-viewport]]:max-h-full">
                  <div className="p-2 space-y-3">
                    {/* Query Input */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain size={12} className="text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">ENTERPRISE QUERY</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={enterpriseQuery}
                          onChange={(e) => setEnterpriseQuery(e.target.value)}
                          placeholder="Ask about your enterprise data..."
                          className="flex-1 bg-input border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] font-mono px-2"
                          onClick={() => enterprise.queryEnterprise(enterpriseQuery)}
                          disabled={enterprise.isLoading || !enterpriseQuery.trim()}
                        >
                          {enterprise.isLoading ? <RefreshCw size={10} className="animate-spin" /> : 'QUERY'}
                        </Button>
                      </div>
                    </div>

                    {/* Removed manual CORRELATE/ANALYZE/RECOMMEND buttons - Atlas handles this automatically */}

                    {/* Query Results */}
                    {enterprise.lastQuery && (
                      <div className="p-2 rounded bg-background border border-primary/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye size={10} className="text-primary" />
                          <span className="text-[9px] font-mono text-muted-foreground">QUERY RESULTS</span>
                        </div>
                        <p className="text-xs text-foreground">{enterprise.lastQuery.answer}</p>
                        {enterprise.lastQuery.agents && enterprise.lastQuery.agents.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {enterprise.lastQuery.agents.slice(0, 3).map((agent: any) => (
                              <Badge key={agent.id} variant="secondary" className="text-[8px] font-mono">
                                {agent.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Correlations */}
                    {enterprise.lastCorrelation && enterprise.lastCorrelation.correlations?.length > 0 && (
                      <div className="p-2 rounded bg-background border border-secondary/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity size={10} className="text-secondary" />
                          <span className="text-[9px] font-mono text-muted-foreground">CORRELATIONS</span>
                        </div>
                        <div className="space-y-1">
                          {enterprise.lastCorrelation.correlations.slice(0, 3).map((corr: any, i: number) => (
                            <div key={i} className="text-[10px] text-foreground/80 flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{corr.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Analysis */}
                    {enterprise.lastAnalysis && (
                      <div className="p-2 rounded bg-background border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={10} className="text-yellow-500" />
                          <span className="text-[9px] font-mono text-muted-foreground">ANALYSIS</span>
                        </div>
                        <p className="text-xs text-foreground/80">{enterprise.lastAnalysis.executiveSummary}</p>
                        {enterprise.lastAnalysis.risks && enterprise.lastAnalysis.risks.length > 0 && (
                          <div className="mt-2">
                            <span className="text-[9px] text-muted-foreground">RISKS:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {enterprise.lastAnalysis.risks.slice(0, 2).map((risk: any, i: number) => (
                                <Badge key={i} variant="destructive" className="text-[8px] font-mono">
                                  {risk.risk?.slice(0, 25) || 'Risk identified'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    {enterprise.lastRecommendations && (
                      <div className="p-2 rounded bg-background border border-green-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={10} className="text-green-500" />
                          <span className="text-[9px] font-mono text-muted-foreground">RECOMMENDATIONS</span>
                        </div>
                        {enterprise.lastRecommendations.immediate && enterprise.lastRecommendations.immediate.length > 0 && (
                          <div className="space-y-1">
                            {enterprise.lastRecommendations.immediate.slice(0, 3).map((rec: any, i: number) => (
                              <div key={i} className="text-[10px] text-foreground/80 flex items-start gap-1">
                                <span className="text-green-500">→</span>
                                <span>{rec.action}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Atlas Summary Section */}
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Bell size={12} className="text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">ATLAS AI SUMMARY</span>
                      </div>
                      <AtlasSummaryTab userId={userId} />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* ADMIN TAB - Superadmin/Admin Only */}
            {canManagePersonas && (
              <TabsContent value="admin" className="h-full m-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 [&>[data-radix-scroll-area-viewport]]:max-h-full">
                  <div className="p-2 space-y-3">
                    {/* User Persona Manager */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users size={12} className="text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">USER PERSONAS</span>
                      </div>
                      <UserPersonaManager 
                        personas={personasForManager} 
                        currentUserId={userId}
                        onPersonaChange={(changedUserId, newPersonaId) => {
                          // If the changed user is the current user, update local persona state
                          if (changedUserId === userId) {
                            setUserPersona(newPersonaId);
                            dataHubController.setTargetPersona(newPersonaId);
                            // Update category filter to match new persona
                            if (newPersonaId) {
                              const persona = PERSONAS.find(p => p.id === newPersonaId);
                              if (persona) {
                                setSelectedCategories([persona.category]);
                              }
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Persona Permissions Manager */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings size={12} className="text-secondary" />
                        <span className="text-[10px] font-mono text-muted-foreground">PERSONA PERMISSIONS</span>
                      </div>
                      <PersonaPermissionsManager personas={personasForManager} />
                    </div>

                    {/* Persona Report Generation */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">PERSONA REPORT GENERATOR</span>
                      </div>
                      
                      {/* Filter Bar */}
                      <div className="flex items-center gap-1.5 pb-2 border-b border-border mb-2 flex-wrap">
                        <Filter size={10} className="text-muted-foreground" />
                        {PERSONA_CATEGORIES.map(({ id, label }) => (
                          <Badge
                            key={id}
                            variant={selectedCategories.includes(id) ? 'default' : 'outline'}
                            className="text-[9px] font-mono cursor-pointer hover:bg-primary/20 transition-colors px-1.5 py-0"
                            onClick={() => toggleCategory(id)}
                          >
                            {label}
                          </Badge>
                        ))}
                        {selectedCategories.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 px-1 text-[9px] text-muted-foreground hover:text-foreground"
                            onClick={clearFilters}
                          >
                            <X size={8} className="mr-0.5" />
                            Clear
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filteredPersonas.map(({ id, label, icon: Icon, description, category, focusAreas }) => {
                          const config = personaConfigs[id];
                          const customized = config && (
                            config.depth !== 'standard' || 
                            config.focusAreas.length !== focusAreas.length
                          );
                          
                          return (
                            <div
                              key={id}
                              className="p-2 rounded bg-muted/20 border border-border"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Icon size={12} className="text-primary" />
                                  <span className="text-[10px] font-mono text-foreground">{label}</span>
                                  <Badge variant="secondary" className="text-[7px] font-mono px-1 py-0">
                                    {category}
                                  </Badge>
                                  {customized && (
                                    <Badge variant="outline" className="text-[7px] font-mono px-1 py-0 border-primary/50 text-primary">
                                      custom
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <PersonaConfigPopover
                                    personaId={id}
                                    availableFocusAreas={focusAreas}
                                    config={config || { focusAreas: [...focusAreas], depth: 'standard' }}
                                    onConfigChange={handleConfigChange}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-5 text-[9px] font-mono px-2"
                                    onClick={() => handleGenerateReport(id)}
                                    disabled={generatingPersona !== null || !userId || totalItems === 0}
                                  >
                                    {generatingPersona === id ? (
                                      <RefreshCw size={8} className="animate-spin" />
                                    ) : (
                                      <Sparkles size={8} />
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <p className="text-[9px] text-muted-foreground">{description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Connector Management */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Cloud size={12} className="text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">CONNECTORS</span>
                      </div>
                      <div className="space-y-1">
                        {connectors.map((conn) => {
                          const config = CONNECTOR_CONFIG[conn.provider];
                          if (!config) return null;
                          const ConnIcon = config.icon;
                          return (
                            <div key={conn.provider} className="flex items-center justify-between p-1.5 rounded bg-muted/20">
                              <div className="flex items-center gap-2">
                                <ConnIcon size={10} style={{ color: config.color }} />
                                <span className="text-[9px] font-mono">{config.label}</span>
                              </div>
                              <Badge 
                                variant={conn.status === 'connected' ? 'default' : 'secondary'} 
                                className="text-[8px] font-mono"
                              >
                                {conn.status.toUpperCase()}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>

      {/* Item Detail Drawer */}
      <DomainItemDrawer
        item={selectedItem}
        domain={expandedDomain}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onDelete={deleteItem}
      />

      {/* Report Viewer */}
      {selectedReport && (
        <ReportViewer
          report={selectedReport}
          reports={reports}
          onClose={() => setSelectedReport(null)}
          onNavigate={(report) => setSelectedReport(report)}
        />
      )}

      {/* Entrepreneur Dialogs */}
      <LaunchVentureDialog 
        open={launchVentureOpen} 
        onOpenChange={setLaunchVentureOpen} 
      />
      <GrowthOptimizerDialog 
        open={growthOptimizerOpen} 
        onOpenChange={setGrowthOptimizerOpen} 
      />
      <IdeaValidatorDialog 
        open={ideaValidatorOpen} 
        onOpenChange={setIdeaValidatorOpen} 
      />
      
      {/* Dashboard Member Invite Dialog */}
      <DashboardMemberManager
        open={inviteDashboardOpen}
        onOpenChange={setInviteDashboardOpen}
        members={sharedDashboards.members}
        onInvite={sharedDashboards.inviteMember}
        onUpdateRole={sharedDashboards.updateMemberRole}
        onRemove={sharedDashboards.removeMember}
      />
    </>
  );
}
