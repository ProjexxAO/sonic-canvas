import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Tag,
  Hash,
  Calendar,
  Code,
  Sparkles,
  FileStack,
  Check,
  Copy
} from 'lucide-react';
import { useDocumentAudit, VersionNamingScheme, VersionNamingConfig } from '@/hooks/useDocumentAudit';
import { toast } from 'sonner';

interface VersionNamingSettingsProps {
  onConfigChange?: (config: VersionNamingConfig) => void;
}

export function VersionNamingSettings({ onConfigChange }: VersionNamingSettingsProps) {
  const { namingConfig, updateNamingConfig, formatVersionNumber, suggestVersionName } = useDocumentAudit();
  const [customFormat, setCustomFormat] = useState(namingConfig.customFormat || '{major}.{minor}');
  
  const handleSchemeChange = (scheme: VersionNamingScheme) => {
    updateNamingConfig({ scheme });
    onConfigChange?.({ ...namingConfig, scheme });
  };

  const handleToggle = (key: keyof VersionNamingConfig, value: boolean) => {
    updateNamingConfig({ [key]: value });
    onConfigChange?.({ ...namingConfig, [key]: value });
  };

  const handlePrefixChange = (prefix: string) => {
    updateNamingConfig({ prefix });
    onConfigChange?.({ ...namingConfig, prefix });
  };

  const handleCustomFormatChange = (format: string) => {
    setCustomFormat(format);
    updateNamingConfig({ customFormat: format });
    onConfigChange?.({ ...namingConfig, customFormat: format });
  };

  // Preview examples
  const examples = [
    { label: 'Basic', version: formatVersionNumber(1, 0) },
    { label: 'Minor Update', version: formatVersionNumber(1, 3) },
    { label: 'Enhanced', version: formatVersionNumber(1, 2, { isEnhanced: true }) },
    { label: 'Summary', version: formatVersionNumber(1, 1, { isSummary: true }) },
    { label: 'Draft', version: formatVersionNumber(2, 0, { isDraft: true }) },
    { label: 'Final', version: formatVersionNumber(2, 1, { isFinal: true }) },
  ];

  const copyExample = (version: string) => {
    navigator.clipboard.writeText(version);
    toast.success('Copied to clipboard');
  };

  const schemeOptions = [
    {
      value: 'semantic' as VersionNamingScheme,
      label: 'Semantic Versioning',
      description: 'Standard v1.0, v1.1, v2.0 format',
      icon: <Hash className="h-4 w-4" />
    },
    {
      value: 'draft-final' as VersionNamingScheme,
      label: 'Draft/Final',
      description: 'Draft 1.0, Final 1.0 workflow',
      icon: <Tag className="h-4 w-4" />
    },
    {
      value: 'dated' as VersionNamingScheme,
      label: 'Date-Based',
      description: '2024.01.1, 2024.02.1 format',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      value: 'custom' as VersionNamingScheme,
      label: 'Custom Format',
      description: 'Define your own pattern',
      icon: <Code className="h-4 w-4" />
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Version Naming Conventions
        </CardTitle>
        <CardDescription>
          Standardize how document versions are named across your organization
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Naming Scheme Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Naming Scheme</Label>
          <RadioGroup 
            value={namingConfig.scheme} 
            onValueChange={(value) => handleSchemeChange(value as VersionNamingScheme)}
            className="grid grid-cols-2 gap-3"
          >
            {schemeOptions.map((option) => (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className="flex flex-col gap-1 p-4 rounded-lg border-2 cursor-pointer transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Custom Format Input */}
        {namingConfig.scheme === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="customFormat">Custom Format Pattern</Label>
            <Input
              id="customFormat"
              value={customFormat}
              onChange={(e) => handleCustomFormatChange(e.target.value)}
              placeholder="{major}.{minor}"
            />
            <p className="text-xs text-muted-foreground">
              Available variables: {'{major}'}, {'{minor}'}, {'{date}'}
            </p>
          </div>
        )}

        {/* Version Prefix */}
        {namingConfig.scheme !== 'draft-final' && namingConfig.scheme !== 'dated' && (
          <div className="space-y-2">
            <Label htmlFor="prefix">Version Prefix</Label>
            <Input
              id="prefix"
              value={namingConfig.prefix || ''}
              onChange={(e) => handlePrefixChange(e.target.value)}
              placeholder="v"
              className="w-24"
            />
          </div>
        )}

        <Separator />

        {/* Toggle Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Label Options</Label>
          
          {namingConfig.scheme === 'draft-final' && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeDraft">Include "Draft" Label</Label>
                  <p className="text-xs text-muted-foreground">Mark work-in-progress versions</p>
                </div>
                <Switch
                  id="includeDraft"
                  checked={namingConfig.includeDraft}
                  onCheckedChange={(checked) => handleToggle('includeDraft', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeFinal">Include "Final" Label</Label>
                  <p className="text-xs text-muted-foreground">Mark approved/final versions</p>
                </div>
                <Switch
                  id="includeFinal"
                  checked={namingConfig.includeFinal}
                  onCheckedChange={(checked) => handleToggle('includeFinal', checked)}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <div className="space-y-0.5">
                <Label htmlFor="includeEnhanced">Enhanced Suffix</Label>
                <p className="text-xs text-muted-foreground">Add "-enhanced" to AI-improved versions</p>
              </div>
            </div>
            <Switch
              id="includeEnhanced"
              checked={namingConfig.includeEnhancedSuffix}
              onCheckedChange={(checked) => handleToggle('includeEnhancedSuffix', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileStack className="h-4 w-4 text-blue-500" />
              <div className="space-y-0.5">
                <Label htmlFor="includeSummary">Summary Suffix</Label>
                <p className="text-xs text-muted-foreground">Add "-summary" to condensed versions</p>
              </div>
            </div>
            <Switch
              id="includeSummary"
              checked={namingConfig.includeSummarySuffix}
              onCheckedChange={(checked) => handleToggle('includeSummarySuffix', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Preview Examples */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preview Examples</Label>
          <div className="grid grid-cols-2 gap-2">
            {examples.map((example, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 group"
              >
                <div>
                  <span className="text-xs text-muted-foreground">{example.label}</span>
                  <div className="font-mono text-sm font-medium">{example.version}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => copyExample(example.version)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
