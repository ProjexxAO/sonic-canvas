/**
 * Atlas Orchestrator - Communications Handlers
 * 
 * Handles email drafting and sending via Atlas AI
 */

import type { HandlerContext, HandlerResult, OrchestratorRequest } from "../types.ts";
import { successResponse, errorResponse, callAIGateway, getConversationContext } from "../utils.ts";

interface DraftMessageRequest extends OrchestratorRequest {
  context: string;
  replyTo?: {
    content: string;
    from?: string;
    subject?: string;
  };
  platform?: string;
  toAddresses?: string[];
  channelId?: string;
}

interface SendMessageRequest extends OrchestratorRequest {
  content: string;
  subject?: string;
  toAddresses?: string[];
  platform?: string;
  channelId?: string;
  isDraft?: boolean;
}

/**
 * Draft a message using Atlas AI
 */
export async function draftMessage(ctx: HandlerContext, req: OrchestratorRequest): Promise<HandlerResult> {
  const { context, replyTo, platform, toAddresses } = req as DraftMessageRequest;

  if (!context) {
    return errorResponse('context is required for drafting a message');
  }

  // Get conversation context for personalization
  const conversationContext = await getConversationContext(
    ctx.supabase, 
    ctx.userId!, 
    ctx.sessionId, 
    10
  );

  // Build the prompt for AI
  const systemPrompt = `You are Atlas, an intelligent AI assistant helping draft professional communications.
You write clear, concise, and contextually appropriate messages.
Match the tone to the platform and context provided.`;

  let userPrompt = `Draft a professional message based on this context: "${context}"`;
  
  if (replyTo) {
    userPrompt += `\n\nThis is a reply to:\nFrom: ${replyTo.from || 'Unknown'}\nSubject: ${replyTo.subject || 'No subject'}\nContent: ${replyTo.content}`;
  }

  if (platform && platform !== 'internal') {
    userPrompt += `\n\nPlatform: ${platform} (adjust tone accordingly)`;
  }

  if (conversationContext) {
    userPrompt += `\n\nRecent conversation context:\n${conversationContext}`;
  }

  userPrompt += `\n\nProvide the draft in a natural, professional tone. Also suggest 2-3 alternative phrasings as bullet points after the main draft.`;

  try {
    const aiResult = await callAIGateway(ctx.lovableApiKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    if (aiResult.status !== 200) {
      return { status: aiResult.status, body: aiResult.body };
    }

    const response = aiResult.body.response || '';
    
    // Parse the response to extract draft and suggestions
    const lines = response.split('\n');
    let draft = '';
    const suggestions: string[] = [];
    let inSuggestions = false;

    for (const line of lines) {
      if (line.match(/^[-•*]\s+/)) {
        inSuggestions = true;
        suggestions.push(line.replace(/^[-•*]\s+/, '').trim());
      } else if (!inSuggestions) {
        draft += line + '\n';
      }
    }

    draft = draft.trim();

    // Store the draft in the database
    const { data: message, error } = await ctx.supabase
      .from('communication_messages')
      .insert({
        user_id: ctx.userId,
        content: draft,
        platform: platform || 'internal',
        status: 'draft',
        drafted_by_atlas: true,
        to_addresses: toAddresses || null,
        atlas_draft_context: {
          original_context: context,
          reply_to: replyTo,
          suggestions,
          generated_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving draft:', error);
      // Still return the draft even if save fails
    }

    return successResponse({
      draft,
      suggestions,
      messageId: message?.id,
      context: {
        platform,
        toAddresses,
        replyTo: replyTo?.subject,
      },
    });
  } catch (error) {
    console.error('Error drafting message:', error);
    return errorResponse('Failed to generate message draft', 500);
  }
}

/**
 * Send a message (or save as pending approval)
 */
export async function sendMessage(ctx: HandlerContext, req: OrchestratorRequest): Promise<HandlerResult> {
  const { content, subject, toAddresses, platform, channelId, isDraft } = req as SendMessageRequest;

  if (!content) {
    return errorResponse('content is required for sending a message');
  }

  const status = isDraft ? 'pending_approval' : 'sent';
  const sentAt = isDraft ? null : new Date().toISOString();

  try {
    const { data: message, error } = await ctx.supabase
      .from('communication_messages')
      .insert({
        user_id: ctx.userId,
        content,
        subject: subject || null,
        platform: platform || 'internal',
        channel_id: channelId || null,
        to_addresses: toAddresses || null,
        status,
        drafted_by_atlas: isDraft || false,
        sent_at: sentAt,
        is_incoming: false,
      })
      .select()
      .single();

    if (error) throw error;

    // If actually sending (not draft), create a notification
    if (!isDraft) {
      await ctx.supabase.from('agent_notifications').insert({
        user_id: ctx.userId,
        title: 'Message Sent',
        message: `Atlas sent your message${toAddresses?.length ? ` to ${toAddresses.join(', ')}` : ''}`,
        notification_type: 'communication',
        priority: 'low',
        source_agent_name: 'Atlas',
        metadata: { message_id: message.id, platform },
      });
    }

    return successResponse({
      success: true,
      messageId: message.id,
      status,
      sentAt,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return errorResponse('Failed to send message', 500);
  }
}

/**
 * Approve and send a pending Atlas draft
 */
export async function approveDraft(ctx: HandlerContext, req: OrchestratorRequest): Promise<HandlerResult> {
  const { messageId } = req as OrchestratorRequest & { messageId: string };

  if (!messageId) {
    return errorResponse('messageId is required');
  }

  try {
    const { data: message, error } = await ctx.supabase
      .from('communication_messages')
      .update({
        status: 'sent',
        approved_at: new Date().toISOString(),
        approved_by: ctx.userId,
        sent_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('user_id', ctx.userId)
      .select()
      .single();

    if (error) throw error;

    // Notify about approval
    await ctx.supabase.from('agent_notifications').insert({
      user_id: ctx.userId,
      title: 'Draft Approved & Sent',
      message: 'Your Atlas-drafted message has been approved and sent.',
      notification_type: 'communication',
      priority: 'low',
      source_agent_name: 'Atlas',
      metadata: { message_id: messageId },
    });

    return successResponse({
      success: true,
      messageId: message.id,
      sentAt: message.sent_at,
    });
  } catch (error) {
    console.error('Error approving draft:', error);
    return errorResponse('Failed to approve draft', 500);
  }
}

/**
 * Quick compose - Atlas drafts and user reviews before sending
 */
export async function composeEmail(ctx: HandlerContext, req: OrchestratorRequest): Promise<HandlerResult> {
  const { to, subject, intent, urgency } = req as OrchestratorRequest & {
    to: string;
    subject?: string;
    intent: string;
    urgency?: 'low' | 'normal' | 'high';
  };

  if (!to || !intent) {
    return errorResponse('to and intent are required for composing email');
  }

  const systemPrompt = `You are Atlas, composing a professional email.
Urgency level: ${urgency || 'normal'}
Write a complete email with appropriate greeting and sign-off.`;

  const userPrompt = `Compose an email to: ${to}
Subject: ${subject || 'Generate an appropriate subject'}
Intent/Purpose: ${intent}

Provide:
1. A subject line (if not given)
2. The complete email body`;

  try {
    const aiResult = await callAIGateway(ctx.lovableApiKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    if (aiResult.status !== 200) {
      return { status: aiResult.status, body: aiResult.body };
    }

    const response = aiResult.body.response || '';
    
    // Extract subject from response if not provided
    let finalSubject = subject;
    let body = response;
    
    const subjectMatch = response.match(/Subject:\s*(.+?)(?:\n|$)/i);
    if (subjectMatch && !subject) {
      finalSubject = subjectMatch[1].trim();
      body = response.replace(/Subject:\s*.+?\n/i, '').trim();
    }

    // Save as draft pending approval
    const { data: message, error } = await ctx.supabase
      .from('communication_messages')
      .insert({
        user_id: ctx.userId,
        content: body,
        subject: finalSubject,
        platform: 'gmail',
        to_addresses: [to],
        status: 'pending_approval',
        drafted_by_atlas: true,
        atlas_draft_context: {
          intent,
          urgency,
          generated_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse({
      messageId: message.id,
      subject: finalSubject,
      body,
      to,
      status: 'pending_approval',
      requiresApproval: true,
    });
  } catch (error) {
    console.error('Error composing email:', error);
    return errorResponse('Failed to compose email', 500);
  }
}
