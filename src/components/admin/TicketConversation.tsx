import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, User, Shield, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { SupportTicket } from '@/hooks/useAdminDashboard';

interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin_response: boolean;
  created_at: string;
}

interface TicketConversationProps {
  ticket: SupportTicket | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<{ error: Error | null }>;
}

export function TicketConversation({ ticket, onClose, onStatusChange }: TicketConversationProps) {
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket) {
      fetchResponses();
    }
  }, [ticket?.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [responses]);

  const fetchResponses = async () => {
    if (!ticket) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('ticket_responses')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching responses:', error);
    } else {
      setResponses(data || []);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!ticket || !message.trim()) return;
    setSending(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: ticket.id,
          user_id: userData.user?.id,
          message: message.trim(),
          is_admin_response: true,
        });

      if (error) throw error;

      // Update ticket status to 'in_progress' or add 'responded' if not already
      if (ticket.status === 'open') {
        await onStatusChange(ticket.id, 'in_progress');
      }

      setMessage('');
      await fetchResponses();
      toast.success('Réponse envoyée');
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      open: { color: 'bg-yellow-500', label: 'Ouvert', icon: <Clock className="w-3 h-3" /> },
      in_progress: { color: 'bg-blue-500', label: 'En cours', icon: <MessageCircle className="w-3 h-3" /> },
      resolved: { color: 'bg-green-500', label: 'Résolu', icon: <CheckCircle className="w-3 h-3" /> },
      closed: { color: 'bg-gray-500', label: 'Fermé', icon: <CheckCircle className="w-3 h-3" /> },
    };

    const config = statusConfig[status] || statusConfig.open;
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (!ticket) {
    return (
      <Card className="neu-card">
        <CardContent className="py-12 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Sélectionnez un ticket pour voir la conversation
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="neu-card flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5 text-primary" />
            {ticket.subject}
          </CardTitle>
          {getStatusBadge(ticket.status)}
        </div>
        <CardDescription className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {ticket.user_email || 'Utilisateur inconnu'} • {formatTime(ticket.created_at)}
        </CardDescription>
      </CardHeader>

      <Separator />

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {/* Original message */}
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="font-medium text-sm">{ticket.user_email?.split('@')[0]}</span>
              <span className="text-xs text-muted-foreground ml-2">{formatTime(ticket.created_at)}</span>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {responses.map((response) => (
              <div
                key={response.id}
                className={`p-3 rounded-lg border ${
                  response.is_admin_response
                    ? 'bg-primary/5 border-primary/20 ml-8'
                    : 'bg-muted/50 border-border/50 mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    response.is_admin_response ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {response.is_admin_response ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className={`font-medium text-sm ${response.is_admin_response ? 'text-primary' : ''}`}>
                      {response.is_admin_response ? 'Support' : 'Utilisateur'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatTime(response.created_at)}
                    </span>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{response.message}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <div className="p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Votre réponse..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="resize-none neu-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="px-6 neu-button-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
