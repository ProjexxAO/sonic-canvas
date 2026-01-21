import { useState } from 'react';
import { 
  Plug, 
  CreditCard, 
  Image, 
  Upload, 
  RefreshCw, 
  Check, 
  ChevronRight,
  Mail,
  Cloud,
  Calendar,
  Building2,
  FileText,
  Camera,
  HardDrive,
  Link2,
  Loader2,
  Plus,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useDataConnectors, ConnectorPlatform, CONNECTOR_CONFIGS } from '@/hooks/useDataConnectors';
import { useBanking } from '@/hooks/useBanking';
import { useTheme } from 'next-themes';

interface PersonalConnectorsPanelProps {
  userId?: string;
}

// Personal connection categories
const CONNECTION_CATEGORIES = [
  {
    id: 'banking',
    label: 'Banking & Finance',
    icon: CreditCard,
    color: 'emerald',
    description: 'Connect bank accounts, credit cards, and investment accounts',
    items: [
      { id: 'bank', label: 'Bank Account', icon: Building2, available: true },
      { id: 'credit', label: 'Credit Card', icon: CreditCard, available: true },
      { id: 'investment', label: 'Investments', icon: HardDrive, available: false },
    ]
  },
  {
    id: 'email',
    label: 'Email & Calendar',
    icon: Mail,
    color: 'blue',
    description: 'Sync emails, contacts, and calendar events',
    items: [
      { id: 'gmail', label: 'Gmail', icon: Mail, available: true, platform: 'gmail' as ConnectorPlatform },
      { id: 'outlook', label: 'Outlook', icon: Mail, available: true, platform: 'outlook' as ConnectorPlatform },
      { id: 'calendar', label: 'Google Calendar', icon: Calendar, available: true, platform: 'calendar' as ConnectorPlatform },
    ]
  },
  {
    id: 'cloud',
    label: 'Cloud Storage',
    icon: Cloud,
    color: 'amber',
    description: 'Access files from cloud storage providers',
    items: [
      { id: 'gdrive', label: 'Google Drive', icon: Cloud, available: true, platform: 'gdrive' as ConnectorPlatform },
      { id: 'dropbox', label: 'Dropbox', icon: Cloud, available: false, platform: 'dropbox' as ConnectorPlatform },
      { id: 'onedrive', label: 'OneDrive', icon: Cloud, available: false },
    ]
  },
  {
    id: 'media',
    label: 'Photos & Media',
    icon: Image,
    color: 'purple',
    description: 'Connect photo libraries and media storage',
    items: [
      { id: 'photos', label: 'Google Photos', icon: Camera, available: false },
      { id: 'icloud', label: 'iCloud Photos', icon: Image, available: false },
      { id: 'local', label: 'Upload Files', icon: Upload, available: true },
    ]
  },
  {
    id: 'tools',
    label: 'Productivity Tools',
    icon: Link2,
    color: 'cyan',
    description: 'Connect note-taking and productivity apps',
    items: [
      { id: 'notion', label: 'Notion', icon: FileText, available: false },
      { id: 'evernote', label: 'Evernote', icon: FileText, available: false },
      { id: 'slack', label: 'Slack', icon: Mail, available: false, platform: 'slack' as ConnectorPlatform },
    ]
  }
];

export function PersonalConnectorsPanel({ userId }: PersonalConnectorsPanelProps) {
  const { theme } = useTheme();
  const { connectors, initializeConnector, triggerSync, isSyncing, getConnectorStats } = useDataConnectors(userId);
  const { accounts: bankAccounts, addBankAccount } = useBanking();
  
  const [connectDialog, setConnectDialog] = useState<{
    open: boolean;
    category: string | null;
    item: any | null;
  }>({ open: false, category: null, item: null });
  
  const [formData, setFormData] = useState({
    email: '',
    accountName: '',
    institutionName: '',
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const stats = getConnectorStats();

  const isItemConnected = (item: any) => {
    if (item.platform) {
      return connectors.some(c => c.platform === item.platform && c.isActive);
    }
    if (item.id === 'bank' || item.id === 'credit') {
      return bankAccounts.length > 0;
    }
    return false;
  };

  const handleConnect = async () => {
    if (!connectDialog.item) return;
    setIsConnecting(true);

    try {
      const item = connectDialog.item;
      
      if (item.platform) {
        // Data connector
        await initializeConnector(item.platform, {
          email: formData.email,
          name: formData.accountName || formData.email.split('@')[0]
        });
      } else if (item.id === 'bank' || item.id === 'credit') {
        // Bank account
        await addBankAccount({
          account_name: formData.accountName || 'My Account',
          institution_name: formData.institutionName || 'Bank',
          account_type: item.id === 'credit' ? 'credit_card' : 'checking',
          currency: 'USD',
          current_balance: 0,
        });
      }
      
      setConnectDialog({ open: false, category: null, item: null });
      setFormData({ email: '', accountName: '', institutionName: '' });
    } finally {
      setIsConnecting(false);
    }
  };

  const getColorClasses = (color: string) => ({
    bg: cn(
      color === 'emerald' && 'bg-emerald-500/10',
      color === 'blue' && 'bg-blue-500/10',
      color === 'amber' && 'bg-amber-500/10',
      color === 'purple' && 'bg-purple-500/10',
      color === 'cyan' && 'bg-cyan-500/10'
    ),
    text: cn(
      color === 'emerald' && 'text-emerald-500',
      color === 'blue' && 'text-blue-500',
      color === 'amber' && 'text-amber-500',
      color === 'purple' && 'text-purple-500',
      color === 'cyan' && 'text-cyan-500'
    ),
    border: cn(
      color === 'emerald' && 'border-emerald-500/30',
      color === 'blue' && 'border-blue-500/30',
      color === 'amber' && 'border-amber-500/30',
      color === 'purple' && 'border-purple-500/30',
      color === 'cyan' && 'border-cyan-500/30'
    ),
  });

  return (
    <>
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Connected Services', value: stats.activeConnectors + bankAccounts.length, icon: Plug },
          { label: 'Items Synced', value: stats.totalItemsSynced, icon: RefreshCw },
          { label: 'Bank Accounts', value: bankAccounts.length, icon: CreditCard },
        ].map((stat, i) => (
          <Card 
            key={i}
            className={cn(
              "border-0 shadow-md backdrop-blur-sm",
              theme === 'dark' ? "bg-card/40" : "bg-white/80"
            )}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Connection Categories */}
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {CONNECTION_CATEGORIES.map(category => {
            const colors = getColorClasses(category.color);
            const connectedCount = category.items.filter(isItemConnected).length;
            
            return (
              <Card 
                key={category.id}
                className={cn(
                  "border-0 shadow-lg backdrop-blur-sm overflow-hidden",
                  theme === 'dark' ? "bg-card/40" : "bg-white/80"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", colors.bg)}>
                        <category.icon className={cn("h-4 w-4", colors.text)} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{category.label}</CardTitle>
                        <CardDescription className="text-xs">{category.description}</CardDescription>
                      </div>
                    </div>
                    {connectedCount > 0 && (
                      <Badge variant="outline" className={cn("text-[10px]", colors.border, colors.text)}>
                        {connectedCount} connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-2">
                    {category.items.map(item => {
                      const connected = isItemConnected(item);
                      const syncing = item.platform && isSyncing === connectors.find(c => c.platform === item.platform)?.id;
                      
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg transition-all",
                            theme === 'dark' ? "hover:bg-muted/20" : "hover:bg-muted/40",
                            !item.available && "opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-1.5 rounded-md",
                              connected ? "bg-emerald-500/10" : "bg-muted/50"
                            )}>
                              <item.icon className={cn(
                                "h-4 w-4",
                                connected ? "text-emerald-500" : "text-muted-foreground"
                              )} />
                            </div>
                            <div>
                              <span className="text-sm font-medium">{item.label}</span>
                              {connected && (
                                <p className="text-[10px] text-muted-foreground">Connected</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {connected ? (
                              <>
                                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                                  <Check size={10} className="mr-1" />
                                  Active
                                </Badge>
                                {item.platform && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => {
                                      const connector = connectors.find(c => c.platform === item.platform);
                                      if (connector) triggerSync(connector.id);
                                    }}
                                    disabled={!!syncing}
                                  >
                                    {syncing ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <RefreshCw size={12} />
                                    )}
                                  </Button>
                                )}
                              </>
                            ) : item.available ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => setConnectDialog({ 
                                  open: true, 
                                  category: category.id, 
                                  item 
                                })}
                              >
                                <Plus size={12} />
                                Connect
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Coming Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Connect Dialog */}
      <Dialog open={connectDialog.open} onOpenChange={(open) => !open && setConnectDialog({ open: false, category: null, item: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {connectDialog.item?.icon && <connectDialog.item.icon className="h-5 w-5 text-primary" />}
              Connect {connectDialog.item?.label}
            </DialogTitle>
            <DialogDescription>
              {connectDialog.category === 'banking' 
                ? 'Enter your account details to connect'
                : 'Enter your account email to connect this service'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {connectDialog.category === 'banking' ? (
              <>
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    placeholder="e.g., Main Checking"
                    value={formData.accountName}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Institution Name</Label>
                  <Input
                    placeholder="e.g., Chase Bank"
                    value={formData.institutionName}
                    onChange={(e) => setFormData(prev => ({ ...prev, institutionName: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Account Email</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1">What we'll access:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {connectDialog.item?.platform && 
                  CONNECTOR_CONFIGS.find(c => c.platform === connectDialog.item.platform)?.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))
                }
                {connectDialog.category === 'banking' && (
                  <>
                    <li>Transaction history</li>
                    <li>Account balance</li>
                    <li>Spending categories</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConnectDialog({ open: false, category: null, item: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || (connectDialog.category !== 'banking' && !formData.email)}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plug className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
