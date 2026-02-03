// Atlas / Enterprise Hub - Unified dashboard-first design
// Matches Personal and Group hub patterns with tier-specific enterprise features

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Settings,
  Users,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useCSuiteData } from '@/hooks/useCSuiteData';
import { OnboardingFlow } from '@/components/onboarding';
import { SimplifiedEnterpriseDashboard } from '@/components/csuite/SimplifiedEnterpriseDashboard';
import { FullscreenEnterpriseDetailedDashboard } from '@/components/csuite/FullscreenEnterpriseDetailedDashboard';
import { TierBadge } from '@/components/subscription/TierBadge';

// Error boundary to handle ElevenLabs SDK internal React errors during HMR
export class AtlasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Atlas ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold text-foreground mb-4">Atlas needs a refresh</h2>
            <p className="text-muted-foreground mb-6">
              A temporary issue occurred. Please refresh the page to reconnect.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type EnterpriseSection = 'communications' | 'documents' | 'events' | 'financials' | 'tasks' | 'knowledge';

function AtlasPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tier } = useSubscription();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme ?? "dark";
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatingPersona, setGeneratingPersona] = useState<string | null>(null);

  // State for fullscreen detailed view
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [initialSection, setInitialSection] = useState<EnterpriseSection | undefined>(undefined);

  // Onboarding
  const onboarding = useOnboarding(user?.id);
  
  // C-Suite data for onboarding
  const csuiteData = useCSuiteData(user?.id);
  const totalDataItems = Object.values(csuiteData.stats).reduce((a, b) => a + b, 0);

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  // Onboarding handlers
  const handleOnboardingUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleOnboardingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    for (const file of Array.from(files)) {
      await csuiteData.uploadFile(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOnboardingGenerateReport = async (persona: string) => {
    setGeneratingPersona(persona);
    await csuiteData.generateReport(persona);
    setGeneratingPersona(null);
  };

  // Show onboarding for new users
  if (onboarding.showOnboarding) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.pptx"
          onChange={handleOnboardingFileChange}
          className="hidden"
        />
        <OnboardingFlow
          currentStep={onboarding.currentStep}
          onNext={onboarding.nextStep}
          onPrev={onboarding.prevStep}
          onSkip={onboarding.skipOnboarding}
          onComplete={onboarding.completeOnboarding}
          onGoToStep={onboarding.goToStep}
          hasConnectedData={onboarding.hasConnectedData}
          hasGeneratedReport={onboarding.hasGeneratedReport}
          hasAllocatedAgents={onboarding.hasAllocatedAgents}
          selectedPersona={onboarding.selectedPersona}
          onMarkDataConnected={onboarding.markDataConnected}
          onMarkReportGenerated={onboarding.markReportGenerated}
          onMarkAgentsAllocated={onboarding.markAgentsAllocated}
          totalDataItems={totalDataItems}
          onUploadFile={handleOnboardingUpload}
          onGenerateReport={handleOnboardingGenerateReport}
          isGenerating={generatingPersona !== null}
        />
      </>
    );
  }

  // Main dashboard view - matches Personal and Group hub patterns
  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      theme === 'dark' 
        ? "bg-[hsl(240_10%_4%)]" 
        : "bg-gradient-to-br from-[hsl(220_25%_97%)] via-[hsl(220_20%_95%)] to-[hsl(220_30%_92%)]"
    )}>
      {/* Header */}
      <header className={cn(
        "border-b backdrop-blur-xl sticky top-0 z-10 flex-shrink-0",
        theme === 'dark' 
          ? "bg-[hsl(240_10%_6%/0.8)] border-border/50" 
          : "bg-white/70 border-border/30 shadow-sm"
      )}>
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/personal')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-500" />
                Enterprise Hub
              </h1>
              <p className="text-xs text-muted-foreground">
                C-Suite Intelligence • Full Data Access
              </p>
            </div>
          </div>
          <TierBadge tier={tier} />
        </div>
      </header>

      {/* Main Dashboard Area - Full Width */}
      <main className="flex-1 overflow-hidden">
        <SimplifiedEnterpriseDashboard
          userId={user?.id}
          onExpandDashboard={() => {
            setInitialSection(undefined);
            setShowDetailedView(true);
          }}
          onNavigate={(section) => {
            setInitialSection(section as EnterpriseSection);
            setShowDetailedView(true);
          }}
        />
      </main>

      {/* Fullscreen Detailed View */}
      {showDetailedView && (
        <FullscreenEnterpriseDetailedDashboard
          userId={user?.id}
          onClose={() => setShowDetailedView(false)}
        />
      )}
    </div>
  );
}

export default function Atlas() {
  return (
    <AtlasErrorBoundary>
      <AtlasPage />
    </AtlasErrorBoundary>
  );
}
