import { useState } from 'react';
import { X, Pencil, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { Entity, Relation } from '@/types/merise';
import { EditEntityDialog } from '@/components/dialogs/EditEntityDialog';
import { EditRelationDialog } from '@/components/dialogs/EditRelationDialog';
import { toast } from 'sonner';

type CreationStep = 'entity1' | 'verb' | 'entity2' | 'cardinalities';

const cardinalityDescriptions = {
  '0,1': 'Zéro ou un(e)',
  '1,1': 'Exactement un(e)',
  '0,n': 'Zéro ou plusieurs',
  '1,n': 'Un ou plusieurs',
};

const getCardinalityExplanation = (cardinality: string, isRequired: boolean) => {
  switch (cardinality) {
    case '0,1':
      return { text: 'ZÉRO ou UN (Optionnel)', color: 'text-blue-600' };
    case '1,1':
      return { text: 'EXACTEMENT UNE (Obligatoire)', color: 'text-green-600' };
    case '0,n':
      return { text: 'ZÉRO ou PLUSIEURS (Optionnel)', color: 'text-blue-600' };
    case '1,n':
      return { text: 'UN ou PLUSIEURS (Obligatoire)', color: 'text-green-600' };
    default:
      return { text: '', color: '' };
  }
};

export function MCDSidebar() {
  const { model, addEntity, addRelation, removeEntity, updateEntity, addAttribute, updateAttribute, removeAttribute, reorderAttributes, updateRelation, removeRelation, resetModel } = useMeriseStore();
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editingRelation, setEditingRelation] = useState<Relation | null>(null);
  const [step, setStep] = useState<CreationStep>('entity1');
  const [isNewEntity1, setIsNewEntity1] = useState(true);
  const [isNewEntity2, setIsNewEntity2] = useState(true);
  const [entity1Name, setEntity1Name] = useState('');
  const [entity2Name, setEntity2Name] = useState('');
  const [selectedEntity1Id, setSelectedEntity1Id] = useState('');
  const [selectedEntity2Id, setSelectedEntity2Id] = useState('');
  const [verbName, setVerbName] = useState('');
  const [cardinality1, setCardinality1] = useState<'0,1' | '1,1' | '0,n' | '1,n'>('1,1');
  const [cardinality2, setCardinality2] = useState<'0,1' | '1,1' | '0,n' | '1,n'>('0,n');

  // Get the current entity from the store (reactive to changes)
  const editingEntity = editingEntityId ? model.entities.find(e => e.id === editingEntityId) || null : null;

  // Get entity names for display
  const getEntity1Name = () => {
    if (isNewEntity1) return entity1Name;
    const entity = model.entities.find(e => e.id === selectedEntity1Id);
    return entity?.name || '';
  };

  const getEntity2Name = () => {
    if (isNewEntity2) return entity2Name;
    const entity = model.entities.find(e => e.id === selectedEntity2Id);
    return entity?.name || '';
  };

  const handleNext = () => {
    if (step === 'entity1') {
      if (isNewEntity1 && entity1Name.trim()) {
        const newEntity: Entity = {
          id: `entity_${Date.now()}`,
          name: entity1Name.trim(),
          attributes: [
            { id: `attr_${Date.now()}`, name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false }
          ],
          position: { x: 100, y: 100 },
        };
        addEntity(newEntity);
        setSelectedEntity1Id(newEntity.id);
      }
      setStep('verb');
    } else if (step === 'verb') {
      setStep('entity2');
    } else if (step === 'entity2') {
      if (isNewEntity2 && entity2Name.trim()) {
        const newEntity: Entity = {
          id: `entity_${Date.now()}_2`,
          name: entity2Name.trim(),
          attributes: [
            { id: `attr_${Date.now()}_2`, name: 'id', type: 'INT', isPrimaryKey: true, isNullable: false }
          ],
          position: { x: 400, y: 300 },
        };
        addEntity(newEntity);
        setSelectedEntity2Id(newEntity.id);
      }
      setStep('cardinalities');
    } else if (step === 'cardinalities') {
      const e1Id = isNewEntity1 ? selectedEntity1Id : selectedEntity1Id;
      const e2Id = isNewEntity2 ? selectedEntity2Id : selectedEntity2Id;
      
      const entity1 = model.entities.find(e => e.id === e1Id);
      const entity2 = model.entities.find(e => e.id === e2Id);
      
      if (entity1 && entity2 && verbName.trim()) {
        const newRelation: Relation = {
          id: `rel_${Date.now()}`,
          name: verbName.trim(),
          entity1Id: e1Id,
          entity2Id: e2Id,
          cardinality1,
          cardinality2,
          position: {
            x: (entity1.position.x + entity2.position.x) / 2,
            y: (entity1.position.y + entity2.position.y) / 2,
          },
        };
        addRelation(newRelation);
      }
      resetForm();
    }
  };

  const handleBack = () => {
    if (step === 'verb') setStep('entity1');
    else if (step === 'entity2') setStep('verb');
    else if (step === 'cardinalities') setStep('entity2');
  };

  const resetForm = () => {
    setStep('entity1');
    setIsNewEntity1(true);
    setIsNewEntity2(true);
    setEntity1Name('');
    setEntity2Name('');
    setSelectedEntity1Id('');
    setSelectedEntity2Id('');
    setVerbName('');
    setCardinality1('1,1');
    setCardinality2('0,n');
  };

  const canProceed = () => {
    switch (step) {
      case 'entity1':
        return isNewEntity1 ? entity1Name.trim() !== '' : selectedEntity1Id !== '';
      case 'verb':
        return verbName.trim() !== '';
      case 'entity2':
        return isNewEntity2 ? entity2Name.trim() !== '' : selectedEntity2Id !== '';
      case 'cardinalities':
        return true;
      default:
        return false;
    }
  };

  const entity1Display = getEntity1Name();
  const entity2Display = getEntity2Name();
  const card1Explanation = getCardinalityExplanation(cardinality1, cardinality1.startsWith('1'));
  const card2Explanation = getCardinalityExplanation(cardinality2, cardinality2.startsWith('1'));

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full overflow-hidden">
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        {/* Relation Creator */}
        <div className="bg-secondary/50 rounded-lg p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Créateur de Relations</h2>
          
          {/* Progress bar - 4 steps */}
          <div className="flex gap-1">
            <div className={`h-1 flex-1 rounded-full transition-colors ${['entity1', 'verb', 'entity2', 'cardinalities'].includes(step) ? 'bg-primary' : 'bg-border'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${['verb', 'entity2', 'cardinalities'].includes(step) ? 'bg-primary' : 'bg-border'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${['entity2', 'cardinalities'].includes(step) ? 'bg-primary' : 'bg-border'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'cardinalities' ? 'bg-primary' : 'bg-border'}`} />
          </div>

          {/* Step 1: Entité de départ */}
          {step === 'entity1' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-medium">1. Entité de départ</h3>
              
              <Button 
                variant={isNewEntity1 ? 'outline' : 'secondary'}
                className="w-full"
                onClick={() => setIsNewEntity1(true)}
              >
                Nouvelle
              </Button>

              {isNewEntity1 ? (
                <Input
                  placeholder="Nom de l'entité"
                  value={entity1Name}
                  onChange={(e) => setEntity1Name(e.target.value)}
                  className="border-primary"
                />
              ) : (
                <Select value={selectedEntity1Id} onValueChange={setSelectedEntity1Id}>
                  <SelectTrigger className="border-primary">
                    <SelectValue placeholder="Sélectionner une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    {model.entities.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {model.entities.length > 0 && (
                <Button 
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setIsNewEntity1(false)}
                >
                  Ou sélectionner une existante
                </Button>
              )}
            </div>
          )}

          {/* Step 2: L'Association (verbe) */}
          {step === 'verb' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-medium">2. L'Association</h3>
              <p className="text-sm text-muted-foreground">
                Action reliant <span className="text-primary font-medium">{entity1Display}</span> ?
              </p>
              
              <Input
                placeholder="Verbe (ex: Possède, Achète)"
                value={verbName}
                onChange={(e) => setVerbName(e.target.value)}
                className="border-primary"
              />
            </div>
          )}

          {/* Step 3: Entité d'arrivée */}
          {step === 'entity2' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-medium">3. Entité d'arrivée</h3>
              
              <Button 
                variant={isNewEntity2 ? 'outline' : 'secondary'}
                className="w-full"
                onClick={() => setIsNewEntity2(true)}
              >
                Nouvelle
              </Button>

              {isNewEntity2 ? (
                <Input
                  placeholder="Nom de l'entité"
                  value={entity2Name}
                  onChange={(e) => setEntity2Name(e.target.value)}
                  className="border-primary"
                />
              ) : (
                <Select value={selectedEntity2Id} onValueChange={setSelectedEntity2Id}>
                  <SelectTrigger className="border-primary">
                    <SelectValue placeholder="Sélectionner une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    {model.entities.filter(e => e.id !== selectedEntity1Id).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {model.entities.filter(e => e.id !== selectedEntity1Id).length > 0 && (
                <Button 
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setIsNewEntity2(false)}
                >
                  Ou sélectionner une existante
                </Button>
              )}
            </div>
          )}

          {/* Step 4: Cardinalités */}
          {step === 'cardinalities' && (
            <div className="space-y-5 animate-fade-in">
              <h3 className="font-medium">4. Cardinalités</h3>
              
              {/* Direction 1: Entity1 → Entity2 */}
              <div className="space-y-3 p-3 bg-background rounded-lg border border-border">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  Sens {entity1Display} → {entity2Display}
                </Badge>
                
                <p className="text-sm">
                  Un(e) <span className="font-semibold">{entity1Display}</span> peut{' '}
                  <span className="italic text-primary">{verbName.toUpperCase()}</span>...
                </p>
                
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
                
                <p className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground">→</span>
                  <span>
                    Un(e) {entity1Display} {verbName.toUpperCase()}{' '}
                    <span className={card1Explanation.color}>{card1Explanation.text}</span>{' '}
                    {entity2Display}.
                  </span>
                </p>
              </div>

              {/* Direction 2: Entity2 → Entity1 */}
              <div className="space-y-3 p-3 bg-background rounded-lg border border-border">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                  Sens {entity2Display} → {entity1Display}
                </Badge>
                
                <p className="text-sm">
                  Inversement, un(e) <span className="font-semibold text-primary">{entity2Display}</span> peut être{' '}
                  <span className="italic text-primary">{verbName.toUpperCase()}</span> par...
                </p>
                
                <Select value={cardinality2} onValueChange={(v) => setCardinality2(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0,1">0,1 - Zéro ou un(e)</SelectItem>
                    <SelectItem value="1,1">1,1 - Exactement un(e)</SelectItem>
                    <SelectItem value="0,n">0,n - Zéro ou plusieurs {entity1Display}</SelectItem>
                    <SelectItem value="1,n">1,n - Un ou plusieurs {entity1Display}</SelectItem>
                  </SelectContent>
                </Select>
                
                <p className="text-sm flex items-start gap-2">
                  <span className="text-muted-foreground">→</span>
                  <span>
                    Un(e) {entity2Display} est {verbName.toUpperCase()} par{' '}
                    <span className={card2Explanation.color}>{card2Explanation.text}</span>{' '}
                    {entity1Display}.
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {step !== 'entity1' && (
              <Button 
                variant="ghost"
                onClick={handleBack}
                className="flex-1"
              >
                Retour
              </Button>
            )}
            <Button 
              onClick={handleNext} 
              className={`${step === 'entity1' ? 'w-full' : 'flex-1'} ${step === 'cardinalities' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              disabled={!canProceed()}
            >
              {step === 'cardinalities' ? 'Générer le modèle' : 'Suivant'}
            </Button>
          </div>
        </div>

        {/* Entities & Relations List */}
        <div className="bg-secondary/50 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Données</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                resetModel();
                toast.success('Modèle réinitialisé');
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
          
          <div>
            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-2">
              Entités ({model.entities.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {model.entities.map((entity) => (
                <Badge key={entity.id} variant="secondary" className="px-3 py-1 gap-2">
                  {entity.name}
                  <button 
                    onClick={() => setEditingEntityId(entity.id)}
                    className="hover:text-primary transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => removeEntity(entity.id)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {model.entities.length === 0 && (
                <span className="text-sm text-muted-foreground italic">Vide</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-2">
              Relations ({model.relations.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {model.relations.map((relation) => {
                const e1 = model.entities.find(e => e.id === relation.entity1Id);
                const e2 = model.entities.find(e => e.id === relation.entity2Id);
                return (
                  <Badge key={relation.id} variant="outline" className="px-3 py-1 gap-2">
                    {e1?.name} — {relation.name} — {e2?.name}
                    <button 
                      onClick={() => setEditingRelation(relation)}
                      className="hover:text-primary transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => removeRelation(relation.id)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
              {model.relations.length === 0 && (
                <span className="text-sm text-muted-foreground italic">Vide</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditEntityDialog
        open={!!editingEntity}
        onOpenChange={(open) => !open && setEditingEntityId(null)}
        entity={editingEntity}
        onSave={(updates) => editingEntity && updateEntity(editingEntity.id, updates)}
        onAddAttribute={(attr) => editingEntity && addAttribute(editingEntity.id, attr)}
        onUpdateAttribute={(attrId, updates) => editingEntity && updateAttribute(editingEntity.id, attrId, updates)}
        onRemoveAttribute={(attrId) => editingEntity && removeAttribute(editingEntity.id, attrId)}
        onReorderAttributes={(from, to) => editingEntity && reorderAttributes(editingEntity.id, from, to)}
      />

      <EditRelationDialog
        open={!!editingRelation}
        onOpenChange={(open) => !open && setEditingRelation(null)}
        relation={editingRelation}
        onSave={(updates) => editingRelation && updateRelation(editingRelation.id, updates)}
        onDelete={() => editingRelation && removeRelation(editingRelation.id)}
      />
    </div>
  );
}
