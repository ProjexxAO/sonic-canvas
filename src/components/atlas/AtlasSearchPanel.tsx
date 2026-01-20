// Atlas Search & Knowledge Synthesis Panel
// Displays web searches Atlas undertakes in real-time

import React, { useState } from 'react';
import { Search, Globe, ExternalLink, Loader2, CheckCircle2, XCircle, Sparkles, ChevronDown, ChevronUp, Send, Maximize2, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { createPortal } from 'react-dom';

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
  onSearch?: (query: string) => void;
  isSearching?: boolean;
}

export function AtlasSearchPanel({ searches, onSearch, isSearching }: AtlasSearchPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const searchInputElement = (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search the web..."
        className="h-8 text-xs bg-background/50 border-border/50 focus-visible:ring-primary/30"
        disabled={isSearching}
      />
      <Button 
        type="submit" 
        size="sm" 
        variant="ghost"
        className="h-8 w-8 p-0 shrink-0"
        disabled={!searchQuery.trim() || isSearching}
      >
        {isSearching ? (
          <Loader2 size={14} className="animate-spin text-primary" />
        ) : (
          <Send size={14} className="text-primary" />
        )}
      </Button>
    </form>
  );

  // Fullscreen modal view
  const fullscreenPanel = isFullscreen && createPortal(
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/90">
        <div className="flex items-center gap-3">
          <Globe size={20} className="text-primary" />
          <span className="text-lg font-mono text-foreground">ATLAS SEARCH</span>
          <Badge variant="outline" className="text-xs font-mono">
            {searches.length} {searches.length === 1 ? 'search' : 'searches'}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(false)}
          className="h-8 w-8 p-0"
        >
          <X size={18} />
        </Button>
      </div>

      {/* Search input */}
      <div className="px-6 py-3 border-b border-border/50 bg-muted/30">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the web..."
            className="h-10 bg-background border-border focus-visible:ring-primary/30"
            disabled={isSearching}
          />
          <Button 
            type="submit" 
            size="sm"
            className="h-10 px-4"
            disabled={!searchQuery.trim() || isSearching}
          >
            {isSearching ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            Search
          </Button>
        </form>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-6 py-4">
        {searches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search size={28} className="text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground font-mono">No web searches yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Type above or ask Atlas to search</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {searches.map((search) => (
              <FullscreenSearchCard key={search.id} search={search} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>,
    document.body
  );

  if (searches.length === 0) {
    return (
      <>
        {fullscreenPanel}
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
            <>
              {searchInputElement}
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Search size={18} className="text-muted-foreground/50" />
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  No web searches yet
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Type above or ask Atlas to search
                </p>
              </div>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {fullscreenPanel}
      <div className="bg-card/90 border border-border rounded-lg p-3 shadow-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full hover:opacity-80 transition-opacity"
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
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(true);
              }}
            >
              <Maximize2 size={12} className="text-muted-foreground" />
            </Button>
            {isExpanded ? (
              <ChevronUp size={14} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={14} className="text-muted-foreground" />
            )}
          </div>
        </button>

        {isExpanded && (
          <>
            {searchInputElement}
            <ScrollArea className="h-72 mt-3">
              <div className="space-y-3">
                {searches.map((search) => (
                  <SearchEntryCard key={search.id} search={search} />
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </>
  );
}

// Fullscreen version of the search card with more detail
function FullscreenSearchCard({ search }: { search: WebSearchEntry }) {
  const statusIcon = {
    searching: <Loader2 size={16} className="text-primary animate-spin" />,
    complete: <CheckCircle2 size={16} className="text-success" />,
    error: <XCircle size={16} className="text-destructive" />,
  }[search.status];

  const statusLabel = {
    searching: 'Searching...',
    complete: 'Complete',
    error: 'Failed',
  }[search.status];

  const modeLabel = search.mode && search.mode !== 'search' ? (
    <Badge variant="secondary" className="text-xs font-mono px-2 py-0.5">
      {search.mode.toUpperCase()}
    </Badge>
  ) : null;

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Search size={14} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-mono">
              {formatDistanceToNow(search.timestamp, { addSuffix: true })}
            </span>
            {modeLabel}
          </div>
          <p className="text-lg font-medium text-foreground">
            {search.query}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
          {statusIcon}
          <span className="text-sm font-mono text-muted-foreground">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Answer */}
      {search.status === 'complete' && search.answer && (
        <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-primary" />
            <span className="text-sm font-mono text-primary font-medium">SYNTHESIS</span>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {search.answer}
          </p>
        </div>
      )}

      {/* Searching indicator */}
      {search.status === 'searching' && (
        <div className="flex items-center gap-3 py-4">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
          </div>
          <span className="text-sm font-mono text-muted-foreground">Synthesizing knowledge...</span>
        </div>
      )}

      {/* Citations */}
      {search.status === 'complete' && search.citations && search.citations.length > 0 && (
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <ExternalLink size={14} className="text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground">
              SOURCES ({search.citations.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {search.citations.map((citation, idx) => (
              <a
                key={idx}
                href={citation}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline font-mono px-3 py-1.5 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                title={citation}
              >
                {new URL(citation).hostname.replace('www.', '')}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {search.status === 'error' && (
        <p className="text-sm text-destructive font-mono py-2">
          Search failed. Please try again.
        </p>
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
          <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
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
