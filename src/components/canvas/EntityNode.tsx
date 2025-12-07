import { useState } from 'react';
import { Entity } from '@/types/merise';
import { useMeriseStore } from '@/hooks/useMeriseStore';

interface EntityNodeProps {
  entity: Entity;
  mode: 'MCD' | 'MLD' | 'MPD';
}

export function EntityNode({ entity, mode }: EntityNodeProps) {
  const { updateEntity, selectEntity, selectedEntityId } = useMeriseStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - entity.position.x,
      y: e.clientY - entity.position.y,
    });
    selectEntity(entity.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const parent = (e.target as HTMLElement).closest('.canvas-bg');
    if (!parent) return;
    
    const rect = parent.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - dragOffset.x, rect.width - 150));
    const y = Math.max(0, Math.min(e.clientY - dragOffset.y, rect.height - 60));
    
    updateEntity(entity.id, { position: { x, y } });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const isSelected = selectedEntityId === entity.id;

  return (
    <div
      className={`absolute cursor-move select-none transition-shadow animate-scale-in ${
        isSelected ? 'z-20' : 'z-10'
      }`}
      style={{
        left: entity.position.x,
        top: entity.position.y,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className={`bg-entity border-2 border-entity-border rounded-lg shadow-md min-w-[120px] ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}
      >
        <div className="px-6 py-3 text-center font-semibold text-foreground">
          {entity.name}
        </div>
      </div>
    </div>
  );
}
