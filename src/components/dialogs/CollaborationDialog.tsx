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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Wifi, WifiOff, Circle, Wand2, Copy, Check, Shield, ChevronRight, AlertCircle, Crown, Eye } from 'lucide-react';
import { generateProjectCode, validateProjectCode } from '@/lib/projectCodeGenerator';
import { toast } from 'sonner';
import { UserStatsModal } from './UserStatsModal';
import type { PresenceUser } from '@/hooks/useRealtimePresence';
import type { ProjectUserStat } from '@/hooks/useProjectUserStats';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onJoin: (name: string, username: string, asGuest?: boolean) => void;
  connected: boolean;
  projectName: string;
  username: string;
  onLeave: () => void;
  onPush: () => void;
  users: PresenceUser[];
  myColor: string;
  creatorId: string | null;
  userStats: ProjectUserStat[];
  isPremium?: boolean;
  onOpenPremium?: () => void;
  isAuthenticated?: boolean;
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
  creatorId,
  userStats,
  isPremium = false,
  onOpenPremium,
  isAuthenticated = false,
}: Props) {
  const [name, setName] = useState('');
  const [user, setUser] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProjectUserStat | null>(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleJoin = (asGuest: boolean = false) => {
    if (!name.trim() || !user.trim()) return;
    
    // Validate project code format
    const validation = validateProjectCode(name.trim());
    if (!validation.valid) {
      setValidationError(validation.message || 'Code projet invalide');
      return;
    }
    
    setValidationError(null);
    onJoin(name.trim(), user.trim(), asGuest);
    onOpenChange(false);
  };

  const handleGenerateCode = () => {
    // Only premium users can generate (create) new project codes
    if (!isPremium) {
      if (onOpenPremium) {
        onOpenPremium();
        onOpenChange(false);
      }
      toast.error('La création de projet est réservée aux utilisateurs Premium');
      return;
    }
    
    const code = generateProjectCode();
    setName(code);
    setValidationError(null);
    toast.success('Code de projet généré !');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(name);
    setCopied(true);
    toast.success('Code copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUserClick = (userStat: ProjectUserStat) => {
    setSelectedUser(userStat);
    setStatsModalOpen(true);
  };

  // Clear validation error when name changes
  const handleNameChange = (value: string) => {
    setName(value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const allUsers = connected ? [
    { id: 'me', username: `${username} (vous)`, color: myColor, cursor: null, lastSeen: Date.now() },
    ...users
  ] : [];

  // Find the admin display name
  const adminDisplayName = creatorId || null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary flex-shrink-0" />
              <DialogTitle className="break-words">Collaboration temps réel</DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="space-y-2">
                {connected ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Wifi className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="break-all">
                      Connecté au projet <strong className="break-all">"{projectName}"</strong> en tant que <strong>{username}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <WifiOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span>Rejoignez ou créez un projet partagé pour collaborer.</span>
                  </div>
                )}
                {connected && adminDisplayName && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-secondary/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">Administrateur :</span>
                    <span className="font-medium text-foreground">{adminDisplayName}</span>
                    <Badge className="admin-badge-gold text-xs font-semibold">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {!connected ? (
              <div className="space-y-4 py-4">
                {/* Authentication required notice */}
                {!isAuthenticated && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Vous devez être connecté pour créer ou rejoindre un projet.</span>
                  </div>
                )}

                {/* Premium required for project creation */}
                {isAuthenticated && !isPremium && (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-sm">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Crown className="w-4 h-4 shrink-0" />
                      <span className="font-medium">La création de projet est réservée aux Premium</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Vous pouvez rejoindre un projet existant avec son code.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Votre nom d'utilisateur</Label>
                  <Input
                    id="username"
                    placeholder="ex: Jean Dupont"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    className="border-primary/30 focus:border-primary"
                    disabled={!isAuthenticated}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-name">Code du projet</Label>
                  <div className="flex gap-2">
                    <Input
                      id="project-name"
                      placeholder="ex: MeriseForge-AlphaCore-XY12"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={`flex-1 ${validationError ? 'border-destructive' : ''}`}
                      disabled={!isAuthenticated}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateCode}
                      title={isPremium ? "Générer un code" : "Premium requis pour créer"}
                      disabled={!isAuthenticated || !isPremium}
                      className={!isPremium ? 'opacity-50' : ''}
                    >
                      {isPremium ? <Wand2 className="w-4 h-4" /> : <Crown className="w-4 h-4 text-amber-500" />}
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
                  {validationError ? (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationError}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {isPremium 
                        ? "Cliquez sur la baguette pour générer un code unique (format: MeriseForge-...)"
                        : "Entrez un code existant pour rejoindre un projet"}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                {/* Online Collaborators */}
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Collaborateurs en ligne ({allUsers.length})
                  </h4>
                  <div className="space-y-2">
                    {allUsers.map((u) => {
                      const isMe = u.id === 'me';
                      const displayUsername = isMe ? username : u.username;
                      const isUserAdmin = displayUsername === creatorId;
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground truncate">
                                {u.username}
                              </span>
                              {isMe && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  Vous
                                </Badge>
                              )}
                              {isUserAdmin && (
                                <Badge className="admin-badge-gold text-xs shrink-0">
                                  <Shield className="w-2.5 h-2.5 mr-0.5" />
                                  Admin
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

                {/* All Users who ever connected */}
                {userStats.length > 0 && (
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Historique des participants ({userStats.length})
                    </h4>
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-2">
                        {userStats.map((stat) => {
                          const isUserAdmin = stat.username === creatorId;
                          return (
                            <button
                              key={stat.id}
                              onClick={() => handleUserClick(stat)}
                              className="w-full flex items-center gap-3 p-2 rounded-lg bg-background/50 border border-border/50 hover:bg-background hover:border-primary/30 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                                {stat.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-foreground truncate text-sm">
                                    {stat.username}
                                  </span>
                                  {isUserAdmin && (
                                    <Badge className="admin-badge-gold text-xs shrink-0 py-0">
                                      <Shield className="w-2.5 h-2.5 mr-0.5" />
                                      Admin
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {stat.connection_count} connexion{stat.connection_count > 1 ? 's' : ''} · {stat.modification_count} modification{stat.modification_count > 1 ? 's' : ''}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Les modifications sont synchronisées automatiquement
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 flex-shrink-0">
            {!connected ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button 
                  variant="outline"
                  onClick={() => handleJoin(true)} 
                  disabled={!name.trim() || !user.trim() || !isAuthenticated}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Rejoindre en invité
                </Button>
                <Button 
                  onClick={() => handleJoin(false)} 
                  disabled={!name.trim() || !user.trim() || !isAuthenticated}
                  className="flex-1"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Rejoindre
                </Button>
              </div>
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

      {/* User Stats Modal */}
      <UserStatsModal
        open={statsModalOpen}
        onOpenChange={setStatsModalOpen}
        user={selectedUser}
        isAdmin={selectedUser?.username === creatorId}
      />
    </>
  );
}
