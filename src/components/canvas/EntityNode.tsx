import { useState, useRef, useCallback, useEffect } from 'react';
import { Entity } from '@/types/merise';
import { useMeriseStore } from '@/hooks/useMeriseStore';

interface EntityNodeProps {
  entity: Entity;
  mode: 'MCD' | 'MLD' | 'MPD';
  scale?: number;
}

const GRID_SIZE = 20;

const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

export function EntityNode({ entity, mode, scale = 1 }: EntityNodeProps) {
  const { updateEntity, selectEntity, selectedEntityId } = useMeriseStore();
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const entityPosRef = useRef({ x: entity.position.x, y: entity.position.y });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    entityPosRef.current = { x: entity.position.x, y: entity.position.y };
    selectEntity(entity.id);
  }, [entity.id, entity.position.x, entity.position.y, selectEntity]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - startPosRef.current.x) / scale;
      const dy = (e.clientY - startPosRef.current.y) / scale;
      
      const newX = snapToGrid(Math.max(0, entityPosRef.current.x + dx));
      const newY = snapToGrid(Math.max(0, entityPosRef.current.y + dy));
      
      updateEntity(entity.id, { position: { x: newX, y: newY } });
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
  }, [isDragging, entity.id, scale, updateEntity]);

  const isSelected = selectedEntityId === entity.id;

  return (
    <div
      ref={nodeRef}
      className={`absolute cursor-move select-none transition-shadow animate-scale-in ${
        isSelected ? 'z-20' : 'z-10'
      }`}
      style={{
        left: entity.position.x,
        top: entity.position.y,
      }}
      onMouseDown={handleMouseDown}
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
