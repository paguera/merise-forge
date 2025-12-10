import { useState, useEffect, useRef, useCallback } from 'react';
import { MLDTable } from '@/types/merise';
import { useMeriseStore } from '@/hooks/useMeriseStore';

interface TableNodeProps {
  table: MLDTable;
  showTypes: boolean;
  scale?: number;
}

const GRID_SIZE = 20;

const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

export function TableNode({ table, showTypes, scale = 1 }: TableNodeProps) {
  const { updateTablePosition } = useMeriseStore();
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const tablePosRef = useRef({ x: table.position.x, y: table.position.y });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    tablePosRef.current = { x: table.position.x, y: table.position.y };
  }, [table.position.x, table.position.y]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - startPosRef.current.x) / scale;
      const dy = (e.clientY - startPosRef.current.y) / scale;
      
      const newX = snapToGrid(Math.max(0, tablePosRef.current.x + dx));
      const newY = snapToGrid(Math.max(0, tablePosRef.current.y + dy));
      
      updateTablePosition(table.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, table.id, scale, updateTablePosition]);

  const isJunction = table.isJunction;

  return (
    <div
      ref={nodeRef}
      className={`absolute cursor-move select-none z-10 animate-scale-in ${isDragging ? 'z-50' : ''}`}
      style={{
        left: table.position.x,
        top: table.position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`shadow-lg rounded-lg overflow-hidden min-w-[180px] ${
          isJunction 
            ? 'border-2 border-dashed border-junction-border bg-junction' 
            : 'border-2 border-entity-border bg-entity'
        }`}
      >
        {/* Header */}
        <div className={`px-4 py-2 font-semibold text-center ${
          showTypes ? 'bg-primary/10' : 'bg-secondary'
        }`}>
          {table.name}
        </div>
        
        {/* Separator */}
        <div className="border-t border-border" />
        
        {/* Columns */}
        <div className="divide-y divide-border">
          {table.columns.map((column) => (
            <div key={column.id} className="px-4 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {column.isPrimaryKey && (
                  <span className="bg-pk text-pk-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                    PK
                  </span>
                )}
                {column.isForeignKey && (
                  <span className="bg-fk text-fk-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                    FK
                  </span>
                )}
                <span className="text-sm">{column.name}</span>
              </div>
              {showTypes && (
                <span className="text-xs text-muted-foreground font-mono">
                  {column.type}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
