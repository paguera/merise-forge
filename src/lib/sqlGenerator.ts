import { MLDModel, SQLDialect } from '@/types/merise';

export function generateSQL(model: MLDModel, dialect: SQLDialect): string {
  const statements: string[] = [];
  const foreignKeyStatements: string[] = [];

  // Generate CREATE TABLE statements
  model.tables.forEach((table) => {
    const columnDefs: string[] = [];
    const primaryKeys: string[] = [];
    const foreignKeys: string[] = [];

    table.columns.forEach((column) => {
      let def = `  \`${column.name}\` ${column.type}`;
      
      if (!column.isNullable) {
        def += ' NOT NULL';
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
        } as any);
      }
    });

    // Add primary key constraint
    if (primaryKeys.length > 0) {
      columnDefs.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    } else if (table.isJunction) {
      // For junction tables, make composite PK from FKs
      const fkColumns = table.columns.filter(c => c.isForeignKey).map(c => `\`${c.name}\``);
      if (fkColumns.length > 0) {
        columnDefs.push(`  PRIMARY KEY (${fkColumns.join(', ')})`);
      }
    }

    const createTable = `CREATE TABLE \`${table.name}\` (\n${columnDefs.join(',\n')}\n)${dialect === 'MariaDB' ? ' ENGINE=InnoDB' : ''};`;
    statements.push(createTable);

    // Generate foreign key statements
    foreignKeys.forEach((fk: any) => {
      const onDelete = fk.onDelete || 'CASCADE';
      const fkStatement = `ALTER TABLE \`${table.name}\`\n  ADD CONSTRAINT \`fk_${table.name}_${fk.column}\`\n  FOREIGN KEY (\`${fk.column}\`)\n  REFERENCES \`${fk.refTable}\`(\`${fk.refColumn}\`)\n  ON DELETE ${onDelete}\n  ON UPDATE CASCADE;`;
      foreignKeyStatements.push(fkStatement);
    });
  });

  // Combine all statements
  const header = `-- Generated SQL for ${dialect}\n-- Generated on ${new Date().toISOString()}\n\n`;
  const dropStatements = model.tables
    .map((t) => `DROP TABLE IF EXISTS \`${t.name}\`;`)
    .reverse()
    .join('\n');

  return `${header}${dropStatements}\n\n${statements.join('\n\n')}\n\n-- Foreign Keys\n${foreignKeyStatements.join('\n\n')}`;
}
