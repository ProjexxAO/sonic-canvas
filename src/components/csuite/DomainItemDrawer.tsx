import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Mail, 
  FileText, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  BookOpen,
  X,
  Clock,
  MapPin,
  Users,
  Tag,
  AlertCircle,
  Trash2
} from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  DomainItem, 
  DomainKey,
  CommunicationItem,
  DocumentItem,
  EventItem,
  FinancialItem,
  TaskItem,
  KnowledgeItem
} from '@/hooks/useCSuiteData';

interface DomainItemDrawerProps {
  item: DomainItem | null;
  domain: DomainKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (domain: DomainKey, itemId: string, filePath?: string) => Promise<boolean>;
}

const DOMAIN_ICONS: Record<DomainKey, typeof Mail> = {
  communications: Mail,
  documents: FileText,
  events: Calendar,
  financials: DollarSign,
  tasks: CheckSquare,
  knowledge: BookOpen,
};

const DOMAIN_COLORS: Record<DomainKey, string> = {
  communications: 'hsl(200 70% 50%)',
  documents: 'hsl(280 70% 50%)',
  events: 'hsl(150 70% 45%)',
  financials: 'hsl(45 80% 50%)',
  tasks: 'hsl(350 70% 50%)',
  knowledge: 'hsl(220 70% 55%)',
};

export function DomainItemDrawer({ item, domain, open, onOpenChange, onDelete }: DomainItemDrawerProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!item || !domain) return null;

  const Icon = DOMAIN_ICONS[domain];
  const color = DOMAIN_COLORS[domain];

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    const filePath = domain === 'documents' ? (item as DocumentItem).file_path : undefined;
    const success = await onDelete(domain, item.id, filePath);
    setIsDeleting(false);
    
    if (success) {
      setShowDeleteConfirm(false);
      onOpenChange(false);
    }
  };

  const renderDomainSpecificContent = () => {
    switch (domain) {
      case 'communications': {
        const comm = item as CommunicationItem;
        return (
          <div className="space-y-3">
            {comm.from_address && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-12">FROM</span>
                <span className="text-xs text-foreground">{comm.from_address}</span>
              </div>
            )}
            {comm.to_addresses && comm.to_addresses.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-12">TO</span>
                <div className="flex flex-wrap gap-1">
                  {comm.to_addresses.map((addr, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {addr}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'documents': {
        const doc = item as DocumentItem;
        return (
          <div className="space-y-3">
            {doc.mime_type && (
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{doc.mime_type}</span>
              </div>
            )}
            {doc.file_size && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">SIZE</span>
                <span className="text-xs text-foreground">
                  {(doc.file_size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </div>
        );
      }

      case 'events': {
        const event = item as EventItem;
        return (
          <div className="space-y-3">
            {event.start_at && (
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-xs text-foreground">
                  {format(event.start_at, 'PPp')}
                  {event.end_at && ` - ${format(event.end_at, 'p')}`}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-muted-foreground" />
                <span className="text-xs text-foreground">{event.location}</span>
              </div>
            )}
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-start gap-2">
                <Users size={12} className="text-muted-foreground mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {event.attendees.slice(0, 5).map((attendee, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {attendee}
                    </Badge>
                  ))}
                  {event.attendees.length > 5 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{event.attendees.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'financials': {
        const fin = item as FinancialItem;
        return (
          <div className="space-y-3">
            {fin.amount !== undefined && (
              <div className="flex items-center gap-2">
                <DollarSign size={12} className="text-muted-foreground" />
                <span className="text-lg font-mono text-foreground">
                  {fin.currency || 'USD'} {fin.amount.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              {fin.category && (
                <Badge variant="secondary" className="text-[10px]">
                  {fin.category}
                </Badge>
              )}
              {fin.status && (
                <Badge 
                  variant={fin.status === 'completed' ? 'default' : 'outline'} 
                  className="text-[10px]"
                >
                  {fin.status}
                </Badge>
              )}
            </div>
          </div>
        );
      }

      case 'tasks': {
        const task = item as TaskItem;
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              {task.status && (
                <Badge 
                  variant={task.status === 'completed' ? 'default' : 'secondary'} 
                  className="text-[10px]"
                >
                  {task.status}
                </Badge>
              )}
              {task.priority && (
                <Badge 
                  variant={task.priority === 'high' ? 'destructive' : 'outline'} 
                  className="text-[10px]"
                >
                  <AlertCircle size={10} className="mr-1" />
                  {task.priority}
                </Badge>
              )}
            </div>
            {task.due_date && (
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-muted-foreground" />
                <span className="text-xs text-foreground">
                  Due: {format(task.due_date, 'PPP')}
                </span>
              </div>
            )}
            {task.assigned_to && (
              <div className="flex items-center gap-2">
                <Users size={12} className="text-muted-foreground" />
                <span className="text-xs text-foreground">{task.assigned_to}</span>
              </div>
            )}
          </div>
        );
      }

      case 'knowledge': {
        const know = item as KnowledgeItem;
        return (
          <div className="space-y-3">
            {know.category && (
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-muted-foreground" />
                <Badge variant="secondary" className="text-[10px]">
                  {know.category}
                </Badge>
              </div>
            )}
            {know.tags && know.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {know.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon size={14} style={{ color }} />
            </div>
            <div className="flex-1">
              <DrawerTitle className="text-sm font-mono">{item.title}</DrawerTitle>
              <DrawerDescription className="text-[10px]">
                {format(item.date, 'PPp')} • {item.type}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <ScrollArea className="flex-1 p-4 max-h-[50vh]">
          <div className="space-y-4">
            {/* Domain-specific content */}
            {renderDomainSpecificContent()}

            <Separator />

            {/* Preview / Content */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-muted-foreground">CONTENT</span>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {item.preview || 'No content available'}
              </p>
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t border-border">
          <div className="flex gap-2 w-full">
            {onDelete && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="text-xs font-mono"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={12} className="mr-1" />
                DELETE
              </Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline" size="sm" className="text-xs font-mono flex-1">
                <X size={12} className="mr-1" />
                CLOSE
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {domain.slice(0, -1)}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{item.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Drawer>
  );
}
