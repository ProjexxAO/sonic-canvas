// ServiceLogger - Structured logging for edge functions

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  requestId: string;
  userId: string | null;
  sessionId: string | null;
  service: string;
}

export class ServiceLogger {
  private supabase: SupabaseClient;
  private requestId: string;
  private userId: string | null;
  private sessionId: string | null;
  private service: string;
  private logBuffer: LogEntry[] = [];
  private flushThreshold = 10;

  constructor(
    supabase: SupabaseClient,
    requestId: string,
    userId: string | null = null,
    sessionId: string | null = null,
    service: string = 'edge-function'
  ) {
    this.supabase = supabase;
    this.requestId = requestId;
    this.userId = userId;
    this.sessionId = sessionId;
    this.service = service;
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const prefix = `[${this.service}:${this.requestId.slice(0, 8)}]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `${prefix} ${message}${contextStr}`;
  }

  async debug(message: string, context?: Record<string, unknown>): Promise<void> {
    console.log(this.formatMessage('debug', message, context));
  }

  async info(message: string, context?: Record<string, unknown>): Promise<void> {
    console.log(this.formatMessage('info', message, context));
  }

  async warn(message: string, context?: Record<string, unknown>): Promise<void> {
    console.warn(this.formatMessage('warn', message, context));
  }

  async error(message: string, context?: Record<string, unknown>): Promise<void> {
    console.error(this.formatMessage('error', message, context));
  }

  // Flush buffered logs (for future database logging if needed)
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    this.logBuffer = [];
  }
}
