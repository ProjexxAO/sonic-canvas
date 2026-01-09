import { useState, useCallback, useRef } from 'react';
import { Plus, ZoomIn, ZoomOut, Maximize2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WorkflowNode } from './WorkflowNode';
import { 
  WorkflowNode as WorkflowNodeType, 
  WorkflowConnection,
  TRIGGER_TYPES,
  ACTION_TYPES,
  CONDITION_TYPES 
} from '@/hooks/useWorkflows';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WorkflowCanvasProps {
  nodes: WorkflowNodeType[];
  connections: WorkflowConnection[];
  onNodesChange: (nodes: WorkflowNodeType[]) => void;
  onConnectionsChange: (connections: WorkflowConnection[]) => void;
  onNodeSelect: (node: WorkflowNodeType | null) => void;
  selectedNodeId: string | null;
}

export function WorkflowCanvas({
  nodes,
  connections,
  onNodesChange,
  onConnectionsChange,
  onNodeSelect,
  selectedNodeId,
}: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleAddNode = (type: 'trigger' | 'action' | 'condition', config: any) => {
    const newNode: WorkflowNodeType = {
      id: crypto.randomUUID(),
      type,
      label: config.label,
      config: { typeId: config.id, ...config },
      position: { x: 200 + nodes.length * 50, y: 100 + nodes.length * 30 },
    };
    onNodesChange([...nodes, newNode]);
    onNodeSelect(newNode);
  };

  const handleDeleteNode = (nodeId: string) => {
    onNodesChange(nodes.filter(n => n.id !== nodeId));
    onConnectionsChange(connections.filter(c => c.sourceId !== nodeId && c.targetId !== nodeId));
    if (selectedNodeId === nodeId) {
      onNodeSelect(null);
    }
  };

  const handleNodeDrag = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedNode(nodeId);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const startPos = { ...node.position };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      
      onNodesChange(nodes.map(n => 
        n.id === nodeId 
          ? { ...n, position: { x: startPos.x + dx, y: startPos.y + dy } }
          : n
      ));
    };

    const handleMouseUp = () => {
      setDraggedNode(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [nodes, zoom, onNodesChange]);

  const handleStartConnect = (nodeId: string) => {
    setConnectingFrom(nodeId);
  };

  const handleEndConnect = (targetId: string) => {
    if (connectingFrom && connectingFrom !== targetId) {
      // Check for existing connection
      const exists = connections.some(
        c => c.sourceId === connectingFrom && c.targetId === targetId
      );
      if (!exists) {
        const newConnection: WorkflowConnection = {
          id: crypto.randomUUID(),
          sourceId: connectingFrom,
          targetId,
        };
        onConnectionsChange([...connections, newConnection]);
      }
    }
    setConnectingFrom(null);
  };

  // Render connection lines
  const renderConnections = () => {
    return connections.map(conn => {
      const source = nodes.find(n => n.id === conn.sourceId);
      const target = nodes.find(n => n.id === conn.targetId);
      if (!source || !target) return null;

      const startX = source.position.x + 96; // Node width / 2
      const startY = source.position.y + 80; // Node height
      const endX = target.position.x + 96;
      const endY = target.position.y;

      const midY = (startY + endY) / 2;

      return (
        <svg
          key={conn.id}
          className="absolute inset-0 pointer-events-none overflow-visible"
          style={{ zIndex: 0 }}
        >
          <path
            d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray={connectingFrom ? '5,5' : undefined}
            className="opacity-60"
          />
          {/* Arrow */}
          <polygon
            points={`${endX},${endY} ${endX - 5},${endY - 8} ${endX + 5},${endY - 8}`}
            fill="hsl(var(--primary))"
            className="opacity-60"
          />
        </svg>
      );
    });
  };

  return (
    <div className="relative flex-1 bg-muted/30 rounded-lg border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary" className="gap-1">
              <Plus size={14} />
              Add Node
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Triggers</DropdownMenuLabel>
            {TRIGGER_TYPES.map(t => (
              <DropdownMenuItem key={t.id} onClick={() => handleAddNode('trigger', t)}>
                <span className="flex-1">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {ACTION_TYPES.map(t => (
              <DropdownMenuItem key={t.id} onClick={() => handleAddNode('action', t)}>
                <span className="flex-1">{t.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Conditions</DropdownMenuLabel>
            {CONDITION_TYPES.map(t => (
              <DropdownMenuItem key={t.id} onClick={() => handleAddNode('condition', t)}>
                <span className="flex-1">{t.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {selectedNodeId && (
          <Button 
            size="sm" 
            variant="destructive" 
            className="gap-1"
            onClick={() => handleDeleteNode(selectedNodeId)}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleZoom(-0.1)}>
          <ZoomOut size={14} />
        </Button>
        <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleZoom(0.1)}>
          <ZoomIn size={14} />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
          <Maximize2 size={14} />
        </Button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0 overflow-auto"
        onClick={() => { onNodeSelect(null); setConnectingFrom(null); }}
      >
        {/* Grid Background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        />

        {/* Connections */}
        <div 
          className="absolute inset-0"
          style={{ 
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
          }}
        >
          {renderConnections()}
        </div>

        {/* Nodes */}
        <div 
          className="relative"
          style={{ 
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute"
              style={{ 
                left: node.position.x,
                top: node.position.y,
                zIndex: draggedNode === node.id ? 100 : 1,
              }}
              onMouseDown={(e) => handleNodeDrag(node.id, e)}
            >
              <WorkflowNode
                id={node.id}
                type={node.type}
                label={node.label}
                subLabel={node.config?.description}
                icon={node.config?.icon}
                isSelected={selectedNodeId === node.id}
                isConnecting={connectingFrom === node.id}
                onClick={() => onNodeSelect(node)}
                onStartConnect={() => handleStartConnect(node.id)}
                onEndConnect={() => handleEndConnect(node.id)}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-muted-foreground text-sm">
                Start building your workflow
              </div>
              <div className="text-xs text-muted-foreground">
                Click "Add Node" to add a trigger
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
