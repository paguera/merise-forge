import { useState } from 'react';
import { Crown, Trash2, Edit3, Calendar, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Subscription } from '@/hooks/useAdminDashboard';

interface SubscriptionManagerProps {
  subscriptions: Subscription[];
  onRefresh: () => Promise<void>;
}

export function SubscriptionManager({ subscriptions, onRefresh }: SubscriptionManagerProps) {
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editingDate, setEditingDate] = useState('');
  const [editingStatus, setEditingStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setEditingDate(sub.expires_at ? new Date(sub.expires_at).toISOString().split('T')[0] : '');
    setEditingStatus(sub.status);
  };

  const handleSave = async () => {
    if (!editingSub) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: editingStatus,
          expires_at: editingDate ? new Date(editingDate).toISOString() : null,
        })
        .eq('id', editingSub.id);

      if (error) throw error;

      // Also update the profile if status changed
      if (editingStatus === 'cancelled' || editingStatus === 'expired') {
        await supabase
          .from('profiles')
          .update({ is_premium: false, premium_until: null })
          .eq('user_id', editingSub.user_id);
      } else if (editingStatus === 'active') {
        await supabase
          .from('profiles')
          .update({ 
            is_premium: true, 
            premium_until: editingDate ? new Date(editingDate).toISOString() : null 
          })
          .eq('user_id', editingSub.user_id);
      }

      toast.success('Abonnement mis à jour');
      setEditingSub(null);
      await onRefresh();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sub: Subscription) => {
    setDeleting(sub.id);
    try {
      // First, remove premium from user profile
      await supabase
        .from('profiles')
        .update({ is_premium: false, premium_until: null })
        .eq('user_id', sub.user_id);

      // Then delete the subscription
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', sub.id);

      if (error) throw error;

      toast.success('Abonnement supprimé');
      await onRefresh();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <Card className="neu-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Début</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.user_email || 'Utilisateur inconnu'}</TableCell>
                <TableCell>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white gap-1">
                    <Crown className="w-3 h-3" />
                    {sub.plan_name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(sub.status)} text-white`}>
                    {sub.status === 'active' ? 'Actif' : 
                     sub.status === 'cancelled' ? 'Annulé' : 
                     sub.status === 'expired' ? 'Expiré' : sub.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(sub.started_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('fr-FR') : 'Illimité'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(sub)}
                      className="hover:bg-primary/10"
                    >
                      <Edit3 className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(sub)}
                      disabled={deleting === sub.id}
                      className="hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {subscriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucun abonnement actif
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingSub} onOpenChange={(open) => !open && setEditingSub(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Modifier l'abonnement
            </DialogTitle>
            <DialogDescription>
              {editingSub?.user_email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={editingStatus} onValueChange={setEditingStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date d'expiration
              </Label>
              <Input
                type="date"
                value={editingDate}
                onChange={(e) => setEditingDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Laisser vide pour un abonnement illimité
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSub(null)}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
