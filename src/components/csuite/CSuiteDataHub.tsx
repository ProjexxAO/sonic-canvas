import { useState, useRef, useMemo } from 'react';
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCSuiteData, DataDomainStats, DomainKey, DomainItem } from '@/hooks/useCSuiteData';
import { DomainDetailView } from './DomainDetailView';
import { DomainItemDrawer } from './DomainItemDrawer';

interface CSuiteDataHubProps {
  userId: string | undefined;
}

type PersonaCategory = 'executive' | 'tech' | 'people' | 'growth' | 'legal';

interface Persona {
  id: string;
  label: string;
  icon: typeof User;
  description: string;
  category: PersonaCategory;
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
  { id: 'ceo', label: 'CEO', icon: User, description: 'Strategic overview & key decisions', category: 'executive' },
  { id: 'cfo', label: 'CFO', icon: DollarSign, description: 'Financial health & forecasts', category: 'executive' },
  { id: 'coo', label: 'COO', icon: TrendingUp, description: 'Operations & efficiency', category: 'executive' },
  { id: 'chief_of_staff', label: 'Chief of Staff', icon: Briefcase, description: 'Cross-functional insights', category: 'executive' },
  // Tech Leadership
  { id: 'cto', label: 'CTO', icon: Cpu, description: 'Technology strategy & innovation', category: 'tech' },
  { id: 'ciso', label: 'CISO', icon: Scale, description: 'Security posture & risk assessment', category: 'tech' },
  // People & Culture
  { id: 'chro', label: 'CHRO', icon: Users, description: 'Workforce analytics & culture', category: 'people' },
  { id: 'chief_people', label: 'Chief People Officer', icon: Users, description: 'Employee engagement & talent', category: 'people' },
  // Growth & Marketing
  { id: 'cmo', label: 'CMO', icon: Megaphone, description: 'Marketing performance & brand', category: 'growth' },
  { id: 'cro', label: 'CRO', icon: TrendingUp, description: 'Revenue growth & pipeline', category: 'growth' },
  // Legal & Compliance
  { id: 'clo', label: 'CLO', icon: Scale, description: 'Legal matters & contracts', category: 'legal' },
  { id: 'cco', label: 'CCO', icon: CheckSquare, description: 'Compliance & regulatory', category: 'legal' },
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

export function CSuiteDataHub({ userId }: CSuiteDataHubProps) {
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

  const [activeTab, setActiveTab] = useState('data');
  const [generatingPersona, setGeneratingPersona] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<DomainKey | null>(null);
  const [selectedItem, setSelectedItem] = useState<DomainItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<PersonaCategory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    await generateReport(persona);
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
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-1 py-0 h-8">
              <TabsTrigger 
                value="data" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                DATA
              </TabsTrigger>
              <TabsTrigger 
                value="connectors" 
                className="text-[10px] font-mono px-2 py-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                CONNECTORS
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

            {/* Connectors Tab */}
            {!expandedDomain && (
              <TabsContent value="connectors" className="h-full m-0 p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {connectors.map((conn) => {
                      const config = CONNECTOR_CONFIG[conn.provider];
                      if (!config) return null;
                      const Icon = config.icon;
                      
                      return (
                        <div
                          key={conn.provider}
                          className="p-2 rounded bg-background border border-border"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon size={14} style={{ color: config.color }} />
                              <span className="text-xs font-mono text-foreground">{config.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-mono ${
                                conn.status === 'connected' ? 'text-green-500' :
                                conn.status === 'syncing' ? 'text-yellow-500' :
                                conn.status === 'error' ? 'text-red-500' :
                                'text-muted-foreground'
                              }`}>
                                {conn.status.toUpperCase()}
                              </span>
                              {conn.provider !== 'local' && conn.status === 'disconnected' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] font-mono px-2"
                                  onClick={() => connectProvider(conn.provider)}
                                >
                                  <ExternalLink size={10} className="mr-1" />
                                  CONNECT
                                </Button>
                              )}
                            </div>
                          </div>
                          {conn.lastSync && (
                            <div className="text-[9px] text-muted-foreground mt-1">
                              Last sync: {conn.lastSync.toLocaleString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                    {filteredPersonas.map(({ id, label, icon: Icon, description, category }) => (
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
                          </div>
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
                        <p className="text-[10px] text-muted-foreground">{description}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            {/* Reports Tab */}
            {!expandedDomain && (
              <TabsContent value="reports" className="h-full m-0 p-2">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {reports.length === 0 ? (
                      <div className="text-center py-8">
                        <Sparkles size={24} className="mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">No reports generated yet</p>
                        <p className="text-[10px] text-muted-foreground/70">Select a persona to generate insights</p>
                      </div>
                    ) : (
                      reports.map((report) => (
                        <div
                          key={report.id}
                          className="p-2 rounded bg-background border border-border"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-foreground">{report.title}</span>
                            <span className="text-[10px] text-primary">{report.persona.toUpperCase()}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">
                            {report.content.slice(0, 150)}...
                          </p>
                          <div className="text-[9px] text-muted-foreground/70 mt-1">
                            {report.generatedAt.toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
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
    </>
  );
}
