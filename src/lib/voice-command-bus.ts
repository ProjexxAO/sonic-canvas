import { create } from 'zustand';

export type VoiceCommand = 
  | { type: 'navigate'; path: string }
  | { type: 'show_notification'; message: string; variant?: 'success' | 'error' | 'info' }
  | { type: 'filter'; entity: string; criteria: Record<string, any> }
  | { type: 'voice_response'; text: string };

interface VoiceCommandBusState {
  currentCommand: VoiceCommand | null;
  isProcessing: boolean;
  
  sendCommand: (command: VoiceCommand) => void;
  clearCommand: () => void;
  setProcessing: (processing: boolean) => void;
}

export const useVoiceCommandBus = create<VoiceCommandBusState>((set) => ({
  currentCommand: null,
  isProcessing: false,
  sendCommand: (command) => {
    console.log('🎤 Voice Command:', command);
    set({ currentCommand: command });
  },
  clearCommand: () => {
    set({ currentCommand: null });
  },
  setProcessing: (processing) => {
    set({ isProcessing: processing });
  }
}));
