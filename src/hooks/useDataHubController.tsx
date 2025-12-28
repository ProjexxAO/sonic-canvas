import { create } from 'zustand';
import { DomainKey } from './useCSuiteData';

type TabId = 'command' | 'insights' | 'library' | 'admin';

interface DataHubState {
  // Tab control
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  
  // Domain expansion
  expandedDomain: DomainKey | null;
  setExpandedDomain: (domain: DomainKey | null) => void;
  
  // Persona control
  targetPersona: string | null;
  setTargetPersona: (persona: string | null) => void;
  
  // Actions queue (for Atlas to trigger actions)
  pendingAction: DataHubAction | null;
  setPendingAction: (action: DataHubAction | null) => void;
  
  // Enterprise query
  enterpriseQuery: string;
  setEnterpriseQuery: (query: string) => void;
  triggerEnterpriseQuery: boolean;
  setTriggerEnterpriseQuery: (trigger: boolean) => void;
  
  // Report generation
  reportPersona: string | null;
  triggerReportGeneration: boolean;
  requestReportGeneration: (persona: string) => void;
  clearReportRequest: () => void;
  
  // Refresh trigger
  triggerRefresh: boolean;
  requestRefresh: () => void;
  clearRefreshRequest: () => void;
}

export interface DataHubAction {
  type: 'switch_tab' | 'expand_domain' | 'collapse_domain' | 'set_persona' | 
        'generate_report' | 'run_query' | 'run_analysis' | 'find_correlations' |
        'get_recommendations' | 'refresh_data' | 'upload_file';
  payload?: any;
  timestamp: number;
}

export const useDataHubController = create<DataHubState>((set) => ({
  // Tab control
  activeTab: 'command',
  setActiveTab: (tab) => set({ activeTab: tab, pendingAction: null }),
  
  // Domain expansion
  expandedDomain: null,
  setExpandedDomain: (domain) => set({ expandedDomain: domain }),
  
  // Persona control
  targetPersona: null,
  setTargetPersona: (persona) => set({ targetPersona: persona }),
  
  // Actions queue
  pendingAction: null,
  setPendingAction: (action) => set({ pendingAction: action }),
  
  // Enterprise query
  enterpriseQuery: '',
  setEnterpriseQuery: (query) => set({ enterpriseQuery: query }),
  triggerEnterpriseQuery: false,
  setTriggerEnterpriseQuery: (trigger) => set({ triggerEnterpriseQuery: trigger }),
  
  // Report generation
  reportPersona: null,
  triggerReportGeneration: false,
  requestReportGeneration: (persona) => set({ 
    reportPersona: persona, 
    triggerReportGeneration: true 
  }),
  clearReportRequest: () => set({ 
    reportPersona: null, 
    triggerReportGeneration: false 
  }),
  
  // Refresh trigger
  triggerRefresh: false,
  requestRefresh: () => set({ triggerRefresh: true }),
  clearRefreshRequest: () => set({ triggerRefresh: false }),
}));

// Helper to get domain key from name
export function getDomainKeyFromName(name: string): DomainKey | null {
  const normalized = name.toLowerCase().trim();
  const domainMap: Record<string, DomainKey> = {
    'communications': 'communications',
    'communication': 'communications',
    'emails': 'communications',
    'email': 'communications',
    'mail': 'communications',
    'documents': 'documents',
    'document': 'documents',
    'docs': 'documents',
    'files': 'documents',
    'events': 'events',
    'event': 'events',
    'calendar': 'events',
    'meetings': 'events',
    'financials': 'financials',
    'financial': 'financials',
    'finance': 'financials',
    'money': 'financials',
    'tasks': 'tasks',
    'task': 'tasks',
    'todos': 'tasks',
    'todo': 'tasks',
    'knowledge': 'knowledge',
    'kb': 'knowledge',
    'wiki': 'knowledge',
  };
  return domainMap[normalized] || null;
}

// Helper to get tab from name
export function getTabFromName(name: string): TabId | null {
  const normalized = name.toLowerCase().trim();
  const tabMap: Record<string, TabId> = {
    'command': 'command',
    'command center': 'command',
    'dashboard': 'command',
    'home': 'command',
    'insights': 'insights',
    'insight': 'insights',
    'ai': 'insights',
    'analysis': 'insights',
    'library': 'library',
    'data': 'library',
    'domains': 'library',
    'reports': 'library',
    'admin': 'admin',
    'settings': 'admin',
    'administration': 'admin',
  };
  return tabMap[normalized] || null;
}

// Helper to get persona from name
export function getPersonaFromName(name: string): string | null {
  const normalized = name.toLowerCase().trim();
  const personaMap: Record<string, string> = {
    'ceo': 'ceo',
    'chief executive': 'ceo',
    'cfo': 'cfo',
    'chief financial': 'cfo',
    'finance': 'cfo',
    'coo': 'coo',
    'chief operating': 'coo',
    'operations': 'coo',
    'cto': 'cto',
    'chief technology': 'cto',
    'technology': 'cto',
    'tech': 'cto',
    'cmo': 'cmo',
    'chief marketing': 'cmo',
    'marketing': 'cmo',
    'cro': 'cro',
    'chief revenue': 'cro',
    'revenue': 'cro',
    'sales': 'cro',
    'chro': 'chro',
    'chief human resources': 'chro',
    'hr': 'chro',
    'human resources': 'chro',
    'clo': 'clo',
    'chief legal': 'clo',
    'legal': 'clo',
    'cco': 'cco',
    'chief compliance': 'cco',
    'compliance': 'cco',
    'ciso': 'ciso',
    'chief information security': 'ciso',
    'security': 'ciso',
    'chief of staff': 'chief_of_staff',
    'cos': 'chief_of_staff',
    'chief people': 'chief_people',
    'people': 'chief_people',
    'admin': 'admin',
    'administrator': 'admin',
  };
  return personaMap[normalized] || null;
}
