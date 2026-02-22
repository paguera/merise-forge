import { useEffect, useRef, useCallback } from 'react';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { EntityNode } from './EntityNode';
import { RelationNode } from './RelationNode';
import { ConnectionLine } from './ConnectionLine';
import { ZoomControls } from './ZoomControls';
import { CollaboratorCursors } from './CollaboratorCursors';
import { useCanvasZoom } from '@/hooks/useCanvasZoom';
import type { PresenceUser } from '@/hooks/useRealtimePresence';

interface Props {
  users?: PresenceUser[];
  onCursorMove?: (x: number, y: number) => void;
}

export function MCDCanvas({ users = [], onCursorMove }: Props) {
  const { model } = useMeriseStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const { scale, position, zoomIn, zoomOut, resetZoom, handleWheel, startPan, movePan, endPan, isPanning } = useCanvasZoom();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    movePan(e);
    if (onCursorMove) {
      onCursorMove(e.clientX, e.clientY);
    }
  }, [movePan, onCursorMove]);

  return (
    <div 
      id="merise-canvas" 
      className="flex-1 canvas-bg relative overflow-hidden h-full"
      ref={canvasRef}
      onMouseDown={startPan}
      onMouseMove={handleMouseMove}
      onMouseUp={endPan}
      onMouseLeave={endPan}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'top left',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          {model.relations.map((relation) => {
            const entity1 = model.entities.find(e => e.id === relation.entity1Id);
            const entity2 = model.entities.find(e => e.id === relation.entity2Id);
            
            if (!entity1 || !entity2) return null;
            
            return (
              <ConnectionLine
                key={relation.id}
                x1={entity1.position.x + 75}
                y1={entity1.position.y + 30}
                x2={entity2.position.x + 75}
                y2={entity2.position.y + 30}
                relationX={relation.position.x}
                relationY={relation.position.y}
                cardinality1={relation.cardinality1}
                cardinality2={relation.cardinality2}
                isMLD={false}
              />
            );
          })}
        </svg>

        {model.entities.map((entity) => (
          <EntityNode key={entity.id} entity={entity} mode="MCD" scale={scale} />
        ))}

        {model.relations.map((relation) => (
          <RelationNode key={relation.id} relation={relation} scale={scale} />
        ))}
      </div>

      {model.entities.length === 0 && model.relations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground animate-fade-in">
            <p className="text-lg font-medium mb-2">Canvas vide</p>
            <p className="text-sm">Utilisez le panneau de gauche pour créer des entités et relations</p>
          </div>
        </div>
      )}

      <ZoomControls scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
      <CollaboratorCursors users={users} />
    </div>
  );
}
