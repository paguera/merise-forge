import { useState } from 'react';
import { Layers, Plus, Trash2, Pencil, Save, FolderOpen, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProjectSchema } from '@/types/collaboration';
import { SchemaThumbnail } from '@/components/canvas/SchemaThumbnail';
import { MeriseModel } from '@/types/merise';

interface SchemasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schemas: ProjectSchema[];
  currentSchemaId: string | null;
  onCreateSchema: (name: string) => Promise<unknown>;
  onLoadSchema: (schemaId: string) => void;
  onUpdateSchema: () => Promise<boolean>;
  onDeleteSchema: (schemaId: string) => Promise<boolean>;
  onRenameSchema: (schemaId: string, newName: string) => Promise<boolean>;
}

export function SchemasDialog({
  open,
  onOpenChange,
  schemas,
  currentSchemaId,
  onCreateSchema,
  onLoadSchema,
  onUpdateSchema,
  onDeleteSchema,
  onRenameSchema,
}: SchemasDialogProps) {
  const [newSchemaName, setNewSchemaName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newSchemaName.trim()) return;
    setIsCreating(true);
    await onCreateSchema(newSchemaName.trim());
    setNewSchemaName('');
    setIsCreating(false);
  };

  const handleStartEdit = (schema: ProjectSchema) => {
    setEditingId(schema.id);
    setEditingName(schema.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    await onRenameSchema(editingId, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Schémas du projet
          </DialogTitle>
        </DialogHeader>

        {/* Create new schema */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Nom du nouveau schéma..."
            value={newSchemaName}
            onChange={(e) => setNewSchemaName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={!newSchemaName.trim() || isCreating}>
            <Plus className="w-4 h-4 mr-1" />
            Créer
          </Button>
        </div>

        <ScrollArea className="h-[300px] pr-4">
          {schemas.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun schéma sauvegardé</p>
              <p className="text-sm mt-1">Créez un schéma pour sauvegarder votre travail</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schemas.map((schema) => {
                const schemaModel = (schema.data?.model || { entities: [], relations: [] }) as MeriseModel;
                
                return (
                <div
                  key={schema.id}
                  className={`border rounded-lg p-3 transition-colors ${
                    currentSchemaId === schema.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-secondary/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <SchemaThumbnail 
                      model={schemaModel} 
                      width={100} 
                      height={70} 
                      className="shrink-0"
                    />

                    {editingId === schema.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{schema.name}</span>
                            {currentSchemaId === schema.id && (
                              <Badge variant="secondary" className="text-xs shrink-0">Actif</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Par {schema.created_by} • {format(new Date(schema.created_at), "dd MMM yyyy", { locale: fr })}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {schemaModel.entities?.length || 0} entités • {schemaModel.relations?.length || 0} relations
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 shrink-0">
                          {currentSchemaId === schema.id ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onUpdateSchema()}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Sauvegarder
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onLoadSchema(schema.id)}
                            >
                              <FolderOpen className="w-3 h-3 mr-1" />
                              Charger
                            </Button>
                          )}
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleStartEdit(schema)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onDeleteSchema(schema.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
