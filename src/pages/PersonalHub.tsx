// Personal Hub - Uses unified AtlasHubLayout for consistent experience
// The solar system visualization with central Atlas orb

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AtlasHubLayout } from '@/components/atlas/AtlasHubLayout';

function PersonalHubPage() {
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
      hubType="personal"
      hubTitle="Personal Hub"
      hubSubtitle="Your Life Command Center"
    />
  );
}

export default function PersonalHub() {
  return <PersonalHubPage />;
}
