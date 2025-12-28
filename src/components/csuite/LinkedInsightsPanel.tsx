import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Link2,
  Search,
  CheckCircle2,
  MessageSquare,
  Calendar,
  DollarSign,
  RefreshCw,
  X,
  ChevronRight,
  Sparkles,
  Loader2,
  Unlink
} from 'lucide-react';
import { useDocumentInsights, DocumentInsights, LinkedTask, LinkedCommunication, LinkedEvent, LinkedFinancial } from '@/hooks/useDocumentInsights';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LinkedInsightsPanelProps {
  documentId: string;
  documentType?: 'knowledge' | 'document';
  documentTitle?: string;
  onClose?: () => void;
  onItemClick?: (type: string, id: string) => void;
}

export function LinkedInsightsPanel({
  documentId,
  documentType = 'knowledge',
  documentTitle,
  onClose,
  onItemClick
}: LinkedInsightsPanelProps) {
  const {
    insights,
    isLoading,
    isDetecting,
    fetchInsights,
    fetchReferences,
    detectReferences,
    removeReference,
    references,
    getTotalLinkedCount
  } = useDocumentInsights();

  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (documentId) {
      fetchInsights(documentId, documentType);
      fetchReferences(documentId, documentType);
    }
  }, [documentId, documentType, fetchInsights, fetchReferences]);

  const handleDetectReferences = async () => {
    await detectReferences(documentId, documentType);
  };

  const handleUnlink = async (referenceId: string) => {
    await removeReference(referenceId, documentId, documentType);
  };

  const renderTaskItem = (task: LinkedTask) => {
    const ref = references.find(r => r.reference_id === task.id);
    return (
      <div
        key={task.id}
        className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/10 transition-colors cursor-pointer"
        onClick={() => onItemClick?.('task', task.id)}
      >
        <div className={cn(
          "mt-0.5 p-1.5 rounded-md",
          task.status === 'completed' ? 'bg-green-500/20 text-green-500' :
          task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
          'bg-muted text-muted-foreground'
        )}>
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{task.title}</span>
            {ref?.is_auto_detected && (
              <Badge variant="outline" className="text-xs shrink-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {task.reference_context}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {task.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {task.priority}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            if (ref) handleUnlink(ref.id);
          }}
        >
          <Unlink className="h-3 w-3" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    );
  };

  const renderCommunicationItem = (comm: LinkedCommunication) => {
    const ref = references.find(r => r.reference_id === comm.id);
    return (
      <div
        key={comm.id}
        className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/10 transition-colors cursor-pointer"
        onClick={() => onItemClick?.('communication', comm.id)}
      >
        <div className="mt-0.5 p-1.5 rounded-md bg-purple-500/20 text-purple-500">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{comm.subject || 'No Subject'}</span>
            {ref?.is_auto_detected && (
              <Badge variant="outline" className="text-xs shrink-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            From: {comm.from_address}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {comm.reference_context}
          </p>
          {comm.sent_at && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(comm.sent_at), 'MMM d, yyyy')}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            if (ref) handleUnlink(ref.id);
          }}
        >
          <Unlink className="h-3 w-3" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    );
  };

  const renderEventItem = (event: LinkedEvent) => {
    const ref = references.find(r => r.reference_id === event.id);
    return (
      <div
        key={event.id}
        className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/10 transition-colors cursor-pointer"
        onClick={() => onItemClick?.('event', event.id)}
      >
        <div className="mt-0.5 p-1.5 rounded-md bg-orange-500/20 text-orange-500">
          <Calendar className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{event.title}</span>
            {ref?.is_auto_detected && (
              <Badge variant="outline" className="text-xs shrink-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {event.reference_context}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {event.start_at && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(event.start_at), 'MMM d, yyyy h:mm a')}
              </span>
            )}
            {event.location && (
              <span className="text-xs text-muted-foreground">• {event.location}</span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            if (ref) handleUnlink(ref.id);
          }}
        >
          <Unlink className="h-3 w-3" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    );
  };

  const renderFinancialItem = (financial: LinkedFinancial) => {
    const ref = references.find(r => r.reference_id === financial.id);
    return (
      <div
        key={financial.id}
        className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-accent/10 transition-colors cursor-pointer"
        onClick={() => onItemClick?.('financial', financial.id)}
      >
        <div className="mt-0.5 p-1.5 rounded-md bg-emerald-500/20 text-emerald-500">
          <DollarSign className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{financial.title}</span>
            {ref?.is_auto_detected && (
              <Badge variant="outline" className="text-xs shrink-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Auto
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {financial.reference_context}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {financial.amount && (
              <span className="text-sm font-medium text-emerald-500">
                ${financial.amount.toLocaleString()}
              </span>
            )}
            <Badge variant="secondary" className="text-xs">
              {financial.status}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            if (ref) handleUnlink(ref.id);
          }}
        >
          <Unlink className="h-3 w-3" />
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    );
  };

  const totalCount = getTotalLinkedCount();
  const taskCount = insights?.tasks.length || 0;
  const commCount = insights?.communications.length || 0;
  const eventCount = insights?.events.length || 0;
  const financialCount = insights?.financials.length || 0;

  return (
    <Card className="flex flex-col h-full border-border/50">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Linked Insights</CardTitle>
            <Badge variant="secondary">{totalCount}</Badge>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {documentTitle && (
          <p className="text-sm text-muted-foreground mt-1 truncate">
            For: {documentTitle}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDetectReferences}
            disabled={isDetecting}
            className="flex-1"
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Auto-Detect Links
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              fetchInsights(documentId, documentType);
              fetchReferences(documentId, documentType);
            }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start px-4 pt-2 shrink-0">
          <TabsTrigger value="all" className="text-xs">
            All ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">
            Tasks ({taskCount})
          </TabsTrigger>
          <TabsTrigger value="comms" className="text-xs">
            Comms ({commCount})
          </TabsTrigger>
          <TabsTrigger value="events" className="text-xs">
            Events ({eventCount})
          </TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">
            Financial ({financialCount})
          </TabsTrigger>
        </TabsList>

        <CardContent className="flex-1 p-0 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : totalCount === 0 ? (
                <div className="text-center py-8">
                  <Link2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No linked insights found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Auto-Detect Links" to find related items
                  </p>
                </div>
              ) : (
                <>
                  <TabsContent value="all" className="m-0 space-y-3">
                    {insights?.tasks.map(renderTaskItem)}
                    {insights?.communications.map(renderCommunicationItem)}
                    {insights?.events.map(renderEventItem)}
                    {insights?.financials.map(renderFinancialItem)}
                  </TabsContent>

                  <TabsContent value="tasks" className="m-0 space-y-3">
                    {taskCount === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No linked tasks
                      </p>
                    ) : (
                      insights?.tasks.map(renderTaskItem)
                    )}
                  </TabsContent>

                  <TabsContent value="comms" className="m-0 space-y-3">
                    {commCount === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No linked communications
                      </p>
                    ) : (
                      insights?.communications.map(renderCommunicationItem)
                    )}
                  </TabsContent>

                  <TabsContent value="events" className="m-0 space-y-3">
                    {eventCount === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No linked events
                      </p>
                    ) : (
                      insights?.events.map(renderEventItem)
                    )}
                  </TabsContent>

                  <TabsContent value="financials" className="m-0 space-y-3">
                    {financialCount === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No linked financials
                      </p>
                    ) : (
                      insights?.financials.map(renderFinancialItem)
                    )}
                  </TabsContent>
                </>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Tabs>
    </Card>
  );
}
