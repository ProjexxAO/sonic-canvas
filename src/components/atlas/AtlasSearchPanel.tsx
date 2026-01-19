// Atlas Search & Knowledge Synthesis Panel
// Displays web searches Atlas undertakes in real-time

import React, { useState } from 'react';
import { Search, Globe, ExternalLink, Loader2, CheckCircle2, XCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export interface WebSearchEntry {
  id: string;
  query: string;
  status: 'searching' | 'complete' | 'error';
  answer?: string;
  citations?: string[];
  timestamp: Date;
  mode?: 'search' | 'deep' | 'multi' | 'extract' | 'citations';
}

interface AtlasSearchPanelProps {
  searches: WebSearchEntry[];
}

export function AtlasSearchPanel({ searches }: AtlasSearchPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  if (searches.length === 0) {
    return (
      <div className="bg-card/90 border border-border rounded-lg p-3 shadow-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full mb-2 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-primary" />
            <span className="text-xs font-mono text-muted-foreground">
              ATLAS SEARCH
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </button>
        {isExpanded && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Search size={18} className="text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              No web searches yet
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Ask Atlas to search for information
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card/90 border border-border rounded-lg p-3 shadow-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-primary" />
          <span className="text-xs font-mono text-muted-foreground">
            ATLAS SEARCH
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono">
            {searches.length} {searches.length === 1 ? 'search' : 'searches'}
          </Badge>
          {isExpanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {searches.map((search) => (
              <SearchEntryCard key={search.id} search={search} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function SearchEntryCard({ search }: { search: WebSearchEntry }) {
  const statusIcon = {
    searching: <Loader2 size={12} className="text-primary animate-spin" />,
    complete: <CheckCircle2 size={12} className="text-success" />,
    error: <XCircle size={12} className="text-destructive" />,
  }[search.status];

  const statusLabel = {
    searching: 'Searching...',
    complete: 'Complete',
    error: 'Failed',
  }[search.status];

  const modeLabel = search.mode && search.mode !== 'search' ? (
    <Badge variant="secondary" className="text-[9px] font-mono px-1 py-0">
      {search.mode.toUpperCase()}
    </Badge>
  ) : null;

  return (
    <div className="bg-background rounded-lg border border-border p-3 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Search size={10} className="text-muted-foreground flex-shrink-0" />
            <span className="text-[10px] text-muted-foreground font-mono truncate">
              {formatDistanceToNow(search.timestamp, { addSuffix: true })}
            </span>
            {modeLabel}
          </div>
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {search.query}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {statusIcon}
          <span className="text-[10px] font-mono text-muted-foreground">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Answer Preview */}
      {search.status === 'complete' && search.answer && (
        <div className="bg-muted/50 rounded p-2 border border-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={10} className="text-primary" />
            <span className="text-[10px] font-mono text-primary">SYNTHESIS</span>
          </div>
          <p className="text-xs text-foreground/90 line-clamp-3 leading-relaxed">
            {search.answer}
          </p>
        </div>
      )}

      {/* Searching indicator */}
      {search.status === 'searching' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
          </div>
          <span className="text-[10px] font-mono">Synthesizing knowledge...</span>
        </div>
      )}

      {/* Citations */}
      {search.status === 'complete' && search.citations && search.citations.length > 0 && (
        <div className="pt-1 border-t border-border/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ExternalLink size={10} className="text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground">
              SOURCES ({search.citations.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {search.citations.slice(0, 4).map((citation, idx) => (
              <a
                key={idx}
                href={citation}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline truncate max-w-[120px] font-mono"
                title={citation}
              >
                {new URL(citation).hostname.replace('www.', '')}
              </a>
            ))}
            {search.citations.length > 4 && (
              <span className="text-[10px] text-muted-foreground font-mono">
                +{search.citations.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {search.status === 'error' && (
        <p className="text-xs text-destructive/80 font-mono">
          Search failed. Please try again.
        </p>
      )}
    </div>
  );
}

export default AtlasSearchPanel;
