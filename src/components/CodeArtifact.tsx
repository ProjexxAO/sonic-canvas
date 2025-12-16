// Atlas Sonic OS - Code Artifact Viewer

import { SonicAgent } from '@/lib/agentTypes';
import { Code, Copy, Download, FileCode } from 'lucide-react';
import { toast } from 'sonner';

interface CodeArtifactProps {
  agent: SonicAgent | null;
}

export default function CodeArtifact({ agent }: CodeArtifactProps) {
  const handleCopy = () => {
    if (agent?.codeArtifact) {
      navigator.clipboard.writeText(agent.codeArtifact);
      toast.success('Code copied to clipboard');
    }
  };

  const handleDownload = () => {
    if (agent?.codeArtifact) {
      const blob = new Blob([agent.codeArtifact], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agent.designation.toLowerCase()}.js`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Code downloaded');
    }
  };

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <FileCode size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select an agent to view code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Code size={16} className="text-accent" />
          <h3 className="font-orbitron text-sm text-accent text-glow-violet">CODE ARTIFACT</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
            title="Copy code"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
            title="Download code"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* File info */}
      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <FileCode size={12} />
        <span>{agent.designation.toLowerCase()}.js</span>
        <span className="ml-auto">{agent.codeArtifact.split('\n').length} lines</span>
      </div>

      {/* Code block */}
      <div className="flex-1 overflow-auto bg-background/50 border border-border rounded">
        <pre className="p-3 text-xs font-mono">
          <code className="text-foreground/90">
            {agent.codeArtifact.split('\n').map((line, i) => (
              <div key={i} className="flex">
                <span className="w-8 text-muted-foreground/50 select-none text-right pr-3">
                  {i + 1}
                </span>
                <span className="flex-1">
                  {highlightSyntax(line)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Metadata */}
      <div className="mt-3 p-2 bg-muted/30 border border-border rounded text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-muted-foreground">Created:</span>
            <span className="ml-2 text-foreground">
              {agent.createdAt.toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Cycles:</span>
            <span className="ml-2 text-foreground">{agent.metrics.cycles}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple syntax highlighting
function highlightSyntax(line: string): JSX.Element {
  // Keywords
  const keywords = ['async', 'function', 'const', 'return', 'await', 'if', 'else'];
  const keywordRegex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  
  // Comments
  if (line.trim().startsWith('//')) {
    return <span className="text-muted-foreground">{line}</span>;
  }

  // Process the line
  let result = line;
  
  // Replace strings
  result = result.replace(/'[^']*'/g, '<STRING>$&</STRING>');
  
  const parts = result.split(/(<STRING>.*?<\/STRING>)/g);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('<STRING>')) {
          const str = part.replace(/<\/?STRING>/g, '');
          return <span key={i} className="text-success">{str}</span>;
        }
        
        // Highlight keywords
        const words = part.split(/(\b)/g);
        return words.map((word, j) => {
          if (keywords.includes(word)) {
            return <span key={`${i}-${j}`} className="text-accent">{word}</span>;
          }
          if (word.match(/^\d+$/)) {
            return <span key={`${i}-${j}`} className="text-secondary">{word}</span>;
          }
          return word;
        });
      })}
    </>
  );
}
