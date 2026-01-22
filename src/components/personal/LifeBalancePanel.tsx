// Life Balance Panel - Atlas intelligent work-life management UI
// Displays life activities, auto-block suggestions, vacation planning, and balance metrics

import React, { useState } from 'react';
import { 
  Heart, Dumbbell, Users, Palette, Moon, Plane, Stethoscope, BookOpen, Sparkles,
  Plus, Check, X, Calendar, Clock, AlertTriangle, TrendingUp, TrendingDown,
  Brain, Target, Mail, MapPin, ChevronRight, Settings, Zap, RefreshCw,
  FileText, Send, Edit, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  useAtlasLifeManager, 
  LifeActivity, 
  LifeCategory, 
  AutoBlockSuggestion,
  VacationPlan 
} from '@/hooks/useAtlasLifeManager';
import { toast } from 'sonner';

interface LifeBalancePanelProps {
  className?: string;
  compact?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Heart: <Heart size={14} />,
  Dumbbell: <Dumbbell size={14} />,
  Users: <Users size={14} />,
  HandHeart: <Heart size={14} />,
  Palette: <Palette size={14} />,
  Moon: <Moon size={14} />,
  Plane: <Plane size={14} />,
  Stethoscope: <Stethoscope size={14} />,
  BookOpen: <BookOpen size={14} />,
  Sparkles: <Sparkles size={14} />
};

export function LifeBalancePanel({ className, compact = false }: LifeBalancePanelProps) {
  const {
    lifeActivities,
    activitiesByCategory,
    workLifeBalance,
    autoBlockSuggestions,
    vacationPlans,
    isLoading,
    isAnalyzing,
    saveActivity,
    removeActivity,
    getCategoryConfig,
    acceptAutoBlock,
    analyzeWorkLifeBalance,
    createVacationPlan,
    updateVacationPlan,
    deleteVacationPlan,
    analyzeVacationImpact,
    generateLeaveRequestDraft,
    generateItinerary,
    CATEGORY_CONFIG
  } = useAtlasLifeManager();

  const [activeTab, setActiveTab] = useState('balance');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showVacationDialog, setShowVacationDialog] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<VacationPlan | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<LifeCategory>>(new Set());
  
  const [newActivity, setNewActivity] = useState<Partial<LifeActivity>>({
    category: 'hobby',
    name: '',
    frequency: 'weekly',
    duration: 60,
    priority: 'flexible',
    autoBlock: false,
    isRecurring: true
  });

  const [newVacation, setNewVacation] = useState({
    destination: '',
    startDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 37), 'yyyy-MM-dd'),
    travelCompanions: ''
  });

  // Handle accepting an auto-block suggestion
  const handleAcceptBlock = async (suggestion: AutoBlockSuggestion) => {
    const success = await acceptAutoBlock(suggestion);
    if (success) {
      toast.success(`${suggestion.activity.name} blocked on ${format(suggestion.suggestedSlot.start, 'EEE, MMM d')}`);
    } else {
      toast.error('Failed to block time');
    }
  };

  // Handle adding a new activity
  const handleAddActivity = () => {
    if (!newActivity.name) {
      toast.error('Activity name is required');
      return;
    }
    saveActivity(newActivity);
    setShowAddActivity(false);
    setNewActivity({
      category: 'hobby',
      name: '',
      frequency: 'weekly',
      duration: 60,
      priority: 'flexible',
      autoBlock: false,
      isRecurring: true
    });
    toast.success('Activity added');
  };

  // Handle creating a vacation plan
  const handleCreateVacation = () => {
    const plan = createVacationPlan({
      destination: newVacation.destination,
      startDate: new Date(newVacation.startDate),
      endDate: new Date(newVacation.endDate),
      status: 'planning',
      travelCompanions: newVacation.travelCompanions ? newVacation.travelCompanions.split(',').map(s => s.trim()) : undefined
    });
    setShowVacationDialog(false);
    setSelectedVacation(plan);
    toast.success('Vacation plan created');
  };

  // Handle generating itinerary
  const handleGenerateItinerary = async (plan: VacationPlan) => {
    toast.info('Generating itinerary...');
    await generateItinerary(plan);
    toast.success('Itinerary generated');
  };

  // Toggle category expansion
  const toggleCategory = (category: LifeCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Compact widget view
  if (compact) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain size={14} className="text-primary" />
            Atlas Life Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Balance Score */}
          {workLifeBalance && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Work-Life Balance</span>
                <span className={cn(
                  "font-medium",
                  workLifeBalance.balanceScore >= 70 ? "text-green-400" :
                  workLifeBalance.balanceScore >= 50 ? "text-amber-400" : "text-red-400"
                )}>
                  {workLifeBalance.balanceScore}%
                </span>
              </div>
              <Progress 
                value={workLifeBalance.balanceScore} 
                className="h-1.5"
              />
            </div>
          )}

          {/* Top Alert */}
          {workLifeBalance?.alerts[0] && (
            <div className={cn(
              "p-2 rounded text-xs",
              workLifeBalance.alerts[0].severity === 'critical' ? "bg-red-500/10 border border-red-500/20" :
              workLifeBalance.alerts[0].severity === 'warning' ? "bg-amber-500/10 border border-amber-500/20" :
              "bg-blue-500/10 border border-blue-500/20"
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={12} className={cn(
                  workLifeBalance.alerts[0].severity === 'critical' ? "text-red-400" :
                  workLifeBalance.alerts[0].severity === 'warning' ? "text-amber-400" : "text-blue-400"
                )} />
                <span className="font-medium">{workLifeBalance.alerts[0].message}</span>
              </div>
              <p className="text-muted-foreground text-[10px]">{workLifeBalance.alerts[0].suggestedAction}</p>
            </div>
          )}

          {/* Top Auto-Block Suggestion */}
          {autoBlockSuggestions[0] && (
            <div className="p-2 rounded bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <Zap size={12} className="text-primary" />
                  Atlas suggests
                </span>
                <Badge variant="outline" className="text-[9px] h-4">
                  {autoBlockSuggestions[0].confidence}% confident
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">
                Block {autoBlockSuggestions[0].activity.name} on {format(autoBlockSuggestions[0].suggestedSlot.start, 'EEE h:mm a')}
              </p>
              <Button 
                size="sm" 
                className="w-full h-6 text-[10px]"
                onClick={() => handleAcceptBlock(autoBlockSuggestions[0])}
              >
                <Check size={10} className="mr-1" />
                Accept & Block
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain size={20} className="text-primary" />
            Atlas Life Manager
          </h2>
          <Badge variant="outline" className="text-[10px]">
            {isAnalyzing ? 'Analyzing...' : 'Active'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={analyzeWorkLifeBalance}
            disabled={isAnalyzing}
            className="h-7 text-xs"
          >
            <RefreshCw size={12} className={cn("mr-1", isAnalyzing && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={showVacationDialog} onOpenChange={setShowVacationDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs">
                <Plane size={12} className="mr-1" />
                Plan Vacation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Plan Your Vacation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input
                    placeholder="Where are you going?"
                    value={newVacation.destination}
                    onChange={e => setNewVacation(p => ({ ...p, destination: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newVacation.startDate}
                      onChange={e => setNewVacation(p => ({ ...p, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newVacation.endDate}
                      onChange={e => setNewVacation(p => ({ ...p, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Travel Companions (comma separated)</Label>
                  <Input
                    placeholder="Partner, Kids, Friends..."
                    value={newVacation.travelCompanions}
                    onChange={e => setNewVacation(p => ({ ...p, travelCompanions: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVacationDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateVacation}>Create Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid grid-cols-4 mb-3">
          <TabsTrigger value="balance" className="text-xs">
            <Target size={12} className="mr-1" />
            Balance
          </TabsTrigger>
          <TabsTrigger value="autoblock" className="text-xs relative">
            <Zap size={12} className="mr-1" />
            Auto-Block
            {autoBlockSuggestions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] flex items-center justify-center">
                {autoBlockSuggestions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activities" className="text-xs">
            <Heart size={12} className="mr-1" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="vacation" className="text-xs">
            <Plane size={12} className="mr-1" />
            Vacation
          </TabsTrigger>
        </TabsList>

        {/* Balance Tab */}
        <TabsContent value="balance" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-4">
              {/* Balance Score Card */}
              {workLifeBalance && (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-3xl font-bold flex items-center gap-2">
                          {workLifeBalance.balanceScore}%
                          {workLifeBalance.trend === 'improving' ? (
                            <TrendingUp size={20} className="text-green-400" />
                          ) : workLifeBalance.trend === 'declining' ? (
                            <TrendingDown size={20} className="text-red-400" />
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">Work-Life Balance Score</p>
                      </div>
                      <div className="text-right text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-muted-foreground">Work:</span>
                          <span className="font-medium">{Math.round(workLifeBalance.weeklyWorkHours)}h</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Personal:</span>
                          <span className="font-medium">{Math.round(workLifeBalance.weeklyPersonalHours)}h</span>
                        </div>
                      </div>
                    </div>
                    <Progress 
                      value={workLifeBalance.balanceScore} 
                      className="h-2"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Alerts */}
              {workLifeBalance?.alerts && workLifeBalance.alerts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400" />
                    Balance Alerts
                  </h3>
                  {workLifeBalance.alerts.map(alert => (
                    <Card key={alert.id} className={cn(
                      "border-border/50",
                      alert.severity === 'critical' ? "bg-red-500/5 border-red-500/20" :
                      alert.severity === 'warning' ? "bg-amber-500/5 border-amber-500/20" :
                      "bg-blue-500/5 border-blue-500/20"
                    )}>
                      <CardContent className="py-3">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "p-1.5 rounded",
                            alert.severity === 'critical' ? "bg-red-500/20" :
                            alert.severity === 'warning' ? "bg-amber-500/20" : "bg-blue-500/20"
                          )}>
                            <AlertTriangle size={14} className={cn(
                              alert.severity === 'critical' ? "text-red-400" :
                              alert.severity === 'warning' ? "text-amber-400" : "text-blue-400"
                            )} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{alert.suggestedAction}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            Fix
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {workLifeBalance?.recommendations && workLifeBalance.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" />
                    Atlas Recommendations
                  </h3>
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="py-3 space-y-2">
                      {workLifeBalance.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Auto-Block Tab */}
        <TabsContent value="autoblock" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-4">
              <p className="text-xs text-muted-foreground mb-4">
                Atlas analyzes your calendar and life activities to suggest optimal time blocks for personal priorities.
              </p>
              
              {autoBlockSuggestions.length === 0 ? (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-8 text-center">
                    <Check size={32} className="mx-auto mb-3 text-green-400" />
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No auto-block suggestions at the moment
                    </p>
                  </CardContent>
                </Card>
              ) : (
                autoBlockSuggestions.map(suggestion => {
                  const config = getCategoryConfig(suggestion.activity.category);
                  return (
                    <Card key={suggestion.id} className="border-border/50 bg-card/50">
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("p-1.5 rounded", `bg-${config.color.split('-')[1]}-500/20`)}>
                              {ICON_MAP[config.icon]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{suggestion.activity.name}</p>
                              <p className="text-[10px] text-muted-foreground">{config.label}</p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px]",
                              suggestion.priority === 'high' ? "border-green-500/50 text-green-400" :
                              suggestion.priority === 'medium' ? "border-amber-500/50 text-amber-400" :
                              "border-muted-foreground/50"
                            )}
                          >
                            {suggestion.confidence}% match
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {format(suggestion.suggestedSlot.start, 'EEE, MMM d')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {format(suggestion.suggestedSlot.start, 'h:mm a')} - {format(suggestion.suggestedSlot.end, 'h:mm a')}
                          </span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3 p-2 rounded bg-muted/30">
                          <Sparkles size={10} className="inline mr-1 text-primary" />
                          {suggestion.reason}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 h-7 text-xs"
                            onClick={() => handleAcceptBlock(suggestion)}
                          >
                            <Check size={12} className="mr-1" />
                            Block This Time
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <X size={12} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">
                  Configure your life activities for Atlas to auto-manage
                </p>
                <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Plus size={12} className="mr-1" />
                      Add Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Life Activity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Activity Name</Label>
                        <Input
                          placeholder="e.g., Volunteer Fire Training"
                          value={newActivity.name}
                          onChange={e => setNewActivity(p => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={newActivity.category}
                            onValueChange={v => setNewActivity(p => ({ ...p, category: v as LifeCategory }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                                <SelectItem key={key} value={key}>{val.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Select
                            value={newActivity.frequency}
                            onValueChange={v => setNewActivity(p => ({ ...p, frequency: v as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="as_needed">As Needed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={newActivity.duration}
                            onChange={e => setNewActivity(p => ({ ...p, duration: parseInt(e.target.value) || 60 }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            value={newActivity.priority}
                            onValueChange={v => setNewActivity(p => ({ ...p, priority: v as any }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="essential">Essential</SelectItem>
                              <SelectItem value="important">Important</SelectItem>
                              <SelectItem value="flexible">Flexible</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-Block Time</Label>
                          <p className="text-xs text-muted-foreground">Atlas will automatically schedule this</p>
                        </div>
                        <Switch
                          checked={newActivity.autoBlock}
                          onCheckedChange={v => setNewActivity(p => ({ ...p, autoBlock: v }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddActivity(false)}>Cancel</Button>
                      <Button onClick={handleAddActivity}>Add Activity</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {Object.entries(activitiesByCategory).map(([category, activities]) => {
                if (activities.length === 0) return null;
                const config = CATEGORY_CONFIG[category as LifeCategory];
                const isExpanded = expandedCategories.has(category as LifeCategory);
                
                return (
                  <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category as LifeCategory)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between h-10 px-3">
                        <div className="flex items-center gap-2">
                          <span className={config.color}>{ICON_MAP[config.icon]}</span>
                          <span className="font-medium">{config.label}</span>
                          <Badge variant="secondary" className="text-[9px] h-4">
                            {activities.length}
                          </Badge>
                        </div>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 space-y-1 mt-1">
                      {activities.map(activity => (
                        <div 
                          key={activity.id}
                          className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50"
                        >
                          <div>
                            <p className="text-sm">{activity.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{activity.frequency}</span>
                              <span>•</span>
                              <span>{activity.duration}min</span>
                              {activity.autoBlock && (
                                <>
                                  <span>•</span>
                                  <span className="text-primary">Auto-block</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                setNewActivity(activity);
                                setShowAddActivity(true);
                              }}
                            >
                              <Edit size={12} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() => removeActivity(activity.id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Vacation Tab */}
        <TabsContent value="vacation" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-4">
              {vacationPlans.length === 0 ? (
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="py-8 text-center">
                    <Plane size={32} className="mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">No vacation plans yet</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      Plan your next getaway and let Atlas handle the logistics
                    </p>
                    <Button size="sm" onClick={() => setShowVacationDialog(true)}>
                      <Plus size={14} className="mr-1" />
                      Plan a Vacation
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                vacationPlans.map(plan => {
                  const impact = analyzeVacationImpact(plan);
                  const leaveDraft = generateLeaveRequestDraft(plan);
                  
                  return (
                    <Card key={plan.id} className="border-border/50 bg-card/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <MapPin size={14} className="text-primary" />
                            {plan.destination || 'Vacation'}
                          </CardTitle>
                          <Badge variant="outline" className="text-[9px]">
                            {plan.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded bg-muted/30">
                            <div className="text-lg font-bold">{plan.totalDays}</div>
                            <div className="text-[9px] text-muted-foreground">Total Days</div>
                          </div>
                          <div className="p-2 rounded bg-muted/30">
                            <div className="text-lg font-bold">{plan.workDaysAffected}</div>
                            <div className="text-[9px] text-muted-foreground">Work Days</div>
                          </div>
                          <div className="p-2 rounded bg-muted/30">
                            <div className="text-lg font-bold">{impact.meetingsToReschedule}</div>
                            <div className="text-[9px] text-muted-foreground">Meetings</div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {format(plan.startDate, 'MMM d, yyyy')} - {format(plan.endDate, 'MMM d, yyyy')}
                        </div>
                        
                        {plan.travelCompanions && plan.travelCompanions.length > 0 && (
                          <div className="flex items-center gap-1 text-xs">
                            <Users size={12} />
                            <span>{plan.travelCompanions.join(', ')}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleGenerateItinerary(plan)}
                          >
                            <FileText size={12} className="mr-1" />
                            Generate Itinerary
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="h-7 text-xs">
                                <Mail size={12} className="mr-1" />
                                Leave Request
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Leave Request Draft</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Textarea
                                  value={leaveDraft}
                                  readOnly
                                  rows={12}
                                  className="font-mono text-xs"
                                />
                                <p className="text-xs text-muted-foreground">
                                  <Sparkles size={10} className="inline mr-1" />
                                  Atlas generated this draft based on your calendar analysis
                                </p>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => navigator.clipboard.writeText(leaveDraft)}>
                                  Copy to Clipboard
                                </Button>
                                <Button>
                                  <Send size={14} className="mr-1" />
                                  Send Request
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {/* Itinerary Preview */}
                        {plan.itinerary && plan.itinerary.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs font-medium mb-2">Itinerary Preview</p>
                            <div className="space-y-1">
                              {plan.itinerary.slice(0, 3).map(item => (
                                <div key={item.id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span className="font-medium">Day {item.day}</span>
                                  <span>•</span>
                                  <span>{item.time}</span>
                                  <span>•</span>
                                  <span className="truncate">{item.activity}</span>
                                </div>
                              ))}
                              {plan.itinerary.length > 3 && (
                                <p className="text-[10px] text-primary">+{plan.itinerary.length - 3} more items</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => deleteVacationPlan(plan.id)}
                        >
                          <Trash2 size={12} className="mr-1" />
                          Delete Plan
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
