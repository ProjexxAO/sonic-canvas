// Sonic Entity Bridge - Allows Atlas to perceive and manipulate UI components as Sonic Entities

import { SonicSignature, WaveformType } from './audioEngine';

// =============================================================================
// SONIC ENTITY TYPES
// =============================================================================

export type EntityCategory = 
  | 'navigation'
  | 'action' 
  | 'display'
  | 'input'
  | 'container'
  | 'feedback'
  | 'visualization';

export type EntityState = 'idle' | 'active' | 'disabled' | 'loading' | 'error' | 'hidden';

export interface SonicEntitySignature extends SonicSignature {
  // Extended signature for UI entities
  entityHash: string;
  interactionWeight: number; // 0-1, how frequently interacted with
  semanticResonance: number; // 0-1, how meaningful to user flow
  connectionStrength: number; // 0-1, link strength to other entities
  evolutionPotential: number; // 0-1, capability for self-improvement
}

export interface SonicEntity {
  id: string;
  name: string;
  category: EntityCategory;
  state: EntityState;
  signature: SonicEntitySignature;
  
  // Component metadata
  componentPath: string;
  componentType: string;
  props: Record<string, unknown>;
  
  // Relationships
  parentEntityId?: string;
  childEntityIds: string[];
  linkedEntityIds: string[];
  
  // Interaction handlers (for Atlas manipulation)
  capabilities: EntityCapability[];
  
  // Lifecycle
  registeredAt: Date;
  lastInteraction?: Date;
  interactionCount: number;
  
  // Atlas perception data
  perceptionData: EntityPerceptionData;
}

export interface EntityCapability {
  id: string;
  name: string;
  description: string;
  action: string; // Function name to invoke
  parameters: Record<string, { type: string; required: boolean; description: string }>;
  requiresConfirmation: boolean;
  cooldownMs: number;
}

export interface EntityPerceptionData {
  visibility: 'visible' | 'hidden' | 'partial';
  importance: 'critical' | 'high' | 'medium' | 'low';
  contextualRelevance: number; // 0-1, based on current user context
  userAffinityScore: number; // 0-1, how much user engages with this
  accessibilityLevel: 'full' | 'restricted' | 'view-only';
}

// =============================================================================
// SONIC ENTITY REGISTRY
// =============================================================================

class SonicEntityRegistry {
  private entities: Map<string, SonicEntity> = new Map();
  private categoryIndex: Map<EntityCategory, Set<string>> = new Map();
  private componentIndex: Map<string, string> = new Map(); // componentPath -> entityId
  private listeners: Set<(event: RegistryEvent) => void> = new Set();

  constructor() {
    // Initialize category indices
    const categories: EntityCategory[] = ['navigation', 'action', 'display', 'input', 'container', 'feedback', 'visualization'];
    categories.forEach(cat => this.categoryIndex.set(cat, new Set()));
  }

  // Generate unique entity signature based on component properties
  generateSignature(componentPath: string, category: EntityCategory, props: Record<string, unknown>): SonicEntitySignature {
    const categoryWaveforms: Record<EntityCategory, WaveformType> = {
      navigation: 'sine',
      action: 'square',
      display: 'triangle',
      input: 'sawtooth',
      container: 'sine',
      feedback: 'square',
      visualization: 'triangle',
    };

    const categoryFrequencies: Record<EntityCategory, number> = {
      navigation: 220,
      action: 440,
      display: 330,
      input: 550,
      container: 165,
      feedback: 660,
      visualization: 880,
    };

    const categoryColors: Record<EntityCategory, string> = {
      navigation: 'hsl(200 70% 50%)',
      action: 'hsl(150 70% 45%)',
      display: 'hsl(280 70% 50%)',
      input: 'hsl(45 80% 50%)',
      container: 'hsl(220 70% 55%)',
      feedback: 'hsl(350 70% 50%)',
      visualization: 'hsl(180 70% 50%)',
    };

    // Generate hash from component path and key props
    const hashSource = `${componentPath}:${JSON.stringify(props)}`;
    const entityHash = this.simpleHash(hashSource);

    return {
      waveform: categoryWaveforms[category],
      frequency: categoryFrequencies[category] + (Math.random() - 0.5) * 50,
      color: categoryColors[category],
      modulation: Math.random() * 5 + 1,
      density: Math.random() * 50 + 50,
      entityHash,
      interactionWeight: 0,
      semanticResonance: this.calculateSemanticResonance(category, props),
      connectionStrength: 0,
      evolutionPotential: this.calculateEvolutionPotential(category),
    };
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private calculateSemanticResonance(category: EntityCategory, props: Record<string, unknown>): number {
    // Higher resonance for interactive and user-facing elements
    const categoryWeights: Record<EntityCategory, number> = {
      action: 0.9,
      input: 0.85,
      navigation: 0.8,
      feedback: 0.75,
      display: 0.6,
      visualization: 0.7,
      container: 0.4,
    };
    
    let resonance = categoryWeights[category];
    
    // Boost for important props
    if (props.onClick || props.onSubmit) resonance += 0.05;
    if (props.primary || props.variant === 'primary') resonance += 0.05;
    
    return Math.min(1, resonance);
  }

  private calculateEvolutionPotential(category: EntityCategory): number {
    const potentials: Record<EntityCategory, number> = {
      action: 0.8,
      visualization: 0.9,
      display: 0.7,
      input: 0.6,
      container: 0.5,
      navigation: 0.4,
      feedback: 0.6,
    };
    return potentials[category] + (Math.random() * 0.1);
  }

  // Register a UI component as a Sonic Entity
  register(config: {
    id?: string;
    name: string;
    category: EntityCategory;
    componentPath: string;
    componentType: string;
    props?: Record<string, unknown>;
    capabilities?: EntityCapability[];
    parentEntityId?: string;
    importance?: 'critical' | 'high' | 'medium' | 'low';
  }): SonicEntity {
    const id = config.id || `entity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const props = config.props || {};
    
    const entity: SonicEntity = {
      id,
      name: config.name,
      category: config.category,
      state: 'idle',
      signature: this.generateSignature(config.componentPath, config.category, props),
      componentPath: config.componentPath,
      componentType: config.componentType,
      props,
      parentEntityId: config.parentEntityId,
      childEntityIds: [],
      linkedEntityIds: [],
      capabilities: config.capabilities || [],
      registeredAt: new Date(),
      interactionCount: 0,
      perceptionData: {
        visibility: 'visible',
        importance: config.importance || 'medium',
        contextualRelevance: 0.5,
        userAffinityScore: 0,
        accessibilityLevel: 'full',
      },
    };

    this.entities.set(id, entity);
    this.categoryIndex.get(config.category)?.add(id);
    this.componentIndex.set(config.componentPath, id);
    
    // Update parent's child list if parent exists
    if (config.parentEntityId && this.entities.has(config.parentEntityId)) {
      const parent = this.entities.get(config.parentEntityId)!;
      parent.childEntityIds.push(id);
    }

    this.emit({ type: 'register', entityId: id, entity });
    return entity;
  }

  // Unregister an entity
  unregister(id: string): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;

    // Remove from category index
    this.categoryIndex.get(entity.category)?.delete(id);
    
    // Remove from component index
    this.componentIndex.delete(entity.componentPath);
    
    // Remove from parent's children
    if (entity.parentEntityId && this.entities.has(entity.parentEntityId)) {
      const parent = this.entities.get(entity.parentEntityId)!;
      parent.childEntityIds = parent.childEntityIds.filter(cid => cid !== id);
    }

    this.entities.delete(id);
    this.emit({ type: 'unregister', entityId: id });
    return true;
  }

  // Get entity by ID
  get(id: string): SonicEntity | undefined {
    return this.entities.get(id);
  }

  // Get entity by component path
  getByComponentPath(path: string): SonicEntity | undefined {
    const id = this.componentIndex.get(path);
    return id ? this.entities.get(id) : undefined;
  }

  // Get all entities in a category
  getByCategory(category: EntityCategory): SonicEntity[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entities.get(id)!).filter(Boolean);
  }

  // Get all entities
  getAll(): SonicEntity[] {
    return Array.from(this.entities.values());
  }

  // Update entity state
  updateState(id: string, state: EntityState): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;
    
    entity.state = state;
    this.emit({ type: 'stateChange', entityId: id, entity, previousState: entity.state });
    return true;
  }

  // Record interaction
  recordInteraction(id: string): void {
    const entity = this.entities.get(id);
    if (!entity) return;

    entity.interactionCount++;
    entity.lastInteraction = new Date();
    entity.signature.interactionWeight = Math.min(1, entity.interactionCount / 100);
    entity.perceptionData.userAffinityScore = Math.min(1, entity.interactionCount / 50);
    
    this.emit({ type: 'interaction', entityId: id, entity });
  }

  // Link entities (bidirectional)
  linkEntities(id1: string, id2: string): boolean {
    const entity1 = this.entities.get(id1);
    const entity2 = this.entities.get(id2);
    
    if (!entity1 || !entity2) return false;
    
    if (!entity1.linkedEntityIds.includes(id2)) {
      entity1.linkedEntityIds.push(id2);
    }
    if (!entity2.linkedEntityIds.includes(id1)) {
      entity2.linkedEntityIds.push(id1);
    }
    
    // Update connection strength based on link count
    entity1.signature.connectionStrength = Math.min(1, entity1.linkedEntityIds.length / 10);
    entity2.signature.connectionStrength = Math.min(1, entity2.linkedEntityIds.length / 10);
    
    this.emit({ type: 'link', entityId: id1, linkedEntityId: id2 });
    return true;
  }

  // Query entities with filters
  query(filters: {
    category?: EntityCategory;
    state?: EntityState;
    importance?: 'critical' | 'high' | 'medium' | 'low';
    minResonance?: number;
    namePattern?: string;
  }): SonicEntity[] {
    let results = this.getAll();
    
    if (filters.category) {
      results = results.filter(e => e.category === filters.category);
    }
    if (filters.state) {
      results = results.filter(e => e.state === filters.state);
    }
    if (filters.importance) {
      results = results.filter(e => e.perceptionData.importance === filters.importance);
    }
    if (filters.minResonance !== undefined) {
      results = results.filter(e => e.signature.semanticResonance >= filters.minResonance);
    }
    if (filters.namePattern) {
      const pattern = new RegExp(filters.namePattern, 'i');
      results = results.filter(e => pattern.test(e.name));
    }
    
    return results;
  }

  // Get entity graph for visualization
  getEntityGraph(): { nodes: SonicEntity[]; edges: { from: string; to: string; strength: number }[] } {
    const nodes = this.getAll();
    const edges: { from: string; to: string; strength: number }[] = [];
    
    nodes.forEach(entity => {
      // Add parent-child edges
      entity.childEntityIds.forEach(childId => {
        edges.push({ from: entity.id, to: childId, strength: 0.8 });
      });
      
      // Add linked edges (only one direction to avoid duplicates)
      entity.linkedEntityIds.forEach(linkedId => {
        if (entity.id < linkedId) {
          const linked = this.entities.get(linkedId);
          const avgStrength = (entity.signature.connectionStrength + (linked?.signature.connectionStrength || 0)) / 2;
          edges.push({ from: entity.id, to: linkedId, strength: avgStrength });
        }
      });
    });
    
    return { nodes, edges };
  }

  // Subscribe to registry events
  subscribe(listener: (event: RegistryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: RegistryEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        console.error('Entity registry listener error:', e);
      }
    });
  }

  // Get summary for Atlas perception
  getPerceptionSummary(): EntityPerceptionSummary {
    const all = this.getAll();
    
    const byCategory: Record<EntityCategory, number> = {
      navigation: 0,
      action: 0,
      display: 0,
      input: 0,
      container: 0,
      feedback: 0,
      visualization: 0,
    };
    
    const byState: Record<EntityState, number> = {
      idle: 0,
      active: 0,
      disabled: 0,
      loading: 0,
      error: 0,
      hidden: 0,
    };
    
    let totalResonance = 0;
    let criticalCount = 0;
    let highInteractionCount = 0;
    
    all.forEach(entity => {
      byCategory[entity.category]++;
      byState[entity.state]++;
      totalResonance += entity.signature.semanticResonance;
      if (entity.perceptionData.importance === 'critical') criticalCount++;
      if (entity.signature.interactionWeight > 0.5) highInteractionCount++;
    });
    
    return {
      totalEntities: all.length,
      byCategory,
      byState,
      averageResonance: all.length > 0 ? totalResonance / all.length : 0,
      criticalEntities: criticalCount,
      highInteractionEntities: highInteractionCount,
      timestamp: new Date(),
    };
  }
}

interface RegistryEvent {
  type: 'register' | 'unregister' | 'stateChange' | 'interaction' | 'link';
  entityId: string;
  entity?: SonicEntity;
  linkedEntityId?: string;
  previousState?: EntityState;
}

interface EntityPerceptionSummary {
  totalEntities: number;
  byCategory: Record<EntityCategory, number>;
  byState: Record<EntityState, number>;
  averageResonance: number;
  criticalEntities: number;
  highInteractionEntities: number;
  timestamp: Date;
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const sonicEntityRegistry = new SonicEntityRegistry();

// =============================================================================
// REACT INTEGRATION UTILITIES
// =============================================================================

export interface UseSonicEntityOptions {
  name: string;
  category: EntityCategory;
  componentType: string;
  capabilities?: EntityCapability[];
  parentEntityId?: string;
  importance?: 'critical' | 'high' | 'medium' | 'low';
}

// Pre-defined capability templates
export const CapabilityTemplates = {
  click: (description = 'Click this element'): EntityCapability => ({
    id: 'click',
    name: 'Click',
    description,
    action: 'onClick',
    parameters: {},
    requiresConfirmation: false,
    cooldownMs: 0,
  }),
  
  navigate: (description = 'Navigate to destination'): EntityCapability => ({
    id: 'navigate',
    name: 'Navigate',
    description,
    action: 'navigate',
    parameters: {
      destination: { type: 'string', required: true, description: 'Target path' },
    },
    requiresConfirmation: false,
    cooldownMs: 0,
  }),
  
  toggle: (description = 'Toggle state'): EntityCapability => ({
    id: 'toggle',
    name: 'Toggle',
    description,
    action: 'onToggle',
    parameters: {},
    requiresConfirmation: false,
    cooldownMs: 0,
  }),
  
  submit: (description = 'Submit form data'): EntityCapability => ({
    id: 'submit',
    name: 'Submit',
    description,
    action: 'onSubmit',
    parameters: {
      data: { type: 'object', required: false, description: 'Form data' },
    },
    requiresConfirmation: true,
    cooldownMs: 1000,
  }),
  
  input: (description = 'Set input value'): EntityCapability => ({
    id: 'input',
    name: 'Set Value',
    description,
    action: 'onChange',
    parameters: {
      value: { type: 'string', required: true, description: 'New value' },
    },
    requiresConfirmation: false,
    cooldownMs: 0,
  }),
  
  expand: (description = 'Expand/collapse'): EntityCapability => ({
    id: 'expand',
    name: 'Expand',
    description,
    action: 'onExpand',
    parameters: {
      expanded: { type: 'boolean', required: true, description: 'Expanded state' },
    },
    requiresConfirmation: false,
    cooldownMs: 0,
  }),
};

// Export types for consumers
export type { RegistryEvent, EntityPerceptionSummary };
