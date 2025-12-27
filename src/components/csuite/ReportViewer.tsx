import { useState } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Bookmark, 
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CSuiteReport } from '@/hooks/useCSuiteData';

interface ReportViewerProps {
  report: CSuiteReport;
  reports: CSuiteReport[];
  onClose: () => void;
  onNavigate: (report: CSuiteReport) => void;
}

// Simple markdown-like renderer for reports
function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  
  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType === 'ul' ? 'ul' : 'ol';
      elements.push(
        <ListTag key={elements.length} className={`my-3 ml-4 space-y-1.5 ${listType === 'ul' ? 'list-disc' : 'list-decimal'}`}>
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-foreground/90 leading-relaxed">{item}</li>
          ))}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Headers
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-base font-semibold text-foreground mt-5 mb-2">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-xl font-bold text-foreground mt-6 mb-4">
          {trimmed.slice(2)}
        </h1>
      );
    }
    // Bullet lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(trimmed.slice(2));
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(trimmed.replace(/^\d+\.\s/, ''));
    }
    // Bold text in paragraphs
    else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      flushList();
      elements.push(
        <p key={index} className="text-sm font-semibold text-foreground my-2">
          {trimmed.slice(2, -2)}
        </p>
      );
    }
    // Regular paragraphs
    else if (trimmed) {
      flushList();
      // Handle inline bold and italic
      const formatted = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      elements.push(
        <p 
          key={index} 
          className="text-sm text-foreground/90 my-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    }
    // Empty lines
    else {
      flushList();
    }
  });
  
  flushList();
  return elements;
}

export function ReportViewer({ report, reports, onClose, onNavigate }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);
  
  const currentIndex = reports.findIndex(r => r.id === report.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < reports.length - 1;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report.content);
      setCopied(true);
      toast.success('Report copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };
  
  const handleExport = () => {
    // Create a blob and download as markdown
    const blob = new Blob([`# ${report.title}\n\n**Persona:** ${report.persona.toUpperCase()}\n**Generated:** ${report.generatedAt.toLocaleString()}\n\n---\n\n${report.content}`], { 
      type: 'text/markdown' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_')}_${report.persona}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: report.title,
          text: report.content.slice(0, 200) + '...',
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-foreground line-clamp-1">
                {report.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0">
                  {report.persona.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  {report.generatedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleCopy}
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
            >
              <Share2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleExport}
            >
              <Download size={14} />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="prose prose-sm max-w-none">
            {renderMarkdown(report.content)}
          </div>
        </ScrollArea>
        
        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card/50">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-mono"
            disabled={!hasPrev}
            onClick={() => hasPrev && onNavigate(reports[currentIndex - 1])}
          >
            <ChevronLeft size={14} className="mr-1" />
            Previous
          </Button>
          
          <span className="text-[10px] text-muted-foreground font-mono">
            {currentIndex + 1} of {reports.length} reports
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-mono"
            disabled={!hasNext}
            onClick={() => hasNext && onNavigate(reports[currentIndex + 1])}
          >
            Next
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
