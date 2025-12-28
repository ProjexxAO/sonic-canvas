import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  RefreshCw,
  Sparkles,
  FileStack,
  Filter,
  ChevronRight,
  Clock,
  AlertCircle,
  Info
} from 'lucide-react';
import { useDocumentAudit, DocumentAuditResult, AuditIssue } from '@/hooks/useDocumentAudit';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface DocumentAuditPanelProps {
  onDocumentSelect?: (documentId: string, documentType: 'knowledge' | 'document') => void;
}

export function DocumentAuditPanel({ onDocumentSelect }: DocumentAuditPanelProps) {
  const {
    auditResults,
    auditSummary,
    isAuditing,
    runAudit,
    getVersionLabel
  } = useDocumentAudit();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    runAudit();
  }, []);

  const filteredResults = auditResults.filter(result => {
    if (filterStatus !== 'all' && result.status !== filterStatus) return false;
    if (filterType !== 'all' && result.documentType !== filterType) return false;
    return true;
  });

  const getSeverityIcon = (severity: AuditIssue['severity']) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: DocumentAuditResult['status']) => {
    switch (status) {
      case 'healthy': return 'text-emerald-500 bg-emerald-500/10';
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      case 'needs_attention': return 'text-destructive bg-destructive/10';
    }
  };

  const getStatusIcon = (status: DocumentAuditResult['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'needs_attention': return <FileWarning className="h-4 w-4" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-primary" />
              Document Audit
            </CardTitle>
            <CardDescription className="mt-1">
              Review enhanced and summary document health
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => runAudit()}
            disabled={isAuditing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isAuditing && "animate-spin")} />
            {isAuditing ? 'Auditing...' : 'Run Audit'}
          </Button>
        </div>
      </CardHeader>

      {auditSummary && (
        <>
          <div className="px-6 pb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{auditSummary.totalDocuments}</div>
                <div className="text-xs text-muted-foreground">Total Docs</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                <div className="text-2xl font-bold text-emerald-500">{auditSummary.healthyCount}</div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/10">
                <div className="text-2xl font-bold text-amber-500">{auditSummary.warningCount}</div>
                <div className="text-xs text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-destructive/10">
                <div className="text-2xl font-bold text-destructive">{auditSummary.needsAttentionCount}</div>
                <div className="text-xs text-muted-foreground">Needs Attention</div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Enhanced Documents
                  </span>
                  <span className="font-medium">{auditSummary.enhancedPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={auditSummary.enhancedPercentage} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FileStack className="h-3 w-3" /> With Summaries
                  </span>
                  <span className="font-medium">{auditSummary.summaryPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={auditSummary.summaryPercentage} className="h-2" />
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      <div className="px-6 py-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warning</option>
          <option value="needs_attention">Needs Attention</option>
        </select>
        <Separator orientation="vertical" className="h-4" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer"
        >
          <option value="all">All Types</option>
          <option value="knowledge">Knowledge</option>
          <option value="document">Documents</option>
        </select>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 pb-6 space-y-3">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileWarning className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No documents found matching filters</p>
            </div>
          ) : (
            filteredResults.map((result) => (
              <div
                key={result.id}
                className="p-4 rounded-lg border border-border/50 hover:border-border transition-colors cursor-pointer"
                onClick={() => onDocumentSelect?.(result.id, result.documentType)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("p-1 rounded", getStatusColor(result.status))}>
                        {getStatusIcon(result.status)}
                      </span>
                      <span className="font-medium text-sm truncate">{result.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.documentType}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(result.lastUpdated, { addSuffix: true })}
                      </span>
                      {result.currentVersionNumber && (
                        <Badge variant="secondary" className="text-xs">
                          v{result.currentVersionNumber}
                        </Badge>
                      )}
                      {result.hasEnhancedVersion && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Sparkles className="h-3 w-3" /> Enhanced
                        </Badge>
                      )}
                      {result.hasSummaryVersion && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <FileStack className="h-3 w-3" /> Summary
                        </Badge>
                      )}
                    </div>

                    {result.issues.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {result.issues.slice(0, 2).map((issue, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            {getSeverityIcon(issue.severity)}
                            <span className="text-muted-foreground">{issue.message}</span>
                          </div>
                        ))}
                        {result.issues.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{result.issues.length - 2} more issues
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
