import { useState } from 'react';
import { Settings2, Eye, Gauge, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AccessibilitySettingsPanel } from './AccessibilitySettingsPanel';
import { DifficultySettingsPanel } from './DifficultySettingsPanel';
import { LearningProgressPanel } from './LearningProgressPanel';

interface PersonalizationSettingsDialogProps {
  userId: string | undefined;
}

export function PersonalizationSettingsDialog({ userId }: PersonalizationSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Personalization Settings
          </DialogTitle>
          <DialogDescription>
            Customize your experience with accessibility, difficulty, and progress tracking
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="accessibility" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Accessibility
            </TabsTrigger>
            <TabsTrigger value="difficulty" className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Difficulty
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[60vh] mt-4 pr-4">
            <TabsContent value="accessibility" className="mt-0">
              <AccessibilitySettingsPanel userId={userId} />
            </TabsContent>
            
            <TabsContent value="difficulty" className="mt-0">
              <DifficultySettingsPanel userId={userId} />
            </TabsContent>
            
            <TabsContent value="progress" className="mt-0">
              <LearningProgressPanel userId={userId} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
