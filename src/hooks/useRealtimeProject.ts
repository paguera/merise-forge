import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMeriseStore } from './useMeriseStore';
import { toast } from 'sonner';
import type { MeriseModel, MLDModel, SQLDialect } from '@/types/merise';

interface ProjectData {
  model?: MeriseModel;
  mldModel?: MLDModel | null;
  sqlDialect?: SQLDialect;
  generatedSQL?: string;
}

export function useRealtimeProject() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const ignoreNextRemote = useRef(false);

  // Join an existing project or create a new one
  const joinProject = useCallback(async (name: string) => {
    setSyncing(true);
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
        useMeriseStore.setState({
          model: projectData?.model ?? { entities: [], relations: [] },
          mldModel: projectData?.mldModel ?? null,
          sqlDialect: projectData?.sqlDialect ?? 'MariaDB',
          generatedSQL: projectData?.generatedSQL ?? '',
        });
        toast.success(`Rejoint le projet "${name}"`);
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
        toast.success(`Projet "${name}" créé`);
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

  // Push local state to DB
  const pushState = useCallback(async () => {
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
          useMeriseStore.setState({
            model: newData?.model ?? { entities: [], relations: [] },
            mldModel: newData?.mldModel ?? null,
            sqlDialect: newData?.sqlDialect ?? 'MariaDB',
            generatedSQL: newData?.generatedSQL ?? '',
          });
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
    setConnected(false);
    toast.info('Déconnecté du projet partagé');
  }, []);

  return { projectId, projectName, connected, syncing, joinProject, pushState, leaveProject };
}
