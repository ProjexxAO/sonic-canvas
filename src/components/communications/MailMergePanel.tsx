import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  FileText,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
import { useMailMerge, MailMergeCampaign } from '@/hooks/useMailMerge';
import { toast } from 'sonner';

interface MailMergePanelProps {
  userId: string | undefined;
}

export function MailMergePanel({ userId }: MailMergePanelProps) {
  const {
    campaigns,
    selectedCampaign,
    recipients,
    isLoading,
    isSending,
    setSelectedCampaign,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    fetchRecipients,
    addRecipients,
    parseMergeTemplate,
    extractMergeFields,
    startCampaign,
    pauseCampaign,
    scheduleCampaign,
  } = useMailMerge(userId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddRecipientsDialog, setShowAddRecipientsDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    body: '',
    description: '',
  });
  const [recipientsCsv, setRecipientsCsv] = useState('');
  const [previewData, setPreviewData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (userId) {
      fetchCampaigns();
    }
  }, [userId, fetchCampaigns]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchRecipients(selectedCampaign.id);
    }
  }, [selectedCampaign, fetchRecipients]);

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.body) {
      toast.error('Please fill in all required fields');
      return;
    }

    const mergeFields = extractMergeFields(newCampaign.subject + ' ' + newCampaign.body);

    await createCampaign(newCampaign.name, newCampaign.subject, newCampaign.body, {
      description: newCampaign.description,
      mergeFields,
    });

    setShowCreateDialog(false);
    setNewCampaign({ name: '', subject: '', body: '', description: '' });
  };

  const handleAddRecipients = async () => {
    if (!selectedCampaign || !recipientsCsv.trim()) return;

    try {
      const lines = recipientsCsv.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const recipientData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const data: Record<string, any> = {};
        headers.forEach((header, index) => {
          data[header] = values[index] || '';
        });
        return {
          email: data.email || data.Email || '',
          merge_data: data,
        };
      }).filter(r => r.email);

      await addRecipients(selectedCampaign.id, recipientData);
      setShowAddRecipientsDialog(false);
      setRecipientsCsv('');
    } catch (error) {
      toast.error('Failed to parse CSV data');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      draft: { color: 'bg-muted text-muted-foreground', icon: FileText },
      scheduled: { color: 'bg-blue-500/10 text-blue-500', icon: Calendar },
      sending: { color: 'bg-amber-500/10 text-amber-500', icon: Clock },
      paused: { color: 'bg-orange-500/10 text-orange-500', icon: Pause },
      completed: { color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle },
      failed: { color: 'bg-red-500/10 text-red-500', icon: AlertCircle },
    };
    const { color, icon: Icon } = config[status] || config.draft;
    return (
      <Badge className={`${color} gap-1`}>
        <Icon size={10} />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Mail Merge Campaigns
          </h2>
          <p className="text-sm text-muted-foreground">
            Send personalized bulk emails with merge fields
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus size={14} className="mr-1" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Campaign List */}
        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {campaigns.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Mail size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No campaigns yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedCampaign?.id === campaign.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {campaign.total_recipients} recipients
                          </p>
                        </div>
                        {getStatusBadge(campaign.status)}
                      </div>
                      {campaign.status === 'sending' && (
                        <Progress 
                          value={(campaign.sent_count / campaign.total_recipients) * 100} 
                          className="mt-2 h-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Campaign Details */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {selectedCampaign ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedCampaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCampaign.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedCampaign.status === 'draft' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAddRecipientsDialog(true)}
                        >
                          <Upload size={14} className="mr-1" />
                          Add Recipients
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => startCampaign(selectedCampaign.id)}
                          disabled={selectedCampaign.total_recipients === 0}
                        >
                          <Play size={14} className="mr-1" />
                          Start
                        </Button>
                      </>
                    )}
                    {selectedCampaign.status === 'sending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseCampaign(selectedCampaign.id)}
                      >
                        <Pause size={14} className="mr-1" />
                        Pause
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        deleteCampaign(selectedCampaign.id);
                        setSelectedCampaign(null);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Template Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Subject Template</Label>
                    <div className="mt-1 p-2 bg-muted rounded text-sm">
                      {selectedCampaign.subject_template}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Merge Fields</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedCampaign.merge_fields?.map((field) => (
                        <Badge key={field} variant="outline" className="text-xs">
                          {`{{${field}}}`}
                        </Badge>
                      )) || <span className="text-xs text-muted-foreground">None</span>}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Body Template</Label>
                  <div className="mt-1 p-3 bg-muted rounded text-sm whitespace-pre-wrap max-h-32 overflow-auto">
                    {selectedCampaign.body_template}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedCampaign.total_recipients}</p>
                    <p className="text-xs text-muted-foreground">Total Recipients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-500">{selectedCampaign.sent_count}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{selectedCampaign.failed_count}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Mail size={40} className="mx-auto mb-2 opacity-30" />
                  <p>Select a campaign to view details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Mail Merge Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="e.g., January Newsletter"
              />
            </div>
            <div>
              <Label>Subject Line (supports merge fields)</Label>
              <Input
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                placeholder="e.g., Hello {{first_name}}, check this out!"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {`{{field_name}}`} for personalization
              </p>
            </div>
            <div>
              <Label>Email Body</Label>
              <Textarea
                value={newCampaign.body}
                onChange={(e) => setNewCampaign({ ...newCampaign, body: e.target.value })}
                placeholder="Dear {{first_name}},&#10;&#10;Thank you for being a valued customer..."
                rows={6}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                placeholder="Internal notes about this campaign"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Recipients Dialog */}
      <Dialog open={showAddRecipientsDialog} onOpenChange={setShowAddRecipientsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Recipients</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Paste CSV Data</Label>
              <Textarea
                value={recipientsCsv}
                onChange={(e) => setRecipientsCsv(e.target.value)}
                placeholder="email,first_name,last_name,company&#10;john@example.com,John,Doe,Acme Inc&#10;jane@example.com,Jane,Smith,Widget Co"
                rows={8}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                First row should contain column headers. Must include 'email' column.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRecipientsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRecipients}>
              <Upload size={14} className="mr-1" />
              Import Recipients
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
