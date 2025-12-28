import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { 
  ArrowLeft,
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  PieChart,
  BarChart3,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  List,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FinancialItem } from '@/hooks/useCSuiteData';
import { FinancialFormDialog } from './FinancialFormDialog';
import { useAuth } from '@/hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface FinancialsFullScreenViewProps {
  items: FinancialItem[];
  isLoading: boolean;
  onBack: () => void;
  onItemClick: (item: FinancialItem) => void;
  onRefresh?: () => void;
}

type TabType = 'overview' | 'transactions' | 'invoices' | 'bills' | 'reports';

const CHART_COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export function FinancialsFullScreenView({
  items,
  isLoading,
  onBack,
  onItemClick,
  onRefresh,
}: FinancialsFullScreenViewProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('this_month');
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const [defaultType, setDefaultType] = useState('expense');

  const handleAdd = useCallback((type: string = 'expense') => {
    setEditingItem(null);
    setDefaultType(type);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((item: FinancialItem) => {
    setEditingItem(item);
    setFormOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Filter items based on date range
  const filteredByDate = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;
    
    switch (dateRange) {
      case 'this_month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last_month':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'last_3_months':
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case 'last_6_months':
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return items;
    }
    
    return items.filter(item => isWithinInterval(item.date, { start, end }));
  }, [items, dateRange]);

  // Calculate financial metrics
  const metrics = useMemo(() => {
    const income = filteredByDate
      .filter(i => i.type === 'income' || i.type === 'invoice')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    
    const expenses = filteredByDate
      .filter(i => i.type === 'expense' || i.type === 'bill')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    
    const pending = filteredByDate
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
    
    const overdue = filteredByDate
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    return { income, expenses, netProfit: income - expenses, pending, overdue };
  }, [filteredByDate]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredByDate.forEach(item => {
      const cat = item.category || 'Uncategorized';
      breakdown[cat] = (breakdown[cat] || 0) + (item.amount || 0);
    });
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredByDate]);

  // Monthly trend data
  const monthlyTrend = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const key = format(month, 'MMM');
      months[key] = { income: 0, expenses: 0 };
    }
    
    items.forEach(item => {
      const key = format(item.date, 'MMM');
      if (months[key]) {
        if (item.type === 'income' || item.type === 'invoice') {
          months[key].income += item.amount || 0;
        } else {
          months[key].expenses += item.amount || 0;
        }
      }
    });
    
    return Object.entries(months).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      profit: data.income - data.expenses,
    }));
  }, [items]);

  // Filter transactions
  const filteredItems = useMemo(() => {
    return filteredByDate.filter(item => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return true;
    });
  }, [filteredByDate, searchQuery, typeFilter, statusFilter]);

  const invoices = useMemo(() => filteredByDate.filter(i => i.type === 'invoice'), [filteredByDate]);
  const bills = useMemo(() => filteredByDate.filter(i => i.type === 'bill'), [filteredByDate]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-500';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'overdue': return 'bg-red-500/20 text-red-500';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowUpRight size={14} className="text-green-500" />;
      case 'expense': return <ArrowDownRight size={14} className="text-red-500" />;
      case 'invoice': return <FileText size={14} className="text-blue-500" />;
      case 'bill': return <Receipt size={14} className="text-orange-500" />;
      default: return <DollarSign size={14} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {user && (
        <FinancialFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          transaction={editingItem}
          defaultType={defaultType}
          userId={user.id}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <div className="p-2 rounded bg-yellow-500/20">
          <DollarSign size={16} className="text-yellow-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Financial Center</h3>
          <p className="text-[10px] text-muted-foreground">{items.length} transactions</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="last_3_months">Last 3 Months</SelectItem>
            <SelectItem value="last_6_months">Last 6 Months</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="default" size="sm" className="h-7 text-xs" onClick={() => handleAdd('expense')}>
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 justify-start bg-muted/50 h-8">
          <TabsTrigger value="overview" className="text-xs h-6">
            <BarChart3 size={12} className="mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs h-6">
            <List size={12} className="mr-1" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs h-6">
            <FileText size={12} className="mr-1" />
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="bills" className="text-xs h-6">
            <Receipt size={12} className="mr-1" />
            Bills ({bills.length})
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs h-6">
            <PieChart size={12} className="mr-1" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              {/* Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Income</span>
                  </div>
                  <p className="text-lg font-bold text-green-500">
                    ${metrics.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={14} className="text-red-500" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Expenses</span>
                  </div>
                  <p className="text-lg font-bold text-red-500">
                    ${metrics.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={14} className="text-primary" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Net Profit</span>
                  </div>
                  <p className={`text-lg font-bold ${metrics.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${Math.abs(metrics.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-yellow-500" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Pending</span>
                  </div>
                  <p className="text-lg font-bold text-yellow-500">
                    ${metrics.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  {metrics.overdue > 0 && (
                    <p className="text-[9px] text-red-500 mt-1">
                      ${metrics.overdue.toLocaleString()} overdue
                    </p>
                  )}
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trend Chart */}
                <div className="p-3 rounded-lg bg-card border border-border">
                  <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 size={14} />
                    Cash Flow Trend
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrend}>
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ fontSize: 10, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                        />
                        <Area type="monotone" dataKey="income" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="p-3 rounded-lg bg-card border border-border">
                  <h4 className="text-xs font-semibold mb-3 flex items-center gap-2">
                    <PieChart size={14} />
                    Spending by Category
                  </h4>
                  <div className="h-48 flex items-center">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={categoryBreakdown}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            innerRadius={30}
                          >
                            {categoryBreakdown.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                            contentStyle={{ fontSize: 10, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/2 space-y-1">
                      {categoryBreakdown.map((cat, i) => (
                        <div key={cat.name} className="flex items-center gap-2 text-[10px]">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="flex-1 truncate text-muted-foreground">{cat.name}</span>
                          <span className="font-mono">${cat.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => handleAdd('income')}>
                  <ArrowUpRight size={16} className="text-green-500" />
                  <span className="text-[10px]">Record Income</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => handleAdd('expense')}>
                  <ArrowDownRight size={16} className="text-red-500" />
                  <span className="text-[10px]">Record Expense</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => handleAdd('invoice')}>
                  <FileText size={16} className="text-blue-500" />
                  <span className="text-[10px]">Create Invoice</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => handleAdd('bill')}>
                  <Receipt size={16} className="text-orange-500" />
                  <span className="text-[10px]">Add Bill</span>
                </Button>
              </div>

              {/* Recent Transactions */}
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold">Recent Transactions</h4>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setActiveTab('transactions')}>
                    View All
                  </Button>
                </div>
                <div className="space-y-2">
                  {filteredByDate.slice(0, 5).map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleEdit(item)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg bg-background hover:bg-muted/30 transition-colors text-left"
                    >
                      {getTypeIcon(item.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.title}</p>
                        <p className="text-[9px] text-muted-foreground">{format(item.date, 'MMM d')} · {item.category || item.type}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-mono ${item.type === 'income' || item.type === 'invoice' ? 'text-green-500' : 'text-red-500'}`}>
                          {item.type === 'income' || item.type === 'invoice' ? '+' : '-'}${item.amount?.toLocaleString()}
                        </p>
                        <Badge className={`text-[8px] ${getStatusColor(item.status)}`}>{item.status}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="flex-1 overflow-hidden m-0 flex flex-col">
          <div className="px-3 py-2 border-b border-border flex gap-2 flex-wrap">
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs flex-1 min-w-[150px]"
            />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="bill">Bill</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-20">
                  <DollarSign size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleEdit(item)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-muted/50">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-muted-foreground">{format(item.date, 'MMM d, yyyy')}</span>
                        {item.category && <Badge variant="outline" className="text-[8px]">{item.category}</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-semibold ${item.type === 'income' || item.type === 'invoice' ? 'text-green-500' : 'text-red-500'}`}>
                        {item.type === 'income' || item.type === 'invoice' ? '+' : '-'}${item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <Badge className={`text-[8px] ${getStatusColor(item.status)}`}>{item.status}</Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="flex-1 overflow-hidden m-0 flex flex-col">
          <div className="px-3 py-2 border-b border-border flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{invoices.length} invoices</p>
            <Button size="sm" className="h-7 text-xs" onClick={() => handleAdd('invoice')}>
              <Plus size={12} className="mr-1" />
              New Invoice
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {invoices.length === 0 ? (
                <div className="text-center py-20">
                  <FileText size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No invoices yet</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => handleAdd('invoice')}>
                    <Plus size={14} className="mr-1" />
                    Create Invoice
                  </Button>
                </div>
              ) : (
                invoices.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleEdit(item)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <FileText size={14} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {format(item.date, 'MMM d, yyyy')}
                        {item.metadata?.counterparty && ` · ${item.metadata.counterparty}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold text-blue-500">
                        ${item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <Badge className={`text-[8px] ${getStatusColor(item.status)}`}>{item.status}</Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Bills Tab */}
        <TabsContent value="bills" className="flex-1 overflow-hidden m-0 flex flex-col">
          <div className="px-3 py-2 border-b border-border flex justify-between items-center">
            <p className="text-xs text-muted-foreground">{bills.length} bills</p>
            <Button size="sm" className="h-7 text-xs" onClick={() => handleAdd('bill')}>
              <Plus size={12} className="mr-1" />
              Add Bill
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {bills.length === 0 ? (
                <div className="text-center py-20">
                  <Receipt size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No bills yet</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => handleAdd('bill')}>
                    <Plus size={14} className="mr-1" />
                    Add Bill
                  </Button>
                </div>
              ) : (
                bills.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleEdit(item)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/40 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Receipt size={14} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        Due: {item.metadata?.due_date ? format(new Date(item.metadata.due_date), 'MMM d') : 'N/A'}
                        {item.metadata?.counterparty && ` · ${item.metadata.counterparty}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-semibold text-orange-500">
                        ${item.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <Badge className={`text-[8px] ${getStatusColor(item.status)}`}>{item.status}</Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="flex-1 overflow-hidden m-0">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Profit & Loss Summary */}
                <div className="p-4 rounded-lg bg-card border border-border">
                  <h4 className="text-sm font-semibold mb-4">Profit & Loss Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Total Income</span>
                      <span className="text-sm font-mono text-green-500">+${metrics.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground">Total Expenses</span>
                      <span className="text-sm font-mono text-red-500">-${metrics.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-semibold">Net Profit/Loss</span>
                      <span className={`text-lg font-mono font-bold ${metrics.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${Math.abs(metrics.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Accounts Status */}
                <div className="p-4 rounded-lg bg-card border border-border">
                  <h4 className="text-sm font-semibold mb-4">Accounts Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded bg-green-500/10">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Paid</p>
                        <p className="text-[10px] text-muted-foreground">{filteredByDate.filter(i => i.status === 'paid').length} transactions</p>
                      </div>
                      <span className="text-sm font-mono">
                        ${filteredByDate.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded bg-yellow-500/10">
                      <Clock size={16} className="text-yellow-500" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Pending</p>
                        <p className="text-[10px] text-muted-foreground">{filteredByDate.filter(i => i.status === 'pending').length} transactions</p>
                      </div>
                      <span className="text-sm font-mono">${metrics.pending.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded bg-red-500/10">
                      <AlertCircle size={16} className="text-red-500" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Overdue</p>
                        <p className="text-[10px] text-muted-foreground">{filteredByDate.filter(i => i.status === 'overdue').length} transactions</p>
                      </div>
                      <span className="text-sm font-mono">${metrics.overdue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Breakdown Chart */}
              <div className="p-4 rounded-lg bg-card border border-border">
                <h4 className="text-sm font-semibold mb-4">Monthly Income vs Expenses</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrend}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ fontSize: 10, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
