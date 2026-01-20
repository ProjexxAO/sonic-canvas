import { Eye, Volume2, VolumeX, Type, Zap, Palette, Keyboard } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAccessibilitySettings, AccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';

interface AccessibilitySettingsPanelProps {
  userId: string | undefined;
}

export function AccessibilitySettingsPanel({ userId }: AccessibilitySettingsPanelProps) {
  const { settings, isLoading, updateSettings } = useAccessibilitySettings(userId);
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

  const handleUpdate = (updates: Partial<AccessibilitySettings>) => {
    playClick();
    updateSettings(updates);
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Eye className="w-5 h-5 text-primary" />
          Accessibility Settings
        </CardTitle>
        <CardDescription>
          Customize your experience for better accessibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Type className="w-4 h-4" />
            Visual
          </h4>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-size">Font Size</Label>
              <Select
                value={settings.font_size}
                onValueChange={(value) => handleUpdate({ font_size: value as AccessibilitySettings['font_size'] })}
              >
                <SelectTrigger id="font-size" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="x-large">X-Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="high-contrast">High Contrast</Label>
                <p className="text-xs text-muted-foreground">Increase color contrast</p>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.high_contrast}
                onCheckedChange={(checked) => handleUpdate({ high_contrast: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dyslexia">Dyslexia-Friendly Font</Label>
                <p className="text-xs text-muted-foreground">Use OpenDyslexic font</p>
              </div>
              <Switch
                id="dyslexia"
                checked={settings.dyslexia_friendly}
                onCheckedChange={(checked) => handleUpdate({ dyslexia_friendly: checked })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Motion Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Motion
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reduced-motion">Reduce Motion</Label>
              <p className="text-xs text-muted-foreground">Minimize animations</p>
            </div>
            <Switch
              id="reduced-motion"
              checked={settings.reduced_motion}
              onCheckedChange={(checked) => handleUpdate({ reduced_motion: checked })}
            />
          </div>
        </div>

        <Separator />

        {/* Audio Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            {settings.audio_feedback_enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Audio Feedback
          </h4>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="audio-feedback">Enable Audio Cues</Label>
                <p className="text-xs text-muted-foreground">Sound feedback for actions</p>
              </div>
              <Switch
                id="audio-feedback"
                checked={settings.audio_feedback_enabled}
                onCheckedChange={(checked) => handleUpdate({ audio_feedback_enabled: checked })}
              />
            </div>

            {settings.audio_feedback_enabled && (
              <div className="space-y-2">
                <Label>Volume: {Math.round(settings.audio_volume * 100)}%</Label>
                <Slider
                  value={[settings.audio_volume * 100]}
                  onValueChange={([value]) => handleUpdate({ audio_volume: value / 100 })}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Color Vision */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Color Vision
          </h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="color-blind-mode">Color Blind Mode</Label>
            <Select
              value={settings.color_blind_mode || 'none'}
              onValueChange={(value) => handleUpdate({ 
                color_blind_mode: value === 'none' ? null : value as AccessibilitySettings['color_blind_mode']
              })}
            >
              <SelectTrigger id="color-blind-mode" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="protanopia">Protanopia</SelectItem>
                <SelectItem value="deuteranopia">Deuteranopia</SelectItem>
                <SelectItem value="tritanopia">Tritanopia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Navigation
          </h4>
          
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="keyboard-hints">Keyboard Navigation Hints</Label>
                <p className="text-xs text-muted-foreground">Show shortcut hints</p>
              </div>
              <Switch
                id="keyboard-hints"
                checked={settings.keyboard_navigation_hints}
                onCheckedChange={(checked) => handleUpdate({ keyboard_navigation_hints: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="screen-reader">Screen Reader Optimization</Label>
                <p className="text-xs text-muted-foreground">Enhanced ARIA labels</p>
              </div>
              <Switch
                id="screen-reader"
                checked={settings.screen_reader_optimized}
                onCheckedChange={(checked) => handleUpdate({ screen_reader_optimized: checked })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
