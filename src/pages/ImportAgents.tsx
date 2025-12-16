// Atlas Sonic OS - Import Agents Page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { audioEngine } from '@/lib/audioEngine';
import { Hexagon, Radio, Upload, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImportAgent {
  name?: string;
  agent_name?: string;
  title?: string;
  sector?: string;
  category?: string;
  type?: string;
  status?: string;
  description?: string;
  code?: string;
  code_artifact?: string;
  prompt?: string;
  [key: string]: any;
}

export default function ImportAgents() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [jsonData, setJsonData] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const [showResults, setShowResults] = useState(false);

  const mapSectorToEnum = (sector: string | undefined): string => {
    if (!sector) return 'DATA';
    const s = sector.toUpperCase();
    if (s.includes('FINANCE') || s.includes('TRADING') || s.includes('MONEY')) return 'FINANCE';
    if (s.includes('BIO') || s.includes('HEALTH') || s.includes('MEDICAL')) return 'BIOTECH';
    if (s.includes('SECURITY') || s.includes('CYBER') || s.includes('PROTECT')) return 'SECURITY';
    if (s.includes('DATA') || s.includes('ANALYTICS') || s.includes('PROCESS')) return 'DATA';
    if (s.includes('CREATIVE') || s.includes('ART') || s.includes('DESIGN') || s.includes('CONTENT')) return 'CREATIVE';
    if (s.includes('UTILITY') || s.includes('TOOL') || s.includes('HELPER')) return 'UTILITY';
    return 'DATA';
  };

  const mapStatusToEnum = (status: string | undefined): string => {
    if (!status) return 'IDLE';
    const s = status.toUpperCase();
    if (s.includes('ACTIVE') || s.includes('RUNNING')) return 'ACTIVE';
    if (s.includes('PROCESS') || s.includes('WORK')) return 'PROCESSING';
    if (s.includes('ERROR') || s.includes('FAIL')) return 'ERROR';
    if (s.includes('DORMANT') || s.includes('SLEEP') || s.includes('PAUSED')) return 'DORMANT';
    return 'IDLE';
  };

  const generateDesignation = (sector: string): string => {
    return `${sector.slice(0, 3)}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  };

  const waveforms = ['sine', 'square', 'sawtooth', 'triangle'];
  const sectorColors: Record<string, string> = {
    FINANCE: '#00ffd5',
    BIOTECH: '#00ff88',
    SECURITY: '#ff3366',
    DATA: '#9945ff',
    CREATIVE: '#ffaa00',
    UTILITY: '#4488ff',
  };

  const handleImport = async () => {
    if (!user) {
      toast.error('Please sign in to import agents');
      navigate('/auth');
      return;
    }

    if (!jsonData.trim()) {
      toast.error('Please paste your agent data');
      return;
    }

    setImporting(true);
    setShowResults(false);
    audioEngine.playClick();

    let agents: ImportAgent[] = [];
    
    try {
      // Try parsing as JSON array
      const parsed = JSON.parse(jsonData);
      agents = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // Try parsing as CSV
      try {
        const lines = jsonData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        agents = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
          const obj: ImportAgent = {};
          headers.forEach((h, i) => {
            obj[h] = values[i];
          });
          return obj;
        });
      } catch {
        toast.error('Could not parse data. Please use JSON array or CSV format.');
        setImporting(false);
        return;
      }
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const agent of agents) {
      try {
        const name = agent.name || agent.agent_name || agent.title || 'Imported Agent';
        const sector = mapSectorToEnum(agent.sector || agent.category || agent.type) as 'FINANCE' | 'BIOTECH' | 'SECURITY' | 'DATA' | 'CREATIVE' | 'UTILITY';
        const status = mapStatusToEnum(agent.status) as 'IDLE' | 'ACTIVE' | 'PROCESSING' | 'ERROR' | 'DORMANT';
        const codeArtifact = agent.code || agent.code_artifact || agent.prompt || agent.description || '';
        const waveform = waveforms[Math.floor(Math.random() * waveforms.length)] as 'sine' | 'square' | 'sawtooth' | 'triangle';

        const newAgent = {
          user_id: user.id,
          name: name.slice(0, 100),
          designation: generateDesignation(sector),
          sector,
          status,
          class: 'BASIC' as const,
          waveform,
          frequency: 300 + Math.random() * 400,
          color: sectorColors[sector] || '#00ffd5',
          modulation: Math.random() * 10 + 1,
          density: Math.random() * 100,
          code_artifact: codeArtifact,
          cycles: 0,
          efficiency: Math.random() * 40 + 60,
          stability: Math.random() * 30 + 70,
          linked_agents: [] as string[],
        };

        const { error } = await supabase
          .from('sonic_agents')
          .insert([newAgent]);

        if (error) {
          results.failed++;
          results.errors.push(`${name}: ${error.message}`);
        } else {
          results.success++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Unknown error: ${err}`);
      }
    }

    setResults(results);
    setShowResults(true);
    setImporting(false);

    if (results.success > 0) {
      audioEngine.playSuccess();
      toast.success(`Imported ${results.success} agent${results.success > 1 ? 's' : ''}`);
    }
    if (results.failed > 0) {
      audioEngine.playAlert();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to import agents</p>
          <button onClick={() => navigate('/auth')} className="cyber-btn">
            SIGN IN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Background effects */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="fixed inset-0 scanlines opacity-20 pointer-events-none" />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-muted rounded transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Hexagon size={32} className="text-primary" />
              <Radio size={14} className="absolute inset-0 m-auto text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-orbitron text-xl text-foreground">IMPORT AGENTS</h1>
              <p className="text-xs text-muted-foreground">Migrate from external database</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="hud-panel p-6 mb-6">
          <h2 className="font-orbitron text-sm text-primary mb-4">INSTRUCTIONS</h2>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Go to your external Supabase project's SQL Editor</li>
            <li>2. Run: <code className="text-primary bg-muted px-2 py-0.5 rounded">SELECT * FROM sonic_nodes</code></li>
            <li>3. Export as JSON or copy the results</li>
            <li>4. Paste the data below</li>
          </ol>
          <div className="mt-4 p-3 bg-muted/30 rounded text-xs">
            <p className="text-foreground mb-1">Supported fields (will be auto-mapped):</p>
            <p className="text-muted-foreground">name, agent_name, title, sector, category, type, status, description, code, code_artifact, prompt</p>
          </div>
        </div>

        {/* Data input */}
        <div className="hud-panel p-6 mb-6">
          <h2 className="font-orbitron text-sm text-secondary mb-4">AGENT DATA</h2>
          <textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            placeholder='Paste JSON array or CSV data here...

Example JSON:
[
  {"name": "Trading Bot", "sector": "FINANCE", "code": "async function trade()..."},
  {"name": "Security Scanner", "sector": "SECURITY", "status": "ACTIVE"}
]

Example CSV:
name,sector,status
Trading Bot,FINANCE,IDLE
Security Scanner,SECURITY,ACTIVE'
            className="w-full h-64 bg-input border border-border rounded p-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Results */}
        {showResults && (
          <div className="hud-panel p-6 mb-6">
            <h2 className="font-orbitron text-sm text-accent mb-4">IMPORT RESULTS</h2>
            <div className="flex gap-6 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-success" />
                <span className="text-success">{results.success} imported</span>
              </div>
              {results.failed > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-destructive" />
                  <span className="text-destructive">{results.failed} failed</span>
                </div>
              )}
            </div>
            {results.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded p-3 text-xs text-destructive">
                {results.errors.slice(0, 5).map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
                {results.errors.length > 5 && (
                  <p className="mt-1 text-muted-foreground">...and {results.errors.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleImport}
            disabled={importing || !jsonData.trim()}
            className="flex-1 cyber-btn flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            {importing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Upload size={18} />
                IMPORT AGENTS
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors rounded"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
