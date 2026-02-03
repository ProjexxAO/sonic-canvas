// Personal Hub - Dashboard-first design with simplified/expanded views
// Consistent with Group and Enterprise hubs

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubscription } from '@/hooks/useSubscription';
import { SimplifiedDashboard } from '@/components/personal/SimplifiedDashboard';
import { FullscreenDetailedDashboard } from '@/components/personal/FullscreenDetailedDashboard';
import { WidgetCreatorDialog } from '@/components/personal/WidgetCreatorDialog';
import { TierBadge } from '@/components/subscription/TierBadge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PersonalSection = 'tasks' | 'calendar' | 'email' | 'photos' | 'finance' | 'widgets';

function PersonalHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const { tier } = useSubscription();
  
  // View state
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [initialSection, setInitialSection] = useState<PersonalSection | undefined>();
  const [showWidgetCreator, setShowWidgetCreator] = useState(false);

  // Handle OAuth callback results
  useEffect(() => {
    const oauthStatus = searchParams.get('oauth');
    const platform = searchParams.get('platform');
    const errorMessage = searchParams.get('message');

    if (oauthStatus === 'success' && platform) {
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`, {
        description: 'Your account is now syncing.',
      });
      // Clean up URL params
      searchParams.delete('oauth');
      searchParams.delete('platform');
      setSearchParams(searchParams);
    } else if (oauthStatus === 'error') {
      toast.error('Connection failed', {
        description: errorMessage || 'Please try again or contact support.',
      });
      // Clean up URL params
      searchParams.delete('oauth');
      searchParams.delete('message');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Handle shortcut navigation - opens expanded view at that section
  const handleNavigate = (view: string) => {
    const section = view as PersonalSection;
    setInitialSection(section);
    setShowDetailedView(true);
  };

  // Handle expand dashboard
  const handleExpandDashboard = () => {
    setInitialSection(undefined);
    setShowDetailedView(true);
  };

  // Close detailed view
  const handleCloseDetailedView = () => {
    setShowDetailedView(false);
    setInitialSection(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className={cn(
        "flex-shrink-0 border-b border-border/50 bg-background/95 backdrop-blur-sm",
        "px-4 py-3 md:px-6"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-9 w-9"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Personal Hub</h1>
                <TierBadge tier={tier} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground">Your Life Command Center</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/personal?tab=settings')}
            className="h-9 w-9"
          >
            <Settings size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content - Simplified Dashboard */}
      <main className="flex-1 overflow-hidden">
        <SimplifiedDashboard
          userId={user?.id}
          onExpandDashboard={handleExpandDashboard}
          onNavigate={handleNavigate}
          onCreateWidget={() => setShowWidgetCreator(true)}
        />
      </main>

      {/* Fullscreen Detailed Dashboard */}
      {showDetailedView && (
        <FullscreenDetailedDashboard
          userId={user?.id}
          initialSection={initialSection}
          onClose={handleCloseDetailedView}
        />
      )}

      {/* Widget Creator Dialog */}
      <WidgetCreatorDialog
        open={showWidgetCreator}
        onOpenChange={setShowWidgetCreator}
      />
    </div>
  );
}

export default function PersonalHub() {
  return <PersonalHubPage />;
}
