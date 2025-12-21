// Atlas Sonic OS - Workspaces Hook

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';

type Workspace = Tables<'workspaces'>;
type WorkspaceMember = Tables<'workspace_members'>;

interface WorkspaceWithRole extends Workspace {
  role: WorkspaceMember['role'];
}

interface WorkspacesContextType {
  workspaces: WorkspaceWithRole[];
  currentWorkspace: WorkspaceWithRole | null;
  loading: boolean;
  error: string | null;
  selectWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, type: Workspace['type']) => Promise<Workspace | null>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspacesContext = createContext<WorkspacesContextType | undefined>(undefined);

const CURRENT_WORKSPACE_KEY = 'atlas_current_workspace_id';

export function WorkspacesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch workspaces where user is a member
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          role,
          workspace:workspaces (*)
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Fetch workspaces created by user (owner)
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('created_by', user.id);

      if (ownedError) throw ownedError;

      // Combine and deduplicate
      const workspaceMap = new Map<string, WorkspaceWithRole>();

      // Add owned workspaces first (they have 'owner' role)
      ownedWorkspaces?.forEach(ws => {
        workspaceMap.set(ws.id, { ...ws, role: 'owner' });
      });

      // Add member workspaces (may override with actual role)
      memberWorkspaces?.forEach(item => {
        const ws = item.workspace as unknown as Workspace;
        if (ws) {
          workspaceMap.set(ws.id, { ...ws, role: item.role });
        }
      });

      const allWorkspaces = Array.from(workspaceMap.values());
      setWorkspaces(allWorkspaces);

      // Restore or set default workspace
      const savedWorkspaceId = localStorage.getItem(CURRENT_WORKSPACE_KEY);
      const savedWorkspace = allWorkspaces.find(ws => ws.id === savedWorkspaceId);
      
      if (savedWorkspace) {
        setCurrentWorkspace(savedWorkspace);
      } else if (allWorkspaces.length > 0) {
        // Default to personal workspace or first available
        const personal = allWorkspaces.find(ws => ws.type === 'personal');
        const defaultWs = personal || allWorkspaces[0];
        setCurrentWorkspace(defaultWs);
        localStorage.setItem(CURRENT_WORKSPACE_KEY, defaultWs.id);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const selectWorkspace = useCallback((workspaceId: string) => {
    const workspace = workspaces.find(ws => ws.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      localStorage.setItem(CURRENT_WORKSPACE_KEY, workspaceId);
    }
  }, [workspaces]);

  const createWorkspace = useCallback(async (name: string, type: Workspace['type']): Promise<Workspace | null> => {
    if (!user) return null;

    try {
      const { data, error: createError } = await supabase
        .from('workspaces')
        .insert({
          name,
          type,
          created_by: user.id,
          visibility: 'private',
          data_scope: 'full',
          insight_cadence: 'weekly'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Refresh workspaces list
      await fetchWorkspaces();
      
      // Select the new workspace
      if (data) {
        selectWorkspace(data.id);
      }

      return data;
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
      return null;
    }
  }, [user, fetchWorkspaces, selectWorkspace]);

  return (
    <WorkspacesContext.Provider value={{
      workspaces,
      currentWorkspace,
      loading,
      error,
      selectWorkspace,
      createWorkspace,
      refreshWorkspaces: fetchWorkspaces
    }}>
      {children}
    </WorkspacesContext.Provider>
  );
}

export function useWorkspaces() {
  const context = useContext(WorkspacesContext);
  if (context === undefined) {
    throw new Error('useWorkspaces must be used within a WorkspacesProvider');
  }
  return context;
}
