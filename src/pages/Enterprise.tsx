// Enterprise Hub redirect - The Enterprise Hub is served at /atlas
// This page provides a friendly redirect for users navigating to /enterprise

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Enterprise() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the actual Enterprise Hub at /atlas
    navigate('/atlas', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to Enterprise Hub...</p>
      </div>
    </div>
  );
}
