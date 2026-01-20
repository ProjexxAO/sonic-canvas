import { Gauge, Brain, FileText, Bot, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useDifficultyPreferences, DifficultyLevel, ReportComplexity, AutonomyPreference } from '@/hooks/useDifficultyPreferences';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';

interface DifficultySettingsPanelProps {
  userId: string | undefined;
}

const DIFFICULTY_LABELS: Record<DifficultyLevel, { label: string; description: string; color: string }> = {
  beginner: { label: 'Beginner', description: 'Simplified interface, guided workflows', color: 'bg-green-500/20 text-green-400' },
  standard: { label: 'Standard', description: 'Balanced features and complexity', color: 'bg-blue-500/20 text-blue-400' },
  advanced: { label: 'Advanced', description: 'Full features, minimal hand-holding', color: 'bg-orange-500/20 text-orange-400' },
  expert: { label: 'Expert', description: 'All features, technical details exposed', color: 'bg-purple-500/20 text-purple-400' },
};

const COMPLEXITY_LABELS: Record<ReportComplexity, string> = {
  brief: 'Brief (Key highlights only)',
  standard: 'Standard (Balanced detail)',
  detailed: 'Detailed (In-depth analysis)',
  comprehensive: 'Comprehensive (Full data)',
};

const AUTONOMY_LABELS: Record<AutonomyPreference, { label: string; description: string }> = {
  human_led: { label: 'Human-Led', description: 'You control all actions' },
  supervised: { label: 'Supervised', description: 'AI suggests, you approve' },
  full_auto: { label: 'Full Auto', description: 'AI handles routine tasks' },
};

export function DifficultySettingsPanel({ userId }: DifficultySettingsPanelProps) {
  const { preferences, isLoading, updatePreferences } = useDifficultyPreferences(userId);
  const { playClick } = useAudioFeedback(userId);

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = (updates: Parameters<typeof updatePreferences>[0]) => {
    playClick();
    updatePreferences(updates);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="w-5 h-5 text-primary" />
          Difficulty & Complexity
        </CardTitle>
        <CardDescription>
          Adjust the complexity of features and content to match your expertise
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Difficulty */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Experience Level
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Global Difficulty</Label>
              <Badge className={DIFFICULTY_LABELS[preferences.global_difficulty].color}>
                {DIFFICULTY_LABELS[preferences.global_difficulty].label}
              </Badge>
            </div>
            
            <Select
              value={preferences.global_difficulty}
              onValueChange={(value) => handleUpdate({ global_difficulty: value as DifficultyLevel })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DIFFICULTY_LABELS).map(([key, { label, description }]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label htmlFor="auto-adjust">Auto-Adjust Difficulty</Label>
                <p className="text-xs text-muted-foreground">Adapt based on your usage patterns</p>
              </div>
              <Switch
                id="auto-adjust"
                checked={preferences.auto_adjust_enabled}
                onCheckedChange={(checked) => handleUpdate({ auto_adjust_enabled: checked })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Report Complexity */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Report Complexity
          </h4>
          
          <div className="flex items-center justify-between">
            <Label>Default Report Depth</Label>
            <Select
              value={preferences.report_complexity}
              onValueChange={(value) => handleUpdate({ report_complexity: value as ReportComplexity })}
            >
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COMPLEXITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Agent Autonomy */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Agent Autonomy
          </h4>
          
          <div className="space-y-3">
            <Label>Default Autonomy Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(AUTONOMY_LABELS) as [AutonomyPreference, typeof AUTONOMY_LABELS[AutonomyPreference]][]).map(([key, { label, description }]) => (
                <button
                  key={key}
                  onClick={() => handleUpdate({ agent_autonomy_preference: key })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    preferences.agent_autonomy_preference === key
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Advanced Features */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Advanced Features
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="advanced-features">Show Advanced Features</Label>
              <p className="text-xs text-muted-foreground">Enable power-user capabilities</p>
            </div>
            <Switch
              id="advanced-features"
              checked={preferences.show_advanced_features}
              onCheckedChange={(checked) => handleUpdate({ show_advanced_features: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
