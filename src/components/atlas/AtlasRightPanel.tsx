// Atlas Right Panel - Context-aware layout for Personal vs Enterprise hubs
import React, { useRef, useCallback } from 'react';
import { Activity, Database, Search, Sparkles, Brain, Shield, User, Camera, Phone, Bell, Upload, Image, Settings, Plug } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

import { AtlasTaskProgress } from './AtlasTaskProgress';
import { AtlasSearchPanel, WebSearchEntry } from './AtlasSearchPanel';
import { CSuiteDataHub } from '@/components/csuite/CSuiteDataHub';
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

  // Personal hub has simplified tabs: User's name (data), Phone, Camera, and hub quick access
  if (hubType === 'personal') {
    // Mobile layout - no horizontal resize
    if (isMobile) {
      return (
        <div className="w-full flex flex-col h-full flex-1 min-h-0">
          <Tabs defaultValue="personal-data" className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
            {/* Tab Header Row - Simplified for mobile */}
            <div className="flex items-center gap-2 mb-2 flex-shrink-0 overflow-x-auto">
              <TabsList className="flex-1 flex justify-start gap-1 bg-muted/50 border border-border rounded-lg p-1">
                <TabsTrigger 
                  value="personal-data" 
                  className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-2"
                >
                  <User size={12} />
                  Me
                </TabsTrigger>
                <TabsTrigger 
                  value="phone" 
                  className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-2"
                >
                  <Phone size={12} />
                  Phone
                </TabsTrigger>
                <TabsTrigger 
                  value="camera" 
                  className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-2"
                >
                  <Camera size={12} />
                  Camera
                </TabsTrigger>
                <TabsTrigger 
                  value="integrations" 
                  className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-2"
                >
                  <Plug size={12} />
                  Apps
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-2 relative"
                >
                  <Settings size={12} />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1 text-[8px] px-1 py-0 h-3.5">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="personal-data" className="flex-1 mt-0 min-h-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <PersonalDataHub userId={userId} />
              </div>
            </TabsContent>


            <TabsContent value="phone" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 min-h-0">
                <PhonePanel />
              </div>
            </TabsContent>

            <TabsContent value="camera" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 min-h-0 bg-card/90 border border-border rounded-lg overflow-hidden">
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
                  <div className="p-4">
                    <div className="flex flex-col items-center gap-4 py-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera size={24} className="text-primary" />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCameraCapture}
                          disabled={isUploading}
                          size="sm"
                          className="gap-2"
                        >
                          <Camera size={14} />
                          Take Photo
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="gap-2"
                        >
                          <Upload size={14} />
                          Upload
                        </Button>
                      </div>
                    </div>
                    {photos.length > 0 && (
                      <div className="mt-4">
                        <div className="grid grid-cols-3 gap-2">
                          {photos.slice(0, 6).map((photo) => (
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
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
              <IntegrationsTab hubContext="personal" />
            </TabsContent>

            <TabsContent value="notifications" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 min-h-0 bg-card/90 border border-border rounded-lg overflow-hidden">
                <NotificationSettingsPanel />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );
    }

    // Desktop/Tablet layout - consistent fixed width like Enterprise/Group hubs
    return (
      <div className="w-full flex flex-col h-full flex-1 min-h-0">
        <Tabs defaultValue="personal-data" className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
          {/* Tab Header Row */}
          <div className="flex items-center gap-2 mb-3 flex-shrink-0">
            <TabsList className="flex-1 flex justify-start gap-1 bg-muted/50 border border-border rounded-lg p-1">
              <TabsTrigger 
                value="personal-data" 
                className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-3"
              >
                <User size={12} />
                {userDisplayName}
              </TabsTrigger>
              <TabsTrigger 
                value="phone" 
                className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-3"
              >
                <Phone size={12} />
                Phone
              </TabsTrigger>
              <TabsTrigger 
                value="camera" 
                className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-3"
              >
                <Camera size={12} />
                Camera
              </TabsTrigger>
              <TabsTrigger 
                value="integrations" 
                className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-3"
              >
                <Plug size={12} />
                Apps
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 relative"
              >
                <Settings size={12} />
                Settings
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-[8px] px-1 py-0 h-3.5">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            {/* Hub Quick Access Links */}
            <div className="flex-shrink-0 border-l border-border pl-2">
              <HubQuickAccess />
            </div>
          </div>

          <TabsContent value="personal-data" className="flex-1 mt-0 min-h-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col h-full">
            <div className="flex-1 min-h-0 overflow-hidden h-full">
              <PersonalDataHub userId={userId} />
            </div>
          </TabsContent>


          <TabsContent value="phone" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <PhonePanel />
            </div>
          </TabsContent>

          <TabsContent value="camera" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 min-h-0 bg-card/90 border border-border rounded-lg overflow-hidden">
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
                <div className="p-4">
                  {/* Camera Actions */}
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera size={32} className="text-primary" />
                    </div>
                    <h3 className="text-sm font-medium">Capture & Upload</h3>
                    <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                      Take photos or upload images to your personal hub
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCameraCapture}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        <Camera size={14} />
                        Take Photo
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                      >
                        <Upload size={14} />
                        Upload
                      </Button>
                    </div>
                  </div>

                  {/* Recent Photos */}
                  {photos.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Image size={14} className="text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground uppercase">
                          Recent Photos ({photos.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {photos.slice(0, 6).map((photo) => (
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
                      {photos.length > 6 && (
                        <p className="text-[10px] text-muted-foreground text-center mt-2">
                          +{photos.length - 6} more photos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
            <IntegrationsTab hubContext="personal" />
          </TabsContent>

          <TabsContent value="notifications" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 min-h-0 bg-card/90 border border-border rounded-lg overflow-hidden">
              <NotificationSettingsPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Enterprise/Group hubs keep full tabs: Ops, Data, Discover, Verify
  return (
    <div className="w-full flex flex-col h-full flex-1 min-h-0">
      <Tabs defaultValue="operations" className="flex flex-col flex-1 h-full min-h-0 overflow-hidden">
        <TabsList className="w-full grid grid-cols-4 bg-muted/50 border border-border rounded-lg p-1 mb-3 flex-shrink-0">
          <TabsTrigger 
            value="operations" 
            className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-2"
          >
            <Activity size={12} />
            Ops
          </TabsTrigger>
          <TabsTrigger 
            value="datahub" 
            className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-2"
          >
            <Database size={12} />
            Data
          </TabsTrigger>
          <TabsTrigger 
            value="discovery" 
            className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-2"
          >
            <Brain size={12} />
            Discover
          </TabsTrigger>
          <TabsTrigger 
            value="verify" 
            className="flex items-center gap-1 text-[10px] font-mono data-[state=active]:bg-background data-[state=active]:shadow-sm px-2"
          >
            <Shield size={12} />
            Verify
          </TabsTrigger>
        </TabsList>

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


        <TabsContent value="datahub" className="flex-1 mt-0 overflow-hidden min-h-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
          <div className="flex-1 min-h-0 h-full overflow-auto">
            <CSuiteDataHub 
              userId={userId} 
              agents={agents} 
              agentsLoading={agentsLoading} 
              hubType={hubType}
              groupId={groupId}
            />
          </div>
        </TabsContent>

        <TabsContent value="discovery" className="flex-1 mt-0 overflow-hidden min-h-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
          <div className="flex-1 min-h-0 h-full bg-card/90 border border-border rounded-lg overflow-hidden">
            <KnowledgeDiscoveryPanel />
          </div>
        </TabsContent>

        <TabsContent value="verify" className="flex-1 mt-0 overflow-hidden min-h-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
          <div className="flex-1 min-h-0 h-full bg-card/90 border border-border rounded-lg overflow-hidden">
            <VeracityEvaluationPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
