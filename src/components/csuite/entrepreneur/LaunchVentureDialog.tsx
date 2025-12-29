import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Rocket, 
  Target, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  FileText,
  TrendingUp,
  Globe
} from 'lucide-react';

interface LaunchVentureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  { id: 'idea', label: 'Business Idea', icon: Sparkles },
  { id: 'market', label: 'Target Market', icon: Users },
  { id: 'revenue', label: 'Revenue Model', icon: DollarSign },
  { id: 'roadmap', label: 'Roadmap', icon: Target },
  { id: 'summary', label: 'Summary', icon: FileText },
];

export function LaunchVentureDialog({ open, onOpenChange }: LaunchVentureDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [ventureData, setVentureData] = useState({
    name: '',
    tagline: '',
    problem: '',
    solution: '',
    targetAudience: '',
    marketSize: '',
    competitors: '',
    uniqueValue: '',
    revenueStreams: '',
    pricing: '',
    initialCosts: '',
    milestones: '',
    timeline: '',
    resources: '',
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateField = (field: string, value: string) => {
    setVentureData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGeneratePlan = () => {
    // TODO: Integrate with AI to generate full business plan
    console.log('Generating business plan:', ventureData);
    onOpenChange(false);
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'idea':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-primary" />
                <span className="text-sm font-medium">Define Your Vision</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Start with a clear articulation of what problem you're solving and how.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Venture Name</Label>
                <Input 
                  placeholder="e.g., TechFlow Solutions"
                  value={ventureData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Tagline</Label>
                <Input 
                  placeholder="e.g., Automate your workflow in minutes"
                  value={ventureData.tagline}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Problem Statement</Label>
                <Textarea 
                  placeholder="What problem are you solving? Who experiences this problem?"
                  value={ventureData.problem}
                  onChange={(e) => updateField('problem', e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-xs">Your Solution</Label>
                <Textarea 
                  placeholder="How does your product/service solve this problem?"
                  value={ventureData.solution}
                  onChange={(e) => updateField('solution', e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>
          </div>
        );

      case 'market':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-blue-500" />
                <span className="text-sm font-medium">Know Your Market</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Understanding your target audience and competition is crucial for success.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Target Audience</Label>
                <Textarea 
                  placeholder="Who are your ideal customers? Demographics, behaviors, needs..."
                  value={ventureData.targetAudience}
                  onChange={(e) => updateField('targetAudience', e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-xs">Market Size (TAM/SAM/SOM)</Label>
                <Input 
                  placeholder="e.g., $50B TAM, $5B SAM, $500M SOM"
                  value={ventureData.marketSize}
                  onChange={(e) => updateField('marketSize', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Key Competitors</Label>
                <Textarea 
                  placeholder="Who are your main competitors? What are their strengths/weaknesses?"
                  value={ventureData.competitors}
                  onChange={(e) => updateField('competitors', e.target.value)}
                  className="mt-1 min-h-[60px]"
                />
              </div>
              <div>
                <Label className="text-xs">Unique Value Proposition</Label>
                <Textarea 
                  placeholder="What makes you different? Why will customers choose you?"
                  value={ventureData.uniqueValue}
                  onChange={(e) => updateField('uniqueValue', e.target.value)}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          </div>
        );

      case 'revenue':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-green-500" />
                <span className="text-sm font-medium">Revenue Strategy</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Define how your venture will generate sustainable revenue.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Revenue Streams</Label>
                <Textarea 
                  placeholder="How will you make money? (subscriptions, one-time sales, freemium, etc.)"
                  value={ventureData.revenueStreams}
                  onChange={(e) => updateField('revenueStreams', e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-xs">Pricing Strategy</Label>
                <Input 
                  placeholder="e.g., $29/mo starter, $99/mo pro, $299/mo enterprise"
                  value={ventureData.pricing}
                  onChange={(e) => updateField('pricing', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Initial Costs & Investment Needed</Label>
                <Textarea 
                  placeholder="What are your startup costs? How much funding do you need?"
                  value={ventureData.initialCosts}
                  onChange={(e) => updateField('initialCosts', e.target.value)}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          </div>
        );

      case 'roadmap':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-purple-500" />
                <span className="text-sm font-medium">Execution Roadmap</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Plan your milestones and resource allocation for the first year.
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Key Milestones</Label>
                <Textarea 
                  placeholder="What are your major milestones? (MVP launch, first 100 customers, etc.)"
                  value={ventureData.milestones}
                  onChange={(e) => updateField('milestones', e.target.value)}
                  className="mt-1 min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-xs">Timeline</Label>
                <Input 
                  placeholder="e.g., MVP in 3 months, launch in 6 months, profitability in 18 months"
                  value={ventureData.timeline}
                  onChange={(e) => updateField('timeline', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Required Resources</Label>
                <Textarea 
                  placeholder="What resources do you need? (team, tools, partnerships, etc.)"
                  value={ventureData.resources}
                  onChange={(e) => updateField('resources', e.target.value)}
                  className="mt-1 min-h-[60px]"
                />
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-primary" />
                <span className="text-sm font-medium">Venture Summary</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Review your venture details and generate your business plan.
              </p>
            </div>

            <ScrollArea className="h-[280px]">
              <div className="space-y-3 pr-4">
                <div className="p-3 rounded bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket size={14} className="text-primary" />
                    <span className="text-xs font-medium">{ventureData.name || 'Untitled Venture'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{ventureData.tagline || 'No tagline yet'}</p>
                </div>

                {ventureData.problem && (
                  <div className="p-2 rounded bg-background border border-border">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Problem</span>
                    <p className="text-xs mt-1">{ventureData.problem}</p>
                  </div>
                )}

                {ventureData.solution && (
                  <div className="p-2 rounded bg-background border border-border">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Solution</span>
                    <p className="text-xs mt-1">{ventureData.solution}</p>
                  </div>
                )}

                {ventureData.targetAudience && (
                  <div className="p-2 rounded bg-background border border-border">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Target Market</span>
                    <p className="text-xs mt-1">{ventureData.targetAudience}</p>
                  </div>
                )}

                {ventureData.revenueStreams && (
                  <div className="p-2 rounded bg-background border border-border">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Revenue Model</span>
                    <p className="text-xs mt-1">{ventureData.revenueStreams}</p>
                  </div>
                )}

                {ventureData.milestones && (
                  <div className="p-2 rounded bg-background border border-border">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Key Milestones</span>
                    <p className="text-xs mt-1">{ventureData.milestones}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket size={20} className="text-primary" />
            Launch New Venture
          </DialogTitle>
          <DialogDescription>
            Create a structured business plan for your new initiative
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      idx === currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : idx < currentStep 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx < currentStep ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step Content */}
        <ScrollArea className="max-h-[400px]">
          {renderStepContent()}
        </ScrollArea>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft size={14} className="mr-1" />
            Back
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button size="sm" onClick={handleGeneratePlan}>
              <Sparkles size={14} className="mr-1" />
              Generate Business Plan
            </Button>
          ) : (
            <Button size="sm" onClick={nextStep}>
              Next
              <ArrowRight size={14} className="ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}