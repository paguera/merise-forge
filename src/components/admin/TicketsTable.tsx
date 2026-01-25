import { Ticket, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { SupportTicket } from '@/hooks/useAdminDashboard';

interface TicketsTableProps {
  tickets: SupportTicket[];
  onUpdateStatus: (id: string, status: string) => Promise<{ error: Error | null }>;
  onSelectTicket?: (ticket: SupportTicket) => void;
  selectedTicketId?: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-green-500',
  closed: 'bg-gray-500',
};

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground',
  normal: 'text-foreground',
  high: 'text-orange-500',
  urgent: 'text-destructive',
};

const statusLabels: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const priorityLabels: Record<string, string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
};

export function TicketsTable({ tickets, onUpdateStatus, onSelectTicket, selectedTicketId }: TicketsTableProps) {
  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await onUpdateStatus(id, status);
    if (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    } else {
      toast.success('Statut mis à jour');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sujet</TableHead>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Priorité</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow 
              key={ticket.id} 
              className={`cursor-pointer transition-colors ${selectedTicketId === ticket.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
              onClick={() => onSelectTicket?.(ticket)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-xs">
                      {ticket.message}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{ticket.user_email || 'Inconnu'}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className={`font-medium ${priorityColors[ticket.priority]}`}>
                  {priorityLabels[ticket.priority]}
                </span>
              </TableCell>
              <TableCell>
                <Badge className={`${statusColors[ticket.status]} text-white gap-1`}>
                  {getStatusIcon(ticket.status)}
                  {statusLabels[ticket.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
              </TableCell>
              <TableCell>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => handleStatusChange(ticket.id, v)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Ouvert</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
                    <SelectItem value="closed">Fermé</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
          {tickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Aucun ticket de support
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
