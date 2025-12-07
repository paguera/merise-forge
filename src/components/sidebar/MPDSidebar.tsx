import { useState } from 'react';
import { Plus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMeriseStore } from '@/hooks/useMeriseStore';

export function MPDSidebar() {
  const { mldModel, generatedSQL, sqlDialect } = useMeriseStore();
  const [selectedTable, setSelectedTable] = useState<string>('');

  if (!mldModel) return null;

  const currentTable = mldModel.tables.find(t => t.name === selectedTable);

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
                    className="flex items-center justify-between bg-card rounded p-2 border border-border"
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
                    <span className="text-xs text-muted-foreground font-mono">{col.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="outline" className="w-full text-pk border-pk hover:bg-pk/10">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un champ
          </Button>
        </div>

        {/* SQL Preview */}
        <div className="bg-secondary/50 rounded-lg p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Aperçu SQL ({sqlDialect})</h3>
          <pre className="bg-foreground text-background rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
            {generatedSQL || '-- Aucun SQL généré'}
          </pre>
        </div>
      </div>
    </div>
  );
}
