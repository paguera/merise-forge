import { useMeriseStore } from '@/hooks/useMeriseStore';
import { TableNode } from './TableNode';
import { MLDConnectionLine } from './MLDConnectionLine';

// Approximate dimensions for tables
const TABLE_WIDTH = 180;
const TABLE_HEADER_HEIGHT = 40;
const TABLE_ROW_HEIGHT = 36;

export function MPDCanvas() {
  const { mldModel } = useMeriseStore();

  if (!mldModel) {
    return (
      <div id="merise-canvas" className="flex-1 canvas-bg relative overflow-hidden min-h-[600px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Aucun modèle MPD</p>
          <p className="text-sm">Créez d'abord un MCD pour le transformer</p>
        </div>
      </div>
    );
  }

  // Calculate table heights based on number of columns
  const getTableHeight = (columnCount: number) => {
    return TABLE_HEADER_HEIGHT + (columnCount * TABLE_ROW_HEIGHT);
  };

  return (
    <div id="merise-canvas" className="flex-1 canvas-bg relative overflow-hidden min-h-[600px]">
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
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
        <TableNode key={table.id} table={table} showTypes={true} />
      ))}
    </div>
  );
}
