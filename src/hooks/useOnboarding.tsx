import { useState, useEffect, useCallback } from 'react';

export type OnboardingStep = 
  | 'welcome'
  | 'feature-tour'
  | 'connect-data'
  | 'generate-report'
  | 'complete';

interface OnboardingState {
  currentStep: OnboardingStep;
  hasCompletedOnboarding: boolean;
  hasSeenWelcome: boolean;
  hasConnectedData: boolean;
  hasGeneratedReport: boolean;
}

const ONBOARDING_STORAGE_KEY = 'csuite-onboarding-state';

const DEFAULT_STATE: OnboardingState = {
  currentStep: 'welcome',
  hasCompletedOnboarding: false,
  hasSeenWelcome: false,
  hasConnectedData: false,
  hasGeneratedReport: false,
};

export function useOnboarding(userId: string | undefined) {
  const [state, setState] = useState<OnboardingState>(() => {
    if (!userId) return DEFAULT_STATE;
    
    try {
      const stored = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}-${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load onboarding state:', e);
    }
    return DEFAULT_STATE;
  });

  // Persist state changes
  useEffect(() => {
    if (!userId) return;
    
    try {
      localStorage.setItem(`${ONBOARDING_STORAGE_KEY}-${userId}`, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save onboarding state:', e);
    }
  }, [state, userId]);

  // Reset state when user changes
  useEffect(() => {
    if (!userId) {
      setState(DEFAULT_STATE);
      return;
    }
    
    try {
      const stored = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}-${userId}`);
      if (stored) {
        setState(JSON.parse(stored));
      } else {
        setState(DEFAULT_STATE);
      }
    } catch (e) {
      setState(DEFAULT_STATE);
    }
  }, [userId]);

  const goToStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      const steps: OnboardingStep[] = ['welcome', 'feature-tour', 'connect-data', 'generate-report', 'complete'];
      const currentIndex = steps.indexOf(prev.currentStep);
      const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
      return { ...prev, currentStep: steps[nextIndex] };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      const steps: OnboardingStep[] = ['welcome', 'feature-tour', 'connect-data', 'generate-report', 'complete'];
      const currentIndex = steps.indexOf(prev.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { ...prev, currentStep: steps[prevIndex] };
    });
  }, []);

  const markWelcomeSeen = useCallback(() => {
    setState(prev => ({ ...prev, hasSeenWelcome: true }));
  }, []);

  const markDataConnected = useCallback(() => {
    setState(prev => ({ ...prev, hasConnectedData: true }));
  }, []);

  const markReportGenerated = useCallback(() => {
    setState(prev => ({ ...prev, hasGeneratedReport: true }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentStep: 'complete',
      hasCompletedOnboarding: true 
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const skipOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      currentStep: 'complete'
    }));
  }, []);

  return {
    ...state,
    goToStep,
    nextStep,
    prevStep,
    markWelcomeSeen,
    markDataConnected,
    markReportGenerated,
    completeOnboarding,
    resetOnboarding,
    skipOnboarding,
    showOnboarding: !state.hasCompletedOnboarding && !!userId,
  };
}
