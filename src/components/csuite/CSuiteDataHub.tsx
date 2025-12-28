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
  Library,
  Command,
  Lightbulb,
  FolderOpen,
  AlertTriangle,
  Bell,
  Target,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCSuiteData, DataDomainStats, DomainKey, DomainItem, CSuiteReport } from '@/hooks/useCSuiteData';
import { DomainDetailView } from './DomainDetailView';
import { DomainItemDrawer } from './DomainItemDrawer';
import { PersonaConfigPopover, PersonaConfig } from './PersonaConfigPopover';
import { ReportViewer } from './ReportViewer';
import { ReportHistoryList } from './ReportHistoryList';
import { AtlasSummaryTab } from './AtlasSummaryTab';
import { UserPersonaManager } from './UserPersonaManager';
import { PersonaPermissionsManager } from './PersonaPermissionsManager';
import { PersonaLayoutRenderer } from './persona-layouts/PersonaLayoutRenderer';
import { QuickActionCards } from './QuickActionCards';
import { useAtlasEnterprise } from '@/hooks/useAtlasEnterprise';
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
  type TabId = 'command' | 'insights' | 'library' | 'admin';
  const [activeTab, setActiveTabLocal] = useState<TabId>(dataHubController.activeTab);
  const [generatingPersona, setGeneratingPersona] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomainLocal] = useState<DomainKey | null>(dataHubController.expandedDomain);
  const [selectedItem, setSelectedItem] = useState<DomainItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<PersonaCategory[]>([]);
  const [selectedReport, setSelectedReport] = useState<CSuiteReport | null>(null);
  const [enterpriseQuery, setEnterpriseQuery] = useState(dataHubController.enterpriseQuery);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    const checkSuperAdmin = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'superadmin')
        .maybeSingle();
      
      setIsSuperAdmin(!!data);
    };
    
    checkSuperAdmin();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    
    const loadUserPersona = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('preferred_persona')
        .eq('user_id', userId)
        .single();
      
      if (data?.preferred_persona) {
        setUserPersona(data.preferred_persona);
        dataHubController.setTargetPersona(data.preferred_persona);
        const persona = PERSONAS.find(p => p.id === data.preferred_persona);
        if (persona) {
          setSelectedCategories([persona.category]);
        }
      }
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
          const newPersona = payload.new.preferred_persona as string | null;
          if (newPersona !== userPersona) {
            setUserPersona(newPersona);
            dataHubController.setTargetPersona(newPersona);
            if (newPersona) {
              const persona = PERSONAS.find(p => p.id === newPersona);
              if (persona) {
                setSelectedCategories([persona.category]);
              }
            }
            toast.info('Your persona has been updated');
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
  const canManagePersonas = isSuperAdmin || userPersona === 'admin';
  const personasForManager = PERSONAS.map(p => ({ id: p.id, label: p.label, category: p.category }));

  const expandedDomainConfig = expandedDomain 
    ? DOMAIN_CONFIG.find(d => d.key === expandedDomain) 
    : null;

  // Get current persona info
  const currentPersona = PERSONAS.find(p => p.id === userPersona);

  // Calculate quick stats for command center
  const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;
  const processingAgents = agents.filter(a => a.status === 'PROCESSING').length;

  return (
    <>
      <div className="flex-1 bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" />
              <span className="text-xs font-mono text-muted-foreground">C-SUITE DATA HUB</span>
              {currentPersona && (
                <Badge variant="outline" className="text-[8px] font-mono">
                  {currentPersona.label}
                </Badge>
              )}
            </div>
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

          {/* Restructured Tabs - 4 Main Sections */}
          {!expandedDomain && (
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-1 py-0 h-8 overflow-x-auto">
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
              <TabsTrigger 
                value="library" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent flex items-center gap-1"
              >
                <Library size={10} />
                LIBRARY
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
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {/* Expanded Domain View */}
            {expandedDomain && expandedDomainConfig && (
              <DomainDetailView
                domainKey={expandedDomain}
                label={expandedDomainConfig.label}
                color={expandedDomainConfig.color}
                items={domainItems[expandedDomain]}
                isLoading={loadingDomains[expandedDomain]}
                onBack={() => setExpandedDomain(null)}
                onItemClick={handleItemClick}
              />
            )}

            {/* COMMAND CENTER TAB - Unified Dashboard */}
            {!expandedDomain && (
              <TabsContent value="command" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-3">
                    {/* Quick Status Bar */}
                    <div className="flex gap-2">
                      <div className="flex-1 p-2 rounded bg-primary/10 border border-primary/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity size={10} className="text-primary" />
                          <span className="text-[9px] font-mono text-muted-foreground">AGENTS</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-mono text-primary">{activeAgents}</span>
                          <span className="text-[9px] text-muted-foreground">active</span>
                          {processingAgents > 0 && (
                            <Badge variant="secondary" className="text-[8px] ml-1">{processingAgents} proc</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 p-2 rounded bg-secondary/10 border border-secondary/30">
                        <div className="flex items-center gap-2 mb-1">
                          <FolderOpen size={10} className="text-secondary" />
                          <span className="text-[9px] font-mono text-muted-foreground">DATA</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-mono text-secondary">{totalItems}</span>
                          <span className="text-[9px] text-muted-foreground">items</span>
                        </div>
                      </div>
                      <div className="flex-1 p-2 rounded bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={10} className="text-green-500" />
                          <span className="text-[9px] font-mono text-muted-foreground">REPORTS</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-mono text-green-500">{reports.length}</span>
                          <span className="text-[9px] text-muted-foreground">generated</span>
                        </div>
                      </div>
                    </div>

                    {/* Domain Access Permissions - Visual indicator */}
                    {userPersona && (
                      <div className="p-2 rounded bg-background border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield size={10} className="text-primary" />
                          <span className="text-[9px] font-mono text-muted-foreground">DOMAIN ACCESS</span>
                          <Badge variant="outline" className="text-[7px] font-mono ml-auto">
                            {currentPersona?.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {DOMAIN_CONFIG.map(({ key, label, icon: Icon, color }) => {
                            const canView = personaPerms.canViewDomain(key);
                            return (
                              <Badge 
                                key={key}
                                variant={canView ? 'default' : 'outline'}
                                className={`text-[8px] font-mono flex items-center gap-1 ${
                                  canView 
                                    ? 'bg-primary/20 text-primary border-primary/30' 
                                    : 'opacity-50 text-muted-foreground'
                                }`}
                              >
                                <Icon size={8} style={{ color: canView ? color : undefined }} />
                                {label}
                                {canView ? (
                                  <Eye size={6} className="ml-0.5" />
                                ) : (
                                  <X size={6} className="ml-0.5" />
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quick Action Cards - Persona-specific */}
                    <QuickActionCards 
                      personaId={userPersona}
                      onActionClick={(actionId) => {
                        // Handle action clicks - for now, switch to insights tab for analysis actions
                        if (['strategic_review', 'financial_forecast', 'threat_assessment', 'compliance_status'].includes(actionId)) {
                          setActiveTab('insights');
                        } else if (['browse_data', 'recent_docs', 'contract_review', 'view_tasks'].includes(actionId)) {
                          setActiveTab('library');
                        }
                      }}
                      stats={stats}
                    />

                    {/* Persona-Specific Layout */}
                    {userPersona ? (
                      <PersonaLayoutRenderer
                        personaId={userPersona}
                        stats={stats}
                        domainItems={domainItems}
                        loadingDomains={loadingDomains}
                        onDomainClick={(domain) => {
                          if (personaPerms.canViewDomain(domain)) {
                            handleDomainClick(domain);
                          }
                        }}
                        onItemClick={handleItemClick}
                        agents={agents}
                        enterpriseData={{
                          lastQuery: enterprise.lastQuery,
                          lastAnalysis: enterprise.lastAnalysis,
                          lastCorrelation: enterprise.lastCorrelation,
                          lastRecommendations: enterprise.lastRecommendations,
                        }}
                      />
                    ) : (
                      /* Default Command Center when no persona */
                      <div className="space-y-3">
                        {/* Alert Banner */}
                        <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
                          <AlertTriangle size={12} className="text-yellow-500" />
                          <span className="text-[10px] text-yellow-600">No persona assigned. Contact your admin to get personalized insights.</span>
                        </div>

                        {/* Domain Quick Access */}
                        <div className="p-2 rounded bg-background border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <Target size={12} className="text-primary" />
                            <span className="text-[10px] font-mono text-muted-foreground">QUICK ACCESS</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {DOMAIN_CONFIG.map(({ key, label, icon: Icon, color }) => (
                              <button
                                key={key}
                                onClick={() => handleDomainClick(key)}
                                className="p-2 rounded bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/30 transition-all text-center"
                              >
                                <Icon size={14} style={{ color }} className="mx-auto mb-1" />
                                <span className="text-[9px] font-mono text-muted-foreground block">{label}</span>
                                <span className="text-sm font-mono text-foreground">{stats[key]}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Connectors Status */}
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
                                <div key={conn.provider} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ConnIcon size={10} style={{ color: config.color }} />
                                    <span className="text-[9px] font-mono">{config.label}</span>
                                  </div>
                                  <span className={`text-[8px] font-mono ${
                                    conn.status === 'connected' ? 'text-green-500' : 'text-muted-foreground'
                                  }`}>
                                    {conn.status.toUpperCase()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload Section */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Upload size={12} className="text-secondary" />
                        <span className="text-[10px] font-mono text-muted-foreground">QUICK UPLOAD</span>
                      </div>
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
                        className="w-full text-[10px] font-mono"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || !userId}
                      >
                        {isUploading ? 'UPLOADING...' : 'SELECT FILES'}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* INSIGHTS TAB - AI Intelligence + Summary */}
            {!expandedDomain && (
              <TabsContent value="insights" className="h-full m-0">
                <ScrollArea className="h-full">
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

                    {/* Quick Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-[9px] font-mono"
                        onClick={() => enterprise.findCorrelations()}
                        disabled={enterprise.isLoading}
                      >
                        {enterprise.isLoading ? <RefreshCw size={10} className="animate-spin mr-1" /> : <Activity size={10} className="mr-1" />}
                        CORRELATE
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-[9px] font-mono"
                        onClick={() => enterprise.analyzeEnterprise()}
                        disabled={enterprise.isLoading}
                      >
                        {enterprise.isLoading ? <RefreshCw size={10} className="animate-spin mr-1" /> : <Zap size={10} className="mr-1" />}
                        ANALYZE
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-[9px] font-mono"
                        onClick={() => enterprise.getRecommendations()}
                        disabled={enterprise.isLoading}
                      >
                        {enterprise.isLoading ? <RefreshCw size={10} className="animate-spin mr-1" /> : <Sparkles size={10} className="mr-1" />}
                        RECOMMEND
                      </Button>
                    </div>

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

            {/* LIBRARY TAB - Data Domains + Reports */}
            {!expandedDomain && (
              <TabsContent value="library" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-3">
                    {/* Domain Browser - Filtered by persona permissions */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <FolderOpen size={12} className="text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">DATA DOMAINS</span>
                        {userPersona && (
                          <Badge variant="outline" className="text-[7px] font-mono ml-1">
                            {currentPersona?.label} VIEW
                          </Badge>
                        )}
                        <span className="text-[9px] text-muted-foreground ml-auto">
                          {DOMAIN_CONFIG.filter(d => personaPerms.canViewDomain(d.key)).reduce((sum, d) => sum + stats[d.key], 0)} accessible
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {DOMAIN_CONFIG.map(({ key, label, icon: Icon, color }) => {
                          const canView = personaPerms.canViewDomain(key);
                          
                          if (!canView) {
                            // Show restricted domains as disabled
                            return (
                              <div
                                key={key}
                                className="p-2 rounded bg-muted/10 border border-border/50 opacity-50 cursor-not-allowed"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Icon size={12} className="text-muted-foreground" />
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {label}
                                  </span>
                                  <Shield size={8} className="text-muted-foreground ml-auto" />
                                </div>
                                <span className="text-[9px] font-mono text-muted-foreground">Restricted</span>
                              </div>
                            );
                          }
                          
                          return (
                            <button
                              key={key}
                              onClick={() => handleDomainClick(key)}
                              className="p-2 rounded bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-primary/30 transition-all text-left group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Icon size={12} style={{ color }} />
                                <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                                  {label}
                                </span>
                              </div>
                              <span className="text-lg font-mono text-foreground group-hover:text-primary transition-colors">
                                {stats[key]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reports Section - Filtered by persona */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={12} className="text-secondary" />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {userPersona ? 'MY REPORTS' : 'ALL REPORTS'}
                        </span>
                        {userPersona && (
                          <Badge variant="outline" className="text-[7px] font-mono">
                            {currentPersona?.label}
                          </Badge>
                        )}
                        <span className="text-[9px] text-muted-foreground ml-auto">
                          {userPersona 
                            ? reports.filter(r => r.persona === userPersona).length 
                            : reports.length} reports
                        </span>
                      </div>
                      <ReportHistoryList
                        reports={userPersona ? reports.filter(r => r.persona === userPersona) : reports}
                        onSelectReport={(report) => setSelectedReport(report)}
                        selectedReportId={selectedReport?.id}
                      />
                    </div>

                    {/* Generate Report Quick Actions */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">QUICK GENERATE</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {currentPersona && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[9px] font-mono"
                            onClick={() => handleGenerateReport(currentPersona.id)}
                            disabled={generatingPersona !== null || !userId || totalItems === 0}
                          >
                            {generatingPersona === currentPersona.id ? (
                              <RefreshCw size={10} className="animate-spin mr-1" />
                            ) : (
                              <Sparkles size={10} className="mr-1" />
                            )}
                            {currentPersona.label} BRIEFING
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* ADMIN TAB - Superadmin/Admin Only */}
            {!expandedDomain && canManagePersonas && (
              <TabsContent value="admin" className="h-full m-0 p-2 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="space-y-3">
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
    </>
  );
}
