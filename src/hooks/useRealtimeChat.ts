import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound, getMuted } from '@/lib/notificationSound';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  project_id: string;
  username: string;
  color: string;
  message: string;
  created_at: string;
}

export interface ChatReaction {
  id: string;
  message_id: string;
  username: string;
  emoji: string;
  created_at: string;
}

// Check if message contains a mention of the current user
function containsMention(message: string, username: string): boolean {
  if (!username) return false;
  const mentionPattern = new RegExp(`@${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return mentionPattern.test(message);
}

export function useRealtimeChat(projectId: string | null, username: string, userColor: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ChatReaction[]>([]);
  const [loading, setLoading] = useState(false);
  const initialLoadDone = useRef(false);

  // Fetch initial messages and reactions
  useEffect(() => {
    if (!projectId) {
      setMessages([]);
      setReactions([]);
      initialLoadDone.current = false;
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const [messagesRes, reactionsRes] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true })
          .limit(100),
        supabase
          .from('chat_reactions')
          .select('*')
      ]);

      if (!messagesRes.error && messagesRes.data) {
        setMessages(messagesRes.data as ChatMessage[]);
      }
      
      if (!reactionsRes.error && reactionsRes.data) {
        // Filter reactions for messages in this project
        const messageIds = new Set((messagesRes.data || []).map(m => m.id));
        setReactions((reactionsRes.data as ChatReaction[]).filter(r => messageIds.has(r.message_id)));
      }
      
      setLoading(false);
      initialLoadDone.current = true;
    };

    fetchData();
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
          
          // Handle notifications for messages from others, after initial load
          if (initialLoadDone.current && newMessage.username !== username) {
            const isMentioned = containsMention(newMessage.message, username);
            
            if (isMentioned) {
              // Special notification for mentions
              playNotificationSound('mention');
              if (!getMuted()) {
                toast.info(`${newMessage.username} vous a mentionné`, {
                  description: newMessage.message.substring(0, 50) + (newMessage.message.length > 50 ? '...' : ''),
                  duration: 5000,
                });
              }
            } else {
              // Regular message notification
              playNotificationSound('message');
              if (!getMuted()) {
                toast(`💬 ${newMessage.username}`, {
                  description: newMessage.message.substring(0, 50) + (newMessage.message.length > 50 ? '...' : ''),
                  duration: 3000,
                });
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_reactions',
        },
        (payload) => {
          const newReaction = payload.new as ChatReaction;
          setReactions((prev) => [...prev, newReaction]);
          
          // Play sound for reactions from others
          if (initialLoadDone.current && newReaction.username !== username) {
            playNotificationSound('reaction');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_reactions',
        },
        (payload) => {
          const deletedReaction = payload.old as ChatReaction;
          setReactions((prev) => prev.filter(r => r.id !== deletedReaction.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, username]);

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

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!username) return;

    const { error } = await supabase.from('chat_reactions').insert({
      message_id: messageId,
      username,
      emoji,
    });

    if (error && !error.message.includes('duplicate')) {
      console.error('Failed to add reaction:', error);
    }
  }, [username]);

  // Remove reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!username) return;

    const { error } = await supabase
      .from('chat_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('username', username)
      .eq('emoji', emoji);

    if (error) {
      console.error('Failed to remove reaction:', error);
    }
  }, [username]);

  // Toggle reaction
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const existingReaction = reactions.find(
      r => r.message_id === messageId && r.username === username && r.emoji === emoji
    );

    if (existingReaction) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
  }, [reactions, username, addReaction, removeReaction]);

  // Get reactions for a message
  const getReactionsForMessage = useCallback((messageId: string) => {
    return reactions.filter(r => r.message_id === messageId);
  }, [reactions]);

  return {
    messages,
    reactions,
    loading,
    sendMessage,
    toggleReaction,
    getReactionsForMessage,
  };
}
