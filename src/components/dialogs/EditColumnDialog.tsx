import { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MLDColumn } from '@/types/merise';

interface EditColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: MLDColumn | null;
  onSave: (updates: Partial<MLDColumn>) => void;
  onDelete: () => void;
}

const dataTypes = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'BOOLEAN', 'DECIMAL', 'FLOAT'];

export function EditColumnDialog({
  open,
  onOpenChange,
  column,
  onSave,
  onDelete,
}: EditColumnDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('VARCHAR(255)');
  const [isPrimaryKey, setIsPrimaryKey] = useState(false);
  const [isNullable, setIsNullable] = useState(true);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setType(column.type);
      setIsPrimaryKey(column.isPrimaryKey);
      setIsNullable(column.isNullable);
    }
  }, [column]);

  if (!column) return null;

  const handleSave = () => {
    onSave({
      name: name.trim(),
      type,
      isPrimaryKey,
      isNullable,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Modifier la colonne
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la colonne"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dataTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="pk"
                checked={isPrimaryKey}
                onCheckedChange={(checked) => setIsPrimaryKey(!!checked)}
                disabled={column.isForeignKey}
              />
              <Label htmlFor="pk">Clé primaire</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="nullable"
                checked={isNullable}
                onCheckedChange={(checked) => setIsNullable(!!checked)}
              />
              <Label htmlFor="nullable">Nullable</Label>
            </div>
          </div>

          {column.isForeignKey && (
            <p className="text-xs text-muted-foreground bg-fk/10 p-2 rounded">
              Cette colonne est une clé étrangère et ne peut pas être convertie en clé primaire.
            </p>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={column.isPrimaryKey || column.isForeignKey}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()} className="flex-1">
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
