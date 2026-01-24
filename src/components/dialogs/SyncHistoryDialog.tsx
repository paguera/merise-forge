import { useState } from 'react';
import { History, Check, X, Clock, User, ChevronDown, ChevronUp, Eye, MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { SyncHistoryEntry } from '@/types/collaboration';
import { useMeriseStore } from '@/hooks/useMeriseStore';
import { toast } from 'sonner';

interface SyncHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: SyncHistoryEntry[];
  pendingCount: number;
  isAdmin: boolean;
  currentUsername: string;
  onApprove: (entryId: string) => Promise<boolean>;
  onReject: (entryId: string) => Promise<boolean>;
  onAddComment: (entryId: string, comment: string) => Promise<boolean>;
}

export function SyncHistoryDialog({
  open,
  onOpenChange,
  history,
  pendingCount,
  isAdmin,
  currentUsername,
  onApprove,
  onReject,
  onAddComment,
}: SyncHistoryDialogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const filteredHistory = history.filter(entry => {
    if (filter === 'all') return true;
    return entry.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><Check className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><X className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return null;
    }
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('add')) return '➕';
    if (actionType.includes('update')) return '✏️';
    if (actionType.includes('remove') || actionType.includes('delete')) return '🗑️';
    return '🔄';
  };

  const handleRestoreSnapshot = (entry: SyncHistoryEntry) => {
    if (entry.snapshot.model) {
      useMeriseStore.setState({
        model: entry.snapshot.model,
        mldModel: entry.snapshot.mldModel ?? null,
      });
      toast.success('Version restaurée');
    }
  };

  const handleSubmitComment = async (entryId: string) => {
    if (!newComment.trim()) return;
    
    const success = await onAddComment(entryId, newComment.trim());
    if (success) {
      setNewComment('');
      setCommentingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique des synchronisations
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} en attente
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' && 'Tout'}
              {f === 'pending' && 'En attente'}
              {f === 'approved' && 'Approuvés'}
              {f === 'rejected' && 'Rejetés'}
            </Button>
          ))}
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Aucun historique de synchronisation
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-border rounded-lg p-3 bg-card hover:bg-secondary/30 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getActionIcon(entry.action_type)}</span>
                        <span className="font-medium text-sm">{entry.action_summary}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.username}
                        </span>
                        <span>
                          {format(new Date(entry.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </span>
                        {getStatusBadge(entry.status)}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      {expandedId === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Comment preview */}
                  {entry.comment && (
                    <div className="mt-2 bg-secondary/50 rounded p-2 text-sm">
                      <span className="text-muted-foreground">💬 </span>
                      {entry.comment}
                    </div>
                  )}

                  {/* Expanded details */}
                  {expandedId === entry.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      {/* Changes detail */}
                      <div className="bg-secondary/50 rounded p-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Détails des changements :</p>
                        <pre className="text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          {JSON.stringify(entry.changes_detail, null, 2)}
                        </pre>
                      </div>

                      {/* Comment section */}
                      <div className="space-y-2">
                        {commentingId === entry.id ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Ajouter un commentaire..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSubmitComment(entry.id)}
                                disabled={!newComment.trim()}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Envoyer
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setCommentingId(null);
                                  setNewComment('');
                                }}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCommentingId(entry.id)}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {entry.comment ? 'Modifier le commentaire' : 'Ajouter un commentaire'}
                          </Button>
                        )}
                      </div>

                      {/* Review info */}
                      {entry.reviewed_at && (
                        <div className="text-xs text-muted-foreground">
                          Révisé par <strong>{entry.reviewed_by}</strong> le{' '}
                          {format(new Date(entry.reviewed_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {entry.snapshot.model && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreSnapshot(entry)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Restaurer cette version
                          </Button>
                        )}

                        {isAdmin && entry.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => onApprove(entry.id)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onReject(entry.id)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Rejeter
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
