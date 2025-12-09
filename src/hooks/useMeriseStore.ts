import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Entity, Relation, MeriseModel, MLDModel, MLDColumn, ViewMode, SQLDialect, Attribute } from '@/types/merise';
import { transformMCDtoMLD } from '@/lib/mcdToMld';
import { generateSQL } from '@/lib/sqlGenerator';

interface MeriseStore {
  // State
  model: MeriseModel;
  mldModel: MLDModel | null;
  viewMode: ViewMode;
  sqlDialect: SQLDialect;
  selectedEntityId: string | null;
  selectedRelationId: string | null;
  generatedSQL: string;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSqlDialect: (dialect: SQLDialect) => void;
  
  // Entity actions
  addEntity: (entity: Entity) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  removeEntity: (id: string) => void;
  addAttribute: (entityId: string, attribute: Attribute) => void;
  updateAttribute: (entityId: string, attributeId: string, updates: Partial<Attribute>) => void;
  removeAttribute: (entityId: string, attributeId: string) => void;
  
  // Relation actions
  addRelation: (relation: Relation) => void;
  updateRelation: (id: string, updates: Partial<Relation>) => void;
  removeRelation: (id: string) => void;
  
  // MLD actions
  addColumnToTable: (tableId: string, column: MLDColumn) => void;
  updateTablePosition: (tableId: string, position: { x: number; y: number }) => void;
  
  // Selection
  selectEntity: (id: string | null) => void;
  selectRelation: (id: string | null) => void;
  
  // Transformation
  transformToMLD: () => void;
  generateSQLCode: () => void;
}

export const useMeriseStore = create<MeriseStore>()(
  persist(
    (set, get) => ({
      model: {
        entities: [],
        relations: [],
      },
      mldModel: null,
      viewMode: 'MCD',
      sqlDialect: 'MariaDB',
      selectedEntityId: null,
      selectedRelationId: null,
      generatedSQL: '',

  setViewMode: (mode) => {
    if (mode === 'MLD' || mode === 'MPD') {
      get().transformToMLD();
    }
    if (mode === 'MPD') {
      get().generateSQLCode();
    }
    set({ viewMode: mode });
  },
  
  setSqlDialect: (dialect) => {
    set({ sqlDialect: dialect });
    get().generateSQLCode();
  },

  addEntity: (entity) => set((state) => ({
    model: {
      ...state.model,
      entities: [...state.model.entities, entity],
    },
  })),

  updateEntity: (id, updates) => set((state) => ({
    model: {
      ...state.model,
      entities: state.model.entities.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    },
  })),

  removeEntity: (id) => set((state) => ({
    model: {
      ...state.model,
      entities: state.model.entities.filter((e) => e.id !== id),
      relations: state.model.relations.filter(
        (r) => r.entity1Id !== id && r.entity2Id !== id
      ),
    },
    selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
  })),

  addAttribute: (entityId, attribute) => set((state) => ({
    model: {
      ...state.model,
      entities: state.model.entities.map((e) =>
        e.id === entityId
          ? { ...e, attributes: [...e.attributes, attribute] }
          : e
      ),
    },
  })),

  updateAttribute: (entityId, attributeId, updates) => set((state) => ({
    model: {
      ...state.model,
      entities: state.model.entities.map((e) =>
        e.id === entityId
          ? {
              ...e,
              attributes: e.attributes.map((a) =>
                a.id === attributeId ? { ...a, ...updates } : a
              ),
            }
          : e
      ),
    },
  })),

  removeAttribute: (entityId, attributeId) => set((state) => ({
    model: {
      ...state.model,
      entities: state.model.entities.map((e) =>
        e.id === entityId
          ? { ...e, attributes: e.attributes.filter((a) => a.id !== attributeId) }
          : e
      ),
    },
  })),

  addRelation: (relation) => set((state) => ({
    model: {
      ...state.model,
      relations: [...state.model.relations, relation],
    },
  })),

  updateRelation: (id, updates) => set((state) => ({
    model: {
      ...state.model,
      relations: state.model.relations.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    },
  })),

  removeRelation: (id) => set((state) => ({
    model: {
      ...state.model,
      relations: state.model.relations.filter((r) => r.id !== id),
    },
    selectedRelationId: state.selectedRelationId === id ? null : state.selectedRelationId,
  })),

  selectEntity: (id) => set({ selectedEntityId: id, selectedRelationId: null }),
  selectRelation: (id) => set({ selectedRelationId: id, selectedEntityId: null }),

  addColumnToTable: (tableId, column) => set((state) => {
    if (!state.mldModel) return state;
    
    const updatedMldModel = {
      ...state.mldModel,
      tables: state.mldModel.tables.map((table) =>
        table.id === tableId
          ? { ...table, columns: [...table.columns, column] }
          : table
      ),
    };
    
    // Regenerate SQL after adding column
    const sql = generateSQL(updatedMldModel, state.sqlDialect);
    
    return { mldModel: updatedMldModel, generatedSQL: sql };
  }),

  updateTablePosition: (tableId, position) => set((state) => {
    if (!state.mldModel) return state;
    
    return {
      mldModel: {
        ...state.mldModel,
        tables: state.mldModel.tables.map((table) =>
          table.id === tableId ? { ...table, position } : table
        ),
      },
    };
  }),

  transformToMLD: () => {
    const { model, mldModel: existingMldModel } = get();
    const newMldModel = transformMCDtoMLD(model);
    
    // Preserve existing table positions if tables exist
    if (existingMldModel) {
      newMldModel.tables = newMldModel.tables.map((table) => {
        const existingTable = existingMldModel.tables.find((t) => t.id === table.id);
        if (existingTable) {
          return { ...table, position: existingTable.position };
        }
        return table;
      });
    }
    
    set({ mldModel: newMldModel });
  },

      generateSQLCode: () => {
        const { mldModel, sqlDialect } = get();
        if (mldModel) {
          const sql = generateSQL(mldModel, sqlDialect);
          set({ generatedSQL: sql });
        }
      },
    }),
    {
      name: 'merise-store',
      partialize: (state) => ({
        model: state.model,
        mldModel: state.mldModel,
        sqlDialect: state.sqlDialect,
        generatedSQL: state.generatedSQL,
      }),
    }
  )
);
