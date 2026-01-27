/**
 * Atlas Orchestrator - Shared Utilities
 *
 * Common utility functions used across handler modules
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.88.0";
import type { AIGatewayMessage, AIGatewayResponse, HandlerResult } from "./types.ts";

// ============================================================================
// Conversation Context
// ============================================================================

export async function getConversationContext(
  supabase: SupabaseClient,
  userId: string,
  sessionId?: string,
  limit: number = 20
): Promise<string> {
  try {
    let query = supabase
      .from('atlas_conversations')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: history, error } = await query;

    if (error || !history || history.length === 0) {
      return '';
    }

    const formattedHistory = history
      .reverse()
      .map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'User' : 'Atlas'}: ${m.content}`
      )
      .join('\n');

    return `\n\n=== Recent Conversation History ===\n${formattedHistory}\n=== End History ===\n`;
  } catch (e) {
    console.error('Error fetching conversation context:', e);
    return '';
  }
}

// ============================================================================
// AI Gateway
// ============================================================================

export async function callAIGateway(
  lovableApiKey: string,
  messages: AIGatewayMessage[],
  maxRetries = 2
): Promise<AIGatewayResponse> {
  let lastError = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const response = aiData?.choices?.[0]?.message?.content ?? '';
        return { status: 200, body: { response } };
      }

      if (aiResponse.status === 429) {
        return { status: 429, body: { error: 'Rate limit exceeded. Please try again later.' } };
      }
      if (aiResponse.status === 402) {
        return { status: 402, body: { error: 'Usage credits exhausted. Please add credits.' } };
      }

      lastError = await aiResponse.text();
      console.error(`AI gateway error (attempt ${attempt + 1}/${maxRetries + 1}):`, aiResponse.status, lastError.substring(0, 200));

      if (attempt < maxRetries && aiResponse.status >= 500) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    } catch (fetchError) {
      lastError = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error(`AI gateway fetch error (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError);

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  return { status: 500, body: { error: 'AI gateway temporarily unavailable. Please try again.' } };
}

// ============================================================================
// Response Helpers
// ============================================================================

export function successResponse(data: Record<string, unknown>): HandlerResult {
  return { status: 200, body: data };
}

export function errorResponse(message: string, status: number = 400): HandlerResult {
  return { status, body: { error: message } };
}

export function notFoundResponse(message: string = 'Not found'): HandlerResult {
  return { status: 404, body: { error: message } };
}

export function unauthorizedResponse(message: string = 'Unauthorized'): HandlerResult {
  return { status: 401, body: { error: message } };
}

export function forbiddenResponse(message: string = 'Forbidden'): HandlerResult {
  return { status: 403, body: { error: message } };
}

// ============================================================================
// Validation Helpers
// ============================================================================

export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function filterValidUUIDs(arr: unknown[]): string[] {
  return arr.filter((item): item is string =>
    typeof item === 'string' && isValidUUID(item)
  );
}

export function requireUserId(userId: string | null): string {
  if (!userId) {
    throw new Error('userId is required');
  }
  return userId;
}

// ============================================================================
// Data Helpers
// ============================================================================

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function parseJSONFromResponse<T>(content: string): T | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    console.error('Failed to parse JSON from response:', e);
    return null;
  }
}

export function parseJSONArrayFromResponse<T>(content: string): T[] {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (e) {
    console.error('Failed to parse JSON array from response:', e);
    return [];
  }
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function nowISO(): string {
  return new Date().toISOString();
}

// ============================================================================
// Dashboard Helpers
// ============================================================================

export async function resolveDashboardId(
  supabase: SupabaseClient,
  userId: string,
  dashboardName?: string
): Promise<string | null> {
  if (dashboardName) {
    const { data } = await supabase
      .from('shared_dashboards')
      .select('id')
      .ilike('name', `%${dashboardName}%`)
      .limit(1);
    return data?.[0]?.id || null;
  }

  const { data: memberData } = await supabase
    .from('shared_dashboard_members')
    .select('dashboard_id')
    .eq('user_id', userId)
    .limit(1);
  return memberData?.[0]?.dashboard_id || null;
}

export async function enrichWithProfiles<T extends { user_id: string }>(
  supabase: SupabaseClient,
  items: T[],
  userIdField: keyof T = 'user_id' as keyof T
): Promise<(T & { display_name: string; avatar_url?: string })[]> {
  const userIds = [...new Set(items.map(item => item[userIdField] as string))];

  if (userIds.length === 0) {
    return items.map(item => ({ ...item, display_name: 'Unknown' }));
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map(
    profiles?.map(p => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }]) || []
  );

  return items.map(item => ({
    ...item,
    display_name: profileMap.get(item[userIdField] as string)?.display_name || 'Unknown',
    avatar_url: profileMap.get(item[userIdField] as string)?.avatar_url,
  }));
}
