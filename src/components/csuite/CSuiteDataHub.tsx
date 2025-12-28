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
  ExternalLink,
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
  Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCSuiteData, DataDomainStats, DomainKey, DomainItem, CSuiteReport } from '@/hooks/useCSuiteData';
import { DomainDetailView } from './DomainDetailView';
import { DomainItemDrawer } from './DomainItemDrawer';
import { PersonaConfigPopover, PersonaConfig, ReportDepth } from './PersonaConfigPopover';
import { ReportViewer } from './ReportViewer';
import { ReportHistoryList } from './ReportHistoryList';
import { AtlasSummaryTab } from './AtlasSummaryTab';
import { useAtlasEnterprise } from '@/hooks/useAtlasEnterprise';
import { supabase } from '@/integrations/supabase/client';

interface CSuiteDataHubProps {
  userId: string | undefined;
  agents?: any[];
  agentsLoading?: boolean;
}

type PersonaCategory = 'executive' | 'tech' | 'people' | 'growth' | 'legal';

interface Persona {
  id: string;
  label: string;
  icon: typeof User;
  description: string;
  category: PersonaCategory;
  focusAreas: string[];
  matchTitles: string[]; // Job titles that match this persona
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
  // Executive
  { id: 'ceo', label: 'CEO', icon: User, description: 'Strategic overview & key decisions', category: 'executive', focusAreas: ['strategic_overview', 'key_decisions', 'market_position', 'stakeholder_concerns'], matchTitles: ['ceo', 'chief executive', 'founder', 'president', 'managing director', 'general manager'] },
  { id: 'cfo', label: 'CFO', icon: DollarSign, description: 'Financial health & forecasts', category: 'executive', focusAreas: ['financial_health', 'cash_flow', 'forecasts', 'compliance'], matchTitles: ['cfo', 'chief financial', 'finance director', 'controller', 'treasurer', 'vp finance'] },
  { id: 'coo', label: 'COO', icon: TrendingUp, description: 'Operations & efficiency', category: 'executive', focusAreas: ['operations_efficiency', 'process_optimization', 'team_performance', 'resource_allocation'], matchTitles: ['coo', 'chief operating', 'operations director', 'vp operations', 'head of operations'] },
  { id: 'chief_of_staff', label: 'Chief of Staff', icon: Briefcase, description: 'Cross-functional insights', category: 'executive', focusAreas: ['cross_functional', 'executive_priorities', 'organizational_alignment', 'action_items'], matchTitles: ['chief of staff', 'executive assistant', 'ea to', 'office manager'] },
  // Tech Leadership
  { id: 'cto', label: 'CTO', icon: Cpu, description: 'Technology strategy & innovation', category: 'tech', focusAreas: ['technology_strategy', 'innovation', 'technical_debt', 'infrastructure'], matchTitles: ['cto', 'chief technology', 'vp engineering', 'head of engineering', 'technical director', 'it director'] },
  { id: 'ciso', label: 'CISO', icon: Scale, description: 'Security posture & risk assessment', category: 'tech', focusAreas: ['security_posture', 'risk_assessment', 'compliance', 'incident_response'], matchTitles: ['ciso', 'chief information security', 'security director', 'head of security', 'information security'] },
  // People & Culture
  { id: 'chro', label: 'CHRO', icon: Users, description: 'Workforce analytics & culture', category: 'people', focusAreas: ['workforce_analytics', 'culture', 'talent_acquisition', 'retention'], matchTitles: ['chro', 'chief human resources', 'hr director', 'head of hr', 'vp hr', 'people director'] },
  { id: 'chief_people', label: 'Chief People Officer', icon: Users, description: 'Employee engagement & talent', category: 'people', focusAreas: ['employee_engagement', 'talent_development', 'organizational_culture', 'wellbeing'], matchTitles: ['chief people', 'head of people', 'people operations', 'talent director'] },
  // Growth & Marketing
  { id: 'cmo', label: 'CMO', icon: Megaphone, description: 'Marketing performance & brand', category: 'growth', focusAreas: ['marketing_performance', 'brand_health', 'customer_insights', 'campaigns'], matchTitles: ['cmo', 'chief marketing', 'marketing director', 'vp marketing', 'head of marketing', 'brand director'] },
  { id: 'cro', label: 'CRO', icon: TrendingUp, description: 'Revenue growth & pipeline', category: 'growth', focusAreas: ['revenue_growth', 'pipeline', 'sales_performance', 'customer_success'], matchTitles: ['cro', 'chief revenue', 'sales director', 'vp sales', 'head of sales', 'business development'] },
  // Legal & Compliance
  { id: 'clo', label: 'CLO', icon: Scale, description: 'Legal matters & contracts', category: 'legal', focusAreas: ['legal_matters', 'contracts', 'intellectual_property', 'litigation'], matchTitles: ['clo', 'chief legal', 'general counsel', 'legal director', 'head of legal'] },
  { id: 'cco', label: 'CCO', icon: CheckSquare, description: 'Compliance & regulatory', category: 'legal', focusAreas: ['compliance', 'regulatory', 'ethics', 'governance'], matchTitles: ['cco', 'chief compliance', 'compliance director', 'regulatory affairs', 'governance'] },
];

const PERSONA_CATEGORIES: { id: PersonaCategory; label: string }[] = [
  { id: 'executive', label: 'Executive' },
  { id: 'tech', label: 'Tech' },
  { id: 'people', label: 'People' },
  { id: 'growth', label: 'Growth' },
  { id: 'legal', label: 'Legal' },
];

const CONNECTOR_CONFIG: Record<string, { label: string; icon: typeof Cloud; color: string }> = {
  gmail: { label: 'Gmail', icon: Mail, color: 'hsl(350 75% 55%)' },
  gdrive: { label: 'Google Drive', icon: Cloud, color: 'hsl(45 85% 50%)' },
  local: { label: 'Local Upload', icon: Upload, color: 'hsl(200 60% 50%)' },
};

// Helper function to match job title to persona
function matchTitleToPersona(jobTitle: string): string {
  if (!jobTitle) return 'ceo'; // Default persona
  const title = jobTitle.toLowerCase();
  
  for (const persona of PERSONAS) {
    if (persona.matchTitles.some(match => title.includes(match))) {
      return persona.id;
    }
  }
  
  // Default to CEO for general leadership or unknown titles
  return 'ceo';
}

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
    connectProvider,
    generateReport,
    fetchDomainItems,
    refresh,
  } = useCSuiteData(userId);

  // Enterprise intelligence integration
  const enterprise = useAtlasEnterprise(userId);

  const [activeTab, setActiveTab] = useState('data');
  const [generatingPersona, setGeneratingPersona] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<DomainKey | null>(null);
  const [selectedItem, setSelectedItem] = useState<DomainItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<PersonaCategory[]>([]);
  const [selectedReport, setSelectedReport] = useState<CSuiteReport | null>(null);
  const [userPersona, setUserPersona] = useState<string | null>(null);
  const [enterpriseQuery, setEnterpriseQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user's assigned persona from profile
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
        // Pre-select the user's persona category
        const persona = PERSONAS.find(p => p.id === data.preferred_persona);
        if (persona) {
          setSelectedCategories([persona.category]);
        }
      }
    };
    
    loadUserPersona();
  }, [userId]);

  // Initialize persona configs with defaults
  const [personaConfigs, setPersonaConfigs] = useState<Record<string, PersonaConfig>>(() => {
    const configs: Record<string, PersonaConfig> = {};
    PERSONAS.forEach(p => {
      configs[p.id] = { focusAreas: [...p.focusAreas], depth: 'standard' };
    });
    return configs;
  });

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

  // Get expanded domain config
  const expandedDomainConfig = expandedDomain 
    ? DOMAIN_CONFIG.find(d => d.key === expandedDomain) 
    : null;

  return (
    <>
      <div className="flex-1 bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" />
              <span className="text-xs font-mono text-muted-foreground">C-SUITE DATA HUB</span>
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

          {/* Tabs - Hide when domain is expanded */}
          {!expandedDomain && (
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-1 py-0 h-8 overflow-x-auto">
              <TabsTrigger 
                value="data" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                DATA
              </TabsTrigger>
              <TabsTrigger 
                value="intelligence" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                INTEL
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                DASH
              </TabsTrigger>
              <TabsTrigger 
                value="personas" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                PERSONAS
              </TabsTrigger>
              <TabsTrigger 
                value="reports" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                REPORTS
              </TabsTrigger>
              <TabsTrigger 
                value="summary" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                SUMMARY
              </TabsTrigger>
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

            {/* Data Domains Tab */}
            {!expandedDomain && (
              <TabsContent value="data" className="h-full m-0 p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {/* Summary */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-muted-foreground">TOTAL ITEMS</span>
                        <span className="text-sm font-mono text-primary">{totalItems}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                          style={{ width: `${Math.min((totalItems / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Domain Grid - Clickable Cards */}
                    <div className="grid grid-cols-2 gap-2 animate-scale-fade-in"
                      style={{ 
                        animationDuration: '0.3s',
                        animationFillMode: 'both',
                        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      {DOMAIN_CONFIG.map(({ key, label, icon: Icon, color }, index) => (
                        <button
                          key={key}
                          onClick={() => handleDomainClick(key)}
                          className="p-2 rounded bg-background border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left group hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            animationName: 'stagger-fade-in',
                            animationDuration: '0.3s',
                            animationDelay: `${index * 50}ms`,
                            animationFillMode: 'both',
                            animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
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
                      ))}
                    </div>

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

            {/* Intelligence Tab - Enterprise Insights */}
            {!expandedDomain && (
              <TabsContent value="intelligence" className="h-full m-0 p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
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
                          {enterprise.lastCorrelation.correlations.slice(0, 3).map((corr, i) => (
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
                              {enterprise.lastAnalysis.risks.slice(0, 2).map((risk, i) => (
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
                            {enterprise.lastRecommendations.immediate.slice(0, 3).map((rec, i) => (
                              <div key={i} className="text-[10px] text-foreground/80 flex items-start gap-1">
                                <span className="text-green-500">→</span>
                                <span>{rec.action}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Dashboard Tab - Executive Overview */}
            {!expandedDomain && (
              <TabsContent value="dashboard" className="h-full m-0 p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {/* Agent Overview */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity size={12} className="text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">AGENT STATUS</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 rounded bg-muted/30">
                          <div className="text-lg font-mono text-primary">{agents.length}</div>
                          <div className="text-[9px] text-muted-foreground">TOTAL</div>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/30">
                          <div className="text-lg font-mono text-green-500">
                            {agents.filter(a => a.status === 'ACTIVE').length}
                          </div>
                          <div className="text-[9px] text-muted-foreground">ACTIVE</div>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/30">
                          <div className="text-lg font-mono text-yellow-500">
                            {agents.filter(a => a.status === 'PROCESSING').length}
                          </div>
                          <div className="text-[9px] text-muted-foreground">PROCESSING</div>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/30">
                          <div className="text-lg font-mono text-muted-foreground">
                            {agents.filter(a => a.status === 'IDLE').length}
                          </div>
                          <div className="text-[9px] text-muted-foreground">IDLE</div>
                        </div>
                      </div>
                    </div>

                    {/* Data Coverage */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 size={12} className="text-secondary" />
                        <span className="text-[10px] font-mono text-muted-foreground">DATA COVERAGE</span>
                      </div>
                      <div className="space-y-1">
                        {DOMAIN_CONFIG.map(({ key, label, icon: Icon, color }) => (
                          <div key={key} className="flex items-center gap-2">
                            <Icon size={10} style={{ color }} />
                            <span className="text-[9px] font-mono flex-1">{label}</span>
                            <span className="text-[10px] font-mono text-foreground">{stats[key]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reports Summary */}
                    <div className="p-2 rounded bg-background border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={12} className="text-primary" />
                        <span className="text-[10px] font-mono text-muted-foreground">REPORTS</span>
                      </div>
                      <div className="text-center p-2">
                        <div className="text-2xl font-mono text-primary">{reports.length}</div>
                        <div className="text-[9px] text-muted-foreground">TOTAL GENERATED</div>
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
                          const Icon = config.icon;
                          return (
                            <div key={conn.provider} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon size={10} style={{ color: config.color }} />
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

                    {/* User Persona */}
                    {userPersona && (
                      <div className="p-2 rounded bg-primary/10 border border-primary/30">
                        <div className="flex items-center gap-2 mb-1">
                          <User size={12} className="text-primary" />
                          <span className="text-[10px] font-mono text-muted-foreground">YOUR PERSONA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-primary">
                            {PERSONAS.find(p => p.id === userPersona)?.label || userPersona}
                          </span>
                          <Badge variant="secondary" className="text-[8px]">
                            {PERSONAS.find(p => p.id === userPersona)?.category}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Personas Tab */}
            {!expandedDomain && (
              <TabsContent value="personas" className="h-full m-0 p-2 flex flex-col">
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
                  <span className="text-[9px] text-muted-foreground ml-auto">
                    {filteredPersonas.length} of {PERSONAS.length}
                  </span>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {filteredPersonas.map(({ id, label, icon: Icon, description, category, focusAreas }) => {
                      const config = personaConfigs[id];
                      const customized = config && (
                        config.depth !== 'standard' || 
                        config.focusAreas.length !== focusAreas.length
                      );
                      
                      return (
                        <div
                          key={id}
                          className="p-2 rounded bg-background border border-border"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Icon size={14} className="text-primary" />
                              <span className="text-xs font-mono text-foreground">{label}</span>
                              <Badge variant="secondary" className="text-[8px] font-mono px-1 py-0">
                                {category}
                              </Badge>
                              {customized && (
                                <Badge variant="outline" className="text-[8px] font-mono px-1 py-0 border-primary/50 text-primary">
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
                                className="h-6 text-[10px] font-mono px-2"
                                onClick={() => handleGenerateReport(id)}
                                disabled={generatingPersona !== null || !userId || totalItems === 0}
                              >
                                {generatingPersona === id ? (
                                  <>
                                    <RefreshCw size={10} className="mr-1 animate-spin" />
                                    GENERATING...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={10} className="mr-1" />
                                    GENERATE
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground">{description}</p>
                            {config && (
                              <span className="text-[9px] text-muted-foreground/70">
                                {config.depth} • {config.focusAreas.length} areas
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Reports Tab */}
            {!expandedDomain && (
              <TabsContent value="reports" className="h-full m-0 p-2">
                <ReportHistoryList
                  reports={reports}
                  onSelectReport={(report) => setSelectedReport(report)}
                  selectedReportId={selectedReport?.id}
                />
              </TabsContent>
            )}

            {/* Summary Tab - Atlas AI Findings */}
            {!expandedDomain && (
              <TabsContent value="summary" className="h-full m-0">
                <AtlasSummaryTab userId={userId} />
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
