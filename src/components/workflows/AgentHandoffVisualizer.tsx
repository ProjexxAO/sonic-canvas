import { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Zap,
  Eye,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  AgentHandoff, 
  A2AMessage, 
  AutonomyLevel,
  AUTONOMY_TIERS 
} from '@/lib/agentProtocols';

interface AgentHandoffVisualizerProps {
  handoffs: AgentHandoff[];
  messages: A2AMessage[];
  onApproveHandoff?: (handoffId: string) => void;
  onRejectHandoff?: (handoffId: string) => void;
}

const HANDOFF_STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'Pending' },
  accepted: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'Accepted' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Rejected' },
  completed: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/20', label: 'Completed' },
};

const HANDOFF_REASON_LABELS: Record<string, string> = {
  capability_mismatch: 'Capability Mismatch',
  escalation: 'Escalation Required',
  specialization: 'Specialized Task',
  load_balancing: 'Load Balancing',
  completion: 'Task Completion',
};

const AUTONOMY_ICONS = {
  full_auto: Zap,
  supervised: Eye,
  human_led: User,
};

export function AgentHandoffVisualizer({
  handoffs,
  messages,
  onApproveHandoff,
  onRejectHandoff,
}: AgentHandoffVisualizerProps) {
  const [expandedHandoff, setExpandedHandoff] = useState<string | null>(null);
  const [showMessages, setShowMessages] = useState(false);

  const getAutonomyConfig = (level: AutonomyLevel) => {
    const tier = AUTONOMY_TIERS[level];
    const Icon = AUTONOMY_ICONS[level];
    return { ...tier, Icon };
  };

  return (
    <div className="space-y-4">
      {/* Handoff Timeline */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-primary" />
            <h3 className="font-medium text-sm">Agent Handoffs</h3>
            <Badge variant="secondary" className="text-xs">
              {handoffs.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMessages(!showMessages)}
            className="text-xs"
          >
            {showMessages ? 'Show Handoffs' : 'Show A2A Messages'}
          </Button>
        </div>

        <ScrollArea className="h-80">
          {!showMessages ? (
            <div className="p-4 space-y-3">
              {handoffs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No agent handoffs yet
                </div>
              ) : (
                handoffs.map((handoff) => {
                  const statusConfig = HANDOFF_STATUS_CONFIG[handoff.status];
                  const StatusIcon = statusConfig.icon;
                  const isExpanded = expandedHandoff === handoff.id;

                  return (
                    <div
                      key={handoff.id}
                      className="bg-muted/50 rounded-lg p-3 space-y-2"
                    >
                      {/* Handoff Header */}
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedHandoff(isExpanded ? null : handoff.id)}
                      >
                        <div className="flex items-center gap-3">
                          {/* From Agent */}
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-mono text-primary">
                                {handoff.fromAgentName.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs font-medium truncate max-w-20">
                              {handoff.fromAgentName}
                            </span>
                          </div>

                          {/* Arrow */}
                          <ArrowRight size={14} className="text-muted-foreground" />

                          {/* To Agent */}
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                              <span className="text-xs font-mono text-secondary-foreground">
                                {handoff.toAgentName.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs font-medium truncate max-w-20">
                              {handoff.toAgentName}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={cn('p-1 rounded', statusConfig.bg)}>
                            <StatusIcon size={12} className={statusConfig.color} />
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-muted-foreground" />
                          ) : (
                            <ChevronDown size={14} className="text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Task Context */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-48">
                          {handoff.taskContext.taskTitle}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {HANDOFF_REASON_LABELS[handoff.reason]}
                        </Badge>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1">
                        <Progress value={handoff.taskContext.progress} className="h-1" />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>{handoff.taskContext.progress}% complete</span>
                          <span>{formatDistanceToNow(handoff.timestamp, { addSuffix: true })}</span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="pt-2 mt-2 border-t border-border space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Handoff ID:</span>
                              <p className="font-mono text-[10px] truncate">{handoff.id}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Task ID:</span>
                              <p className="font-mono text-[10px] truncate">{handoff.taskContext.taskId}</p>
                            </div>
                          </div>

                          {handoff.taskContext.partialResults && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Partial Results:</span>
                              <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                                {JSON.stringify(handoff.taskContext.partialResults, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Actions for pending handoffs */}
                          {handoff.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1 h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onApproveHandoff?.(handoff.id);
                                }}
                              >
                                <CheckCircle2 size={12} className="mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1 h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRejectHandoff?.(handoff.id);
                                }}
                              >
                                <XCircle size={12} className="mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* A2A Messages View */
            <div className="p-4 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No A2A messages yet
                </div>
              ) : (
                messages.map((msg) => {
                  const autonomyConfig = getAutonomyConfig(msg.metadata.autonomyLevel);
                  const AutonomyIcon = autonomyConfig.Icon;

                  return (
                    <div
                      key={msg.id}
                      className="bg-muted/50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-[10px]',
                              msg.messageType === 'request' && 'border-primary text-primary',
                              msg.messageType === 'response' && 'border-emerald-500 text-emerald-500',
                              msg.messageType === 'handoff' && 'border-amber-500 text-amber-500',
                              msg.messageType === 'broadcast' && 'border-secondary text-secondary-foreground'
                            )}
                          >
                            {msg.messageType.toUpperCase()}
                          </Badge>
                          <Badge 
                            variant="secondary" 
                            className="text-[10px]"
                            style={{ borderColor: autonomyConfig.color, color: autonomyConfig.color }}
                          >
                            <AutonomyIcon size={10} className="mr-1" />
                            {autonomyConfig.label}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(msg.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-muted-foreground">
                          {msg.sourceAgentId.slice(0, 8)}
                        </span>
                        <ArrowRight size={10} className="text-muted-foreground" />
                        <span className="font-mono text-muted-foreground">
                          {msg.targetAgentId.slice(0, 8)}
                        </span>
                      </div>

                      {msg.payload.action && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Action: </span>
                          <span className="font-medium">{msg.payload.action}</span>
                        </div>
                      )}

                      {msg.metadata.requiresApproval && (
                        <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">
                          <AlertTriangle size={10} className="mr-1" />
                          Requires Approval
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
