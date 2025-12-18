import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface UseAtlasConversationsProps {
  userId: string | undefined;
}

export function useAtlasConversations({ userId }: UseAtlasConversationsProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveQueueRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const isSavingRef = useRef(false);

  // Load recent conversation history on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        // Get the most recent session or create a new one
        const { data: recentMessages, error } = await supabase
          .from('atlas_conversations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (recentMessages && recentMessages.length > 0) {
          // Use the most recent session
          const lastSessionId = recentMessages[0].session_id;
          setSessionId(lastSessionId);
          
          // Get messages from this session
          const sessionMessages = recentMessages
            .filter(m => m.session_id === lastSessionId)
            .reverse()
            .map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              created_at: m.created_at
            }));
          
          setMessages(sessionMessages);
        } else {
          // Start a new session
          setSessionId(crypto.randomUUID());
        }
      } catch (error) {
        console.error('[Atlas] Failed to load conversation history:', error);
        setSessionId(crypto.randomUUID());
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [userId]);

  // Process save queue
  const processSaveQueue = useCallback(async () => {
    if (!userId || !sessionId || isSavingRef.current || saveQueueRef.current.length === 0) {
      return;
    }

    isSavingRef.current = true;
    const itemsToSave = [...saveQueueRef.current];
    saveQueueRef.current = [];

    try {
      const inserts = itemsToSave.map(item => ({
        user_id: userId,
        session_id: sessionId,
        role: item.role,
        content: item.content
      }));

      const { data, error } = await supabase
        .from('atlas_conversations')
        .insert(inserts)
        .select();

      if (error) throw error;

      // Add to local state
      if (data) {
        const newMessages = data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          created_at: m.created_at
        }));
        setMessages(prev => [...prev, ...newMessages]);
      }
    } catch (error) {
      console.error('[Atlas] Failed to save message:', error);
      // Re-add failed items to queue
      saveQueueRef.current = [...itemsToSave, ...saveQueueRef.current];
    } finally {
      isSavingRef.current = false;
      // Check if more items were added while saving
      if (saveQueueRef.current.length > 0) {
        processSaveQueue();
      }
    }
  }, [userId, sessionId]);

  // Save a message to the conversation
  const saveMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    if (!userId || !sessionId || !content.trim()) return;

    saveQueueRef.current.push({ role, content: content.trim() });
    processSaveQueue();
  }, [userId, sessionId, processSaveQueue]);

  // Start a new session
  const startNewSession = useCallback(() => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setMessages([]);
    console.log('[Atlas] Started new conversation session:', newSessionId);
  }, []);

  // Clear all history for the user
  const clearHistory = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('atlas_conversations')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setMessages([]);
      startNewSession();
    } catch (error) {
      console.error('[Atlas] Failed to clear history:', error);
    }
  }, [userId, startNewSession]);

  return {
    messages,
    sessionId,
    isLoading,
    saveMessage,
    startNewSession,
    clearHistory
  };
}
