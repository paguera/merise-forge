import { MLDModel, SQLDialect } from '@/types/merise';

export function generateSQL(model: MLDModel, dialect: SQLDialect): string {
  switch (dialect) {
    case 'PostgreSQL':
      return generatePostgreSQL(model);
    case 'SQLite':
      return generateSQLite(model);
    case 'MariaDB':
    case 'MySQL':
    default:
      return generateMySQL(model, dialect);
  }
}

function mapTypeToPostgreSQL(type: string): string {
  const upper = type.toUpperCase().trim();
  if (upper.startsWith('INT') || upper.startsWith('INTEGER')) return 'INTEGER';
  if (upper.startsWith('TINYINT(1)') || upper === 'BOOLEAN' || upper === 'BOOL') return 'BOOLEAN';
  if (upper.startsWith('DATETIME')) return 'TIMESTAMPTZ';
  if (upper.startsWith('DATE')) return 'DATE';
  if (upper.startsWith('FLOAT')) return 'REAL';
  if (upper.startsWith('DOUBLE')) return 'DOUBLE PRECISION';
  if (upper.startsWith('DECIMAL') || upper.startsWith('NUMERIC')) return upper;
  if (upper.startsWith('VARCHAR')) return upper;
  if (upper.startsWith('TEXT') || upper.startsWith('ENUM')) return 'TEXT';
  return upper || 'VARCHAR(255)';
}

function mapTypeToSQLite(type: string): string {
  const upper = type.toUpperCase().trim();
  if (upper.startsWith('INT') || upper.startsWith('INTEGER') || upper.startsWith('BOOLEAN') || upper.startsWith('BOOL') || upper.startsWith('TINYINT')) {
    return 'INTEGER';
  }
  if (upper.startsWith('FLOAT') || upper.startsWith('DOUBLE') || upper.startsWith('DECIMAL') || upper.startsWith('NUMERIC') || upper.startsWith('REAL')) {
    return 'REAL';
  }
  if (upper.startsWith('BLOB')) {
    return 'BLOB';
  }
  return 'TEXT';
}

function generateMySQL(model: MLDModel, dialect: 'MariaDB' | 'MySQL'): string {
  const statements: string[] = [];
  const foreignKeyStatements: string[] = [];

  model.tables.forEach((table) => {
    const columnDefs: string[] = [];
    const primaryKeys: string[] = [];
    const foreignKeys: Array<{ column: string; refTable: string; refColumn: string; onDelete: string }> = [];

    table.columns.forEach((column) => {
      let def = `  \`${column.name}\` ${column.type}`;

      if (!column.isNullable) {
        def += ' NOT NULL';
      }

      if (column.isUnique && !column.isPrimaryKey) {
        def += ' UNIQUE';
      }

      if (column.isPrimaryKey && !table.isJunction) {
        def += ' AUTO_INCREMENT';
      }

      columnDefs.push(def);

      if (column.isPrimaryKey) {
        primaryKeys.push(`\`${column.name}\``);
      }

      if (column.isForeignKey && column.references) {
        foreignKeys.push({
          column: column.name,
          refTable: column.references.table,
          refColumn: column.references.column,
          onDelete: column.onDelete || 'CASCADE',
        });
      }
    });

    if (primaryKeys.length > 0) {
      columnDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    } else if (table.isJunction) {
      const fkColumns = table.columns.filter((c) => c.isForeignKey).map((c) => `\`${c.name}\``);
      if (fkColumns.length > 0) {
        columnDefs.push(`  PRIMARY KEY (${fkColumns.join(', ')})`);
      }
    }

    const createTable = `CREATE TABLE \`${table.name}\` (\n${columnDefs.join(',\n')}\n)${dialect === 'MariaDB' ? ' ENGINE=InnoDB' : ''};`;
    statements.push(createTable);

    foreignKeys.forEach((fk) => {
      const onDelete = fk.onDelete || 'CASCADE';
      const fkStatement = `ALTER TABLE \`${table.name}\`\n  ADD CONSTRAINT \`fk_${table.name}_${fk.column}\`\n  FOREIGN KEY (\`${fk.column}\`)\n  REFERENCES \`${fk.refTable}\`(\`${fk.refColumn}\`)\n  ON DELETE ${onDelete}\n  ON UPDATE CASCADE;`;
      foreignKeyStatements.push(fkStatement);
    });
  });

  const header = `-- Generated SQL for ${dialect} (MERISE FORGE)\n-- Date : ${new Date().toISOString()}\n\n`;
  const dropStatements = model.tables
    .map((t) => `DROP TABLE IF EXISTS \`${t.name}\`;`)
    .reverse()
    .join('\n');

  const fkSection = foreignKeyStatements.length > 0 ? `\n\n-- Clés étrangères (Contraintes d'intégrité)\n${foreignKeyStatements.join('\n\n')}` : '';

  return `${header}${dropStatements}\n\n${statements.join('\n\n')}${fkSection}`;
}

function generatePostgreSQL(model: MLDModel): string {
  const statements: string[] = [];
  const foreignKeyStatements: string[] = [];

  model.tables.forEach((table) => {
    const columnDefs: string[] = [];
    const primaryKeys: string[] = [];
    const foreignKeys: Array<{ column: string; refTable: string; refColumn: string; onDelete: string }> = [];

    table.columns.forEach((column) => {
      const isAutoPK = column.isPrimaryKey && !table.isJunction;
      const pgType = isAutoPK ? 'SERIAL' : mapTypeToPostgreSQL(column.type);
      let def = `  "${column.name}" ${pgType}`;

      if (!column.isNullable && !isAutoPK) {
        def += ' NOT NULL';
      }

      if (column.isUnique && !column.isPrimaryKey) {
        def += ' UNIQUE';
      }

      columnDefs.push(def);

      if (column.isPrimaryKey) {
        primaryKeys.push(`"${column.name}"`);
      }

      if (column.isForeignKey && column.references) {
        foreignKeys.push({
          column: column.name,
          refTable: column.references.table,
          refColumn: column.references.column,
          onDelete: column.onDelete || 'CASCADE',
        });
      }
    });

    if (primaryKeys.length > 0) {
      columnDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    } else if (table.isJunction) {
      const fkColumns = table.columns.filter((c) => c.isForeignKey).map((c) => `"${c.name}"`);
      if (fkColumns.length > 0) {
        columnDefs.push(`  PRIMARY KEY (${fkColumns.join(', ')})`);
      }
    }

    const createTable = `CREATE TABLE "${table.name}" (\n${columnDefs.join(',\n')}\n);`;
    statements.push(createTable);

    foreignKeys.forEach((fk) => {
      const onDelete = fk.onDelete || 'CASCADE';
      const fkStatement = `ALTER TABLE "${table.name}"\n  ADD CONSTRAINT "fk_${table.name}_${fk.column}"\n  FOREIGN KEY ("${fk.column}")\n  REFERENCES "${fk.refTable}"("${fk.refColumn}")\n  ON DELETE ${onDelete}\n  ON UPDATE CASCADE;`;
      foreignKeyStatements.push(fkStatement);
    });
  });

  const header = `-- Generated SQL for PostgreSQL (MERISE FORGE)\n-- Date : ${new Date().toISOString()}\n\n`;
  const dropStatements = model.tables
    .map((t) => `DROP TABLE IF EXISTS "${t.name}" CASCADE;`)
    .reverse()
    .join('\n');

  const fkSection = foreignKeyStatements.length > 0 ? `\n\n-- Clés étrangères (Contraintes d'intégrité)\n${foreignKeyStatements.join('\n\n')}` : '';

  return `${header}${dropStatements}\n\n${statements.join('\n\n')}${fkSection}`;
}

function generateSQLite(model: MLDModel): string {
  const statements: string[] = [];

  model.tables.forEach((table) => {
    const columnDefs: string[] = [];
    const primaryKeys: string[] = [];
    const inlineForeignKeys: string[] = [];

    const isSingleAutoPK = !table.isJunction && table.columns.filter((c) => c.isPrimaryKey).length === 1;

    table.columns.forEach((column) => {
      const sqliteType = mapTypeToSQLite(column.type);
      let def = `  "${column.name}" ${sqliteType}`;

      if (column.isPrimaryKey && isSingleAutoPK) {
        def += ' PRIMARY KEY AUTOINCREMENT';
      } else {
        if (!column.isNullable) {
          def += ' NOT NULL';
        }
        if (column.isUnique && !column.isPrimaryKey) {
          def += ' UNIQUE';
        }
      }

      columnDefs.push(def);

      if (column.isPrimaryKey && !isSingleAutoPK) {
        primaryKeys.push(`"${column.name}"`);
      }

      if (column.isForeignKey && column.references) {
        const onDelete = column.onDelete || 'CASCADE';
        inlineForeignKeys.push(
          `  FOREIGN KEY ("${column.name}") REFERENCES "${column.references.table}"("${column.references.column}") ON DELETE ${onDelete} ON UPDATE CASCADE`
        );
      }
    });

    if (primaryKeys.length > 0) {
      columnDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    } else if (table.isJunction && isSingleAutoPK === false) {
      const fkColumns = table.columns.filter((c) => c.isForeignKey).map((c) => `"${c.name}"`);
      if (fkColumns.length > 0 && primaryKeys.length === 0) {
        columnDefs.push(`  PRIMARY KEY (${fkColumns.join(', ')})`);
      }
    }

    if (inlineForeignKeys.length > 0) {
      columnDefs.push(...inlineForeignKeys);
    }

    const createTable = `CREATE TABLE "${table.name}" (\n${columnDefs.join(',\n')}\n);`;
    statements.push(createTable);
  });

  const header = `-- Generated SQL for SQLite (MERISE FORGE)\n-- Date : ${new Date().toISOString()}\nPRAGMA foreign_keys = ON;\n\n`;
  const dropStatements = model.tables
    .map((t) => `DROP TABLE IF EXISTS "${t.name}";`)
    .reverse()
    .join('\n');

  return `${header}${dropStatements}\n\n${statements.join('\n\n')}`;
}
