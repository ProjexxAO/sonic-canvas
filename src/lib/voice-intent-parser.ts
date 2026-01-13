import { VoiceCommand } from './voice-command-bus';

interface ParsedIntent {
  command: VoiceCommand;
  confidence: number;
  original: string;
}

export class VoiceIntentParser {
  
  // Route mapping for your Lovable app
  private routeMap: Record<string, string> = {
    'dashboard': '/',
    'home': '/',
    'atlas': '/atlas',
    'agents': '/',
    'sonic nodes': '/',
    'import': '/import',
    'import agents': '/import',
    'settings': '/settings',
    'profile': '/profile',
    'integrations': '/integrations',
    'marketplace': '/integrations',
    'tool governance': '/tool-governance',
    'governance': '/tool-governance',
    'permissions': '/user-tool-permissions',
    'user permissions': '/user-tool-permissions',
  };

  parse(text: string): ParsedIntent | null {
    const normalized = text.toLowerCase().trim();

    // Navigation commands
    const navPatterns = [
      /(?:show me|open|go to|navigate to|take me to)\s+(?:the\s+)?(.+?)(?:\s+page)?$/i,
      /(?:show|display)\s+(?:the\s+)?(.+?)$/i,
    ];

    for (const pattern of navPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const target = match[1].trim();
        
        // Find matching route
        for (const [key, path] of Object.entries(this.routeMap)) {
          if (target.includes(key)) {
            return {
              command: { type: 'navigate', path },
              confidence: 0.9,
              original: text
            };
          }
        }
      }
    }

    // Filter commands
    const filterPattern = /(?:filter|show only|find)\s+(.+?)\s+(?:by|where|with)\s+(.+)/i;
    const filterMatch = normalized.match(filterPattern);
    if (filterMatch) {
      return {
        command: {
          type: 'filter',
          entity: filterMatch[1].trim(),
          criteria: { query: filterMatch[2].trim() }
        },
        confidence: 0.8,
        original: text
      };
    }

    return null;
  }
}

// Singleton
export const voiceIntentParser = new VoiceIntentParser();
