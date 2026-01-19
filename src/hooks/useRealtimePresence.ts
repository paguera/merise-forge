import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CursorPosition {
  x: number;
  y: number;
}

export interface PresenceUser {
  id: string;
  username: string;
  color: string;
  cursor: CursorPosition | null;
  lastSeen: number;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'
];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useRealtimePresence(projectId: string | null, username: string) {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [myUserId] = useState(() => generateUserId());
  const [myColor] = useState(() => getRandomColor());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const cursorRef = useRef<CursorPosition | null>(null);

  const updateCursor = useCallback((x: number, y: number) => {
    cursorRef.current = { x, y };
    if (channelRef.current && projectId) {
      channelRef.current.track({
        id: myUserId,
        username: username || 'Anonyme',
        color: myColor,
        cursor: cursorRef.current,
        lastSeen: Date.now(),
      });
    }
  }, [projectId, myUserId, username, myColor]);

  useEffect(() => {
    if (!projectId || !username) {
      setUsers([]);
      return;
    }

    const channel = supabase.channel(`presence-${projectId}`, {
      config: {
        presence: {
          key: myUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presentUsers: PresenceUser[] = [];
        
        Object.entries(state).forEach(([_key, presences]) => {
          const presence = (presences as unknown[])[0] as PresenceUser;
          if (presence && presence.id !== myUserId) {
            presentUsers.push(presence);
          }
        });
        
        setUsers(presentUsers);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: myUserId,
            username: username || 'Anonyme',
            color: myColor,
            cursor: null,
            lastSeen: Date.now(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [projectId, myUserId, username, myColor]);

  return {
    users,
    myUserId,
    myColor,
    updateCursor,
  };
}
