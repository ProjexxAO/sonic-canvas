import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  sessionId: string;
}

export interface MemoryContext {
  recentMessages: ConversationMessage[];
  sessionSummary: string | null;
  userPreferences: Record<string, unknown>;
  activeTopics: string[];
  lastInteraction: number | null;
}

interface MemoryManagerState {
  context: MemoryContext;
  sessionId: string | null;
  isLoading: boolean;
  
  // Actions
  initSession: (userId: string) => Promise<void>;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  getContextWindow: (maxMessages?: number) => ConversationMessage[];
  summarizeSession: () => Promise<string | null>;
  persistToDatabase: (userId: string) => Promise<void>;
  loadFromDatabase: (userId: string, sessionId?: string) => Promise<void>;
  clearMemory: () => void;
  setUserPreference: (key: string, value: unknown) => void;
  addActiveTopic: (topic: string) => void;
  removeActiveTopic: (topic: string) => void;
}

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useMemoryManager = create<MemoryManagerState>((set, get) => ({
  context: {
    recentMessages: [],
    sessionSummary: null,
    userPreferences: {},
    activeTopics: [],
    lastInteraction: null,
  },
  sessionId: null,
  isLoading: false,

  initSession: async (userId: string) => {
    const sessionId = generateSessionId();
    set({ sessionId, isLoading: true });
    
    try {
      // Load recent conversation history from database
      const { data: history } = await supabase
        .from('atlas_conversations')
        .select('id, role, content, created_at, session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (history && history.length > 0) {
        const messages: ConversationMessage[] = history.reverse().map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          sessionId: msg.session_id,
        }));

        set(state => ({
          context: {
            ...state.context,
            recentMessages: messages,
            lastInteraction: messages[messages.length - 1]?.timestamp || null,
          },
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[MemoryManager] Failed to load history:', error);
      set({ isLoading: false });
    }
  },

  addMessage: (role, content) => {
    const { sessionId } = get();
    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      sessionId: sessionId || 'unknown',
    };

    set(state => ({
      context: {
        ...state.context,
        recentMessages: [...state.context.recentMessages.slice(-99), message],
        lastInteraction: message.timestamp,
      },
    }));
  },

  getContextWindow: (maxMessages = 20) => {
    const { context } = get();
    return context.recentMessages.slice(-maxMessages);
  },

  summarizeSession: async () => {
    const { context } = get();
    const messages = context.recentMessages.slice(-30);
    
    if (messages.length < 3) return null;

    try {
      const response = await supabase.functions.invoke('atlas-orchestrator', {
        body: {
          action: 'chat',
          query: `Summarize this conversation in 2-3 sentences, focusing on key topics and decisions:\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`,
        },
      });

      const summary = response.data?.response || null;
      
      if (summary) {
        set(state => ({
          context: {
            ...state.context,
            sessionSummary: summary,
          },
        }));
      }

      return summary;
    } catch (error) {
      console.error('[MemoryManager] Failed to summarize:', error);
      return null;
    }
  },

  persistToDatabase: async (userId: string) => {
    const { context, sessionId } = get();
    const recentMessages = context.recentMessages.filter(
      m => m.timestamp > Date.now() - 60000 // Last minute only
    );

    for (const msg of recentMessages) {
      try {
        await supabase.from('atlas_conversations').upsert({
          id: msg.id,
          user_id: userId,
          role: msg.role,
          content: msg.content,
          session_id: sessionId || msg.sessionId,
          created_at: new Date(msg.timestamp).toISOString(),
        });
      } catch (error) {
        console.error('[MemoryManager] Failed to persist message:', error);
      }
    }
  },

  loadFromDatabase: async (userId: string, sessionId?: string) => {
    set({ isLoading: true });

    try {
      let query = supabase
        .from('atlas_conversations')
        .select('id, role, content, created_at, session_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data: history } = await query;

      if (history) {
        const messages: ConversationMessage[] = history.reverse().map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime(),
          sessionId: msg.session_id,
        }));

        set(state => ({
          context: {
            ...state.context,
            recentMessages: messages,
            lastInteraction: messages[messages.length - 1]?.timestamp || null,
          },
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('[MemoryManager] Failed to load from database:', error);
      set({ isLoading: false });
    }
  },

  clearMemory: () => {
    set({
      context: {
        recentMessages: [],
        sessionSummary: null,
        userPreferences: {},
        activeTopics: [],
        lastInteraction: null,
      },
      sessionId: generateSessionId(),
    });
  },

  setUserPreference: (key, value) => {
    set(state => ({
      context: {
        ...state.context,
        userPreferences: {
          ...state.context.userPreferences,
          [key]: value,
        },
      },
    }));
  },

  addActiveTopic: (topic) => {
    set(state => ({
      context: {
        ...state.context,
        activeTopics: [...new Set([...state.context.activeTopics, topic])].slice(-10),
      },
    }));
  },

  removeActiveTopic: (topic) => {
    set(state => ({
      context: {
        ...state.context,
        activeTopics: state.context.activeTopics.filter(t => t !== topic),
      },
    }));
  },
}));

// Utility function to format context for AI prompts
export function formatContextForPrompt(context: MemoryContext, maxTokens = 2000): string {
  const parts: string[] = [];

  if (context.sessionSummary) {
    parts.push(`Previous context: ${context.sessionSummary}`);
  }

  if (context.activeTopics.length > 0) {
    parts.push(`Active topics: ${context.activeTopics.join(', ')}`);
  }

  const recentMessages = context.recentMessages.slice(-15);
  if (recentMessages.length > 0) {
    parts.push('Recent conversation:');
    for (const msg of recentMessages) {
      const role = msg.role === 'user' ? 'User' : 'Atlas';
      parts.push(`${role}: ${msg.content}`);
    }
  }

  let result = parts.join('\n');
  
  // Simple token estimation (rough: 4 chars per token)
  if (result.length > maxTokens * 4) {
    result = result.slice(-(maxTokens * 4));
  }

  return result;
}
