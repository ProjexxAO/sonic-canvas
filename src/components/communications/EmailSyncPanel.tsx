import { useEffect } from 'react';
import {
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Timer,
  Activity,
  Settings,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEmailSync, SyncJob } from '@/hooks/useEmailSync';
import { useState } from 'react';

interface EmailSyncPanelProps {
  userId: string | undefined;
}

const PLATFORMS = [
  { value: 'gmail', label: 'Gmail', color: 'text-red-500' },
  { value: 'outlook', label: 'Outlook', color: 'text-blue-500' },
  { value: 'slack', label: 'Slack', color: 'text-violet-500' },
];

const SYNC_INTERVALS = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
];

export function EmailSyncPanel({ userId }: EmailSyncPanelProps) {
  const {
    jobs,
    activeJob,
    isLoading,
    isAutoSyncEnabled,
    fetchJobs,
    startFullSync,
    startIncrementalSync,
    cancelJob,
    startAutoSync,
    stopAutoSync,
    getSyncStats,
  } = useEmailSync(userId);

  const [selectedPlatform, setSelectedPlatform] = useState('gmail');
  const [syncInterval, setSyncInterval] = useState(15);

  useEffect(() => {
    if (userId) {
      fetchJobs();
    }
  }, [userId, fetchJobs]);

  const stats = getSyncStats();

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-muted text-muted-foreground', icon: Clock },
      running: { color: 'bg-blue-500/10 text-blue-500', icon: Loader2 },
      completed: { color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle },
      failed: { color: 'bg-red-500/10 text-red-500', icon: AlertCircle },
      cancelled: { color: 'bg-orange-500/10 text-orange-500', icon: Pause },
    };
    const { color, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={`${color} gap-1`}>
        <Icon size={10} className={status === 'running' ? 'animate-spin' : ''} />
        {status}
      </Badge>
    );
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '-';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw size={20} className="text-primary" />
            Email Sync Manager
          </h2>
          <p className="text-sm text-muted-foreground">
            Sync emails from connected platforms automatically
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalItemsSynced}</p>
                <p className="text-xs text-muted-foreground">Items Synced</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedJobs}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <AlertCircle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failedJobs}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {stats.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleTimeString() : 'Never'}
                </p>
                <p className="text-xs text-muted-foreground">Last Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sync Progress */}
      {activeJob && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="font-medium text-sm">Syncing {activeJob.platform}...</span>
                {getStatusBadge(activeJob.status)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelJob(activeJob.id)}
              >
                <Pause size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
            <Progress value={activeJob.progress} className="h-2 mb-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{activeJob.processed_items} / {activeJob.total_items} items</span>
              <span>{activeJob.progress}% complete</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Controls */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings size={16} />
            Sync Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Platform</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <span className={platform.color}>{platform.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Auto-Sync Interval</Label>
              <Select
                value={syncInterval.toString()}
                onValueChange={(v) => setSyncInterval(parseInt(v))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYNC_INTERVALS.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value.toString()}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startIncrementalSync(selectedPlatform)}
                disabled={!!activeJob}
                className="flex-1"
              >
                <RefreshCw size={14} className="mr-1" />
                Sync Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startFullSync(selectedPlatform)}
                disabled={!!activeJob}
                className="flex-1"
              >
                <Play size={14} className="mr-1" />
                Full Sync
              </Button>
            </div>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Timer size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium">Auto-Sync</p>
                <p className="text-xs text-muted-foreground">
                  Automatically sync every {syncInterval} minutes
                </p>
              </div>
            </div>
            <Switch
              checked={isAutoSyncEnabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  startAutoSync(selectedPlatform, syncInterval);
                } else {
                  stopAutoSync();
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Job History */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Sync History</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => fetchJobs()} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[250px]">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <RefreshCw size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sync history</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {jobs.map((job) => (
                  <div key={job.id} className="p-3 hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="font-medium capitalize">{job.platform}</span>
                          <span className="text-muted-foreground mx-1">•</span>
                          <span className="text-muted-foreground">{job.job_type.replace('_', ' ')}</span>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDuration(job.started_at, job.completed_at)}
                      </div>
                    </div>
                    {job.status === 'running' && (
                      <Progress value={job.progress} className="mt-2 h-1" />
                    )}
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                      <span>{job.processed_items} items processed</span>
                      {job.error_count > 0 && (
                        <span className="text-red-500">{job.error_count} errors</span>
                      )}
                      <span>{new Date(job.created_at).toLocaleString()}</span>
                    </div>
                    {job.last_error && (
                      <p className="mt-1 text-xs text-red-500 truncate">{job.last_error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
