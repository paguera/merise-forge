import { useMeriseStore } from '@/hooks/useMeriseStore';
import { TableNode } from './TableNode';
import { MLDConnectionLine } from './MLDConnectionLine';

export function MLDCanvas() {
  const { mldModel } = useMeriseStore();

  if (!mldModel) {
    return (
      <div id="merise-canvas" className="flex-1 canvas-bg relative overflow-hidden min-h-[600px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Aucun modèle MLD</p>
          <p className="text-sm">Créez d'abord un MCD pour le transformer</p>
        </div>
      </div>
    );
  }

  return (
    <div id="merise-canvas" className="flex-1 canvas-bg relative overflow-hidden min-h-[600px]">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {mldModel.relations.map((relation) => {
          const fromTable = mldModel.tables.find(t => t.name === relation.fromTable);
          const toTable = mldModel.tables.find(t => t.name === relation.toTable);
          
          if (!fromTable || !toTable) return null;
          
          const fromX = fromTable.position.x + 100;
          const fromY = fromTable.position.y + 50;
          const toX = toTable.position.x + 100;
          const toY = toTable.position.y + 50;
          
          return (
            <MLDConnectionLine
              key={relation.id}
              fromX={fromX}
              fromY={fromY}
              toX={toX}
              toY={toY}
              relationType={relation.type as '1-1' | '1-N' | 'N-M'}
            />
          );
        })}
      </svg>

      {mldModel.tables.map((table) => (
        <TableNode key={table.id} table={table} showTypes={false} />
      ))}
    </div>
  );
}
