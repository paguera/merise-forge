import { MeriseModel, MLDModel, MLDTable, MLDColumn, MLDRelation, Entity, Relation } from '@/types/merise';

export function transformMCDtoMLD(mcd: MeriseModel): MLDModel {
  const tables: MLDTable[] = [];
  const relations: MLDRelation[] = [];

  // Create tables from entities
  mcd.entities.forEach((entity) => {
    const columns: MLDColumn[] = entity.attributes.map((attr) => ({
      id: attr.id,
      name: attr.name,
      type: getColumnType(attr.type, attr.length),
      isPrimaryKey: attr.isPrimaryKey,
      isForeignKey: false,
      isNullable: attr.isNullable,
    }));

    // Add default PK if none exists
    if (!columns.some((c) => c.isPrimaryKey)) {
      columns.unshift({
        id: `${entity.id}_pk`,
        name: 'id',
        type: 'INT',
        isPrimaryKey: true,
        isForeignKey: false,
        isNullable: false,
      });
    }

    tables.push({
      id: entity.id,
      name: entity.name,
      columns,
      isJunction: false,
      position: { ...entity.position },
    });
  });

  // Process relations
  mcd.relations.forEach((relation) => {
    const entity1 = mcd.entities.find((e) => e.id === relation.entity1Id);
    const entity2 = mcd.entities.find((e) => e.id === relation.entity2Id);
    
    if (!entity1 || !entity2) return;

    const relationType = getRelationType(relation.cardinality1, relation.cardinality2);

    if (relationType === 'N-M') {
      // Create junction table
      const junctionTable = createJunctionTable(relation, entity1, entity2);
      tables.push(junctionTable);

      // Add relations to junction table
      relations.push({
        id: `${relation.id}_rel1`,
        fromTable: junctionTable.name,
        fromColumn: `${entity1.name.toLowerCase()}_id`,
        toTable: entity1.name,
        toColumn: 'id',
        type: '1-N',
      });

      relations.push({
        id: `${relation.id}_rel2`,
        fromTable: junctionTable.name,
        fromColumn: `${entity2.name.toLowerCase()}_id`,
        toTable: entity2.name,
        toColumn: 'id',
        type: '1-N',
      });
    } else if (relationType === '1-N') {
      // Add FK to the N side
      const nSideEntityId = isNSide(relation.cardinality2) ? relation.entity2Id : relation.entity1Id;
      const oneSideEntity = isNSide(relation.cardinality2) ? entity1 : entity2;
      
      const targetTable = tables.find((t) => t.id === nSideEntityId);
      if (targetTable) {
        targetTable.columns.push({
          id: `${relation.id}_fk`,
          name: `${oneSideEntity.name.toLowerCase()}_id`,
          type: 'INT',
          isPrimaryKey: false,
          isForeignKey: true,
          references: {
            table: oneSideEntity.name,
            column: 'id',
          },
          isNullable: relation.cardinality1.startsWith('0') || relation.cardinality2.startsWith('0'),
        });

        relations.push({
          id: relation.id,
          fromTable: targetTable.name,
          fromColumn: `${oneSideEntity.name.toLowerCase()}_id`,
          toTable: oneSideEntity.name,
          toColumn: 'id',
          type: '1-N',
        });
      }
    } else {
      // 1-1 relation: add FK to either side (prefer the optional side)
      const optionalSide = relation.cardinality1.startsWith('0') ? entity1 : entity2;
      const requiredSide = relation.cardinality1.startsWith('0') ? entity2 : entity1;
      
      const targetTable = tables.find((t) => t.id === optionalSide.id);
      if (targetTable) {
        targetTable.columns.push({
          id: `${relation.id}_fk`,
          name: `${requiredSide.name.toLowerCase()}_id`,
          type: 'INT',
          isPrimaryKey: false,
          isForeignKey: true,
          references: {
            table: requiredSide.name,
            column: 'id',
          },
          isNullable: true,
        });

        relations.push({
          id: relation.id,
          fromTable: targetTable.name,
          fromColumn: `${requiredSide.name.toLowerCase()}_id`,
          toTable: requiredSide.name,
          toColumn: 'id',
          type: '1-1',
        });
      }
    }
  });

  return { tables, relations };
}

function getColumnType(type: string, length?: number): string {
  if (type === 'VARCHAR' && length) {
    return `VARCHAR(${length})`;
  }
  if (type === 'DECIMAL') {
    return 'DECIMAL(10,2)';
  }
  return type;
}

function getRelationType(card1: string, card2: string): '1-1' | '1-N' | 'N-M' {
  const isN1 = card1.endsWith('n');
  const isN2 = card2.endsWith('n');
  
  if (isN1 && isN2) return 'N-M';
  if (isN1 || isN2) return '1-N';
  return '1-1';
}

function isNSide(cardinality: string): boolean {
  return cardinality.endsWith('n');
}

function createJunctionTable(relation: Relation, entity1: Entity, entity2: Entity): MLDTable {
  const midX = (entity1.position.x + entity2.position.x) / 2;
  const midY = (entity1.position.y + entity2.position.y) / 2 + 100;

  return {
    id: `junction_${relation.id}`,
    name: relation.name,
    columns: [
      {
        id: `${relation.id}_fk1`,
        name: `${entity1.name.toLowerCase()}_id`,
        type: 'INT',
        isPrimaryKey: false,
        isForeignKey: true,
        references: {
          table: entity1.name,
          column: 'id',
        },
        isNullable: false,
      },
      {
        id: `${relation.id}_fk2`,
        name: `${entity2.name.toLowerCase()}_id`,
        type: 'INT',
        isPrimaryKey: false,
        isForeignKey: true,
        references: {
          table: entity2.name,
          column: 'id',
        },
        isNullable: false,
      },
    ],
    isJunction: true,
    position: { x: midX, y: midY },
  };
}

