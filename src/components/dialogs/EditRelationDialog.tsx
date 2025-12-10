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
import { Relation } from '@/types/merise';

interface EditRelationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relation: Relation | null;
  onSave: (updates: Partial<Relation>) => void;
  onDelete: () => void;
}

export function EditRelationDialog({
  open,
  onOpenChange,
  relation,
  onSave,
  onDelete,
}: EditRelationDialogProps) {
  const [name, setName] = useState('');
  const [cardinality1, setCardinality1] = useState<'0,1' | '1,1' | '0,n' | '1,n'>('1,1');
  const [cardinality2, setCardinality2] = useState<'0,1' | '1,1' | '0,n' | '1,n'>('0,n');

  useEffect(() => {
    if (relation) {
      setName(relation.name);
      setCardinality1(relation.cardinality1);
      setCardinality2(relation.cardinality2);
    }
  }, [relation]);

  if (!relation) return null;

  const handleSave = () => {
    onSave({
      name: name.trim(),
      cardinality1,
      cardinality2,
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
            Modifier la relation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Verbe (Action)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Possède, Achète, Contient"
            />
          </div>

          <div className="space-y-2">
            <Label>Cardinalité 1</Label>
            <Select value={cardinality1} onValueChange={(v) => setCardinality1(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0,1">0,1 - Zéro ou un(e)</SelectItem>
                <SelectItem value="1,1">1,1 - Exactement un(e)</SelectItem>
                <SelectItem value="0,n">0,n - Zéro ou plusieurs</SelectItem>
                <SelectItem value="1,n">1,n - Un ou plusieurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cardinalité 2</Label>
            <Select value={cardinality2} onValueChange={(v) => setCardinality2(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0,1">0,1 - Zéro ou un(e)</SelectItem>
                <SelectItem value="1,1">1,1 - Exactement un(e)</SelectItem>
                <SelectItem value="0,n">0,n - Zéro ou plusieurs</SelectItem>
                <SelectItem value="1,n">1,n - Un ou plusieurs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
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
