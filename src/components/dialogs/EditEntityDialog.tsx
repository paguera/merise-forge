import { useState, useEffect } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Entity, Attribute } from '@/types/merise';

interface EditEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity | null;
  onSave: (updates: Partial<Entity>) => void;
  onAddAttribute: (attribute: Attribute) => void;
  onUpdateAttribute: (attributeId: string, updates: Partial<Attribute>) => void;
  onRemoveAttribute: (attributeId: string) => void;
}

const dataTypes: Attribute['type'][] = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'BOOLEAN', 'DECIMAL', 'FLOAT'];

export function EditEntityDialog({
  open,
  onOpenChange,
  entity,
  onSave,
  onAddAttribute,
  onUpdateAttribute,
  onRemoveAttribute,
}: EditEntityDialogProps) {
  const [entityName, setEntityName] = useState('');
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState<Attribute['type']>('VARCHAR');
  const [newAttrPK, setNewAttrPK] = useState(false);
  const [newAttrNullable, setNewAttrNullable] = useState(true);

  useEffect(() => {
    if (entity) {
      setEntityName(entity.name);
    }
  }, [entity]);

  if (!entity) return null;

  const handleSaveName = () => {
    if (entityName.trim() && entityName !== entity.name) {
      onSave({ name: entityName.trim() });
    }
  };

  const handleAddAttribute = () => {
    if (newAttrName.trim()) {
      onAddAttribute({
        id: `attr_${Date.now()}`,
        name: newAttrName.trim(),
        type: newAttrType,
        isPrimaryKey: newAttrPK,
        isNullable: newAttrNullable,
      });
      setNewAttrName('');
      setNewAttrType('VARCHAR');
      setNewAttrPK(false);
      setNewAttrNullable(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Modifier l'entité
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entity Name */}
          <div className="space-y-2">
            <Label>Nom de l'entité</Label>
            <div className="flex gap-2">
              <Input
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Nom de l'entité"
              />
              <Button onClick={handleSaveName} disabled={!entityName.trim()}>
                Sauvegarder
              </Button>
            </div>
          </div>

          {/* Attributes List */}
          <div className="space-y-3">
            <Label>Attributs ({entity.attributes.length})</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {entity.attributes.map((attr) => (
                <div
                  key={attr.id}
                  className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg"
                >
                  <Input
                    value={attr.name}
                    onChange={(e) => onUpdateAttribute(attr.id, { name: e.target.value })}
                    className="flex-1 h-8 text-sm"
                  />
                  <Select
                    value={attr.type}
                    onValueChange={(v) => onUpdateAttribute(attr.id, { type: v as Attribute['type'] })}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dataTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Checkbox
                      checked={attr.isPrimaryKey}
                      onCheckedChange={(checked) => onUpdateAttribute(attr.id, { isPrimaryKey: !!checked })}
                    />
                    <span className="text-xs text-muted-foreground">PK</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onRemoveAttribute(attr.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Attribute */}
          <div className="space-y-3 p-3 border border-dashed border-border rounded-lg">
            <Label className="text-sm text-muted-foreground">Ajouter un attribut</Label>
            <div className="flex gap-2">
              <Input
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                placeholder="Nom"
                className="flex-1"
              />
              <Select value={newAttrType} onValueChange={(v) => setNewAttrType(v as Attribute['type'])}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="newPK"
                    checked={newAttrPK}
                    onCheckedChange={(checked) => setNewAttrPK(!!checked)}
                  />
                  <Label htmlFor="newPK" className="text-sm">Clé primaire</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="newNullable"
                    checked={newAttrNullable}
                    onCheckedChange={(checked) => setNewAttrNullable(!!checked)}
                  />
                  <Label htmlFor="newNullable" className="text-sm">Nullable</Label>
                </div>
              </div>
              <Button onClick={handleAddAttribute} disabled={!newAttrName.trim()} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
