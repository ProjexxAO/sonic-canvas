// Personal Hub - Uses unified Atlas interface for consistent UX
// People-first approach: This is the primary landing page after auth

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AtlasHubLayout } from '@/components/atlas/AtlasHubLayout';
import { AtlasErrorBoundary } from '@/pages/Atlas';
import { toast } from 'sonner';

function PersonalHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  // Handle OAuth callback results
  useEffect(() => {
    const oauthStatus = searchParams.get('oauth');
    const platform = searchParams.get('platform');
    const errorMessage = searchParams.get('message');

    if (oauthStatus === 'success' && platform) {
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully!`, {
        description: 'Your account is now syncing with Atlas.',
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
  if (!authLoading && !user) {
    navigate('/auth');
    return null;
  }

  return (
    <AtlasHubLayout
      hubType="personal"
      hubTitle="Personal Hub"
      hubSubtitle="Your Life Command Center"
    />
  );
}

export default function PersonalHub() {
  return (
    <AtlasErrorBoundary>
      <PersonalHubPage />
    </AtlasErrorBoundary>
  );
}
