// Atlas UI Bridge - Enables Atlas to perceive, query, and manipulate UI through Sonic Entities

import { sonicEntityRegistry, SonicEntity, EntityCategory, EntityState } from './sonicEntityBridge';
import { toast } from 'sonner';

// =============================================================================
// ATLAS UI PERCEPTION LAYER
// =============================================================================

export interface UIPerceptionResult {
  summary: string;
  entities: UIEntityInfo[];
  actionableElements: UIActionableElement[];
  currentContext: UIContext;
}

export interface UIEntityInfo {
  id: string;
  name: string;
  category: EntityCategory;
  state: EntityState;
  importance: string;
  capabilities: string[];
  resonance: number;
}

export interface UIActionableElement {
  entityId: string;
  name: string;
  action: string;
  description: string;
  requiresConfirmation: boolean;
}

export interface UIContext {
  currentPage: string;
  activeElements: number;
  criticalElements: number;
  interactionHotspots: string[];
}

class AtlasUIBridge {
  // Perceive the current UI state
  perceiveUI(): UIPerceptionResult {
    const summary = sonicEntityRegistry.getPerceptionSummary();
    const allEntities = sonicEntityRegistry.getAll();
    
    // Get entity info for Atlas
    const entities: UIEntityInfo[] = allEntities.map(entity => ({
      id: entity.id,
      name: entity.name,
      category: entity.category,
      state: entity.state,
      importance: entity.perceptionData.importance,
      capabilities: entity.capabilities.map(c => c.name),
      resonance: entity.signature.semanticResonance,
    }));
    
    // Get actionable elements
    const actionableElements: UIActionableElement[] = [];
    allEntities.forEach(entity => {
      entity.capabilities.forEach(cap => {
        actionableElements.push({
          entityId: entity.id,
          name: entity.name,
          action: cap.name,
          description: cap.description,
          requiresConfirmation: cap.requiresConfirmation,
        });
      });
    });
    
    // Build current context
    const currentPage = typeof window !== 'undefined' ? window.location.pathname : '/';
    const activeElements = allEntities.filter(e => e.state === 'active').length;
    const criticalElements = allEntities.filter(e => e.perceptionData.importance === 'critical').length;
    const interactionHotspots = allEntities
      .sort((a, b) => b.signature.interactionWeight - a.signature.interactionWeight)
      .slice(0, 5)
      .map(e => e.name);
    
    return {
      summary: this.generateSummaryText(summary, entities),
      entities,
      actionableElements,
      currentContext: {
        currentPage,
        activeElements,
        criticalElements,
        interactionHotspots,
      },
    };
  }

  private generateSummaryText(
    summary: ReturnType<typeof sonicEntityRegistry.getPerceptionSummary>,
    entities: UIEntityInfo[]
  ): string {
    const lines: string[] = [];
    
    lines.push(`UI Perception: ${summary.totalEntities} Sonic Entities registered`);
    lines.push(`Average Semantic Resonance: ${(summary.averageResonance * 100).toFixed(1)}%`);
    lines.push(`Critical Elements: ${summary.criticalEntities}`);
    lines.push(`High-Interaction Elements: ${summary.highInteractionEntities}`);
    
    // Category breakdown
    const categoryBreakdown = Object.entries(summary.byCategory)
      .filter(([_, count]) => count > 0)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');
    if (categoryBreakdown) {
      lines.push(`Categories: ${categoryBreakdown}`);
    }
    
    // Active states
    const activeStates = Object.entries(summary.byState)
      .filter(([state, count]) => count > 0 && state !== 'idle')
      .map(([state, count]) => `${state}: ${count}`)
      .join(', ');
    if (activeStates) {
      lines.push(`Active States: ${activeStates}`);
    }
    
    return lines.join('\n');
  }

  // Query entities by natural language
  queryEntities(query: string): SonicEntity[] {
    const lowerQuery = query.toLowerCase();
    
    // Parse query for filters
    const filters: Parameters<typeof sonicEntityRegistry.query>[0] = {};
    
    // Category detection
    const categoryKeywords: Record<string, EntityCategory> = {
      'button': 'action',
      'buttons': 'action',
      'click': 'action',
      'action': 'action',
      'nav': 'navigation',
      'navigation': 'navigation',
      'menu': 'navigation',
      'link': 'navigation',
      'input': 'input',
      'form': 'input',
      'field': 'input',
      'text': 'input',
      'display': 'display',
      'show': 'display',
      'view': 'display',
      'chart': 'visualization',
      'graph': 'visualization',
      'visual': 'visualization',
      'alert': 'feedback',
      'notification': 'feedback',
      'message': 'feedback',
      'container': 'container',
      'section': 'container',
      'panel': 'container',
    };
    
    for (const [keyword, category] of Object.entries(categoryKeywords)) {
      if (lowerQuery.includes(keyword)) {
        filters.category = category;
        break;
      }
    }
    
    // State detection
    const stateKeywords: Record<string, EntityState> = {
      'active': 'active',
      'enabled': 'active',
      'disabled': 'disabled',
      'loading': 'loading',
      'error': 'error',
      'hidden': 'hidden',
      'visible': 'idle',
    };
    
    for (const [keyword, state] of Object.entries(stateKeywords)) {
      if (lowerQuery.includes(keyword)) {
        filters.state = state;
        break;
      }
    }
    
    // Importance detection
    if (lowerQuery.includes('critical') || lowerQuery.includes('important')) {
      filters.importance = 'critical';
    } else if (lowerQuery.includes('high priority')) {
      filters.importance = 'high';
    }
    
    // Name pattern - extract quoted strings or key nouns
    const quotedMatch = query.match(/"([^"]+)"/);
    if (quotedMatch) {
      filters.namePattern = quotedMatch[1];
    }
    
    return sonicEntityRegistry.query(filters);
  }

  // Execute an action on a UI entity
  async executeAction(
    entityId: string, 
    actionName: string, 
    parameters: Record<string, unknown> = {}
  ): Promise<{ success: boolean; result: string }> {
    const entity = sonicEntityRegistry.get(entityId);
    
    if (!entity) {
      return { success: false, result: `Entity ${entityId} not found` };
    }
    
    const capability = entity.capabilities.find(c => 
      c.name.toLowerCase() === actionName.toLowerCase() || 
      c.action.toLowerCase() === actionName.toLowerCase()
    );
    
    if (!capability) {
      const available = entity.capabilities.map(c => c.name).join(', ');
      return { 
        success: false, 
        result: `Action "${actionName}" not available for ${entity.name}. Available: ${available}` 
      };
    }
    
    // Check required parameters
    for (const [paramName, paramDef] of Object.entries(capability.parameters)) {
      if (paramDef.required && !(paramName in parameters)) {
        return { 
          success: false, 
          result: `Missing required parameter: ${paramName}` 
        };
      }
    }
    
    // Execute through entity's props (the actual handlers)
    try {
      const handler = entity.props[capability.action];
      if (typeof handler === 'function') {
        await handler(parameters);
        sonicEntityRegistry.recordInteraction(entityId);
        sonicEntityRegistry.updateState(entityId, 'active');
        
        // Reset state after brief delay
        setTimeout(() => {
          sonicEntityRegistry.updateState(entityId, 'idle');
        }, 500);
        
        toast.success(`Executed: ${capability.name} on ${entity.name}`);
        return { success: true, result: `Successfully executed ${capability.name} on ${entity.name}` };
      } else {
        return { success: false, result: `Handler for ${capability.action} is not a function` };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, result: `Execution failed: ${msg}` };
    }
  }

  // Get entity relationship graph for visualization
  getUIGraph(): ReturnType<typeof sonicEntityRegistry.getEntityGraph> {
    return sonicEntityRegistry.getEntityGraph();
  }

  // Find entities by semantic similarity (for Atlas to find relevant UI)
  findRelevantEntities(context: string, limit = 5): SonicEntity[] {
    const allEntities = sonicEntityRegistry.getAll();
    const lowerContext = context.toLowerCase();
    
    // Score each entity based on context relevance
    const scored = allEntities.map(entity => {
      let score = entity.signature.semanticResonance;
      
      // Name match
      if (entity.name.toLowerCase().includes(lowerContext)) {
        score += 0.5;
      }
      
      // Category relevance
      if (lowerContext.includes(entity.category)) {
        score += 0.3;
      }
      
      // Capability match
      entity.capabilities.forEach(cap => {
        if (cap.description.toLowerCase().includes(lowerContext)) {
          score += 0.2;
        }
      });
      
      // Boost for critical/high importance
      if (entity.perceptionData.importance === 'critical') score += 0.3;
      if (entity.perceptionData.importance === 'high') score += 0.2;
      
      // Boost for high interaction
      score += entity.signature.interactionWeight * 0.2;
      
      return { entity, score };
    });
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.entity);
  }

  // Generate natural language description for Atlas
  describeEntity(entityId: string): string {
    const entity = sonicEntityRegistry.get(entityId);
    if (!entity) return 'Entity not found';
    
    const parts: string[] = [];
    parts.push(`"${entity.name}" is a ${entity.category} element`);
    parts.push(`currently ${entity.state}`);
    parts.push(`with ${entity.perceptionData.importance} importance`);
    
    if (entity.capabilities.length > 0) {
      const capNames = entity.capabilities.map(c => c.name).join(', ');
      parts.push(`Can perform: ${capNames}`);
    }
    
    if (entity.interactionCount > 0) {
      parts.push(`Interacted ${entity.interactionCount} times`);
    }
    
    parts.push(`Sonic resonance: ${(entity.signature.semanticResonance * 100).toFixed(0)}%`);
    
    return parts.join('. ') + '.';
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const atlasUIBridge = new AtlasUIBridge();

// =============================================================================
// ATLAS CLIENT TOOLS INTEGRATION
// =============================================================================

// These functions are designed to be used as Atlas client tools
export const atlasUIClientTools = {
  // Perceive current UI state
  perceiveUI: () => {
    const perception = atlasUIBridge.perceiveUI();
    return JSON.stringify(perception, null, 2);
  },
  
  // Query UI elements
  queryUI: (params: { query: string }) => {
    const results = atlasUIBridge.queryEntities(params.query);
    if (results.length === 0) {
      return 'No matching UI elements found';
    }
    
    const descriptions = results.map(e => atlasUIBridge.describeEntity(e.id));
    return `Found ${results.length} elements:\n${descriptions.join('\n')}`;
  },
  
  // Execute UI action
  executeUIAction: async (params: { entityId: string; action: string; parameters?: Record<string, unknown> }) => {
    const result = await atlasUIBridge.executeAction(
      params.entityId, 
      params.action, 
      params.parameters || {}
    );
    return result.result;
  },
  
  // Get relevant UI elements for context
  findRelevantUI: (params: { context: string; limit?: number }) => {
    const entities = atlasUIBridge.findRelevantEntities(params.context, params.limit || 5);
    if (entities.length === 0) {
      return 'No relevant UI elements found';
    }
    
    const descriptions = entities.map(e => `- ${e.name} (${e.category}): ${atlasUIBridge.describeEntity(e.id)}`);
    return `Relevant UI elements:\n${descriptions.join('\n')}`;
  },
  
  // Get UI element details
  describeUIElement: (params: { entityId: string }) => {
    return atlasUIBridge.describeEntity(params.entityId);
  },
  
  // Get actionable elements
  getActionableElements: () => {
    const perception = atlasUIBridge.perceiveUI();
    if (perception.actionableElements.length === 0) {
      return 'No actionable UI elements available';
    }
    
    const actions = perception.actionableElements.map(e => 
      `- ${e.name}: ${e.action} - ${e.description}${e.requiresConfirmation ? ' (requires confirmation)' : ''}`
    );
    return `Available actions:\n${actions.join('\n')}`;
  },
};
