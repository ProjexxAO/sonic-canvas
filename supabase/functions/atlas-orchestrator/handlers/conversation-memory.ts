/**
 * Atlas Orchestrator - Conversation Handlers
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse, getConversationContext, callAIGateway } from "../utils.ts";

export async function getConversationHistory(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const limit = (req as any).limit || 50;

  let query = ctx.supabase
    .from('atlas_conversations')
    .select('id, role, content, created_at, session_id')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (ctx.sessionId) {
    query = query.eq('session_id', ctx.sessionId);
  }

  const { data, error } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return successResponse({ history: data || [] });
}

export async function chat(
  ctx: HandlerContext,
  req: OrchestratorRequest
): Promise<HandlerResult> {
  const conversationContext = await getConversationContext(
    ctx.supabase,
    ctx.userId!,
    ctx.sessionId,
    30
  );

  const chatPrompt = `You are Atlas, an intelligent AI orchestrator and assistant. You help users manage their agents, search for information, analyze data, and automate tasks.

Use the conversation history below to maintain context and provide helpful, personalized responses. Reference past conversations when relevant to show continuity.
${conversationContext}

Current user message: ${req.query}

Respond naturally and helpfully. If the user references something from a previous conversation, acknowledge it. Be concise but thorough.`;

  const aiResult = await callAIGateway(ctx.lovableApiKey, [
    { role: 'system', content: 'You are Atlas, an expert AI assistant with memory of past conversations. Be helpful, concise, and personalized.' },
    { role: 'user', content: chatPrompt },
  ]);

  if (aiResult.status !== 200) {
    return { status: aiResult.status, body: aiResult.body };
  }

  return successResponse({
    response: aiResult.body.response,
    hasContext: conversationContext.length > 0
  });
}
