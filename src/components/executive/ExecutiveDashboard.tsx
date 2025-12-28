import { useState, useEffect } from 'react';
import {
  Activity,
  Bot,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  Zap,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface ExecutiveDashboardProps {
  userId: string | undefined;
  agents: any[];
  agentsLoading: boolean;
}

interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  processingAgents: number;
  idleAgents: number;
  totalReports: number;
  reportsThisWeek: number;
  totalDataItems: number;
  connectorCount: number;
  workflowCount: number;
  workflowRunsToday: number;
}

interface RecentActivity {
  id: string;
  type: 'report' | 'workflow' | 'agent' | 'data';
  title: string;
  timestamp: Date;
  status: 'success' | 'pending' | 'error';
}

export function ExecutiveDashboard({ userId, agents, agentsLoading }: ExecutiveDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    activeAgents: 0,
    processingAgents: 0,
    idleAgents: 0,
    totalReports: 0,
    reportsThisWeek: 0,
    totalDataItems: 0,
    connectorCount: 0,
    workflowCount: 0,
    workflowRunsToday: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch reports count
        const { count: totalReports } = await supabase
          .from('csuite_reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        // Fetch reports this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: reportsThisWeek } = await supabase
          .from('csuite_reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', weekAgo.toISOString());

        // Fetch data item counts
        const [comms, docs, events, financials, tasks, knowledge] = await Promise.all([
          supabase.from('csuite_communications').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('csuite_documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('csuite_events').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('csuite_financials').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('csuite_tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('csuite_knowledge').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        ]);

        const totalDataItems = (comms.count || 0) + (docs.count || 0) + (events.count || 0) + 
                              (financials.count || 0) + (tasks.count || 0) + (knowledge.count || 0);

        // Fetch connector count
        const { count: connectorCount } = await supabase
          .from('csuite_connectors')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'connected');

        // Fetch workflow stats
        const { count: workflowCount } = await supabase
          .from('atlas_workflows')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: workflowRunsToday } = await supabase
          .from('atlas_workflow_runs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('started_at', today.toISOString());

        // Calculate agent stats
        const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;
        const processingAgents = agents.filter(a => a.status === 'PROCESSING').length;
        const idleAgents = agents.filter(a => a.status === 'IDLE').length;

        setStats({
          totalAgents: agents.length,
          activeAgents,
          processingAgents,
          idleAgents,
          totalReports: totalReports || 0,
          reportsThisWeek: reportsThisWeek || 0,
          totalDataItems,
          connectorCount: connectorCount || 0,
          workflowCount: workflowCount || 0,
          workflowRunsToday: workflowRunsToday || 0
        });

        // Fetch recent activity
        const { data: recentReports } = await supabase
          .from('csuite_reports')
          .select('id, title, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        const activity: RecentActivity[] = (recentReports || []).map(r => ({
          id: r.id,
          type: 'report' as const,
          title: r.title,
          timestamp: new Date(r.created_at),
          status: 'success' as const
        }));

        setRecentActivity(activity);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userId, agents]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 size={10} className="text-green-500" />;
      case 'pending': return <Clock size={10} className="text-yellow-500" />;
      case 'error': return <AlertCircle size={10} className="text-red-500" />;
      default: return null;
    }
  };

  const agentUtilization = stats.totalAgents > 0 
    ? Math.round(((stats.activeAgents + stats.processingAgents) / stats.totalAgents) * 100) 
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-primary" />
          <span className="text-xs font-mono text-muted-foreground">EXECUTIVE DASHBOARD</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={isLoading}
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Agent Status */}
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">AGENTS</span>
              </div>
              <div className="text-2xl font-mono text-foreground mb-1">{stats.totalAgents.toLocaleString()}</div>
              <div className="flex items-center gap-2 text-[9px]">
                <span className="text-green-500">{stats.activeAgents} active</span>
                <span className="text-yellow-500">{stats.processingAgents} processing</span>
              </div>
            </div>

            {/* Reports */}
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">REPORTS</span>
              </div>
              <div className="text-2xl font-mono text-foreground mb-1">{stats.totalReports}</div>
              <div className="flex items-center gap-1 text-[9px]">
                <TrendingUp size={10} className="text-green-500" />
                <span className="text-green-500">{stats.reportsThisWeek} this week</span>
              </div>
            </div>

            {/* Data Items */}
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Database size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">DATA ITEMS</span>
              </div>
              <div className="text-2xl font-mono text-foreground mb-1">{stats.totalDataItems.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span>{stats.connectorCount} connectors</span>
              </div>
            </div>

            {/* Workflows */}
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">WORKFLOWS</span>
              </div>
              <div className="text-2xl font-mono text-foreground mb-1">{stats.workflowCount}</div>
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span>{stats.workflowRunsToday} runs today</span>
              </div>
            </div>
          </div>

          {/* Agent Utilization */}
          <div className="p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">AGENT UTILIZATION</span>
              </div>
              <span className="text-sm font-mono text-primary">{agentUtilization}%</span>
            </div>
            <Progress value={agentUtilization} className="h-2" />
            <div className="flex justify-between mt-2 text-[9px] text-muted-foreground">
              <span>Active: {stats.activeAgents}</span>
              <span>Processing: {stats.processingAgents}</span>
              <span>Idle: {stats.idleAgents}</span>
            </div>
          </div>

          {/* Sector Distribution */}
          <div className="p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={12} className="text-primary" />
              <span className="text-[10px] font-mono text-muted-foreground">SECTOR DISTRIBUTION</span>
            </div>
            <div className="space-y-2">
              {['FINANCE', 'BIOTECH', 'SECURITY', 'DATA', 'CREATIVE', 'UTILITY'].map(sector => {
                const count = agents.filter(a => a.sector === sector).length;
                const percentage = stats.totalAgents > 0 ? Math.round((count / stats.totalAgents) * 100) : 0;
                return (
                  <div key={sector} className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-muted-foreground w-16">{sector}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={12} className="text-primary" />
              <span className="text-[10px] font-mono text-muted-foreground">RECENT ACTIVITY</span>
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-2">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(activity.status)}
                      <span className="text-[10px] text-foreground truncate max-w-[150px]">{activity.title}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">
                      {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
