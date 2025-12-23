export interface ToolItem {
  tool: string;
  label: string;
  icon: string;
  metadata: {
    autoInvokable?: boolean;
    category?: string;
    reason?: string;
    boost?: number;
    description?: string;
    capabilities?: string[];
    tags?: string[];
  };
}

export interface ToolSection {
  id: string;
  title: string;
  description: string;
  droppable: boolean;
  items: ToolItem[];
}

export type SectionId = 'allowed' | 'blocked' | 'preferred' | 'available';
