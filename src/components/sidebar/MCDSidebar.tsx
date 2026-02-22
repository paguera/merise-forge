import { useState } from 'react';
import { X, Pencil, RotateCcw, ArrowRight, Plus, Sparkles, Database, Link2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { Entity, Relation } from '@/types/merise';
import { EditEntityDialog } from '@/components/dialogs/EditEntityDialog';
import { EditRelationDialog } from '@/components/dialogs/EditRelationDialog';
import { ZoomControls } from '@/components/canvas/ZoomControls';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ZoomControlProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

interface MCDSidebarProps {
  zoomControls: ZoomControlProps;
}

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
      return { text: 'ZÉRO ou UN', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    case '1,1':
      return { text: 'EXACTEMENT UN', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case '0,n':
      return { text: 'ZÉRO ou PLUS', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    case '1,n':
      return { text: 'UN ou PLUS', color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    default:
      return { text: '', color: '', bg: '' };
  }
};

// Step indicator component
const StepIndicator = ({ step, currentStep }: { step: CreationStep; currentStep: CreationStep }) => {
  const steps: CreationStep[] = ['entity1', 'verb', 'entity2', 'cardinalities'];
  const currentIndex = steps.indexOf(currentStep);
  const stepIndex = steps.indexOf(step);
  const isActive = stepIndex === currentIndex;
  const isCompleted = stepIndex < currentIndex;

  return (
    <motion.div
      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
        isActive 
          ? 'bg-primary scale-125 ring-4 ring-primary/20' 
          : isCompleted 
            ? 'bg-primary' 
            : 'bg-muted-foreground/30'
      }`}
      animate={{ scale: isActive ? 1.25 : 1 }}
    />
  );
};

export function MCDSidebar({ zoomControls }: MCDSidebarProps) {
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

  const editingEntity = editingEntityId ? model.entities.find(e => e.id === editingEntityId) || null : null;

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
        toast.success('Relation créée avec succès !');
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

  const stepLabels = {
    entity1: 'Entité Source',
    verb: 'Association',
    entity2: 'Entité Cible',
    cardinalities: 'Cardinalités'
  };

  return (
    <div className="w-80 bg-card/50 backdrop-blur-sm border-r border-border/50 flex flex-col h-full overflow-hidden">
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        
        {/* Modern Relation Creator */}
        <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background via-background to-primary/5">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Créateur de Relations</h2>
              <p className="text-xs text-muted-foreground">{stepLabels[step]}</p>
            </div>
          </div>

          {/* Step Progress */}
          <div className="px-4 py-3 flex items-center justify-center gap-3">
            {(['entity1', 'verb', 'entity2', 'cardinalities'] as CreationStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <StepIndicator step={s} currentStep={step} />
                {i < 3 && <ChevronRight className="w-3 h-3 text-muted-foreground/50" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="px-4 pb-4">
            <AnimatePresence mode="wait">
              {/* Step 1: Source Entity */}
              {step === 'entity1' && (
                <motion.div
                  key="entity1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <div className="flex gap-2">
                    <Button 
                      variant={isNewEntity1 ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setIsNewEntity1(true)}
                    >
                      <Plus className="w-3 h-3" />
                      Nouvelle
                    </Button>
                    {model.entities.length > 0 && (
                      <Button 
                        variant={!isNewEntity1 ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => setIsNewEntity1(false)}
                      >
                        <Database className="w-3 h-3" />
                        Existante
                      </Button>
                    )}
                  </div>

                  {isNewEntity1 ? (
                    <Input
                      placeholder="Nom de l'entité..."
                      value={entity1Name}
                      onChange={(e) => setEntity1Name(e.target.value)}
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  ) : (
                    <Select value={selectedEntity1Id} onValueChange={setSelectedEntity1Id}>
                      <SelectTrigger className="bg-background/50 border-primary/30">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {model.entities.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </motion.div>
              )}

              {/* Step 2: Verb */}
              {step === 'verb' && (
                <motion.div
                  key="verb"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                      {entity1Display}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">?</span>
                  </div>

                  <Input
                    placeholder="Verbe (ex: Possède, Achète...)"
                    value={verbName}
                    onChange={(e) => setVerbName(e.target.value)}
                    className="bg-background/50 border-primary/30 focus:border-primary"
                  />
                </motion.div>
              )}

              {/* Step 3: Target Entity */}
              {step === 'entity2' && (
                <motion.div
                  key="entity2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                      {entity1Display}
                    </Badge>
                    <Badge variant="outline" className="border-accent text-accent">
                      {verbName}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">?</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant={isNewEntity2 ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setIsNewEntity2(true)}
                    >
                      <Plus className="w-3 h-3" />
                      Nouvelle
                    </Button>
                    {model.entities.filter(e => e.id !== selectedEntity1Id).length > 0 && (
                      <Button 
                        variant={!isNewEntity2 ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => setIsNewEntity2(false)}
                      >
                        <Database className="w-3 h-3" />
                        Existante
                      </Button>
                    )}
                  </div>

                  {isNewEntity2 ? (
                    <Input
                      placeholder="Nom de l'entité..."
                      value={entity2Name}
                      onChange={(e) => setEntity2Name(e.target.value)}
                      className="bg-background/50 border-primary/30 focus:border-primary"
                    />
                  ) : (
                    <Select value={selectedEntity2Id} onValueChange={setSelectedEntity2Id}>
                      <SelectTrigger className="bg-background/50 border-primary/30">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {model.entities.filter(e => e.id !== selectedEntity1Id).map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </motion.div>
              )}

              {/* Step 4: Cardinalities */}
              {step === 'cardinalities' && (
                <motion.div
                  key="cardinalities"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  {/* Preview */}
                  <div className="flex items-center justify-center gap-2 text-xs py-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                      {entity1Display}
                    </Badge>
                    <Link2 className="w-3 h-3 text-accent" />
                    <Badge variant="outline" className="border-accent text-accent">
                      {verbName}
                    </Badge>
                    <Link2 className="w-3 h-3 text-accent" />
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                      {entity2Display}
                    </Badge>
                  </div>

                  {/* Cardinality 1 */}
                  <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Un(e) <span className="text-primary font-medium">{entity1Display}</span> peut {verbName.toLowerCase()}...
                    </p>
                    <Select value={cardinality1} onValueChange={(v) => setCardinality1(v as any)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0,1">0,1 - Zéro ou un(e)</SelectItem>
                        <SelectItem value="1,1">1,1 - Exactement un(e)</SelectItem>
                        <SelectItem value="0,n">0,n - Zéro ou plusieurs</SelectItem>
                        <SelectItem value="1,n">1,n - Un ou plusieurs</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className={`${card1Explanation.bg} ${card1Explanation.color} border-0 text-xs`}>
                      {card1Explanation.text}
                    </Badge>
                  </div>

                  {/* Cardinality 2 */}
                  <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Un(e) <span className="text-primary font-medium">{entity2Display}</span> peut être {verbName.toLowerCase()} par...
                    </p>
                    <Select value={cardinality2} onValueChange={(v) => setCardinality2(v as any)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0,1">0,1 - Zéro ou un(e)</SelectItem>
                        <SelectItem value="1,1">1,1 - Exactement un(e)</SelectItem>
                        <SelectItem value="0,n">0,n - Zéro ou plusieurs</SelectItem>
                        <SelectItem value="1,n">1,n - Un ou plusieurs</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className={`${card2Explanation.bg} ${card2Explanation.color} border-0 text-xs`}>
                      {card2Explanation.text}
                    </Badge>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-2 mt-4">
              {step !== 'entity1' && (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Retour
                </Button>
              )}
              <Button 
                onClick={handleNext} 
                size="sm"
                className={`${step === 'entity1' ? 'w-full' : 'flex-1'} ${
                  step === 'cardinalities' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white' 
                    : ''
                }`}
                disabled={!canProceed()}
              >
                {step === 'cardinalities' ? (
                  <>
                    <Sparkles className="w-3 h-3 mr-2" />
                    Générer
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Data Overview */}
        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-background via-background to-accent/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Database className="w-4 h-4 text-accent" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Données</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
              onClick={() => {
                resetModel();
                toast.success('Modèle réinitialisé');
              }}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Entities */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Entités ({model.entities.length})
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {model.entities.map((entity) => (
                  <motion.div
                    key={entity.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group"
                  >
                    <Badge 
                      variant="secondary" 
                      className="px-2 py-1 gap-1.5 bg-primary/5 hover:bg-primary/10 transition-colors cursor-default"
                    >
                      <span className="text-xs">{entity.name}</span>
                      <button 
                        onClick={() => setEditingEntityId(entity.id)}
                        className="opacity-50 group-hover:opacity-100 hover:text-primary transition-all"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                      <button 
                        onClick={() => removeEntity(entity.id)}
                        className="opacity-50 group-hover:opacity-100 hover:text-destructive transition-all"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </Badge>
                  </motion.div>
                ))}
                {model.entities.length === 0 && (
                  <span className="text-xs text-muted-foreground/50 italic">Aucune entité</span>
                )}
              </div>
            </div>

            {/* Relations */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Relations ({model.relations.length})
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {model.relations.map((relation) => {
                  const e1 = model.entities.find(e => e.id === relation.entity1Id);
                  const e2 = model.entities.find(e => e.id === relation.entity2Id);
                  return (
                    <motion.div
                      key={relation.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group"
                    >
                      <Badge 
                        variant="outline" 
                        className="px-2 py-1 gap-1.5 border-accent/30 hover:border-accent/50 transition-colors cursor-default"
                      >
                        <span className="text-xs text-muted-foreground">{e1?.name}</span>
                        <span className="text-xs text-accent font-medium">{relation.name}</span>
                        <span className="text-xs text-muted-foreground">{e2?.name}</span>
                        <button 
                          onClick={() => setEditingRelation(relation)}
                          className="opacity-50 group-hover:opacity-100 hover:text-primary transition-all"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <button 
                          onClick={() => removeRelation(relation.id)}
                          className="opacity-50 group-hover:opacity-100 hover:text-destructive transition-all"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </Badge>
                    </motion.div>
                  );
                })}
                {model.relations.length === 0 && (
                  <span className="text-xs text-muted-foreground/50 italic">Aucune relation</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialogs */}
      <EditEntityDialog
        open={!!editingEntity}
        onOpenChange={(open) => !open && setEditingEntityId(null)}
        entity={editingEntity}
        onSave={(updates) => {
          if (editingEntity) {
            updateEntity(editingEntity.id, updates);
          }
        }}
        onAddAttribute={(attr) => {
          if (editingEntity) {
            addAttribute(editingEntity.id, attr);
          }
        }}
        onUpdateAttribute={(attrId, updates) => {
          if (editingEntity) {
            updateAttribute(editingEntity.id, attrId, updates);
          }
        }}
        onRemoveAttribute={(attrId) => {
          if (editingEntity) {
            removeAttribute(editingEntity.id, attrId);
          }
        }}
        onReorderAttributes={(from, to) => {
          if (editingEntity) {
            reorderAttributes(editingEntity.id, from, to);
          }
        }}
      />

      <EditRelationDialog
        open={!!editingRelation}
        onOpenChange={(open) => !open && setEditingRelation(null)}
        relation={editingRelation}
        onSave={(updates) => {
          if (editingRelation) {
            updateRelation(editingRelation.id, updates);
          }
        }}
        onDelete={() => {
          if (editingRelation) {
            removeRelation(editingRelation.id);
            setEditingRelation(null);
          }
        }}
      />
      <div className="border-t border-border/50 p-2">
        <ZoomControls scale={zoomControls.scale} onZoomIn={zoomControls.onZoomIn} onZoomOut={zoomControls.onZoomOut} onReset={zoomControls.onReset} inline />
      </div>
    </div>
  );
}
