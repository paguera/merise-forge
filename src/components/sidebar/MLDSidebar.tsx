import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { ZoomControls } from '@/components/canvas/ZoomControls';

interface ZoomControlProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

interface MLDSidebarProps {
  zoomControls: ZoomControlProps;
}

export function MLDSidebar({ zoomControls }: MLDSidebarProps) {
  const { mldModel, model } = useMeriseStore();

  if (!mldModel) return null;

  const getRelationType = (card1: string, card2: string) => {
    const isN1 = card1.endsWith('n');
    const isN2 = card2.endsWith('n');
    if (isN1 && isN2) return 'N-M';
    if (isN1 || isN2) return '1-N';
    return '1-1';
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full overflow-hidden">
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        <div className="bg-secondary/50 rounded-lg p-5 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Mode Logique</h2>
          <p className="text-sm text-muted-foreground">
            Transformation automatique des relations.
          </p>
          
          <div className="bg-fk/10 border border-fk/30 rounded-lg p-3 flex gap-2">
            <Info className="w-4 h-4 text-fk flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Vous pouvez inverser le sens des Clés Étrangères (FK) pour les relations 1-1 ci-dessous.
            </p>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-lg p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Relations MLD</h3>
            <p className="text-sm text-muted-foreground">Configurez les Clés Étrangères</p>
          </div>

          <div className="space-y-3">
            {model.relations.map((relation) => {
              const entity1 = model.entities.find(e => e.id === relation.entity1Id);
              const entity2 = model.entities.find(e => e.id === relation.entity2Id);
              const relType = getRelationType(relation.cardinality1, relation.cardinality2);
              
              return (
                <div key={relation.id} className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm uppercase tracking-wide">{relation.name}</span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${relType === 'N-M' ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      {relType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>{entity1?.name}</span>
                    <span className="text-primary text-xs">
                      {relType === 'N-M' ? '↔ Jointure' : '→'}
                    </span>
                    <span>{entity2?.name}</span>
                  </div>
                </div>
              );
            })}
            
            {model.relations.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune relation définie
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border/50 p-2">
        <ZoomControls scale={zoomControls.scale} onZoomIn={zoomControls.onZoomIn} onZoomOut={zoomControls.onZoomOut} onReset={zoomControls.onReset} inline />
      </div>
    </div>
  );
}
