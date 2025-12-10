import { FolderOpen, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SavedProject {
  name: string;
  savedAt: string;
}

interface LoadProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: SavedProject[];
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
}

export function LoadProjectDialog({ open, onOpenChange, projects, onLoad, onDelete }: LoadProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Charger un projet
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un projet sauvegardé à charger.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px]">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun projet sauvegardé
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      onLoad(project.name);
                      onOpenChange(false);
                    }}
                  >
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Sauvegardé le {new Date(project.savedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project.name);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
