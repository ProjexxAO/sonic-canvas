// Atlas Sonic OS - Import Agents Page

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { audioEngine } from '@/lib/audioEngine';
import { Hexagon, Radio, Upload, ArrowLeft, Loader2, CheckCircle, AlertCircle, FileUp, Eye } from 'lucide-react';
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
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<{ headers: string[]; rows: string[][]; totalRows: number } | null>(null);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonData(content);
      toast.success(`Loaded ${file.name}`);
      audioEngine.playClick();
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  };

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

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values.map(v => v.replace(/^"|"$/g, ''));
  };

  const handlePreview = async () => {
    const hasUrl = googleSheetsUrl.trim();
    const hasData = jsonData.trim();

    if (!hasUrl && !hasData) {
      toast.error('Please provide data to preview');
      return;
    }

    setPreviewing(true);
    setPreviewData(null);
    audioEngine.playClick();

    try {
      let csvText = '';

      // Fetch from Google Sheets URL
      if (hasUrl) {
        toast.info('Fetching preview from Google Sheets...');
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        // Use edge function to fetch (avoids CORS)
        const response = await supabase.functions.invoke('bulk-import-agents', {
          body: { googleSheetsUrl: googleSheetsUrl.trim(), previewOnly: true },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch preview');
        }

        if (response.data?.preview) {
          setPreviewData(response.data.preview);
          setPreviewing(false);
          return;
        }
      }

      // Parse local data
      csvText = hasData;
      const firstLine = csvText.trim().split('\n')[0];
      const isCSV = firstLine.includes(',') && !firstLine.startsWith('[') && !firstLine.startsWith('{');

      if (isCSV) {
        const lines = csvText.trim().split('\n');
        const headers = parseCSVLine(lines[0]).map(h => h.trim());
        const rows: string[][] = [];

        for (let i = 1; i < Math.min(lines.length, 11); i++) {
          if (lines[i].trim()) {
            rows.push(parseCSVLine(lines[i]));
          }
        }

        setPreviewData({
          headers,
          rows,
          totalRows: lines.length - 1
        });
      } else {
        // JSON data
        const parsed = JSON.parse(csvText);
        const agents: ImportAgent[] = Array.isArray(parsed) ? parsed : [parsed];
        const previewAgents = agents.slice(0, 10);

        const headers = ['name', 'sector', 'status', 'class'];
        const rows = previewAgents.map(agent => [
          agent.name || agent.agent_name || agent.title || '-',
          agent.sector || agent.category || agent.type || '-',
          agent.status || '-',
          agent.class || 'BASIC'
        ]);

        setPreviewData({
          headers,
          rows,
          totalRows: agents.length
        });
      }

      toast.success('Preview loaded');
    } catch (err) {
      console.error('Preview error:', err);
      toast.error(`Preview failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!user) {
      toast.error('Please sign in to import agents');
      navigate('/auth');
      return;
    }

    const hasUrl = googleSheetsUrl.trim();
    const hasData = jsonData.trim();

    if (!hasUrl && !hasData) {
      toast.error('Please provide a Google Sheets URL or paste your agent data');
      return;
    }

    setImporting(true);
    setShowResults(false);
    audioEngine.playClick();

    // Google Sheets URL import (server-side fetch)
    if (hasUrl) {
      toast.info('Fetching data from Google Sheets...');
      
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const response = await supabase.functions.invoke('bulk-import-agents', {
          body: { googleSheetsUrl: googleSheetsUrl.trim() },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (response.error) {
          throw new Error(response.error.message || 'Google Sheets import failed');
        }

        const result = response.data;
        setResults({
          success: result.totalInserted || 0,
          failed: result.totalErrors || 0,
          errors: result.errors || []
        });
        setShowResults(true);
        setImporting(false);

        if (result.totalInserted > 0) {
          audioEngine.playSuccess();
          toast.success(`Imported ${result.totalInserted} agents from Google Sheets`);
        }
        if (result.totalErrors > 0) {
          audioEngine.playAlert();
          toast.error(`${result.totalErrors} agents failed to import`);
        }
        return;
      } catch (err) {
        console.error('Google Sheets import error:', err);
        toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setImporting(false);
        return;
      }
    }

    // Check if data looks like CSV (has header row with commas)
    const firstLine = jsonData.trim().split('\n')[0];
    const isCSV = firstLine.includes(',') && !firstLine.startsWith('[') && !firstLine.startsWith('{');
    const lines = jsonData.trim().split('\n');
    const lineCount = lines.length;

    // Bulk import path (CSV or large datasets)
    if (isCSV || lineCount > 100) {
      const totalRows = Math.max(0, lineCount - 1);
      toast.info(`Processing ${totalRows} agents in batches...`);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        // For CSV, avoid sending the whole file (payload too large). Parse + send batches.
        if (isCSV) {
          const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

          const BATCH_SIZE = 500;
          let totalInserted = 0;
          let totalErrors = 0;
          const errors: string[] = [];

          let batch: any[] = [];
          let batchIndex = 0;

          const flushBatch = async () => {
            if (batch.length === 0) return;
            batchIndex += 1;

            const response = await supabase.functions.invoke('bulk-import-agents', {
              body: { agents: batch },
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });

            if (response.error) {
              throw new Error(response.error.message || 'Batch import failed');
            }

            const result = response.data;
            totalInserted += result.totalInserted || 0;
            totalErrors += result.totalErrors || 0;
            if (Array.isArray(result.errors)) errors.push(...result.errors);

            batch = [];
            toast.message(`Imported batch ${batchIndex} (${totalInserted}/${totalRows})`);
          };

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            const values = parseCSVLine(line);
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });

            // Match the backend function's AgentRow shape
            batch.push({
              id: row.id || undefined,
              name: row.name || 'Imported Agent',
              designation: row.designation || `IMP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
              sector: row.sector || 'DATA',
              status: row.status || 'IDLE',
              class: row.class || 'BASIC',
              waveform: row.waveform || 'sine',
              frequency: parseFloat(row.frequency) || 440,
              modulation: parseFloat(row.modulation) || 5,
              density: parseFloat(row.density) || 50,
              color: row.color || '#00ffd5',
              cycles: parseInt(row.cycles) || 0,
              efficiency: parseFloat(row.efficiency) || 75,
              stability: parseFloat(row.stability) || 85,
              code_artifact: row.code_artifact || undefined,
            });

            if (batch.length >= BATCH_SIZE) {
              // eslint-disable-next-line no-await-in-loop
              await flushBatch();
            }
          }

          await flushBatch();

          setResults({
            success: totalInserted,
            failed: totalErrors,
            errors: errors.slice(0, 10),
          });
          setShowResults(true);
          setImporting(false);

          if (totalInserted > 0) {
            audioEngine.playSuccess();
            toast.success(`Imported ${totalInserted} agents`);
          }
          if (totalErrors > 0) {
            audioEngine.playAlert();
            toast.error(`${totalErrors} agents failed to import`);
          }
          return;
        }

        // Non-CSV large dataset fallback: keep existing server-side CSV import
        const response = await supabase.functions.invoke('bulk-import-agents', {
          body: { csvData: jsonData },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (response.error) {
          throw new Error(response.error.message || 'Bulk import failed');
        }

        const result = response.data;
        setResults({
          success: result.totalInserted || 0,
          failed: result.totalErrors || 0,
          errors: result.errors || []
        });
        setShowResults(true);
        setImporting(false);

        if (result.totalInserted > 0) {
          audioEngine.playSuccess();
          toast.success(`Imported ${result.totalInserted} agents`);
        }
        if (result.totalErrors > 0) {
          audioEngine.playAlert();
          toast.error(`${result.totalErrors} agents failed to import`);
        }
        return;
      } catch (err) {
        console.error('Bulk import error:', err);
        toast.error(`Bulk import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setImporting(false);
        return;
      }
    }

    // Fallback to individual inserts for small JSON datasets
    let agents: ImportAgent[] = [];
    
    try {
      const parsed = JSON.parse(jsonData);
      agents = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      toast.error('Could not parse JSON data');
      setImporting(false);
      return;
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

        {/* Google Sheets URL */}
        <div className="hud-panel p-6 mb-6">
          <h2 className="font-orbitron text-sm text-secondary mb-4">GOOGLE SHEETS URL</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Publish your Google Sheet as CSV: File → Share → Publish to web → Select CSV format
          </p>
          <input
            type="url"
            value={googleSheetsUrl}
            onChange={(e) => setGoogleSheetsUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
            className="w-full bg-input border border-border rounded p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Data input */}
        <div className="hud-panel p-6 mb-6">
          <div className="relative mb-4">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border" />
            <span className="relative bg-card px-3 text-xs text-muted-foreground left-1/2 -translate-x-1/2 inline-block">
              OR UPLOAD / PASTE DATA
            </span>
          </div>
          
          {/* File upload */}
          <div className="mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,.csv,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-6 transition-colors group"
            >
              <div className="flex flex-col items-center gap-2">
                <FileUp size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Click to upload JSON or CSV file
                </span>
                <span className="text-xs text-muted-foreground/60">
                  Supports .json, .csv, .txt
                </span>
              </div>
            </button>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border" />
            <span className="relative bg-card px-3 text-xs text-muted-foreground left-1/2 -translate-x-1/2 inline-block">
              OR PASTE DATA
            </span>
          </div>

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

        {/* Preview */}
        {previewData && (
          <div className="hud-panel p-6 mb-6">
            <h2 className="font-orbitron text-sm text-accent mb-4">
              DATA PREVIEW <span className="text-muted-foreground font-normal">({previewData.rows.length} of {previewData.totalRows} rows)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {previewData.headers.map((header, i) => (
                      <th key={i} className="text-left p-2 text-primary font-orbitron whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-border/50 hover:bg-muted/30">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2 text-foreground max-w-[200px] truncate" title={cell}>
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.totalRows > 10 && (
              <p className="text-xs text-muted-foreground mt-3">
                Showing first 10 rows of {previewData.totalRows} total
              </p>
            )}
          </div>
        )}

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
            onClick={handlePreview}
            disabled={previewing || importing || (!jsonData.trim() && !googleSheetsUrl.trim())}
            className="px-6 py-3 border border-border text-muted-foreground hover:text-foreground hover:border-secondary transition-colors rounded flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {previewing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Eye size={18} />
                PREVIEW
              </>
            )}
          </button>
          <button
            onClick={handleImport}
            disabled={importing || previewing || (!jsonData.trim() && !googleSheetsUrl.trim())}
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
