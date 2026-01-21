// Phone Panel - Unified messaging and phone sync interface
import { useState } from 'react';
import { 
  Phone, 
  MessageCircle, 
  Video,
  Send,
  Search,
  Plus,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { PhoneSyncPanel } from './PhoneSyncPanel';
import { useAuth } from '@/hooks/useAuth';

// Messaging app definitions
const MESSAGING_APPS = [
  { id: 'imessage', name: 'Messages', icon: MessageCircle, color: 'hsl(142 70% 45%)', unread: 3 },
  { id: 'messenger', name: 'Messenger', icon: MessageCircle, color: 'hsl(214 89% 52%)', unread: 5, url: 'https://messenger.com' },
  { id: 'whatsapp', name: 'WhatsApp', icon: Phone, color: 'hsl(142 70% 45%)', unread: 2, url: 'https://web.whatsapp.com' },
  { id: 'telegram', name: 'Telegram', icon: Send, color: 'hsl(200 80% 50%)', unread: 0, url: 'https://web.telegram.org' },
  { id: 'signal', name: 'Signal', icon: MessageCircle, color: 'hsl(210 80% 55%)', unread: 1, url: 'https://signal.org' },
  { id: 'discord', name: 'Discord', icon: MessageCircle, color: 'hsl(235 85% 65%)', unread: 8, url: 'https://discord.com/app' },
  { id: 'slack', name: 'Slack', icon: MessageCircle, color: 'hsl(340 80% 50%)', unread: 12, url: 'https://slack.com' },
  { id: 'teams', name: 'Teams', icon: Video, color: 'hsl(250 70% 55%)', unread: 4, url: 'https://teams.microsoft.com' },
];

// Mock recent conversations
const RECENT_MESSAGES = [
  { id: '1', contact: 'Mom', message: 'Don\'t forget dinner on Sunday!', time: '2m ago', unread: true },
  { id: '2', contact: 'John Smith', message: 'Meeting confirmed for tomorrow', time: '15m ago', unread: true },
  { id: '3', contact: 'Sarah', message: 'Thanks for the help!', time: '1h ago', unread: false },
  { id: '4', contact: 'Team Group', message: 'Alex: Project update attached', time: '2h ago', unread: true },
  { id: '5', contact: 'Bank Alert', message: 'Your statement is ready', time: '3h ago', unread: false },
];

export function PhonePanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('messages');
  const { user } = useAuth();

  const totalUnread = MESSAGING_APPS.reduce((sum, app) => sum + app.unread, 0);

  const handleOpenApp = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="h-full flex flex-col bg-card/90 border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase">Phone</span>
          {totalUnread > 0 && (
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
              {totalUnread}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Plus size={12} />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs bg-background"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full grid grid-cols-3 bg-muted/30 border-b border-border rounded-none p-0 h-8">
          <TabsTrigger value="messages" className="text-[10px] font-mono rounded-none data-[state=active]:bg-background">
            Messages
          </TabsTrigger>
          <TabsTrigger value="apps" className="text-[10px] font-mono rounded-none data-[state=active]:bg-background">
            Apps
          </TabsTrigger>
          <TabsTrigger value="sync" className="text-[10px] font-mono rounded-none data-[state=active]:bg-background gap-1">
            <Smartphone size={10} />
            Sync
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {RECENT_MESSAGES.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                    msg.unread 
                      ? "bg-primary/5 hover:bg-primary/10" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">
                      {msg.contact.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-xs truncate",
                        msg.unread && "font-semibold"
                      )}>
                        {msg.contact}
                      </span>
                      <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className={cn(
                      "text-[10px] truncate",
                      msg.unread ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {msg.message}
                    </p>
                  </div>
                  {msg.unread && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Apps Tab */}
        <TabsContent value="apps" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 grid grid-cols-4 gap-2">
              {MESSAGING_APPS.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleOpenApp(app.url)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors relative"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${app.color}20` }}
                  >
                    <app.icon size={18} style={{ color: app.color }} />
                  </div>
                  <span className="text-[9px] font-mono text-center truncate w-full">
                    {app.name}
                  </span>
                  {app.unread > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-0.5 -right-0.5 text-[8px] px-1 py-0 h-3.5 min-w-[14px]"
                    >
                      {app.unread}
                    </Badge>
                  )}
                  {app.url && (
                    <ExternalLink size={8} className="absolute top-1 right-1 text-muted-foreground/50" />
                  )}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-3 pb-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px]">
                  <Phone size={12} className="mr-1" />
                  Dial
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px]">
                  <Video size={12} className="mr-1" />
                  Video Call
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="flex-1 mt-0 overflow-hidden">
          <PhoneSyncPanel userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
