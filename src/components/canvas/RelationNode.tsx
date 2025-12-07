import { useState } from 'react';
import { Relation } from '@/types/merise';
import { useMeriseStore } from '@/hooks/useMeriseStore';

interface RelationNodeProps {
  relation: Relation;
}

export function RelationNode({ relation }: RelationNodeProps) {
  const { updateRelation, selectRelation, selectedRelationId } = useMeriseStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - relation.position.x,
      y: e.clientY - relation.position.y,
    });
    selectRelation(relation.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const parent = (e.target as HTMLElement).closest('.canvas-bg');
    if (!parent) return;
    
    const rect = parent.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - dragOffset.x, rect.width - 100));
    const y = Math.max(0, Math.min(e.clientY - dragOffset.y, rect.height - 40));
    
    updateRelation(relation.id, { position: { x, y } });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const isSelected = selectedRelationId === relation.id;

  return (
    <div
      className={`absolute cursor-move select-none z-15 animate-scale-in ${
        isSelected ? 'z-20' : ''
      }`}
      style={{
        left: relation.position.x,
        top: relation.position.y,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
