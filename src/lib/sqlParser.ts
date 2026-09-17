import { Entity, Relation, Attribute } from '@/types/merise';
import { autoLayoutMCD } from '@/lib/autoLayout';

/**
 * Nettoie un nom d'identifiant SQL (supprime les guillemets, backticks et préfixes de schéma comme "public.")
 */
function cleanIdentifier(name: string): string {
  let clean = name.trim();
  // Supprime les préfixes de schéma (ex: public.table_name -> table_name)
  if (clean.includes('.')) {
    const parts = clean.split('.');
    clean = parts[parts.length - 1];
  }
  // Supprime les backticks, guillemets doubles et simples
  return clean.replace(/[`"']/g, '').trim();
}

/**
 * Normalise les types SQL vers les types Merise supportés
 */
function normalizeType(sqlType: string): { type: Attribute['type']; length?: number } {
  const upper = sqlType.toUpperCase().trim();

  // Extraction de longueur éventuelle (ex: VARCHAR(255) -> 255)
  const lengthMatch = upper.match(/\((\d+)\)/);
  const length = lengthMatch ? parseInt(lengthMatch[1], 10) : undefined;

  if (upper.includes('INT') || upper.startsWith('SERIAL') || upper.startsWith('BIGSERIAL')) {
    return { type: 'INT' };
  }
  if (upper.includes('VARCHAR') || upper.includes('CHARACTER VARYING') || upper.startsWith('CHAR')) {
    return { type: 'VARCHAR', length: length || 255 };
  }
  if (upper.includes('TEXT') || upper.includes('JSON') || upper.includes('CLOB') || upper.includes('BYTEA') || upper.includes('BLOB')) {
    return { type: 'TEXT' };
  }
  if (upper.includes('BOOL')) {
    return { type: 'BOOLEAN' };
  }
  if (upper.includes('DOUBLE') || upper.includes('REAL') || upper.includes('FLOAT')) {
    return { type: 'FLOAT' };
  }
  if (upper.includes('DECIMAL') || upper.includes('NUMERIC')) {
    return { type: 'DECIMAL' };
  }
  if (upper.startsWith('DATE') && !upper.includes('TIME')) {
    return { type: 'DATE' };
  }
  if (upper.includes('TIME') || upper.includes('DATETIME')) {
    return { type: 'DATETIME' };
  }
  if (upper.startsWith('ENUM')) {
    return { type: 'ENUM' };
  }

  return { type: 'VARCHAR', length: 255 };
}

export function parseSQLFile(sql: string): { entities: Entity[]; relations: Relation[] } {
  const entities: Entity[] = [];
  const relations: Relation[] = [];
  const foreignKeys: {
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
  }[] = [];
  const primaryKeysMap: Record<string, Set<string>> = {};

  // Normalisation : suppression des commentaires
  let normalizedSQL = sql
    .replace(/--[^\n]*/g, '') // Commentaires simples
    .replace(/\/\*[\s\S]*?\*\//g, '') // Commentaires multi-lignes
    .replace(/\\restrict\s+[^\n]*/gi, '') // Directives pg_dump
    .replace(/\\unrestrict\s+[^\n]*/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // 1. Détection des clés primaires externes (ALTER TABLE ... ADD CONSTRAINT ... PRIMARY KEY (col1, col2))
  const pkRegex =
    /ALTER\s+TABLE\s+(?:ONLY\s+)?([`"'\w.]+)\s+ADD\s+CONSTRAINT\s+[`"'\w.]+\s+PRIMARY\s+KEY\s*\(([^)]+)\)/gi;
  let pkMatch;
  while ((pkMatch = pkRegex.exec(normalizedSQL)) !== null) {
    const tableName = cleanIdentifier(pkMatch[1]);
    const cols = pkMatch[2].split(',').map((c) => cleanIdentifier(c));
    if (!primaryKeysMap[tableName.toLowerCase()]) {
      primaryKeysMap[tableName.toLowerCase()] = new Set();
    }
    cols.forEach((col) => primaryKeysMap[tableName.toLowerCase()].add(col.toLowerCase()));
  }

  // 2. Détection des clés étrangères externes (ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES ...)
  const alterFkRegex =
    /ALTER\s+TABLE\s+(?:ONLY\s+)?([`"'\w.]+)[^;]*?ADD\s+(?:CONSTRAINT\s+[`"'\w.]+\s+)?FOREIGN\s+KEY\s*\(([`"'\w,\s]+)\)\s*REFERENCES\s+([`"'\w.]+)\s*\(([`"'\w,\s]+)\)/gi;
  let fkMatch;
  while ((fkMatch = alterFkRegex.exec(normalizedSQL)) !== null) {
    const fromTable = cleanIdentifier(fkMatch[1]);
    const fromCol = cleanIdentifier(fkMatch[2].split(',')[0]);
    const toTable = cleanIdentifier(fkMatch[3]);
    const toCol = cleanIdentifier(fkMatch[4].split(',')[0]);

    foreignKeys.push({
      fromTable,
      fromColumn: fromCol,
      toTable,
      toColumn: toCol,
    });
  }

  // 3. Extraction de toutes les instructions CREATE TABLE
  // Supporte : CREATE TABLE table_name (, CREATE TABLE public.table_name (, CREATE TABLE "public"."table_name" (, CREATE TABLE IF NOT EXISTS ...
  const createTableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"'\w.]+)\s*\(/gi;
  let tableMatch;

  while ((tableMatch = createTableRegex.exec(normalizedSQL)) !== null) {
    const rawTableName = tableMatch[1];
    const tableName = cleanIdentifier(rawTableName);
    const startIdx = tableMatch.index + tableMatch[0].length;

    // Trouver la parenthèse fermante correspondante
    let depth = 1;
    let endIdx = startIdx;
    for (let i = startIdx; i < normalizedSQL.length && depth > 0; i++) {
      if (normalizedSQL[i] === '(') depth++;
      else if (normalizedSQL[i] === ')') depth--;
      endIdx = i;
    }

    const columnsSection = normalizedSQL.substring(startIdx, endIdx);

    // Découpage des colonnes et contraintes en respectant les parenthèses internes
    const lines: string[] = [];
    let currentLine = '';
    let parenDepth = 0;

    for (let i = 0; i < columnsSection.length; i++) {
      const char = columnsSection[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      else if (char === ',' && parenDepth === 0) {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = '';
        continue;
      }
      currentLine += char;
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    const attributes: Attribute[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const upper = trimmed.toUpperCase();

      // Détection des contraintes internes de PK : PRIMARY KEY (id) ou CONSTRAINT ... PRIMARY KEY (id)
      const inlinePkMatch = trimmed.match(
        /(?:CONSTRAINT\s+[`"'\w.]+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i
      );
      if (inlinePkMatch) {
        const cols = inlinePkMatch[1].split(',').map((c) => cleanIdentifier(c));
        if (!primaryKeysMap[tableName.toLowerCase()]) {
          primaryKeysMap[tableName.toLowerCase()] = new Set();
        }
        cols.forEach((col) => primaryKeysMap[tableName.toLowerCase()].add(col.toLowerCase()));
        return;
      }

      // Détection des contraintes internes de FK : FOREIGN KEY (col) REFERENCES table(id)
      const inlineFkMatch = trimmed.match(
        /(?:CONSTRAINT\s+[`"'\w.]+\s+)?FOREIGN\s+KEY\s*\(([`"'\w,\s]+)\)\s*REFERENCES\s+([`"'\w.]+)\s*\(([`"'\w,\s]+)\)/i
      );
      if (inlineFkMatch) {
        foreignKeys.push({
          fromTable: tableName,
          fromColumn: cleanIdentifier(inlineFkMatch[1].split(',')[0]),
          toTable: cleanIdentifier(inlineFkMatch[2]),
          toColumn: cleanIdentifier(inlineFkMatch[3].split(',')[0]),
        });
        return;
      }

      // Ignorer les autres contraintes DDL qui ne sont pas des colonnes
      if (
        upper.startsWith('CONSTRAINT') ||
        upper.startsWith('KEY ') ||
        upper.startsWith('UNIQUE') ||
        upper.startsWith('INDEX') ||
        upper.startsWith('CHECK') ||
        upper.startsWith('FULLTEXT') ||
        upper.startsWith('SPATIAL')
      ) {
        return;
      }

      // Extraction du nom de colonne et de son type
      // Exemples :
      // - id integer NOT NULL
      // - "position" integer NOT NULL
      // - reference character varying(64) NOT NULL
      // - createdat timestamp(0) without time zone NOT NULL
      // - budget double precision NOT NULL
      // - `phone` varchar(255) DEFAULT NULL
      const colRegex = /^([`"']?[a-zA-Z0-9_]+[`"']?)\s+([a-zA-Z0-9_]+(?:\s*\([^)]+\))?(?:\s+[a-zA-Z0-9_]+)*)/i;
      const colMatch = trimmed.match(colRegex);

      if (colMatch) {
        const colName = cleanIdentifier(colMatch[1]);
        const fullTypeDefinition = colMatch[2];
        const { type, length } = normalizeType(fullTypeDefinition);

        const isAuto =
          upper.includes('AUTO_INCREMENT') ||
          upper.includes('SERIAL') ||
          upper.includes('IDENTITY');

        const isPrimaryKey =
          isAuto ||
          upper.includes('PRIMARY KEY') ||
          colName.toLowerCase() === 'id' ||
          primaryKeysMap[tableName.toLowerCase()]?.has(colName.toLowerCase()) ||
          false;

        const isNullable = !upper.includes('NOT NULL') && !isPrimaryKey;
        const isUnique = upper.includes('UNIQUE');

        attributes.push({
          id: `attr_${Date.now()}_${entities.length}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
          name: colName,
          type,
          length,
          isPrimaryKey,
          isNullable,
          isUnique: isUnique || undefined,
        });
      }
    });

    if (attributes.length > 0) {
      // Vérifier à nouveau les primary keys définies via ALTER TABLE
      attributes.forEach((attr) => {
        if (primaryKeysMap[tableName.toLowerCase()]?.has(attr.name.toLowerCase())) {
          attr.isPrimaryKey = true;
          attr.isNullable = false;
        }
      });

      entities.push({
        id: `entity_${Date.now()}_${entities.length}_${Math.random().toString(36).substr(2, 5)}`,
        name: tableName,
        attributes,
        position: { x: 0, y: 0 },
      });
    }
  }

  // 4. Disposition spatiale intelligente (Grille responsive 4 colonnes)
  const COL_WIDTH = 340;
  const ROW_HEIGHT = 280;
  const COLS = Math.max(3, Math.ceil(Math.sqrt(entities.length)));

  entities.forEach((entity, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    entity.position = {
      x: 80 + col * COL_WIDTH,
      y: 80 + row * ROW_HEIGHT,
    };
  });

  // 5. Détection des tables de jonction (Relations N-M)
  const junctionTables = new Set<string>();
  entities.forEach((entity) => {
    const entityFKs = foreignKeys.filter(
      (fk) => fk.fromTable.toLowerCase() === entity.name.toLowerCase()
    );
    if (entityFKs.length >= 2) {
      const nonFKCols = entity.attributes.filter(
        (a) =>
          !entityFKs.some((fk) => fk.fromColumn.toLowerCase() === a.name.toLowerCase()) &&
          !a.isPrimaryKey
      );
      if (nonFKCols.length <= 1) {
        junctionTables.add(entity.name.toLowerCase());
      }
    }
  });

  // 6. Création des relations 1-N standard
  foreignKeys.forEach((fk, idx) => {
    const fromEntity = entities.find(
      (e) => e.name.toLowerCase() === fk.fromTable.toLowerCase()
    );
    const toEntity = entities.find(
      (e) => e.name.toLowerCase() === fk.toTable.toLowerCase()
    );

    if (fromEntity && toEntity && !junctionTables.has(fk.fromTable.toLowerCase())) {
      // Déterminer un nom de relation parlant (ex: customer_id -> a pour client)
      const verb = fk.fromColumn.replace(/_?id$/i, '') || 'lier';

      relations.push({
        id: `rel_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        name: verb,
        entity1Id: fromEntity.id,
        entity2Id: toEntity.id,
        cardinality1: '0,n',
        cardinality2: '1,1',
        position: {
          x: (fromEntity.position.x + toEntity.position.x) / 2,
          y: (fromEntity.position.y + toEntity.position.y) / 2,
        },
      });
    }
  });

  // 7. Création des relations N-M pour les tables de jonction
  junctionTables.forEach((junctionName) => {
    const junctionFKs = foreignKeys.filter(
      (fk) => fk.fromTable.toLowerCase() === junctionName
    );
    if (junctionFKs.length >= 2) {
      const entity1 = entities.find(
        (e) => e.name.toLowerCase() === junctionFKs[0].toTable.toLowerCase()
      );
      const entity2 = entities.find(
        (e) => e.name.toLowerCase() === junctionFKs[1].toTable.toLowerCase()
      );
      if (entity1 && entity2) {
        relations.push({
          id: `rel_junction_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: junctionName,
          entity1Id: entity1.id,
          entity2Id: entity2.id,
          cardinality1: '0,n',
          cardinality2: '0,n',
          position: {
            x: (entity1.position.x + entity2.position.x) / 2,
            y: (entity1.position.y + entity2.position.y) / 2,
          },
        });
      }
    }
  });

  // Ne conserver que les entités qui ne sont pas de simples tables de jonction
  const filteredEntities = entities.filter(
    (e) => !junctionTables.has(e.name.toLowerCase())
  );

  return autoLayoutMCD({
    entities: filteredEntities,
    relations,
  });
}
