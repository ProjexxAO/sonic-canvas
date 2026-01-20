import { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Play,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAutomationWebhooks, WebhookProvider, TriggerType } from '@/hooks/useAutomationWebhooks';
import { toast } from 'sonner';

interface ZapierIntegrationPanelProps {
  userId: string | undefined;
}

const TRIGGER_TYPES: { value: TriggerType; label: string; description: string }[] = [
  { value: 'email_received', label: 'Email Received', description: 'Triggers when a new email arrives' },
  { value: 'email_sent', label: 'Email Sent', description: 'Triggers when an email is sent' },
  { value: 'contact_added', label: 'Contact Added', description: 'Triggers when a new contact is created' },
  { value: 'campaign_completed', label: 'Campaign Completed', description: 'Triggers when a mail merge campaign finishes' },
  { value: 'tracking_event', label: 'Tracking Event', description: 'Triggers on email open, click, or bounce' },
  { value: 'custom', label: 'Custom', description: 'Manual trigger or custom conditions' },
];

const PROVIDERS: { value: WebhookProvider; label: string; logo: string }[] = [
  { value: 'zapier', label: 'Zapier', logo: '⚡' },
  { value: 'make', label: 'Make (Integromat)', logo: '🔄' },
  { value: 'n8n', label: 'n8n', logo: '🔗' },
  { value: 'custom', label: 'Custom Webhook', logo: '🔧' },
];

export function ZapierIntegrationPanel({ userId }: ZapierIntegrationPanelProps) {
  const {
    webhooks,
    isLoading,
    isTriggering,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    toggleWebhook,
    triggerWebhook,
  } = useAutomationWebhooks(userId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [testPayload, setTestPayload] = useState('{\n  "test": true,\n  "message": "Hello from Atlas"\n}');
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    webhookUrl: '',
    provider: 'zapier' as WebhookProvider,
    triggerType: 'email_received' as TriggerType,
    description: '',
  });

  useEffect(() => {
    if (userId) {
      fetchWebhooks();
    }
  }, [userId, fetchWebhooks]);

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.webhookUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    await createWebhook(newWebhook.name, newWebhook.webhookUrl, newWebhook.triggerType, {
      description: newWebhook.description,
      provider: newWebhook.provider,
    });

    setShowCreateDialog(false);
    setNewWebhook({
      name: '',
      webhookUrl: '',
      provider: 'zapier',
      triggerType: 'email_received',
      description: '',
    });
  };

  const handleTestWebhook = async () => {
    if (!selectedWebhook) return;

    try {
      const payload = JSON.parse(testPayload);
      await triggerWebhook(selectedWebhook, payload);
      setShowTestDialog(false);
    } catch (error) {
      toast.error('Invalid JSON payload');
    }
  };

  const getProviderInfo = (provider: WebhookProvider) => {
    return PROVIDERS.find(p => p.value === provider) || PROVIDERS[3];
  };

  const getTriggerInfo = (trigger: TriggerType) => {
    return TRIGGER_TYPES.find(t => t.value === trigger) || TRIGGER_TYPES[5];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap size={20} className="text-amber-500" />
            Automation Webhooks
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect to Zapier, Make, n8n, or custom webhooks
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus size={14} className="mr-1" />
          Add Webhook
        </Button>
      </div>

      {/* Quick Links */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" asChild>
          <a href="https://zapier.com/app/zaps" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} className="mr-1" />
            Zapier Dashboard
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="https://www.make.com/en/scenarios" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} className="mr-1" />
            Make Scenarios
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href="https://docs.n8n.io/workflows/" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} className="mr-1" />
            n8n Docs
          </a>
        </Button>
      </div>

      {/* Webhook List */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchWebhooks} disabled={isLoading}>
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[350px]">
            {webhooks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Link2 size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No webhooks configured</p>
                <p className="text-xs mt-1">Add a webhook to connect with automation tools</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {webhooks.map((webhook) => {
                  const provider = getProviderInfo(webhook.provider);
                  const trigger = getTriggerInfo(webhook.trigger_type);
                  
                  return (
                    <div key={webhook.id} className="p-4 hover:bg-muted/50">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{provider.logo}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{webhook.name}</p>
                            <Badge variant={webhook.is_active ? 'default' : 'secondary'} className="text-xs">
                              {webhook.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {trigger.label} • {provider.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {webhook.webhook_url}
                          </p>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <CheckCircle size={12} className="text-emerald-500" />
                              {webhook.trigger_count} triggers
                            </span>
                            {webhook.error_count > 0 && (
                              <span className="flex items-center gap-1 text-red-500">
                                <AlertCircle size={12} />
                                {webhook.error_count} errors
                              </span>
                            )}
                            {webhook.last_triggered_at && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock size={12} />
                                Last: {new Date(webhook.last_triggered_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={webhook.is_active}
                            onCheckedChange={() => toggleWebhook(webhook.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedWebhook(webhook.id);
                              setShowTestDialog(true);
                            }}
                          >
                            <Play size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteWebhook(webhook.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Automation Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Webhook Name</Label>
              <Input
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                placeholder="e.g., Send to Slack on new email"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provider</Label>
                <Select
                  value={newWebhook.provider}
                  onValueChange={(v) => setNewWebhook({ ...newWebhook, provider: v as WebhookProvider })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        <span className="flex items-center gap-2">
                          <span>{provider.logo}</span>
                          {provider.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Trigger</Label>
                <Select
                  value={newWebhook.triggerType}
                  onValueChange={(v) => setNewWebhook({ ...newWebhook, triggerType: v as TriggerType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_TYPES.map((trigger) => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Webhook URL</Label>
              <Input
                value={newWebhook.webhookUrl}
                onChange={(e) => setNewWebhook({ ...newWebhook, webhookUrl: e.target.value })}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get this URL from your Zapier Zap or Make scenario
              </p>
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={newWebhook.description}
                onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })}
                placeholder="What does this webhook do?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWebhook}>
              <Zap size={14} className="mr-1" />
              Create Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Webhook Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Test Payload (JSON)</Label>
              <Textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTestWebhook} disabled={isTriggering}>
              {isTriggering ? (
                <RefreshCw size={14} className="mr-1 animate-spin" />
              ) : (
                <Play size={14} className="mr-1" />
              )}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
