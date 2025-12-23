import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ToolPermissionManager } from './ToolPermissionManager';

// Sample data matching the provided JSON schema
const sampleToolSections = [
  {
    id: 'allowed',
    title: 'Allowed Tools',
    description: 'Tools this user is permitted to use.',
    droppable: true,
    items: [
      {
        tool: 'market_trend_analyzer',
        label: 'Market Trend Analyzer',
        icon: 'chart-line',
        metadata: {
          autoInvokable: true,
          category: 'Marketing'
        }
      },
      {
        tool: 'forecasting_engine',
        label: 'Forecasting Engine',
        icon: 'trending-up',
        metadata: {
          autoInvokable: true,
          category: 'Data Science'
        }
      }
    ]
  },
  {
    id: 'blocked',
    title: 'Blocked Tools',
    description: 'Tools this user is not allowed to use.',
    droppable: true,
    items: [
      {
        tool: 'contract_risk_analyzer',
        label: 'Contract Risk Analyzer',
        icon: 'shield-alert',
        metadata: {
          reason: 'Legal safety constraint',
          category: 'Legal'
        }
      }
    ]
  },
  {
    id: 'preferred',
    title: 'Preferred Tools',
    description: 'Tools the user prefers or uses frequently.',
    droppable: true,
    items: [
      {
        tool: 'market_trend_analyzer',
        label: 'Market Trend Analyzer',
        icon: 'star',
        metadata: {
          boost: 6,
          category: 'Marketing'
        }
      }
    ]
  },
  {
    id: 'available',
    title: 'Available Tools',
    description: 'Tools not yet assigned to any category.',
    droppable: true,
    items: [
      {
        tool: 'supply_chain_map',
        label: 'Supply Chain Map',
        icon: 'route',
        metadata: {
          category: 'Operations'
        }
      },
      {
        tool: 'customer_sentiment_monitor',
        label: 'Customer Sentiment Monitor',
        icon: 'message-circle',
        metadata: {
          category: 'Support'
        }
      }
    ]
  }
];

export function WorkspaceToolsDialog() {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState(sampleToolSections);

  const handleSectionsChange = (newSections: typeof sampleToolSections) => {
    setSections(newSections);
    // Here you would save to Supabase
    console.log('Tool permissions updated:', newSections);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary">
            Tool Permissions
          </DialogTitle>
          <DialogDescription>
            Drag and drop tools between sections to manage permissions for this workspace.
          </DialogDescription>
        </DialogHeader>
        
        <ToolPermissionManager
          userName="Jane Doe"
          userRole="Senior Analyst"
          sections={sections}
          onSectionsChange={handleSectionsChange}
        />
      </DialogContent>
    </Dialog>
  );
}
