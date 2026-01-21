// Unified Inbox - Cross-platform message view with smart categorization
import { useState, useMemo } from 'react';
import { 
  Mail, 
  MessageCircle, 
  Phone,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Clock,
  Star,
  AlertTriangle,
  Users,
  Briefcase,
  Heart,
  Tag,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAtlasIntelligence, type UnifiedMessage, type MessageCategory } from '@/hooks/useAtlasIntelligence';
import { formatDistanceToNow } from 'date-fns';

interface UnifiedInboxProps {
  className?: string;
  hubFilter?: 'personal' | 'group' | 'csuite' | 'all';
}

const platformIcons: Record<string, typeof Mail> = {
  email: Mail,
  sms: MessageCircle,
  whatsapp: MessageCircle,
  slack: MessageCircle,
  teams: MessageCircle,
  messenger: MessageCircle,
  internal: MessageCircle,
};

const platformColors: Record<string, string> = {
  email: 'bg-blue-500',
  sms: 'bg-green-500',
  whatsapp: 'bg-emerald-500',
  slack: 'bg-purple-500',
  teams: 'bg-violet-500',
  messenger: 'bg-blue-600',
  internal: 'bg-gray-500',
};

const categoryConfig: Record<MessageCategory, { icon: typeof Star; color: string; label: string }> = {
  urgent: { icon: AlertTriangle, color: 'text-destructive', label: 'Urgent' },
  work: { icon: Briefcase, color: 'text-purple-500', label: 'Work' },
  personal: { icon: Star, color: 'text-blue-500', label: 'Personal' },
  family: { icon: Heart, color: 'text-rose-500', label: 'Family' },
  promotional: { icon: Tag, color: 'text-amber-500', label: 'Promo' },
  unknown: { icon: MoreHorizontal, color: 'text-muted-foreground', label: 'Other' },
};

function MessageRow({ message, onDraft }: { message: UnifiedMessage; onDraft: () => void }) {
  const PlatformIcon = platformIcons[message.platform] || MessageCircle;
  const categoryData = categoryConfig[message.category];
  const CategoryIcon = categoryData.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
      message.isRead 
        ? "bg-card/50 border-border/50 hover:bg-card" 
        : "bg-card border-border hover:bg-muted/50",
      message.category === 'urgent' && "border-l-2 border-l-destructive"
    )}>
      {/* Platform indicator */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        platformColors[message.platform]
      )}>
        <PlatformIcon size={14} className="text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn(
              "text-sm truncate",
              !message.isRead && "font-semibold"
            )}>
              {message.sender}
            </span>
            <Badge 
              variant="outline" 
              className={cn("text-[8px] px-1 py-0 h-4", categoryData.color)}
            >
              <CategoryIcon size={8} className="mr-0.5" />
              {categoryData.label}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </div>

        {message.subject && (
          <p className={cn(
            "text-xs mb-0.5",
            !message.isRead && "font-medium"
          )}>
            {message.subject}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground line-clamp-2">
          {message.preview}
        </p>

        {/* Action hints */}
        {message.suggestedAction && (
          <div className="flex items-center gap-2 mt-2">
            <Sparkles size={10} className="text-primary" />
            <span className="text-[10px] text-primary">{message.suggestedAction}</span>
          </div>
        )}
      </div>

      {/* Urgency indicator */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {!message.isRead && (
          <div className="w-2 h-2 rounded-full bg-primary" />
        )}
        <div className={cn(
          "text-[9px] px-1.5 py-0.5 rounded",
          message.urgencyScore >= 80 ? "bg-destructive/10 text-destructive" :
          message.urgencyScore >= 50 ? "bg-amber-500/10 text-amber-500" :
          "bg-muted text-muted-foreground"
        )}>
          {message.urgencyScore}%
        </div>
      </div>
    </div>
  );
}

export function UnifiedInbox({ className, hubFilter = 'all' }: UnifiedInboxProps) {
  const { 
    unifiedInbox, 
    getInboxSummary, 
    getVisibleMessages,
    generateContextAwareDraft
  } = useAtlasIntelligence();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory | 'all'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string | 'all'>('all');

  const summary = getInboxSummary();

  const filteredMessages = useMemo(() => {
    let messages = hubFilter === 'all' 
      ? unifiedInbox 
      : getVisibleMessages(hubFilter as any);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      messages = messages.filter(m => 
        m.sender.toLowerCase().includes(query) ||
        m.preview.toLowerCase().includes(query) ||
        (m.subject?.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      messages = messages.filter(m => m.category === selectedCategory);
    }

    if (selectedPlatform !== 'all') {
      messages = messages.filter(m => m.platform === selectedPlatform);
    }

    return messages.sort((a, b) => {
      // Sort by urgency first, then by time
      if (a.urgencyScore !== b.urgencyScore) {
        return b.urgencyScore - a.urgencyScore;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [unifiedInbox, hubFilter, searchQuery, selectedCategory, selectedPlatform, getVisibleMessages]);

  const unreadCount = filteredMessages.filter(m => !m.isRead).length;

  return (
    <Card className={cn("border h-full flex flex-col", className)}>
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
              <Mail size={14} className="text-primary" />
            </div>
            Unified Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[9px] px-1.5">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]">
                  <Filter size={10} className="mr-1" />
                  Filter
                  <ChevronDown size={10} className="ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Category</DropdownMenuLabel>
                <DropdownMenuItem 
                  className="text-xs"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Categories
                </DropdownMenuItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <DropdownMenuItem 
                    key={key}
                    className="text-xs"
                    onClick={() => setSelectedCategory(key as MessageCategory)}
                  >
                    <config.icon size={10} className={cn("mr-2", config.color)} />
                    {config.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Platform</DropdownMenuLabel>
                <DropdownMenuItem 
                  className="text-xs"
                  onClick={() => setSelectedPlatform('all')}
                >
                  All Platforms
                </DropdownMenuItem>
                {['email', 'sms', 'whatsapp', 'slack', 'teams'].map(platform => (
                  <DropdownMenuItem 
                    key={platform}
                    className="text-xs"
                    onClick={() => setSelectedPlatform(platform)}
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Quick Stats */}
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {Object.entries(summary.byCategory).map(([category, count]) => {
            if (count === 0) return null;
            const config = categoryConfig[category as MessageCategory];
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "outline"}
                size="sm"
                className="h-6 text-[9px] px-2 flex-shrink-0"
                onClick={() => setSelectedCategory(
                  selectedCategory === category ? 'all' : category as MessageCategory
                )}
              >
                <config.icon size={10} className={cn("mr-1", config.color)} />
                {count}
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-2">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail size={32} className="text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No messages</p>
                <p className="text-xs text-muted-foreground/70">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Your inbox is clear'}
                </p>
              </div>
            ) : (
              filteredMessages.map(message => (
                <MessageRow 
                  key={message.id} 
                  message={message} 
                  onDraft={() => generateContextAwareDraft(message, hubFilter === 'all' ? 'personal' : hubFilter)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
