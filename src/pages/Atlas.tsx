// Atlas / Enterprise Hub - Uses unified AtlasHubLayout
// The solar system visualization with central Atlas orb for C-Suite intelligence

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AtlasHubLayout } from '@/components/atlas/AtlasHubLayout';

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

function AtlasPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect if not authenticated
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

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

  return (
    <AtlasHubLayout
      hubType="csuite"
      hubTitle="Enterprise Hub"
      hubSubtitle="C-Suite Intelligence • Full Data Access"
      showOnboarding={true}
    />
  );
}

export default function Atlas() {
  return (
    <AtlasErrorBoundary>
      <AtlasPage />
    </AtlasErrorBoundary>
  );
}
