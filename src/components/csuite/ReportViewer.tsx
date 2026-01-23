import { useState } from 'react';
import DOMPurify from 'dompurify';
import { 
  X, 
  Download, 
  Share2, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
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
      
      // Sanitize HTML to prevent XSS attacks
      const sanitized = DOMPurify.sanitize(formatted, {
        ALLOWED_TAGS: ['strong', 'em'],
        ALLOWED_ATTR: []
      });
      
      elements.push(
        <p 
          key={index} 
          className="text-sm text-foreground/90 my-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitized }}
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
  const [isExporting, setIsExporting] = useState(false);
  
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
  
  const handleExportMarkdown = () => {
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
    toast.success('Markdown exported');
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let yPosition = margin;
      
      // Helper to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };
      
      // Header background
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(report.title, margin, 20);
      
      // Persona badge
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${report.persona.toUpperCase()} BRIEFING`, margin, 30);
      
      // Date
      doc.text(report.generatedAt.toLocaleDateString(), pageWidth - margin - 40, 30);
      
      yPosition = 55;
      doc.setTextColor(30, 41, 59);
      
      // Parse and render content
      const lines = report.content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          yPosition += 4;
          continue;
        }
        
        // Headers
        if (trimmed.startsWith('### ')) {
          checkPageBreak(12);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(trimmed.slice(4), margin, yPosition);
          yPosition += 8;
        } else if (trimmed.startsWith('## ')) {
          checkPageBreak(15);
          yPosition += 5;
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(trimmed.slice(3), margin, yPosition);
          yPosition += 10;
        } else if (trimmed.startsWith('# ')) {
          checkPageBreak(18);
          yPosition += 8;
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(trimmed.slice(2), margin, yPosition);
          yPosition += 12;
        }
        // Bullet points
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          checkPageBreak(8);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const bulletText = trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '$1');
          const splitText = doc.splitTextToSize(`• ${bulletText}`, maxWidth - 10);
          doc.text(splitText, margin + 5, yPosition);
          yPosition += splitText.length * 5 + 2;
        }
        // Numbered lists
        else if (/^\d+\.\s/.test(trimmed)) {
          checkPageBreak(8);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const cleanText = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
          const splitText = doc.splitTextToSize(cleanText, maxWidth - 10);
          doc.text(splitText, margin + 5, yPosition);
          yPosition += splitText.length * 5 + 2;
        }
        // Regular paragraphs
        else {
          checkPageBreak(10);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const cleanText = trimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
          const splitText = doc.splitTextToSize(cleanText, maxWidth);
          doc.text(splitText, margin, yPosition);
          yPosition += splitText.length * 5 + 3;
        }
      }
      
      // Footer on each page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated by Enterprise Data Hub | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      doc.save(`${report.title.replace(/\s+/g, '_')}_${report.persona}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isExporting}
                >
                  <Download size={14} className={isExporting ? 'animate-pulse' : ''} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText size={14} className="mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportMarkdown}>
                  <Download size={14} className="mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
