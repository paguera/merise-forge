import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMeriseStore } from './useMeriseStore';
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
  const ignoreNextRemote = useRef(false);
  const autoSyncEnabled = useRef(true);

  // Presence hook
  const presence = useRealtimePresence(projectId, username);

  // Auto-sync: subscribe to store changes and push automatically
  useEffect(() => {
    if (!projectId || !connected) return;

    const unsubscribe = useMeriseStore.subscribe((state, prevState) => {
      if (!autoSyncEnabled.current) return;
      
      // Check if relevant state changed
      const changed = 
        JSON.stringify(state.model) !== JSON.stringify(prevState.model) ||
        JSON.stringify(state.mldModel) !== JSON.stringify(prevState.mldModel) ||
        state.sqlDialect !== prevState.sqlDialect ||
        state.generatedSQL !== prevState.generatedSQL;

      if (changed) {
        // Debounce auto-sync
        const timeout = setTimeout(() => {
          pushStateInternal();
        }, 500);
        return () => clearTimeout(timeout);
      }
    });

    return () => unsubscribe();
  }, [projectId, connected]);

  // Join an existing project or create a new one
  const joinProject = useCallback(async (name: string, user: string) => {
    setSyncing(true);
    setUsername(user);
    try {
      // Check if project exists
      const { data: existing } = await supabase
        .from('projects')
        .select('*')
        .eq('name', name)
        .limit(1)
        .single();

      let pid: string;

      if (existing) {
        pid = existing.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projectData = existing.data as any as ProjectData;
        autoSyncEnabled.current = false;
        useMeriseStore.setState({
          model: projectData?.model ?? { entities: [], relations: [] },
          mldModel: projectData?.mldModel ?? null,
          sqlDialect: projectData?.sqlDialect ?? 'MariaDB',
          generatedSQL: projectData?.generatedSQL ?? '',
        });
        setTimeout(() => { autoSyncEnabled.current = true; }, 100);
        toast.success(`Rejoint le projet "${name}" en tant que ${user}`);
      } else {
        const currentState = useMeriseStore.getState();
        const payloadObj = JSON.parse(JSON.stringify({
          model: currentState.model,
          mldModel: currentState.mldModel,
          sqlDialect: currentState.sqlDialect,
          generatedSQL: currentState.generatedSQL,
        }));
        const { data: created, error } = await supabase
          .from('projects')
          .insert([{ name, data: payloadObj }])
          .select()
          .single();

        if (error || !created) throw error;
        pid = created.id;
        toast.success(`Projet "${name}" créé par ${user}`);
      }

      setProjectId(pid);
      setProjectName(name);
      setConnected(true);
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
    setProjectId(null);
    setProjectName('');
    setUsername('');
    setConnected(false);
    toast.info('Déconnecté du projet partagé');
  }, []);

  return { 
    projectId, 
    projectName, 
    username,
    connected, 
    syncing, 
    joinProject, 
    pushState, 
    leaveProject,
    // Presence
    users: presence.users as PresenceUser[],
    myColor: presence.myColor,
    updateCursor: presence.updateCursor,
  };
}
