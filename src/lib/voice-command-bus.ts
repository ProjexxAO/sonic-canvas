import { create } from 'zustand';

// Define all possible voice command types
export type VoiceCommand = 
  | { type: 'navigate'; path: string }
  | { type: 'show_notification'; message: string }
  | { type: 'filter'; entity: string; criteria: Record<string, any> }
  | { type: 'voice_response'; text: string };

// State interface
interface VoiceCommandBusState {
  currentCommand: VoiceCommand | null;
  isProcessing: boolean;
  
  // Actions
  sendCommand: (command: VoiceCommand) => void;
  clearCommand: () => void;
  setProcessing: (processing: boolean) => void;
}

// Create the store
export const useVoiceCommandBus = create<VoiceCommandBusState>((set) => ({
  currentCommand: null,
  isProcessing: false,
  sendCommand: (command) => {
    console.log('🎤 Voice Command Received:', command);
    set({ currentCommand: command });
  },
  clearCommand: () => {
    set({ currentCommand: null });
  },
  setProcessing: (processing) => {
    set({ isProcessing: processing });
  }
}));
