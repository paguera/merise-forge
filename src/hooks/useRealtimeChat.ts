import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  project_id: string;
  username: string;
  color: string;
  message: string;
  created_at: string;
}

export function useRealtimeChat(projectId: string | null, username: string, userColor: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch initial messages
  useEffect(() => {
    if (!projectId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as ChatMessage[]);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [projectId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`chat-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [projectId]);

  // Send a message
  const sendMessage = useCallback(async (text: string) => {
    if (!projectId || !username || !text.trim()) return;

    const { error } = await supabase.from('chat_messages').insert({
      project_id: projectId,
      username,
      color: userColor,
      message: text.trim(),
    });

    if (error) {
      console.error('Failed to send message:', error);
    }
  }, [projectId, username, userColor]);

  return {
    messages,
    loading,
    sendMessage,
  };
}
