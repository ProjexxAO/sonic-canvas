import { DataDomainStats, DomainKey, DomainItem } from '@/hooks/useCSuiteData';

export interface PersonaLayoutProps {
  stats: DataDomainStats;
  domainItems: Record<DomainKey, DomainItem[]>;
  loadingDomains: Record<DomainKey, boolean>;
  onDomainClick: (domain: DomainKey) => void;
  onItemClick: (item: DomainItem) => void;
  agents?: any[];
  enterpriseData?: {
    lastQuery?: any;
    lastAnalysis?: any;
    lastCorrelation?: any;
    lastRecommendations?: any;
  };
}

export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
