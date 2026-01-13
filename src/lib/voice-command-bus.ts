import { create } from 'zustand';
import { DomainKey } from '@/hooks/useCSuiteData';

// Comprehensive voice command types for full app control
export type VoiceCommand = 
  // Navigation
  | { type: 'navigate'; path: string }
  
  // Notifications
  | { type: 'show_notification'; message: string; variant?: 'success' | 'error' | 'info' }
  
  // Filtering & Search
  | { type: 'filter'; entity: string; criteria: Record<string, any> }
  | { type: 'search'; query: string; scope?: 'agents' | 'documents' | 'all' }
  | { type: 'clear_filters' }
  
  // Data Hub Control
  | { type: 'switch_tab'; tab: 'command' | 'insights' | 'admin' }
  | { type: 'expand_domain'; domain: DomainKey }
  | { type: 'collapse_domain' }
  | { type: 'switch_persona'; persona: string }
  
  // Report & Analysis
  | { type: 'generate_report'; persona?: string }
  | { type: 'run_query'; query: string }
  | { type: 'refresh_data' }
  
  // Theme & UI
  | { type: 'toggle_theme' }
  | { type: 'set_theme'; theme: 'light' | 'dark' }
  
  // Agent Control
  | { type: 'select_agent'; agentId: string }
  | { type: 'filter_agents'; sector?: string; status?: string; capability?: string }
  
  // Voice responses
  | { type: 'voice_response'; text: string }
  
  // Workflow triggers
  | { type: 'trigger_workflow'; workflowId: string }
  | { type: 'open_dialog'; dialog: 'create_agent' | 'import_agents' | 'connect_platform' | 'create_channel' };

interface VoiceCommandBusState {
  currentCommand: VoiceCommand | null;
  commandHistory: VoiceCommand[];
  isProcessing: boolean;
  lastExecutedAt: number | null;
  
  sendCommand: (command: VoiceCommand) => void;
  clearCommand: () => void;
  setProcessing: (processing: boolean) => void;
  getHistory: () => VoiceCommand[];
}

export const useVoiceCommandBus = create<VoiceCommandBusState>((set, get) => ({
  currentCommand: null,
  commandHistory: [],
  isProcessing: false,
  lastExecutedAt: null,
  
  sendCommand: (command) => {
    console.log('🎤 Voice Command Dispatched:', command);
    set((state) => ({ 
      currentCommand: command,
      commandHistory: [...state.commandHistory.slice(-19), command], // Keep last 20
      lastExecutedAt: Date.now()
    }));
  },
  
  clearCommand: () => {
    set({ currentCommand: null, isProcessing: false });
  },
  
  setProcessing: (processing) => {
    set({ isProcessing: processing });
  },
  
  getHistory: () => get().commandHistory
}));
