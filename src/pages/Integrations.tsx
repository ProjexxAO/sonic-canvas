import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Search,
  Mail,
  Calendar,
  Cloud,
  Database,
  FileText,
  Users,
  DollarSign,
  BarChart3,
  MessageSquare,
  Briefcase,
  Shield,
  Zap,
  Check,
  ExternalLink,
  Settings,
  Plug,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Integration type definition
interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'available' | 'connected' | 'coming_soon';
  popular?: boolean;
  features: string[];
}

// Category definition
interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

// Categories for the marketplace
const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Integrations', icon: <Plug size={18} />, description: 'Browse all available integrations' },
  { id: 'communication', name: 'Communication & Email', icon: <Mail size={18} />, description: 'Email, messaging, and team communication' },
  { id: 'storage', name: 'Cloud Storage', icon: <Cloud size={18} />, description: 'File storage and document management' },
  { id: 'productivity', name: 'Productivity', icon: <Briefcase size={18} />, description: 'Project management and productivity tools' },
  { id: 'crm', name: 'CRM & Sales', icon: <Users size={18} />, description: 'Customer relationship and sales management' },
  { id: 'finance', name: 'Finance & Accounting', icon: <DollarSign size={18} />, description: 'Accounting, invoicing, and financial tools' },
  { id: 'hr', name: 'HR & People', icon: <Users size={18} />, description: 'Human resources and people management' },
  { id: 'analytics', name: 'Analytics & BI', icon: <BarChart3 size={18} />, description: 'Business intelligence and analytics' },
  { id: 'calendar', name: 'Calendar & Scheduling', icon: <Calendar size={18} />, description: 'Calendar and scheduling tools' },
  { id: 'database', name: 'Data & Databases', icon: <Database size={18} />, description: 'Data sources and database connections' },
];

// Integrations catalog
const INTEGRATIONS: Integration[] = [
  // Communication & Email
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Connect your Gmail account to sync emails, contacts, and communication history.',
    icon: <Mail className="text-red-500" />,
    category: 'communication',
    status: 'available',
    popular: true,
    features: ['Email sync', 'Contact import', 'Thread analysis', 'Attachment handling']
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Integrate with Outlook for email, calendar, and contact synchronization.',
    icon: <Mail className="text-blue-500" />,
    category: 'communication',
    status: 'available',
    popular: true,
    features: ['Email sync', 'Calendar integration', 'Contact sync', 'Task management']
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Connect Slack workspaces to monitor channels, messages, and team communications.',
    icon: <MessageSquare className="text-purple-500" />,
    category: 'communication',
    status: 'available',
    features: ['Channel monitoring', 'Message sync', 'File sharing', 'Notifications']
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Integrate with Teams for chat, meetings, and collaboration insights.',
    icon: <MessageSquare className="text-indigo-500" />,
    category: 'communication',
    status: 'available',
    features: ['Chat sync', 'Meeting data', 'Channel integration', 'File access']
  },

  // Cloud Storage
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Access and sync files from Google Drive for document analysis and storage.',
    icon: <Cloud className="text-green-500" />,
    category: 'storage',
    status: 'available',
    popular: true,
    features: ['File sync', 'Document parsing', 'Folder structure', 'Real-time updates']
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Connect Dropbox to sync and analyze your cloud-stored documents.',
    icon: <Cloud className="text-blue-400" />,
    category: 'storage',
    status: 'available',
    features: ['File sync', 'Version history', 'Shared folders', 'Document preview']
  },
  {
    id: 'onedrive',
    name: 'Microsoft OneDrive',
    description: 'Integrate with OneDrive for seamless Microsoft ecosystem file access.',
    icon: <Cloud className="text-sky-500" />,
    category: 'storage',
    status: 'available',
    features: ['File sync', 'Office integration', 'SharePoint access', 'Real-time collaboration']
  },
  {
    id: 'box',
    name: 'Box',
    description: 'Enterprise content management with Box integration.',
    icon: <Cloud className="text-blue-600" />,
    category: 'storage',
    status: 'coming_soon',
    features: ['Secure file sharing', 'Compliance tools', 'Workflow automation', 'Enterprise security']
  },

  // Productivity
  {
    id: 'notion',
    name: 'Notion',
    description: 'Sync Notion workspaces, databases, and pages for knowledge management.',
    icon: <FileText className="text-foreground" />,
    category: 'productivity',
    status: 'available',
    popular: true,
    features: ['Page sync', 'Database integration', 'Workspace access', 'Block-level analysis']
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Connect Asana for project tracking, task management, and team insights.',
    icon: <Briefcase className="text-orange-500" />,
    category: 'productivity',
    status: 'available',
    features: ['Project sync', 'Task tracking', 'Timeline view', 'Team workload']
  },
  {
    id: 'monday',
    name: 'Monday.com',
    description: 'Integrate Monday.com boards for work management and collaboration.',
    icon: <Briefcase className="text-pink-500" />,
    category: 'productivity',
    status: 'coming_soon',
    features: ['Board sync', 'Automation triggers', 'Dashboard integration', 'Timeline sync']
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Connect Jira for issue tracking, sprint management, and development insights.',
    icon: <Briefcase className="text-blue-500" />,
    category: 'productivity',
    status: 'available',
    features: ['Issue sync', 'Sprint tracking', 'Backlog management', 'Velocity metrics']
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Sync Trello boards and cards for visual project management.',
    icon: <Briefcase className="text-sky-400" />,
    category: 'productivity',
    status: 'available',
    features: ['Board sync', 'Card tracking', 'List organization', 'Power-Up data']
  },

  // CRM & Sales
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM integration for sales, customer, and opportunity data.',
    icon: <Users className="text-blue-500" />,
    category: 'crm',
    status: 'available',
    popular: true,
    features: ['Contact sync', 'Opportunity tracking', 'Pipeline analysis', 'Report generation']
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Connect HubSpot for marketing, sales, and customer service insights.',
    icon: <Users className="text-orange-500" />,
    category: 'crm',
    status: 'available',
    popular: true,
    features: ['CRM sync', 'Marketing data', 'Deal tracking', 'Email analytics']
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales CRM integration for pipeline and deal management.',
    icon: <Users className="text-green-500" />,
    category: 'crm',
    status: 'coming_soon',
    features: ['Deal sync', 'Pipeline view', 'Activity tracking', 'Revenue forecasting']
  },

  // Finance & Accounting
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Accounting integration for invoices, expenses, and financial reporting.',
    icon: <DollarSign className="text-green-600" />,
    category: 'finance',
    status: 'available',
    popular: true,
    features: ['Invoice sync', 'Expense tracking', 'Financial reports', 'Tax preparation']
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Cloud accounting integration for comprehensive financial management.',
    icon: <DollarSign className="text-blue-500" />,
    category: 'finance',
    status: 'available',
    features: ['Bank reconciliation', 'Invoice management', 'Expense claims', 'Financial reporting']
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing integration for transaction and revenue analytics.',
    icon: <DollarSign className="text-purple-500" />,
    category: 'finance',
    status: 'available',
    features: ['Payment sync', 'Subscription tracking', 'Revenue analytics', 'Dispute management']
  },
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Bank account connections for real-time financial data and insights.',
    icon: <Database className="text-emerald-500" />,
    category: 'finance',
    status: 'available',
    features: ['Bank connections', 'Transaction sync', 'Balance tracking', 'Account verification']
  },

  // HR & People
  {
    id: 'bamboohr',
    name: 'BambooHR',
    description: 'HR management integration for employee data and people analytics.',
    icon: <Users className="text-green-500" />,
    category: 'hr',
    status: 'coming_soon',
    features: ['Employee directory', 'Time-off tracking', 'Performance data', 'Onboarding workflows']
  },
  {
    id: 'workday',
    name: 'Workday',
    description: 'Enterprise HR and finance integration for workforce management.',
    icon: <Users className="text-orange-500" />,
    category: 'hr',
    status: 'coming_soon',
    features: ['HR data sync', 'Payroll integration', 'Talent management', 'Workforce planning']
  },
  {
    id: 'gusto',
    name: 'Gusto',
    description: 'Payroll and HR platform integration for small business management.',
    icon: <Users className="text-pink-500" />,
    category: 'hr',
    status: 'coming_soon',
    features: ['Payroll sync', 'Benefits data', 'Compliance tracking', 'Team directory']
  },

  // Analytics & BI
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Web analytics integration for traffic, behavior, and conversion insights.',
    icon: <BarChart3 className="text-orange-500" />,
    category: 'analytics',
    status: 'available',
    features: ['Traffic analysis', 'User behavior', 'Conversion tracking', 'Audience insights']
  },
  {
    id: 'tableau',
    name: 'Tableau',
    description: 'Business intelligence integration for advanced data visualization.',
    icon: <BarChart3 className="text-blue-500" />,
    category: 'analytics',
    status: 'coming_soon',
    features: ['Dashboard sync', 'Data visualization', 'Report embedding', 'Workbook access']
  },
  {
    id: 'powerbi',
    name: 'Power BI',
    description: 'Microsoft BI integration for enterprise analytics and reporting.',
    icon: <BarChart3 className="text-yellow-500" />,
    category: 'analytics',
    status: 'coming_soon',
    features: ['Report sync', 'Dataset access', 'Dashboard embedding', 'Real-time data']
  },

  // Calendar & Scheduling
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Calendar sync for meetings, events, and scheduling analytics.',
    icon: <Calendar className="text-blue-500" />,
    category: 'calendar',
    status: 'available',
    popular: true,
    features: ['Event sync', 'Meeting analytics', 'Availability tracking', 'Room booking']
  },
  {
    id: 'outlook_calendar',
    name: 'Outlook Calendar',
    description: 'Microsoft calendar integration for scheduling and meeting management.',
    icon: <Calendar className="text-sky-500" />,
    category: 'calendar',
    status: 'available',
    features: ['Event sync', 'Meeting rooms', 'Scheduling assistant', 'Teams integration']
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Scheduling platform integration for booking and appointment data.',
    icon: <Calendar className="text-blue-400" />,
    category: 'calendar',
    status: 'coming_soon',
    features: ['Booking sync', 'Availability management', 'Event types', 'Routing rules']
  },

  // Data & Databases
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Database and spreadsheet hybrid for structured data management.',
    icon: <Database className="text-blue-400" />,
    category: 'database',
    status: 'available',
    features: ['Base sync', 'Record access', 'View integration', 'Automation triggers']
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Cloud data warehouse integration for enterprise data analytics.',
    icon: <Database className="text-cyan-500" />,
    category: 'database',
    status: 'coming_soon',
    features: ['Data warehouse', 'Query execution', 'Data sharing', 'Real-time sync']
  },
];

// Integration setup info with OAuth configuration details
const INTEGRATION_SETUP: Record<string, { provider: string; steps: string[]; docsUrl: string; consoleUrl?: string }> = {
  gmail: {
    provider: 'Google',
    steps: [
      'Go to Google Cloud Console and create/select a project',
      'Enable the Gmail API in the API Library',
      'Configure OAuth consent screen with required scopes',
      'Create OAuth 2.0 Client ID credentials',
      'Add authorized redirect URI from your app settings',
      'Copy Client ID and Client Secret to connect'
    ],
    docsUrl: 'https://developers.google.com/gmail/api/quickstart',
    consoleUrl: 'https://console.cloud.google.com/apis/credentials'
  },
  outlook: {
    provider: 'Microsoft Azure',
    steps: [
      'Go to Azure Portal and register an application',
      'Configure API permissions for Microsoft Graph',
      'Add Mail.Read, Mail.Send, and User.Read permissions',
      'Create a client secret under Certificates & secrets',
      'Configure redirect URI in Authentication settings',
      'Copy Application ID and Client Secret to connect'
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/graph/auth-register-app-v2',
    consoleUrl: 'https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade'
  },
  google_drive: {
    provider: 'Google',
    steps: [
      'Go to Google Cloud Console and create/select a project',
      'Enable the Google Drive API in the API Library',
      'Configure OAuth consent screen',
      'Create OAuth 2.0 Client ID credentials',
      'Add authorized redirect URI',
      'Copy Client ID and Client Secret to connect'
    ],
    docsUrl: 'https://developers.google.com/drive/api/quickstart',
    consoleUrl: 'https://console.cloud.google.com/apis/credentials'
  },
  slack: {
    provider: 'Slack',
    steps: [
      'Go to Slack API dashboard and create a new app',
      'Configure OAuth & Permissions with required scopes',
      'Add channels:read, chat:write, users:read scopes',
      'Install the app to your workspace',
      'Copy Bot Token and Signing Secret to connect'
    ],
    docsUrl: 'https://api.slack.com/start/quickstart',
    consoleUrl: 'https://api.slack.com/apps'
  },
  salesforce: {
    provider: 'Salesforce',
    steps: [
      'Log in to Salesforce Setup',
      'Navigate to App Manager and create a Connected App',
      'Enable OAuth settings with required scopes',
      'Configure callback URL',
      'Copy Consumer Key and Consumer Secret to connect'
    ],
    docsUrl: 'https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm',
    consoleUrl: 'https://login.salesforce.com'
  },
  hubspot: {
    provider: 'HubSpot',
    steps: [
      'Go to HubSpot Developer Portal',
      'Create a new private or public app',
      'Configure required scopes for CRM access',
      'Set up OAuth redirect URL',
      'Copy Client ID and Client Secret to connect'
    ],
    docsUrl: 'https://developers.hubspot.com/docs/api/working-with-oauth',
    consoleUrl: 'https://developers.hubspot.com/'
  },
  quickbooks: {
    provider: 'Intuit',
    steps: [
      'Go to Intuit Developer Portal',
      'Create an app in the Developer Dashboard',
      'Configure OAuth 2.0 settings',
      'Add redirect URIs',
      'Copy Client ID and Client Secret to connect'
    ],
    docsUrl: 'https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization',
    consoleUrl: 'https://developer.intuit.com/'
  },
};

// Default setup for integrations without specific config
const DEFAULT_SETUP: { provider: string; steps: string[]; docsUrl: string; consoleUrl?: string } = {
  provider: 'OAuth Provider',
  steps: [
    'Visit the integration provider\'s developer portal',
    'Create a new application/project',
    'Configure OAuth 2.0 settings',
    'Add redirect URI from your app settings',
    'Copy credentials to connect'
  ],
  docsUrl: '',
  consoleUrl: undefined,
};

export default function Integrations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConnectDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Filter integrations
  const filteredIntegrations = INTEGRATIONS.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesConnected = !showConnectedOnly || integration.status === 'connected';
    return matchesSearch && matchesCategory && matchesConnected;
  });

  // Group integrations by category for display
  const groupedIntegrations = selectedCategory === 'all' 
    ? CATEGORIES.filter(c => c.id !== 'all').map(category => ({
        category,
        integrations: filteredIntegrations.filter(i => i.category === category.id)
      })).filter(g => g.integrations.length > 0)
    : [{ 
        category: CATEGORIES.find(c => c.id === selectedCategory)!, 
        integrations: filteredIntegrations 
      }];

  const popularIntegrations = INTEGRATIONS.filter(i => i.popular && i.status === 'available');

  const setupInfo = selectedIntegration ? (INTEGRATION_SETUP[selectedIntegration.id] || DEFAULT_SETUP) : DEFAULT_SETUP;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Plug className="text-primary" size={24} />
                  Integrations Marketplace
                </h1>
                <p className="text-sm text-muted-foreground">
                  Connect your tools and services to unlock powerful insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowConnectedOnly(!showConnectedOnly)}>
                {showConnectedOnly ? 'Show All' : 'My Connections'}
              </Button>
              <Button variant="outline" size="sm">
                <Settings size={16} className="mr-2" />
                Manage
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar Categories */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="sticky top-32 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Categories
              </p>
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    selectedCategory === category.id
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {category.icon}
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Category Tabs */}
            <div className="lg:hidden mb-6 overflow-x-auto">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="inline-flex">
                  {CATEGORIES.slice(0, 5).map((category) => (
                    <TabsTrigger key={category.id} value={category.id} className="text-xs">
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Popular Integrations - Only show on 'all' */}
            {selectedCategory === 'all' && !searchQuery && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="text-yellow-500" size={20} />
                  Popular Integrations
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {popularIntegrations.slice(0, 6).map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} featured onConnect={handleConnect} />
                  ))}
                </div>
              </section>
            )}

            {/* Grouped Integrations */}
            {groupedIntegrations.map(({ category, integrations }) => (
              <section key={category.id} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{category.name}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {integrations.map((integration) => (
                    <IntegrationCard key={integration.id} integration={integration} onConnect={handleConnect} />
                  ))}
                </div>
              </section>
            ))}

            {filteredIntegrations.length === 0 && (
              <div className="text-center py-16">
                <Plug className="mx-auto text-muted-foreground mb-4" size={48} />
                <h3 className="text-lg font-medium text-foreground mb-2">No integrations found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Connect Integration Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedIntegration && (
                <div className="p-2 rounded-lg bg-muted">
                  {selectedIntegration.icon}
                </div>
              )}
              Connect {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              Follow these steps to connect your {selectedIntegration?.name} account
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              {/* Provider Info */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  This integration requires OAuth credentials from <strong>{setupInfo.provider}</strong>. 
                  You'll need to create an app in their developer console to get your credentials.
                </p>
              </div>

              {/* Setup Steps */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Setup Steps</h4>
                <ol className="space-y-2">
                  {setupInfo.steps.map((step, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Redirect URI */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Redirect URI</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 rounded bg-muted text-xs font-mono text-foreground overflow-x-auto">
                    {window.location.origin}/auth/callback
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => copyToClipboard(`${window.location.origin}/auth/callback`)}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add this URL to your OAuth app's authorized redirect URIs
                </p>
              </div>

              {/* Links */}
              <div className="flex flex-col gap-2">
                {setupInfo.consoleUrl && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={setupInfo.consoleUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={14} className="mr-2" />
                      Open {setupInfo.provider} Console
                    </a>
                  </Button>
                )}
                {setupInfo.docsUrl && (
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground" asChild>
                    <a href={setupInfo.docsUrl} target="_blank" rel="noopener noreferrer">
                      <FileText size={14} className="mr-2" />
                      View Documentation
                    </a>
                  </Button>
                )}
              </div>

              {/* Coming Soon Notice */}
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-600">OAuth Flow Coming Soon</p>
                    <p className="text-yellow-600/80 text-xs mt-1">
                      Full OAuth authentication flow is being implemented. For now, follow the setup guide to prepare your credentials.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Integration Card Component
function IntegrationCard({ 
  integration, 
  featured,
  onConnect 
}: { 
  integration: Integration; 
  featured?: boolean;
  onConnect?: (integration: Integration) => void;
}) {
  return (
    <div 
      className={cn(
        "group relative rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/50",
        featured && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
      )}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        {integration.status === 'connected' && (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
            <Check size={12} className="mr-1" />
            Connected
          </Badge>
        )}
        {integration.status === 'coming_soon' && (
          <Badge variant="secondary" className="text-xs">
            Coming Soon
          </Badge>
        )}
        {integration.popular && integration.status === 'available' && (
          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
            Popular
          </Badge>
        )}
      </div>

      {/* Icon & Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-xl bg-muted flex-shrink-0">
          {integration.icon}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="font-semibold text-foreground truncate">{integration.name}</h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {integration.description}
      </p>

      {/* Features */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {integration.features.slice(0, 3).map((feature) => (
          <span 
            key={feature} 
            className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
          >
            {feature}
          </span>
        ))}
        {integration.features.length > 3 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            +{integration.features.length - 3} more
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {integration.status === 'available' && (
          <Button size="sm" className="flex-1" onClick={() => onConnect?.(integration)}>
            Connect
          </Button>
        )}
        {integration.status === 'connected' && (
          <>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings size={14} className="mr-1" />
              Configure
            </Button>
            <Button variant="ghost" size="sm">
              <ExternalLink size={14} />
            </Button>
          </>
        )}
        {integration.status === 'coming_soon' && (
          <Button variant="secondary" size="sm" className="flex-1" disabled>
            Notify Me
          </Button>
        )}
      </div>
    </div>
  );
}
