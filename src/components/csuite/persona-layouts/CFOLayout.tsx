import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Receipt,
  CreditCard,
  AlertCircle,
  Calculator,
  BarChart3
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function CFOLayout({ 
  stats, 
  domainItems,
  onDomainClick,
  onItemClick 
}: PersonaLayoutProps) {
  const financialItems = domainItems.financials || [];
  const recentTransactions = financialItems.slice(0, 5);
  
  // Calculate some mock financial metrics from data
  const totalTransactions = stats.financials;
  const pendingItems = financialItems.filter((item: any) => item.status === 'pending').length;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Financial Health Dashboard */}
        <Section title="Financial Overview" icon={<DollarSign size={12} className="text-yellow-500" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Transactions" 
              value={totalTransactions} 
              icon={<Receipt size={10} className="text-yellow-500" />}
              color="hsl(45 80% 50%)"
            />
            <MetricCard 
              label="Pending" 
              value={pendingItems} 
              icon={<AlertCircle size={10} className="text-orange-500" />}
              color="hsl(30 80% 50%)"
            />
            <MetricCard 
              label="Documents" 
              value={stats.documents} 
              icon={<BarChart3 size={10} className="text-primary" />}
            />
          </div>
        </Section>

        {/* Cash Flow & Forecasts */}
        <Section title="Cash Flow Analysis" icon={<PieChart size={12} className="text-green-500" />}>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-muted/30">
              <div className="flex items-center gap-2">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-[10px] font-mono">Incoming</span>
              </div>
              <button 
                onClick={() => onDomainClick('financials')}
                className="text-xs font-mono text-green-500 hover:underline"
              >
                View Details →
              </button>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-muted/30">
              <div className="flex items-center gap-2">
                <TrendingDown size={12} className="text-red-500" />
                <span className="text-[10px] font-mono">Outgoing</span>
              </div>
              <button 
                onClick={() => onDomainClick('financials')}
                className="text-xs font-mono text-red-500 hover:underline"
              >
                View Details →
              </button>
            </div>
          </div>
        </Section>

        {/* Recent Financial Items */}
        <Section title="Recent Transactions" icon={<CreditCard size={12} className="text-primary" />}>
          {recentTransactions.length > 0 ? (
            <div className="space-y-1">
              {recentTransactions.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item)}
                  className="w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-foreground truncate max-w-[70%]">
                      {item.title}
                    </span>
                    <Badge 
                      variant={item.status === 'completed' ? 'default' : 'secondary'} 
                      className="text-[7px] font-mono px-1"
                    >
                      {item.status || 'pending'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button 
              onClick={() => onDomainClick('financials')}
              className="w-full text-center text-[10px] text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Click to load financial data
            </button>
          )}
        </Section>

        {/* Compliance & Reporting */}
        <Section title="Compliance Status" icon={<Calculator size={12} className="text-secondary" />}>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
              <span className="text-[9px] font-mono text-green-500">REPORTS</span>
              <div className="text-xs font-mono text-foreground">Up to date</div>
            </div>
            <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
              <span className="text-[9px] font-mono text-yellow-500">AUDITS</span>
              <div className="text-xs font-mono text-foreground">Scheduled</div>
            </div>
          </div>
        </Section>

        {/* Quick Tags */}
        <div className="flex items-center gap-2 px-1">
          <Badge variant="outline" className="text-[8px] font-mono">FINANCIAL HEALTH</Badge>
          <Badge variant="secondary" className="text-[8px] font-mono">FORECASTING</Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
