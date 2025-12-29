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
  Zap, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Sparkles,
  BarChart3,
  Globe,
  Lightbulb,
  Scale
} from 'lucide-react';

interface IdeaValidatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationResult {
  category: string;
  score: number;
  status: 'strong' | 'moderate' | 'weak';
  insights: string[];
  icon: React.ElementType;
}

export function IdeaValidatorDialog({ open, onOpenChange }: IdeaValidatorDialogProps) {
  const [ideaInput, setIdeaInput] = useState({
    name: '',
    description: '',
    targetAudience: '',
    problem: '',
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  const runValidation = async () => {
    setIsValidating(true);
    
    // Simulate AI validation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock validation results
    const results: ValidationResult[] = [
      {
        category: 'Market Demand',
        score: 78,
        status: 'strong',
        insights: [
          'Growing market with 15% YoY increase',
          'Strong search volume for related keywords',
          'Multiple successful competitors validate demand'
        ],
        icon: TrendingUp
      },
      {
        category: 'Competition Analysis',
        score: 65,
        status: 'moderate',
        insights: [
          '3-5 established players in the space',
          'Opportunity for differentiation exists',
          'No dominant market leader yet'
        ],
        icon: Target
      },
      {
        category: 'Revenue Potential',
        score: 72,
        status: 'strong',
        insights: [
          'Average customer LTV: $2,400/year',
          'Subscription model is viable',
          'Upsell opportunities identified'
        ],
        icon: DollarSign
      },
      {
        category: 'Target Audience',
        score: 85,
        status: 'strong',
        insights: [
          'Well-defined audience segment',
          'Reachable through digital channels',
          'High willingness to pay for solutions'
        ],
        icon: Users
      },
      {
        category: 'Execution Feasibility',
        score: 58,
        status: 'moderate',
        insights: [
          'Technical complexity is manageable',
          'MVP can be built in 3-4 months',
          'May require specialized skills'
        ],
        icon: Zap
      },
    ];
    
    setValidationResults(results);
    setOverallScore(Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length));
    setIsValidating(false);
    setValidationComplete(true);
  };

  const resetValidation = () => {
    setValidationComplete(false);
    setValidationResults([]);
    setOverallScore(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: ValidationResult['status']) => {
    switch (status) {
      case 'strong':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-[10px]">Strong</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-[10px]">Moderate</Badge>;
      case 'weak':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-[10px]">Needs Work</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb size={20} className="text-yellow-500" />
            Idea Validator
          </DialogTitle>
          <DialogDescription>
            AI-powered validation to assess your business idea's potential
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[500px]">
          {!validationComplete ? (
            <div className="space-y-4 pr-4">
              {/* Input Form */}
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-yellow-500" />
                  <span className="text-xs font-medium">Describe Your Idea</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Provide details about your business idea for AI analysis
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Idea Name</Label>
                  <Input 
                    placeholder="e.g., AI-Powered Expense Tracker"
                    value={ideaInput.name}
                    onChange={(e) => setIdeaInput(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Describe Your Idea</Label>
                  <Textarea 
                    placeholder="What is your product/service? How does it work?"
                    value={ideaInput.description}
                    onChange={(e) => setIdeaInput(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-xs">Target Audience</Label>
                  <Input 
                    placeholder="e.g., Small business owners, freelancers"
                    value={ideaInput.targetAudience}
                    onChange={(e) => setIdeaInput(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Problem You're Solving</Label>
                  <Textarea 
                    placeholder="What pain point does this address?"
                    value={ideaInput.problem}
                    onChange={(e) => setIdeaInput(prev => ({ ...prev, problem: e.target.value }))}
                    className="mt-1 min-h-[60px]"
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={runValidation}
                disabled={isValidating || !ideaInput.name || !ideaInput.description}
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search size={14} className="mr-2" />
                    Validate Idea
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {/* Overall Score */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-center">
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Viability Score</span>
                <div className={`text-4xl font-bold my-2 ${getScoreColor(overallScore)}`}>
                  {overallScore}/100
                </div>
                <div className="flex items-center justify-center gap-2">
                  {overallScore >= 70 ? (
                    <>
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-sm text-green-600">Strong potential - worth pursuing</span>
                    </>
                  ) : overallScore >= 50 ? (
                    <>
                      <AlertTriangle size={16} className="text-yellow-500" />
                      <span className="text-sm text-yellow-600">Moderate potential - needs refinement</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-sm text-red-600">High risk - consider pivoting</span>
                    </>
                  )}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-3">
                {validationResults.map((result) => {
                  const Icon = result.icon;
                  return (
                    <div 
                      key={result.category}
                      className="p-3 rounded-lg bg-background border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={getScoreColor(result.score)} />
                          <span className="text-sm font-medium">{result.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${getScoreColor(result.score)}`}>
                            {result.score}
                          </span>
                          {getStatusBadge(result.status)}
                        </div>
                      </div>
                      
                      <Progress 
                        value={result.score} 
                        className="h-1 mb-2"
                      />
                      
                      <div className="space-y-1">
                        {result.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5" />
                            <span className="text-[10px] text-muted-foreground">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={resetValidation}>
                  Validate Another Idea
                </Button>
                <Button className="flex-1">
                  <Sparkles size={14} className="mr-2" />
                  Refine & Improve
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}