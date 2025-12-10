import { useState, useRef, useCallback, useEffect } from 'react';
import { Relation } from '@/types/merise';
import { useMeriseStore } from '@/hooks/useMeriseStore';

interface RelationNodeProps {
  relation: Relation;
  scale?: number;
}

const GRID_SIZE = 20;

const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

export function RelationNode({ relation, scale = 1 }: RelationNodeProps) {
  const { updateRelation, selectRelation, selectedRelationId } = useMeriseStore();
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const relationPosRef = useRef({ x: relation.position.x, y: relation.position.y });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    relationPosRef.current = { x: relation.position.x, y: relation.position.y };
    selectRelation(relation.id);
  }, [relation.id, relation.position.x, relation.position.y, selectRelation]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - startPosRef.current.x) / scale;
      const dy = (e.clientY - startPosRef.current.y) / scale;
      
      const newX = snapToGrid(Math.max(0, relationPosRef.current.x + dx));
      const newY = snapToGrid(Math.max(0, relationPosRef.current.y + dy));
      
      updateRelation(relation.id, { position: { x: newX, y: newY } });
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
  }, [isDragging, relation.id, scale, updateRelation]);

  const isSelected = selectedRelationId === relation.id;

  return (
    <div
      ref={nodeRef}
      className={`absolute cursor-move select-none z-15 animate-scale-in ${
        isSelected ? 'z-20' : ''
      }`}
      style={{
        left: relation.position.x,
        top: relation.position.y,
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`bg-relation border-2 border-relation-border rounded-full px-5 py-2 shadow-md ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}
      >
        <span className="text-sm font-medium text-foreground italic">
          {relation.name}
        </span>
      </div>
    </div>
  );
}
