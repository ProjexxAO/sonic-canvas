// Phone Sync Panel - Mobile device connection and data sync interface
import { useState, useRef } from 'react';
import { 
  Smartphone, 
  Upload, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Wifi,
  WifiOff,
  Camera,
  Image,
  Calendar,
  Users,
  FileText,
  Bell,
  Settings,
  ChevronRight,
  Briefcase,
  User,
  Building2,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { usePhoneSync, PhoneDataType, HubDestination, PhoneSyncItem } from '@/hooks/usePhoneSync';
import { formatDistanceToNow } from 'date-fns';

interface PhoneSyncPanelProps {
  userId?: string;
  compact?: boolean;
}

const DATA_TYPE_CONFIG = {
  photos: { icon: Image, label: 'Photos', color: 'hsl(280 70% 60%)' },
  contacts: { icon: Users, label: 'Contacts', color: 'hsl(200 70% 50%)' },
  calendar: { icon: Calendar, label: 'Calendar', color: 'hsl(340 70% 55%)' },
  files: { icon: FileText, label: 'Files', color: 'hsl(45 80% 50%)' },
  messages: { icon: Bell, label: 'Messages', color: 'hsl(142 70% 45%)' },
  notifications: { icon: Bell, label: 'Notifications', color: 'hsl(25 80% 55%)' }
};

const HUB_CONFIG = {
  personal: { icon: User, label: 'Personal', color: 'hsl(142 70% 45%)' },
  group: { icon: Users, label: 'Group', color: 'hsl(200 70% 50%)' },
  csuite: { icon: Briefcase, label: 'C-Suite', color: 'hsl(280 70% 60%)' }
};

export function PhoneSyncPanel({ userId, compact = false }: PhoneSyncPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTab, setSelectedTab] = useState('sync');
  
  const {
    syncItems,
    config,
    stats,
    isConnected,
    isSyncing,
    connectPhone,
    handlePhoneUpload,
    reassignToHub,
    updateConfig,
    getPendingConfirmation
  } = usePhoneSync(userId);

  const pendingItems = getPendingConfirmation();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handlePhoneUpload(e.target.files, 'photos');
    }
  };

  const SyncItemRow = ({ item }: { item: PhoneSyncItem }) => {
    const TypeIcon = DATA_TYPE_CONFIG[item.type]?.icon || FileText;
    const typeConfig = DATA_TYPE_CONFIG[item.type];

    return (
      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${typeConfig?.color}20` }}
        >
          <TypeIcon size={14} style={{ color: typeConfig?.color }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{item.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </p>
        </div>

        {item.syncStatus === 'syncing' && (
          <RefreshCw size={12} className="animate-spin text-primary" />
        )}
        {item.syncStatus === 'synced' && (
          <Check size={12} className="text-green-500" />
        )}
        {item.syncStatus === 'error' && (
          <AlertCircle size={12} className="text-destructive" />
        )}

        {item.suggestedHub && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <Badge 
                  variant="outline" 
                  className="text-[9px] gap-1"
                  style={{ 
                    borderColor: HUB_CONFIG[item.confirmedHub || item.suggestedHub]?.color,
                    color: HUB_CONFIG[item.confirmedHub || item.suggestedHub]?.color
                  }}
                >
                  {HUB_CONFIG[item.confirmedHub || item.suggestedHub]?.label}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(HUB_CONFIG).map(([hub, cfg]) => (
                <DropdownMenuItem 
                  key={hub}
                  onClick={() => reassignToHub(item.id, hub as HubDestination)}
                  className="gap-2"
                >
                  <cfg.icon size={12} style={{ color: cfg.color }} />
                  <span className="text-xs">{cfg.label} Hub</span>
                  {item.confirmedHub === hub && <Check size={12} className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className="p-3 bg-card/90 border border-border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone size={14} className="text-primary" />
            <span className="text-xs font-mono">Phone Sync</span>
          </div>
          {isConnected ? (
            <Badge variant="outline" className="text-[9px] text-green-500 border-green-500/50">
              Connected
            </Badge>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 text-[10px]"
              onClick={connectPhone}
            >
              Connect
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-muted/30">
            <p className="text-lg font-bold text-primary">{stats.totalSynced}</p>
            <p className="text-[9px] text-muted-foreground">Synced</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <p className="text-lg font-bold text-amber-500">{pendingItems.length}</p>
            <p className="text-[9px] text-muted-foreground">Pending</p>
          </div>
          <div className="p-2 rounded bg-muted/30">
            <p className="text-lg font-bold text-cyan-500">{config.syncTypes.length}</p>
            <p className="text-[9px] text-muted-foreground">Types</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card/90 border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-primary" />
          <span className="text-sm font-medium">Phone Sync</span>
          {isConnected && (
            <Badge variant="outline" className="text-[9px] text-green-500 border-green-500/50">
              <Wifi size={8} className="mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs gap-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Upload size={12} />
            )}
            Upload
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Total: <span className="text-foreground font-medium">{stats.totalSynced}</span>
            </span>
            <span className="text-muted-foreground">
              Last sync: <span className="text-foreground font-medium">
                {stats.lastSyncTime 
                  ? formatDistanceToNow(new Date(stats.lastSyncTime), { addSuffix: true })
                  : 'Never'
                }
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(stats.syncedByHub).map(([hub, count]) => (
              <Badge 
                key={hub} 
                variant="outline" 
                className="text-[8px] h-4"
                style={{ 
                  borderColor: HUB_CONFIG[hub as keyof typeof HUB_CONFIG]?.color,
                  color: HUB_CONFIG[hub as keyof typeof HUB_CONFIG]?.color
                }}
              >
                {HUB_CONFIG[hub as keyof typeof HUB_CONFIG]?.label}: {count}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-3 bg-muted/30 border-b border-border rounded-none p-0 h-9">
          <TabsTrigger value="sync" className="text-[10px] font-mono rounded-none data-[state=active]:bg-background">
            Sync Queue
            {syncItems.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[8px] px-1 h-4">{syncItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="review" className="text-[10px] font-mono rounded-none data-[state=active]:bg-background">
            Review
            {pendingItems.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[8px] px-1 h-4">{pendingItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-[10px] font-mono rounded-none data-[state=active]:bg-background">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Sync Queue */}
        <TabsContent value="sync" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {!isConnected && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <WifiOff size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium mb-2">Connect Your Phone</h3>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[200px] mx-auto">
                    {isMobile 
                      ? 'Enable sync to automatically categorize your data with Atlas'
                      : 'Install Atlas OS on your phone to sync data across hubs'
                    }
                  </p>
                  <Button onClick={connectPhone} className="gap-2">
                    <Smartphone size={14} />
                    {isMobile ? 'Enable Sync' : 'Connect Phone'}
                  </Button>
                </div>
              )}

              {isConnected && syncItems.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Check size={24} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-medium mb-2">All Synced!</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload files or take photos to sync them with Atlas
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1"
                    >
                      <Upload size={12} />
                      Upload Files
                    </Button>
                    {isMobile && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.capture = 'environment';
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) handlePhoneUpload(files, 'photos');
                          };
                          input.click();
                        }}
                        className="gap-1"
                      >
                        <Camera size={12} />
                        Take Photo
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {isConnected && syncItems.length > 0 && (
                <div className="space-y-2">
                  {syncItems.map(item => (
                    <SyncItemRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              {pendingItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Zap size={24} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-medium mb-2">AI Auto-Categorization Active</h3>
                  <p className="text-xs text-muted-foreground">
                    All items have been automatically routed to their hubs
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">
                    Review Atlas's suggestions and confirm or reassign items
                  </p>
                  {pendingItems.map(item => (
                    <SyncItemRow key={item.id} item={item} />
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs font-medium">Auto Sync</p>
                  <p className="text-[10px] text-muted-foreground">Sync new items automatically</p>
                </div>
                <Switch 
                  checked={config.autoSync}
                  onCheckedChange={(checked) => updateConfig({ autoSync: checked })}
                />
              </div>

              {/* AI Categorization Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs font-medium">AI Auto-Categorization</p>
                  <p className="text-[10px] text-muted-foreground">Let Atlas route items to hubs</p>
                </div>
                <Switch 
                  checked={config.autoCategorizationEnabled}
                  onCheckedChange={(checked) => updateConfig({ autoCategorizationEnabled: checked })}
                />
              </div>

              {/* WiFi Only Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-xs font-medium">WiFi Only</p>
                  <p className="text-[10px] text-muted-foreground">Only sync on WiFi networks</p>
                </div>
                <Switch 
                  checked={config.wifiOnly}
                  onCheckedChange={(checked) => updateConfig({ wifiOnly: checked })}
                />
              </div>

              {/* Data Types */}
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-medium mb-3">Sync Data Types</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DATA_TYPE_CONFIG).map(([type, cfg]) => {
                    const isEnabled = config.syncTypes.includes(type as PhoneDataType);
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          const newTypes = isEnabled
                            ? config.syncTypes.filter(t => t !== type)
                            : [...config.syncTypes, type as PhoneDataType];
                          updateConfig({ syncTypes: newTypes });
                        }}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                          isEnabled 
                            ? "border-primary bg-primary/10" 
                            : "border-border bg-background hover:bg-muted/50"
                        )}
                      >
                        <cfg.icon 
                          size={14} 
                          style={{ color: isEnabled ? cfg.color : undefined }}
                          className={!isEnabled ? 'text-muted-foreground' : ''}
                        />
                        <span className="text-[10px]">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hub Stats */}
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-medium mb-3">Items by Hub</p>
                <div className="space-y-2">
                  {Object.entries(HUB_CONFIG).map(([hub, cfg]) => {
                    const count = stats.syncedByHub[hub as keyof typeof stats.syncedByHub];
                    const total = stats.totalSynced || 1;
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                      <div key={hub} className="flex items-center gap-3">
                        <cfg.icon size={14} style={{ color: cfg.color }} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px]">{cfg.label}</span>
                            <span className="text-[10px] text-muted-foreground">{count} items</span>
                          </div>
                          <Progress value={percentage} className="h-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
