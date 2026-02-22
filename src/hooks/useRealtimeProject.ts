import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMeriseStore } from './useMeriseStore';
import { useSyncHistory } from './useSyncHistory';
import { useProjectSchemas } from './useProjectSchemas';
import { useProjectUserStats } from './useProjectUserStats';
import { toast } from 'sonner';
import type { MeriseModel, MLDModel, SQLDialect } from '@/types/merise';
import { useRealtimePresence, PresenceUser } from './useRealtimePresence';

interface ProjectData {
  model?: MeriseModel;
  mldModel?: MLDModel | null;
  sqlDialect?: SQLDialect;
  generatedSQL?: string;
}

export function useRealtimeProject() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const ignoreNextRemote = useRef(false);
  const autoSyncEnabled = useRef(true);
  const previousState = useRef<{ model: MeriseModel; mldModel: MLDModel | null } | null>(null);

  // Presence hook
  const presence = useRealtimePresence(projectId, username);

  // Sync history hook
  const syncHistory = useSyncHistory(projectId, isAdmin);

  // Project schemas hook
  const projectSchemas = useProjectSchemas(projectId, username);

  // User stats hook
  const userStats = useProjectUserStats(projectId);

  // Track changes for history
  const trackChange = useCallback(async (
    actionType: string,
    actionSummary: string,
    changeDetail: Record<string, unknown>
  ) => {
    if (!projectId || !username) return;

    const currentState = useMeriseStore.getState();
    
    await syncHistory.addHistoryEntry({
      project_id: projectId,
      schema_id: projectSchemas.currentSchemaId,
      username,
      action_type: actionType,
      action_summary: actionSummary,
      changes_detail: {
        ...changeDetail,
        before: previousState.current,
      },
      snapshot: {
        model: currentState.model,
        mldModel: currentState.mldModel,
      },
      status: isAdmin ? 'approved' : 'pending',
      comment: null,
    });

    previousState.current = {
      model: JSON.parse(JSON.stringify(currentState.model)),
      mldModel: currentState.mldModel ? JSON.parse(JSON.stringify(currentState.mldModel)) : null,
    };
  }, [projectId, username, isAdmin, syncHistory, projectSchemas.currentSchemaId]);

  // Auto-sync: subscribe to store changes and push automatically
  useEffect(() => {
    if (!projectId || !connected) return;

    let timeout: NodeJS.Timeout;

    const unsubscribe = useMeriseStore.subscribe((state, prevState) => {
      if (!autoSyncEnabled.current || state.isReadOnly) return;
      
      // Check if relevant state changed
      const modelChanged = JSON.stringify(state.model) !== JSON.stringify(prevState.model);
      const mldChanged = JSON.stringify(state.mldModel) !== JSON.stringify(prevState.mldModel);
      const dialectChanged = state.sqlDialect !== prevState.sqlDialect;
      const sqlChanged = state.generatedSQL !== prevState.generatedSQL;

      if (modelChanged || mldChanged || dialectChanged || sqlChanged) {
        // Debounce auto-sync
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          pushStateInternal();
        }, 500);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [projectId, connected]);

  // Join an existing project or create a new one
  const joinProject = useCallback(async (name: string, user: string, asGuest: boolean = false) => {
    setSyncing(true);
    setUsername(user);
    try {
      // Get current auth user id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const authUserId = authUser?.id || null;

      // Check if project exists
      const { data: existing } = await supabase
        .from('projects')
        .select('*')
        .eq('name', name)
        .limit(1)
        .maybeSingle();

      let pid: string;
      let userIsAdmin = false;

      if (existing) {
        pid = existing.id;
        // Check if user is creator (admin) - use UUID
        userIsAdmin = !!(authUserId && existing.creator_user_id === authUserId);
        setCreatorId(existing.creator_id);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projectData = existing.data as any as ProjectData;
        autoSyncEnabled.current = false;
        useMeriseStore.setState({
          model: projectData?.model ?? { entities: [], relations: [] },
          mldModel: projectData?.mldModel ?? null,
          sqlDialect: projectData?.sqlDialect ?? 'MariaDB',
          generatedSQL: projectData?.generatedSQL ?? '',
        });
        
        // Store initial state for tracking
        previousState.current = {
          model: JSON.parse(JSON.stringify(projectData?.model ?? { entities: [], relations: [] })),
          mldModel: projectData?.mldModel ? JSON.parse(JSON.stringify(projectData.mldModel)) : null,
        };
        
        setTimeout(() => { autoSyncEnabled.current = true; }, 100);
        // Set read-only for guests
        if (asGuest) {
          useMeriseStore.getState().setReadOnly(true);
        }
        
        toast.success(`Rejoint le projet "${name}" en tant que ${user}${asGuest ? ' (Invité)' : userIsAdmin ? ' (Admin)' : ''}`);
        
        // Record connection for stats (not for guests)
        if (!asGuest) {
          userStats.recordConnection(user);
        }
      } else {
        // Create new project - creator becomes admin
        const currentState = useMeriseStore.getState();
        const payloadObj = JSON.parse(JSON.stringify({
          model: currentState.model,
          mldModel: currentState.mldModel,
          sqlDialect: currentState.sqlDialect,
          generatedSQL: currentState.generatedSQL,
        }));
        const { data: created, error } = await supabase
          .from('projects')
          .insert([{ 
            name, 
            data: payloadObj,
            creator_id: user,
            creator_user_id: authUserId,
          }])
          .select()
          .single();

        if (error || !created) throw error;
        pid = created.id;
        userIsAdmin = true;
        setCreatorId(user);
        
        // Store initial state
        previousState.current = {
          model: JSON.parse(JSON.stringify(currentState.model)),
          mldModel: currentState.mldModel ? JSON.parse(JSON.stringify(currentState.mldModel)) : null,
        };
        
        // Record connection for stats
        userStats.recordConnection(user);
        
        toast.success(`Projet "${name}" créé par ${user} (Admin)`);
      }

      setProjectId(pid);
      setProjectName(name);
      setConnected(true);
      setIsAdmin(userIsAdmin);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la connexion au projet');
    } finally {
      setSyncing(false);
    }
  }, []);

  // Push local state to DB (internal, silent)
  const pushStateInternal = useCallback(async () => {
    if (!projectId) return;
    ignoreNextRemote.current = true;
    const s = useMeriseStore.getState();
    const payloadObj = JSON.parse(JSON.stringify({
      model: s.model,
      mldModel: s.mldModel,
      sqlDialect: s.sqlDialect,
      generatedSQL: s.generatedSQL,
    }));
    await supabase
      .from('projects')
      .update({ data: payloadObj })
      .eq('id', projectId);
  }, [projectId]);

  // Push local state to DB (manual with toast)
  const pushState = useCallback(async () => {
    await pushStateInternal();
    toast.success('Modifications synchronisées');
  }, [pushStateInternal]);

  // Subscribe to changes
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          if (ignoreNextRemote.current) {
            ignoreNextRemote.current = false;
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          const newData = row?.data as ProjectData | undefined;
          autoSyncEnabled.current = false;
          useMeriseStore.setState({
            model: newData?.model ?? { entities: [], relations: [] },
            mldModel: newData?.mldModel ?? null,
            sqlDialect: newData?.sqlDialect ?? 'MariaDB',
            generatedSQL: newData?.generatedSQL ?? '',
          });
          setTimeout(() => { autoSyncEnabled.current = true; }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Leave project
  const leaveProject = useCallback(() => {
    useMeriseStore.getState().setReadOnly(false);
    setProjectId(null);
    setProjectName('');
    setUsername('');
    setConnected(false);
    setIsAdmin(false);
    setCreatorId(null);
    previousState.current = null;
    toast.info('Déconnecté du projet partagé');
  }, []);

  return { 
    projectId, 
    projectName, 
    username,
    connected, 
    syncing, 
    isAdmin,
    creatorId,
    joinProject, 
    pushState, 
    leaveProject,
    trackChange,
    // Presence
    users: presence.users as PresenceUser[],
    myColor: presence.myColor,
    updateCursor: presence.updateCursor,
    // Sync history
    syncHistory,
    // Schemas
    projectSchemas,
    // User stats
    userStats,
  };
}
