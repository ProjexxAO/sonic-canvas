import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket,
  TrendingUp,
  DollarSign,
  Target,
  Lightbulb,
  BarChart3,
  Users,
  Zap,
  Globe,
  AlertTriangle,
  Shield,
  Briefcase,
  PieChart,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Wallet,
  LineChart,
  Sparkles,
  Compass,
  Activity,
  FileText
} from 'lucide-react';
import { PersonaLayoutProps } from './types';
import { Section, MetricCard } from './shared';

export function EntrepreneurLayout({ 
  stats, 
  agents = [], 
  enterpriseData,
  onDomainClick 
}: PersonaLayoutProps) {
  const totalItems = Object.values(stats).reduce((a, b) => a + b, 0);
  const activeAgents = agents.filter(a => a.status === 'ACTIVE').length;
  
  // Simulated business metrics (would come from real data in production)
  const businessHealth = 78;
  const revenueGrowth = 12.5;
  const taskCompletion = 85;
  const customerSatisfaction = 92;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1">
        {/* Command Center Header */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-3">
          <div className="absolute top-0 right-0 opacity-10">
            <Rocket size={48} className="text-primary" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Rocket size={14} className="text-primary" />
            <span className="text-[10px] font-mono uppercase text-primary font-semibold">
              Autonomous Business Architect
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <Activity size={10} className="text-green-500" />
              <span className="text-[9px] text-muted-foreground">Business Health</span>
              <span className="text-[10px] font-mono text-green-500">{businessHealth}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={10} className="text-primary" />
              <span className="text-[9px] text-muted-foreground">Growth</span>
              <span className="text-[10px] font-mono text-primary">+{revenueGrowth}%</span>
            </div>
          </div>
        </div>

        {/* Strategic Dashboard */}
        <Section title="Strategic Dashboard" icon={<Compass size={12} className="text-primary" />}>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard 
              label="Revenue Tracked" 
              value={`$${(stats.financials * 1250).toLocaleString()}`} 
              icon={<DollarSign size={10} className="text-green-500" />}
              trend="up"
            />
            <MetricCard 
              label="Active Tasks" 
              value={stats.tasks} 
              icon={<CheckCircle2 size={10} className="text-blue-500" />}
              color="hsl(200 70% 50%)"
            />
            <MetricCard 
              label="Automation" 
              value={activeAgents} 
              icon={<Zap size={10} className="text-yellow-500" />}
              color="hsl(45 80% 50%)"
            />
          </div>
        </Section>

        {/* Financial Health */}
        <Section title="Financial Autopilot" icon={<Wallet size={12} className="text-green-500" />}>
          <div className="space-y-2">
            <button 
              onClick={() => onDomainClick('financials')}
              className="w-full text-left p-2 rounded bg-gradient-to-r from-green-500/10 to-transparent hover:from-green-500/20 transition-colors border border-green-500/20"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={10} className="text-green-500" />
                  <span className="text-[9px] font-mono text-green-500">CASH FLOW</span>
                </div>
                <ArrowUpRight size={10} className="text-green-500" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono text-green-500">{stats.financials}</span>
                <span className="text-[8px] text-muted-foreground">transactions tracked</span>
              </div>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/30 border border-border">
                <div className="flex items-center gap-1 mb-1">
                  <PieChart size={8} className="text-primary" />
                  <span className="text-[8px] text-muted-foreground">Expense Ratio</span>
                </div>
                <span className="text-xs font-mono text-foreground">32%</span>
              </div>
              <div className="p-2 rounded bg-muted/30 border border-border">
                <div className="flex items-center gap-1 mb-1">
                  <LineChart size={8} className="text-primary" />
                  <span className="text-[8px] text-muted-foreground">Profit Margin</span>
                </div>
                <span className="text-xs font-mono text-foreground">24%</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Opportunity Radar */}
        <Section title="Opportunity Radar" icon={<Target size={12} className="text-yellow-500" />}>
          <div className="space-y-2">
            {enterpriseData?.lastRecommendations?.recommendations?.slice(0, 2).map((rec: any, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-yellow-500/5 border border-yellow-500/20">
                <Lightbulb size={10} className="text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] text-foreground block">{rec.recommendation?.slice(0, 60) || 'New opportunity identified'}...</span>
                  <span className="text-[8px] text-muted-foreground">{rec.category || 'Growth'}</span>
                </div>
              </div>
            )) || (
              <>
                <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/5 border border-yellow-500/20">
                  <Lightbulb size={10} className="text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-foreground block">Market expansion opportunity detected</span>
                    <span className="text-[8px] text-muted-foreground">Growth Strategy</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded bg-green-500/5 border border-green-500/20">
                  <TrendingUp size={10} className="text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-foreground block">Cost optimization potential: 15% savings</span>
                    <span className="text-[8px] text-muted-foreground">Efficiency</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Section>

        {/* Customer & Market Intelligence */}
        <Section title="Customer Intelligence" icon={<Users size={12} className="text-blue-500" />}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Customer Satisfaction</span>
              <span className="text-[10px] font-mono text-green-500">{customerSatisfaction}%</span>
            </div>
            <Progress value={customerSatisfaction} className="h-1.5" />
            <button 
              onClick={() => onDomainClick('communications')}
              className="w-full flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Globe size={10} className="text-blue-500" />
                <span className="text-[9px] text-foreground">Customer Touchpoints</span>
              </div>
              <span className="text-sm font-mono text-blue-500">{stats.communications}</span>
            </button>
          </div>
        </Section>

        {/* Risk & Compliance Matrix */}
        <Section title="Risk & Compliance" icon={<Shield size={12} className="text-red-400" />}>
          <div className="space-y-1.5">
            {enterpriseData?.lastAnalysis?.risks?.slice(0, 2).map((risk: any, i: number) => (
              <div key={i} className="flex items-start gap-1.5 text-[9px]">
                <AlertTriangle size={8} className="text-yellow-500 mt-0.5 shrink-0" />
                <span className="text-foreground/80">{risk.risk?.slice(0, 45) || 'Risk identified'}...</span>
              </div>
            )) || (
              <>
                <div className="flex items-start gap-1.5 text-[9px]">
                  <CheckCircle2 size={8} className="text-green-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/80">Tax compliance up to date</span>
                </div>
                <div className="flex items-start gap-1.5 text-[9px]">
                  <AlertTriangle size={8} className="text-yellow-500 mt-0.5 shrink-0" />
                  <span className="text-foreground/80">Review insurance coverage (due: 30 days)</span>
                </div>
              </>
            )}
          </div>
        </Section>

        {/* Goal Progress */}
        <Section title="Goal Tracker" icon={<Target size={12} className="text-primary" />}>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">Monthly Revenue</span>
                <span className="text-[9px] font-mono text-primary">78%</span>
              </div>
              <Progress value={78} className="h-1" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">Task Completion</span>
                <span className="text-[9px] font-mono text-green-500">{taskCompletion}%</span>
              </div>
              <Progress value={taskCompletion} className="h-1" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">Customer Acquisition</span>
                <span className="text-[9px] font-mono text-blue-500">62%</span>
              </div>
              <Progress value={62} className="h-1" />
            </div>
          </div>
        </Section>

        {/* Domain Quick Access */}
        <Section title="Business Domains" icon={<Briefcase size={12} className="text-secondary" />}>
          <div className="grid grid-cols-2 gap-1.5">
            <button 
              onClick={() => onDomainClick('tasks')}
              className="flex items-center justify-between p-1.5 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1">
                <CheckCircle2 size={8} className="text-blue-500" />
                <span className="text-[8px] text-muted-foreground">Projects</span>
              </div>
              <span className="text-[10px] font-mono text-foreground">{stats.tasks}</span>
            </button>
            <button 
              onClick={() => onDomainClick('documents')}
              className="flex items-center justify-between p-1.5 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1">
                <FileText size={8} className="text-purple-500" />
                <span className="text-[8px] text-muted-foreground">Documents</span>
              </div>
              <span className="text-[10px] font-mono text-foreground">{stats.documents}</span>
            </button>
            <button 
              onClick={() => onDomainClick('events')}
              className="flex items-center justify-between p-1.5 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1">
                <Clock size={8} className="text-orange-500" />
                <span className="text-[8px] text-muted-foreground">Calendar</span>
              </div>
              <span className="text-[10px] font-mono text-foreground">{stats.events}</span>
            </button>
            <button 
              onClick={() => onDomainClick('knowledge')}
              className="flex items-center justify-between p-1.5 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1">
                <Sparkles size={8} className="text-yellow-500" />
                <span className="text-[8px] text-muted-foreground">Knowledge</span>
              </div>
              <span className="text-[10px] font-mono text-foreground">{stats.knowledge}</span>
            </button>
          </div>
        </Section>

        {/* Status Badges */}
        <div className="flex items-center gap-2 px-1 flex-wrap">
          <Badge variant="outline" className="text-[7px] font-mono border-primary/30 text-primary">
            <Rocket size={6} className="mr-1" />
            GROWTH MODE
          </Badge>
          <Badge variant="secondary" className="text-[7px] font-mono">
            <Zap size={6} className="mr-1" />
            {activeAgents} AUTOMATIONS
          </Badge>
          <Badge className="text-[7px] font-mono bg-green-500/20 text-green-500 border-green-500/30">
            <Activity size={6} className="mr-1" />
            HEALTHY
          </Badge>
        </div>
      </div>
    </ScrollArea>
  );
}
