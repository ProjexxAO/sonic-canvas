import { useState } from 'react';
import { 
  Sparkles, 
  Loader2, 
  Wand2, 
  BarChart3, 
  Bot, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Palette,
  Database,
  Brain
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useCustomWidgets, CreateWidgetRequest, DataSource } from '@/hooks/useCustomWidgets';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WidgetCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWidgetCreated?: () => void;
}

interface GeneratedWidget {
  name: string;
  description: string;
  widget_type: string;
  config: any;
  data_sources: DataSource[];
  ai_capabilities: any;
  layout: { colSpan: number };
  style: { icon?: string; color?: string };
  explanation: string;
  agent_chain?: string[];
}

type CreationStep = 'prompt' | 'generating' | 'preview' | 'created';

const AVAILABLE_DATA_SOURCES: DataSource[] = [
  'tasks', 'goals', 'habits', 'finance', 'calendar', 'email', 'documents', 'photos'
];

const WIDGET_TYPE_INFO = {
  'data-display': { icon: BarChart3, label: 'Data Display', color: 'text-blue-500' },
  'ai-assistant': { icon: Bot, label: 'AI Assistant', color: 'text-purple-500' },
  'automation': { icon: Zap, label: 'Automation', color: 'text-yellow-500' },
  'hybrid': { icon: Sparkles, label: 'Hybrid', color: 'text-pink-500' },
};

export function WidgetCreatorDialog({ open, onOpenChange, onWidgetCreated }: WidgetCreatorDialogProps) {
  const { user } = useAuth();
  const { createWidget, widgets } = useCustomWidgets();
  const [step, setStep] = useState<CreationStep>('prompt');
  const [prompt, setPrompt] = useState('');
  const [generatedWidget, setGeneratedWidget] = useState<GeneratedWidget | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || !user?.id) return;
    
    setStep('generating');
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data, error: funcError } = await supabase.functions.invoke('widget-generator', {
        body: {
          prompt: prompt.trim(),
          userId: user.id,
          availableDataSources: AVAILABLE_DATA_SOURCES,
          existingWidgets: widgets.map(w => w.name),
        }
      });

      if (funcError) throw funcError;
      if (!data?.success || !data?.widget) {
        throw new Error(data?.error || 'Failed to generate widget');
      }

      setGeneratedWidget(data.widget);
      setStep('preview');
    } catch (err) {
      console.error('Widget generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate widget');
      setStep('prompt');
      toast.error('Failed to generate widget. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!generatedWidget) return;

    const request: CreateWidgetRequest = {
      name: generatedWidget.name,
      description: generatedWidget.description,
      widget_type: generatedWidget.widget_type as any,
      config: generatedWidget.config,
      data_sources: generatedWidget.data_sources,
      ai_capabilities: generatedWidget.ai_capabilities,
      layout: generatedWidget.layout,
      style: generatedWidget.style,
      generation_prompt: prompt,
      agent_chain: generatedWidget.agent_chain,
    };

    const created = await createWidget(request);
    if (created) {
      setStep('created');
      setTimeout(() => {
        onWidgetCreated?.();
        handleClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    setStep('prompt');
    setPrompt('');
    setGeneratedWidget(null);
    setError(null);
    onOpenChange(false);
  };

  const getTypeInfo = (type: string) => {
    return WIDGET_TYPE_INFO[type as keyof typeof WIDGET_TYPE_INFO] || WIDGET_TYPE_INFO['data-display'];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="text-primary" size={20} />
            Create Custom Widget
          </DialogTitle>
          <DialogDescription>
            Tell Atlas what you want to track, visualize, or automate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step: Prompt */}
          {step === 'prompt' && (
            <>
              <Textarea
                placeholder="Example: Create a widget that shows my weekly spending trends with AI insights on where I can save money..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] text-muted-foreground mr-1">Try:</span>
                {[
                  'Track my daily habits with streak visualization',
                  'Show upcoming deadlines with priority alerts',
                  'AI coach for my fitness goals',
                  'Email summary with action items'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="text-[9px] px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
              >
                <Sparkles size={14} className="mr-2" />
                Generate with Atlas
              </Button>
            </>
          )}

          {/* Step: Generating */}
          {step === 'generating' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="relative">
                <Loader2 size={40} className="animate-spin text-primary" />
                <Brain size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Atlas is designing your widget...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Orchestrating AI agents to create the perfect configuration
                </p>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && generatedWidget && (
            <div className="flex flex-col">
              <ScrollArea className="max-h-[320px]">
                <div className="space-y-4 pr-2">
                  {/* Widget Preview Card */}
                  <div className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{generatedWidget.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{generatedWidget.description}</p>
                      </div>
                      {(() => {
                        const info = getTypeInfo(generatedWidget.widget_type);
                        const Icon = info.icon;
                        return (
                          <div className={cn("p-2 rounded-lg bg-muted", info.color)}>
                            <Icon size={16} />
                          </div>
                        );
                      })()}
                    </div>

                    {/* Widget Type Badge */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant="secondary" className="text-[9px]">
                        {getTypeInfo(generatedWidget.widget_type).label}
                      </Badge>
                      {generatedWidget.config.displayType && (
                        <Badge variant="outline" className="text-[9px]">
                          {generatedWidget.config.displayType}
                        </Badge>
                      )}
                      {generatedWidget.ai_capabilities?.enabled && (
                        <Badge className="text-[9px] bg-purple-500/20 text-purple-500">
                          <Brain size={8} className="mr-1" />
                          AI Powered
                        </Badge>
                      )}
                    </div>

                    {/* Data Sources */}
                    {generatedWidget.data_sources.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                          <Database size={10} />
                          Data Sources
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {generatedWidget.data_sources.map((source) => (
                            <Badge key={source} variant="outline" className="text-[9px] capitalize">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Capabilities */}
                    {generatedWidget.ai_capabilities?.capabilities?.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                          <Brain size={10} />
                          AI Capabilities
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {generatedWidget.ai_capabilities.capabilities.map((cap: string) => (
                            <Badge key={cap} className="text-[9px] bg-primary/20 text-primary capitalize">
                              {cap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Agents */}
                    {generatedWidget.agent_chain?.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                          <Bot size={10} />
                          Orchestrated Agents
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {generatedWidget.agent_chain.map((agent) => (
                            <Badge key={agent} variant="secondary" className="text-[9px] capitalize">
                              {agent.replace(/-/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Layout */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Palette size={10} />
                      Width: {generatedWidget.layout.colSpan} columns
                      {generatedWidget.style.color && (
                        <span className="ml-2 capitalize">• {generatedWidget.style.color} accent</span>
                      )}
                    </div>
                  </div>

                  {/* Atlas Explanation */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-2">
                      <Sparkles size={14} className="text-primary mt-0.5" />
                      <div>
                        <p className="text-[10px] font-medium text-primary mb-1">Atlas says:</p>
                        <p className="text-xs text-muted-foreground">{generatedWidget.explanation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Actions - Fixed at bottom, always visible */}
              <div className="flex gap-2 pt-4 mt-4 border-t border-border">
                <Button variant="outline" onClick={() => setStep('prompt')} className="flex-1">
                  Refine
                </Button>
                <Button onClick={handleCreate} className="flex-1">
                  <CheckCircle2 size={14} className="mr-2" />
                  Add to Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Step: Created */}
          {step === 'created' && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Widget Created!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  "{generatedWidget?.name}" has been added to your dashboard
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
