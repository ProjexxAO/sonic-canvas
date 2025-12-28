import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DocumentAuditResult {
  id: string;
  title: string;
  documentType: 'knowledge' | 'document';
  status: 'healthy' | 'warning' | 'needs_attention';
  issues: AuditIssue[];
  lastUpdated: Date;
  hasEnhancedVersion: boolean;
  hasSummaryVersion: boolean;
  versionCount: number;
  currentVersionNumber: string | null;
  recommendations: string[];
}

export interface AuditIssue {
  type: 'stale_content' | 'missing_enhancement' | 'missing_summary' | 'version_mismatch' | 'orphaned_version' | 'empty_content';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion: string;
}

export interface AuditSummary {
  totalDocuments: number;
  healthyCount: number;
  warningCount: number;
  needsAttentionCount: number;
  enhancedPercentage: number;
  summaryPercentage: number;
  averageVersionCount: number;
  lastAuditDate: Date;
}

export type VersionNamingScheme = 'semantic' | 'draft-final' | 'dated' | 'custom';

export interface VersionNamingConfig {
  scheme: VersionNamingScheme;
  prefix?: string;
  includeDraft: boolean;
  includeFinal: boolean;
  includeEnhancedSuffix: boolean;
  includeSummarySuffix: boolean;
  customFormat?: string;
}

const DEFAULT_NAMING_CONFIG: VersionNamingConfig = {
  scheme: 'semantic',
  prefix: 'v',
  includeDraft: true,
  includeFinal: true,
  includeEnhancedSuffix: true,
  includeSummarySuffix: true
};

export function useDocumentAudit() {
  const { user } = useAuth();
  const [auditResults, setAuditResults] = useState<DocumentAuditResult[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [namingConfig, setNamingConfig] = useState<VersionNamingConfig>(DEFAULT_NAMING_CONFIG);

  const runAudit = useCallback(async (documentType?: 'knowledge' | 'document') => {
    if (!user) {
      toast.error('Please sign in to run audit');
      return [];
    }

    setIsAuditing(true);
    try {
      const client = supabase as any;
      const results: DocumentAuditResult[] = [];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Fetch documents based on type
      const tables = documentType 
        ? [{ type: documentType as 'knowledge' | 'document', table: `csuite_${documentType}` }]
        : [
            { type: 'knowledge' as const, table: 'csuite_knowledge' },
            { type: 'document' as const, table: 'csuite_documents' }
          ];

      for (const { type, table } of tables) {
        const { data: docs, error } = await client
          .from(table)
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error(`Error fetching ${type}:`, error);
          continue;
        }

        // Fetch versions for all documents
        const docIds = (docs || []).map((d: any) => d.id);
        const { data: versions } = await (client
          .from('document_versions')
          .select('*')
          .in('document_id', docIds) as any);

        const versionMap = new Map<string, any[]>();
        (versions || []).forEach((v: any) => {
          const existing = versionMap.get(v.document_id) || [];
          existing.push(v);
          versionMap.set(v.document_id, existing);
        });

        for (const doc of docs || []) {
          const docVersions = versionMap.get(doc.id) || [];
          const issues: AuditIssue[] = [];
          const recommendations: string[] = [];

          // Check for stale content
          const lastUpdated = new Date(doc.updated_at);
          if (lastUpdated < thirtyDaysAgo) {
            issues.push({
              type: 'stale_content',
              severity: 'warning',
              message: 'Document has not been updated in over 30 days',
              suggestion: 'Review and update content to ensure relevance'
            });
            recommendations.push('Schedule periodic content review');
          }

          // Check for enhancement
          const hasEnhanced = docVersions.some((v: any) => v.is_enhanced);
          if (!hasEnhanced && doc.content && doc.content.length > 500) {
            issues.push({
              type: 'missing_enhancement',
              severity: 'info',
              message: 'Document could benefit from AI enhancement',
              suggestion: 'Run AI enhancement to improve content quality'
            });
            recommendations.push('Consider AI enhancement for improved clarity');
          }

          // Check for summary
          const hasSummary = docVersions.some((v: any) => v.is_summary);
          if (!hasSummary && doc.content && doc.content.length > 1000) {
            issues.push({
              type: 'missing_summary',
              severity: 'info',
              message: 'Long document without executive summary',
              suggestion: 'Generate a summary version for quick reference'
            });
            recommendations.push('Create executive summary for faster consumption');
          }

          // Check for empty content
          if (!doc.content || doc.content.trim().length === 0) {
            issues.push({
              type: 'empty_content',
              severity: 'error',
              message: 'Document has no content',
              suggestion: 'Add content or remove empty document'
            });
          }

          // Check version consistency
          const currentVersion = docVersions.find((v: any) => v.is_current);
          if (doc.current_version_id && !currentVersion) {
            issues.push({
              type: 'version_mismatch',
              severity: 'warning',
              message: 'Current version reference is invalid',
              suggestion: 'Reset version tracking for this document'
            });
          }

          // Check for orphaned versions
          const orphanedVersions = docVersions.filter((v: any) => 
            !v.is_current && !v.parent_version_id && docVersions.length > 1
          );
          if (orphanedVersions.length > 0) {
            issues.push({
              type: 'orphaned_version',
              severity: 'info',
              message: `${orphanedVersions.length} orphaned version(s) detected`,
              suggestion: 'Review version history for cleanup opportunities'
            });
          }

          // Determine status
          let status: 'healthy' | 'warning' | 'needs_attention' = 'healthy';
          if (issues.some(i => i.severity === 'error')) {
            status = 'needs_attention';
          } else if (issues.some(i => i.severity === 'warning')) {
            status = 'warning';
          }

          results.push({
            id: doc.id,
            title: doc.title,
            documentType: type,
            status,
            issues,
            lastUpdated: new Date(doc.updated_at),
            hasEnhancedVersion: hasEnhanced,
            hasSummaryVersion: hasSummary,
            versionCount: docVersions.length,
            currentVersionNumber: doc.version || currentVersion?.version_number || null,
            recommendations
          });
        }
      }

      setAuditResults(results);

      // Calculate summary
      const totalDocs = results.length;
      const healthyCount = results.filter(r => r.status === 'healthy').length;
      const warningCount = results.filter(r => r.status === 'warning').length;
      const needsAttentionCount = results.filter(r => r.status === 'needs_attention').length;
      const enhancedCount = results.filter(r => r.hasEnhancedVersion).length;
      const summaryCount = results.filter(r => r.hasSummaryVersion).length;
      const avgVersions = totalDocs > 0 
        ? results.reduce((sum, r) => sum + r.versionCount, 0) / totalDocs 
        : 0;

      const summary: AuditSummary = {
        totalDocuments: totalDocs,
        healthyCount,
        warningCount,
        needsAttentionCount,
        enhancedPercentage: totalDocs > 0 ? (enhancedCount / totalDocs) * 100 : 0,
        summaryPercentage: totalDocs > 0 ? (summaryCount / totalDocs) * 100 : 0,
        averageVersionCount: avgVersions,
        lastAuditDate: new Date()
      };

      setAuditSummary(summary);
      toast.success(`Audit complete: ${totalDocs} documents analyzed`);
      return results;
    } catch (error) {
      console.error('Error running audit:', error);
      toast.error('Failed to run document audit');
      return [];
    } finally {
      setIsAuditing(false);
    }
  }, [user]);

  const formatVersionNumber = useCallback((
    majorVersion: number,
    minorVersion: number,
    options?: { isDraft?: boolean; isFinal?: boolean; isEnhanced?: boolean; isSummary?: boolean }
  ): string => {
    const { scheme, prefix, includeDraft, includeFinal, includeEnhancedSuffix, includeSummarySuffix } = namingConfig;

    let versionString = '';

    switch (scheme) {
      case 'semantic':
        versionString = `${prefix || ''}${majorVersion}.${minorVersion}`;
        break;
      case 'draft-final':
        if (options?.isDraft && includeDraft) {
          versionString = `Draft ${majorVersion}.${minorVersion}`;
        } else if (options?.isFinal && includeFinal) {
          versionString = `Final ${majorVersion}.${minorVersion}`;
        } else {
          versionString = `${prefix || ''}${majorVersion}.${minorVersion}`;
        }
        break;
      case 'dated':
        const date = new Date();
        versionString = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${minorVersion}`;
        break;
      case 'custom':
        versionString = namingConfig.customFormat
          ?.replace('{major}', String(majorVersion))
          .replace('{minor}', String(minorVersion))
          .replace('{date}', new Date().toISOString().split('T')[0])
          || `${majorVersion}.${minorVersion}`;
        break;
    }

    // Add suffixes
    const suffixes: string[] = [];
    if (options?.isEnhanced && includeEnhancedSuffix) suffixes.push('enhanced');
    if (options?.isSummary && includeSummarySuffix) suffixes.push('summary');
    
    if (suffixes.length > 0) {
      versionString += `-${suffixes.join('-')}`;
    }

    return versionString;
  }, [namingConfig]);

  const updateNamingConfig = useCallback((config: Partial<VersionNamingConfig>) => {
    setNamingConfig(prev => ({ ...prev, ...config }));
  }, []);

  const getVersionLabel = useCallback((version: any): string => {
    const labels: string[] = [`v${version.version_number}`];
    
    if (version.is_current) labels.push('Current');
    if (version.is_enhanced) labels.push('Enhanced');
    if (version.is_summary) labels.push('Summary');
    
    return labels.join(' • ');
  }, []);

  const suggestVersionName = useCallback((
    currentVersions: any[],
    isEnhanced: boolean = false,
    isSummary: boolean = false
  ): string => {
    const maxVersion = currentVersions.reduce((max, v) => {
      const parts = v.version_number?.split('.').map(Number) || [1, 0];
      const vNum = parts[0] * 1000 + (parts[1] || 0);
      return Math.max(max, vNum);
    }, 0);

    const majorVersion = Math.floor(maxVersion / 1000) || 1;
    const minorVersion = (maxVersion % 1000) + 1;

    return formatVersionNumber(majorVersion, minorVersion, { isEnhanced, isSummary });
  }, [formatVersionNumber]);

  return {
    auditResults,
    auditSummary,
    isAuditing,
    namingConfig,
    runAudit,
    formatVersionNumber,
    updateNamingConfig,
    getVersionLabel,
    suggestVersionName
  };
}
