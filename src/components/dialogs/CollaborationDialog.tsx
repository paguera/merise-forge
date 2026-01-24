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
import { Users, Wifi, WifiOff, Circle, Wand2, Copy, Check } from 'lucide-react';
import { generateProjectCode } from '@/lib/projectCodeGenerator';
import { toast } from 'sonner';
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
  const [copied, setCopied] = useState(false);

  const handleJoin = () => {
    if (!name.trim() || !user.trim()) return;
    onJoin(name.trim(), user.trim());
    onOpenChange(false);
  };

  const handleGenerateCode = () => {
    const code = generateProjectCode();
    setName(code);
    toast.success('Code de projet généré !');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(name);
    setCopied(true);
    toast.success('Code copié !');
    setTimeout(() => setCopied(false), 2000);
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
              <Label htmlFor="project-name">Code du projet</Label>
              <div className="flex gap-2">
                <Input
                  id="project-name"
                  placeholder="ex: Ressou.Merize-AlphaCore-XY12"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateCode}
                  title="Générer un code"
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
                {name && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    title="Copier le code"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Cliquez sur la baguette pour générer un code unique ou entrez un nom personnalisé
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Collaborateurs en ligne ({allUsers.length})
              </h4>
              <div className="space-y-2">
                {allUsers.map((u) => {
                  const isMe = u.id === 'me';
                  const lastSeenText = !isMe && u.lastSeen 
                    ? `Actif il y a ${Math.max(0, Math.round((Date.now() - u.lastSeen) / 1000))}s`
                    : 'En ligne';
                  
                  return (
                    <div 
                      key={u.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/50"
                    >
                      {/* Avatar avec couleur */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                        style={{ backgroundColor: u.color }}
                      >
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Info utilisateur */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">
                            {u.username}
                          </span>
                          {isMe && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Vous
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Circle 
                            className="w-2 h-2 fill-current animate-pulse" 
                            style={{ color: u.color }} 
                          />
                          {lastSeenText}
                        </div>
                      </div>
                      
                      {/* Indicateur de curseur */}
                      {u.cursor && (
                        <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                          x:{Math.round(u.cursor.x)} y:{Math.round(u.cursor.y)}
                        </div>
                      )}
                    </div>
                  );
                })}
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
