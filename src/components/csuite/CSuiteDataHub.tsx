import { useState, useRef } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCSuiteData, DataDomainStats, ConnectorStatus, CSuiteReport } from '@/hooks/useCSuiteData';

interface CSuiteDataHubProps {
  userId: string | undefined;
}

const DOMAIN_CONFIG = [
  { key: 'communications', label: 'Communications', icon: Mail, color: 'hsl(200 70% 50%)' },
  { key: 'documents', label: 'Documents', icon: FileText, color: 'hsl(280 70% 50%)' },
  { key: 'events', label: 'Events', icon: Calendar, color: 'hsl(150 70% 45%)' },
  { key: 'financials', label: 'Financials', icon: DollarSign, color: 'hsl(45 80% 50%)' },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare, color: 'hsl(350 70% 50%)' },
  { key: 'knowledge', label: 'Knowledge', icon: BookOpen, color: 'hsl(220 70% 55%)' },
] as const;

const PERSONAS = [
  { id: 'ceo', label: 'CEO', icon: User, description: 'Strategic overview & key decisions' },
  { id: 'cfo', label: 'CFO', icon: DollarSign, description: 'Financial health & forecasts' },
  { id: 'coo', label: 'COO', icon: TrendingUp, description: 'Operations & efficiency' },
  { id: 'chief_of_staff', label: 'Chief of Staff', icon: Briefcase, description: 'Cross-functional insights' },
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
    uploadFile,
    connectProvider,
    generateReport,
    refresh,
  } = useCSuiteData(userId);

  const [activeTab, setActiveTab] = useState('data');
  const [generatingPersona, setGeneratingPersona] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const totalItems = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
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

        {/* Tabs */}
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

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Data Domains Tab */}
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

                {/* Domain Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {DOMAIN_CONFIG.map(({ key, label, icon: Icon, color }) => (
                    <div
                      key={key}
                      className="p-2 rounded bg-background border border-border hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={12} style={{ color }} />
                        <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-lg font-mono text-foreground">
                        {stats[key as keyof DataDomainStats]}
                      </span>
                    </div>
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

          {/* Connectors Tab */}
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

          {/* Personas Tab */}
          <TabsContent value="personas" className="h-full m-0 p-2">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {PERSONAS.map(({ id, label, icon: Icon, description }) => (
                  <div
                    key={id}
                    className="p-2 rounded bg-background border border-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-primary" />
                        <span className="text-xs font-mono text-foreground">{label}</span>
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

          {/* Reports Tab */}
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
        </div>
      </Tabs>
    </div>
  );
}
