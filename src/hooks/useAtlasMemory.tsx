import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MemoryMessage {
  id: string;
  user_id: string;
  agent_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MemorySummary {
  id: string;
  user_id: string;
  agent_id: string;
  summary: string;
  message_count: number | null;
  updated_at: string;
}

export interface AtlasMemoryState {
  messages: MemoryMessage[];
  summary: MemorySummary | null;
  contextString: string;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  lastLoadedAt: Date | null;
}

interface UseAtlasMemoryOptions {
  userId: string | undefined;
  agentId?: string;
  autoLoad?: boolean;
  messageLimit?: number;
}

/**
 * Hook for instant retrieval of user's long-term memory when Atlas initializes.
 * Fetches messages and summaries immediately on mount for seamless context injection.
 */
export function useAtlasMemory({
  userId,
  agentId = 'atlas_voice',
  autoLoad = true,
  messageLimit = 20
}: UseAtlasMemoryOptions) {
  const [state, setState] = useState<AtlasMemoryState>({
    messages: [],
    summary: null,
    contextString: '',
    isLoading: false,
    isLoaded: false,
    error: null,
    lastLoadedAt: null
  });

  const loadingRef = useRef(false);
  const userIdRef = useRef(userId);

  // Build context string from messages and summary
  const buildContextString = useCallback((messages: MemoryMessage[], summary: MemorySummary | null): string => {
    let context = '';

    if (summary?.summary) {
      context += `Previous conversation summary: ${summary.summary}\n\n`;
    }

    if (messages.length > 0) {
      context += 'Recent conversation:\n';
      messages.forEach(msg => {
        const roleName = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Atlas' : 'System';
        context += `${roleName}: ${msg.content}\n`;
      });
    }

    return context.trim();
  }, []);

  // Core load function - fetches messages and summary in parallel
  const loadMemory = useCallback(async () => {
    if (!userId || loadingRef.current) return;

    loadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    console.log('[AtlasMemory] Loading memory for user:', userId);

    try {
      // Fetch messages and summary in parallel for instant retrieval
      const [messagesResult, summaryResult] = await Promise.all([
        supabase
          .from('user_memory_messages')
          .select('*')
          .eq('user_id', userId)
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
          .limit(messageLimit),
        supabase
          .from('user_memory_summaries')
          .select('*')
          .eq('user_id', userId)
          .eq('agent_id', agentId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ]);

      if (messagesResult.error) {
        throw new Error(`Failed to fetch messages: ${messagesResult.error.message}`);
      }

      // Reverse to get chronological order (oldest first)
      const messages = ((messagesResult.data || []) as MemoryMessage[]).reverse();
      const summary = summaryResult.data as MemorySummary | null;

      const contextString = buildContextString(messages, summary);

      console.log('[AtlasMemory] Loaded:', {
        messageCount: messages.length,
        hasSummary: !!summary,
        contextLength: contextString.length
      });

      setState({
        messages,
        summary,
        contextString,
        isLoading: false,
        isLoaded: true,
        error: null,
        lastLoadedAt: new Date()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load memory';
      console.error('[AtlasMemory] Load error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [userId, agentId, messageLimit, buildContextString]);

  // Store a new message
  const storeMessage = useCallback(async (
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_memory_messages')
        .insert({
          user_id: userId,
          agent_id: agentId,
          role,
          content,
          metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately
      setState(prev => {
        const newMessages = [...prev.messages, data as MemoryMessage];
        return {
          ...prev,
          messages: newMessages,
          contextString: buildContextString(newMessages, prev.summary)
        };
      });

      console.log('[AtlasMemory] Stored message:', role, content.substring(0, 50) + '...');
    } catch (error) {
      console.error('[AtlasMemory] Failed to store message:', error);
    }
  }, [userId, agentId, buildContextString]);

  // Refresh memory (force reload)
  const refreshMemory = useCallback(async () => {
    loadingRef.current = false; // Allow reload
    await loadMemory();
  }, [loadMemory]);

  // Clear local memory state
  const clearLocalMemory = useCallback(() => {
    setState({
      messages: [],
      summary: null,
      contextString: '',
      isLoading: false,
      isLoaded: false,
      error: null,
      lastLoadedAt: null
    });
  }, []);

  // Auto-load on mount or when userId changes
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!autoLoad || !userId) return;

    // Only load once per userId
    if (userIdRef.current !== userId) {
      userIdRef.current = userId;
      hasLoadedRef.current = false;
    }
    
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadMemory();
    }
  }, [userId, autoLoad, loadMemory]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`memory_${userId}_${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_memory_messages',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newMessage = payload.new as MemoryMessage;
          // Only add if not already in state (avoid duplicates from storeMessage)
          setState(prev => {
            if (prev.messages.some(m => m.id === newMessage.id)) {
              return prev;
            }
            const newMessages = [...prev.messages, newMessage];
            return {
              ...prev,
              messages: newMessages,
              contextString: buildContextString(newMessages, prev.summary)
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, agentId, buildContextString]);

  // Memoize return value to prevent infinite loops in consumers
  return useMemo(() => ({
    ...state,
    loadMemory,
    refreshMemory,
    storeMessage,
    clearLocalMemory
  }), [state, loadMemory, refreshMemory, storeMessage, clearLocalMemory]);
}
