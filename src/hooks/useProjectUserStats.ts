import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectUserStat {
  id: string;
  project_id: string;
  username: string;
  connection_count: number;
  modification_count: number;
  first_connected_at: string;
  last_connected_at: string;
}

export function useProjectUserStats(projectId: string | null) {
  const [stats, setStats] = useState<ProjectUserStat[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all stats for the project
  const fetchStats = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_user_stats')
        .select('*')
        .eq('project_id', projectId)
        .order('last_connected_at', { ascending: false });

      if (error) throw error;
      setStats(data || []);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Record a connection for a user
  const recordConnection = useCallback(async (username: string) => {
    if (!projectId || !username) return;

    try {
      // Try to upsert - if user exists, increment connection count
      const { data: existing } = await supabase
        .from('project_user_stats')
        .select('*')
        .eq('project_id', projectId)
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('project_user_stats')
          .update({
            connection_count: existing.connection_count + 1,
            last_connected_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('project_user_stats')
          .insert({
            project_id: projectId,
            username,
            connection_count: 1,
            modification_count: 0,
          });
      }

      fetchStats();
    } catch (err) {
      console.error('Error recording connection:', err);
    }
  }, [projectId, fetchStats]);

  // Increment modification count for a user
  const recordModification = useCallback(async (username: string) => {
    if (!projectId || !username) return;

    try {
      const { data: existing } = await supabase
        .from('project_user_stats')
        .select('*')
        .eq('project_id', projectId)
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('project_user_stats')
          .update({
            modification_count: existing.modification_count + 1,
            last_connected_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        fetchStats();
      }
    } catch (err) {
      console.error('Error recording modification:', err);
    }
  }, [projectId, fetchStats]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!projectId) return;

    fetchStats();

    const channel = supabase
      .channel(`project-stats-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_user_stats',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchStats]);

  return {
    stats,
    loading,
    recordConnection,
    recordModification,
    refreshStats: fetchStats,
  };
}
