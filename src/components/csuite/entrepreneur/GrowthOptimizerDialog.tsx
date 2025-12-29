import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Mail, 
  Share2, 
  Target, 
  Megaphone,
  Sparkles,
  Play,
  Pause,
  BarChart3,
  Users,
  DollarSign,
  Calendar,
  Zap,
  Globe,
  MessageSquare
} from 'lucide-react';

interface GrowthOptimizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'ads' | 'content';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  reach: number;
  conversions: number;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Product Launch Email Series', type: 'email', status: 'active', budget: 500, spent: 234, reach: 5420, conversions: 127 },
  { id: '2', name: 'LinkedIn Thought Leadership', type: 'social', status: 'active', budget: 1000, spent: 450, reach: 12300, conversions: 45 },
  { id: '3', name: 'Google Search Ads', type: 'ads', status: 'paused', budget: 2000, spent: 1200, reach: 45000, conversions: 320 },
];

const CAMPAIGN_TEMPLATES = [
  { id: 'launch', name: 'Product Launch', description: 'Multi-channel campaign for new product/feature', icon: Megaphone, color: 'hsl(var(--primary))' },
  { id: 'nurture', name: 'Lead Nurture', description: 'Email sequence to convert leads', icon: Mail, color: 'hsl(200 70% 50%)' },
  { id: 'awareness', name: 'Brand Awareness', description: 'Social media visibility campaign', icon: Share2, color: 'hsl(280 70% 50%)' },
  { id: 'retarget', name: 'Retargeting', description: 'Re-engage past visitors & customers', icon: Target, color: 'hsl(45 80% 50%)' },
];

export function GrowthOptimizerDialog({ open, onOpenChange }: GrowthOptimizerDialogProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email' as const,
    goal: '',
    budget: '',
    audience: '',
  });

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id 
        ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } 
        : c
    ));
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'draft': return 'bg-muted text-muted-foreground border-border';
      case 'completed': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email': return Mail;
      case 'social': return Share2;
      case 'ads': return Megaphone;
      case 'content': return MessageSquare;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp size={20} className="text-primary" />
            Growth Optimizer
          </DialogTitle>
          <DialogDescription>
            AI-driven marketing campaigns to accelerate your business growth
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="text-xs">
              <BarChart3 size={14} className="mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-xs">
              <Megaphone size={14} className="mr-1" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="create" className="text-xs">
              <Sparkles size={14} className="mr-1" />
              Create New
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="dashboard" className="space-y-4 pr-4">
              {/* Performance Overview */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-primary" />
                    <span className="text-[10px] font-mono text-muted-foreground">BUDGET</span>
                  </div>
                  <span className="text-lg font-bold">${totalBudget.toLocaleString()}</span>
                  <p className="text-[10px] text-muted-foreground">${totalSpent.toLocaleString()} spent</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={14} className="text-blue-500" />
                    <span className="text-[10px] font-mono text-muted-foreground">REACH</span>
                  </div>
                  <span className="text-lg font-bold">{(totalReach / 1000).toFixed(1)}K</span>
                  <p className="text-[10px] text-muted-foreground">people reached</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={14} className="text-green-500" />
                    <span className="text-[10px] font-mono text-muted-foreground">CONVERSIONS</span>
                  </div>
                  <span className="text-lg font-bold">{totalConversions}</span>
                  <p className="text-[10px] text-muted-foreground">{((totalConversions / totalReach) * 100).toFixed(2)}% rate</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className="text-purple-500" />
                    <span className="text-[10px] font-mono text-muted-foreground">ACTIVE</span>
                  </div>
                  <span className="text-lg font-bold">{campaigns.filter(c => c.status === 'active').length}</span>
                  <p className="text-[10px] text-muted-foreground">campaigns running</p>
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-primary" />
                  <span className="text-xs font-medium">AI Recommendations</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded bg-background/50">
                    <div className="w-1 h-full bg-green-500 rounded" />
                    <div>
                      <p className="text-xs font-medium">Increase LinkedIn budget by 20%</p>
                      <p className="text-[10px] text-muted-foreground">High engagement rate suggests room for growth</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-background/50">
                    <div className="w-1 h-full bg-yellow-500 rounded" />
                    <div>
                      <p className="text-xs font-medium">Reactivate Google Ads campaign</p>
                      <p className="text-[10px] text-muted-foreground">Paused campaign had strong conversion rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-3 pr-4">
              {campaigns.map((campaign) => {
                const TypeIcon = getTypeIcon(campaign.type);
                return (
                  <div 
                    key={campaign.id}
                    className="p-3 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TypeIcon size={14} className="text-primary" />
                        <span className="text-sm font-medium">{campaign.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </Badge>
                        <Switch 
                          checked={campaign.status === 'active'}
                          onCheckedChange={() => toggleCampaignStatus(campaign.id)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Budget</span>
                        <p className="font-medium">${campaign.budget}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Spent</span>
                        <p className="font-medium">${campaign.spent}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reach</span>
                        <p className="font-medium">{campaign.reach.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversions</span>
                        <p className="font-medium">{campaign.conversions}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="create" className="space-y-4 pr-4">
              {/* Campaign Templates */}
              <div>
                <Label className="text-xs mb-2 block">Choose a Template</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CAMPAIGN_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        className="p-3 rounded-lg bg-background border border-border hover:border-primary/40 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} style={{ color: template.color }} />
                          <span className="text-xs font-medium group-hover:text-primary transition-colors">
                            {template.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{template.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div>
                  <Label className="text-xs">Campaign Name</Label>
                  <Input 
                    placeholder="e.g., Q1 Product Launch"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Campaign Goal</Label>
                  <Textarea 
                    placeholder="What do you want to achieve with this campaign?"
                    value={newCampaign.goal}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, goal: e.target.value }))}
                    className="mt-1 min-h-[60px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Budget ($)</Label>
                    <Input 
                      type="number"
                      placeholder="1000"
                      value={newCampaign.budget}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Target Audience</Label>
                    <Input 
                      placeholder="e.g., SaaS founders"
                      value={newCampaign.audience}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, audience: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button className="w-full mt-4">
                  <Sparkles size={14} className="mr-2" />
                  Generate AI Campaign
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}