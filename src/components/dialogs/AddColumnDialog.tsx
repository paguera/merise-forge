import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AddColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (column: {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isNullable: boolean;
  }) => void;
}

const BASE_TYPES = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'BOOLEAN', 'FLOAT', 'DECIMAL'];
const TYPES_WITH_LENGTH = ['VARCHAR', 'DECIMAL'];

export function AddColumnDialog({ open, onOpenChange, onAdd }: AddColumnDialogProps) {
  const [name, setName] = useState('');
  const [baseType, setBaseType] = useState('VARCHAR');
  const [typeLength, setTypeLength] = useState('255');
  const [isPrimaryKey, setIsPrimaryKey] = useState(false);
  const [isNullable, setIsNullable] = useState(false);

  const needsLength = TYPES_WITH_LENGTH.includes(baseType);
  const fullType = needsLength && typeLength ? `${baseType}(${typeLength})` : baseType;

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd({
        name: name.trim(),
        type: fullType,
        isPrimaryKey,
        isNullable: isPrimaryKey ? false : isNullable,
      });
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setName('');
    setBaseType('VARCHAR');
    setTypeLength('255');
    setIsPrimaryKey(false);
    setIsNullable(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ajouter un champ</DialogTitle>
          <DialogDescription>
            Définissez les propriétés du nouveau champ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du champ</Label>
            <Input
              id="name"
              placeholder="ex: email, created_at"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
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

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pk"
                checked={isPrimaryKey}
                onCheckedChange={(checked) => {
                  setIsPrimaryKey(checked as boolean);
                  if (checked) setIsNullable(false);
                }}
              />
              <Label htmlFor="pk" className="text-sm">Clé primaire</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="nullable"
                checked={isNullable}
                disabled={isPrimaryKey}
                onCheckedChange={(checked) => setIsNullable(checked as boolean)}
              />
              <Label htmlFor="nullable" className="text-sm">Nullable</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
