import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SyncHistoryEntry } from '@/types/collaboration';
import { toast } from 'sonner';

export function useSyncHistory(projectId: string | null, isAdmin: boolean) {
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('sync_history')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching sync history:', error);
    } else {
      const typedData = (data || []).map(item => ({
        ...item,
        changes_detail: item.changes_detail as SyncHistoryEntry['changes_detail'],
        snapshot: item.snapshot as SyncHistoryEntry['snapshot'],
        status: item.status as SyncHistoryEntry['status'],
      }));
      setHistory(typedData);
      setPendingCount(typedData.filter(h => h.status === 'pending').length);
    }
    setLoading(false);
  }, [projectId]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!projectId) return;

    fetchHistory();

    const channel = supabase
      .channel(`sync-history-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_history',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchHistory]);

  // Add history entry
  const addHistoryEntry = useCallback(async (
    entry: Omit<SyncHistoryEntry, 'id' | 'created_at' | 'reviewed_at' | 'reviewed_by'>
  ) => {
    if (!projectId) return null;

    const { data, error } = await supabase
      .from('sync_history')
      .insert([{
        project_id: projectId,
        schema_id: entry.schema_id,
        username: entry.username,
        action_type: entry.action_type,
        action_summary: entry.action_summary,
        changes_detail: JSON.parse(JSON.stringify(entry.changes_detail)),
        snapshot: JSON.parse(JSON.stringify(entry.snapshot)),
        status: entry.status,
        comment: entry.comment || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding history entry:', error);
      return null;
    }

    return data;
  }, [projectId]);

  // Add comment to entry
  const addComment = useCallback(async (entryId: string, comment: string) => {
    const { error } = await supabase
      .from('sync_history')
      .update({ comment })
      .eq('id', entryId);

    if (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
      return false;
    }

    toast.success('Commentaire ajouté');
    return true;
  }, []);

  // Approve entry (admin only)
  const approveEntry = useCallback(async (entryId: string, reviewerUsername: string) => {
    if (!isAdmin) {
      toast.error("Seul l'admin peut approuver les modifications");
      return false;
    }

    const { error } = await supabase
      .from('sync_history')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerUsername,
      })
      .eq('id', entryId);

    if (error) {
      toast.error('Erreur lors de l\'approbation');
      return false;
    }

    toast.success('Modification approuvée');
    return true;
  }, [isAdmin]);

  // Reject entry (admin only)
  const rejectEntry = useCallback(async (entryId: string, reviewerUsername: string) => {
    if (!isAdmin) {
      toast.error("Seul l'admin peut rejeter les modifications");
      return false;
    }

    const { error } = await supabase
      .from('sync_history')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerUsername,
      })
      .eq('id', entryId);

    if (error) {
      toast.error('Erreur lors du rejet');
      return false;
    }

    toast.success('Modification rejetée');
    return true;
  }, [isAdmin]);

  return {
    history,
    pendingCount,
    loading,
    addHistoryEntry,
    approveEntry,
    rejectEntry,
    addComment,
    refresh: fetchHistory,
  };
}
