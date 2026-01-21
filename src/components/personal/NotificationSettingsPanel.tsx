// Notification Settings Panel - Cross-hub notification boundaries
// Allows users to control what notifications flow into their personal hub

import { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Moon,
  Shield,
  Clock,
  Users,
  Briefcase,
  UserCircle,
  Mail,
  MessageCircle,
  CheckSquare,
  Calendar,
  AtSign,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  useNotificationPreferences, 
  type HubType, 
  type NotificationType 
} from '@/hooks/useNotificationPreferences';

const HUB_CONFIG = {
  personal: { 
    icon: UserCircle, 
    label: 'Personal', 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/10',
    description: 'Your personal notifications'
  },
  group: { 
    icon: Users, 
    label: 'Group Hub', 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500/10',
    description: 'Team and family notifications'
  },
  csuite: { 
    icon: Briefcase, 
    label: 'Executive', 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-500/10',
    description: 'Business dashboard notifications'
  },
};

const NOTIFICATION_TYPES: { type: NotificationType; icon: typeof Mail; label: string }[] = [
  { type: 'email', icon: Mail, label: 'Email' },
  { type: 'message', icon: MessageCircle, label: 'Messages' },
  { type: 'task', icon: CheckSquare, label: 'Tasks' },
  { type: 'calendar', icon: Calendar, label: 'Calendar' },
  { type: 'mention', icon: AtSign, label: 'Mentions' },
  { type: 'alert', icon: AlertTriangle, label: 'Alerts' },
];

interface NotificationSettingsPanelProps {
  className?: string;
  compact?: boolean;
}

export function NotificationSettingsPanel({ className, compact = false }: NotificationSettingsPanelProps) {
  const {
    preferences,
    hubSettings,
    updatePreference,
    updateHubSettings,
    blockHubNotifications,
    unblockHubNotifications,
    getPreferencesByHub,
    getHubSettings,
    resetToDefaults,
  } = useNotificationPreferences();

  const [expandedHubs, setExpandedHubs] = useState<HubType[]>(['group', 'csuite']);

  const toggleHubExpanded = (hubType: HubType) => {
    setExpandedHubs(prev => 
      prev.includes(hubType) 
        ? prev.filter(h => h !== hubType)
        : [...prev, hubType]
    );
  };

  const renderHubSection = (hubType: HubType) => {
    const config = HUB_CONFIG[hubType];
    const settings = getHubSettings(hubType);
    const prefs = getPreferencesByHub(hubType);
    const isExpanded = expandedHubs.includes(hubType);
    const Icon = config.icon;

    // Skip personal hub in compact mode
    if (compact && hubType === 'personal') return null;

    return (
      <Collapsible 
        key={hubType}
        open={isExpanded} 
        onOpenChange={() => toggleHubExpanded(hubType)}
      >
        <Card className={cn(
          "border",
          !settings?.allowNotifications && "opacity-60"
        )}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", config.bgColor)}>
                    <Icon size={16} className={config.color} />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {config.label}
                      {!settings?.allowNotifications && (
                        <Badge variant="secondary" className="text-[9px]">
                          <BellOff size={8} className="mr-1" />
                          Muted
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hubType !== 'personal' && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2"
                    >
                      <Switch
                        checked={settings?.allowNotifications ?? true}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            unblockHubNotifications(hubType);
                          } else {
                            blockHubNotifications(hubType);
                          }
                        }}
                      />
                    </div>
                  )}
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-3 px-4">
              <Separator className="mb-3" />
              
              {/* Quiet Hours */}
              {hubType !== 'personal' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Moon size={12} className="text-muted-foreground" />
                      <Label className="text-xs">Quiet Hours</Label>
                    </div>
                    <Switch
                      checked={settings?.quietHoursEnabled ?? false}
                      onCheckedChange={(checked) => 
                        updateHubSettings(hubType, { quietHoursEnabled: checked })
                      }
                    />
                  </div>
                  
                  {settings?.quietHoursEnabled && (
                    <div className="flex items-center gap-2 ml-5">
                      <Input
                        type="time"
                        value={settings.quietHoursStart || '22:00'}
                        onChange={(e) => 
                          updateHubSettings(hubType, { quietHoursStart: e.target.value })
                        }
                        className="h-7 w-24 text-xs"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={settings.quietHoursEnd || '08:00'}
                        onChange={(e) => 
                          updateHubSettings(hubType, { quietHoursEnd: e.target.value })
                        }
                        className="h-7 w-24 text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Allow urgent override */}
              {hubType !== 'personal' && settings?.quietHoursEnabled && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-orange-500" />
                    <Label className="text-xs">Allow urgent alerts during quiet hours</Label>
                  </div>
                  <Switch
                    checked={settings?.allowUrgentOverride ?? true}
                    onCheckedChange={(checked) => 
                      updateHubSettings(hubType, { allowUrgentOverride: checked })
                    }
                  />
                </div>
              )}

              {/* Notification Types */}
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground uppercase font-mono">
                  Notification Types
                </Label>
                {NOTIFICATION_TYPES.map(({ type, icon: TypeIcon, label }) => {
                  const pref = prefs.find(p => p.notificationType === type);
                  if (!pref) return null;

                  return (
                    <div 
                      key={type}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <TypeIcon size={12} className="text-muted-foreground" />
                        <span className="text-xs">{label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Show in Personal Hub toggle (for non-personal hubs) */}
                        {hubType !== 'personal' && (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-muted-foreground">Personal</span>
                            <Switch
                              checked={pref.showInPersonalHub}
                              onCheckedChange={(checked) => 
                                updatePreference(hubType, type, { showInPersonalHub: checked })
                              }
                              className="scale-75"
                            />
                          </div>
                        )}
                        
                        {/* Sound toggle */}
                        <button
                          onClick={() => 
                            updatePreference(hubType, type, { soundEnabled: !pref.soundEnabled })
                          }
                          className={cn(
                            "p-1 rounded transition-colors",
                            pref.soundEnabled 
                              ? "text-primary hover:bg-primary/10" 
                              : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {pref.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        </button>

                        {/* Enable toggle */}
                        <Switch
                          checked={pref.enabled}
                          onCheckedChange={(checked) => 
                            updatePreference(hubType, type, { enabled: checked })
                          }
                          className="scale-75"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">
              Notification Boundaries
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={resetToDefaults} className="h-6 text-[10px]">
            Reset
          </Button>
        </div>
        
        <div className="space-y-2">
          {(['group', 'csuite'] as HubType[]).map(hubType => {
            const config = HUB_CONFIG[hubType];
            const settings = getHubSettings(hubType);
            const Icon = config.icon;
            
            return (
              <div 
                key={hubType}
                className="flex items-center justify-between p-2 rounded-lg border bg-card/50"
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={config.color} />
                  <span className="text-xs">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {settings?.quietHoursEnabled && (
                    <Badge variant="outline" className="text-[8px]">
                      <Moon size={8} className="mr-1" />
                      Quiet
                    </Badge>
                  )}
                  <Switch
                    checked={settings?.allowNotifications ?? true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        unblockHubNotifications(hubType);
                      } else {
                        blockHubNotifications(hubType);
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <p className="text-[10px] text-muted-foreground text-center">
          Control which business notifications appear in your personal space
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">Notification Settings</h2>
          </div>
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="h-7 text-[10px]">
            <Settings size={10} className="mr-1" />
            Reset to Defaults
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Create healthy boundaries between your personal and business life. 
          Control what notifications flow into your personal hub.
        </p>

        <Separator />

        <div className="space-y-3">
          {(['personal', 'group', 'csuite'] as HubType[]).map(renderHubSection)}
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <Bell size={16} className="text-primary mt-0.5" />
              <div>
                <p className="text-xs font-medium">Mental Health Tip</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Setting clear notification boundaries helps reduce stress and anxiety. 
                  Consider enabling quiet hours during evenings and weekends for business notifications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
