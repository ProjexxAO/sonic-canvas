// Fullscreen Detailed Dashboard - Shows all content from SimplifiedDashboard sections in detail
// Displays actual data: priority tasks, calendar events, emails, photos, finance, widgets

import { useMemo, useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  X,
  CheckSquare, 
  Calendar,
  Mail,
  Image,
  Wallet,
  LayoutGrid,
  Sun,
  Moon,
  Sunrise,
  Clock,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building,
  Star,
  Sparkles,
  Hexagon,
  Radio
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePersonalHub, PersonalItem } from '@/hooks/usePersonalHub';
import { useSmartCalendar } from '@/hooks/useSmartCalendar';
import { useCommunications } from '@/hooks/useCommunications';
import { useBanking } from '@/hooks/useBanking';
import { useAtlasSafe } from '@/contexts/AtlasContext';
import { useCustomWidgets } from '@/hooks/useCustomWidgets';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

interface FullscreenDetailedDashboardProps {
  userId: string | undefined;
  onClose: () => void;
}

// Get time-based greeting
function getGreeting(): { text: string; icon: typeof Sun; period: 'morning' | 'afternoon' | 'evening' } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', icon: Sunrise, period: 'morning' };
  if (hour < 17) return { text: 'Good afternoon', icon: Sun, period: 'afternoon' };
  return { text: 'Good evening', icon: Moon, period: 'evening' };
}

export function FullscreenDetailedDashboard({ 
  userId, 
  onClose 
}: FullscreenDetailedDashboardProps) {
  const { user } = useAuth();
  const { items, isLoading: itemsLoading, completeItem } = usePersonalHub();
  const { events, isLoading: calendarLoading } = useSmartCalendar();
  const { messages, isLoading: messagesLoading } = useCommunications(userId);
  const { accounts, transactions, isLoading: bankingLoading } = useBanking();
  const { widgets: customWidgets } = useCustomWidgets();
  
  // Atlas voice context (safe - doesn't throw if not in provider)
  const atlas = useAtlasSafe();
  
  // Loading timeout to prevent indefinite loading state
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  
  // Set a 3-second timeout for initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const userName = user?.email?.split('@')[0] || 'there';
  
  // Toggle Atlas voice activation
  const handleAtlasActivate = useCallback(() => {
    if (atlas) {
      if (atlas.isConnected) {
        atlas.stopConversation();
      } else {
        atlas.startConversation();
      }
    }
  }, [atlas]);

  // Priority tasks (same as SimplifiedDashboard)
  const priorityTasks = useMemo(() => {
    return items
      .filter(i => 
        i.item_type === 'task' && 
        i.status !== 'completed' &&
        (i.priority === 'urgent' || i.priority === 'high')
      )
      .sort((a, b) => {
        if (a.priority === 'urgent') return -1;
        if (b.priority === 'urgent') return 1;
        return 0;
      });
  }, [items]);

  // Today's and upcoming events
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => e.startAt >= now)
      .slice(0, 8);
  }, [events]);

  // Recent emails (unread/incoming)
  const recentEmails = useMemo(() => {
    return messages
      .filter(m => m.is_incoming || m.status === 'delivered')
      .slice(0, 6);
  }, [messages]);

  // Finance summary
  const financeSummary = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const recentTransactions = transactions.slice(0, 8);
    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return { totalBalance, recentTransactions, income, expenses };
  }, [accounts, transactions]);

  // Only show loading if we're truly loading AND haven't timed out
  const isLoading = (itemsLoading || calendarLoading || messagesLoading || bankingLoading) && !loadingTimedOut;

  if (isLoading) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your dashboard...</div>
      </div>,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] bg-background overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            greeting.period === 'morning' && "bg-orange-100 dark:bg-orange-900/30",
            greeting.period === 'afternoon' && "bg-yellow-100 dark:bg-yellow-900/30",
            greeting.period === 'evening' && "bg-indigo-100 dark:bg-indigo-900/30"
          )}>
            <greeting.icon size={24} className={cn(
              greeting.period === 'morning' && "text-orange-500",
              greeting.period === 'afternoon' && "text-yellow-500",
              greeting.period === 'evening' && "text-indigo-400"
            )} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {greeting.text}, {userName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClose} 
          className="h-10 px-4 rounded-xl gap-2 border-primary/30 bg-primary/5 hover:bg-primary/10"
        >
          <X size={18} className="text-primary" />
          <span className="text-sm font-medium text-primary">Close</span>
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* Section 1: Today's Focus - Priority Tasks */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CheckSquare size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Today's Focus</h2>
                <p className="text-sm text-muted-foreground">Your priority tasks</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{priorityTasks.length} items</Badge>
            </div>
            
            {priorityTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {priorityTasks.map((task, idx) => {
                  const isOverdue = task.due_date && isPast(parseISO(task.due_date));
                  const isDueToday = task.due_date && isToday(parseISO(task.due_date));
                  
                  return (
                    <Card key={task.id} className={cn(
                      "transition-colors",
                      idx === 0 && "md:col-span-2 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
                    )}>
                      <CardContent className="p-4 flex items-start gap-4">
                        <button 
                          onClick={() => completeItem(task.id)}
                          className="flex-shrink-0 mt-1"
                        >
                          <div className="w-6 h-6 rounded-full border-2 border-muted-foreground hover:border-primary transition-colors" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium">{task.title}</h3>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs flex-shrink-0",
                                task.priority === 'urgent' && "border-destructive text-destructive bg-destructive/10",
                                task.priority === 'high' && "border-orange-500 text-orange-500 bg-orange-500/10"
                              )}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          {task.content && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.content}</p>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <Clock size={12} className={isOverdue ? "text-destructive" : isDueToday ? "text-primary" : "text-muted-foreground"} />
                              <span className={cn(
                                "text-xs",
                                isOverdue ? "text-destructive font-medium" : isDueToday ? "text-primary font-medium" : "text-muted-foreground"
                              )}>
                                {isOverdue ? 'Overdue' : isDueToday ? 'Due today' : format(parseISO(task.due_date), 'MMM d')}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-8 text-center">
                  <CheckSquare size={40} className="text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold">All clear!</h3>
                  <p className="text-muted-foreground">No urgent tasks right now</p>
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Section 2: Calendar - Upcoming Events */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Calendar</h2>
                <p className="text-sm text-muted-foreground">Upcoming events</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{upcomingEvents.length} events</Badge>
            </div>
            
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingEvents.map((event) => {
                  const eventIsToday = isToday(event.startAt);
                  const eventIsTomorrow = isTomorrow(event.startAt);
                  
                  return (
                    <Card key={event.id} className={cn(
                      eventIsToday && "border-blue-500/30 bg-blue-500/5"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px]">
                            {eventIsToday ? 'Today' : eventIsTomorrow ? 'Tomorrow' : format(event.startAt, 'EEE, MMM d')}
                          </Badge>
                          {event.source !== 'personal' && (
                            <Badge variant="secondary" className="text-[10px]">{event.sourceName}</Badge>
                          )}
                        </div>
                        <h3 className="font-medium mb-1">{event.title}</h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock size={12} />
                            <span>{format(event.startAt, 'h:mm a')}</span>
                            {event.endAt && (
                              <span>- {format(event.endAt, 'h:mm a')}</span>
                            )}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin size={12} />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Users size={12} />
                              <span>{event.attendees.length} attendees</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="p-8 text-center">
                  <Calendar size={40} className="text-blue-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold">Calendar is clear</h3>
                  <p className="text-muted-foreground">No upcoming events scheduled</p>
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Section 3: Email - Recent Messages */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Mail size={20} className="text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Email</h2>
                <p className="text-sm text-muted-foreground">Recent messages</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{recentEmails.length} messages</Badge>
            </div>
            
            {recentEmails.length > 0 ? (
              <div className="space-y-2">
                {recentEmails.map((email) => (
                  <Card key={email.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">
                          {(email.from_address || email.sender?.display_name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">
                            {email.from_address || email.sender?.display_name || 'Unknown'}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(email.created_at), 'MMM d')}
                          </span>
                        </div>
                        {email.subject && (
                          <p className="text-sm font-medium text-foreground truncate">{email.subject}</p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">{email.content}</p>
                      </div>
                      {email.is_starred && (
                        <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-purple-500/5 border-purple-500/20">
                <CardContent className="p-8 text-center">
                  <Mail size={40} className="text-purple-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold">Inbox is clear</h3>
                  <p className="text-muted-foreground">No recent messages</p>
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          {/* Section 4: Photos placeholder */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Image size={20} className="text-pink-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Photos</h2>
                <p className="text-sm text-muted-foreground">Your photo library</p>
              </div>
            </div>
            
            <Card className="bg-pink-500/5 border-pink-500/20">
              <CardContent className="p-8 text-center">
                <Image size={40} className="text-pink-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Photo library</h3>
                <p className="text-muted-foreground">Connect your photos to see them here</p>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Section 5: Finance - Accounts & Transactions */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Wallet size={20} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Finance</h2>
                <p className="text-sm text-muted-foreground">Accounts & transactions</p>
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-2xl font-bold">
                    ${financeSummary.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Income</p>
                    <p className="text-lg font-semibold text-green-500">
                      +${financeSummary.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <TrendingDown size={20} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expenses</p>
                    <p className="text-lg font-semibold text-red-500">
                      -${financeSummary.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Accounts */}
            {accounts.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">ACCOUNTS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                          {account.account_type === 'credit' ? (
                            <CreditCard size={24} className="text-muted-foreground" />
                          ) : (
                            <Building size={24} className="text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{account.account_name}</p>
                          <p className="text-sm text-muted-foreground">{account.institution_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(account.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">{account.account_type}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {financeSummary.recentTransactions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">RECENT TRANSACTIONS</h3>
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {financeSummary.recentTransactions.map((tx) => (
                      <div key={tx.id} className="p-4 flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          tx.amount > 0 ? "bg-green-500/10" : "bg-red-500/10"
                        )}>
                          {tx.amount > 0 ? (
                            <ArrowUpRight size={20} className="text-green-500" />
                          ) : (
                            <ArrowDownRight size={20} className="text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{tx.merchant_name || tx.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(tx.transaction_date), 'MMM d, yyyy')}
                            {tx.category && ` • ${tx.category}`}
                          </p>
                        </div>
                        <p className={cn(
                          "font-semibold",
                          tx.amount > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {tx.amount > 0 ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {accounts.length === 0 && financeSummary.recentTransactions.length === 0 && (
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="p-8 text-center">
                  <Wallet size={40} className="text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold">No accounts connected</h3>
                  <p className="text-muted-foreground">Connect your bank accounts to track finances</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Section 6: Custom Widgets Content */}
          {customWidgets.length > 0 && (
            <>
              <Separator />
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <LayoutGrid size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Custom Widgets</h2>
                    <p className="text-sm text-muted-foreground">Your personalized widgets</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">{customWidgets.length} widgets</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customWidgets.map((widget) => (
                    <Card key={widget.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{widget.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm">
                          <p className="text-muted-foreground">Type: {widget.widget_type}</p>
                          {widget.data_sources && widget.data_sources.length > 0 && (
                            <p className="text-muted-foreground">Sources: {widget.data_sources.join(', ')}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </ScrollArea>
      
      {/* Floating Atlas Orb - Matches GlobalAtlasOrb style */}
      {atlas && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={handleAtlasActivate}
            className="relative w-14 h-14 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              boxShadow: atlas.isConnected 
                ? `0 0 ${15 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 25}px hsl(${atlas.isSpeaking ? '45' : '270'} 100% 50% / ${0.4 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.3}), 0 0 ${30 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 20}px hsl(200 100% 50% / ${0.2 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.2})`
                : `0 0 10px hsl(var(--primary) / 0.3)`
            }}
          >
            {/* Base nebula */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(ellipse at ${30 + (atlas.frequencyBands?.bass || 0) * 20}% ${40 + (atlas.frequencyBands?.mid || 0) * 20}%,
                    hsl(270 100% ${atlas.isConnected ? 50 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 30 : 40}%) 0%,
                    hsl(220 100% ${atlas.isConnected ? 40 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 20 : 30}%) 40%,
                    hsl(280 100% ${atlas.isConnected ? 25 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 15 : 20}%) 100%)`,
                transform: `scale(${1 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.08})`,
                transition: 'transform 0.1s ease-out',
              }}
            />
            
            {/* Swirl effect */}
            <div 
              className="absolute inset-0 rounded-full mix-blend-screen"
              style={{
                background: `conic-gradient(from 0deg at 50% 50%,
                    transparent 0deg,
                    hsl(280 100% ${60 + (atlas.frequencyBands?.bass || 0) * 30}% / ${0.5 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.4}) 60deg,
                    transparent 120deg,
                    hsl(200 100% ${70 + (atlas.frequencyBands?.mid || 0) * 25}% / ${0.45 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.4}) 180deg,
                    transparent 240deg,
                    hsl(320 100% ${65 + (atlas.frequencyBands?.treble || 0) * 30}% / ${0.4 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.4}) 300deg,
                    transparent 360deg)`,
                animation: atlas.isConnected && atlas.isSpeaking 
                  ? `spin ${2 - (atlas.outputVolume || 0)}s linear infinite` 
                  : atlas.isConnected 
                    ? 'spin 5s linear infinite' 
                    : 'spin 8s linear infinite',
                filter: `blur(${4 - (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 2}px)`,
              }}
            />
            
            {/* Energy core */}
            <div 
              className="absolute inset-0 m-auto rounded-full transition-all duration-100"
              style={{
                width: `${28 + (atlas.frequencyBands?.bass || 0) * 35}%`,
                height: `${28 + (atlas.frequencyBands?.bass || 0) * 35}%`,
                background: `radial-gradient(circle,
                    hsl(${atlas.isSpeaking ? '45 100%' : '190 100%'} ${80 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 20}% / ${0.7 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.3}) 0%,
                    hsl(${atlas.isSpeaking ? '320 100%' : '210 100%'} 70% / ${0.4 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.4}) 50%,
                    transparent 70%)`,
                filter: `blur(${2 - (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume)}px)`,
              }}
            />
            
            {/* Stars/sparkles */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                backgroundImage: `radial-gradient(1px 1px at 20% 30%, white ${0.6 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.4}, transparent),
                   radial-gradient(1px 1px at 60% 20%, white ${0.55 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.4}, transparent),
                   radial-gradient(1.5px 1.5px at 80% 50%, hsl(180 100% 80% / ${0.6 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.4}) 0%, transparent 100%),
                   radial-gradient(1.5px 1.5px at 30% 70%, hsl(280 100% 80% / ${0.55 + (atlas.isSpeaking ? atlas.outputVolume : atlas.inputVolume) * 0.4}) 0%, transparent 100%)`,
              }}
            />
            
            {/* Center icon - only when not connected */}
            {!atlas.isConnected && !atlas.isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Hexagon className="w-5 h-5 text-white/70" />
                  <Radio className="absolute inset-0 m-auto w-2.5 h-2.5 text-white/90" />
                </div>
              </div>
            )}
            
            {/* Speaking indicator */}
            {atlas.isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white/90 animate-pulse" />
              </div>
            )}
            
            {/* Connecting state */}
            {atlas.isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white/60 animate-ping" />
              </div>
            )}
          </button>
          
          {/* Connection indicator dot */}
          {atlas.isConnected && (
            <span 
              className={cn(
                "absolute -top-1 right-0 w-2.5 h-2.5 rounded-full border-2 border-background",
                atlas.isSpeaking ? "bg-secondary animate-pulse" : "bg-green-500"
              )} 
            />
          )}
        </div>
      )}
    </div>,
    document.body
  );
}

export default FullscreenDetailedDashboard;
