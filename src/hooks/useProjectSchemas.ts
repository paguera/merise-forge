import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProjectSchema } from '@/types/collaboration';
import { useMeriseStore } from './useMeriseStore';
import { toast } from 'sonner';

export function useProjectSchemas(projectId: string | null, username: string) {
  const [schemas, setSchemas] = useState<ProjectSchema[]>([]);
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch schemas
  const fetchSchemas = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('project_schemas')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching schemas:', error);
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        data: item.data as ProjectSchema['data'],
      }));
      setSchemas(typedData);
    }
    setLoading(false);
  }, [projectId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!projectId) return;

    fetchSchemas();

    const channel = supabase
      .channel(`project-schemas-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_schemas',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchSchemas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchSchemas]);

  // Create new schema
  const createSchema = useCallback(async (name: string) => {
    if (!projectId || !username) return null;

    const currentState = useMeriseStore.getState();
    const schemaData = {
      model: currentState.model,
      mldModel: currentState.mldModel,
      sqlDialect: currentState.sqlDialect,
      generatedSQL: currentState.generatedSQL,
    };

    const { data, error } = await supabase
      .from('project_schemas')
      .insert([{
        project_id: projectId,
        name,
        data: JSON.parse(JSON.stringify(schemaData)),
        created_by: username,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating schema:', error);
      toast.error('Erreur lors de la création du schéma');
      return null;
    }

    toast.success(`Schéma "${name}" créé`);
    setCurrentSchemaId(data.id);
    return data;
  }, [projectId, username]);

  // Load schema
  const loadSchema = useCallback((schemaId: string) => {
    const schema = schemas.find(s => s.id === schemaId);
    if (!schema) {
      toast.error('Schéma introuvable');
      return;
    }

    useMeriseStore.setState({
      model: schema.data.model ?? { entities: [], relations: [] },
      mldModel: schema.data.mldModel ?? null,
      sqlDialect: (schema.data.sqlDialect as 'MariaDB' | 'MySQL') ?? 'MariaDB',
      generatedSQL: schema.data.generatedSQL ?? '',
    });

    setCurrentSchemaId(schemaId);
    toast.success(`Schéma "${schema.name}" chargé`);
  }, [schemas]);

  // Update current schema
  const updateCurrentSchema = useCallback(async () => {
    if (!currentSchemaId) {
      toast.error('Aucun schéma sélectionné');
      return false;
    }

    const currentState = useMeriseStore.getState();
    const schemaData = {
      model: currentState.model,
      mldModel: currentState.mldModel,
      sqlDialect: currentState.sqlDialect,
      generatedSQL: currentState.generatedSQL,
    };

    const { error } = await supabase
      .from('project_schemas')
      .update({ data: JSON.parse(JSON.stringify(schemaData)) })
      .eq('id', currentSchemaId);

    if (error) {
      console.error('Error updating schema:', error);
      toast.error('Erreur lors de la sauvegarde');
      return false;
    }

    toast.success('Schéma sauvegardé');
    return true;
  }, [currentSchemaId]);

  // Delete schema
  const deleteSchema = useCallback(async (schemaId: string) => {
    const { error } = await supabase
      .from('project_schemas')
      .delete()
      .eq('id', schemaId);

    if (error) {
      console.error('Error deleting schema:', error);
      toast.error('Erreur lors de la suppression');
      return false;
    }

    if (currentSchemaId === schemaId) {
      setCurrentSchemaId(null);
    }

    toast.success('Schéma supprimé');
    return true;
  }, [currentSchemaId]);

  // Rename schema
  const renameSchema = useCallback(async (schemaId: string, newName: string) => {
    const { error } = await supabase
      .from('project_schemas')
      .update({ name: newName })
      .eq('id', schemaId);

    if (error) {
      console.error('Error renaming schema:', error);
      toast.error('Erreur lors du renommage');
      return false;
    }

    toast.success('Schéma renommé');
    return true;
  }, []);

  const currentSchema = schemas.find(s => s.id === currentSchemaId);

  return {
    schemas,
    currentSchemaId,
    currentSchema,
    loading,
    createSchema,
    loadSchema,
    updateCurrentSchema,
    deleteSchema,
    renameSchema,
    refresh: fetchSchemas,
  };
}
