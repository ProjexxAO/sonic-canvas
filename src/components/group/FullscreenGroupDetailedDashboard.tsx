// Fullscreen Group Detailed Dashboard - Shows all group data in detail
// Displays: Members, Tasks, Events, Files, Chat

import { useMemo, useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X,
  Users,
  MessageSquare,
  Calendar,
  CheckSquare,
  FileText,
  Sun,
  Moon,
  Sunrise,
  Activity,
  Crown,
  Shield,
  Eye,
  Sparkles,
  Mic
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAtlasSafe } from '@/contexts/AtlasContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FullscreenGroupDetailedDashboardProps {
  userId: string | undefined;
  groupId?: string;
  groupName?: string;
  memberCount?: number;
  onClose: () => void;
}

// Get time-based greeting
function getGreeting(): { text: string; icon: typeof Sun; period: 'morning' | 'afternoon' | 'evening' } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise, period: 'morning' };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun, period: 'afternoon' };
  return { text: 'Good evening', icon: Moon, period: 'evening' };
}

export function FullscreenGroupDetailedDashboard({ 
  userId,
  groupId,
  groupName = 'Group',
  memberCount = 0,
  onClose 
}: FullscreenGroupDetailedDashboardProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const atlas = useAtlasSafe();
  
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.email?.split('@')[0] || 'there';
  
  const handleAtlasActivate = useCallback(() => {
    if (atlas) {
      if (atlas.isConnected) {
        atlas.stopConversation();
      } else {
        atlas.startConversation();
      }
    }
  }, [atlas]);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] bg-background overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
            <Users size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {groupName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {memberCount} members • {format(new Date(), 'EEEE, MMMM d, yyyy')}
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
          
          {/* Group Overview */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Group Overview</h2>
                <p className="text-sm text-muted-foreground">Your team at a glance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-card/50">
                <CardContent className="p-4 text-center">
                  <Users size={24} className="mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{memberCount}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4 text-center">
                  <CheckSquare size={24} className="mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Active Tasks</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4 text-center">
                  <Calendar size={24} className="mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Upcoming Events</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4 text-center">
                  <FileText size={24} className="mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">Shared Files</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Members Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Members</h2>
                <p className="text-sm text-muted-foreground">Team members and roles</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{memberCount}</Badge>
            </div>
            
            <Card className="bg-muted/30">
              <CardContent className="p-8 text-center">
                <Users size={40} className="mx-auto mb-3 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Manage your team</h3>
                <p className="text-muted-foreground">Invite members and assign roles</p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Tasks Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckSquare size={20} className="text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Tasks</h2>
                <p className="text-sm text-muted-foreground">Shared action items</p>
              </div>
            </div>
            
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-8 text-center">
                <CheckSquare size={40} className="mx-auto mb-3 text-green-500" />
                <h3 className="text-lg font-semibold">No tasks yet</h3>
                <p className="text-muted-foreground">Create tasks to track team progress</p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Events Section */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Calendar size={20} className="text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Events</h2>
                <p className="text-sm text-muted-foreground">Team meetings and events</p>
              </div>
            </div>
            
            <Card className="bg-purple-500/5 border-purple-500/20">
              <CardContent className="p-8 text-center">
                <Calendar size={40} className="mx-auto mb-3 text-purple-500" />
                <h3 className="text-lg font-semibold">No events scheduled</h3>
                <p className="text-muted-foreground">Schedule team meetings and events</p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Recent Activity */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">What's happening in the group</p>
              </div>
            </div>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-8 text-center">
                <Activity size={40} className="mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold">Welcome to {groupName}!</h3>
                <p className="text-muted-foreground">Activity will appear here as your team collaborates</p>
              </CardContent>
            </Card>
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
                hsl(200 80% 60% / 0.8) 0%,
                hsl(220 70% 50% / 0.6) 30%,
                hsl(240 60% 40% / 0.8) 60%,
                hsl(260 50% 30%) 100%)`
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

export default FullscreenGroupDetailedDashboard;
