import { useEffect } from 'react';
import {
  Mail,
  Eye,
  MousePointer,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmailTracking } from '@/hooks/useEmailTracking';

interface EmailAnalyticsDashboardProps {
  userId: string | undefined;
}

export function EmailAnalyticsDashboard({ userId }: EmailAnalyticsDashboardProps) {
  const {
    events,
    aggregates,
    isLoading,
    fetchTrackingEvents,
    fetchAggregates,
    getAnalyticsSummary,
  } = useEmailTracking(userId);

  useEffect(() => {
    if (userId) {
      fetchTrackingEvents();
      fetchAggregates('day', 30);
    }
  }, [userId, fetchTrackingEvents, fetchAggregates]);

  const summary = getAnalyticsSummary();

  const metrics = [
    {
      label: 'Emails Sent',
      value: summary.totalSent,
      icon: Mail,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Opened',
      value: summary.totalOpened,
      rate: `${summary.openRate}%`,
      icon: Eye,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      trend: parseFloat(summary.openRate) > 20 ? 'up' : 'down',
    },
    {
      label: 'Clicked',
      value: summary.totalClicked,
      rate: `${summary.clickRate}%`,
      icon: MousePointer,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      trend: parseFloat(summary.clickRate) > 3 ? 'up' : 'down',
    },
    {
      label: 'Bounced',
      value: summary.totalBounced,
      rate: `${summary.bounceRate}%`,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      trend: parseFloat(summary.bounceRate) < 2 ? 'up' : 'down',
    },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'opened': return Eye;
      case 'clicked': return MousePointer;
      case 'bounced': return AlertTriangle;
      case 'delivered': return Mail;
      default: return Activity;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'opened': return 'text-emerald-500 bg-emerald-500/10';
      case 'clicked': return 'text-violet-500 bg-violet-500/10';
      case 'bounced': return 'text-red-500 bg-red-500/10';
      case 'delivered': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Email Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Track opens, clicks, and engagement metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchTrackingEvents();
            fetchAggregates('day', 30);
          }}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon size={18} className={metric.color} />
                </div>
                {metric.trend && (
                  <div className={`flex items-center gap-1 text-xs ${
                    metric.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{metric.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  {metric.rate && (
                    <Badge variant="secondary" className="text-xs">
                      {metric.rate}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                {events.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Activity size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tracking events yet</p>
                    <p className="text-xs mt-1">Events will appear here when emails are sent</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {events.map((event) => {
                      const Icon = getEventIcon(event.event_type);
                      const colors = getEventColor(event.event_type);
                      return (
                        <div key={event.id} className="p-3 flex items-center gap-3 hover:bg-muted/50">
                          <div className={`p-2 rounded-lg ${colors}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium capitalize">
                              {event.event_type}
                            </p>
                            {event.recipient_email && (
                              <p className="text-xs text-muted-foreground truncate">
                                {event.recipient_email}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Email Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Open Rate</span>
                  <span className="text-sm font-medium">{summary.openRate}%</span>
                </div>
                <Progress value={parseFloat(summary.openRate)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Industry average: 20-25%
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Click-through Rate</span>
                  <span className="text-sm font-medium">{summary.clickRate}%</span>
                </div>
                <Progress value={parseFloat(summary.clickRate) * 10} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Industry average: 2-5%
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Bounce Rate</span>
                  <span className="text-sm font-medium">{summary.bounceRate}%</span>
                </div>
                <Progress 
                  value={parseFloat(summary.bounceRate) * 10} 
                  className="h-2 [&>div]:bg-amber-500" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Keep under 2% for good deliverability
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
