// React Hook for registering components as Sonic Entities

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  sonicEntityRegistry, 
  SonicEntity, 
  EntityCategory, 
  EntityState,
  EntityCapability,
  UseSonicEntityOptions 
} from '@/lib/sonicEntityBridge';

interface UseSonicEntityReturn {
  entity: SonicEntity | null;
  entityId: string | null;
  updateState: (state: EntityState) => void;
  recordInteraction: () => void;
  linkTo: (otherId: string) => void;
}

export function useSonicEntity(
  options: UseSonicEntityOptions,
  props: Record<string, unknown> = {}
): UseSonicEntityReturn {
  const location = useLocation();
  const entityRef = useRef<SonicEntity | null>(null);
  const entityIdRef = useRef<string | null>(null);
  
  // Generate stable component path based on location and component type
  const componentPath = useMemo(() => {
    return `${location.pathname}:${options.componentType}:${options.name}`;
  }, [location.pathname, options.componentType, options.name]);

  // Register entity on mount
  useEffect(() => {
    const entity = sonicEntityRegistry.register({
      name: options.name,
      category: options.category,
      componentPath,
      componentType: options.componentType,
      props,
      capabilities: options.capabilities,
      parentEntityId: options.parentEntityId,
      importance: options.importance,
    });
    
    entityRef.current = entity;
    entityIdRef.current = entity.id;

    // Cleanup on unmount
    return () => {
      if (entityIdRef.current) {
        sonicEntityRegistry.unregister(entityIdRef.current);
        entityRef.current = null;
        entityIdRef.current = null;
      }
    };
  }, [componentPath, options.name, options.category, options.componentType, options.parentEntityId, options.importance]);

  // Update props when they change
  useEffect(() => {
    if (entityRef.current) {
      entityRef.current.props = props;
    }
  }, [props]);

  const updateState = useCallback((state: EntityState) => {
    if (entityIdRef.current) {
      sonicEntityRegistry.updateState(entityIdRef.current, state);
    }
  }, []);

  const recordInteraction = useCallback(() => {
    if (entityIdRef.current) {
      sonicEntityRegistry.recordInteraction(entityIdRef.current);
    }
  }, []);

  const linkTo = useCallback((otherId: string) => {
    if (entityIdRef.current) {
      sonicEntityRegistry.linkEntities(entityIdRef.current, otherId);
    }
  }, []);

  return {
    entity: entityRef.current,
    entityId: entityIdRef.current,
    updateState,
    recordInteraction,
    linkTo,
  };
}

// Higher-order component for automatic Sonic Entity registration
export function withSonicEntity<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<UseSonicEntityOptions, 'componentType'> & { componentType?: string }
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  const componentType = options.componentType || displayName;

  const WithSonicEntity = (props: P) => {
    useSonicEntity(
      { ...options, componentType },
      props as Record<string, unknown>
    );
    
    return <WrappedComponent {...props} />;
  };

  WithSonicEntity.displayName = `WithSonicEntity(${displayName})`;
  return WithSonicEntity;
}

// Hook to access the entity registry
export function useSonicEntityRegistry() {
  const getAll = useCallback(() => sonicEntityRegistry.getAll(), []);
  const getByCategory = useCallback((category: EntityCategory) => 
    sonicEntityRegistry.getByCategory(category), []);
  const query = useCallback((filters: Parameters<typeof sonicEntityRegistry.query>[0]) => 
    sonicEntityRegistry.query(filters), []);
  const getEntityGraph = useCallback(() => sonicEntityRegistry.getEntityGraph(), []);
  const getPerceptionSummary = useCallback(() => sonicEntityRegistry.getPerceptionSummary(), []);
  
  return {
    getAll,
    getByCategory,
    query,
    getEntityGraph,
    getPerceptionSummary,
    registry: sonicEntityRegistry,
  };
}
