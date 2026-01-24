import { MeriseModel, MLDModel } from './merise';

export interface ProjectSchema {
  id: string;
  project_id: string;
  name: string;
  data: {
    model?: MeriseModel;
    mldModel?: MLDModel | null;
    sqlDialect?: string;
    generatedSQL?: string;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SyncHistoryEntry {
  id: string;
  project_id: string;
  schema_id: string | null;
  username: string;
  action_type: string;
  action_summary: string;
  changes_detail: {
    before?: unknown;
    after?: unknown;
    entityName?: string;
    relationName?: string;
    tableName?: string;
  };
  snapshot: {
    model?: MeriseModel;
    mldModel?: MLDModel | null;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

export interface ProjectWithMeta {
  id: string;
  name: string;
  creator_id: string | null;
  current_schema_id: string | null;
  data: unknown;
  created_at: string;
  updated_at: string;
}
