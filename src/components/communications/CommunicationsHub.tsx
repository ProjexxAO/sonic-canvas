import { useState } from 'react';
import { 
  Mail, 
  MessageSquare, 
  Hash, 
  Users, 
  Plus,
  Search,
  Settings,
  Filter,
  RefreshCw,
  BarChart3,
  Send,
  Zap,
  Repeat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCommunications, CommunicationPlatform } from '@/hooks/useCommunications';
import { ChannelsSidebar } from './ChannelsSidebar';
import { MessageList } from './MessageList';
import { MessageThread } from './MessageThread';
import { ChatInput } from './ChatInput';
import { PlatformFilters } from './PlatformFilters';
import { CreateChannelDialog } from './CreateChannelDialog';
import { EmailAnalyticsDashboard } from './EmailAnalyticsDashboard';
import { MailMergePanel } from './MailMergePanel';
import { ZapierIntegrationPanel } from './ZapierIntegrationPanel';
import { EmailSyncPanel } from './EmailSyncPanel';

interface CommunicationsHubProps {
  userId: string | undefined;
}

export function CommunicationsHub({ userId }: CommunicationsHubProps) {
  const {
    channels,
    messages,
    selectedChannel,
    selectedThread,
    platformConnections,
    platformFilter,
    isLoading,
    isSending,
    atlasDraft,
    setSelectedChannel,
    setSelectedThread,
    setPlatformFilter,
    setAtlasDraft,
    fetchMessages,
    createChannel,
    sendMessage,
    approveAtlasDraft,
    addReaction,
    removeReaction,
    toggleStar,
    requestAtlasDraft,
    fetchThreadReplies,
    fetchPlatformConnections,
  } = useCommunications(userId);

  const [activeTab, setActiveTab] = useState<'inbox' | 'channels' | 'direct'>('inbox');
  const [activeMainView, setActiveMainView] = useState<'messages' | 'analytics' | 'mailmerge' | 'automations' | 'sync'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSendMessage = async (content: string, options?: { useAtlasDraft?: boolean }) => {
    await sendMessage(content, {
      channelId: selectedChannel?.id,
      platform: selectedChannel ? 'internal' : undefined,
      threadRootId: selectedThread?.id,
      isAtlasDraft: options?.useAtlasDraft,
      atlasDraftContext: options?.useAtlasDraft ? { requested_at: new Date().toISOString() } : undefined,
    });
  };

  const handleRequestAtlasDraft = async (context: string) => {
    await requestAtlasDraft(context, selectedThread || undefined);
  };

  const filteredMessages = messages.filter(m => {
    if (!searchQuery) return true;
    return (
      m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.from_address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const internalChannels = channels.filter(c => c.channel_type !== 'direct');
  const directMessages = channels.filter(c => c.channel_type === 'direct');

  return (
    <div className="flex h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Sidebar */}
      <div className={`border-r border-border flex flex-col transition-all ${sidebarCollapsed ? 'w-14' : 'w-64'}`}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" />
              <span className="font-medium text-sm">Messages</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <Filter size={14} />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Platform Filters */}
            {!sidebarCollapsed && (
              <PlatformFilters
                platformFilter={platformFilter}
                setPlatformFilter={setPlatformFilter}
                platformConnections={platformConnections}
                onConnectionChange={fetchPlatformConnections}
                userId={userId}
              />
            )}

            {/* Tabs for Inbox/Channels/DMs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
              {!sidebarCollapsed && (
                <TabsList className="w-full grid grid-cols-3 h-8">
                  <TabsTrigger value="inbox" className="text-xs">
                    <Mail size={12} className="mr-1" />
                    Inbox
                  </TabsTrigger>
                  <TabsTrigger value="channels" className="text-xs">
                    <Hash size={12} className="mr-1" />
                    Channels
                  </TabsTrigger>
                  <TabsTrigger value="direct" className="text-xs">
                    <Users size={12} className="mr-1" />
                    DMs
                  </TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="inbox" className="mt-2">
                {!sidebarCollapsed && (
                  <div className="text-xs text-muted-foreground px-2 py-1">
                    All messages across platforms
                  </div>
                )}
              </TabsContent>

              <TabsContent value="channels" className="mt-2">
                <ChannelsSidebar
                  channels={internalChannels}
                  selectedChannel={selectedChannel}
                  onSelectChannel={(channel) => {
                    setSelectedChannel(channel);
                    setSelectedThread(null);
                  }}
                  collapsed={sidebarCollapsed}
                  onCreateChannel={() => setShowCreateChannel(true)}
                />
              </TabsContent>

              <TabsContent value="direct" className="mt-2">
                <ChannelsSidebar
                  channels={directMessages}
                  selectedChannel={selectedChannel}
                  onSelectChannel={(channel) => {
                    setSelectedChannel(channel);
                    setSelectedThread(null);
                  }}
                  collapsed={sidebarCollapsed}
                  isDMList
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {!sidebarCollapsed && (
          <div className="p-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowCreateChannel(true)}
            >
              <Plus size={12} className="mr-1" />
              New Channel
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with View Tabs */}
        <div className="border-b border-border">
          <div className="h-12 px-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                variant={activeMainView === 'messages' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setActiveMainView('messages')}
              >
                <MessageSquare size={14} />
                Messages
              </Button>
              <Button
                variant={activeMainView === 'analytics' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setActiveMainView('analytics')}
              >
                <BarChart3 size={14} />
                Analytics
              </Button>
              <Button
                variant={activeMainView === 'mailmerge' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setActiveMainView('mailmerge')}
              >
                <Send size={14} />
                Mail Merge
              </Button>
              <Button
                variant={activeMainView === 'automations' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setActiveMainView('automations')}
              >
                <Zap size={14} />
                Automations
              </Button>
              <Button
                variant={activeMainView === 'sync' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setActiveMainView('sync')}
              >
                <Repeat size={14} />
                Sync
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {activeMainView === 'messages' && (
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-48 pl-8 text-xs"
                  />
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => fetchMessages(selectedChannel?.id)}
              >
                <RefreshCw size={14} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings size={14} />
              </Button>
            </div>
          </div>

          {/* Secondary header for messages view */}
          {activeMainView === 'messages' && (
            <div className="h-10 px-4 flex items-center gap-3 bg-muted/30">
              {selectedChannel ? (
                <>
                  <Hash size={14} className="text-muted-foreground" />
                  <span className="font-medium text-sm">{selectedChannel.name}</span>
                  {selectedChannel.description && (
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      — {selectedChannel.description}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="font-medium text-sm">Unified Inbox</span>
                  <Badge variant="secondary" className="text-xs">
                    {filteredMessages.length} messages
                  </Badge>
                </>
              )}
            </div>
          )}
        </div>

        {/* Main View Content */}
        <div className="flex-1 flex overflow-hidden">
          {activeMainView === 'messages' && (
            <>
              {/* Message List */}
              <div className={`flex-1 flex flex-col ${selectedThread ? 'hidden md:flex md:w-1/2' : ''}`}>
                <MessageList
                  messages={filteredMessages}
                  isLoading={isLoading}
                  selectedThread={selectedThread}
                  onSelectThread={setSelectedThread}
                  onToggleStar={toggleStar}
                  onReply={(message) => setSelectedThread(message)}
                />

                {/* Chat Input (for channels) */}
                {selectedChannel && !selectedThread && (
                  <ChatInput
                    onSend={handleSendMessage}
                    onRequestAtlasDraft={handleRequestAtlasDraft}
                    atlasDraft={atlasDraft}
                    onClearDraft={() => setAtlasDraft(null)}
                    onApproveDraft={approveAtlasDraft}
                    isSending={isSending}
                    placeholder={`Message #${selectedChannel.name}`}
                  />
                )}
              </div>

              {/* Thread View */}
              {selectedThread && (
                <div className="flex-1 md:w-1/2 border-l border-border flex flex-col">
                  <MessageThread
                    rootMessage={selectedThread}
                    onClose={() => setSelectedThread(null)}
                    fetchReplies={fetchThreadReplies}
                    onSendReply={(content) => handleSendMessage(content)}
                    onAddReaction={addReaction}
                    onRemoveReaction={removeReaction}
                    atlasDraft={atlasDraft}
                    onRequestAtlasDraft={handleRequestAtlasDraft}
                    onClearDraft={() => setAtlasDraft(null)}
                    isSending={isSending}
                  />
                </div>
              )}
            </>
          )}

          {activeMainView === 'analytics' && (
            <div className="flex-1 overflow-auto p-4">
              <EmailAnalyticsDashboard userId={userId} />
            </div>
          )}

          {activeMainView === 'mailmerge' && (
            <div className="flex-1 overflow-auto p-4">
              <MailMergePanel userId={userId} />
            </div>
          )}

          {activeMainView === 'automations' && (
            <div className="flex-1 overflow-auto p-4">
              <ZapierIntegrationPanel userId={userId} />
            </div>
          )}

          {activeMainView === 'sync' && (
            <div className="flex-1 overflow-auto p-4">
              <EmailSyncPanel userId={userId} />
            </div>
          )}
        </div>
      </div>

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onCreateChannel={createChannel}
      />
    </div>
  );
}
