import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X,
  Upload,
  Check,
  FileText,
  Plug,
  Mail,
  Cloud as CloudIcon,
  Calendar,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useDataConnectors, ConnectorPlatform, CONNECTOR_CONFIGS } from '@/hooks/useDataConnectors';

interface ConnectDataStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  hasConnectedData: boolean;
  totalDataItems: number;
  onUploadFile: () => void;
  userId?: string;
}

export function ConnectDataStep({ 
  onNext, 
  onBack, 
  onSkip,
  hasConnectedData,
  totalDataItems,
  onUploadFile,
  userId
}: ConnectDataStepProps) {
  const { connectors, initializeConnector, getConnectorStats } = useDataConnectors(userId);
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; platform: ConnectorPlatform | null }>({ open: false, platform: null });
  const [email, setEmail] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const stats = getConnectorStats();
  const activeConnectors = stats.activeConnectors;

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

  const quickConnectors = CONNECTOR_CONFIGS.filter(c => c.available).slice(0, 4);
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
        </div>
        <p className="text-xs text-center text-muted-foreground">Step 3 of 4: Connect Your Data</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
          <Upload size={28} className="text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3 text-center">
          Connect Your Data
        </h2>

        <p className="text-muted-foreground text-center mb-8">
          Upload documents to get started. The more data you add, the more insightful your reports will be.
        </p>

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
            className="w-full h-auto py-4 flex flex-col items-center gap-2 opacity-60"
            disabled
          >
            <CloudIcon size={24} className="text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium text-muted-foreground">Connect Cloud Services</p>
              <p className="text-xs text-muted-foreground">Gmail, Google Drive (Coming Soon)</p>
            </div>
          </Button>
        </div>

        {/* Tip */}
        <div className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg p-3">
          <strong>Tip:</strong> You can always add more data later from the Data tab.
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft size={16} className="mr-1" />
          Back
        </Button>

        <Button onClick={onNext} disabled={totalDataItems === 0}>
          Continue
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
