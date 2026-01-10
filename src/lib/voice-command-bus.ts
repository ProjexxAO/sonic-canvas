/**
 * Voice Command Bus - Event-driven voice command handling system
 * Enables decoupled communication between Atlas voice agent and UI components
 */

export type VoiceCommandType =
  | 'navigate'
  | 'search'
  | 'action'
  | 'query'
  | 'control'
  | 'data'
  | 'workflow'
  | 'notification'
  | 'settings';

export interface VoiceCommand {
  id: string;
  type: VoiceCommandType;
  intent: string;
  payload: Record<string, unknown>;
  confidence: number;
  timestamp: number;
  source: 'voice' | 'text' | 'system';
  sessionId?: string;
}

export interface VoiceCommandResult {
  commandId: string;
  success: boolean;
  message?: string;
  data?: unknown;
  executionTime: number;
}

type CommandHandler = (command: VoiceCommand) => Promise<VoiceCommandResult> | VoiceCommandResult;
type CommandListener = (command: VoiceCommand, result?: VoiceCommandResult) => void;

interface CommandSubscription {
  id: string;
  type: VoiceCommandType | '*';
  handler: CommandHandler;
  priority: number;
}

interface EventSubscription {
  id: string;
  event: 'command:received' | 'command:executed' | 'command:failed' | 'command:queued';
  listener: CommandListener;
}

class VoiceCommandBus {
  private handlers: CommandSubscription[] = [];
  private listeners: EventSubscription[] = [];
  private commandQueue: VoiceCommand[] = [];
  private isProcessing = false;
  private commandHistory: VoiceCommand[] = [];
  private maxHistorySize = 100;

  /**
   * Register a command handler for a specific command type
   */
  registerHandler(
    type: VoiceCommandType | '*',
    handler: CommandHandler,
    priority: number = 0
  ): () => void {
    const id = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.handlers.push({ id, type, handler, priority });
    this.handlers.sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => {
      this.handlers = this.handlers.filter(h => h.id !== id);
    };
  }

  /**
   * Subscribe to command events
   */
  on(
    event: 'command:received' | 'command:executed' | 'command:failed' | 'command:queued',
    listener: CommandListener
  ): () => void {
    const id = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.listeners.push({ id, event, listener });

    return () => {
      this.listeners = this.listeners.filter(l => l.id !== id);
    };
  }

  /**
   * Emit a command event
   */
  private emit(
    event: 'command:received' | 'command:executed' | 'command:failed' | 'command:queued',
    command: VoiceCommand,
    result?: VoiceCommandResult
  ): void {
    this.listeners
      .filter(l => l.event === event)
      .forEach(l => {
        try {
          l.listener(command, result);
        } catch (error) {
          console.error(`[VoiceCommandBus] Listener error:`, error);
        }
      });
  }

  /**
   * Dispatch a voice command for execution
   */
  async dispatch(command: VoiceCommand): Promise<VoiceCommandResult> {
    this.emit('command:received', command);
    this.addToHistory(command);

    const startTime = performance.now();

    // Find matching handlers
    const matchingHandlers = this.handlers.filter(
      h => h.type === '*' || h.type === command.type
    );

    if (matchingHandlers.length === 0) {
      const result: VoiceCommandResult = {
        commandId: command.id,
        success: false,
        message: `No handler registered for command type: ${command.type}`,
        executionTime: performance.now() - startTime,
      };
      this.emit('command:failed', command, result);
      return result;
    }

    // Execute handlers in priority order
    for (const subscription of matchingHandlers) {
      try {
        const result = await subscription.handler(command);
        result.executionTime = performance.now() - startTime;
        
        if (result.success) {
          this.emit('command:executed', command, result);
          return result;
        }
      } catch (error) {
        console.error(`[VoiceCommandBus] Handler error:`, error);
      }
    }

    const failedResult: VoiceCommandResult = {
      commandId: command.id,
      success: false,
      message: 'All handlers failed to process command',
      executionTime: performance.now() - startTime,
    };
    
    this.emit('command:failed', command, failedResult);
    return failedResult;
  }

  /**
   * Queue a command for sequential processing
   */
  queue(command: VoiceCommand): void {
    this.commandQueue.push(command);
    this.emit('command:queued', command);
    this.processQueue();
  }

  /**
   * Process queued commands sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.commandQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.commandQueue.length > 0) {
      const command = this.commandQueue.shift();
      if (command) {
        await this.dispatch(command);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Create a command object
   */
  createCommand(
    type: VoiceCommandType,
    intent: string,
    payload: Record<string, unknown> = {},
    options: Partial<Pick<VoiceCommand, 'confidence' | 'source' | 'sessionId'>> = {}
  ): VoiceCommand {
    return {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      intent,
      payload,
      confidence: options.confidence ?? 1.0,
      timestamp: Date.now(),
      source: options.source ?? 'system',
      sessionId: options.sessionId,
    };
  }

  /**
   * Add command to history
   */
  private addToHistory(command: VoiceCommand): void {
    this.commandHistory.unshift(command);
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get command history
   */
  getHistory(limit?: number): VoiceCommand[] {
    return limit ? this.commandHistory.slice(0, limit) : [...this.commandHistory];
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.commandHistory = [];
  }

  /**
   * Get pending queue size
   */
  getQueueSize(): number {
    return this.commandQueue.length;
  }

  /**
   * Clear all handlers and listeners
   */
  reset(): void {
    this.handlers = [];
    this.listeners = [];
    this.commandQueue = [];
    this.isProcessing = false;
  }
}

// Singleton instance
export const voiceCommandBus = new VoiceCommandBus();

// Convenience exports
export const registerVoiceHandler = voiceCommandBus.registerHandler.bind(voiceCommandBus);
export const dispatchVoiceCommand = voiceCommandBus.dispatch.bind(voiceCommandBus);
export const createVoiceCommand = voiceCommandBus.createCommand.bind(voiceCommandBus);
export const onVoiceCommand = voiceCommandBus.on.bind(voiceCommandBus);
