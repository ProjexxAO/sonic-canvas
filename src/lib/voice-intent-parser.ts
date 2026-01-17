import { VoiceCommand } from './voice-command-bus';
import { getDomainKeyFromName, getTabFromName, getPersonaFromName } from '@/hooks/useDataHubController';

interface ParsedIntent {
  command: VoiceCommand;
  confidence: number;
  original: string;
}

export class VoiceIntentParser {
  
  // Comprehensive route mapping for all app pages
  private routeMap: Record<string, string> = {
    // Main pages
    'dashboard': '/atlas',
    'home': '/atlas',
    'main': '/atlas',
    'index': '/',
    'agents': '/',
    'sonic nodes': '/',
    'agent dashboard': '/atlas',
    // Atlas / Command Center
    'atlas': '/atlas',
    'command center': '/atlas',
    'voice': '/atlas',
    'voice control': '/atlas',
    'ai assistant': '/atlas',
    'data hub': '/atlas',
    'c-suite': '/atlas',
    'csuite': '/atlas',
    'executive dashboard': '/atlas',
    
    // Import
    'import': '/import',
    'import agents': '/import',
    'bulk import': '/import',
    'upload agents': '/import',
    
    // Governance & Permissions
    'governance': '/governance',
    'tool governance': '/governance',
    'agent governance': '/governance',
    'permissions': '/workspace/tools',
    'user permissions': '/workspace/tools',
    'tool permissions': '/workspace/tools',
    'workspace tools': '/workspace/tools',
    
    // Integrations / Marketplace
    'integrations': '/marketplace',
    'marketplace': '/marketplace',
    'connect': '/marketplace',
    'connections': '/marketplace',
    'apps': '/marketplace',
    
    // Auth
    'auth': '/auth',
    'login': '/auth',
    'sign in': '/auth',
    'sign up': '/auth',
    'register': '/auth',
    'authentication': '/auth',
  };

  // Sector keywords for agent filtering
  private sectorKeywords: Record<string, string> = {
    'finance': 'FINANCE',
    'financial': 'FINANCE',
    'legal': 'LEGAL',
    'operations': 'OPERATIONS',
    'ops': 'OPERATIONS',
    'technology': 'TECHNOLOGY',
    'tech': 'TECHNOLOGY',
    'analytics': 'ANALYTICS',
    'data': 'ANALYTICS',
    'research': 'RESEARCH',
    'communications': 'COMMUNICATIONS',
    'comms': 'COMMUNICATIONS',
  };

  parse(text: string): ParsedIntent | null {
    const normalized = text.toLowerCase().trim();

    // Try each parser in order of specificity
    return this.parseDataHubCommand(normalized, text)
        || this.parseThemeCommand(normalized, text)
        || this.parseAgentCommand(normalized, text)
        || this.parseReportCommand(normalized, text)
        || this.parseNavigationCommand(normalized, text)
        || this.parseFilterCommand(normalized, text)
        || this.parseSearchCommand(normalized, text)
        || this.parseDialogCommand(normalized, text)
        || this.parseRefreshCommand(normalized, text);
  }

  // Data Hub tab/domain/persona control
  private parseDataHubCommand(normalized: string, original: string): ParsedIntent | null {
    // Tab switching: "switch to insights tab", "show insights", "go to admin tab"
    const tabPatterns = [
      /(?:switch to|go to|show|open)\s+(?:the\s+)?(\w+)\s+tab/i,
      /(?:show me|display)\s+(?:the\s+)?(\w+)\s+(?:tab|section)/i,
    ];
    
    for (const pattern of tabPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const tab = getTabFromName(match[1]);
        if (tab) {
          return {
            command: { type: 'switch_tab', tab },
            confidence: 0.95,
            original
          };
        }
      }
    }

    // Domain expansion: "open financials", "expand documents domain", "show me tasks"
    const domainPatterns = [
      /(?:open|expand|show)\s+(?:the\s+)?(\w+)\s+(?:domain|section|area)/i,
      /(?:open|expand|show me|display)\s+(?:the\s+)?(\w+)$/i,
      /(?:let me see|view)\s+(?:the\s+)?(\w+)/i,
    ];
    
    for (const pattern of domainPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const domain = getDomainKeyFromName(match[1]);
        if (domain) {
          return {
            command: { type: 'expand_domain', domain },
            confidence: 0.9,
            original
          };
        }
      }
    }

    // Collapse domain: "close domain", "collapse", "go back"
    if (/(?:close|collapse|hide)\s+(?:the\s+)?(?:domain|section)|go back|back to hub/i.test(normalized)) {
      return {
        command: { type: 'collapse_domain' },
        confidence: 0.85,
        original
      };
    }

    // Persona switching: "switch to CFO view", "show me CEO dashboard", "change persona to CTO"
    const personaPatterns = [
      /(?:switch to|change to|show me|use)\s+(?:the\s+)?(\w+)\s+(?:view|dashboard|persona|mode)/i,
      /(?:be|act as|become)\s+(?:the\s+)?(\w+)/i,
      /(?:change|switch)\s+persona\s+to\s+(\w+)/i,
    ];
    
    for (const pattern of personaPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const persona = getPersonaFromName(match[1]);
        if (persona) {
          return {
            command: { type: 'switch_persona', persona },
            confidence: 0.9,
            original
          };
        }
      }
    }

    return null;
  }

  // Theme commands
  private parseThemeCommand(normalized: string, original: string): ParsedIntent | null {
    if (/(?:toggle|switch|change)\s+(?:the\s+)?theme/i.test(normalized)) {
      return {
        command: { type: 'toggle_theme' },
        confidence: 0.95,
        original
      };
    }

    if (/(?:use|switch to|enable|set)\s+(?:the\s+)?dark\s+(?:mode|theme)/i.test(normalized)) {
      return {
        command: { type: 'set_theme', theme: 'dark' },
        confidence: 0.95,
        original
      };
    }

    if (/(?:use|switch to|enable|set)\s+(?:the\s+)?light\s+(?:mode|theme)/i.test(normalized)) {
      return {
        command: { type: 'set_theme', theme: 'light' },
        confidence: 0.95,
        original
      };
    }

    return null;
  }

  // Agent filtering commands
  private parseAgentCommand(normalized: string, original: string): ParsedIntent | null {
    // Filter by sector: "show finance agents", "filter agents by legal"
    const sectorPattern = /(?:show|filter|display|find)\s+(?:me\s+)?(?:all\s+)?(\w+)\s+agents?/i;
    const sectorMatch = normalized.match(sectorPattern);
    if (sectorMatch) {
      const sectorKey = sectorMatch[1].toLowerCase();
      const sector = this.sectorKeywords[sectorKey];
      if (sector) {
        return {
          command: { type: 'filter_agents', sector },
          confidence: 0.9,
          original
        };
      }
    }

    // Filter by status: "show active agents", "display idle agents"
    const statusPattern = /(?:show|filter|display|find)\s+(?:me\s+)?(?:all\s+)?(active|idle|processing|standby)\s+agents?/i;
    const statusMatch = normalized.match(statusPattern);
    if (statusMatch) {
      return {
        command: { type: 'filter_agents', status: statusMatch[1].toUpperCase() },
        confidence: 0.9,
        original
      };
    }

    // Clear agent filters: "show all agents", "clear agent filters"
    if (/(?:show all agents|clear\s+(?:agent\s+)?filters|reset\s+(?:agent\s+)?filters)/i.test(normalized)) {
      return {
        command: { type: 'clear_filters' },
        confidence: 0.9,
        original
      };
    }

    return null;
  }

  // Report generation commands
  private parseReportCommand(normalized: string, original: string): ParsedIntent | null {
    // Generate report: "generate a report", "create CEO report", "run CFO analysis"
    const reportPatterns = [
      /(?:generate|create|run|make)\s+(?:a\s+)?(?:(\w+)\s+)?report/i,
      /(?:generate|create|run)\s+(?:a\s+)?(?:(\w+)\s+)?analysis/i,
    ];

    for (const pattern of reportPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const persona = match[1] ? getPersonaFromName(match[1]) : undefined;
        return {
          command: { type: 'generate_report', persona: persona || undefined },
          confidence: 0.9,
          original
        };
      }
    }

    // Run query: "run query about revenue", "analyze sales data"
    const queryPattern = /(?:run query|analyze|query)\s+(?:about\s+)?(.+)/i;
    const queryMatch = normalized.match(queryPattern);
    if (queryMatch) {
      return {
        command: { type: 'run_query', query: queryMatch[1] },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // Navigation commands
  private parseNavigationCommand(normalized: string, original: string): ParsedIntent | null {
    const navPatterns = [
      /(?:show me|open|go to|navigate to|take me to)\s+(?:the\s+)?(.+?)(?:\s+page)?$/i,
      /(?:show|display)\s+(?:the\s+)?(.+?)$/i,
    ];

    for (const pattern of navPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        const target = match[1].trim();
        
        // Sort routes by key length descending to prioritize more specific matches
        const sortedRoutes = Object.entries(this.routeMap).sort((a, b) => b[0].length - a[0].length);
        
        // Find matching route
        for (const [key, path] of sortedRoutes) {
          if (target.includes(key) || key.includes(target)) {
            return {
              command: { type: 'navigate', path },
              confidence: 0.9,
              original
            };
          }
        }
      }
    }

    return null;
  }

  // Filter commands
  private parseFilterCommand(normalized: string, original: string): ParsedIntent | null {
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
        original
      };
    }

    return null;
  }

  // Search commands
  private parseSearchCommand(normalized: string, original: string): ParsedIntent | null {
    const searchPattern = /(?:search|find|look for|lookup)\s+(?:for\s+)?(.+)/i;
    const searchMatch = normalized.match(searchPattern);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      // Determine scope based on keywords
      let scope: 'agents' | 'documents' | 'all' = 'all';
      if (/agents?/i.test(query)) scope = 'agents';
      if (/documents?|files?/i.test(query)) scope = 'documents';
      
      return {
        command: { type: 'search', query, scope },
        confidence: 0.85,
        original
      };
    }

    return null;
  }

  // Dialog commands
  private parseDialogCommand(normalized: string, original: string): ParsedIntent | null {
    if (/(?:create|add|new)\s+(?:an?\s+)?agent/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'create_agent' },
        confidence: 0.9,
        original
      };
    }

    if (/(?:import|upload)\s+agents?/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'import_agents' },
        confidence: 0.9,
        original
      };
    }

    if (/(?:connect|add)\s+(?:a\s+)?(?:new\s+)?platform/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'connect_platform' },
        confidence: 0.9,
        original
      };
    }

    if (/(?:create|add|new)\s+(?:a\s+)?channel/i.test(normalized)) {
      return {
        command: { type: 'open_dialog', dialog: 'create_channel' },
        confidence: 0.9,
        original
      };
    }

    return null;
  }

  // Refresh commands
  private parseRefreshCommand(normalized: string, original: string): ParsedIntent | null {
    if (/(?:refresh|reload|update)\s+(?:the\s+)?(?:data|dashboard|view|page)?/i.test(normalized)) {
      return {
        command: { type: 'refresh_data' },
        confidence: 0.9,
        original
      };
    }

    return null;
  }
}

// Singleton
export const voiceIntentParser = new VoiceIntentParser();
