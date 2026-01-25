// Compact Finance Card - Balance with circular savings progress
// Inspired by Famous AI goal-oriented design patterns

import { useMemo, useState } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Target,
  PiggyBank,
  ChevronRight,
  Edit2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useBanking } from '@/hooks/useBanking';

interface CompactFinanceCardProps {
  className?: string;
  onClick?: () => void;
  savingsGoal?: number;
  onSavingsGoalChange?: (goal: number) => void;
}

// Circular progress component
function CircularProgress({ 
  value, 
  size = 64, 
  strokeWidth = 6,
  color = 'hsl(var(--primary))'
}: { 
  value: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="text-sm font-bold"
          style={{ color }}
        >
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}

export function CompactFinanceCard({ 
  className, 
  onClick,
  savingsGoal: externalGoal,
  onSavingsGoalChange
}: CompactFinanceCardProps) {
  const { accounts, transactions } = useBanking();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [localGoal, setLocalGoal] = useState(externalGoal || 10000);

  const savingsGoal = externalGoal ?? localGoal;

  // Calculate financial metrics
  const metrics = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => 
      sum + (acc.current_balance || 0), 0
    );

    // Last 30 days transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = transactions.filter(t => 
      new Date(t.transaction_date) >= thirtyDaysAgo
    );

    const income = recentTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = recentTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netFlow = income - expenses;
    const savingsProgress = savingsGoal > 0 
      ? Math.min((totalBalance / savingsGoal) * 100, 100) 
      : 0;

    // Savings rate
    const savingsRate = income > 0 
      ? Math.round(((income - expenses) / income) * 100) 
      : 0;

    return {
      totalBalance,
      income,
      expenses,
      netFlow,
      savingsProgress,
      savingsRate,
    };
  }, [accounts, transactions, savingsGoal]);

  const handleGoalSave = () => {
    setIsEditingGoal(false);
    onSavingsGoalChange?.(localGoal);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card 
      className={cn(
        "border bg-gradient-to-br from-card to-emerald-500/5 cursor-pointer transition-all duration-200 hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="flex-shrink-0">
            <CircularProgress 
              value={metrics.savingsProgress}
              size={72}
              strokeWidth={7}
              color={metrics.savingsProgress >= 75 
                ? 'hsl(142 70% 45%)' 
                : metrics.savingsProgress >= 50 
                  ? 'hsl(200 70% 50%)'
                  : 'hsl(var(--primary))'
              }
            />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Balance */}
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="text-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">Total Balance</span>
            </div>
            <p className="text-2xl font-bold text-foreground truncate">
              {formatCurrency(metrics.totalBalance)}
            </p>

            {/* Savings goal */}
            <div className="flex items-center gap-2 mt-2">
              <PiggyBank size={12} className="text-muted-foreground" />
              {isEditingGoal ? (
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <span className="text-[10px] text-muted-foreground">Goal: $</span>
                  <Input
                    type="number"
                    value={localGoal}
                    onChange={e => setLocalGoal(Number(e.target.value))}
                    className="h-6 w-20 text-xs px-1"
                    autoFocus
                    onBlur={handleGoalSave}
                    onKeyDown={e => e.key === 'Enter' && handleGoalSave()}
                  />
                </div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); setIsEditingGoal(true); }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Goal: {formatCurrency(savingsGoal)}</span>
                  <Edit2 size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Right side stats */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Net flow indicator */}
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1",
              metrics.netFlow >= 0 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}>
              {metrics.netFlow >= 0 ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{metrics.netFlow >= 0 ? '+' : ''}{formatCurrency(metrics.netFlow)}</span>
            </div>

            {/* Savings rate */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Target size={10} />
              <span>{metrics.savingsRate}% saved</span>
            </div>

            <ChevronRight size={16} className="text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CompactFinanceCard;
