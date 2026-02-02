// Fullscreen Enterprise Detailed Dashboard - Shows all enterprise data in detail
// Displays: Communications, Documents, Events, Financials, Tasks, Knowledge

import { useMemo, useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X,
  Mail,
  FileText,
  Calendar,
  DollarSign,
  CheckSquare,
  BookOpen,
  Sun,
  Moon,
  Sunrise,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  Sparkles,
  Hexagon,
  Radio,
  Mic
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCSuiteData, DomainItem } from '@/hooks/useCSuiteData';
import { useAtlasSafe } from '@/contexts/AtlasContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FullscreenEnterpriseDetailedDashboardProps {
  userId: string | undefined;
  onClose: () => void;
}

// Get time-based greeting
function getGreeting(): { text: string; icon: typeof Sun; period: 'morning' | 'afternoon' | 'evening' } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise, period: 'morning' };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun, period: 'afternoon' };
  return { text: 'Good evening', icon: Moon, period: 'evening' };
}

// Domain item card
function DomainItemCard({ item, icon: Icon, color }: { item: DomainItem; icon: typeof Mail; color: string }) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{item.title}</h3>
            {item.preview && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.preview}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
              <span className="text-xs text-muted-foreground">
                {format(item.date, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FullscreenEnterpriseDetailedDashboard({ 
  userId, 
  onClose 
}: FullscreenEnterpriseDetailedDashboardProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { 
    stats, 
    domainItems,
    isLoading: dataLoading,
    fetchDomainItems
  } = useCSuiteData(userId);
  
  const atlas = useAtlasSafe();
  
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch domain items on mount
  useEffect(() => {
    fetchDomainItems('communications');
    fetchDomainItems('documents');
    fetchDomainItems('events');
    fetchDomainItems('financials');
    fetchDomainItems('tasks');
    fetchDomainItems('knowledge');
  }, [fetchDomainItems]);

  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.email?.split('@')[0] || 'Executive';
  
  const handleAtlasActivate = useCallback(() => {
    if (atlas) {
      if (atlas.isConnected) {
        atlas.stopConversation();
      } else {
        atlas.startConversation();
      }
    }
  }, [atlas]);

  // Get items by domain from the store
  const communications = useMemo(() => domainItems.communications.slice(0, 5), [domainItems.communications]);
  const documents = useMemo(() => domainItems.documents.slice(0, 5), [domainItems.documents]);
  const events = useMemo(() => domainItems.events.slice(0, 5), [domainItems.events]);
  const financials = useMemo(() => domainItems.financials.slice(0, 5), [domainItems.financials]);
  const tasks = useMemo(() => domainItems.tasks.slice(0, 5), [domainItems.tasks]);
  const knowledge = useMemo(() => domainItems.knowledge.slice(0, 5), [domainItems.knowledge]);

  const isLoading = dataLoading && !loadingTimedOut;

  if (isLoading) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading enterprise data...</div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] bg-background overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            greeting.period === 'morning' && "bg-orange-100 dark:bg-orange-900/30",
            greeting.period === 'afternoon' && "bg-yellow-100 dark:bg-yellow-900/30",
            greeting.period === 'evening' && "bg-indigo-100 dark:bg-indigo-900/30"
          )}>
            <greeting.icon size={24} className={cn(
              greeting.period === 'morning' && "text-orange-500",
              greeting.period === 'afternoon' && "text-yellow-500",
              greeting.period === 'evening' && "text-indigo-400"
            )} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {greeting.text}, {userName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • Enterprise Hub
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClose} 
          className="h-10 px-4 rounded-xl gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
        >
          <X size={18} className="text-primary" />
          <span className="text-sm font-medium text-primary">Close</span>
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Overview Stats */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Enterprise Overview</h2>
                <p className="text-sm text-muted-foreground">Your data at a glance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Communications', value: stats.communications, icon: Mail, color: 'hsl(200 70% 50%)' },
                { label: 'Documents', value: stats.documents, icon: FileText, color: 'hsl(280 70% 50%)' },
                { label: 'Events', value: stats.events, icon: Calendar, color: 'hsl(150 70% 45%)' },
                { label: 'Financials', value: stats.financials, icon: DollarSign, color: 'hsl(45 80% 50%)' },
                { label: 'Tasks', value: stats.tasks, icon: CheckSquare, color: 'hsl(350 70% 50%)' },
                { label: 'Knowledge', value: stats.knowledge, icon: BookOpen, color: 'hsl(220 70% 55%)' },
              ].map(({ label, value, icon: Icon, color }) => (
                <Card key={label} className="bg-card/50">
                  <CardContent className="p-4 text-center">
                    <div 
                      className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon size={18} style={{ color }} />
                    </div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          {/* Communications */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(200 70% 50% / 0.1)' }}>
                <Mail size={20} style={{ color: 'hsl(200 70% 50%)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Communications</h2>
                <p className="text-sm text-muted-foreground">Recent messages and emails</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{stats.communications}</Badge>
            </div>
            
            {communications.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {communications.map(item => (
                  <DomainItemCard key={item.id} item={item} icon={Mail} color="hsl(200 70% 50%)" />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <Mail size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No communications yet</p>
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Documents */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(280 70% 50% / 0.1)' }}>
                <FileText size={20} style={{ color: 'hsl(280 70% 50%)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Documents</h2>
                <p className="text-sm text-muted-foreground">Files and documents</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{stats.documents}</Badge>
            </div>
            
            {documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {documents.map(item => (
                  <DomainItemCard key={item.id} item={item} icon={FileText} color="hsl(280 70% 50%)" />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No documents yet</p>
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Events */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(150 70% 45% / 0.1)' }}>
                <Calendar size={20} style={{ color: 'hsl(150 70% 45%)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Events</h2>
                <p className="text-sm text-muted-foreground">Meetings and calendar events</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{stats.events}</Badge>
            </div>
            
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {events.map(item => (
                  <DomainItemCard key={item.id} item={item} icon={Calendar} color="hsl(150 70% 45%)" />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <Calendar size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No events scheduled</p>
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Tasks */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'hsl(350 70% 50% / 0.1)' }}>
                <CheckSquare size={20} style={{ color: 'hsl(350 70% 50%)' }} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tasks</h2>
                <p className="text-sm text-muted-foreground">Action items and todos</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{stats.tasks}</Badge>
            </div>
            
            {tasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tasks.map(item => (
                  <DomainItemCard key={item.id} item={item} icon={CheckSquare} color="hsl(350 70% 50%)" />
                ))}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <CheckSquare size={40} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No tasks yet</p>
                </CardContent>
              </Card>
            )}
          </section>

        </div>
      </ScrollArea>

      {/* Floating Atlas Orb */}
      {atlas && (
        <button
          onClick={handleAtlasActivate}
          className={cn(
            "fixed bottom-6 right-6 w-14 h-14 rounded-full overflow-hidden transition-all duration-300",
            "shadow-lg hover:scale-105 active:scale-95"
          )}
          style={{
            boxShadow: atlas.isConnected 
              ? `0 0 ${15 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 25}px hsl(var(--primary) / 0.5)`
              : `0 0 10px hsl(var(--primary) / 0.3)`
          }}
        >
          {/* Nebula background */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(ellipse at 30% 30%, 
                hsl(280 80% 60% / 0.8) 0%,
                hsl(260 70% 50% / 0.6) 30%,
                hsl(240 60% 40% / 0.8) 60%,
                hsl(220 50% 30%) 100%)`
            }}
          />
          
          {/* Spinning animation when active */}
          {atlas.isConnected && (
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent, hsl(var(--primary) / 0.3), transparent)`,
                animation: atlas.isSpeaking ? 'spin 1s linear infinite' : 'spin 3s linear infinite'
              }}
            />
          )}
          
          {/* Core */}
          <div className="absolute inset-2 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
            {atlas.isConnected ? (
              <Mic size={20} className="text-white" />
            ) : (
              <Sparkles size={20} className="text-white" />
            )}
          </div>
          
          {/* Active indicator */}
          {atlas.isConnected && atlas.isSpeaking && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
          )}
        </button>
      )}
    </div>,
    document.body
  );
}

export default FullscreenEnterpriseDetailedDashboard;
