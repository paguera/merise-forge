import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, WifiOff, Circle } from 'lucide-react';
import type { PresenceUser } from '@/hooks/useRealtimePresence';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onJoin: (name: string, username: string) => void;
  connected: boolean;
  projectName: string;
  username: string;
  onLeave: () => void;
  onPush: () => void;
  users: PresenceUser[];
  myColor: string;
}

export function CollaborationDialog({
  open,
  onOpenChange,
  onJoin,
  connected,
  projectName,
  username,
  onLeave,
  onPush,
  users,
  myColor,
}: Props) {
  const [name, setName] = useState('');
  const [user, setUser] = useState('');

  const handleJoin = () => {
    if (!name.trim() || !user.trim()) return;
    onJoin(name.trim(), user.trim());
    onOpenChange(false);
  };

  const allUsers = connected ? [
    { id: 'me', username: `${username} (vous)`, color: myColor, cursor: null, lastSeen: Date.now() },
    ...users
  ] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <DialogTitle>Collaboration temps réel</DialogTitle>
          </div>
          <DialogDescription>
            {connected ? (
              <span className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-accent" />
                Connecté au projet <strong>"{projectName}"</strong> en tant que <strong>{username}</strong>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-muted-foreground" />
                Rejoignez ou créez un projet partagé pour collaborer.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Votre nom d'utilisateur</Label>
              <Input
                id="username"
                placeholder="ex: Jean Dupont"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="border-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-name">Nom du projet</Label>
              <Input
                id="project-name"
                placeholder="ex: mon-schema-db"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Collaborateurs en ligne ({allUsers.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {allUsers.map((u) => (
                  <Badge 
                    key={u.id} 
                    variant="outline" 
                    className="flex items-center gap-2 py-1.5 px-3"
                    style={{ borderColor: u.color }}
                  >
                    <Circle 
                      className="w-2 h-2 fill-current animate-pulse" 
                      style={{ color: u.color }} 
                    />
                    {u.username}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Les modifications sont synchronisées automatiquement
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!connected ? (
            <Button 
              onClick={handleJoin} 
              disabled={!name.trim() || !user.trim()}
              className="w-full sm:w-auto"
            >
              <Users className="w-4 h-4 mr-2" />
              Rejoindre / Créer
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onPush}>
                Forcer sync
              </Button>
              <Button variant="destructive" onClick={onLeave}>
                Quitter le projet
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
