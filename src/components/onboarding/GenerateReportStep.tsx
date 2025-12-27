import { useState } from 'react';
import { 
  ChevronLeft, 
  X,
  Check,
  Sparkles,
  RefreshCw,
  User,
  DollarSign,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GenerateReportStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  hasGeneratedReport: boolean;
  onGenerateReport: (persona: string) => Promise<void>;
  isGenerating: boolean;
  hasData: boolean;
}

const QUICK_PERSONAS = [
  { id: 'ceo', label: 'CEO', icon: User, description: 'Strategic overview' },
  { id: 'cfo', label: 'CFO', icon: DollarSign, description: 'Financial health' },
  { id: 'coo', label: 'COO', icon: TrendingUp, description: 'Operations' },
  { id: 'chief_of_staff', label: 'Chief of Staff', icon: Briefcase, description: 'Cross-functional' },
];

export function GenerateReportStep({ 
  onNext, 
  onBack, 
  onSkip,
  hasGeneratedReport,
  onGenerateReport,
  isGenerating,
  hasData
}: GenerateReportStepProps) {
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!selectedPersona) return;
    await onGenerateReport(selectedPersona);
    setGenerated(true);
  };

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
          <StepIndicator step={3} completed />
          <div className="w-8 h-0.5 bg-primary" />
          <StepIndicator step={4} active />
        </div>
        <p className="text-xs text-center text-muted-foreground">Step 4 of 4: Generate Your First Report</p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center mb-6">
          <Sparkles size={28} className="text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-3 text-center">
          Generate Your First Report
        </h2>

        <p className="text-muted-foreground text-center mb-8">
          Choose an executive persona and generate a personalized AI briefing.
        </p>

        {/* Success state */}
        {generated && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 mb-6">
            <Check size={16} className="text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">
              Report generated successfully!
            </span>
          </div>
        )}

        {/* Persona selection */}
        {!generated && (
          <>
            <div className="w-full grid grid-cols-2 gap-3 mb-6">
              {QUICK_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona.id)}
                  disabled={isGenerating}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all",
                    selectedPersona === persona.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <persona.icon size={16} className="text-primary" />
                    <span className="font-semibold text-sm text-foreground">{persona.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{persona.description}</p>
                </button>
              ))}
            </div>

            {!hasData && (
              <p className="text-xs text-amber-500 mb-4 text-center">
                No data connected. The report will use sample insights.
              </p>
            )}

            <Button
              size="lg"
              className="px-8"
              disabled={!selectedPersona || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </>
        )}

        {/* Complete button */}
        {generated && (
          <Button size="lg" className="px-8" onClick={onNext}>
            <Check size={16} className="mr-2" />
            Complete Setup
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border">
        <Button variant="ghost" onClick={onBack} disabled={isGenerating}>
          <ChevronLeft size={16} className="mr-1" />
          Back
        </Button>

        {!generated && (
          <Button variant="ghost" onClick={onSkip} disabled={isGenerating}>
            Skip for now
          </Button>
        )}
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
