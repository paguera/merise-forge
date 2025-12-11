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
import { MLDColumn, OnDeleteAction } from '@/types/merise';

interface EditColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: MLDColumn | null;
  onSave: (updates: Partial<MLDColumn>) => void;
  onDeleteColumn: () => void;
}

const BASE_TYPES = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'BOOLEAN', 'DECIMAL', 'FLOAT'];
const TYPES_WITH_LENGTH = ['VARCHAR', 'DECIMAL'];
const ON_DELETE_ACTIONS: OnDeleteAction[] = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT'];

function parseType(type: string): { baseType: string; length: string } {
  const match = type.match(/^(\w+)(?:\(([^)]+)\))?$/);
  if (match) {
    return { baseType: match[1], length: match[2] || '' };
  }
  return { baseType: type, length: '' };
}

export function EditColumnDialog({
  open,
  onOpenChange,
  column,
  onSave,
  onDeleteColumn,
}: EditColumnDialogProps) {
  const [name, setName] = useState('');
  const [baseType, setBaseType] = useState('VARCHAR');
  const [typeLength, setTypeLength] = useState('');
  const [isPrimaryKey, setIsPrimaryKey] = useState(false);
  const [isNullable, setIsNullable] = useState(false);
  const [onDeleteAction, setOnDeleteAction] = useState<OnDeleteAction>('CASCADE');

  useEffect(() => {
    if (column) {
      setName(column.name);
      const parsed = parseType(column.type);
      setBaseType(parsed.baseType);
      setTypeLength(parsed.length);
      setIsPrimaryKey(column.isPrimaryKey);
      setIsNullable(column.isNullable);
      setOnDeleteAction(column.onDelete || 'CASCADE');
    }
  }, [column]);

  if (!column) return null;

  const needsLength = TYPES_WITH_LENGTH.includes(baseType);
  const fullType = needsLength && typeLength ? `${baseType}(${typeLength})` : baseType;

  const handleSave = () => {
    onSave({
      name: name.trim(),
      type: fullType,
      isPrimaryKey,
      isNullable,
      onDelete: column.isForeignKey ? onDeleteAction : undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDeleteColumn();
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
            <div className="flex gap-2">
              <Select value={baseType} onValueChange={setBaseType}>
                <SelectTrigger className={needsLength ? 'flex-1' : 'w-full'}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {needsLength && (
                <Input
                  className="w-24"
                  placeholder="255"
                  value={typeLength}
                  onChange={(e) => setTypeLength(e.target.value.replace(/[^0-9,]/g, ''))}
                />
              )}
            </div>
            {needsLength && (
              <p className="text-xs text-muted-foreground">
                Type complet: {fullType}
              </p>
            )}
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
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Action ON DELETE</Label>
                <Select value={onDeleteAction} onValueChange={(v) => setOnDeleteAction(v as OnDeleteAction)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ON_DELETE_ACTIONS.map((action) => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground bg-fk/10 p-2 rounded">
                Cette colonne est une clé étrangère et ne peut pas être convertie en clé primaire.
              </p>
            </div>
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
