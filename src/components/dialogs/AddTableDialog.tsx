import { useState } from 'react';
import { Plus, Table } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (table: { name: string }) => void;
}

export function AddTableDialog({ open, onOpenChange, onAdd }: AddTableDialogProps) {
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (name.trim()) {
      onAdd({ name: name.trim() });
      setName('');
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table className="w-5 h-5" />
            Ajouter une table
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de la table</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Commande, Produit..."
              autoFocus
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Une clé primaire "id" sera automatiquement ajoutée à la table.
          </p>

          <Button 
            onClick={handleAdd} 
            disabled={!name.trim()} 
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer la table
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
