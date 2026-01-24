import { useState } from 'react';
import { FolderOpen, Users, Send, MessageSquare, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Project } from '@/hooks/useAdminDashboard';

interface ProjectsTableProps {
  projects: Project[];
  isSuperAdmin: boolean;
  onSendMessage: (projectId: string, message: string) => Promise<{ error: Error | null }>;
}

// Descriptions des projets Merise pour la compréhension
const MERISE_DESCRIPTIONS: Record<string, string> = {
  default: "Ce projet utilise la méthode Merise pour la modélisation de données. Merise est une méthode d'analyse et de conception des systèmes d'information basée sur le modèle entité-association.",
};

export function ProjectsTable({ projects, isSuperAdmin, onSendMessage }: ProjectsTableProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const handleSendMessage = async () => {
    if (!selectedProject || !message.trim()) return;
    
    setSending(true);
    const { error } = await onSendMessage(selectedProject.id, message);
    setSending(false);

    if (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } else {
      toast.success('Message envoyé au projet');
      setMessage('');
      setMessageDialogOpen(false);
    }
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Projet</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Collaborateurs</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead>Dernière modif.</TableHead>
            {isSuperAdmin && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <span className="font-medium">{project.name}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="text-sm text-muted-foreground truncate">
                  {project.description || MERISE_DESCRIPTIONS.default}
                </p>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {project.collaborator_count || 0}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(project.created_at).toLocaleDateString('fr-FR')}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(project.updated_at).toLocaleDateString('fr-FR')}
              </TableCell>
              {isSuperAdmin && (
                <TableCell>
                  <Dialog open={messageDialogOpen && selectedProject?.id === project.id} onOpenChange={(open) => {
                    setMessageDialogOpen(open);
                    if (open) setSelectedProject(project);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Message
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Envoyer un message au projet</DialogTitle>
                        <DialogDescription>
                          Ce message sera visible par tous les collaborateurs du projet "{project.name}"
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <Textarea
                          placeholder="Votre message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button onClick={handleSendMessage} disabled={sending || !message.trim()}>
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              )}
            </TableRow>
          ))}
          {projects.length === 0 && (
            <TableRow>
              <TableCell colSpan={isSuperAdmin ? 6 : 5} className="text-center text-muted-foreground py-8">
                Aucun projet créé
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
