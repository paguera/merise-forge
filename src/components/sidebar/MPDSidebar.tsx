import { useState } from 'react';
import { Plus, Menu, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { AddColumnDialog } from '@/components/dialogs/AddColumnDialog';
import { EditColumnDialog } from '@/components/dialogs/EditColumnDialog';
import { MLDColumn } from '@/types/merise';

export function MPDSidebar() {
  const { mldModel, generatedSQL, sqlDialect, addColumnToTable, updateColumnInTable, removeColumnFromTable } = useMeriseStore();
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<MLDColumn | null>(null);

  if (!mldModel) return null;

  const currentTable = mldModel.tables.find(t => t.name === selectedTable);

  const handleAddColumn = (column: {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isNullable: boolean;
  }) => {
    if (currentTable) {
      addColumnToTable(currentTable.id, {
        id: `col_${Date.now()}`,
        name: column.name,
        type: column.type,
        isPrimaryKey: column.isPrimaryKey,
        isForeignKey: false,
        isNullable: column.isNullable,
      });
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full overflow-hidden">
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        <div className="bg-secondary/50 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Menu className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Éditeur SQL</h2>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Table cible :</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Sélectionner une table" />
              </SelectTrigger>
              <SelectContent>
                {mldModel.tables.map((table) => (
                  <SelectItem key={table.id} value={table.name}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentTable && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Colonnes ({currentTable.columns.length})
              </Label>
              <div className="space-y-2">
                {currentTable.columns.map((col) => (
                  <div 
                    key={col.id} 
                    className="flex items-center justify-between bg-card rounded p-2 border border-border group"
                  >
                    <div className="flex items-center gap-2">
                      {col.isPrimaryKey && (
                        <Badge className="bg-pk text-pk-foreground px-1.5 py-0.5 text-xs">PK</Badge>
                      )}
                      {col.isForeignKey && (
                        <Badge className="bg-fk text-fk-foreground px-1.5 py-0.5 text-xs">FK</Badge>
                      )}
                      <span className="text-sm">{col.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{col.type}</span>
                      <button
                        onClick={() => setEditingColumn(col)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full text-pk border-pk hover:bg-pk/10"
            onClick={() => setIsAddColumnOpen(true)}
            disabled={!currentTable}
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un champ
          </Button>
        </div>

        {/* SQL Preview */}
        <div className="bg-secondary/50 rounded-lg p-5 space-y-3 flex-1 flex flex-col">
          <h3 className="font-semibold text-foreground">Aperçu SQL ({sqlDialect})</h3>
          <textarea
            readOnly
            value={generatedSQL || '-- Aucun SQL généré'}
            className="w-full bg-foreground text-background rounded-lg p-4 text-xs font-mono resize-none border-0 focus:outline-none focus:ring-2 focus:ring-primary min-h-[400px] h-[50vh]"
          />
        </div>
      </div>

      <AddColumnDialog
        open={isAddColumnOpen}
        onOpenChange={setIsAddColumnOpen}
        onAdd={handleAddColumn}
      />

      <EditColumnDialog
        open={!!editingColumn}
        onOpenChange={(open) => !open && setEditingColumn(null)}
        column={editingColumn}
        onSave={(updates) => {
          if (editingColumn && currentTable) {
            updateColumnInTable(currentTable.id, editingColumn.id, updates);
          }
        }}
        onDeleteColumn={() => {
          if (editingColumn && currentTable) {
            removeColumnFromTable(currentTable.id, editingColumn.id);
          }
        }}
      />
    </div>
  );
}
