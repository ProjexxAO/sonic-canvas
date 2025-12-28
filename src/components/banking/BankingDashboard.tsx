import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, 
  Plus, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Settings,
  Lightbulb,
  Globe
} from 'lucide-react';
import { useBanking, BankAccount, BankTransaction, FinancialInsight } from '@/hooks/useBanking';
import { AddBankAccountDialog } from './AddBankAccountDialog';
import { TaxSettingsPanel } from './TaxSettingsPanel';
import { ReconciliationPanel } from './ReconciliationPanel';
import { format } from 'date-fns';

export function BankingDashboard() {
  const {
    accounts,
    transactions,
    reconciliations,
    insights,
    isLoading,
    refreshAll,
  } = useBanking();

  const [activeTab, setActiveTab] = useState('overview');
  const [showAddAccount, setShowAddAccount] = useState(false);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
  const primaryAccount = accounts.find(a => a.is_primary);
  
  const pendingReconciliations = reconciliations.filter(r => r.match_status === 'pending');
  const recentTransactions = transactions.slice(0, 10);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'cashflow_forecast': return <TrendingUp className="h-4 w-4" />;
      case 'spending_alert': return <AlertCircle className="h-4 w-4" />;
      case 'tax_reminder': return <FileText className="h-4 w-4" />;
      case 'optimization': return <Lightbulb className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div>
          <h2 className="text-lg font-semibold">Banking & Finance</h2>
          <p className="text-sm text-muted-foreground">Manage accounts, reconcile transactions, optimize cashflow</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button size="sm" onClick={() => setShowAddAccount(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="reconciliation">
            Reconciliation
            {pendingReconciliations.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                {pendingReconciliations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="insights">
            Insights
            {insights.filter(i => !i.is_read).length > 0 && (
              <Badge className="ml-2 h-5 px-1.5">
                {insights.filter(i => !i.is_read).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tax">Tax Settings</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* Balance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardHeader className="pb-2">
                  <CardDescription>Total Balance</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(totalBalance)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pending Reconciliations</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {pendingReconciliations.length}
                    {pendingReconciliations.length > 0 && (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setActiveTab('reconciliation')}>
                    Review matches →
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Insights</CardDescription>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {insights.length}
                    <Lightbulb className="h-5 w-5 text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setActiveTab('insights')}>
                    View recommendations →
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Transactions</CardTitle>
                <CardDescription>Latest bank activity</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-xs">Connect a bank account or import transactions</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${tx.transaction_type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {tx.transaction_type === 'credit' ? (
                              <ArrowDownRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{tx.merchant_name || tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.transaction_date), 'MMM d, yyyy')}
                              {tx.category && ` • ${tx.category}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${tx.transaction_type === 'credit' ? 'text-green-500' : ''}`}>
                            {tx.transaction_type === 'credit' ? '+' : '-'}
                            {formatCurrency(Math.abs(tx.amount), tx.currency)}
                          </p>
                          {tx.is_pending && (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Insights */}
            {insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Atlas Insights</CardTitle>
                  <CardDescription>AI-powered financial recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.slice(0, 3).map((insight) => (
                      <div 
                        key={insight.id} 
                        className={`p-3 rounded-lg border ${!insight.is_read ? 'bg-primary/5 border-primary/20' : 'border-border/50'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={getPriorityColor(insight.priority)}>
                            {getInsightIcon(insight.insight_type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                            {insight.impact_amount && (
                              <p className="text-xs text-primary mt-1">
                                Potential impact: {formatCurrency(insight.impact_amount, insight.impact_currency)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="accounts" className="mt-0 space-y-4">
            {accounts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-2">No Bank Accounts Connected</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your bank accounts to enable automatic transaction syncing and reconciliation.
                  </p>
                  <Button onClick={() => setShowAddAccount(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((account) => (
                  <Card key={account.id} className={account.is_primary ? 'border-primary/50' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {account.account_name}
                              {account.is_primary && (
                                <Badge variant="secondary" className="text-xs">Primary</Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{account.institution_name}</CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={account.sync_status === 'synced' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {account.sync_status === 'synced' ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" />Synced</>
                          ) : (
                            account.sync_status
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Current Balance</span>
                          <span className="font-semibold">
                            {account.current_balance !== null 
                              ? formatCurrency(account.current_balance, account.currency)
                              : 'Not available'}
                          </span>
                        </div>
                        {account.available_balance !== null && account.available_balance !== account.current_balance && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Available</span>
                            <span className="text-sm">
                              {formatCurrency(account.available_balance, account.currency)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Type</span>
                          <span className="text-sm capitalize">{account.account_type}</span>
                        </div>
                        {account.account_number_masked && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Account</span>
                            <span className="text-sm font-mono">••••{account.account_number_masked}</span>
                          </div>
                        )}
                        {account.last_sync_at && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">
                              Last synced: {format(new Date(account.last_sync_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reconciliation" className="mt-0">
            <ReconciliationPanel />
          </TabsContent>

          <TabsContent value="insights" className="mt-0 space-y-4">
            {insights.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-semibold mb-2">No Active Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Atlas will analyze your financial data and provide recommendations.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tax" className="mt-0">
            <TaxSettingsPanel />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <AddBankAccountDialog 
        open={showAddAccount} 
        onOpenChange={setShowAddAccount} 
      />
    </div>
  );
}

function InsightCard({ insight }: { insight: FinancialInsight }) {
  const { markInsightRead, actionInsight } = useBanking();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'cashflow_forecast': return <TrendingUp className="h-5 w-5" />;
      case 'spending_alert': return <AlertCircle className="h-5 w-5" />;
      case 'tax_reminder': return <FileText className="h-5 w-5" />;
      case 'optimization': return <Lightbulb className="h-5 w-5" />;
      case 'anomaly': return <AlertCircle className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-500">High</Badge>;
      case 'medium': return <Badge variant="secondary">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <Card className={!insight.is_read ? 'border-primary/30 bg-primary/5' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              {getInsightIcon(insight.insight_type)}
            </div>
            <div>
              <CardTitle className="text-base">{insight.title}</CardTitle>
              <CardDescription className="capitalize">{insight.insight_type.replace('_', ' ')}</CardDescription>
            </div>
          </div>
          {getPriorityBadge(insight.priority)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{insight.description}</p>
        
        {insight.recommendation && (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Recommendation</p>
            <p className="text-sm">{insight.recommendation}</p>
          </div>
        )}

        {insight.impact_amount && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>Potential impact: </span>
            <span className="font-semibold text-primary">
              {formatCurrency(insight.impact_amount, insight.impact_currency)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          {!insight.is_read && (
            <Button variant="outline" size="sm" onClick={() => markInsightRead(insight.id)}>
              Mark as Read
            </Button>
          )}
          <Button size="sm" onClick={() => actionInsight(insight.id)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Take Action
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {format(new Date(insight.created_at), 'MMM d, yyyy h:mm a')}
        </p>
      </CardContent>
    </Card>
  );
}
