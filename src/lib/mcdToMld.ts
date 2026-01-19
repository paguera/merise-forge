import { MeriseModel, MLDModel, MLDTable, MLDColumn, MLDRelation, Entity, Relation } from '@/types/merise';

/**
 * Transforme un MCD (Modèle Conceptuel de Données) en MLD (Modèle Logique de Données)
 * 
 * RÈGLE MERISE POUR LES FK:
 * - La FK va toujours du côté "N" (many/enfant) vers le côté "1" (one/parent)
 * 
 * INTERPRÉTATION DES CARDINALITÉS:
 * - cardinality1 = "Combien de Entity2 peut avoir UN Entity1" (cardinalité côté Entity2)
 * - cardinality2 = "Combien de Entity1 peut avoir UN Entity2" (cardinalité côté Entity1)
 * 
 * Donc pour une relation Entity1 —(1,1)— [Verbe] —(0,n)— Entity2:
 * - cardinality1 = "0,n" signifie: UN Entity1 peut avoir 0 à N Entity2
 * - cardinality2 = "1,1" signifie: UN Entity2 a exactement 1 Entity1
 * 
 * → Entity2 est le côté N (car cardinality1 finit par 'n')
 * → La FK va dans Entity2, pointant vers Entity1
 */
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
      // Create junction table for N-M relationships
      const junctionTable = createJunctionTable(relation, entity1, entity2);
      tables.push(junctionTable);

      // Add relations from junction table to both entities
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
      // RÈGLE MERISE: La FK va du côté N vers le côté 1
      // 
      // cardinality1 indique combien de Entity2 peut avoir UN Entity1
      // cardinality2 indique combien de Entity1 peut avoir UN Entity2
      //
      // Si cardinality1 finit par 'n' → Entity1 peut avoir plusieurs Entity2
      //   → Entity2 est le côté N, Entity1 est le côté 1
      //   → La FK va dans Entity2, pointant vers Entity1
      //
      // Si cardinality2 finit par 'n' → Entity2 peut avoir plusieurs Entity1
      //   → Entity1 est le côté N, Entity2 est le côté 1
      //   → La FK va dans Entity1, pointant vers Entity2
      
      const card1EndsWithN = isNSide(relation.cardinality1);
      
      // Si cardinality1 finit par 'n', Entity2 est le côté N (reçoit la FK)
      // Si cardinality2 finit par 'n', Entity1 est le côté N (reçoit la FK)
      const nSideEntity = card1EndsWithN ? entity2 : entity1;
      const oneSideEntity = card1EndsWithN ? entity1 : entity2;
      const nSideCardinality = card1EndsWithN ? relation.cardinality1 : relation.cardinality2;
      
      const targetTable = tables.find((t) => t.id === nSideEntity.id);
      if (targetTable) {
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
            // La FK est nullable si la cardinalité du côté N commence par 0
            isNullable: nSideCardinality.startsWith('0'),
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
      // 1-1 relation: add FK to the optional side (0,1) or to entity2 if both are mandatory
      const isEntity1Optional = relation.cardinality2.startsWith('0');
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
