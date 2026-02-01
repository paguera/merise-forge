import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Entity, Relation, MeriseModel, MLDModel, MLDColumn, MLDTable, ViewMode, SQLDialect, Attribute } from '@/types/merise';
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
  isExporting: boolean;
  isReadOnly: boolean;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSqlDialect: (dialect: SQLDialect) => void;
  setReadOnly: (readOnly: boolean) => void;
  
  // Entity actions
  addEntity: (entity: Entity) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  removeEntity: (id: string) => void;
  addAttribute: (entityId: string, attribute: Attribute) => void;
  updateAttribute: (entityId: string, attributeId: string, updates: Partial<Attribute>) => void;
  removeAttribute: (entityId: string, attributeId: string) => void;
  reorderAttributes: (entityId: string, fromIndex: number, toIndex: number) => void;
  
  // Relation actions
  addRelation: (relation: Relation) => void;
  updateRelation: (id: string, updates: Partial<Relation>) => void;
  removeRelation: (id: string) => void;
  
  // MLD actions
  addTable: (table: MLDTable) => void;
  removeTable: (tableId: string) => void;
  updateTable: (tableId: string, updates: Partial<MLDTable>) => void;
  addColumnToTable: (tableId: string, column: MLDColumn) => void;
  updateColumnInTable: (tableId: string, columnId: string, updates: Partial<MLDColumn>) => void;
  removeColumnFromTable: (tableId: string, columnId: string) => void;
  updateTablePosition: (tableId: string, position: { x: number; y: number }) => void;
  
  // Selection
  selectEntity: (id: string | null) => void;
  selectRelation: (id: string | null) => void;
  
  // Transformation
  transformToMLD: () => void;
  generateSQLCode: () => void;
  
  // Reset
  resetModel: () => void;
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
      isExporting: false,
      isReadOnly: false,

  setViewMode: (mode) => {
    if (mode === 'MLD' || mode === 'MPD') {
      get().transformToMLD();
    }
    if (mode === 'MPD') {
      get().generateSQLCode();
    }
    set({ viewMode: mode });
  },

  setReadOnly: (readOnly) => set({ isReadOnly: readOnly }),
  
  setSqlDialect: (dialect) => {
    set({ sqlDialect: dialect });
    get().generateSQLCode();
  },

  addEntity: (entity) => {
    if (get().isReadOnly) return;
    set((state) => ({
      model: {
        ...state.model,
        entities: [...state.model.entities, entity],
      },
    }));
  },

  updateEntity: (id, updates) => {
    if (get().isReadOnly) return;
    set((state) => ({
      model: {
        ...state.model,
        entities: state.model.entities.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        ),
      },
    }));
  },

  removeEntity: (id) => {
    if (get().isReadOnly) return;
    set((state) => ({
      model: {
        ...state.model,
        entities: state.model.entities.filter((e) => e.id !== id),
        relations: state.model.relations.filter(
          (r) => r.entity1Id !== id && r.entity2Id !== id
        ),
      },
      selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
    }));
  },

  addAttribute: (entityId, attribute) => {
    if (get().isReadOnly) return;
    set((state) => ({
      model: {
        ...state.model,
        entities: state.model.entities.map((e) =>
          e.id === entityId
            ? { ...e, attributes: [...e.attributes, attribute] }
            : e
        ),
      },
    }));
  },

  updateAttribute: (entityId, attributeId, updates) => {
    if (get().isReadOnly) return;
    set((state) => ({
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
    }));
  },

  removeAttribute: (entityId, attributeId) => {
    if (get().isReadOnly) return;
    set((state) => ({
      model: {
        ...state.model,
        entities: state.model.entities.map((e) =>
          e.id === entityId
            ? { ...e, attributes: e.attributes.filter((a) => a.id !== attributeId) }
            : e
        ),
      },
    }));
  },

  reorderAttributes: (entityId, fromIndex, toIndex) => {
    if (get().isReadOnly) return;
    set((state) => ({
      model: {
        ...state.model,
        entities: state.model.entities.map((e) => {
          if (e.id !== entityId) return e;
          const newAttributes = [...e.attributes];
          const [movedItem] = newAttributes.splice(fromIndex, 1);
          newAttributes.splice(toIndex, 0, movedItem);
          return { ...e, attributes: newAttributes };
        }),
      },
    }));
  },

  addRelation: (relation) => {
    if (get().isReadOnly) return;
    set((state) => ({
      model: {
        ...state.model,
        relations: [...state.model.relations, relation],
      },
    }));
  },

  updateRelation: (id, updates) => {
    if (get().isReadOnly) return;
    set((state) => ({
      model: {
        ...state.model,
        relations: state.model.relations.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      },
    }));
  },

  removeRelation: (id) => {
    if (get().isReadOnly) return;
    set((state) => ({
      model: {
        ...state.model,
        relations: state.model.relations.filter((r) => r.id !== id),
      },
      selectedRelationId: state.selectedRelationId === id ? null : state.selectedRelationId,
    }));
  },

  selectEntity: (id) => set({ selectedEntityId: id, selectedRelationId: null }),
  selectRelation: (id) => set({ selectedRelationId: id, selectedEntityId: null }),

  // Table actions
  addTable: (table) => {
    if (get().isReadOnly) return;
    set((state) => {
    if (!state.mldModel) {
      const newMldModel = { tables: [table], relations: [] };
      const sql = generateSQL(newMldModel, state.sqlDialect);
      return { mldModel: newMldModel, generatedSQL: sql };
    }
    
    const updatedMldModel = {
      ...state.mldModel,
      tables: [...state.mldModel.tables, { ...table, isCustom: true }],
    };
    
    const sql = generateSQL(updatedMldModel, state.sqlDialect);
    return { mldModel: updatedMldModel, generatedSQL: sql };
    });
  },

  removeTable: (tableId) => {
    if (get().isReadOnly) return;
    set((state) => {
    if (!state.mldModel) return state;
    
    const updatedMldModel = {
      ...state.mldModel,
      tables: state.mldModel.tables.filter((t) => t.id !== tableId),
      relations: state.mldModel.relations.filter(
        (r) => r.fromTable !== tableId && r.toTable !== tableId
      ),
    };
    
    const sql = generateSQL(updatedMldModel, state.sqlDialect);
    return { mldModel: updatedMldModel, generatedSQL: sql };
    });
  },

  updateTable: (tableId, updates) => {
    if (get().isReadOnly) return;
    set((state) => {
    if (!state.mldModel) return state;
    
    const updatedMldModel = {
      ...state.mldModel,
      tables: state.mldModel.tables.map((table) =>
        table.id === tableId ? { ...table, ...updates } : table
      ),
    };
    
    const sql = generateSQL(updatedMldModel, state.sqlDialect);
    return { mldModel: updatedMldModel, generatedSQL: sql };
    });
  },

  addColumnToTable: (tableId, column) => {
    if (get().isReadOnly) return;
    set((state) => {
    if (!state.mldModel) return state;
    
    const updatedMldModel = {
      ...state.mldModel,
      tables: state.mldModel.tables.map((table) =>
        table.id === tableId
          ? { ...table, columns: [...table.columns, column] }
          : table
      ),
    };
    
    const sql = generateSQL(updatedMldModel, state.sqlDialect);
    return { mldModel: updatedMldModel, generatedSQL: sql };
    });
  },

  updateColumnInTable: (tableId, columnId, updates) => {
    if (get().isReadOnly) return;
    set((state) => {
    if (!state.mldModel) return state;
    
    const updatedMldModel = {
      ...state.mldModel,
      tables: state.mldModel.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map((col) =>
                col.id === columnId ? { ...col, ...updates } : col
              ),
            }
          : table
      ),
    };
    
    const sql = generateSQL(updatedMldModel, state.sqlDialect);
    return { mldModel: updatedMldModel, generatedSQL: sql };
    });
  },

  removeColumnFromTable: (tableId, columnId) => {
    if (get().isReadOnly) return;
    set((state) => {
    if (!state.mldModel) return state;
    
    const updatedMldModel = {
      ...state.mldModel,
      tables: state.mldModel.tables.map((table) =>
        table.id === tableId
          ? { ...table, columns: table.columns.filter((col) => col.id !== columnId) }
          : table
      ),
    };
    
    const sql = generateSQL(updatedMldModel, state.sqlDialect);
    return { mldModel: updatedMldModel, generatedSQL: sql };
    });
  },

  updateTablePosition: (tableId, position) => {
    if (get().isReadOnly) return;
    set((state) => {
    if (!state.mldModel) return state;
    
    return {
      mldModel: {
        ...state.mldModel,
        tables: state.mldModel.tables.map((table) =>
          table.id === tableId ? { ...table, position } : table
        ),
      },
    };
    });
  },

  transformToMLD: () => {
    const { model, mldModel: existingMldModel } = get();
    const newMldModel = transformMCDtoMLD(model);
    
    if (existingMldModel) {
      // Preserve existing table positions
      newMldModel.tables = newMldModel.tables.map((table) => {
        const existingTable = existingMldModel.tables.find((t) => t.id === table.id);
        if (existingTable) {
          return { ...table, position: existingTable.position };
        }
        return table;
      });
      
      // Preserve custom tables (added manually in MPD)
      const customTables = existingMldModel.tables.filter((t) => t.isCustom);
      newMldModel.tables = [...newMldModel.tables, ...customTables];
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

      resetModel: () => {
        localStorage.removeItem('merise-store');
        set({
          model: { entities: [], relations: [] },
          mldModel: null,
          viewMode: 'MCD',
          sqlDialect: 'MariaDB',
          selectedEntityId: null,
          selectedRelationId: null,
          generatedSQL: '',
        });
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
