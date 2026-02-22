import { useEffect, useRef, useCallback } from 'react';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { TableNode } from './TableNode';
import { MLDConnectionLine } from './MLDConnectionLine';
import { ZoomControls } from './ZoomControls';
import { CollaboratorCursors } from './CollaboratorCursors';
import { useCanvasZoom } from '@/hooks/useCanvasZoom';
import type { PresenceUser } from '@/hooks/useRealtimePresence';

const TABLE_WIDTH = 180;
const TABLE_HEADER_HEIGHT = 40;
const TABLE_ROW_HEIGHT = 36;

interface Props {
  users?: PresenceUser[];
  onCursorMove?: (x: number, y: number) => void;
}

export function MLDCanvas({ users = [], onCursorMove }: Props) {
  const { mldModel } = useMeriseStore();
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

  if (!mldModel) {
    return (
      <div id="merise-canvas" className="flex-1 canvas-bg relative overflow-hidden h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Aucun modèle MLD</p>
          <p className="text-sm">Créez d'abord un MCD pour le transformer</p>
        </div>
      </div>
    );
  }

  const getTableHeight = (columnCount: number) => {
    return TABLE_HEADER_HEIGHT + (columnCount * TABLE_ROW_HEIGHT);
  };

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
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1, overflow: 'visible' }}>
          {mldModel.relations.map((relation) => {
            const fromTable = mldModel.tables.find(t => t.name === relation.fromTable);
            const toTable = mldModel.tables.find(t => t.name === relation.toTable);
            
            if (!fromTable || !toTable) return null;
            
            const fromHeight = getTableHeight(fromTable.columns.length);
            const toHeight = getTableHeight(toTable.columns.length);
            
            return (
              <MLDConnectionLine
                key={relation.id}
                fromX={fromTable.position.x}
                fromY={fromTable.position.y}
                toX={toTable.position.x}
                toY={toTable.position.y}
                fromWidth={TABLE_WIDTH}
                fromHeight={fromHeight}
                toWidth={TABLE_WIDTH}
                toHeight={toHeight}
                relationType={relation.type as '1-1' | '1-N' | 'N-M'}
              />
            );
          })}
        </svg>

        {mldModel.tables.map((table) => (
          <TableNode key={table.id} table={table} showTypes={false} scale={scale} />
        ))}
      </div>

      <ZoomControls scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
      <CollaboratorCursors users={users} />
    </div>
  );
}
