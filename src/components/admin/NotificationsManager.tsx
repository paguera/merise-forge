import { useState } from 'react';
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Send, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Notification } from '@/hooks/useAdminDashboard';

interface NotificationsManagerProps {
  notifications: Notification[];
  onCreate: (data: {
    title: string;
    message: string;
    type: string;
    target_type: string;
    target_id?: string;
    expires_at?: string;
  }) => Promise<{ error: Error | null }>;
  onToggle: (id: string, isActive: boolean) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
}

const typeColors: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  success: 'bg-green-500',
  announcement: 'bg-purple-500',
};

const typeLabels: Record<string, string> = {
  info: 'Information',
  warning: 'Avertissement',
  success: 'Succès',
  announcement: 'Annonce',
};

export function NotificationsManager({ notifications, onCreate, onToggle, onDelete }: NotificationsManagerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({
    title: '',
    message: '',
    type: 'info',
    target_type: 'all',
  });

  const handleCreate = async () => {
    if (!newNotif.title.trim() || !newNotif.message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const { error } = await onCreate(newNotif);
    if (error) {
      toast.error('Erreur lors de la création');
    } else {
      toast.success('Notification créée');
      setCreateOpen(false);
      setNewNotif({ title: '', message: '', type: 'info', target_type: 'all' });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await onToggle(id, !isActive);
    if (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await onDelete(id);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Notification supprimée');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle notification
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une notification</DialogTitle>
              <DialogDescription>
                Envoyez une notification à tous les utilisateurs
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  placeholder="Titre de la notification"
                  value={newNotif.title}
                  onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Contenu du message..."
                  value={newNotif.message}
                  onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newNotif.type}
                  onValueChange={(v) => setNewNotif({ ...newNotif, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="warning">Avertissement</SelectItem>
                    <SelectItem value="success">Succès</SelectItem>
                    <SelectItem value="announcement">Annonce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cible</Label>
                <Select
                  value={newNotif.target_type}
                  onValueChange={(v) => setNewNotif({ ...newNotif, target_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les utilisateurs</SelectItem>
                    <SelectItem value="premium">Utilisateurs Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate}>
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Notification</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Cible</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créée le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.map((notif) => (
              <TableRow key={notif.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{notif.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${typeColors[notif.type]} text-white`}>
                    {typeLabels[notif.type]}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">
                  {notif.target_type === 'all' ? 'Tous' : notif.target_type}
                </TableCell>
                <TableCell>
                  <Badge variant={notif.is_active ? 'default' : 'secondary'}>
                    {notif.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(notif.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(notif.id, notif.is_active)}
                    >
                      {notif.is_active ? (
                        <ToggleRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notif.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {notifications.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucune notification créée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
