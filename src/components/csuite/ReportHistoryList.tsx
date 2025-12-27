import { 
  FileText, 
  Clock, 
  User,
  Sparkles,
  ChevronRight,
  Search
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CSuiteReport } from '@/hooks/useCSuiteData';

interface ReportHistoryListProps {
  reports: CSuiteReport[];
  onSelectReport: (report: CSuiteReport) => void;
  selectedReportId?: string;
}

const PERSONA_COLORS: Record<string, string> = {
  ceo: 'hsl(var(--primary))',
  cfo: 'hsl(45 80% 50%)',
  coo: 'hsl(150 70% 45%)',
  chief_of_staff: 'hsl(280 70% 50%)',
  cto: 'hsl(200 70% 50%)',
  ciso: 'hsl(350 70% 50%)',
  chro: 'hsl(220 70% 55%)',
  chief_people: 'hsl(170 70% 45%)',
  cmo: 'hsl(320 70% 50%)',
  cro: 'hsl(100 70% 45%)',
  clo: 'hsl(30 70% 50%)',
  cco: 'hsl(260 70% 55%)',
};

export function ReportHistoryList({ reports, onSelectReport, selectedReportId }: ReportHistoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const query = searchQuery.toLowerCase();
    return reports.filter(r => 
      r.title.toLowerCase().includes(query) ||
      r.persona.toLowerCase().includes(query) ||
      r.content.toLowerCase().includes(query)
    );
  }, [reports, searchQuery]);
  
  // Group reports by date
  const groupedReports = useMemo(() => {
    const groups: { label: string; reports: CSuiteReport[] }[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayReports: CSuiteReport[] = [];
    const yesterdayReports: CSuiteReport[] = [];
    const olderReports: CSuiteReport[] = [];
    
    filteredReports.forEach(report => {
      const reportDate = new Date(report.generatedAt);
      if (reportDate.toDateString() === today.toDateString()) {
        todayReports.push(report);
      } else if (reportDate.toDateString() === yesterday.toDateString()) {
        yesterdayReports.push(report);
      } else {
        olderReports.push(report);
      }
    });
    
    if (todayReports.length) groups.push({ label: 'Today', reports: todayReports });
    if (yesterdayReports.length) groups.push({ label: 'Yesterday', reports: yesterdayReports });
    if (olderReports.length) groups.push({ label: 'Earlier', reports: olderReports });
    
    return groups;
  }, [filteredReports]);

  if (reports.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles size={24} className="mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-xs text-muted-foreground">No reports generated yet</p>
        <p className="text-[10px] text-muted-foreground/70">Select a persona to generate insights</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="relative mb-2">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 text-[10px] pl-7 font-mono bg-background"
        />
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {groupedReports.map(group => (
            <div key={group.label}>
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.reports.map((report) => {
                  const personaColor = PERSONA_COLORS[report.persona] || 'hsl(var(--primary))';
                  const isSelected = report.id === selectedReportId;
                  
                  return (
                    <button
                      key={report.id}
                      onClick={() => onSelectReport(report)}
                      className={`w-full p-2 rounded text-left transition-all group hover:bg-muted/50 ${
                        isSelected 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-background border border-border hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: personaColor }}
                            />
                            <span className="text-[10px] font-mono text-primary">
                              {report.persona.toUpperCase()}
                            </span>
                          </div>
                          <h4 className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {report.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                            {report.content.slice(0, 80)}...
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                            <Clock size={8} />
                            {report.generatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <ChevronRight size={12} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredReports.length === 0 && searchQuery && (
            <div className="text-center py-4">
              <p className="text-[10px] text-muted-foreground">No reports match "{searchQuery}"</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
