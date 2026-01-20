import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { useAuth } from '@/hooks/useAuth';

/**
 * Global component that applies accessibility settings to the document.
 * Must be mounted at the app root level to ensure settings persist across all routes.
 */
export function GlobalAccessibilityHandler() {
  const { user } = useAuth();
  // This hook applies CSS classes to document.documentElement based on user settings
  useAccessibilitySettings(user?.id);
  
  return null;
}
