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

export class MemoryManager {
  private userId: string;
  private agentId: string;

  constructor(userId: string, agentId: string = 'atlas_voice') {
    this.userId = userId;
    this.agentId = agentId;
  }

  /**
   * Store a new message
   */
  async storeMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      await supabase.from('user_memory_messages').insert({
        user_id: this.userId,
        agent_id: this.agentId,
        role,
        content,
        metadata
      });
    } catch (error) {
      console.error('Failed to store message:', error);
    }
  }

  /**
   * Get recent conversation history
   */
  async getRecentMessages(limit: number = 20): Promise<MemoryMessage[]> {
    try {
      const { data, error } = await supabase
        .from('user_memory_messages')
        .select('*')
        .eq('user_id', this.userId)
        .eq('agent_id', this.agentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).reverse() as MemoryMessage[]; // Oldest first for context
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }
  }

  /**
   * Get conversation summary
   */
  async getSummary(): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_memory_summaries')
        .select('summary')
        .eq('user_id', this.userId)
        .eq('agent_id', this.agentId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found"
      return data?.summary || null;
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      return null;
    }
  }

  /**
   * Build context string for ElevenLabs
   */
  async buildContext(): Promise<string> {
    const messages = await this.getRecentMessages(10);
    const summary = await this.getSummary();

    let context = '';

    if (summary) {
      context += `Previous conversation summary: ${summary}\n\n`;
    }

    if (messages.length > 0) {
      context += 'Recent conversation:\n';
      messages.forEach(msg => {
        context += `${msg.role}: ${msg.content}\n`;
      });
    }

    return context.trim();
  }
}

// Factory function
export function createMemoryManager(userId: string): MemoryManager {
  return new MemoryManager(userId);
}
