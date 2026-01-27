/**
 * Atlas Orchestrator - Conversation Memory Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse, getConversationContext, callAIGateway } from "../utils.ts";

export async function getConversationHistory(ctx: HandlerContext, req: OrchestratorRequest): Promise<HandlerResult> {
  const { limit = 50 } = req as OrchestratorRequest & { limit?: number };

  let query = ctx.supabase
    .from('atlas_conversations')
    .select('id, role, content, created_at, session_id')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (ctx.sessionId) query = query.eq('session_id', ctx.sessionId);

  const { data, error } = await query;

  if (error) throw error;

  return successResponse({ history: data || [] });
}

export async function chat(ctx: HandlerContext, req: OrchestratorRequest): Promise<HandlerResult> {
  const { query } = req;

  if (!query) return errorResponse('query is required for chat');

  const conversationContext = await getConversationContext(ctx.supabase, ctx.userId!, ctx.sessionId, 30);

  const chatPrompt = `You are Atlas, an intelligent AI orchestrator and assistant.
Use the conversation history below to maintain context.
${conversationContext}

Current user message: ${query}

Respond naturally and helpfully.`;

  const aiResult = await callAIGateway(ctx.lovableApiKey, [
    { role: 'system', content: 'You are Atlas, an expert AI assistant with memory of past conversations.' },
    { role: 'user', content: chatPrompt },
  ]);

  if (aiResult.status !== 200) return { status: aiResult.status, body: aiResult.body };

  return successResponse({ response: aiResult.body.response, hasContext: conversationContext.length > 0 });
}
