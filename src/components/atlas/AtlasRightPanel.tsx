// Atlas Right Panel - Tabbed layout for Operations, Data Hub, Knowledge Discovery, and Veracity Evaluation
import React from 'react';
import { Activity, Database, Search, Sparkles, Brain, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AtlasTaskProgress } from './AtlasTaskProgress';
import { AtlasSearchPanel, WebSearchEntry } from './AtlasSearchPanel';
import { CSuiteDataHub } from '@/components/csuite/CSuiteDataHub';
import { PersonalDataHub } from '@/components/personal/PersonalDataHub';
import { KnowledgeDiscoveryPanel } from './KnowledgeDiscoveryPanel';
import { VeracityEvaluationPanel } from './VeracityEvaluationPanel';
import { AgentTask } from '@/hooks/useAgentOrchestration';

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
  // C-Suite Data Hub props
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
  return (
    <div className="w-96 flex-shrink-0 flex flex-col h-full">
      <Tabs defaultValue="operations" className="flex flex-col h-full">
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

        <TabsContent value="operations" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full pr-2">
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

        <TabsContent value="datahub" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-auto">
            {/* Use PersonalDataHub for personal context, CSuiteDataHub for group/csuite */}
            {hubType === 'personal' ? (
              <PersonalDataHub userId={userId} />
            ) : (
              <CSuiteDataHub 
                userId={userId} 
                agents={agents} 
                agentsLoading={agentsLoading} 
                hubType={hubType}
                groupId={groupId}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="discovery" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 min-h-0 bg-card/90 border border-border rounded-lg overflow-hidden">
            <KnowledgeDiscoveryPanel />
          </div>
        </TabsContent>

        <TabsContent value="verify" className="flex-1 mt-0 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 min-h-0 bg-card/90 border border-border rounded-lg overflow-hidden">
            <VeracityEvaluationPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
