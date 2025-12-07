import { useState } from 'react';
import { MLDTable } from '@/types/merise';

interface TableNodeProps {
  table: MLDTable;
  showTypes: boolean;
}

export function TableNode({ table, showTypes }: TableNodeProps) {
  const [position, setPosition] = useState(table.position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const parent = (e.target as HTMLElement).closest('.canvas-bg');
    if (!parent) return;
    
    const rect = parent.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - dragOffset.x, rect.width - 200));
    const y = Math.max(0, Math.min(e.clientY - dragOffset.y, rect.height - 100));
    
    setPosition({ x, y });
    table.position = { x, y };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const isJunction = table.isJunction;

  return (
    <div
      className="absolute cursor-move select-none z-10 animate-scale-in"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
