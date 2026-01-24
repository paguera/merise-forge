import { useState, useEffect, useRef } from 'react';
import { Pencil, Plus, Trash2, GripVertical } from 'lucide-react';
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
  onReorderAttributes?: (fromIndex: number, toIndex: number) => void;
}

const BASE_TYPES: Attribute['type'][] = ['INT', 'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'BOOLEAN', 'DECIMAL', 'FLOAT', 'ENUM'];
const TYPES_WITH_LENGTH: Attribute['type'][] = ['VARCHAR', 'DECIMAL'];

export function EditEntityDialog({
  open,
  onOpenChange,
  entity,
  onSave,
  onAddAttribute,
  onUpdateAttribute,
  onRemoveAttribute,
  onReorderAttributes,
}: EditEntityDialogProps) {
  const [entityName, setEntityName] = useState('');
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState<Attribute['type']>('VARCHAR');
  const [newAttrLength, setNewAttrLength] = useState('255');
  const [newAttrPK, setNewAttrPK] = useState(false);
  const [newAttrNullable, setNewAttrNullable] = useState(false);
  const [newAttrUnique, setNewAttrUnique] = useState(false);
  const [newEnumValues, setNewEnumValues] = useState('');
  
  // Drag state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (entity) {
      setEntityName(entity.name);
    }
  }, [entity]);

  // Reset drag state when dialog closes
  useEffect(() => {
    if (!open) {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  }, [open]);

  if (!entity) return null;

  const needsLength = TYPES_WITH_LENGTH.includes(newAttrType);
  const isEnum = newAttrType === 'ENUM';

  const handleSaveName = () => {
    if (entityName.trim() && entityName !== entity.name) {
      onSave({ name: entityName.trim() });
    }
  };

  const handleAddAttribute = () => {
    if (newAttrName.trim()) {
      const length = needsLength && newAttrLength ? parseInt(newAttrLength) : undefined;
      const enumValues = isEnum && newEnumValues.trim() 
        ? newEnumValues.split(',').map(v => v.trim()).filter(v => v) 
        : undefined;
      onAddAttribute({
        id: `attr_${Date.now()}`,
        name: newAttrName.trim(),
        type: newAttrType,
        isPrimaryKey: newAttrPK,
        isNullable: newAttrNullable,
        isUnique: newAttrUnique,
        length,
        enumValues,
      });
      setNewAttrName('');
      setNewAttrType('VARCHAR');
      setNewAttrLength('255');
      setNewAttrPK(false);
      setNewAttrNullable(false);
      setNewAttrUnique(false);
      setNewEnumValues('');
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Add a slight delay for visual feedback
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '0.5';
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== toIndex && onReorderAttributes) {
      onReorderAttributes(draggedIndex, toIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
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
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {entity.attributes.map((attr, index) => (
                <div
                  key={attr.id}
                  ref={draggedIndex === index ? dragNodeRef : null}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`
                    flex flex-col gap-2 p-2 bg-secondary/50 rounded-lg
                    transition-all duration-200 ease-in-out
                    ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                    ${dragOverIndex === index ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                    ${dragOverIndex === index && draggedIndex !== null && draggedIndex < index ? 'translate-y-1' : ''}
                    ${dragOverIndex === index && draggedIndex !== null && draggedIndex > index ? '-translate-y-1' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {/* Drag Handle */}
                    <div 
                      className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded transition-colors"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                    </div>
                    
                    <Input
                      value={attr.name}
                      onChange={(e) => onUpdateAttribute(attr.id, { name: e.target.value })}
                      className="flex-1 h-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Select
                      value={attr.type}
                      onValueChange={(v) => onUpdateAttribute(attr.id, { type: v as Attribute['type'] })}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BASE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {TYPES_WITH_LENGTH.includes(attr.type) && (
                      <Input
                        value={attr.length || ''}
                        onChange={(e) => onUpdateAttribute(attr.id, { length: parseInt(e.target.value) || undefined })}
                        className="w-16 h-8 text-xs"
                        placeholder="255"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="flex items-center gap-1">
                      <Checkbox
                        checked={attr.isPrimaryKey}
                        onCheckedChange={(checked) => onUpdateAttribute(attr.id, { isPrimaryKey: !!checked })}
                      />
                      <span className="text-xs text-muted-foreground">PK</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox
                        checked={attr.isUnique}
                        onCheckedChange={(checked) => onUpdateAttribute(attr.id, { isUnique: !!checked })}
                      />
                      <span className="text-xs text-muted-foreground">UQ</span>
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
                  {attr.type === 'ENUM' && (
                    <Input
                      value={attr.enumValues?.join(', ') || ''}
                      onChange={(e) => onUpdateAttribute(attr.id, { 
                        enumValues: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
                      })}
                      className="h-8 text-xs ml-7"
                      placeholder="Valeurs ENUM (séparées par des virgules)"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
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
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {needsLength && (
                <Input
                  value={newAttrLength}
                  onChange={(e) => setNewAttrLength(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-16"
                  placeholder="255"
                />
              )}
            </div>
            {isEnum && (
              <Input
                value={newEnumValues}
                onChange={(e) => setNewEnumValues(e.target.value)}
                placeholder="Valeurs ENUM (séparées par des virgules, ex: actif, inactif, en_attente)"
              />
            )}
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
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="newUnique"
                    checked={newAttrUnique}
                    onCheckedChange={(checked) => setNewAttrUnique(!!checked)}
                  />
                  <Label htmlFor="newUnique" className="text-sm">Unique</Label>
                </div>
              </div>
              <Button onClick={handleAddAttribute} disabled={!newAttrName.trim() || (isEnum && !newEnumValues.trim())} size="sm">
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
