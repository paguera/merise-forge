import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Clock, Edit3, LogIn, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ProjectUserStat } from '@/hooks/useProjectUserStats';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: ProjectUserStat | null;
  isAdmin?: boolean;
}

export function UserStatsModal({ open, onOpenChange, user, isAdmin }: Props) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Statistiques de {user.username}
            {isAdmin && (
              <Badge className="ml-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black border-0 animate-pulse">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4 py-4">
            {/* Connection Count */}
            <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connexions au projet</p>
                <p className="text-2xl font-bold text-foreground">{user.connection_count}</p>
              </div>
            </div>

            {/* Modification Count */}
            <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modifications effectuées</p>
                <p className="text-2xl font-bold text-foreground">{user.modification_count}</p>
              </div>
            </div>

            {/* First Connection */}
            <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Première connexion</p>
                <p className="text-lg font-medium text-foreground">
                  {format(new Date(user.first_connected_at), "PPP 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>

            {/* Last Connection */}
            <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dernière connexion</p>
                <p className="text-lg font-medium text-foreground">
                  {format(new Date(user.last_connected_at), "PPP 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
