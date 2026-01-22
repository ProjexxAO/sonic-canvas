// Personal Data Hub - Dynamic personal interface with user-selected overview items
// Life, Social, More consolidated into dropdown menu
// Supports drag-and-drop reordering, Atlas auto-arrange by usage, and resizable panels

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { 
  CheckSquare, 
  Target, 
  TrendingUp, 
  FileText, 
  Bookmark,
  Calendar,
  Plus,
  RefreshCw,
  LayoutDashboard,
  Flame,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Trash2,
  AlertCircle,
  Mail,
  DollarSign,
  Image,
  Camera,
  ExternalLink,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Wallet,
  CreditCard,
  Heart,
  Dumbbell,
  Pill,
  Plane,
  ShoppingBag,
  Tv,
  Rss,
  Cloud,
  Sun,
  ChevronDown,
  Settings,
  Star,
  GripVertical,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  LineChart,
  Banknote,
  Sparkles,
  Move,
  GripHorizontal,
  Search,
  Globe,
  Loader2,
  Link as LinkIcon,
  Plug,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePersonalHub, PersonalItem, PersonalGoal, PersonalHabit } from '@/hooks/usePersonalHub';
import { useBanking, BankAccount, BankTransaction } from '@/hooks/useBanking';
import { useUserPhotos, PHOTO_CATEGORIES, SOCIAL_PLATFORMS } from '@/hooks/useUserPhotos';
import { useQuickActionPreferences } from '@/hooks/useQuickActionPreferences';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIntegrationSurfaces } from '@/hooks/useIntegrationSurfaces';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { AtlasDailyBrief } from './AtlasDailyBrief';
import { WellnessWidget } from './WellnessWidget';
import { FocusTimerWidget } from './FocusTimerWidget';
import { HabitStreakChart } from './HabitStreakChart';
import { GoalProgressTimeline } from './GoalProgressTimeline';
import { SmartCalendar } from './SmartCalendar';
import { SmartNudgesWidget } from './SmartNudgesWidget';
import { LifeBalancePanel } from './LifeBalancePanel';
import { UniversalOrchestrationPanel } from '@/components/atlas/UniversalOrchestrationPanel';
import { IntegrationQuickActions, IntegrationSurfaceSummary } from './IntegrationSurfaceWidget';
import { UnifiedInbox } from './UnifiedInbox';
import { ConnectPlatformDialog } from '@/components/communications/ConnectPlatformDialog';
import { useDataConnectors, ConnectorPlatform } from '@/hooks/useDataConnectors';

interface PersonalDataHubProps {
  userId: string | undefined;
}

// Quick action item definition
interface QuickActionItem {
  id: string;
  icon: typeof CheckSquare;
  label: string;
  color: string;
  category: 'life' | 'social' | 'more';
  url?: string;
  count?: number;
  badge?: string;
}

// All available quick actions
const ALL_QUICK_ACTIONS: QuickActionItem[] = [
  // Life category
  { id: 'health', icon: Heart, label: 'Health', color: 'hsl(350 70% 50%)', category: 'life' },
  { id: 'fitness', icon: Dumbbell, label: 'Fitness', color: 'hsl(200 70% 50%)', category: 'life' },
  { id: 'medications', icon: Pill, label: 'Meds', color: 'hsl(150 60% 45%)', category: 'life' },
  { id: 'travel', icon: Plane, label: 'Travel', color: 'hsl(220 70% 55%)', category: 'life' },
  { id: 'shopping', icon: ShoppingBag, label: 'Shopping', color: 'hsl(280 60% 55%)', category: 'life' },
  { id: 'streaming', icon: Tv, label: 'Streaming', color: 'hsl(350 60% 50%)', category: 'life' },
  
  // Social category
  { id: 'instagram', icon: Instagram, label: 'Instagram', color: 'hsl(340 75% 55%)', category: 'social', url: 'https://instagram.com' },
  { id: 'twitter', icon: Twitter, label: 'X / Twitter', color: 'hsl(200 90% 45%)', category: 'social', url: 'https://x.com' },
  { id: 'facebook', icon: Facebook, label: 'Facebook', color: 'hsl(220 70% 50%)', category: 'social', url: 'https://facebook.com' },
  { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: 'hsl(210 80% 45%)', category: 'social', url: 'https://linkedin.com' },
  { id: 'youtube', icon: Youtube, label: 'YouTube', color: 'hsl(0 80% 50%)', category: 'social', url: 'https://youtube.com' },
  
  // More category
  { id: 'search', icon: Search, label: 'Search', color: 'hsl(260 70% 55%)', category: 'more' },
  { id: 'news', icon: Rss, label: 'News', color: 'hsl(35 80% 50%)', category: 'more' },
  { id: 'weather', icon: Sun, label: 'Weather', color: 'hsl(45 90% 50%)', category: 'more', url: 'https://weather.com' },
  { id: 'cloud', icon: Cloud, label: 'Cloud Storage', color: 'hsl(200 60% 50%)', category: 'more' },
];

// Quick action card for personal actions with drag support
function PersonalQuickAction({ 
  icon: Icon, 
  label, 
  count, 
  color, 
  onClick,
  badge,
  onRemove,
  url,
  isDragging,
  dragHandleProps
}: { 
  icon: typeof CheckSquare; 
  label: string; 
  count?: number; 
  color: string;
  onClick: () => void;
  badge?: string;
  onRemove?: () => void;
  url?: string;
  isDragging?: boolean;
  dragHandleProps?: any;
}) {
  const handleClick = () => {
    // Always record usage / internal routing first
    onClick();

    // Then open external destination if present
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={cn(
      "relative group",
      isDragging && "opacity-75 shadow-lg"
    )}>
      <button
        onClick={handleClick}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors min-w-[60px] w-full",
          isDragging && "ring-2 ring-primary"
        )}
      >
        {/* Drag handle */}
        {dragHandleProps && (
          <div 
            {...dragHandleProps}
            className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={10} className="text-muted-foreground" />
          </div>
        )}
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center mb-0.5"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={12} style={{ color }} />
        </div>
        <span className="text-[9px] font-mono text-foreground truncate max-w-full">{label}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="text-[7px] mt-0.5 px-1 py-0 h-3">
            {count}
          </Badge>
        )}
        {badge && (
          <Badge variant="outline" className="text-[7px] mt-0.5 px-1 py-0 h-3">
            {badge}
          </Badge>
        )}
        {url && (
          <ExternalLink size={8} className="absolute top-1 right-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <X size={8} />
        </button>
      )}
    </div>
  );
}

// Task item component
function TaskItem({ 
  item, 
  onComplete, 
  onDelete 
}: { 
  item: PersonalItem; 
  onComplete: () => void;
  onDelete: () => void;
}) {
  const isOverdue = item.due_date && isPast(parseISO(item.due_date)) && item.status !== 'completed';
  const isDueToday = item.due_date && isToday(parseISO(item.due_date));
  
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border transition-colors",
      item.status === 'completed' 
        ? "bg-muted/30 border-border/50" 
        : isOverdue 
          ? "bg-destructive/5 border-destructive/30"
          : "bg-card border-border hover:bg-card/80"
    )}>
      <button onClick={onComplete} className="flex-shrink-0">
        {item.status === 'completed' ? (
          <CheckCircle2 size={16} className="text-primary" />
        ) : (
          <Circle size={16} className="text-muted-foreground hover:text-primary transition-colors" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate",
          item.status === 'completed' && "line-through text-muted-foreground"
        )}>
          {item.title}
        </p>
        {item.due_date && (
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={10} className={isOverdue ? "text-destructive" : "text-muted-foreground"} />
            <span className={cn(
              "text-[10px]",
              isOverdue ? "text-destructive" : isDueToday ? "text-primary" : "text-muted-foreground"
            )}>
              {isDueToday ? 'Today' : format(parseISO(item.due_date), 'MMM d')}
            </span>
          </div>
        )}
      </div>
      
      <Badge 
        variant="outline" 
        className={cn(
          "text-[8px] px-1.5",
          item.priority === 'urgent' && "border-destructive text-destructive",
          item.priority === 'high' && "border-orange-500 text-orange-500",
          item.priority === 'medium' && "border-yellow-500 text-yellow-500",
          item.priority === 'low' && "border-muted-foreground text-muted-foreground"
        )}
      >
        {item.priority}
      </Badge>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border-border">
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 size={12} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Goal card component
function GoalCard({ goal }: { goal: PersonalGoal }) {
  const progress = goal.target_value 
    ? Math.min((goal.current_value / goal.target_value) * 100, 100) 
    : 0;
  
  return (
    <Card className="bg-card/50">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{goal.title}</h4>
            <p className="text-[10px] text-muted-foreground truncate">
              {goal.description || goal.category}
            </p>
          </div>
          <Badge variant="outline" className="text-[8px] ml-2">
            {goal.status}
          </Badge>
        </div>
        
        {goal.target_value && (
          <>
            <Progress value={progress} className="h-1.5 mb-1" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{goal.current_value} {goal.unit}</span>
              <span>/ {goal.target_value} {goal.unit}</span>
            </div>
          </>
        )}
        
        {goal.target_date && (
          <div className="flex items-center gap-1 mt-2">
            <Calendar size={10} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Due {format(parseISO(goal.target_date), 'MMM d, yyyy')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Habit card component
function HabitCard({ habit, onComplete }: { habit: PersonalHabit; onComplete: () => void }) {
  const completedToday = habit.last_completed_at && isToday(parseISO(habit.last_completed_at));
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      completedToday ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:bg-card/80"
    )}>
      <button
        onClick={onComplete}
        disabled={completedToday}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          completedToday ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
        )}
      >
        {completedToday ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{habit.name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1">
            <Flame size={10} className="text-orange-500" />
            <span className="text-[10px] text-muted-foreground">{habit.current_streak} day streak</span>
          </div>
          <Badge variant="secondary" className="text-[8px]">{habit.frequency}</Badge>
        </div>
      </div>
      
      {completedToday && (
        <Badge className="bg-primary/10 text-primary text-[8px]">Done ✓</Badge>
      )}
    </div>
  );
}

// Active view type for full-screen sections
type ActiveView = 'overview' | 'tasks' | 'goals' | 'habits' | 'notes' | 'finance' | 'photos' | 'search' | 'calendar' | 'email';

// Search result type
interface SearchResult {
  id: string;
  query: string;
  answer: string;
  citations: string[];
  timestamp: Date;
  isLoading?: boolean;
}

export function PersonalDataHub({ userId }: PersonalDataHubProps) {
  const isMobile = useIsMobile();
  
  const {
    items, goals, habits, isLoading, refetch,
    createItem, completeItem, deleteItem, completeHabit,
    stats, todaysTasks, overdueTasks, getItemsByType,
  } = usePersonalHub();

  const {
    accounts,
    transactions,
    insights,
    isLoading: isBankingLoading,
    refreshAll: refreshBanking,
  } = useBanking();

  const {
    photos,
    isLoading: isPhotosLoading,
    isUploading,
    stats: photoStats,
    uploadMultiplePhotos,
    toggleFavorite,
    setCategory,
    deletePhoto,
    shareToSocial,
    getPhotoUrl,
    getPhotosByCategory,
    refetch: refetchPhotos,
  } = useUserPhotos();

  // Data connectors for email and other integrations
  const {
    connectors,
    initializeConnector,
  } = useDataConnectors(userId);

  // Quick action preferences for usage tracking and custom order
  const {
    preferences: actionPrefs,
    recordUsage,
    setCustomOrder,
    clearCustomOrder,
    getSortedActionIds,
  } = useQuickActionPreferences(userId);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [photoCategory, setPhotoCategory] = useState('all');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isDragMode, setIsDragMode] = useState(false);
  const [showConnectEmailDialog, setShowConnectEmailDialog] = useState(false);

  // Default widget order for overview - each individual item is draggable
  // Shortcuts are individual widgets prefixed with 'shortcut-'
  const getDefaultWidgetOrder = useCallback((actions: string[]) => {
    const shortcutWidgets = actions.map(id => `shortcut-${id}`);
    return [
      'shortcuts-header', // Draggable header with controls
      ...shortcutWidgets,
      'widget-connected-apps', // Connected integrations quick actions
      'stat-today', 'stat-streak', 'stat-items',
      'widget-orchestration', // Universal Atlas Orchestration
      'widget-nudges',
      'widget-life-balance',
      'widget-atlas-brief', 'widget-wellness', 'widget-focus',
      'widget-calendar',
      'quick-add',
      'todays-tasks', 'overdue', 'habits',
      'viz-habit-streak', 'viz-goal-timeline',
      'goals'
    ];
  }, []);
  
  const DEFAULT_WIDGET_ORDER = getDefaultWidgetOrder(['tasks', 'goals', 'habits', 'email', 'photos', 'finance']);
  
  // Use database-backed preferences for cross-domain sync
  const {
    preferences: dashboardPrefs,
    isLoading: isPrefsLoading,
    updateWidgetOrder: saveDashboardWidgetOrder,
    updateSelectedShortcuts: saveDashboardShortcuts
  } = useDashboardPreferences();
  
  // Local state for widget order (synced from database)
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_WIDGET_ORDER);
  const [selectedActions, setSelectedActions] = useState<string[]>(['tasks', 'goals', 'habits', 'email', 'photos', 'finance']);
  
  // Sync local state from database preferences
  // No new feature widgets to migrate - integrations moved to tab panel

  useEffect(() => {
    if (!isPrefsLoading) {
      // Apply widget order from database, or migrate old format
      if (dashboardPrefs.widget_order.length > 0) {
        let order = [...dashboardPrefs.widget_order];
        let needsSave = false;
        
        // Migrate from old 'shortcuts' format
        if (order.includes('shortcuts')) {
          const shortcutWidgets = dashboardPrefs.selected_shortcuts.map(id => `shortcut-${id}`);
          const shortcutsIndex = order.indexOf('shortcuts');
          order = [
            ...order.slice(0, shortcutsIndex),
            'shortcuts-header',
            ...shortcutWidgets,
            ...order.slice(shortcutsIndex + 1)
          ];
          needsSave = true;
        }
        
        // Ensure shortcuts-header exists
        if (!order.includes('shortcuts-header') && order.some(id => id.startsWith('shortcut-'))) {
          const firstShortcutIndex = order.findIndex(id => id.startsWith('shortcut-'));
          order = [
            ...order.slice(0, firstShortcutIndex),
            'shortcuts-header',
            ...order.slice(firstShortcutIndex)
          ];
          needsSave = true;
        }
        
        // Remove widget-integrations if it exists (moved to tab panel)
        if (order.includes('widget-integrations')) {
          order = order.filter(id => id !== 'widget-integrations');
          needsSave = true;
        }
        
        if (needsSave) {
          saveDashboardWidgetOrder(order);
        }
        
        setWidgetOrder(order);
      } else {
        // Use default order based on selected shortcuts
        setWidgetOrder(getDefaultWidgetOrder(dashboardPrefs.selected_shortcuts));
      }
      
      setSelectedActions(dashboardPrefs.selected_shortcuts);
    }
  }, [isPrefsLoading, dashboardPrefs.widget_order, dashboardPrefs.selected_shortcuts]);
  
  // Sync widget order when selectedActions changes (add new shortcuts, remove old ones)
  useEffect(() => {
    if (isPrefsLoading) return;
    
    setWidgetOrder(prevOrder => {
      const currentShortcutWidgets = prevOrder.filter(id => id.startsWith('shortcut-'));
      const expectedShortcutWidgets = selectedActions.map(id => `shortcut-${id}`);
      
      const currentSet = new Set(currentShortcutWidgets);
      const expectedSet = new Set(expectedShortcutWidgets);
      
      const toAdd = expectedShortcutWidgets.filter(id => !currentSet.has(id));
      const toRemove = currentShortcutWidgets.filter(id => !expectedSet.has(id));
      
      if (toAdd.length === 0 && toRemove.length === 0) {
        return prevOrder;
      }
      
      let newOrder = prevOrder.filter(id => !toRemove.includes(id));
      
      const headerIndex = newOrder.indexOf('shortcuts-header');
      if (headerIndex !== -1) {
        // Insert after shortcuts-header and existing shortcuts
        const insertAt = headerIndex + 1 + currentShortcutWidgets.filter(id => !toRemove.includes(id)).length;
        newOrder = [
          ...newOrder.slice(0, insertAt),
          ...toAdd,
          ...newOrder.slice(insertAt)
        ];
      } else {
        newOrder = ['shortcuts-header', ...toAdd, ...newOrder];
      }
      
      return newOrder;
    });
  }, [selectedActions, isPrefsLoading]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle widget drag end - save to database
  const handleWidgetDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(widgetOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setWidgetOrder(items);
    saveDashboardWidgetOrder(items); // Save to database
  }, [widgetOrder, saveDashboardWidgetOrder]);

  const handleQuickAddTask = useCallback(async () => {
    if (!newTaskTitle.trim()) return;
    await createItem('task', newTaskTitle.trim());
    setNewTaskTitle('');
    inputRef.current?.focus();
  }, [newTaskTitle, createItem]);

  const addActionToOverview = useCallback((actionId: string) => {
    setSelectedActions(prev => {
      if (prev.includes(actionId)) return prev;
      const newActions = [...prev, actionId];
      if (actionPrefs.customOrder) {
        setCustomOrder(newActions);
      }
      saveDashboardShortcuts(newActions); // Save to database
      return newActions;
    });
  }, [actionPrefs.customOrder, setCustomOrder, saveDashboardShortcuts]);

  const removeActionFromOverview = useCallback((actionId: string) => {
    setSelectedActions(prev => {
      const newActions = prev.filter(id => id !== actionId);
      if (actionPrefs.customOrder) {
        setCustomOrder(newActions);
      }
      saveDashboardShortcuts(newActions); // Save to database
      return newActions;
    });
  }, [actionPrefs.customOrder, setCustomOrder, saveDashboardShortcuts]);

  // Remove a widget from the dashboard
  const removeWidget = useCallback((widgetId: string) => {
    setWidgetOrder(prev => {
      const newOrder = prev.filter(id => id !== widgetId);
      saveDashboardWidgetOrder(newOrder);
      return newOrder;
    });
    toast.success('Widget removed from dashboard');
  }, [saveDashboardWidgetOrder]);

  const handleShortcutClick = useCallback((actionId: string) => {
    // Record usage for smart sorting
    recordUsage(actionId);
    
    // Navigate to full view for core actions
    if (['tasks', 'goals', 'habits', 'notes', 'finance', 'photos', 'search', 'calendar', 'email'].includes(actionId)) {
      setActiveView(actionId as ActiveView);
    }
  }, [recordUsage]);

  // Search state and functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    const searchId = `search-${Date.now()}`;
    
    // Add placeholder result
    setSearchResults(prev => [{
      id: searchId,
      query: query.trim(),
      answer: '',
      citations: [],
      timestamp: new Date(),
      isLoading: true,
    }, ...prev]);
    
    setIsSearching(true);
    setSearchQuery('');
    
    try {
      const { data, error } = await supabase.functions.invoke('perplexity-search', {
        body: { query: query.trim() }
      });
      
      if (error) throw error;
      
      setSearchResults(prev => prev.map(r => 
        r.id === searchId 
          ? {
              ...r,
              answer: data?.answer || 'No results found.',
              citations: data?.citations || [],
              isLoading: false,
            }
          : r
      ));
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults(prev => prev.map(r => 
        r.id === searchId 
          ? {
              ...r,
              answer: 'Search failed. Please try again.',
              isLoading: false,
            }
          : r
      ));
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadMultiplePhotos(e.target.files);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const tasks = getItemsByType('task');
  const notes = getItemsByType('note');

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  // Default quick actions (always visible)
  const defaultActions = useMemo(() => [
    { id: 'tasks', icon: CheckSquare, label: 'Tasks', count: stats.activeTasks, color: 'hsl(350 70% 50%)' },
    { id: 'goals', icon: Target, label: 'Goals', count: stats.activeGoals, color: 'hsl(150 70% 45%)' },
    { id: 'habits', icon: TrendingUp, label: 'Habits', count: stats.activeHabits, color: 'hsl(45 80% 50%)' },
    { id: 'calendar', icon: Calendar, label: 'Calendar', color: 'hsl(220 70% 55%)' },
    { id: 'email', icon: Mail, label: 'Email', badge: '3', color: 'hsl(200 70% 50%)' },
    { id: 'finance', icon: DollarSign, label: 'Finance', count: accounts.length, color: 'hsl(150 70% 45%)' },
    { id: 'photos', icon: Image, label: 'Photos', color: 'hsl(280 60% 55%)' },
    { id: 'wallet', icon: Wallet, label: 'Wallet', color: 'hsl(35 80% 50%)' },
    { id: 'cards', icon: CreditCard, label: 'Cards', color: 'hsl(220 70% 50%)' },
    { id: 'notes', icon: FileText, label: 'Notes', count: notes.length, color: 'hsl(45 70% 50%)' },
    { id: 'saved', icon: Bookmark, label: 'Saved', color: 'hsl(350 60% 50%)' },
  ], [stats, accounts.length, notes.length]);

  // Combine all actions into a lookup map
  const allActionsMap = useMemo(() => {
    const map: Record<string, typeof defaultActions[0] | QuickActionItem> = {};
    defaultActions.forEach(a => { map[a.id] = a; });
    ALL_QUICK_ACTIONS.forEach(a => { map[a.id] = a; });
    return map;
  }, [defaultActions]);

  // Sorted actions based on user preference or usage
  const sortedActions = useMemo(() => {
    const sortedIds = actionPrefs.customOrder && !actionPrefs.autoSortByUsage
      ? actionPrefs.customOrder.filter(id => selectedActions.includes(id))
      : getSortedActionIds(selectedActions);
    
    // Add any new actions not in the sorted list
    const sortedSet = new Set(sortedIds);
    selectedActions.forEach(id => {
      if (!sortedSet.has(id)) sortedIds.push(id);
    });
    
    return sortedIds
      .map(id => allActionsMap[id])
      .filter(Boolean);
  }, [selectedActions, actionPrefs, getSortedActionIds, allActionsMap]);

  // Handle drag end - reorder shortcuts (defined after sortedActions)
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(sortedActions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Get just the IDs for the new order
    const newOrder = items.map(item => item.id);
    setSelectedActions(newOrder);
    setCustomOrder(newOrder);
    
    toast.success('Shortcut order saved');
  }, [sortedActions, setCustomOrder]);

  // Atlas auto-arrange: sort by usage frequency
  const handleAtlasOptimize = useCallback(() => {
    const optimizedOrder = getSortedActionIds(selectedActions);
    setSelectedActions(optimizedOrder);
    setCustomOrder(optimizedOrder);
    toast.success('Atlas optimized your shortcuts based on usage!');
  }, [selectedActions, getSortedActionIds, setCustomOrder]);

  // Reset to auto-sort by usage
  const handleResetToAutoSort = useCallback(() => {
    clearCustomOrder();
    toast.success('Shortcuts will now auto-sort by usage');
  }, [clearCustomOrder]);

  // Filter visible actions based on selection
  const visibleDefaultActions = defaultActions.filter(a => selectedActions.includes(a.id));
  const visibleCustomActions = ALL_QUICK_ACTIONS.filter(a => selectedActions.includes(a.id));

  const lifeActions = ALL_QUICK_ACTIONS.filter(a => a.category === 'life');
  const socialActions = ALL_QUICK_ACTIONS.filter(a => a.category === 'social');
  const moreActions = ALL_QUICK_ACTIONS.filter(a => a.category === 'more');

  // Full Finance View
  if (activeView === 'finance') {
    return (
      <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveView('overview')}>
              <ChevronDown size={14} className="rotate-90" />
            </Button>
            <DollarSign size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">MY FINANCES</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refreshBanking()} disabled={isBankingLoading}>
            <RefreshCw size={12} className={isBankingLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Net Worth Summary */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Total Balance</p>
                    <p className="text-2xl font-bold text-primary">
                      ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <PiggyBank size={24} className="text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 size={12} />
                    <span>{accounts.length} Accounts</span>
                  </div>
                  {insights.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <AlertCircle size={12} />
                      <span>{insights.length} Insights</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Financial Categories */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-card/50 cursor-pointer hover:bg-card transition-colors">
                <CardContent className="p-3 text-center">
                  <Building2 size={20} className="mx-auto mb-1 text-blue-500" />
                  <p className="text-[10px] font-mono text-muted-foreground">Banks</p>
                  <p className="text-sm font-semibold">{accounts.filter(a => a.account_type === 'checking' || a.account_type === 'savings').length}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 cursor-pointer hover:bg-card transition-colors">
                <CardContent className="p-3 text-center">
                  <LineChart size={20} className="mx-auto mb-1 text-green-500" />
                  <p className="text-[10px] font-mono text-muted-foreground">Investments</p>
                  <p className="text-sm font-semibold">{accounts.filter(a => a.account_type === 'investment' || a.account_type === 'brokerage').length}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50 cursor-pointer hover:bg-card transition-colors">
                <CardContent className="p-3 text-center">
                  <CreditCard size={20} className="mx-auto mb-1 text-purple-500" />
                  <p className="text-[10px] font-mono text-muted-foreground">Cards</p>
                  <p className="text-sm font-semibold">{accounts.filter(a => a.account_type === 'credit').length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Bank Accounts */}
            <div>
              <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                <Building2 size={10} /> ACCOUNTS
              </h3>
              {accounts.length > 0 ? (
                <div className="space-y-2">
                  {accounts.map(account => (
                    <Card key={account.id} className="bg-card/50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              {account.account_type === 'credit' ? (
                                <CreditCard size={14} className="text-muted-foreground" />
                              ) : account.account_type === 'investment' || account.account_type === 'brokerage' ? (
                                <LineChart size={14} className="text-muted-foreground" />
                              ) : (
                                <Building2 size={14} className="text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{account.account_name}</p>
                              <p className="text-[10px] text-muted-foreground">{account.institution_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-sm font-semibold",
                              (account.current_balance || 0) < 0 ? "text-destructive" : "text-foreground"
                            )}>
                              ${(account.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                            <Badge variant="outline" className="text-[8px]">{account.account_type}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-card/30 border-dashed">
                  <CardContent className="p-4 text-center">
                    <Building2 size={24} className="mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">No accounts connected</p>
                    <Button variant="outline" size="sm" className="mt-2 text-xs h-7">
                      <Plus size={12} className="mr-1" />
                      Connect Account
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Transactions */}
            <div>
              <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                <Banknote size={10} /> RECENT TRANSACTIONS
              </h3>
              {transactions.length > 0 ? (
                <div className="space-y-1.5">
                  {transactions.slice(0, 8).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-card/50 border border-border">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          tx.amount > 0 ? "bg-green-500/10" : "bg-red-500/10"
                        )}>
                          {tx.amount > 0 ? (
                            <ArrowDownRight size={12} className="text-green-500" />
                          ) : (
                            <ArrowUpRight size={12} className="text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium truncate max-w-[120px]">{tx.merchant_name || tx.description}</p>
                          <p className="text-[9px] text-muted-foreground">{format(parseISO(tx.transaction_date), 'MMM d')}</p>
                        </div>
                      </div>
                      <p className={cn(
                        "text-xs font-semibold",
                        tx.amount > 0 ? "text-green-500" : "text-foreground"
                      )}>
                        {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
              )}
            </div>

            {/* Financial Insights */}
            {insights.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                  <AlertCircle size={10} /> ATLAS INSIGHTS
                </h3>
                <div className="space-y-2">
                  {insights.slice(0, 3).map(insight => (
                    <Card key={insight.id} className={cn(
                      "bg-card/50",
                      insight.priority === 'high' && "border-destructive/30",
                      insight.priority === 'medium' && "border-yellow-500/30"
                    )}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={14} className={cn(
                            insight.priority === 'high' ? "text-destructive" : 
                            insight.priority === 'medium' ? "text-yellow-500" : "text-primary"
                          )} />
                          <div className="flex-1">
                            <p className="text-xs font-medium">{insight.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{insight.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Full Search View - Web search powered by Atlas
  if (activeView === 'search') {
    return (
      <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveView('overview')}>
              <ChevronDown size={14} className="rotate-90" />
            </Button>
            <Globe size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">WEB SEARCH</span>
          </div>
          <Badge variant="outline" className="text-[9px]">
            <Sparkles size={10} className="mr-1" />
            Powered by Atlas
          </Badge>
        </div>
        
        {/* Search Input */}
        <div className="p-3 border-b border-border">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
            className="flex gap-2"
          >
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the web..."
              className="h-9 text-sm bg-background/50"
              disabled={isSearching}
            />
            <Button 
              type="submit" 
              size="sm" 
              className="h-9 px-4"
              disabled={!searchQuery.trim() || isSearching}
            >
              {isSearching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2">
            AI-powered search with real-time results and citations
          </p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Search size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-medium text-muted-foreground">Search the Web</h3>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Ask any question and get real-time answers with sources
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {['Latest news', 'Weather forecast', 'Stock market', 'Recipe ideas'].map(suggestion => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-6"
                      onClick={() => {
                        setSearchQuery(suggestion);
                        searchInputRef.current?.focus();
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              searchResults.map(result => (
                <Card key={result.id} className="bg-card/50">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {result.isLoading ? (
                          <Loader2 size={12} className="animate-spin text-primary" />
                        ) : (
                          <Search size={12} className="text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-primary mb-1">{result.query}</p>
                        {result.isLoading ? (
                          <div className="space-y-2">
                            <div className="h-3 bg-muted animate-pulse rounded w-full" />
                            <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-foreground whitespace-pre-wrap">{result.answer}</p>
                            {result.citations.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-[9px] text-muted-foreground mb-1">Sources:</p>
                                <div className="flex flex-wrap gap-1">
                                  {result.citations.slice(0, 4).map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-[9px] text-primary hover:underline bg-primary/5 px-1.5 py-0.5 rounded"
                                    >
                                      <LinkIcon size={8} />
                                      {new URL(url).hostname.replace('www.', '')}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <p className="text-[8px] text-muted-foreground mt-2">
                          {format(result.timestamp, 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Full Photos View
  if (activeView === 'photos') {
    const filteredPhotos = getPhotosByCategory(photoCategory);
    
    return (
      <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveView('overview')}>
              <ChevronDown size={14} className="rotate-90" />
            </Button>
            <Image size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">MY PHOTOS</span>
            <Badge variant="secondary" className="text-[10px]">{photos.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 px-2 text-[10px]"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Plus size={10} className="mr-1" />
              Upload
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetchPhotos()} disabled={isPhotosLoading}>
              <RefreshCw size={12} className={isPhotosLoading ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-3 py-2 border-b border-border overflow-x-auto">
          <div className="flex gap-1.5 pb-1">
            {PHOTO_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={photoCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2 text-[10px] whitespace-nowrap flex-shrink-0"
                onClick={() => setPhotoCategory(cat.id)}
              >
                {cat.label}
                {cat.id === 'favorites' && photoStats.favorites > 0 && (
                  <Badge variant="secondary" className="ml-1 text-[8px] px-1">{photoStats.favorites}</Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Photos Actions */}
        {selectedPhotos.length > 0 && (
          <div className="px-3 py-2 border-b border-border bg-primary/5 flex items-center justify-between">
            <span className="text-xs text-primary">{selectedPhotos.length} selected</span>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 px-2 text-[10px]">
                    Share to...
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border-border">
                  <DropdownMenuLabel className="text-[10px]">Social Platforms</DropdownMenuLabel>
                  {SOCIAL_PLATFORMS.map(platform => (
                    <DropdownMenuItem
                      key={platform.id}
                      className="text-xs"
                      onClick={() => {
                        selectedPhotos.forEach(id => shareToSocial(id, platform.id));
                        setSelectedPhotos([]);
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: platform.color }}
                      />
                      {platform.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => setSelectedPhotos([])}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-3">
            {filteredPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {filteredPhotos.map(photo => (
                  <div
                    key={photo.id}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer group",
                      selectedPhotos.includes(photo.id) 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-transparent hover:border-border"
                    )}
                    onClick={() => togglePhotoSelection(photo.id)}
                  >
                    <img
                      src={getPhotoUrl(photo)}
                      alt={photo.file_name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Selection indicator */}
                    <div className={cn(
                      "absolute top-1 left-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedPhotos.includes(photo.id) 
                        ? "bg-primary border-primary" 
                        : "bg-background/80 border-border opacity-0 group-hover:opacity-100"
                    )}>
                      {selectedPhotos.includes(photo.id) && (
                        <CheckCircle2 size={12} className="text-primary-foreground" />
                      )}
                    </div>

                    {/* Favorite indicator */}
                    {photo.is_favorite && (
                      <Heart size={12} className="absolute top-1 right-1 text-red-500 fill-red-500" />
                    )}

                    {/* Shared indicator */}
                    {photo.shared_to.length > 0 && (
                      <div className="absolute bottom-1 left-1 flex gap-0.5">
                        {photo.shared_to.slice(0, 3).map(platform => (
                          <div
                            key={platform}
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: SOCIAL_PLATFORMS.find(p => p.id === platform)?.color || 'gray' 
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(photo.id, photo.is_favorite);
                        }}
                      >
                        <Heart size={12} className={photo.is_favorite ? "fill-red-500 text-red-500" : ""} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal size={12} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="bg-popover border-border">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-xs">
                              Set Category
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="bg-popover border-border">
                                {PHOTO_CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'favorites' && c.id !== 'recent').map(cat => (
                                  <DropdownMenuItem
                                    key={cat.id}
                                    className="text-xs"
                                    onClick={() => setCategory(photo.id, cat.id)}
                                  >
                                    {cat.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-xs">
                              Share to...
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent className="bg-popover border-border">
                                {SOCIAL_PLATFORMS.map(platform => (
                                  <DropdownMenuItem
                                    key={platform.id}
                                    className="text-xs"
                                    onClick={() => shareToSocial(photo.id, platform.id)}
                                  >
                                    {platform.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs text-destructive"
                            onClick={() => deletePhoto(photo.id)}
                          >
                            <Trash2 size={12} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image size={48} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No photos in this category</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={14} className="mr-1" />
                  Upload Photos
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Full Tasks View
  if (activeView === 'tasks') {
    return (
      <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveView('overview')}>
              <ChevronDown size={14} className="rotate-90" />
            </Button>
            <CheckSquare size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">ALL TASKS</span>
            <Badge variant="secondary" className="text-[10px]">{tasks.length}</Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {/* Quick Add */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
                className="h-8 text-sm"
              />
              <Button size="sm" className="h-8 px-3" onClick={handleQuickAddTask} disabled={!newTaskTitle.trim()}>
                <Plus size={14} />
              </Button>
            </div>
            
            {/* Overdue */}
            {overdueTasks.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-destructive mb-2 flex items-center gap-1">
                  <AlertCircle size={10} /> OVERDUE ({overdueTasks.length})
                </h3>
                <div className="space-y-1.5">
                  {overdueTasks.map(task => (
                    <TaskItem key={task.id} item={task} onComplete={() => completeItem(task.id)} onDelete={() => deleteItem(task.id)} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Active Tasks */}
            <div>
              <h3 className="text-[10px] font-mono text-muted-foreground mb-2">ACTIVE TASKS</h3>
              <div className="space-y-1.5">
                {tasks.filter(t => t.status !== 'completed').map(task => (
                  <TaskItem key={task.id} item={task} onComplete={() => completeItem(task.id)} onDelete={() => deleteItem(task.id)} />
                ))}
                {tasks.filter(t => t.status !== 'completed').length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No active tasks</p>
                )}
              </div>
            </div>
            
            {/* Completed */}
            {tasks.filter(t => t.status === 'completed').length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">COMPLETED</h3>
                <div className="space-y-1.5">
                  {tasks.filter(t => t.status === 'completed').slice(0, 5).map(task => (
                    <TaskItem key={task.id} item={task} onComplete={() => completeItem(task.id)} onDelete={() => deleteItem(task.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Full Goals View
  if (activeView === 'goals') {
    return (
      <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveView('overview')}>
              <ChevronDown size={14} className="rotate-90" />
            </Button>
            <Target size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">ALL GOALS</span>
            <Badge variant="secondary" className="text-[10px]">{goals.length}</Badge>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {goals.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {goals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No goals yet</p>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Full Habits View
  if (activeView === 'habits') {
    return (
      <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveView('overview')}>
              <ChevronDown size={14} className="rotate-90" />
            </Button>
            <TrendingUp size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">ALL HABITS</span>
            <Badge variant="secondary" className="text-[10px]">{habits.length}</Badge>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {habits.length > 0 ? (
              habits.map(habit => (
                <HabitCard key={habit.id} habit={habit} onComplete={() => completeHabit(habit.id)} />
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No habits yet</p>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Full Calendar View
  if (activeView === 'calendar') {
    return (
      <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveView('overview')}>
              <ChevronDown size={14} className="rotate-90" />
            </Button>
            <Calendar size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">SMART CALENDAR</span>
          </div>
        </div>
        <div className="flex-1 p-3 overflow-hidden">
          <SmartCalendar className="h-full" />
        </div>
      </div>
    );
  }

  // Email / Unified Inbox view
  if (activeView === 'email') {
    const hasEmailConnector = connectors.some(c => 
      ['gmail', 'outlook'].includes(c.platform) && c.isActive
    );
    
    return (
      <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveView('overview')}>
              <ChevronDown size={14} className="rotate-90" />
            </Button>
            <Mail size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase">UNIFIED INBOX</span>
            {hasEmailConnector && (
              <Badge variant="secondary" className="text-[10px]">Connected</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasEmailConnector && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-[10px]"
                onClick={async () => {
                  toast.loading('Syncing emails...');
                  const { error } = await supabase.functions.invoke('gmail-sync');
                  if (error) {
                    toast.error('Sync failed');
                  } else {
                    toast.success('Emails synced!');
                    window.location.reload();
                  }
                }}
              >
                <RefreshCw size={10} className="mr-1" />
                Sync
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-[10px]"
              onClick={() => setShowConnectEmailDialog(true)}
            >
              <Plug size={10} className="mr-1" />
              {hasEmailConnector ? 'Add Account' : 'Connect Email'}
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {hasEmailConnector ? (
            <UnifiedInbox className="h-full" hubFilter="personal" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect Your Email</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Connect Gmail or Outlook to see all your messages in one unified inbox, 
                with smart categorization powered by Atlas.
              </p>
              <Button onClick={() => setShowConnectEmailDialog(true)}>
                <Plug size={14} className="mr-2" />
                Connect Email Account
              </Button>
            </div>
          )}
        </div>
        
        {/* Connect Email Dialog */}
        <ConnectPlatformDialog
          open={showConnectEmailDialog}
          onOpenChange={setShowConnectEmailDialog}
          onConnect={async (platformId, email, accountName) => {
            await initializeConnector(platformId as ConnectorPlatform, { email, name: accountName });
            setShowConnectEmailDialog(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-card/90 border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
      {/* Header with dropdown */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={14} className="text-primary" />
          <span className="text-xs font-mono text-muted-foreground uppercase">MY OVERVIEW</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Add Items Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-mono">
                <Plus size={10} className="mr-1" />
                Add
                <ChevronDown size={10} className="ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
              {/* Life Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <Heart size={12} className="mr-2" />
                  Life
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover border-border">
                    {lifeActions.map(action => (
                      <DropdownMenuItem 
                        key={action.id} 
                        onClick={() => addActionToOverview(action.id)}
                        className="text-xs"
                        disabled={selectedActions.includes(action.id)}
                      >
                        <action.icon size={12} className="mr-2" style={{ color: action.color }} />
                        {action.label}
                        {selectedActions.includes(action.id) && (
                          <CheckCircle2 size={10} className="ml-auto text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Social Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <Instagram size={12} className="mr-2" />
                  Social
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover border-border">
                    {socialActions.map(action => (
                      <DropdownMenuItem 
                        key={action.id} 
                        onClick={() => addActionToOverview(action.id)}
                        className="text-xs"
                        disabled={selectedActions.includes(action.id)}
                      >
                        <action.icon size={12} className="mr-2" style={{ color: action.color }} />
                        {action.label}
                        {selectedActions.includes(action.id) && (
                          <CheckCircle2 size={10} className="ml-auto text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* More Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <MoreHorizontal size={12} className="mr-2" />
                  More
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="bg-popover border-border">
                    {moreActions.map(action => (
                      <DropdownMenuItem 
                        key={action.id} 
                        onClick={() => addActionToOverview(action.id)}
                        className="text-xs"
                        disabled={selectedActions.includes(action.id)}
                      >
                        <action.icon size={12} className="mr-2" style={{ color: action.color }} />
                        {action.label}
                        {selectedActions.includes(action.id) && (
                          <CheckCircle2 size={10} className="ml-auto text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              
              {/* Core items that were removed */}
              <DropdownMenuLabel className="text-[10px] text-muted-foreground">Core</DropdownMenuLabel>
              {defaultActions.filter(a => !selectedActions.includes(a.id)).map(action => (
                <DropdownMenuItem 
                  key={action.id} 
                  onClick={() => addActionToOverview(action.id)}
                  className="text-xs"
                >
                  <action.icon size={12} className="mr-2" style={{ color: action.color }} />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Content - Resizable Panels (vertical on desktop, stacked on mobile) */}
      {isMobile ? (
        // Mobile: Simple scrollable layout without resize handles
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Shortcuts Grid - 2 columns on mobile */}
            {sortedActions.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2">MY SHORTCUTS</h3>
                <div className="grid grid-cols-3 gap-2">
                  {sortedActions.map((action) => (
                    <PersonalQuickAction 
                      key={action.id}
                      icon={action.icon} 
                      label={action.label} 
                      count={'count' in action ? action.count : undefined}
                      badge={'badge' in action ? action.badge : undefined}
                      color={action.color} 
                      url={'url' in action ? action.url : undefined}
                      onClick={() => handleShortcutClick(action.id)} 
                      onRemove={() => removeActionFromOverview(action.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-card/50">
                <CardContent className="p-2 text-center">
                  <p className="text-lg font-bold text-primary">{stats.completedToday}</p>
                  <p className="text-[8px] text-muted-foreground">Today</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-2 text-center">
                  <p className="text-lg font-bold text-orange-500">{stats.totalStreak}</p>
                  <p className="text-[8px] text-muted-foreground">Streak</p>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-2 text-center">
                  <p className="text-lg font-bold">{stats.totalItems}</p>
                  <p className="text-[8px] text-muted-foreground">Items</p>
                </CardContent>
              </Card>
            </div>

            {/* New Widgets Row - Atlas Brief, Wellness, Focus (Mobile) */}
            <div className="space-y-3">
              <AtlasDailyBrief compact />
              <WellnessWidget compact />
              <FocusTimerWidget compact />
            </div>


            {/* Today's Tasks */}
            {todaysTasks.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock size={10} /> TODAY'S TASKS
                </h3>
                <div className="space-y-1.5">
                  {todaysTasks.slice(0, 5).map(task => (
                    <TaskItem key={task.id} item={task} onComplete={() => completeItem(task.id)} onDelete={() => deleteItem(task.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Overdue Warning */}
            {overdueTasks.length > 0 && (
              <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2">
                  <AlertCircle size={12} className="text-destructive" />
                  <span className="text-[10px] text-destructive font-medium">{overdueTasks.length} overdue</span>
                </div>
              </div>
            )}

            {/* Habits */}
            {habits.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                  <Flame size={10} /> DAILY HABITS
                </h3>
                <div className="space-y-2">
                  {habits.slice(0, 3).map(habit => (
                    <HabitCard key={habit.id} habit={habit} onComplete={() => completeHabit(habit.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Visualizations (Mobile) */}
            <div className="space-y-3">
              <HabitStreakChart />
              <GoalProgressTimeline />
            </div>

            {/* Goals */}
            {goals.length > 0 && (
              <div>
                <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                  <Target size={10} /> ACTIVE GOALS
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {goals.slice(0, 4).map(goal => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      ) : (
        // Desktop/Tablet: Single scrollable layout with individually draggable widgets
        <ScrollArea className="flex-1">
          <DragDropContext onDragEnd={handleWidgetDragEnd}>
            <Droppable droppableId="overview-widgets" direction="vertical">
              {(provided) => {
                // Filter out null widgets first to ensure consecutive indices
                const visibleWidgets = widgetOrder
                  .map(widgetId => ({ id: widgetId, config: getWidgetConfig(widgetId) }))
                  .filter(w => w.config !== null && w.config.content !== null);

                return (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="p-3 grid grid-cols-6 gap-3 auto-rows-min"
                  >
                    {visibleWidgets.map((widget, index) => (
                      <Draggable key={widget.id} draggableId={widget.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "relative group",
                              widget.config!.colSpan,
                              snapshot.isDragging && "opacity-90 shadow-lg z-50 bg-card rounded-lg"
                            )}
                          >
                            {/* Widget controls */}
                            <div className="absolute -left-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {/* Drag handle */}
                              <div 
                                {...provided.dragHandleProps}
                                className="p-0.5 rounded cursor-grab active:cursor-grabbing bg-muted/80 hover:bg-muted"
                              >
                                <GripVertical size={10} className="text-muted-foreground" />
                              </div>
                              {/* Remove button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeWidget(widget.id);
                                }}
                                className="p-0.5 rounded bg-muted/80 hover:bg-destructive/20 hover:text-destructive transition-colors"
                                title="Remove widget"
                              >
                                <X size={10} className="text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                            {widget.config!.content}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                );
              }}
            </Droppable>
          </DragDropContext>
        </ScrollArea>
      )}
    </div>
  );

  // Widget config with column spans
  function getWidgetConfig(widgetId: string): { content: React.ReactNode; colSpan: string } | null {
    switch (widgetId) {
      // Shortcuts header with controls - full width
      case 'shortcuts-header':
        if (sortedActions.length === 0) return null;
        return {
          colSpan: 'col-span-6',
          content: (
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-mono text-muted-foreground">MY SHORTCUTS</h3>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5"
                        onClick={handleAtlasOptimize}
                      >
                        <Sparkles size={10} className="text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Atlas: Optimize by usage
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {!actionPrefs.autoSortByUsage && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          onClick={handleResetToAutoSort}
                        >
                          <RefreshCw size={10} className="text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        Reset to auto-sort
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          )
        };

      // Stat cards - 2 columns each
      case 'stat-today':
        return {
          colSpan: 'col-span-2',
          content: (
            <Card className="bg-card/50 h-full">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.completedToday}</p>
                <p className="text-[10px] text-muted-foreground">Completed Today</p>
              </CardContent>
            </Card>
          )
        };
      case 'stat-streak':
        return {
          colSpan: 'col-span-2',
          content: (
            <Card className="bg-card/50 h-full">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-orange-500">{stats.totalStreak}</p>
                <p className="text-[10px] text-muted-foreground">Day Streak</p>
              </CardContent>
            </Card>
          )
        };
      case 'stat-items':
        return {
          colSpan: 'col-span-2',
          content: (
            <Card className="bg-card/50 h-full">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold">{stats.totalItems}</p>
                <p className="text-[10px] text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
          )
        };

      // AI Widgets - 2 columns each
      case 'widget-atlas-brief':
        return {
          colSpan: 'col-span-2',
          content: <AtlasDailyBrief compact />
        };
      case 'widget-wellness':
        return {
          colSpan: 'col-span-2',
          content: <WellnessWidget compact />
        };
      case 'widget-focus':
        return {
          colSpan: 'col-span-2',
          content: <FocusTimerWidget compact />
        };
      case 'widget-calendar':
        return {
          colSpan: 'col-span-6',
          content: <SmartCalendar compact />
        };
      case 'widget-nudges':
        return {
          colSpan: 'col-span-6',
          content: <SmartNudgesWidget compact />
        };
      case 'widget-life-balance':
        return {
          colSpan: 'col-span-6',
          content: <LifeBalancePanel compact />
        };
      case 'widget-orchestration':
        return {
          colSpan: 'col-span-6',
          content: <UniversalOrchestrationPanel compact />
        };
      
      // Connected apps - shows integrations as quick actions
      case 'widget-connected-apps':
        return {
          colSpan: 'col-span-6',
          content: (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <Plug size={10} /> CONNECTED APPS
                </h3>
              </div>
              <IntegrationQuickActions hubType="personal" maxItems={8} />
            </div>
          )
        };


      // Today's tasks - full width
      case 'todays-tasks':
        if (todaysTasks.length === 0) return null;
        return {
          colSpan: 'col-span-6',
          content: (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <Clock size={10} /> TODAY'S TASKS
                </h3>
                <IntegrationSurfaceSummary surface="tasks" hubType="personal" />
              </div>
              <div className="space-y-1.5">
                {todaysTasks.slice(0, 5).map(task => (
                  <TaskItem key={task.id} item={task} onComplete={() => completeItem(task.id)} onDelete={() => deleteItem(task.id)} />
                ))}
              </div>
            </div>
          )
        };

      // Overdue - full width
      case 'overdue':
        if (overdueTasks.length === 0) return null;
        return {
          colSpan: 'col-span-6',
          content: (
            <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-2">
                <AlertCircle size={12} className="text-destructive" />
                <span className="text-[10px] text-destructive font-medium">{overdueTasks.length} overdue tasks</span>
              </div>
            </div>
          )
        };

      // Habits - full width
      case 'habits':
        if (habits.length === 0) return null;
        return {
          colSpan: 'col-span-6',
          content: (
            <div>
              <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                <Flame size={10} /> DAILY HABITS
              </h3>
              <div className="space-y-2">
                {habits.slice(0, 3).map(habit => (
                  <HabitCard key={habit.id} habit={habit} onComplete={() => completeHabit(habit.id)} />
                ))}
              </div>
            </div>
          )
        };

      // Visualizations - 3 columns each
      case 'viz-habit-streak':
        return {
          colSpan: 'col-span-3',
          content: <HabitStreakChart />
        };
      case 'viz-goal-timeline':
        return {
          colSpan: 'col-span-3',
          content: <GoalProgressTimeline />
        };

      // Goals - full width
      case 'goals':
        if (goals.length === 0) return null;
        return {
          colSpan: 'col-span-6',
          content: (
            <div>
              <h3 className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                <Target size={10} /> ACTIVE GOALS
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {goals.slice(0, 4).map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )
        };

      default:
        // Handle individual shortcut widgets (format: 'shortcut-{actionId}')
        if (widgetId.startsWith('shortcut-')) {
          const actionId = widgetId.replace('shortcut-', '');
          const action = allActionsMap[actionId];
          if (!action || !selectedActions.includes(actionId)) return null;
          
          return {
            colSpan: 'col-span-1',
            content: (
              <PersonalQuickAction 
                icon={action.icon} 
                label={action.label} 
                count={'count' in action ? action.count : undefined}
                badge={'badge' in action ? action.badge : undefined}
                color={action.color} 
                url={'url' in action ? action.url : undefined}
                onClick={() => handleShortcutClick(action.id)} 
              />
            )
          };
        }
        return null;
    }
  }
}
