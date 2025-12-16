// Atlas Sonic OS - Agent Types

import { WaveformType, SonicSignature } from './audioEngine';

export type AgentSector = 'FINANCE' | 'BIOTECH' | 'SECURITY' | 'DATA' | 'CREATIVE' | 'UTILITY';
export type AgentStatus = 'IDLE' | 'ACTIVE' | 'PROCESSING' | 'ERROR' | 'DORMANT';
export type AgentClass = 'BASIC' | 'ADVANCED' | 'ELITE' | 'SINGULARITY';

export interface SonicAgent {
  id: string;
  name: string;
  designation: string;
  sector: AgentSector;
  status: AgentStatus;
  class: AgentClass;
  sonicDNA: SonicSignature;
  codeArtifact: string;
  createdAt: Date;
  lastActive: Date;
  metrics: {
    cycles: number;
    efficiency: number;
    stability: number;
  };
  position?: { x: number; y: number };
  linkedAgents: string[];
}

export interface SynthesisRequest {
  prompt: string;
  sector?: AgentSector;
}

export interface SimulationOutput {
  timestamp: Date;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

// Generate unique IDs
export const generateAgentId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'ATL-';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

// Generate random sonic signature
export const generateSonicDNA = (sector: AgentSector): SonicSignature => {
  const waveforms: WaveformType[] = ['sine', 'square', 'sawtooth', 'triangle'];
  const sectorColors: Record<AgentSector, string> = {
    FINANCE: '#00ffd5',
    BIOTECH: '#00ff88',
    SECURITY: '#ff3366',
    DATA: '#9945ff',
    CREATIVE: '#ffaa00',
    UTILITY: '#4488ff',
  };
  
  const sectorFrequencies: Record<AgentSector, number> = {
    FINANCE: 440,
    BIOTECH: 523.25,
    SECURITY: 329.63,
    DATA: 392,
    CREATIVE: 493.88,
    UTILITY: 369.99,
  };

  return {
    waveform: waveforms[Math.floor(Math.random() * waveforms.length)],
    frequency: sectorFrequencies[sector] + (Math.random() - 0.5) * 100,
    color: sectorColors[sector],
    modulation: Math.random() * 10 + 1,
    density: Math.random() * 100,
  };
};

// Generate code artifact based on sector
export const generateCodeArtifact = (name: string, sector: AgentSector): string => {
  const templates: Record<AgentSector, string> = {
    FINANCE: `// ${name} - Financial Agent
async function analyzeMarket(data) {
  const patterns = await detectPatterns(data);
  const signals = calculateSignals(patterns);
  return {
    recommendation: signals.primary,
    confidence: signals.confidence,
    timestamp: Date.now()
  };
}`,
    BIOTECH: `// ${name} - BioTech Agent
async function processGenome(sequence) {
  const markers = identifyMarkers(sequence);
  const analysis = runMLPipeline(markers);
  return {
    findings: analysis.results,
    mutations: analysis.variants,
    confidence: analysis.score
  };
}`,
    SECURITY: `// ${name} - Security Agent
async function scanNetwork(target) {
  const vulnerabilities = await deepScan(target);
  const threats = classifyThreats(vulnerabilities);
  return {
    status: threats.length ? 'ALERT' : 'CLEAR',
    threats: threats,
    patches: generatePatches(threats)
  };
}`,
    DATA: `// ${name} - Data Agent
async function processStream(input) {
  const parsed = await parseDataStream(input);
  const enriched = enrichWithMetadata(parsed);
  return {
    records: enriched.length,
    schema: inferSchema(enriched),
    output: enriched
  };
}`,
    CREATIVE: `// ${name} - Creative Agent
async function generateContent(prompt) {
  const concepts = expandConcepts(prompt);
  const variations = await createVariations(concepts);
  return {
    primary: variations[0],
    alternatives: variations.slice(1),
    style: analyzeStyle(variations)
  };
}`,
    UTILITY: `// ${name} - Utility Agent
async function executeTask(params) {
  const validated = validateParams(params);
  const result = await runTask(validated);
  return {
    success: result.status === 'OK',
    output: result.data,
    metrics: result.performance
  };
}`,
  };

  return templates[sector];
};

// Create a new agent
export const createAgent = (name: string, sector: AgentSector): SonicAgent => {
  return {
    id: generateAgentId(),
    name,
    designation: `${sector.slice(0, 3)}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
    sector,
    status: 'IDLE',
    class: 'BASIC',
    sonicDNA: generateSonicDNA(sector),
    codeArtifact: generateCodeArtifact(name, sector),
    createdAt: new Date(),
    lastActive: new Date(),
    metrics: {
      cycles: 0,
      efficiency: Math.random() * 40 + 60,
      stability: Math.random() * 30 + 70,
    },
    linkedAgents: [],
  };
};
