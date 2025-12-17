import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { SonicAgent } from '@/lib/agentTypes';

interface AtlasContext {
  currentPage: string;
  activeAgents: { name: string; sector: string; status: string }[];
  totalAgents: number;
  recentActivity: string[];
  timestamp: string;
}

interface UseAtlasContextProps {
  agents: SonicAgent[];
  isConnected: boolean;
  sendContextualUpdate: (text: string) => void;
  searchResults?: { name: string; sector: string }[];
  synthesizedAgent?: { name: string } | null;
}

export function useAtlasContext({
  agents,
  isConnected,
  sendContextualUpdate,
  searchResults = [],
  synthesizedAgent
}: UseAtlasContextProps) {
  const location = useLocation();
  const lastContextRef = useRef<string>('');
  const activityLogRef = useRef<string[]>([]);

  // Add activity to the log
  const logActivity = useCallback((activity: string) => {
    activityLogRef.current = [activity, ...activityLogRef.current].slice(0, 10);
  }, []);

  // Build context string
  const buildContextString = useCallback((): string => {
    const activeAgents = agents
      .filter(a => a.status === 'ACTIVE' || a.status === 'PROCESSING')
      .slice(0, 6);

    const agentsByStatus = {
      active: agents.filter(a => a.status === 'ACTIVE').length,
      processing: agents.filter(a => a.status === 'PROCESSING').length,
      idle: agents.filter(a => a.status === 'IDLE').length,
      dormant: agents.filter(a => a.status === 'DORMANT').length,
      error: agents.filter(a => a.status === 'ERROR').length
    };

    const agentsBySector = agents.reduce((acc, agent) => {
      acc[agent.sector] = (acc[agent.sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pageName = getPageName(location.pathname);
    
    const context: AtlasContext = {
      currentPage: pageName,
      activeAgents: activeAgents.map(a => ({
        name: a.name,
        sector: a.sector,
        status: a.status
      })),
      totalAgents: agents.length,
      recentActivity: activityLogRef.current.slice(0, 5),
      timestamp: new Date().toISOString()
    };

    let contextString = `[APP STATE UPDATE]
Current view: ${context.currentPage}
Total agents: ${context.totalAgents}
Active: ${agentsByStatus.active}, Processing: ${agentsByStatus.processing}, Idle: ${agentsByStatus.idle}`;

    if (activeAgents.length > 0) {
      contextString += `\nActive agents: ${activeAgents.map(a => `${a.name} (${a.sector})`).join(', ')}`;
    }

    if (Object.keys(agentsBySector).length > 0) {
      contextString += `\nAgents by sector: ${Object.entries(agentsBySector).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
    }

    if (searchResults.length > 0) {
      contextString += `\nRecent search results: ${searchResults.slice(0, 3).map(r => r.name).join(', ')}`;
    }

    if (synthesizedAgent) {
      contextString += `\nRecently synthesized: ${synthesizedAgent.name}`;
    }

    if (activityLogRef.current.length > 0) {
      contextString += `\nRecent activity: ${activityLogRef.current.slice(0, 3).join(', ')}`;
    }

    return contextString;
  }, [agents, location.pathname, searchResults, synthesizedAgent]);

  // Send context updates when connected and context changes
  useEffect(() => {
    if (!isConnected) return;

    const contextString = buildContextString();
    
    // Only send if context has changed significantly
    if (contextString !== lastContextRef.current) {
      lastContextRef.current = contextString;
      
      try {
        sendContextualUpdate(contextString);
        console.log('[Atlas Context] Sent state update:', contextString.substring(0, 100) + '...');
      } catch (error) {
        console.error('[Atlas Context] Failed to send update:', error);
      }
    }
  }, [isConnected, buildContextString, sendContextualUpdate]);

  // Send initial context on connection
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        const contextString = buildContextString();
        lastContextRef.current = contextString;
        try {
          sendContextualUpdate(contextString);
          console.log('[Atlas Context] Sent initial state');
        } catch (error) {
          console.error('[Atlas Context] Failed to send initial state:', error);
        }
      }, 1000); // Wait 1 second after connection

      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  // Periodic state updates (every 30 seconds when connected)
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const contextString = buildContextString();
      if (contextString !== lastContextRef.current) {
        lastContextRef.current = contextString;
        try {
          sendContextualUpdate(contextString);
          console.log('[Atlas Context] Periodic update sent');
        } catch (error) {
          console.error('[Atlas Context] Periodic update failed:', error);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, buildContextString, sendContextualUpdate]);

  return { logActivity };
}

function getPageName(pathname: string): string {
  const routes: Record<string, string> = {
    '/': 'Main Dashboard - Agent Grid View',
    '/atlas': 'Atlas Command Center',
    '/import': 'Agent Import Interface',
    '/auth': 'Authentication'
  };
  return routes[pathname] || `Page: ${pathname}`;
}
