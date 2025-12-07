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

const COLUMN_TYPES = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'BOOLEAN', 'FLOAT', 'DECIMAL'];

export function AddColumnDialog({ open, onOpenChange, onAdd }: AddColumnDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('VARCHAR');
  const [isPrimaryKey, setIsPrimaryKey] = useState(false);
  const [isNullable, setIsNullable] = useState(true);

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd({
        name: name.trim(),
        type,
        isPrimaryKey,
        isNullable: isPrimaryKey ? false : isNullable,
      });
      resetForm();
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('VARCHAR');
    setIsPrimaryKey(false);
    setIsNullable(true);
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
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMN_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
