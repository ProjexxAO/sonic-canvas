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
  const lastSentAtRef = useRef<number>(0);
  const connectedAtRef = useRef<number>(0);

  // Add activity to the log - stable reference
  const logActivityRef = useRef((activity: string) => {
    activityLogRef.current = [activity, ...activityLogRef.current].slice(0, 10);
  });
  const logActivity = logActivityRef.current;

  // Track connection time (to avoid spamming DataChannel during the first seconds)
  useEffect(() => {
    if (isConnected) {
      connectedAtRef.current = Date.now();
      lastSentAtRef.current = 0;
    }
  }, [isConnected]);

  // Build a compact context string (keep payload small for realtime data channel)
  const buildContextString = useCallback((): string => {
    const agentsByStatus = {
      active: agents.filter(a => a.status === 'ACTIVE').length,
      processing: agents.filter(a => a.status === 'PROCESSING').length,
      idle: agents.filter(a => a.status === 'IDLE').length,
      dormant: agents.filter(a => a.status === 'DORMANT').length,
      error: agents.filter(a => a.status === 'ERROR').length,
    };

    const activeAgents = agents
      .filter(a => a.status === 'ACTIVE' || a.status === 'PROCESSING')
      .slice(0, 6);

    const pageName = getPageName(location.pathname);

    let contextString = `[APP STATE UPDATE]\n`;
    contextString += `Current view: ${pageName}\n`;
    contextString += `Total agents: ${agents.length}\n`;
    contextString += `Status counts: Active ${agentsByStatus.active}, Processing ${agentsByStatus.processing}, Idle ${agentsByStatus.idle}, Dormant ${agentsByStatus.dormant}, Error ${agentsByStatus.error}`;

    if (activeAgents.length > 0) {
      contextString += `\nActive agents (sample): ${activeAgents.map(a => `${a.name} (${a.sector})`).join(', ')}`;
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

  const maybeSend = useCallback((contextString: string, reason: string) => {
    if (!isConnected) return;

    // Avoid sending during initial handshake window
    const now = Date.now();
    if (connectedAtRef.current && now - connectedAtRef.current < 4000) {
      return;
    }

    // Throttle to avoid DataChannel overload
    if (now - lastSentAtRef.current < 5000) {
      return;
    }

    if (contextString === lastContextRef.current) return;

    lastContextRef.current = contextString;
    lastSentAtRef.current = now;

    try {
      sendContextualUpdate(contextString);
      console.log('[Atlas Context] Sent state update (' + reason + ')');
    } catch (error) {
      console.error('[Atlas Context] Failed to send update:', error);
    }
  }, [isConnected, sendContextualUpdate]);

  // Send context updates when connected and context changes (throttled)
  useEffect(() => {
    if (!isConnected) return;
    const contextString = buildContextString();
    maybeSend(contextString, 'change');
  }, [isConnected, buildContextString, maybeSend]);

  // Periodic state updates (every 30 seconds when connected)
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const contextString = buildContextString();
      maybeSend(contextString, 'periodic');
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, buildContextString, maybeSend]);

  return { logActivity };
}

function getPageName(pathname: string): string {
  const routes: Record<string, string> = {
    '/': 'Agent Grid - Atlas Sonic OS',
    '/atlas': 'Dashboard - Atlas Command Center',
    '/import': 'Agent Import Interface',
    '/auth': 'Authentication'
  };
  return routes[pathname] || `Page: ${pathname}`;
}
