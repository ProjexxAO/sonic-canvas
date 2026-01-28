/**
 * Shared Service Logger
 * Centralized logging for all edge functions
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class ServiceLogger {
  private supabase: SupabaseClient;
  private requestId: string;
  private userId: string | null;
  private orgId: string | null;
  private service: string;
  private minLevel: LogLevel;

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(
    supabase: SupabaseClient,
    requestId: string,
    userId: string | null,
    orgId: string | null,
    service: string,
    minLevel: LogLevel = 'info'
  ) {
    this.supabase = supabase;
    this.requestId = requestId;
    this.userId = userId;
    this.orgId = orgId;
    this.service = service;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private async log(level: LogLevel, message: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      level,
      message,
      service: this.service,
      request_id: this.requestId,
      user_id: this.userId,
      org_id: this.orgId,
      metadata: metadata ?? {},
      timestamp: new Date().toISOString(),
    };

    // Console output
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleMethod(`[${this.service}] [${level.toUpperCase()}] ${message}`, metadata ?? '');

    // Persist to database (non-blocking)
    this.supabase
      .from('service_logs')
      .insert(logEntry)
      .then(({ error }) => {
        if (error) console.error('Failed to persist log:', error);
      });
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log('debug', message, metadata);
  }

  async info(message: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log('info', message, metadata);
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log('warn', message, metadata);
  }

  async error(message: string, metadata?: Record<string, unknown>): Promise<void> {
    return this.log('error', message, metadata);
  }

  async metric(name: string, value: number, unit: string = 'ms'): Promise<void> {
    const metricEntry = {
      name,
      value,
      unit,
      service: this.service,
      request_id: this.requestId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
    };

    this.supabase
      .from('service_metrics')
      .insert(metricEntry)
      .then(({ error }) => {
        if (error) console.error('Failed to persist metric:', error);
      });
  }
}
