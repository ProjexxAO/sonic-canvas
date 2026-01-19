import { useState } from 'react';
import { Share2, Users, FileText, CheckSquare, Calendar, DollarSign, BookOpen, Mail, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { SharedDashboard } from '@/hooks/useSharedDashboards';

interface ShareItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: {
    id: string;
    type: 'document' | 'task' | 'event' | 'financial' | 'knowledge' | 'communication';
    title: string;
  } | null;
  dashboards: SharedDashboard[];
  onShare: (dashboardId: string, itemType: string, itemId: string, note?: string) => Promise<boolean>;
}

const ITEM_TYPE_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  document: { icon: FileText, label: 'Document', color: 'text-purple-500' },
  task: { icon: CheckSquare, label: 'Task', color: 'text-red-500' },
  event: { icon: Calendar, label: 'Event', color: 'text-green-500' },
  financial: { icon: DollarSign, label: 'Financial', color: 'text-yellow-500' },
  knowledge: { icon: BookOpen, label: 'Knowledge', color: 'text-blue-500' },
  communication: { icon: Mail, label: 'Communication', color: 'text-cyan-500' },
};

export function ShareItemDialog({
  open,
  onOpenChange,
  item,
  dashboards,
  onShare,
}: ShareItemDialogProps) {
  const [selectedDashboards, setSelectedDashboards] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!item || selectedDashboards.length === 0) return;
    
    setIsSharing(true);
    
    // Share to all selected dashboards
    const results = await Promise.all(
      selectedDashboards.map(dashboardId => 
        onShare(dashboardId, item.type, item.id, note.trim() || undefined)
      )
    );
    
    setIsSharing(false);
    
    const successCount = results.filter(Boolean).length;
    if (successCount > 0) {
      onOpenChange(false);
      setSelectedDashboards([]);
      setNote('');
    }
  };

  const toggleDashboard = (dashboardId: string) => {
    setSelectedDashboards(prev => 
      prev.includes(dashboardId)
        ? prev.filter(id => id !== dashboardId)
        : [...prev, dashboardId]
    );
  };

  if (!item) return null;

  const config = ITEM_TYPE_CONFIG[item.type] || ITEM_TYPE_CONFIG.document;
  const Icon = config.icon;

  // Filter dashboards where user can share
  const shareableDashboards = dashboards.filter(d => 
    d.my_role && ['contributor', 'editor', 'admin', 'owner'].includes(d.my_role)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 size={16} className="text-primary" />
            Share to Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item Preview */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <Icon size={16} className={config.color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <Badge variant="outline" className="text-[8px] font-mono mt-1">
                  {config.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Dashboard Selection */}
          <div className="space-y-2">
            <Label>Select Dashboard(s)</Label>
            {shareableDashboards.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-border rounded-lg">
                <Users size={20} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  No dashboards available for sharing
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Create a dashboard or ask for contributor access
                </p>
              </div>
            ) : (
              <ScrollArea className="h-40">
                <div className="space-y-1">
                  {shareableDashboards.map((dashboard) => (
                    <div
                      key={dashboard.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                        selectedDashboards.includes(dashboard.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleDashboard(dashboard.id)}
                    >
                      <Checkbox
                        checked={selectedDashboards.includes(dashboard.id)}
                        onCheckedChange={() => toggleDashboard(dashboard.id)}
                      />
                      <Users size={14} className="text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{dashboard.name}</p>
                        {dashboard.description && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {dashboard.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[8px]">
                        {dashboard.member_count} members
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Optional Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Add a note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Add context for your team..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSharing}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={selectedDashboards.length === 0 || isSharing}
          >
            {isSharing ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 size={14} className="mr-2" />
                Share to {selectedDashboards.length || ''} Dashboard{selectedDashboards.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
