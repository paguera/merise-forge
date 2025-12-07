import { useMeriseStore } from '@/hooks/useMeriseStore';
import { TableNode } from './TableNode';

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
            <g key={relation.id}>
              <line
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              {/* Cardinality labels */}
              <text
                x={fromX + (toX - fromX) * 0.2}
                y={fromY + (toY - fromY) * 0.2 - 8}
                fill="hsl(var(--destructive))"
                fontSize="14"
                fontWeight="bold"
              >
                {relation.type === 'N-M' ? 'N' : relation.type === '1-N' ? 'N' : '1'}
              </text>
              <text
                x={fromX + (toX - fromX) * 0.8}
                y={fromY + (toY - fromY) * 0.8 - 8}
                fill="hsl(var(--destructive))"
                fontSize="14"
                fontWeight="bold"
              >
                {relation.type === 'N-M' ? 'M' : '1'}
              </text>
            </g>
          );
        })}
      </svg>

      {mldModel.tables.map((table) => (
        <TableNode key={table.id} table={table} showTypes={false} />
      ))}
    </div>
  );
}
