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

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onJoin: (name: string) => void;
  connected: boolean;
  projectName: string;
  onLeave: () => void;
  onPush: () => void;
}

export function CollaborationDialog({
  open,
  onOpenChange,
  onJoin,
  connected,
  projectName,
  onLeave,
  onPush,
}: Props) {
  const [name, setName] = useState('');

  const handleJoin = () => {
    if (!name.trim()) return;
    onJoin(name.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collaboration temps réel</DialogTitle>
          <DialogDescription>
            {connected
              ? `Vous êtes connecté au projet "${projectName}".`
              : 'Rejoignez ou créez un projet partagé pour collaborer.'}
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nom du projet</Label>
              <Input
                id="project-name"
                placeholder="ex: mon-schema"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            Les modifications sont automatiquement synchronisées.
          </p>
        )}

        <DialogFooter>
          {!connected ? (
            <Button onClick={handleJoin}>Rejoindre / Créer</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onPush}>
                Pousser mes modifs
              </Button>
              <Button variant="destructive" onClick={onLeave}>
                Quitter
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
