import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Upload,
  Check,
  FileText,
  Cloud as CloudIcon,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDataConnectors, ConnectorPlatform, CONNECTOR_CONFIGS } from '@/hooks/useDataConnectors';
import { SubscriptionTier, TIER_USAGE_LIMITS } from '@/lib/tierConfig';

interface ConnectDataStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  hasConnectedData: boolean;
  totalDataItems: number;
  onUploadFile: () => void;
  userId?: string;
  tier?: SubscriptionTier;
}

export function ConnectDataStep({ 
  onNext, 
  onBack, 
  onSkip,
  hasConnectedData,
  totalDataItems,
  onUploadFile,
  userId,
  tier = 'free'
}: ConnectDataStepProps) {
  const { connectors, initializeConnector, getConnectorStats } = useDataConnectors(userId);
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; platform: ConnectorPlatform | null }>({ open: false, platform: null });
  const [email, setEmail] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const limits = TIER_USAGE_LIMITS[tier];
  const stats = getConnectorStats();

  const handleConnect = (platform: ConnectorPlatform) => {
    setConnectDialog({ open: true, platform });
    setEmail('');
  };

  const handleConfirmConnect = async () => {
    if (!connectDialog.platform || !email) return;
    setIsConnecting(true);
    try {
      await initializeConnector(connectDialog.platform, { email });
      setConnectDialog({ open: false, platform: null });
    } finally {
      setIsConnecting(false);
    }
  };

  const isConnected = (platform: ConnectorPlatform) => connectors.some(c => c.platform === platform && c.isActive);
  
  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Skip button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 text-muted-foreground z-10"
        onClick={onSkip}
      >
        <X size={16} className="mr-1" />
        Skip
      </Button>

      {/* Progress indicator */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <StepIndicator step={1} completed />
          <div className="w-8 h-0.5 bg-primary" />
          <StepIndicator step={2} completed />
          <div className="w-8 h-0.5 bg-primary" />
          <StepIndicator step={3} active />
          <div className="w-8 h-0.5 bg-muted" />
          <StepIndicator step={4} />
          <div className="w-8 h-0.5 bg-muted" />
          <StepIndicator step={5} />
        </div>
        <p className="text-xs text-center text-muted-foreground">Step 3 of 5: Connect Your Data</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
          <Upload size={28} className="text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3 text-center">
          Connect Your Data
        </h2>

        <p className="text-muted-foreground text-center mb-4">
          Upload documents to get started. Atlas will analyze and extract insights.
        </p>

        {/* Tier limits info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <span>Document limit: <strong className="text-foreground">{limits.documentsLimit}</strong></span>
          <span>•</span>
          <span>Storage: <strong className="text-foreground">{limits.storageGB} GB</strong></span>
          <span>•</span>
          <span>Connectors: <strong className="text-foreground">{limits.connectorsLimit}</strong></span>
        </div>

        {/* Status */}
        {totalDataItems > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 mb-6">
            <Check size={16} className="text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">
              {totalDataItems} item{totalDataItems !== 1 ? 's' : ''} connected
            </span>
          </div>
        )}

        {/* Upload options */}
        <div className="w-full space-y-3 mb-8">
          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-center gap-2"
            onClick={onUploadFile}
          >
            <FileText size={24} className="text-primary" />
            <div className="text-center">
              <p className="font-medium">Upload Documents</p>
              <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className={cn(
              "w-full h-auto py-4 flex flex-col items-center gap-2",
              tier === 'free' && "opacity-60"
            )}
            disabled={tier === 'free'}
          >
            <CloudIcon size={24} className={tier === 'free' ? 'text-muted-foreground' : 'text-primary'} />
            <div className="text-center">
              <p className={cn("font-medium", tier === 'free' && "text-muted-foreground")}>
                Connect Cloud Services
              </p>
              <p className="text-xs text-muted-foreground">
                {tier === 'free' ? (
                  <span className="flex items-center gap-1 justify-center">
                    <Lock size={10} /> Upgrade to Pro
                  </span>
                ) : (
                  'Gmail, Google Drive'
                )}
              </p>
            </div>
          </Button>
        </div>

        {/* Tip */}
        <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg p-3">
          <strong>Tip:</strong> You can always add more data later from your Dashboard.
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" />
          Back
        </Button>

        <Button onClick={onNext}>
          {totalDataItems > 0 ? 'Continue' : 'Skip for now'}
          <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

function StepIndicator({ step, active, completed }: { step: number; active?: boolean; completed?: boolean }) {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
        completed 
          ? "bg-primary text-primary-foreground" 
          : active 
            ? "bg-primary/20 text-primary border-2 border-primary"
            : "bg-muted text-muted-foreground"
      )}
    >
      {completed ? <Check size={14} /> : step}
    </div>
  );
}
