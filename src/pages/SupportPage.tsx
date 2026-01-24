import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeLogo } from '@/components/ThemeLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Send, 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface TicketResponse {
  id: string;
  message: string;
  is_admin_response: boolean;
  created_at: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-green-500',
  closed: 'bg-muted',
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

export default function SupportPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // New ticket form
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });

  // Response form
  const [newResponse, setNewResponse] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data);
    }
    setLoading(false);
  };

  const fetchResponses = async (ticketId: string) => {
    const { data, error } = await supabase
      .from('ticket_responses')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setResponses(data);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      subject: newTicket.subject,
      message: newTicket.message,
      priority: newTicket.priority,
      user_id: user?.id,
    });

    if (error) {
      toast.error('Erreur lors de la création du ticket');
    } else {
      toast.success('Ticket créé avec succès');
      setNewTicket({ subject: '', message: '', priority: 'normal' });
      fetchTickets();
    }
    setSubmitting(false);
  };

  const handleSendResponse = async () => {
    if (!newResponse.trim() || !selectedTicket) return;

    setSubmitting(true);
    const { error } = await supabase.from('ticket_responses').insert({
      ticket_id: selectedTicket.id,
      message: newResponse,
      user_id: user?.id,
      is_admin_response: false,
    });

    if (error) {
      toast.error('Erreur lors de l\'envoi de la réponse');
    } else {
      toast.success('Réponse envoyée');
      setNewResponse('');
      fetchResponses(selectedTicket.id);
    }
    setSubmitting(false);
  };

  const selectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    fetchResponses(ticket.id);
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <ThemeLogo className="h-8" />
            <h1 className="text-xl font-semibold hidden md:block">Support</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="w-4 h-4" />
              Mes Tickets
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau Ticket
            </TabsTrigger>
          </TabsList>

          {/* My Tickets */}
          <TabsContent value="tickets">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Tickets List */}
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-semibold mb-4">Historique des tickets</h2>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Ticket className="w-12 h-12 mb-4 opacity-50" />
                      <p>Aucun ticket</p>
                      <p className="text-sm">Créez votre premier ticket de support</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedTicket?.id === ticket.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => selectTicket(ticket)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{ticket.subject}</h3>
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {ticket.message}
                                </p>
                              </div>
                              <Badge className={`${statusColors[ticket.status]} text-white shrink-0 gap-1`}>
                                {getStatusIcon(ticket.status)}
                                {statusLabels[ticket.status]}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                              <span>Priorité: {priorityLabels[ticket.priority]}</span>
                              <span>{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticket Detail / Conversation */}
              <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {selectedTicket ? (
                    <motion.div
                      key={selectedTicket.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <Card className="h-[600px] flex flex-col">
                        <CardHeader className="border-b">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle>{selectedTicket.subject}</CardTitle>
                              <CardDescription className="mt-1">
                                Créé le {new Date(selectedTicket.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </CardDescription>
                            </div>
                            <Badge className={`${statusColors[selectedTicket.status]} text-white`}>
                              {statusLabels[selectedTicket.status]}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                          {/* Original message */}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm font-medium mb-1">Votre demande:</p>
                            <p className="text-muted-foreground">{selectedTicket.message}</p>
                          </div>

                          {/* Responses */}
                          {responses.map((response) => (
                            <motion.div
                              key={response.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`rounded-lg p-4 ${
                                response.is_admin_response 
                                  ? 'bg-primary/10 border border-primary/20' 
                                  : 'bg-muted/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {response.is_admin_response ? 'Support' : 'Vous'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(response.created_at).toLocaleString('fr-FR')}
                                </span>
                              </div>
                              <p className="text-sm">{response.message}</p>
                            </motion.div>
                          ))}
                        </CardContent>

                        {/* Response input */}
                        {selectedTicket.status !== 'closed' && (
                          <div className="border-t p-4">
                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Écrire une réponse..."
                                value={newResponse}
                                onChange={(e) => setNewResponse(e.target.value)}
                                className="min-h-[80px] resize-none"
                              />
                              <Button 
                                onClick={handleSendResponse} 
                                disabled={submitting || !newResponse.trim()}
                                className="self-end"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-[600px] flex items-center justify-center"
                    >
                      <Card className="border-dashed w-full max-w-md">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                          <p className="text-lg font-medium">Sélectionnez un ticket</p>
                          <p className="text-sm">pour voir la conversation</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </TabsContent>

          {/* New Ticket */}
          <TabsContent value="new">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Créer un ticket de support
                </CardTitle>
                <CardDescription>
                  Décrivez votre problème et notre équipe vous répondra dans les plus brefs délais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input
                    id="subject"
                    placeholder="Résumé de votre demande"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre problème en détail..."
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    className="min-h-[200px]"
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleCreateTicket}
                  disabled={submitting}
                >
                  {submitting ? 'Envoi en cours...' : 'Envoyer le ticket'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
