import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { Entity, Relation } from '@/types/merise';

type CreationStep = 'entity1' | 'entity2' | 'relation' | 'done';

export function MCDSidebar() {
  const { model, addEntity, addRelation, removeEntity } = useMeriseStore();
  const [step, setStep] = useState<CreationStep>('entity1');
  const [isNewEntity1, setIsNewEntity1] = useState(true);
  const [isNewEntity2, setIsNewEntity2] = useState(true);
  const [entity1Name, setEntity1Name] = useState('');
  const [entity2Name, setEntity2Name] = useState('');
  const [selectedEntity1Id, setSelectedEntity1Id] = useState('');
  const [selectedEntity2Id, setSelectedEntity2Id] = useState('');
  const [relationName, setRelationName] = useState('');
  const [cardinality1, setCardinality1] = useState<'0,1' | '1,1' | '0,n' | '1,n'>('1,n');
  const [cardinality2, setCardinality2] = useState<'0,1' | '1,1' | '0,n' | '1,n'>('1,n');

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
      setStep('relation');
    } else if (step === 'relation') {
      if (relationName.trim() && (selectedEntity1Id || !isNewEntity1) && (selectedEntity2Id || !isNewEntity2)) {
        const e1Id = isNewEntity1 ? selectedEntity1Id : selectedEntity1Id;
        const e2Id = isNewEntity2 ? selectedEntity2Id : selectedEntity2Id;
        
        const entity1 = model.entities.find(e => e.id === e1Id);
        const entity2 = model.entities.find(e => e.id === e2Id);
        
        if (entity1 && entity2) {
          const newRelation: Relation = {
            id: `rel_${Date.now()}`,
            name: relationName.trim(),
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
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setStep('entity1');
    setIsNewEntity1(true);
    setIsNewEntity2(true);
    setEntity1Name('');
    setEntity2Name('');
    setSelectedEntity1Id('');
    setSelectedEntity2Id('');
    setRelationName('');
    setCardinality1('1,n');
    setCardinality2('1,n');
  };

  const getStepProgress = () => {
    switch (step) {
      case 'entity1': return 33;
      case 'entity2': return 66;
      case 'relation': return 100;
      default: return 0;
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full overflow-hidden">
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        {/* Relation Creator */}
        <div className="bg-secondary/50 rounded-lg p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Créateur de Relations</h2>
          
          {/* Progress bar */}
          <div className="flex gap-1">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'entity1' || step === 'entity2' || step === 'relation' ? 'bg-primary' : 'bg-border'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'entity2' || step === 'relation' ? 'bg-primary' : 'bg-border'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'relation' ? 'bg-primary' : 'bg-border'}`} />
          </div>

          {step === 'entity1' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-medium">1. Entité de départ</h3>
              
              <div className="flex gap-2">
                <Button 
                  variant={!isNewEntity1 ? 'outline' : 'secondary'}
                  className="flex-1"
                  onClick={() => setIsNewEntity1(false)}
                >
                  Existante
                </Button>
                <Button 
                  variant={isNewEntity1 ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setIsNewEntity1(true)}
                >
                  Nouvelle
                </Button>
              </div>

              {isNewEntity1 ? (
                <Input
                  placeholder="Nom de l'entité (ex: User)"
                  value={entity1Name}
                  onChange={(e) => setEntity1Name(e.target.value)}
                />
              ) : (
                <Select value={selectedEntity1Id} onValueChange={setSelectedEntity1Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    {model.entities.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {step === 'entity2' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-medium">2. Entité d'arrivée</h3>
              
              <div className="flex gap-2">
                <Button 
                  variant={!isNewEntity2 ? 'outline' : 'secondary'}
                  className="flex-1"
                  onClick={() => setIsNewEntity2(false)}
                >
                  Existante
                </Button>
                <Button 
                  variant={isNewEntity2 ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setIsNewEntity2(true)}
                >
                  Nouvelle
                </Button>
              </div>

              {isNewEntity2 ? (
                <Input
                  placeholder="Nom de l'entité (ex: Article)"
                  value={entity2Name}
                  onChange={(e) => setEntity2Name(e.target.value)}
                />
              ) : (
                <Select value={selectedEntity2Id} onValueChange={setSelectedEntity2Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une entité" />
                  </SelectTrigger>
                  <SelectContent>
                    {model.entities.filter(e => e.id !== selectedEntity1Id).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {step === 'relation' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="font-medium">3. Relation (verbe)</h3>
              
              <Input
                placeholder="Verbe (ex: Achète, Possède)"
                value={relationName}
                onChange={(e) => setRelationName(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Cardinalité 1</Label>
                  <Select value={cardinality1} onValueChange={(v) => setCardinality1(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0,1">0,1</SelectItem>
                      <SelectItem value="1,1">1,1</SelectItem>
                      <SelectItem value="0,n">0,n</SelectItem>
                      <SelectItem value="1,n">1,n</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cardinalité 2</Label>
                  <Select value={cardinality2} onValueChange={(v) => setCardinality2(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0,1">0,1</SelectItem>
                      <SelectItem value="1,1">1,1</SelectItem>
                      <SelectItem value="0,n">0,n</SelectItem>
                      <SelectItem value="1,n">1,n</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleNext} 
            className="w-full"
            disabled={
              (step === 'entity1' && isNewEntity1 && !entity1Name.trim()) ||
              (step === 'entity1' && !isNewEntity1 && !selectedEntity1Id) ||
              (step === 'entity2' && isNewEntity2 && !entity2Name.trim()) ||
              (step === 'entity2' && !isNewEntity2 && !selectedEntity2Id) ||
              (step === 'relation' && !relationName.trim())
            }
          >
            {step === 'relation' ? 'Créer la relation' : 'Suivant'}
          </Button>
        </div>

        {/* Entities List */}
        <div className="bg-secondary/50 rounded-lg p-5 space-y-3">
          <h3 className="font-semibold text-foreground">Données</h3>
          <div>
            <p className="text-xs text-primary font-medium uppercase tracking-wide mb-2">
              Entités ({model.entities.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {model.entities.map((entity) => (
                <Badge key={entity.id} variant="secondary" className="px-3 py-1 gap-2">
                  {entity.name}
                  <button 
                    onClick={() => removeEntity(entity.id)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {model.entities.length === 0 && (
                <span className="text-sm text-muted-foreground">Aucune entité</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
