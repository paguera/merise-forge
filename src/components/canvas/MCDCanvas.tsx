import { useMeriseStore } from '@/hooks/useMeriseStore';
import { EntityNode } from './EntityNode';
import { RelationNode } from './RelationNode';
import { ConnectionLine } from './ConnectionLine';

export function MCDCanvas() {
  const { model } = useMeriseStore();

  return (
    <div id="merise-canvas" className="flex-1 canvas-bg relative overflow-hidden min-h-[600px]">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
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
        <EntityNode key={entity.id} entity={entity} mode="MCD" />
      ))}

      {model.relations.map((relation) => (
        <RelationNode key={relation.id} relation={relation} />
      ))}

      {model.entities.length === 0 && model.relations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground animate-fade-in">
            <p className="text-lg font-medium mb-2">Canvas vide</p>
            <p className="text-sm">Utilisez le panneau de gauche pour créer des entités et relations</p>
          </div>
        </div>
      )}
    </div>
  );
}
