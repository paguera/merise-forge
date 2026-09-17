import { MeriseModel, MLDModel, Entity, Relation, MLDTable } from '@/types/merise';

/**
 * Calcule la hauteur estimée d'une entité MCD
 */
function getEntityHeight(entity: Entity): number {
  const attrCount = entity.attributes?.length || 0;
  if (attrCount === 0) return 60;
  return 42 + attrCount * 28 + 12;
}

/**
 * Calcule la hauteur estimée d'une table MLD
 */
function getTableHeight(table: MLDTable): number {
  const colCount = table.columns?.length || 0;
  return 42 + colCount * 32 + 12;
}

/**
 * Réorganise automatiquement et proprement la disposition visuelle d'un MCD
 */
export function autoLayoutMCD(model: MeriseModel): MeriseModel {
  if (model.entities.length === 0) return model;

  const entities = [...model.entities];
  const relations = [...model.relations];

  // Construction du graphe d'adjacence
  const adj = new Map<string, Set<string>>();
  const entityDegree = new Map<string, number>();

  entities.forEach((e) => {
    adj.set(e.id, new Set());
    entityDegree.set(e.id, 0);
  });

  relations.forEach((r) => {
    if (adj.has(r.entity1Id) && adj.has(r.entity2Id)) {
      adj.get(r.entity1Id)!.add(r.entity2Id);
      adj.get(r.entity2Id)!.add(r.entity1Id);
      entityDegree.set(r.entity1Id, (entityDegree.get(r.entity1Id) || 0) + 1);
      entityDegree.set(r.entity2Id, (entityDegree.get(r.entity2Id) || 0) + 1);
    }
  });

  // Détection des composantes connexes (clusters)
  const visited = new Set<string>();
  const clusters: string[][] = [];

  entities.forEach((entity) => {
    if (!visited.has(entity.id)) {
      const cluster: string[] = [];
      const queue = [entity.id];
      visited.add(entity.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        cluster.push(curr);

        const neighbors = adj.get(curr) || new Set();
        neighbors.forEach((nbr) => {
          if (!visited.has(nbr)) {
            visited.add(nbr);
            queue.push(nbr);
          }
        });
      }

      // Trier les entités du cluster par degré décroissant (les hubs d'abord)
      cluster.sort((a, b) => (entityDegree.get(b) || 0) - (entityDegree.get(a) || 0));
      clusters.push(cluster);
    }
  });

  // Trier les clusters par taille (les plus gros en premier)
  clusters.sort((a, b) => b.length - a.length);

  const updatedEntities: Entity[] = [];
  const entityPositions = new Map<string, { x: number; y: number }>();

  // Calcul du nombre de colonnes global
  const totalCount = entities.length;
  const numCols = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(totalCount * 1.5))));
  const colStride = 420; // 240px entité + 180px espace pour relations & connecteurs
  const colY = new Array(numCols).fill(60);

  clusters.forEach((cluster) => {
    cluster.forEach((entityId) => {
      const entity = entities.find((e) => e.id === entityId);
      if (!entity) return;

      // Choisir la colonne avec la hauteur minimale actuelle
      let bestCol = 0;
      let minY = colY[0];
      for (let c = 1; c < numCols; c++) {
        if (colY[c] < minY) {
          minY = colY[c];
          bestCol = c;
        }
      }

      const x = 60 + bestCol * colStride;
      const y = colY[bestCol];
      const h = getEntityHeight(entity);

      entityPositions.set(entity.id, { x, y });
      updatedEntities.push({
        ...entity,
        position: { x, y },
      });

      // Avancement en Y pour cette colonne avec marge
      colY[bestCol] += h + 60;
    });
  });

  // Positionnement propre des relations au barycentre / milieu
  // Regroupement des relations par paire d'entités pour gérer les relations multiples
  const pairCounts = new Map<string, number>();
  const pairIndices = new Map<string, number>();

  relations.forEach((r) => {
    const key = [r.entity1Id, r.entity2Id].sort().join('___');
    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
  });

  const updatedRelations: Relation[] = relations.map((rel) => {
    const p1 = entityPositions.get(rel.entity1Id);
    const p2 = entityPositions.get(rel.entity2Id);

    if (!p1 && !p2) {
      return rel;
    }

    if (p1 && (!p2 || rel.entity1Id === rel.entity2Id)) {
      // Relation réflexive ou orpheline
      return {
        ...rel,
        position: {
          x: p1.x + 260,
          y: p1.y + 20,
        },
      };
    }

    if (p1 && p2) {
      const key = [rel.entity1Id, rel.entity2Id].sort().join('___');
      const total = pairCounts.get(key) || 1;
      const currIdx = pairIndices.get(key) || 0;
      pairIndices.set(key, currIdx + 1);

      // Calcul du centre
      const midX = (p1.x + p2.x) / 2 + 70;
      const midY = (p1.y + p2.y) / 2 + 10;

      // Décalage pour relations multiples entre les 2 mêmes entités
      const offset = (currIdx - (total - 1) / 2) * 50;

      return {
        ...rel,
        position: {
          x: Math.round(midX + (p1.x === p2.x ? offset : 0)),
          y: Math.round(midY + (p1.y === p2.y ? offset : 0)),
        },
      };
    }

    return rel;
  });

  return {
    entities: updatedEntities,
    relations: updatedRelations,
  };
}

/**
 * Réorganise automatiquement et proprement la disposition visuelle d'un MLD
 */
export function autoLayoutMLD(mldModel: MLDModel): MLDModel {
  if (!mldModel || mldModel.tables.length === 0) return mldModel;

  const tables = [...mldModel.tables];
  const relations = [...mldModel.relations];

  // Calcul du degré d'entrée / sortie pour tri topologique (Parents -> Enfants)
  const incomingFKs = new Map<string, number>();
  const outgoingFKs = new Map<string, number>();

  tables.forEach((t) => {
    incomingFKs.set(t.name, 0);
    outgoingFKs.set(t.name, 0);
  });

  relations.forEach((r) => {
    outgoingFKs.set(r.fromTable, (outgoingFKs.get(r.fromTable) || 0) + 1);
    incomingFKs.set(r.toTable, (incomingFKs.get(r.toTable) || 0) + 1);
  });

  // Assignation par couches (Layers)
  // Layer 0: Tables de référence / parents (sans FKs sortantes)
  // Layer 1: Tables intermédiaires
  // Layer 2: Tables de détails ou tables de liaison (Junction)
  const layerMap = new Map<string, number>();

  tables.forEach((t) => {
    const out = outgoingFKs.get(t.name) || 0;
    const isJunction = t.isJunction;

    if (isJunction) {
      layerMap.set(t.name, 3);
    } else if (out === 0) {
      layerMap.set(t.name, 0);
    } else if (out === 1) {
      layerMap.set(t.name, 1);
    } else if (out === 2) {
      layerMap.set(t.name, 2);
    } else {
      layerMap.set(t.name, 3);
    }
  });

  const maxLayer = Math.max(...Array.from(layerMap.values()), 0);
  const layerCols: MLDTable[][] = Array.from({ length: maxLayer + 1 }, () => []);

  tables.forEach((t) => {
    const layer = layerMap.get(t.name) || 0;
    layerCols[layer].push(t);
  });

  // Équilibrage : si une colonne est trop remplie et une autre vide, on lisse
  const colStride = 380; // 220px table + 160px espace
  const layerY = new Array(layerCols.length).fill(60);
  const updatedTables: MLDTable[] = [];

  layerCols.forEach((colTables, colIdx) => {
    colTables.forEach((table) => {
      const x = 60 + colIdx * colStride;
      const y = layerY[colIdx];
      const h = getTableHeight(table);

      updatedTables.push({
        ...table,
        position: { x, y },
      });

      layerY[colIdx] += h + 45;
    });
  });

  return {
    ...mldModel,
    tables: updatedTables,
  };
}
