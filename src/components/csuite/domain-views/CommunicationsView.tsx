import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommunicationsHub } from '@/components/communications';
import { useAuth } from '@/hooks/useAuth';

interface CommunicationsViewProps {
  onBack: () => void;
}

export function CommunicationsView({ onBack }: CommunicationsViewProps) {
  const { user } = useAuth();

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with back button */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
        </Button>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Communications Hub</h3>
          <p className="text-[10px] text-muted-foreground">
            Unified inbox for all your messages
          </p>
        </div>
      </div>

      {/* Communications Hub */}
      <div className="flex-1 overflow-hidden">
        <CommunicationsHub userId={user?.id} />
      </div>
    </div>
  );
}

