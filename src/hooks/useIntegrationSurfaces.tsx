// useIntegrationSurfaces - Maps connected integrations to hub surfaces
// Defines WHERE each integration should show data in the dashboard

import { useMemo } from 'react';
import { useIntegrationMarketplace, ConnectedIntegration, IntegrationCategory } from './useIntegrationMarketplace';

// Surface types - places in the hub where integrations can render
export type IntegrationSurface = 
  | 'communications'    // Email, messaging, chat widgets
  | 'calendar'          // Calendar events, scheduling
  | 'tasks'             // Task lists, todos
  | 'finance'           // Banking, payments, invoices
  | 'files'             // File browser, documents
  | 'social'            // Social media feeds
  | 'analytics'         // Charts, dashboards, metrics
  | 'crm'               // Contacts, deals, pipelines
  | 'development'       // Code, issues, deployments
  | 'notifications'     // Cross-hub alerts, updates
  | 'quick-actions';    // Shortcut buttons

// Hub type compatibility
export type HubType = 'personal' | 'group' | 'csuite';

// Mapping of integration IDs to their surface locations
interface IntegrationSurfaceMapping {
  integrationId: string;
  surfaces: IntegrationSurface[];
  hubs: HubType[];
  priority: number; // Higher = more prominent
}

// Define where each integration surfaces its data
const SURFACE_MAPPINGS: IntegrationSurfaceMapping[] = [
  // Communication integrations
  { integrationId: 'gmail', surfaces: ['communications', 'notifications', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 100 },
  { integrationId: 'outlook', surfaces: ['communications', 'calendar', 'notifications', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 95 },
  { integrationId: 'slack', surfaces: ['communications', 'notifications', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 90 },
  { integrationId: 'teams', surfaces: ['communications', 'calendar', 'notifications'], hubs: ['group', 'csuite'], priority: 88 },
  { integrationId: 'whatsapp', surfaces: ['communications', 'quick-actions'], hubs: ['personal', 'group'], priority: 85 },
  { integrationId: 'discord', surfaces: ['communications', 'quick-actions'], hubs: ['personal', 'group'], priority: 80 },
  { integrationId: 'zoom', surfaces: ['calendar', 'communications', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 87 },

  // Calendar integrations
  { integrationId: 'google_calendar', surfaces: ['calendar', 'notifications', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 100 },
  { integrationId: 'calendly', surfaces: ['calendar', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 85 },

  // Storage integrations
  { integrationId: 'google_drive', surfaces: ['files', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 95 },
  { integrationId: 'dropbox', surfaces: ['files', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 88 },
  { integrationId: 'onedrive', surfaces: ['files', 'quick-actions'], hubs: ['personal', 'group'], priority: 85 },
  { integrationId: 'box', surfaces: ['files'], hubs: ['csuite'], priority: 80 },

  // Productivity/Tasks integrations
  { integrationId: 'notion', surfaces: ['tasks', 'files', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 92 },
  { integrationId: 'asana', surfaces: ['tasks', 'notifications', 'quick-actions'], hubs: ['group', 'csuite'], priority: 88 },
  { integrationId: 'trello', surfaces: ['tasks', 'quick-actions'], hubs: ['personal', 'group'], priority: 85 },
  { integrationId: 'jira', surfaces: ['tasks', 'development', 'notifications'], hubs: ['group', 'csuite'], priority: 90 },
  { integrationId: 'linear', surfaces: ['tasks', 'development', 'quick-actions'], hubs: ['group', 'csuite'], priority: 88 },
  { integrationId: 'monday', surfaces: ['tasks', 'analytics'], hubs: ['group', 'csuite'], priority: 82 },
  { integrationId: 'clickup', surfaces: ['tasks', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 86 },
  { integrationId: 'airtable', surfaces: ['tasks', 'analytics', 'files'], hubs: ['personal', 'group', 'csuite'], priority: 84 },

  // Finance integrations
  { integrationId: 'stripe', surfaces: ['finance', 'analytics', 'notifications'], hubs: ['csuite'], priority: 95 },
  { integrationId: 'quickbooks', surfaces: ['finance', 'analytics'], hubs: ['csuite'], priority: 90 },
  { integrationId: 'xero', surfaces: ['finance', 'analytics'], hubs: ['csuite'], priority: 88 },
  { integrationId: 'plaid', surfaces: ['finance', 'notifications'], hubs: ['personal', 'csuite'], priority: 92 },

  // CRM integrations
  { integrationId: 'salesforce', surfaces: ['crm', 'analytics', 'notifications'], hubs: ['csuite'], priority: 95 },
  { integrationId: 'hubspot', surfaces: ['crm', 'analytics', 'communications'], hubs: ['csuite'], priority: 92 },
  { integrationId: 'pipedrive', surfaces: ['crm', 'analytics'], hubs: ['csuite'], priority: 85 },

  // Marketing integrations
  { integrationId: 'mailchimp', surfaces: ['communications', 'analytics'], hubs: ['csuite'], priority: 85 },
  { integrationId: 'sendgrid', surfaces: ['communications', 'analytics'], hubs: ['csuite'], priority: 80 },

  // Development integrations
  { integrationId: 'github', surfaces: ['development', 'notifications', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 95 },
  { integrationId: 'gitlab', surfaces: ['development', 'notifications'], hubs: ['group', 'csuite'], priority: 88 },
  { integrationId: 'bitbucket', surfaces: ['development', 'notifications'], hubs: ['group', 'csuite'], priority: 82 },
  { integrationId: 'vercel', surfaces: ['development', 'notifications'], hubs: ['personal', 'group', 'csuite'], priority: 85 },
  { integrationId: 'netlify', surfaces: ['development', 'quick-actions'], hubs: ['personal', 'group'], priority: 78 },
  { integrationId: 'sentry', surfaces: ['development', 'notifications'], hubs: ['csuite'], priority: 80 },
  { integrationId: 'datadog', surfaces: ['analytics', 'notifications'], hubs: ['csuite'], priority: 82 },

  // Analytics integrations
  { integrationId: 'google_analytics', surfaces: ['analytics', 'notifications'], hubs: ['csuite'], priority: 90 },
  { integrationId: 'mixpanel', surfaces: ['analytics'], hubs: ['csuite'], priority: 85 },
  { integrationId: 'amplitude', surfaces: ['analytics'], hubs: ['csuite'], priority: 82 },
  { integrationId: 'posthog', surfaces: ['analytics', 'development'], hubs: ['csuite'], priority: 78 },

  // Social integrations
  { integrationId: 'twitter', surfaces: ['social', 'quick-actions'], hubs: ['personal', 'csuite'], priority: 85 },
  { integrationId: 'instagram', surfaces: ['social', 'quick-actions'], hubs: ['personal'], priority: 80 },
  { integrationId: 'linkedin', surfaces: ['social', 'quick-actions', 'crm'], hubs: ['personal', 'csuite'], priority: 88 },
  { integrationId: 'facebook', surfaces: ['social', 'quick-actions'], hubs: ['personal', 'csuite'], priority: 75 },

  // E-commerce
  { integrationId: 'shopify', surfaces: ['analytics', 'finance', 'notifications'], hubs: ['csuite'], priority: 90 },
  { integrationId: 'woocommerce', surfaces: ['analytics', 'finance'], hubs: ['csuite'], priority: 82 },

  // Design
  { integrationId: 'figma', surfaces: ['files', 'quick-actions', 'notifications'], hubs: ['personal', 'group', 'csuite'], priority: 88 },
  { integrationId: 'canva', surfaces: ['files', 'quick-actions'], hubs: ['personal', 'group'], priority: 80 },

  // AI
  { integrationId: 'openai', surfaces: ['quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 85 },
  { integrationId: 'anthropic', surfaces: ['quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 82 },

  // HR
  { integrationId: 'bamboohr', surfaces: ['analytics', 'notifications'], hubs: ['csuite'], priority: 78 },
  { integrationId: 'gusto', surfaces: ['finance', 'notifications'], hubs: ['csuite'], priority: 75 },

  // Support
  { integrationId: 'zendesk', surfaces: ['communications', 'analytics', 'notifications'], hubs: ['csuite'], priority: 85 },
  { integrationId: 'intercom', surfaces: ['communications', 'analytics'], hubs: ['csuite'], priority: 82 },
  { integrationId: 'freshdesk', surfaces: ['communications', 'analytics'], hubs: ['csuite'], priority: 78 },

  // Automation
  { integrationId: 'zapier', surfaces: ['notifications', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 90 },
  { integrationId: 'make', surfaces: ['notifications', 'quick-actions'], hubs: ['personal', 'group', 'csuite'], priority: 85 },
  { integrationId: 'n8n', surfaces: ['notifications', 'quick-actions'], hubs: ['group', 'csuite'], priority: 78 },
];

// Extended connected integration with surface data
export interface SurfacedIntegration extends ConnectedIntegration {
  surfaces: IntegrationSurface[];
  hubs: HubType[];
  priority: number;
}

// Surface data grouped by location
export interface SurfaceGroup {
  surface: IntegrationSurface;
  integrations: SurfacedIntegration[];
}

export const useIntegrationSurfaces = (currentHub: HubType = 'personal') => {
  const {
    connectedIntegrations,
    isConnected,
    triggerSync,
    disconnectIntegration,
  } = useIntegrationMarketplace();

  // Map connected integrations to their surfaces
  const surfacedIntegrations = useMemo((): SurfacedIntegration[] => {
    return connectedIntegrations.map(integration => {
      const mapping = SURFACE_MAPPINGS.find(m => m.integrationId === integration.id);
      return {
        ...integration,
        surfaces: mapping?.surfaces || ['quick-actions'],
        hubs: mapping?.hubs || ['personal'],
        priority: mapping?.priority || 50,
      };
    }).filter(i => i.hubs.includes(currentHub));
  }, [connectedIntegrations, currentHub]);

  // Group integrations by surface
  const surfaceGroups = useMemo((): Map<IntegrationSurface, SurfacedIntegration[]> => {
    const groups = new Map<IntegrationSurface, SurfacedIntegration[]>();
    
    surfacedIntegrations.forEach(integration => {
      integration.surfaces.forEach(surface => {
        const existing = groups.get(surface) || [];
        groups.set(surface, [...existing, integration].sort((a, b) => b.priority - a.priority));
      });
    });
    
    return groups;
  }, [surfacedIntegrations]);

  // Get integrations for a specific surface
  const getIntegrationsForSurface = (surface: IntegrationSurface): SurfacedIntegration[] => {
    return surfaceGroups.get(surface) || [];
  };

  // Check if any integrations are connected for a surface
  const hasSurfaceIntegrations = (surface: IntegrationSurface): boolean => {
    return (surfaceGroups.get(surface)?.length || 0) > 0;
  };

  // Get quick actions (integrations that should appear as shortcuts)
  const quickActionIntegrations = useMemo(() => {
    return surfacedIntegrations
      .filter(i => i.surfaces.includes('quick-actions'))
      .sort((a, b) => b.priority - a.priority);
  }, [surfacedIntegrations]);

  // Get notification integrations
  const notificationIntegrations = useMemo(() => {
    return surfacedIntegrations
      .filter(i => i.surfaces.includes('notifications'))
      .sort((a, b) => b.priority - a.priority);
  }, [surfacedIntegrations]);

  // Surface-specific stats
  const surfaceStats = useMemo(() => ({
    communications: getIntegrationsForSurface('communications').length,
    calendar: getIntegrationsForSurface('calendar').length,
    tasks: getIntegrationsForSurface('tasks').length,
    finance: getIntegrationsForSurface('finance').length,
    files: getIntegrationsForSurface('files').length,
    social: getIntegrationsForSurface('social').length,
    analytics: getIntegrationsForSurface('analytics').length,
    crm: getIntegrationsForSurface('crm').length,
    development: getIntegrationsForSurface('development').length,
    total: surfacedIntegrations.length,
  }), [surfacedIntegrations, surfaceGroups]);

  return {
    // All connected integrations for this hub
    surfacedIntegrations,
    
    // Grouped by surface
    surfaceGroups,
    
    // Helpers
    getIntegrationsForSurface,
    hasSurfaceIntegrations,
    
    // Special collections
    quickActionIntegrations,
    notificationIntegrations,
    
    // Stats
    surfaceStats,
    
    // Actions
    triggerSync,
    disconnectIntegration,
    isConnected,
  };
};

export default useIntegrationSurfaces;
