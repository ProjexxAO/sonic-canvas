// Personal Hub - Uses unified Atlas interface for consistent UX
// People-first approach: This is the primary landing page after auth

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AtlasHubLayout } from '@/components/atlas/AtlasHubLayout';
import { AtlasErrorBoundary } from '@/pages/Atlas';

function PersonalHubPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

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
