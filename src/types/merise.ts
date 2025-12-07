export interface Attribute {
  id: string;
  name: string;
  type: 'INT' | 'VARCHAR' | 'TEXT' | 'DATE' | 'DATETIME' | 'BOOLEAN' | 'FLOAT' | 'DECIMAL';
  isPrimaryKey: boolean;
  isNullable: boolean;
  length?: number;
}

export interface Entity {
  id: string;
  name: string;
  attributes: Attribute[];
  position: { x: number; y: number };
}

export interface Relation {
  id: string;
  name: string; // Le verbe de la relation
  entity1Id: string;
  entity2Id: string;
  cardinality1: '0,1' | '1,1' | '0,n' | '1,n';
  cardinality2: '0,1' | '1,1' | '0,n' | '1,n';
  position: { x: number; y: number };
}

export interface MeriseModel {
  entities: Entity[];
  relations: Relation[];
}

// MLD Types
export interface MLDTable {
  id: string;
  name: string;
  columns: MLDColumn[];
  isJunction: boolean;
  position: { x: number; y: number };
}

export interface MLDColumn {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
  isNullable: boolean;
}

export interface MLDRelation {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: '1-1' | '1-N' | 'N-M';
}

export interface MLDModel {
  tables: MLDTable[];
  relations: MLDRelation[];
}

export type ViewMode = 'MCD' | 'MLD' | 'MPD';
export type SQLDialect = 'MariaDB' | 'MySQL';
