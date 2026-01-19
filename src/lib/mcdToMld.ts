import { MeriseModel, MLDModel, MLDTable, MLDColumn, MLDRelation, Entity, Relation } from '@/types/merise';

export function transformMCDtoMLD(mcd: MeriseModel): MLDModel {
  const tables: MLDTable[] = [];
  const relations: MLDRelation[] = [];

  // Create tables from entities
  mcd.entities.forEach((entity) => {
    const columns: MLDColumn[] = entity.attributes.map((attr) => ({
      id: attr.id,
      name: attr.name,
      type: getColumnType(attr.type, attr.length, attr.enumValues),
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
      // RÈGLE MERISE : La FK va toujours du côté N (enfant/many) vers le côté 1 (parent/one)
      // Le côté N est celui dont la cardinalité se termine par 'n'
      const isEntity2NSide = isNSide(relation.cardinality2);
      
      // L'entité côté N reçoit la FK qui référence l'entité côté 1
      const nSideEntity = isEntity2NSide ? entity2 : entity1;
      const oneSideEntity = isEntity2NSide ? entity1 : entity2;
      
      const targetTable = tables.find((t) => t.id === nSideEntity.id);
      if (targetTable) {
        // Éviter les doublons de FK
        const fkName = `${oneSideEntity.name.toLowerCase()}_id`;
        const existingFK = targetTable.columns.find(c => c.name === fkName && c.isForeignKey);
        
        if (!existingFK) {
          targetTable.columns.push({
            id: `${relation.id}_fk`,
            name: fkName,
            type: 'INT',
            isPrimaryKey: false,
            isForeignKey: true,
            references: {
              table: oneSideEntity.name,
              column: 'id',
            },
            isNullable: isEntity2NSide 
              ? relation.cardinality2.startsWith('0') 
              : relation.cardinality1.startsWith('0'),
          });

          relations.push({
            id: relation.id,
            fromTable: nSideEntity.name,
            fromColumn: fkName,
            toTable: oneSideEntity.name,
            toColumn: 'id',
            type: '1-N',
          });
        }
      }
    } else {
      // 1-1 relation: add FK to the optional side (0,1) or first entity if both mandatory
      const isEntity1Optional = relation.cardinality1.startsWith('0');
      const targetEntity = isEntity1Optional ? entity1 : entity2;
      const referencedEntity = isEntity1Optional ? entity2 : entity1;
      
      const targetTable = tables.find((t) => t.id === targetEntity.id);
      if (targetTable) {
        const fkName = `${referencedEntity.name.toLowerCase()}_id`;
        const existingFK = targetTable.columns.find(c => c.name === fkName && c.isForeignKey);
        
        if (!existingFK) {
          targetTable.columns.push({
            id: `${relation.id}_fk`,
            name: fkName,
            type: 'INT',
            isPrimaryKey: false,
            isForeignKey: true,
            references: {
              table: referencedEntity.name,
              column: 'id',
            },
            isNullable: true,
          });

          relations.push({
            id: relation.id,
            fromTable: targetEntity.name,
            fromColumn: fkName,
            toTable: referencedEntity.name,
            toColumn: 'id',
            type: '1-1',
          });
        }
      }
    }
  });

  return { tables, relations };
}

function getColumnType(type: string, length?: number, enumValues?: string[]): string {
  if (type === 'VARCHAR' && length) {
    return `VARCHAR(${length})`;
  }
  if (type === 'DECIMAL') {
    return 'DECIMAL(10,2)';
  }
  if (type === 'ENUM' && enumValues && enumValues.length > 0) {
    return `ENUM('${enumValues.join("', '")}')`;
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
