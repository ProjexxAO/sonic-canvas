// Personal Hub - Uses unified Data Hub interface for consistent UX
// People-first approach: This is the primary landing page after auth

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  User,
  Sparkles,
  Sun,
  Moon,
  Hexagon,
  Radio,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { CSuiteDataHub } from '@/components/csuite/CSuiteDataHub';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function PersonalHub() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tier } = useSubscription();
  const { theme, setTheme } = useTheme();
  const [hubCreatedAt, setHubCreatedAt] = useState<string | null>(null);

  // Fetch personal hub creation timestamp
  useEffect(() => {
    async function fetchHubAccess() {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('hub_access')
        .select('granted_at')
        .eq('user_id', user.id)
        .eq('hub_type', 'personal')
        .single();
      
      if (data?.granted_at) {
        setHubCreatedAt(data.granted_at);
      }
    }
    fetchHubAccess();
  }, [user?.id]);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col relative overflow-hidden",
      theme === 'dark' 
        ? "bg-[hsl(240_10%_4%)]" 
        : "bg-gradient-to-br from-[hsl(220_25%_97%)] via-[hsl(220_20%_95%)] to-[hsl(220_30%_92%)]"
    )}>
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {theme === 'dark' ? (
          <>
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px]" />
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full blur-[60px]" />
          </>
        )}
      </div>

      {/* Header */}
      <header className={cn(
        "relative z-50 border-b backdrop-blur-xl sticky top-0 flex-shrink-0",
        theme === 'dark' 
          ? "bg-[hsl(240_10%_6%/0.8)] border-border/50" 
          : "bg-white/70 border-border/30 shadow-sm"
      )}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/atlas')}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center relative",
                  theme === 'dark'
                    ? "bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30"
                    : "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                )}>
                  <Hexagon className="h-5 w-5 text-primary absolute" />
                  <Radio className="h-3 w-3 text-primary/70 absolute" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    PERSONAL HUB
                    <Sparkles className="h-4 w-4 text-primary/60" />
                  </h1>
                  <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                    Your Life Command Center
                  </p>
                </div>
                
                {/* Verified Hub Badge */}
                {hubCreatedAt && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-help",
                        theme === 'dark'
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      )}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verified</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-medium">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          Verified Personal Hub
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This is your unique, secure personal hub. Only one personal hub can exist per user.
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 pt-1 border-t border-border/50">
                          <Clock className="h-3 w-3" />
                          Created: {format(new Date(hubCreatedAt), 'MMM d, yyyy \'at\' h:mm a')}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-8 w-8"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </Button>
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize font-mono text-xs",
                  theme === 'dark' ? "border-primary/30 text-primary" : "border-primary/40 text-primary"
                )}
              >
                {tier} Plan
              </Badge>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                theme === 'dark' ? "bg-muted/30" : "bg-muted/50"
              )}>
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Unified Data Hub Interface */}
      <main className="relative z-10 flex-1 container mx-auto px-6 py-6 overflow-auto">
        <CSuiteDataHub 
          userId={user?.id} 
          agents={[]} 
          agentsLoading={false} 
        />
      </main>
    </div>
  );
}
