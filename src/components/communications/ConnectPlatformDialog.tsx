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
  Mail, 
  Loader2, 
  CheckCircle2, 
  ExternalLink,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunicationPlatform } from '@/hooks/useCommunications';
import { toast } from 'sonner';

interface ConnectPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (platform: CommunicationPlatform, email: string) => void;
}

type ConnectionStep = 'select' | 'authorize' | 'permissions' | 'success';

interface PlatformOption {
  id: 'gmail' | 'outlook';
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

const PLATFORMS: PlatformOption[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '📧',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    description: 'Connect your Google Workspace or personal Gmail account',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: '📬',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Connect your Microsoft 365 or Outlook.com account',
  },
];

const PERMISSIONS = {
  gmail: [
    'Read your email messages',
    'Send emails on your behalf',
    'Access email metadata and labels',
    'Sync contacts for communication',
  ],
  outlook: [
    'Read your email messages',
    'Send emails on your behalf',
    'Access calendar for scheduling',
    'Sync contacts for communication',
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
  const [isLoading, setIsLoading] = useState(false);

  const handlePlatformSelect = (platform: PlatformOption) => {
    setSelectedPlatform(platform);
    setStep('authorize');
  };

  const handleAuthorize = () => {
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    // Simulate OAuth redirect delay
    setTimeout(() => {
      setIsLoading(false);
      setStep('permissions');
    }, 1500);
  };

  const handleGrantPermissions = () => {
    setIsLoading(true);
    // Simulate permission grant delay
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
    }, 1000);
  };

  const handleComplete = () => {
    if (selectedPlatform) {
      onConnect(selectedPlatform.id, email);
      toast.success(`${selectedPlatform.name} connected successfully!`);
    }
    handleClose();
  };

  const handleClose = () => {
    setStep('select');
    setSelectedPlatform(null);
    setEmail('');
    setIsLoading(false);
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === 'authorize') {
      setStep('select');
      setSelectedPlatform(null);
    } else if (step === 'permissions') {
      setStep('authorize');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Connect Email Platform'}
            {step === 'authorize' && `Sign in to ${selectedPlatform?.name}`}
            {step === 'permissions' && 'Grant Permissions'}
            {step === 'success' && 'Connected!'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Choose an email platform to sync your messages'}
            {step === 'authorize' && 'Enter your email to continue with authorization'}
            {step === 'permissions' && `Allow Atlas to access your ${selectedPlatform?.name} account`}
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
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-lg border border-border',
                    'hover:bg-accent/50 transition-colors text-left'
                  )}
                >
                  <div className={cn('p-3 rounded-lg text-2xl', platform.bgColor)}>
                    {platform.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {platform.description}
                    </div>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </button>
              ))}

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  <Shield size={12} className="inline mr-1" />
                  Your credentials are encrypted and never stored directly
                </p>
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

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={`your.email@${selectedPlatform.id === 'gmail' ? 'gmail.com' : 'outlook.com'}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleBack} disabled={isLoading} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleAuthorize} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      Continue with {selectedPlatform.name}
                      <ExternalLink size={14} className="ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                You'll be redirected to {selectedPlatform.name} to complete sign-in
              </p>
            </div>
          )}

          {/* Step: Permissions */}
          {step === 'permissions' && selectedPlatform && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className={cn('p-2 rounded-lg text-xl', selectedPlatform.bgColor)}>
                  {selectedPlatform.icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{email}</div>
                  <div className="text-xs text-muted-foreground">{selectedPlatform.name} Account</div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Atlas would like to:</p>
                <ul className="space-y-2">
                  {PERMISSIONS[selectedPlatform.id].map((permission, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={14} className="mt-0.5 text-green-500 shrink-0" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleBack} disabled={isLoading} className="flex-1">
                  Deny
                </Button>
                <Button onClick={handleGrantPermissions} disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Allow Access'
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

              <Button onClick={handleComplete} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
