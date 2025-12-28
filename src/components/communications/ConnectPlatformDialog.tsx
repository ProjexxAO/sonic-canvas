import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  CheckCircle2, 
  ExternalLink,
  Shield,
  Copy,
  ArrowRight,
  AlertTriangle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunicationPlatform } from '@/hooks/useCommunications';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ConnectPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (platform: CommunicationPlatform, email: string, accountName?: string) => Promise<void>;
}

type ConnectionStep = 'select' | 'setup' | 'authorize' | 'success';

interface PlatformOption {
  id: CommunicationPlatform;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  available: boolean;
  setupGuide: SetupGuide;
}

interface SetupGuide {
  title: string;
  steps: SetupStep[];
  requirements: string[];
  scopes: string[];
  redirectUrl: string;
  docsUrl?: string;
}

interface SetupStep {
  title: string;
  description: string;
  action?: 'copy' | 'link';
  value?: string;
}

const REDIRECT_URL = `${window.location.origin}/auth/callback`;

const PLATFORMS: PlatformOption[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '📧',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    description: 'Connect your Google Workspace or personal Gmail account',
    available: true,
    setupGuide: {
      title: 'Gmail OAuth Setup',
      steps: [
        {
          title: '1. Create Google Cloud Project',
          description: 'Go to Google Cloud Console and create a new project or select an existing one.',
          action: 'link',
          value: 'https://console.cloud.google.com/',
        },
        {
          title: '2. Enable Gmail API',
          description: 'Navigate to APIs & Services > Library, search for "Gmail API" and enable it.',
        },
        {
          title: '3. Configure OAuth Consent Screen',
          description: 'Go to APIs & Services > OAuth consent screen. Set user type and add your app info.',
        },
        {
          title: '4. Add Required Scopes',
          description: 'Add the Gmail scopes listed below to your consent screen.',
        },
        {
          title: '5. Create OAuth Credentials',
          description: 'Go to APIs & Services > Credentials > Create Credentials > OAuth Client ID. Select "Web application".',
        },
        {
          title: '6. Add Redirect URI',
          description: 'Add this redirect URI to your OAuth client:',
          action: 'copy',
          value: REDIRECT_URL,
        },
      ],
      requirements: [
        'Google Cloud Project',
        'Gmail API enabled',
        'OAuth consent screen configured',
        'OAuth 2.0 Client ID and Secret',
      ],
      scopes: [
        'gmail.readonly',
        'gmail.modify',
        'gmail.send',
        'userinfo.email',
        'userinfo.profile',
      ],
      redirectUrl: REDIRECT_URL,
      docsUrl: 'https://developers.google.com/gmail/api/quickstart',
    },
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: '📬',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Connect your Microsoft 365 or Outlook.com account',
    available: true,
    setupGuide: {
      title: 'Outlook OAuth Setup',
      steps: [
        {
          title: '1. Register App in Azure AD',
          description: 'Go to Azure Portal > Azure Active Directory > App registrations > New registration.',
          action: 'link',
          value: 'https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade',
        },
        {
          title: '2. Configure Platform',
          description: 'Under Authentication, add a Web platform with the redirect URI below.',
          action: 'copy',
          value: REDIRECT_URL,
        },
        {
          title: '3. Add API Permissions',
          description: 'Go to API permissions > Add permission > Microsoft Graph. Add the delegated permissions listed below.',
        },
        {
          title: '4. Create Client Secret',
          description: 'Go to Certificates & secrets > New client secret. Copy the value immediately.',
        },
        {
          title: '5. Note Application IDs',
          description: 'Copy the Application (client) ID and Directory (tenant) ID from the Overview page.',
        },
      ],
      requirements: [
        'Azure Active Directory account',
        'App registration',
        'Microsoft Graph API permissions',
        'Client ID and Secret',
      ],
      scopes: [
        'Mail.Read',
        'Mail.ReadWrite',
        'Mail.Send',
        'User.Read',
        'offline_access',
      ],
      redirectUrl: REDIRECT_URL,
      docsUrl: 'https://learn.microsoft.com/en-us/graph/auth/',
    },
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Connect your Slack workspace',
    available: false,
    setupGuide: {
      title: 'Slack Integration Setup',
      steps: [
        {
          title: '1. Create Slack App',
          description: 'Go to Slack API and create a new app for your workspace.',
          action: 'link',
          value: 'https://api.slack.com/apps',
        },
        {
          title: '2. Configure OAuth',
          description: 'Add the redirect URL and required scopes.',
        },
      ],
      requirements: ['Slack workspace admin access', 'Slack App created'],
      scopes: ['channels:read', 'chat:write', 'users:read'],
      redirectUrl: REDIRECT_URL,
    },
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    icon: '👥',
    color: 'text-blue-600',
    bgColor: 'bg-blue-600/10',
    description: 'Connect your Microsoft Teams',
    available: false,
    setupGuide: {
      title: 'Teams Integration Setup',
      steps: [
        {
          title: '1. Register in Azure AD',
          description: 'Same process as Outlook - use the same app registration.',
        },
      ],
      requirements: ['Azure AD app with Teams permissions'],
      scopes: ['Chat.Read', 'Chat.ReadWrite', 'ChannelMessage.Read.All'],
      redirectUrl: REDIRECT_URL,
    },
  },
];

const PERMISSIONS: Record<string, string[]> = {
  gmail: [
    'Read your email messages',
    'Send emails on your behalf',
    'Access email metadata and labels',
    'View your email address and profile',
  ],
  outlook: [
    'Read your email messages',
    'Send emails on your behalf',
    'Access your calendar',
    'View your profile information',
  ],
  slack: [
    'Read channel messages',
    'Send messages',
    'View workspace members',
  ],
  teams: [
    'Read chat messages',
    'Send messages',
    'View team members',
  ],
};

export function ConnectPlatformDialog({
  open,
  onOpenChange,
  onConnect,
}: ConnectPlatformDialogProps) {
  const [step, setStep] = useState<ConnectionStep>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption | null>(null);
  const [email, setEmail] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePlatformSelect = (platform: PlatformOption) => {
    setSelectedPlatform(platform);
    setStep('setup');
  };

  const handleProceedToAuth = () => {
    setStep('authorize');
  };

  const handleAuthorize = () => {
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    // Simulate OAuth flow - in production this would redirect to OAuth provider
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
    }, 1500);
  };

  const handleComplete = async () => {
    if (selectedPlatform) {
      setIsLoading(true);
      try {
        await onConnect(selectedPlatform.id, email, accountName || undefined);
        toast.success(`${selectedPlatform.name} connected successfully!`);
        handleClose();
      } catch (error) {
        toast.error('Failed to save connection');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedPlatform(null);
    setEmail('');
    setAccountName('');
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === 'setup') {
      setStep('select');
      setSelectedPlatform(null);
    } else if (step === 'authorize') {
      setStep('setup');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Connect Email Platform'}
            {step === 'setup' && `${selectedPlatform?.name} Setup Guide`}
            {step === 'authorize' && `Connect ${selectedPlatform?.name}`}
            {step === 'success' && 'Connected!'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Choose an email platform to sync your messages'}
            {step === 'setup' && 'Follow these steps to configure OAuth for your account'}
            {step === 'authorize' && 'Enter your account details to complete the connection'}
            {step === 'success' && 'Your account has been successfully connected'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step: Select Platform */}
          {step === 'select' && (
            <div className="space-y-3">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformSelect(platform)}
                  disabled={!platform.available}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-lg border border-border',
                    'hover:bg-accent/50 transition-colors text-left',
                    !platform.available && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className={cn('p-3 rounded-lg text-2xl', platform.bgColor)}>
                    {platform.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {platform.name}
                      {!platform.available && (
                        <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {platform.description}
                    </div>
                  </div>
                  {platform.available && (
                    <ArrowRight size={16} className="text-muted-foreground" />
                  )}
                </button>
              ))}

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  <Shield size={12} className="inline mr-1" />
                  Your credentials are encrypted and securely stored
                </p>
              </div>
            </div>
          )}

          {/* Step: Setup Guide */}
          {step === 'setup' && selectedPlatform && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You'll need to configure OAuth in your {selectedPlatform.id === 'gmail' ? 'Google Cloud Console' : 'Azure Portal'} before connecting.
                </p>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info size={14} />
                  Requirements
                </h4>
                <ul className="space-y-1">
                  {selectedPlatform.setupGuide.requirements.map((req, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 size={10} className="text-muted-foreground" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Setup Steps */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="steps">
                  <AccordionTrigger className="text-sm font-medium">
                    Setup Steps ({selectedPlatform.setupGuide.steps.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {selectedPlatform.setupGuide.steps.map((setupStep, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
                          <p className="text-sm font-medium">{setupStep.title}</p>
                          <p className="text-xs text-muted-foreground">{setupStep.description}</p>
                          {setupStep.action === 'copy' && setupStep.value && (
                            <div className="flex items-center gap-2 mt-2">
                              <code className="flex-1 text-[10px] bg-background p-2 rounded border border-border truncate">
                                {setupStep.value}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => copyToClipboard(setupStep.value!)}
                              >
                                <Copy size={12} />
                              </Button>
                            </div>
                          )}
                          {setupStep.action === 'link' && setupStep.value && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs mt-2"
                              onClick={() => window.open(setupStep.value, '_blank')}
                            >
                              <ExternalLink size={10} className="mr-1" />
                              Open Console
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="scopes">
                  <AccordionTrigger className="text-sm font-medium">
                    Required Scopes ({selectedPlatform.setupGuide.scopes.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-1 pt-2">
                      {selectedPlatform.setupGuide.scopes.map((scope, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {selectedPlatform.setupGuide.docsUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => window.open(selectedPlatform.setupGuide.docsUrl, '_blank')}
                >
                  <ExternalLink size={12} className="mr-2" />
                  View Official Documentation
                </Button>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleProceedToAuth} className="flex-1">
                  I've completed setup
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step: Authorize */}
          {step === 'authorize' && selectedPlatform && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 py-4">
                <div className={cn('p-3 rounded-lg text-2xl', selectedPlatform.bgColor)}>
                  {selectedPlatform.icon}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={`your.email@${selectedPlatform.id === 'gmail' ? 'gmail.com' : 'outlook.com'}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Label (optional)</Label>
                  <Input
                    id="accountName"
                    type="text"
                    placeholder="e.g., Work Email, Personal"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium">Atlas will request access to:</p>
                <ul className="space-y-1">
                  {PERMISSIONS[selectedPlatform.id]?.map((permission, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 size={12} className="mt-0.5 text-green-500 shrink-0" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleBack} disabled={isLoading} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleAuthorize} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect Account
                      <ExternalLink size={14} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && selectedPlatform && (
            <div className="space-y-4 text-center py-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-green-500/10">
                  <CheckCircle2 size={48} className="text-green-500" />
                </div>
              </div>

              <div>
                <p className="font-medium">Successfully connected!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {email} is now synced with Atlas
                </p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50 text-left">
                <p className="text-xs text-muted-foreground">
                  Your messages will begin syncing shortly. You can manage this connection 
                  in the platform settings at any time.
                </p>
              </div>

              <Button onClick={handleComplete} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : null}
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
