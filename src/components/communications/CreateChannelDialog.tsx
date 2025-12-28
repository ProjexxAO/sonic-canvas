import { useState } from 'react';
import { Hash, Lock, Megaphone, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ChannelType, Channel } from '@/hooks/useCommunications';
import { cn } from '@/lib/utils';

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChannel: (
    name: string,
    type: ChannelType,
    memberIds: string[],
    description?: string
  ) => Promise<Channel | null>;
}

const CHANNEL_TYPES = [
  {
    type: 'public' as ChannelType,
    label: 'Public',
    description: 'Anyone can join and view messages',
    icon: Hash,
  },
  {
    type: 'private' as ChannelType,
    label: 'Private',
    description: 'Only invited members can see this channel',
    icon: Lock,
  },
  {
    type: 'announcement' as ChannelType,
    label: 'Announcement',
    description: 'Only admins can post, everyone can view',
    icon: Megaphone,
  },
];

export function CreateChannelDialog({
  open,
  onOpenChange,
  onCreateChannel,
}: CreateChannelDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channelType, setChannelType] = useState<ChannelType>('public');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    const channel = await onCreateChannel(
      name.trim(),
      channelType,
      [],
      description.trim() || undefined
    );

    setIsCreating(false);

    if (channel) {
      // Reset form
      setName('');
      setDescription('');
      setChannelType('public');
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Create a Channel</DialogTitle>
          <DialogDescription>
            Channels are where your team communicates. They're best organized around topics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Channel Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Channel name</Label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g. marketing-team"
                className="pl-8"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Names must be lowercase, without spaces or special characters.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Channel Type */}
          <div className="space-y-2">
            <Label>Channel type</Label>
            <RadioGroup
              value={channelType}
              onValueChange={(v) => setChannelType(v as ChannelType)}
              className="space-y-2"
            >
              {CHANNEL_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = channelType === type.type;

                return (
                  <label
                    key={type.type}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                    )}
                  >
                    <RadioGroupItem value={type.type} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={isSelected ? 'text-primary' : 'text-muted-foreground'} />
                        <span className="font-medium text-sm">{type.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            {isCreating ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Channel'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
