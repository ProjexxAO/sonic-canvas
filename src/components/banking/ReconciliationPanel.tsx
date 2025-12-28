import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  AlertCircle,
  Link2,
  Unlink,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useBanking } from '@/hooks/useBanking';
import { format } from 'date-fns';

export function ReconciliationPanel() {
  const { 
    transactions, 
    reconciliations, 
    confirmReconciliation, 
    rejectReconciliation 
  } = useBanking();

  const pendingReconciliations = reconciliations.filter(r => r.match_status === 'pending');
  const confirmedReconciliations = reconciliations.filter(r => r.match_status === 'confirmed');
  const unmatchedTransactions = transactions.filter(
    t => !reconciliations.some(r => r.bank_transaction_id === t.id)
  );

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence >= 90) return 'text-green-500';
    if (confidence >= 70) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getMatchTypeBadge = (type: string) => {
    switch (type) {
      case 'auto':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Auto-matched</Badge>;
      case 'suggested':
        return <Badge variant="secondary">Suggested</Badge>;
      case 'manual':
        return <Badge variant="outline">Manual</Badge>;
      case 'split':
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Split</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {pendingReconciliations.length}
              {pendingReconciliations.length > 0 && <Clock className="h-5 w-5 text-yellow-500" />}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reconciled</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {confirmedReconciliations.length}
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unmatched</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {unmatchedTransactions.length}
              <Unlink className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Pending Reconciliations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Pending Reconciliations
          </CardTitle>
          <CardDescription>
            Review Atlas AI's transaction matches and confirm or reject them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingReconciliations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500/50" />
              <h3 className="font-semibold mb-2">All Caught Up!</h3>
              <p className="text-sm text-muted-foreground">
                No pending reconciliations to review
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {pendingReconciliations.map((rec) => {
                  const transaction = transactions.find(t => t.id === rec.bank_transaction_id);
                  if (!transaction) return null;

                  return (
                    <div 
                      key={rec.id}
                      className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getMatchTypeBadge(rec.match_type)}
                          {rec.match_confidence && (
                            <span className={`text-xs font-medium ${getConfidenceColor(rec.match_confidence)}`}>
                              {rec.match_confidence}% confidence
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {rec.matched_by === 'atlas_ai' ? 'Matched by Atlas AI' : rec.matched_by}
                        </span>
                      </div>

                      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
                        {/* Bank Transaction */}
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Bank Transaction</p>
                          <p className="font-medium text-sm">{transaction.merchant_name || transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                          </p>
                          <p className={`font-semibold mt-1 ${transaction.transaction_type === 'credit' ? 'text-green-500' : ''}`}>
                            {transaction.transaction_type === 'credit' ? '+' : '-'}
                            {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />

                        {/* Financial Record */}
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-1">Financial Record</p>
                          {rec.financial_record_id ? (
                            <>
                              <p className="font-medium text-sm">Invoice/Bill Match</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {rec.financial_record_id.slice(0, 8)}...
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              New transaction - no existing record
                            </p>
                          )}
                        </div>
                      </div>

                      {rec.match_notes && (
                        <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/30 rounded">
                          {rec.match_notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        <Button 
                          size="sm" 
                          onClick={() => confirmReconciliation(rec.id)}
                          className="flex-1"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirm Match
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => rejectReconciliation(rec.id)}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Unmatched Transactions */}
      {unmatchedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Unmatched Transactions
            </CardTitle>
            <CardDescription>
              These bank transactions don't have corresponding financial records yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {unmatchedTransactions.slice(0, 20).map((tx) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tx.transaction_type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {tx.transaction_type === 'credit' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-red-500" />
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
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                        Create Record →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">How Reconciliation Works</p>
              <p className="text-xs text-muted-foreground mt-1">
                Atlas AI automatically matches your bank transactions with invoices, bills, and other 
                financial records. Review the suggested matches and confirm or reject them. 
                Confirmed matches help keep your financials accurate and audit-ready.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
