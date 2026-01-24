import { useState, useEffect } from 'react';
import { MessageSquare, Eye, X, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Project } from '@/hooks/useAdminDashboard';

interface ChatMessage {
  id: string;
  project_id: string;
  username: string;
  color: string;
  message: string;
  created_at: string;
}

interface ProjectChatViewerProps {
  projects: Project[];
  onSendMessage: (projectId: string, message: string) => Promise<{ error: Error | null }>;
}

export function ProjectChatViewer({ projects, onSendMessage }: ProjectChatViewerProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = async (projectId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Erreur lors du chargement des messages');
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedProject) {
      fetchMessages(selectedProject.id);

      // Subscribe to realtime messages
      const channel = supabase
        .channel(`admin-chat-${selectedProject.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `project_id=eq.${selectedProject.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as ChatMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedProject]);

  const handleSendMessage = async () => {
    if (!selectedProject || !message.trim()) return;

    setSending(true);
    const { error } = await onSendMessage(selectedProject.id, message);
    setSending(false);

    if (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } else {
      toast.success('Message envoyé');
      setMessage('');
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Visualisation des Chats de Projets
          </CardTitle>
          <CardDescription>
            Consultez les conversations des projets et envoyez des messages en tant que Super Admin
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
            onClick={() => setSelectedProject(project)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold truncate">{project.name}</h3>
                <Badge variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {project.collaborator_count || 0}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {project.description || 'Projet Merise collaboratif'}
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Eye className="w-4 h-4" />
                Voir le chat
              </Button>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun projet créé</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Chat Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Chat: {selectedProject?.name}
            </DialogTitle>
            <DialogDescription>
              {messages.length} message(s) • Projet créé le{' '}
              {selectedProject && new Date(selectedProject.created_at).toLocaleDateString('fr-FR')}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4 border rounded-lg bg-muted/20">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                Aucun message dans ce projet
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                      style={{ backgroundColor: msg.color }}
                    >
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm" style={{ color: msg.color }}>
                          {msg.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-sm bg-card p-2 rounded-lg break-words">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 pt-2">
            <Textarea
              placeholder="Envoyer un message en tant que Super Admin..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={sending || !message.trim()} className="px-6">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
