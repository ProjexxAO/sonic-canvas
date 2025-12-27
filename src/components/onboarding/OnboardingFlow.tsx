import { useEffect } from 'react';
import { OnboardingStep } from '@/hooks/useOnboarding';
import { WelcomeScreen } from './WelcomeScreen';
import { FeatureTour } from './FeatureTour';
import { ConnectDataStep } from './ConnectDataStep';
import { GenerateReportStep } from './GenerateReportStep';
import { AllocateAgentsStep } from './AllocateAgentsStep';
import { OnboardingComplete } from './OnboardingComplete';

interface OnboardingFlowProps {
  currentStep: OnboardingStep;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onGoToStep: (step: OnboardingStep) => void;
  hasConnectedData: boolean;
  hasGeneratedReport: boolean;
  hasAllocatedAgents: boolean;
  selectedPersona: string;
  onMarkDataConnected: () => void;
  onMarkReportGenerated: (persona?: string) => void;
  onMarkAgentsAllocated: () => void;
  totalDataItems: number;
  onUploadFile: () => void;
  onGenerateReport: (persona: string) => Promise<void>;
  isGenerating: boolean;
}

export function OnboardingFlow({
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  onGoToStep,
  hasConnectedData,
  hasGeneratedReport,
  hasAllocatedAgents,
  selectedPersona,
  onMarkDataConnected,
  onMarkReportGenerated,
  onMarkAgentsAllocated,
  totalDataItems,
  onUploadFile,
  onGenerateReport,
  isGenerating,
}: OnboardingFlowProps) {
  // Auto-advance when data is connected
  useEffect(() => {
    if (currentStep === 'connect-data' && totalDataItems > 0 && !hasConnectedData) {
      onMarkDataConnected();
    }
  }, [currentStep, totalDataItems, hasConnectedData, onMarkDataConnected]);

  if (currentStep === 'complete') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-md">
      {currentStep === 'welcome' && (
        <WelcomeScreen onStart={onNext} onSkip={onSkip} />
      )}
      
      {currentStep === 'feature-tour' && (
        <FeatureTour onNext={onNext} onBack={onPrev} onSkip={onSkip} />
      )}
      
      {currentStep === 'connect-data' && (
        <ConnectDataStep
          onNext={onNext}
          onBack={onPrev}
          onSkip={onSkip}
          hasConnectedData={hasConnectedData}
          totalDataItems={totalDataItems}
          onUploadFile={onUploadFile}
        />
      )}
      
      {currentStep === 'generate-report' && (
        <GenerateReportStep
          onNext={(persona) => {
            onMarkReportGenerated(persona);
            onNext();
          }}
          onBack={onPrev}
          onSkip={() => onGoToStep('allocate-agents')}
          hasGeneratedReport={hasGeneratedReport}
          onGenerateReport={onGenerateReport}
          isGenerating={isGenerating}
          hasData={totalDataItems > 0}
        />
      )}
      
      {currentStep === 'allocate-agents' && (
        <AllocateAgentsStep
          onNext={() => {
            onMarkAgentsAllocated();
            onComplete();
          }}
          onBack={onPrev}
          onSkip={onComplete}
          selectedPersona={selectedPersona}
        />
      )}
    </div>
  );
}
