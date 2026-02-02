// Atlas Right Panel - Context-aware layout for Personal vs Enterprise hubs
import React, { useRef, useCallback, useState } from 'react';
import { Activity, Database, Search, Sparkles, Brain, Shield, User, Camera, Phone, Bell, Upload, Image, Settings, Plug } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

import { AtlasTaskProgress } from './AtlasTaskProgress';
import { AtlasSearchPanel, WebSearchEntry } from './AtlasSearchPanel';
import { CSuiteDataHub } from '@/components/csuite/CSuiteDataHub';
import { SimplifiedEnterpriseDashboard } from '@/components/csuite/SimplifiedEnterpriseDashboard';
import { FullscreenEnterpriseDetailedDashboard } from '@/components/csuite/FullscreenEnterpriseDetailedDashboard';
import { SimplifiedGroupDashboard, FullscreenGroupDetailedDashboard } from '@/components/group';
import { PersonalDataHub } from '@/components/personal/PersonalDataHub';
import { PhonePanel } from '@/components/personal/PhonePanel';
import { HubQuickAccess } from '@/components/personal/HubQuickAccess';
import { NotificationSettingsPanel } from '@/components/personal/NotificationSettingsPanel';
import { IntegrationsTab } from '@/components/personal/IntegrationsTab';
import { KnowledgeDiscoveryPanel } from './KnowledgeDiscoveryPanel';
import { VeracityEvaluationPanel } from './VeracityEvaluationPanel';

import { AgentTask } from '@/hooks/useAgentOrchestration';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { useDashboardNotifications } from '@/hooks/useDashboardNotifications';
import { useUserPhotos } from '@/hooks/useUserPhotos';
import { toast } from 'sonner';

export type HubType = 'personal' | 'group' | 'csuite';

interface SearchResult {
  id: string;
  name: string;
  sector: string;
  description?: string;
  similarity?: number;
}

interface SynthesizedAgent {
  name: string;
  sector: string;
  description: string;
}

interface AtlasRightPanelProps {
  // Hub context
  hubType?: HubType;
  groupId?: string;
  // Task Progress props
  tasks: AgentTask[];
  completedTasks: AgentTask[];
  isLoading: boolean;
  onSyncMemory: () => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  // Web Search props
  webSearches: WebSearchEntry[];
  onWebSearch?: (query: string) => void;
  isSearching?: boolean;
  // Search Results props
  searchResults: SearchResult[];
  // Synthesized Agent props
  synthesizedAgent: SynthesizedAgent | null;
  // Enterprise Data Hub props
  userId?: string;
  agents: any[];
  agentsLoading: boolean;
}

export function AtlasRightPanel({
  hubType = 'csuite',
  groupId,
  tasks,
  completedTasks,
  isLoading,
  onSyncMemory,
  onDeleteTask,
  webSearches,
  onWebSearch,
  isSearching,
  searchResults,
  synthesizedAgent,
  userId,
  agents,
  agentsLoading,
}: AtlasRightPanelProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { unreadCount } = useDashboardNotifications(user?.id);
  const { uploadMultiplePhotos, photos, isUploading, getPhotoUrl } = useUserPhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // State for fullscreen detailed view (enterprise/group hubs)
  const [showEnterpriseDetailedView, setShowEnterpriseDetailedView] = useState(false);
  const [showGroupDetailedView, setShowGroupDetailedView] = useState(false);
  
  // Get user display name or email for personal hub
  const userDisplayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Personal';

  // Handle photo upload
  const handlePhotoUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const count = await uploadMultiplePhotos(files);
    if (count > 0) {
      toast.success(`${count} photo(s) uploaded successfully`);
    }
  }, [uploadMultiplePhotos]);

  // Handle camera capture
  const handleCameraCapture = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, []);

  // Personal hub - simplified 3-tab layout for ease of use
  if (hubType === 'personal') {
    return (
      <div className="w-full flex flex-col h-full flex-1 min-h-0">
        <Tabs defaultValue="dashboard" className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
          {/* Simplified Tab Header - 3 core tabs only */}
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <TabsList className="flex-1 grid grid-cols-3 bg-muted/50 border border-border rounded-xl p-1 h-11">
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center justify-center gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                <User size={16} />
                {!isMobile && <span>Dashboard</span>}
              </TabsTrigger>
              <TabsTrigger 
                value="tools" 
                className="flex items-center justify-center gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                <Phone size={16} />
                {!isMobile && <span>Tools</span>}
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center justify-center gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg relative"
              >
                <Settings size={16} />
                {!isMobile && <span>Settings</span>}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Hub Quick Access - Desktop only */}
            {!isMobile && (
              <div className="flex-shrink-0 border-l border-border pl-2">
                <HubQuickAccess />
              </div>
            )}
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="flex-1 mt-0 min-h-0 h-full data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
            <div className="flex-1 min-h-0 h-full overflow-hidden">
              <PersonalDataHub userId={userId} />
            </div>
          </TabsContent>

          {/* Tools Tab - Phone & Camera combined */}
          <TabsContent value="tools" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 min-h-0 bg-card/90 border border-border rounded-xl overflow-hidden">
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoUpload(e.target.files)}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhotoUpload(e.target.files)}
                className="hidden"
              />
              
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {/* Phone Section */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Phone size={16} className="text-primary" />
                      Phone & Contacts
                    </h3>
                    <PhonePanel />
                  </div>
                  
                  {/* Camera Section */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Camera size={16} className="text-primary" />
                      Camera & Photos
                    </h3>
                    <div className="flex gap-2 mb-4">
                      <Button 
                        onClick={handleCameraCapture}
                        disabled={isUploading}
                        size="sm"
                        className="flex-1 h-11 rounded-xl"
                      >
                        <Camera size={16} className="mr-2" />
                        Take Photo
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 h-11 rounded-xl"
                      >
                        <Upload size={16} className="mr-2" />
                        Upload
                      </Button>
                    </div>
                    
                    {/* Photo Grid */}
                    {photos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {photos.slice(0, 8).map((photo) => (
                          <div 
                            key={photo.id}
                            className="aspect-square rounded-lg overflow-hidden bg-muted border border-border"
                          >
                            <img 
                              src={getPhotoUrl(photo)} 
                              alt={photo.file_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Integrations Section */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Plug size={16} className="text-primary" />
                      Connected Apps
                    </h3>
                    <IntegrationsTab hubContext="personal" />
                  </div>
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 min-h-0 bg-card/90 border border-border rounded-xl overflow-hidden">
              <NotificationSettingsPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Enterprise/Group hubs - streamlined 3-tab layout
  return (
    <div className="w-full flex flex-col h-full flex-1 min-h-0">
      <Tabs defaultValue="data" className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
        <TabsList className="w-full grid grid-cols-3 bg-muted/50 border border-border rounded-xl p-1 h-11 mb-3 flex-shrink-0">
          <TabsTrigger 
            value="data" 
            className="flex items-center justify-center gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
          >
            <Database size={16} />
            {!isMobile && <span>Data</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="operations" 
            className="flex items-center justify-center gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
          >
            <Activity size={16} />
            {!isMobile && <span>Ops</span>}
          </TabsTrigger>
          <TabsTrigger 
            value="intelligence" 
            className="flex items-center justify-center gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
          >
            <Brain size={16} />
            {!isMobile && <span>Intel</span>}
          </TabsTrigger>
        </TabsList>

        {/* Data Tab - Simplified dashboard with expand option */}
        <TabsContent value="data" className="flex-1 mt-0 overflow-hidden min-h-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
          <div className="flex-1 min-h-0 h-full overflow-hidden bg-card/90 border border-border rounded-xl">
            {hubType === 'group' ? (
              <>
                <SimplifiedGroupDashboard
                  userId={userId}
                  groupId={groupId}
                  onExpandDashboard={() => setShowGroupDetailedView(true)}
                  onNavigate={() => setShowGroupDetailedView(true)}
                />
                {showGroupDetailedView && (
                  <FullscreenGroupDetailedDashboard
                    userId={userId}
                    groupId={groupId}
                    onClose={() => setShowGroupDetailedView(false)}
                  />
                )}
              </>
            ) : (
              <>
                <SimplifiedEnterpriseDashboard
                  userId={userId}
                  onExpandDashboard={() => setShowEnterpriseDetailedView(true)}
                  onNavigate={() => setShowEnterpriseDetailedView(true)}
                />
                {showEnterpriseDetailedView && (
                  <FullscreenEnterpriseDetailedDashboard
                    userId={userId}
                    onClose={() => setShowEnterpriseDetailedView(false)}
                  />
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="operations" className="flex-1 mt-0 overflow-hidden min-h-0 data-[state=active]:flex data-[state=active]:flex-col">
          <ScrollArea className="flex-1 h-full pr-2">
            <div className="space-y-4 pb-4">
              {/* Atlas Task Progress */}
              <AtlasTaskProgress 
                tasks={tasks}
                completedTasks={completedTasks}
                isLoading={isLoading} 
                onSyncMemory={onSyncMemory}
                onDeleteTask={onDeleteTask}
              />

              {/* Web Search & Knowledge Synthesis Panel */}
              <AtlasSearchPanel 
                searches={webSearches} 
                onSearch={onWebSearch}
                isSearching={isSearching}
              />

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="bg-card/90 border border-border rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Search size={14} className="text-primary" />
                    <span className="text-xs font-mono text-muted-foreground">
                      SEARCH RESULTS ({searchResults.length})
                    </span>
                  </div>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {searchResults.map((agent) => (
                        <div key={agent.id} className="p-2 bg-background rounded border border-border">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono text-foreground">{agent.name}</span>
                            <span className="text-[10px] text-primary">{agent.sector}</span>
                          </div>
                          {agent.similarity && (
                            <div className="text-[10px] text-muted-foreground">
                              Match: {(agent.similarity * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Synthesized Agent */}
              {synthesizedAgent && (
                <div className="bg-card/90 border border-secondary/60 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={14} className="text-secondary" />
                    <span className="text-xs font-mono text-muted-foreground">SYNTHESIZED AGENT</span>
                  </div>
                  <div className="p-2 bg-background rounded border border-border">
                    <div className="text-sm font-mono text-secondary">{synthesizedAgent.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{synthesizedAgent.sector}</div>
                    <div className="text-xs text-foreground/80 mt-2">{synthesizedAgent.description}</div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Intelligence Tab - Discovery & Verification combined */}
        <TabsContent value="intelligence" className="flex-1 mt-0 overflow-hidden min-h-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
          <div className="flex-1 min-h-0 h-full bg-card/90 border border-border rounded-xl overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                {/* Knowledge Discovery */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Brain size={16} className="text-primary" />
                    Knowledge Discovery
                  </h3>
                  <KnowledgeDiscoveryPanel />
                </div>
                
                {/* Verification */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-primary" />
                    Fact Verification
                  </h3>
                  <VeracityEvaluationPanel />
                </div>
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
