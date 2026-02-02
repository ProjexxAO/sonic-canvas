import { create } from 'zustand';

// Re-export all types and categories from the modular voice-commands module
export {
  type VoiceCommand,
  type BaseVoiceCommand,
  type CRMCommand,
  type ProjectCommand,
  type AnalyticsCommand,
  type IoTCommand,
  type ScheduledCommand,
  type MultiStepCommand,
  type ContextAwareCommand,
  type InteractionCommand,
  type CommandCategory,
  type InteractionMode,
  type CommandExecutionContext,
  type PendingCommand,
  EXTENDED_COMMAND_CATEGORIES as COMMAND_CATEGORIES,
} from './voice-commands';

import type { VoiceCommand, InteractionMode, PendingCommand } from './voice-commands';

// ============================================================================
// Voice Command Bus State Management
// ============================================================================

interface VoiceCommandBusState {
  currentCommand: VoiceCommand | null;
  commandHistory: VoiceCommand[];
  isProcessing: boolean;
  lastExecutedAt: number | null;
  pendingConfirmation: VoiceCommand | null;
  interactionMode: InteractionMode;
  isPaused: boolean;
  undoStack: VoiceCommand[];
  
  sendCommand: (command: VoiceCommand) => void;
  clearCommand: () => void;
  setProcessing: (processing: boolean) => void;
  getHistory: () => VoiceCommand[];
  setPendingConfirmation: (command: VoiceCommand | null) => void;
  confirmPendingCommand: () => void;
  cancelPendingCommand: () => void;
  setInteractionMode: (mode: InteractionMode) => void;
  pauseAtlas: () => void;
  resumeAtlas: () => void;
  undoLast: () => VoiceCommand | null;
  pushToUndo: (command: VoiceCommand) => void;
}

export const useVoiceCommandBus = create<VoiceCommandBusState>((set, get) => ({
  currentCommand: null,
  commandHistory: [],
  isProcessing: false,
  lastExecutedAt: null,
  pendingConfirmation: null,
  interactionMode: 'conversational',
  isPaused: false,
  undoStack: [],
  
  sendCommand: (command) => {
    const state = get();
    if (state.isPaused) {
      console.log('🎤 Atlas is paused, command ignored:', command);
      return;
    }
    
    console.log('🎤 Voice Command Dispatched:', command);
    set((s) => ({ 
      currentCommand: command,
      commandHistory: [...s.commandHistory.slice(-99), command], // Keep last 100
      lastExecutedAt: Date.now()
    }));
  },
  
  clearCommand: () => {
    set({ currentCommand: null, isProcessing: false });
  },
  
  setProcessing: (processing) => {
    set({ isProcessing: processing });
  },
  
  getHistory: () => get().commandHistory,
  
  setPendingConfirmation: (command) => {
    set({ pendingConfirmation: command });
  },
  
  confirmPendingCommand: () => {
    const pending = get().pendingConfirmation;
    if (pending) {
      get().sendCommand(pending);
      set({ pendingConfirmation: null });
    }
  },
  
  cancelPendingCommand: () => {
    set({ pendingConfirmation: null });
  },
  
  setInteractionMode: (mode) => {
    console.log('🎤 Interaction mode changed to:', mode);
    set({ interactionMode: mode });
  },
  
  pauseAtlas: () => {
    console.log('🎤 Atlas paused');
    set({ isPaused: true });
  },
  
  resumeAtlas: () => {
    console.log('🎤 Atlas resumed');
    set({ isPaused: false });
  },
  
  undoLast: () => {
    const stack = get().undoStack;
    if (stack.length === 0) return null;
    const lastCommand = stack[stack.length - 1];
    set({ undoStack: stack.slice(0, -1) });
    return lastCommand;
  },
  
  pushToUndo: (command) => {
    set((s) => ({ undoStack: [...s.undoStack.slice(-19), command] })); // Keep last 20
  },
}));
